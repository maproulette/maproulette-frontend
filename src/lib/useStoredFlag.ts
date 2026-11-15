import { useCallback, useState } from 'react'

const read = (key: string, fallback: boolean): boolean => {
  try {
    const stored = localStorage.getItem(key)
    return stored === null ? fallback : stored === 'true'
  } catch {
    return fallback
  }
}

/**
 * A boolean preference, saved in localStorage
 */
export const useStoredFlag = (key: string, fallback: boolean) => {
  const [value, setValue] = useState(() => read(key, fallback))

  const set = useCallback(
    (next: boolean) => {
      setValue(next)
      try {
        localStorage.setItem(key, String(next))
      } catch {
        // localStorage can throw (e.g. in a private window); in this
        // situation we just don't persist the setting
      }
    },
    [key]
  )

  return [value, set] as const
}
