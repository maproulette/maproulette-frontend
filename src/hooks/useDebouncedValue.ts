import { useEffect, useState } from 'react'

export const SEARCH_DEBOUNCE_MS = 300

export const useDebouncedValue = <T>(value: T, delay = SEARCH_DEBOUNCE_MS): T => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}
