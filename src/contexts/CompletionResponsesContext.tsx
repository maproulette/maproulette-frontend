import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'

export type CompletionResponses = Record<string, unknown>

interface CompletionResponsesContextValue {
  responses: CompletionResponses
  setResponse: (name: string, value: unknown) => void
}

const CompletionResponsesContext = createContext<CompletionResponsesContextValue | null>(null)

/** Parse the responses the backend stores as a JSON string on the task. */
export const parseCompletionResponses = (raw: string | null | undefined): CompletionResponses => {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Answers a mapper has given to the form fields embedded in a challenge's task
 * instructions, held here because the fields render in the task info panel but
 * are submitted from the task completion modal.
 */
export const CompletionResponsesProvider = ({
  initial,
  children,
}: {
  /** Responses already stored on the task, as the backend's JSON string. */
  initial?: string | null
  children: ReactNode
}) => {
  const [responses, setResponses] = useState<CompletionResponses>(() =>
    parseCompletionResponses(initial)
  )

  const setResponse = useCallback((name: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [name]: value }))
  }, [])

  const value = useMemo(() => ({ responses, setResponse }), [responses, setResponse])

  return (
    <CompletionResponsesContext.Provider value={value}>
      {children}
    </CompletionResponsesContext.Provider>
  )
}

/**
 * Null outside a provider — instructions also render in read-only places (a
 * management preview, for instance) where there is nothing to submit.
 */
export const useCompletionResponses = () => useContext(CompletionResponsesContext)
