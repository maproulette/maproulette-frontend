import { useLoaderData } from '@tanstack/react-router'
import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { api } from '@/api'
import { useAuthContext } from '@/contexts/AuthContext'
import { canManageChallenge } from '@/lib/challengePermissions'
import { formatLongDate } from '@/lib/date'
import type { Challenge } from '@/types/Challenge'
import { type ChallengeReport, isOpenReport } from '@/types/ChallengeReport'
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
  /**
   * The team that owns this challenge, if one does. A team-owned challenge is
   * credited to the team rather than to the person who created it.
   */
  ownerTeamId?: number
  ownerTeamName?: string
  formattedDate?: string | null
  hasOverpass?: boolean
  /**
   * Whether anyone has an open report against this challenge, which is what the
   * footer notice announces. Reports are public: filing one also posts a
   * challenge comment naming the reporter and quoting what they wrote.
   */
  hasOpenReport: boolean
  /**
   * The current user's own still-open report, if they filed one. Only used to
   * keep them from filing a second one on top of it.
   */
  openReport: ChallengeReport | undefined
  isCheckingReport: boolean
}

const BrowsedChallengeContext = createContext<BrowsedChallengeContextType | undefined>(undefined)

export const BrowsedChallengeProvider = ({ children }: { children: ReactNode }) => {
  const { challenge: loadedChallenge } = useLoaderData({ from: '/_app/challenge/$challengeId/' })
  // The loader is typed from the OpenAPI spec, which doesn't declare every field
  // the backend writes (see the notes on `Challenge`), so read it through the
  // augmented type rather than the generated one.
  const challenge: Challenge = loadedChallenge
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

  // A team-owned challenge is the team's work, so the byline credits the team
  // instead of whoever happened to create it.
  const ownerTeamId = challenge.ownerTeamId ?? undefined
  const { data: ownerTeam } = api.team.get(ownerTeamId)

  const projectName = projectData?.displayName || projectData?.name

  const formattedDate = challenge.created ? formatLongDate(new Date(challenge.created)) : null
  const hasOverpass = !!challenge.overpassQL
  const canManage = canManageChallenge(user, challenge)

  // One listing answers both questions the page asks about reports: whether the
  // challenge has been reported at all, and whether this reader is the one who
  // reported it and so should not be invited to file another.
  const { data: reports, isLoading: isCheckingReport } = api.challenge.forChallenge(challenge.id)
  const openReports = useMemo(() => (reports ?? []).filter(isOpenReport), [reports])
  const hasOpenReport = openReports.length > 0
  const openReport = openReports.find((report) => !!user && report.reporterId === user.id)

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
      ownerTeamId,
      ownerTeamName: ownerTeam?.name,
      formattedDate,
      hasOverpass,
      hasOpenReport,
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
      ownerTeamId,
      ownerTeam?.name,
      formattedDate,
      hasOverpass,
      hasOpenReport,
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
