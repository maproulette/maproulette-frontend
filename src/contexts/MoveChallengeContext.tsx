import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '@/api'

interface MoveChallengeTarget {
  id: number
  name: string
}

interface MoveChallengeContextType {
  challenge: MoveChallengeTarget | null
  currentProjectId: number
  isOpen: boolean
  openMoveModal: (challenge: MoveChallengeTarget) => void
  closeMoveModal: () => void
  moveChallengeTo: (toProjectId: number) => void
  isPending: boolean
  isError: boolean
}

const MoveChallengeContext = createContext<MoveChallengeContextType | undefined>(undefined)

interface MoveChallengeProviderProps {
  currentProjectId: number
  onMoved?: () => void
  children: ReactNode
}

export const MoveChallengeProvider = ({
  currentProjectId,
  onMoved,
  children,
}: MoveChallengeProviderProps) => {
  const [challenge, setChallenge] = useState<MoveChallengeTarget | null>(null)
  const moveChallenge = api.challenge.useMoveChallenge()

  const openMoveModal = useCallback((target: MoveChallengeTarget) => {
    setChallenge(target)
  }, [])

  const closeMoveModal = useCallback(() => {
    setChallenge(null)
  }, [])

  const moveChallengeTo = useCallback(
    (toProjectId: number) => {
      if (!challenge) return
      moveChallenge.mutate(
        { challengeId: challenge.id, toProjectId },
        {
          onSuccess: () => {
            setChallenge(null)
            onMoved?.()
          },
        }
      )
    },
    [challenge, moveChallenge, onMoved]
  )

  const value = useMemo<MoveChallengeContextType>(
    () => ({
      challenge,
      currentProjectId,
      isOpen: challenge !== null,
      openMoveModal,
      closeMoveModal,
      moveChallengeTo,
      isPending: moveChallenge.isPending,
      isError: moveChallenge.isError,
    }),
    [
      challenge,
      currentProjectId,
      openMoveModal,
      closeMoveModal,
      moveChallengeTo,
      moveChallenge.isPending,
      moveChallenge.isError,
    ]
  )

  return <MoveChallengeContext.Provider value={value}>{children}</MoveChallengeContext.Provider>
}

export const useMoveChallengeContext = () => {
  const context = useContext(MoveChallengeContext)
  if (!context) {
    throw new Error('useMoveChallengeContext must be used within a MoveChallengeProvider')
  }
  return context
}
