import { cloneElement, isValidElement, type ComponentProps } from 'react'

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ComponentProps<'button'> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    ghost: 'bg-transparent text-foreground border border-border hover:bg-muted',
    danger: 'bg-transparent text-destructive border border-destructive/40 hover:bg-destructive/10',
  }
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
        'transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Sized by input device, not viewport: a touchscreen laptop needs a thumb-
        // sized target at 1440px, and a narrow desktop window doesn't at 390px.
        'pointer-coarse:min-h-11',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-input bg-card px-3 py-2 text-sm',
        'placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        'pointer-coarse:min-h-11',
        className,
      )}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  // Explicit label association: a generated id on the control, `htmlFor` on a
  // separate <label>, and the control as a *sibling* of the label rather than
  // wrapped inside it.
  //
  // The old form wrapped the input inside the <label> with no id at all. That's
  // valid HTML and types fine on its own — but it's the structure password
  // managers handle worst. LastPass and Firefox's own autofill find fields by id
  // and inject an overlay into them; an unidentified input inside a label that
  // also holds the label text and a hint is exactly what makes that overlay land
  // wrong and the field feel unresponsive. This is the shape they're tuned for.
  // The id is derived from the label rather than useId(): a hook would force this
  // shared component (and `cn`, which server components import) into a client
  // boundary, and every form here has one field per label anyway. Deterministic,
  // so server and client render the same id with no hydration mismatch.
  const derivedId = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
  const hintId = hint ? `${derivedId}-hint` : undefined

  const control =
    isValidElement<{ id?: string; 'aria-describedby'?: string }>(children) &&
    children.props.id === undefined
      ? cloneElement(children, { id: derivedId, 'aria-describedby': hintId })
      : children
  const controlId = (isValidElement<{ id?: string }>(children) && children.props.id) || derivedId

  return (
    <div className="space-y-1.5">
      <label htmlFor={controlId} className="block text-sm font-medium">
        {label}
      </label>
      {control}
      {hint && (
        <span id={hintId} className="block text-xs text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  )
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </p>
  )
}
