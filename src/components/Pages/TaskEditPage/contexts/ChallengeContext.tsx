import { useLoaderData } from '@tanstack/react-router'
import { createContext, type ReactNode, useContext, useMemo } from 'react'
import type { Challenge } from '@/types/Challenge'

type ChallengeContextType = {
  challenge: Challenge
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined)

export const ChallengeProvider = ({ children }: { children: ReactNode }) => {
  const { challenge } = useLoaderData({ from: '/_app/tasks/$taskId/' })

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo(() => ({ challenge }), [challenge])

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>
}

export const useChallengeContext = () => {
  const context = useContext(ChallengeContext)

  if (context === undefined) {
    throw new Error('useChallenge must be used within a ChallengeProvider')
  }

  return context
}
