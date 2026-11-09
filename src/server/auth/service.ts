import { z } from 'zod'
import { ApiError } from '@/server/http'
import { supabaseAdmin, supabaseServer } from '@/server/supabase/server'
import type { Viewer } from './session'

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers and underscores'),
  displayName: z.string().min(1, 'Display name is required').max(60),
  email: z.email('Enter a valid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Enter your username or email'),
  password: z.string().min(1, 'Enter your password'),
})

/**
 * Supabase Auth signs in with an email address. This app has always accepted a
 * username or an email, and people know their username.
 *
 * Resolving one to the other needs the secret key: you are not signed in yet, so
 * no RLS policy could let you read that mapping. It is deliberately the
 * narrowest query available — one username in, one email out — and its result
 * must never reach the caller, or it becomes an oracle for "does this username
 * exist" and "what address is behind it".
 */
async function resolveEmail(identifier: string): Promise<string | null> {
  const value = identifier.trim()
  if (value.includes('@')) return value.toLowerCase()

  const admin = supabaseAdmin()
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id')
    .ilike('username', value)
    .maybeSingle()

  // supabase-js reports failure in `error`, it does not throw. Ignoring it makes
  // a permission problem indistinguishable from "no such user" — which is
  // exactly how a missing service_role grant turned every username sign-in into
  // "Incorrect username or password" with nothing in the logs to explain it.
  if (error) throw new Error(`username lookup failed: ${error.message}`)
  if (!profile) return null

  const { data } = await admin.auth.admin.getUserById(profile.id)
  return data?.user?.email ?? null
}

export async function register(input: z.infer<typeof registerSchema>): Promise<Viewer> {
  const username = input.username.trim()
  const displayName = input.displayName.trim()
  const email = input.email.trim().toLowerCase()

  // Check the username before creating anything, so the common failure costs
  // nothing and reads the way it always has. The unique index below is the real
  // guarantee — this is only here to fail early and cheaply.
  const { data: clash, error: clashError } = await supabaseAdmin()
    .from('profiles')
    .select('username')
    .ilike('username', username)
    .maybeSingle()
  if (clashError) throw new Error(`username check failed: ${clashError.message}`)
  if (clash) throw new ApiError(409, 'That username is taken')

  const supabase = await supabaseServer()
  const { data: signUp, error: signUpError } = await supabase.auth.signUp({ email, password: input.password })

  if (signUpError || !signUp.user) {
    // Supabase says "User already registered"; this app has always been
    // specific about which field is at fault.
    if (signUpError?.code === 'user_already_exists') {
      throw new ApiError(409, 'An account with that email already exists')
    }
    throw new ApiError(400, signUpError?.message ?? 'Could not create your account')
  }

  // signUp leaves us signed in, so this insert satisfies the profiles policy
  // (`with check (auth.uid() = id)`) with no elevation needed.
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: signUp.user.id, username, display_name: displayName })

  if (profileError) {
    // An auth user with no profile is someone who can sign in and be nobody.
    // Undo it rather than leave the account half-made; losing a race on the
    // username is the likeliest way to arrive here.
    await supabaseAdmin().auth.admin.deleteUser(signUp.user.id)
    await supabase.auth.signOut()
    if (profileError.code === '23505') throw new ApiError(409, 'That username is taken')
    throw new ApiError(400, 'Could not create your account')
  }

  return { id: signUp.user.id, username, displayName, email }
}

export async function login(input: z.infer<typeof loginSchema>): Promise<Viewer> {
  // Same message whether the account is missing or the password is wrong: an
  // attacker learns nothing from the copy either way.
  const wrong = new ApiError(401, 'Incorrect username or password')

  const email = await resolveEmail(input.identifier)
  if (!email) throw wrong

  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: input.password })
  if (error || !data.user) throw wrong

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', data.user.id)
    .maybeSingle()
  if (!profile) throw wrong

  return {
    id: data.user.id,
    username: profile.username,
    displayName: profile.display_name,
    email: data.user.email ?? email,
  }
}
