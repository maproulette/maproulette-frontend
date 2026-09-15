import type { FieldErrors } from 'react-hook-form'

export interface FlatFieldError {
  /** Dotted path of the field, as react-hook-form names it. */
  name: string
  message: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Flattens react-hook-form's nested error tree into a list of field paths and
 * messages, so a form can restate its errors somewhere the mapper can see them
 * — a long form scrolls the offending field out of view, leaving nothing but a
 * disabled submit button to explain itself.
 *
 * `root` errors are left out: those are form-level (e.g. a failed save) and are
 * already shown on their own.
 */
export const flattenFieldErrors = (errors: FieldErrors, prefix = ''): FlatFieldError[] => {
  const flattened: FlatFieldError[] = []

  for (const [key, value] of Object.entries(errors)) {
    if (!prefix && key === 'root') continue
    if (!isRecord(value)) continue

    const name = prefix ? `${prefix}.${key}` : key

    if (typeof value.message === 'string' && value.message !== '') {
      flattened.push({ name, message: value.message })
      continue
    }

    // An error on a nested field (`priorityRules.0.value`) hangs off the
    // parent rather than carrying a message of its own.
    flattened.push(...flattenFieldErrors(value as FieldErrors, name))
  }

  return flattened
}
