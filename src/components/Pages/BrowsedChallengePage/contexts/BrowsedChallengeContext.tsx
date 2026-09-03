import { useLoaderData } from '@tanstack/react-router'
import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { api } from '@/api'
import { useAuthContext } from '@/contexts/AuthContext'
import { canManageChallenge } from '@/lib/challengePermissions'
import { formatLongDate } from '@/lib/date'
import type { Challenge } from '@/types/Challenge'
import type { ChallengeReport } from '@/types/ChallengeReport'
import type { User } from '@/types/User'

type BrowsedChallengeContextType = {
  challenge: Challenge
  user: User | undefined
  isFavorited?: boolean
  isLiked?: boolean
  canClone?: boolean
  canManage?: boolean
  projectId?: number
  projectName?: string | null
  ownerName?: string
  formattedDate?: string | null
  hasOverpass?: boolean
  /**
   * The current user's own still-open report on this challenge, if they filed
   * one. Reports are private to super admins, so this deliberately says nothing
   * about reports other people may have filed.
   */
  openReport: ChallengeReport | null | undefined
  isCheckingReport: boolean
}

const BrowsedChallengeContext = createContext<BrowsedChallengeContextType | undefined>(undefined)

export const BrowsedChallengeProvider = ({ children }: { children: ReactNode }) => {
  const { challenge } = useLoaderData({ from: '/_app/challenge/$challengeId/' })
  const { user } = useAuthContext()

  const { data: favoriteData } = api.challenge.isChallengeFavorited(challenge.id ?? 0)

  const { data: likeData } = api.challenge.isChallengeLiked(challenge.id ?? 0)

  const { data: managedProjects } = api.project.getManagedProjects({
    limit: 1,
    page: 0,
    onlyEnabled: false,
    onlyOwned: false,
    searchString: '',
  })

  const { data: projectData } = api.project.getProject(challenge.parent)

  const { data: ownerData } = api.user.getPublicUser(challenge.owner)

  const projectName = projectData?.displayName || projectData?.name

  const formattedDate = challenge.created ? formatLongDate(new Date(challenge.created)) : null
  const hasOverpass = !!challenge.overpassQL
  const canManage = canManageChallenge(user, challenge)

  // Only the reporter's own open report -- enough to tell them a report is
  // already pending without exposing anyone else's.
  const { data: openReport, isLoading: isCheckingReport } = api.challenge.myOpenReport(
    challenge.id,
    !!user
  )

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo<BrowsedChallengeContextType>(
    () => ({
      challenge,
      user,
      isFavorited: favoriteData?.isFavorited,
      isLiked: likeData?.isLiked,
      canClone: !!user && managedProjects && managedProjects.length > 0,
      canManage,
      projectId: challenge.parent,
      projectName,
      ownerName: ownerData?.osmProfile?.displayName,
      formattedDate,
      hasOverpass,
      openReport,
      isCheckingReport,
    }),
    [
      challenge,
      user,
      favoriteData?.isFavorited,
      likeData?.isLiked,
      managedProjects,
      canManage,
      projectName,
      ownerData?.osmProfile?.displayName,
      formattedDate,
      hasOverpass,
      openReport,
      isCheckingReport,
    ]
  )

  return (
    <BrowsedChallengeContext.Provider value={value}>{children}</BrowsedChallengeContext.Provider>
  )
}

export const useBrowsedChallengeContext = () => {
  const context = useContext(BrowsedChallengeContext)

  if (context === undefined) {
    throw new Error('useBrowsedChallenge must be used within a BrowsedChallengeProvider')
  }

  return context
}
