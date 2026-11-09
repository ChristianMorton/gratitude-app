import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { UnauthorizedError } from './auth/session'

/** A failure we're happy to describe to the client. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const notFound = () => new ApiError(404, 'Not found')

/**
 * Wraps a route handler so thrown errors become sensible responses. Anything
 * unrecognised is logged and returned as a bare 500 — never echo an internal
 * message to the client.
 */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<NextResponse>) {
  return async (...args: A): Promise<NextResponse> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
      }
      if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', issues: error.issues.map((i) => i.message) },
          { status: 400 },
        )
      }
      console.error('Unhandled route error:', error)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
  }
}
