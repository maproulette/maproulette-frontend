import { useCallback, useState } from 'react'
import type { z } from 'zod'

/** A value persisted in browser storage */
export interface Stored<T> {
  get(): T
  set(value: T): void
}

// This map stores values when writes to localStorage or sessionStorage fails,
// so that they still persist for the rest of the page lifetime (instead of
// breaking the app).
const unsaved = new Map<string, string>()

const stored =
  (area: 'localStorage' | 'sessionStorage') =>
  <T>(name: string, schema: z.ZodType<T>, fallback: T): Stored<T> => {
    // namespace all keys to avoid collisions (e.g. with embedded iD editor)
    const key = `mr.${name}`
    const id = `${area}:${key}`

    return {
      get() {
        try {
          const raw = unsaved.get(id) ?? window[area].getItem(key)
          if (raw === null) return fallback
          const result = schema.safeParse(JSON.parse(raw))
          return result.success ? result.data : fallback
        } catch {
          return fallback
        }
      },
      set(value) {
        const raw = JSON.stringify(value)
        try {
          window[area].setItem(key, raw)
          unsaved.delete(id)
        } catch {
          unsaved.set(id, raw)
        }
      },
    }
  }

export const localStored = stored('localStorage')

export const sessionStored = stored('sessionStorage')

export const useStored = <T>(store: Stored<T>) => {
  const [value, setValue] = useState(store.get)
  const set = useCallback(
    (next: T) => {
      store.set(next)
      setValue(next)
    },
    [store]
  )
  return [value, set] as const
}
