import { useLoaderData } from '@tanstack/react-router'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api } from '@/api'
import { useAuthContext } from '@/contexts/AuthContext'
import { canManageChallenge } from '@/lib/challengePermissions'
import { formatLongDate } from '@/lib/date'
import { logger } from '@/lib/logger'
import type { Challenge } from '@/types/Challenge'
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
  existingIssue: { html_url: string } | null
  isCheckingIssue: boolean
  isFlaggingActive: boolean
  checkForIssue: () => Promise<void>
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

  const [existingIssue, setExistingIssue] = useState<{ html_url: string } | null>(null)
  const [isCheckingIssue, setIsCheckingIssue] = useState(false)

  const isFlaggingActive =
    !!window.env.VITE_GITHUB_ISSUES_API_OWNER &&
    !!window.env.VITE_GITHUB_ISSUES_API_REPO &&
    !!window.env.VITE_GITHUB_ISSUES_API_TOKEN

  // Reason: used as dependency in useEffect below and stored in context value
  const checkForIssue = useCallback(async () => {
    const owner = window.env.VITE_GITHUB_ISSUES_API_OWNER
    const repo = window.env.VITE_GITHUB_ISSUES_API_REPO

    if (!owner || !repo || !challenge.id || !isFlaggingActive) {
      setExistingIssue(null)
      return
    }

    setIsCheckingIssue(true)
    try {
      const query = `q='Reported+Challenge+${encodeURIComponent('#') + challenge.id}'+in:title+state:open+repo:${owner}/${repo}`
      const url = `https://api.github.com/search/issues?${query}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.text-match+json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.total_count > 0 && data.items && data.items.length > 0) {
          setExistingIssue(data.items[0])
        } else {
          setExistingIssue(null)
        }
      } else {
        logger.error('Failed to check for issues', {
          status: response.status,
          statusText: response.statusText,
        })
        setExistingIssue(null)
      }
    } catch (error) {
      logger.error('Error checking for existing issue', { error: String(error) })
      setExistingIssue(null)
    } finally {
      setIsCheckingIssue(false)
    }
  }, [challenge.id, isFlaggingActive])

  useEffect(() => {
    if (challenge.id && isFlaggingActive) {
      checkForIssue()
    } else {
      setExistingIssue(null)
    }
  }, [challenge.id, isFlaggingActive, checkForIssue])

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
      existingIssue,
      isCheckingIssue,
      isFlaggingActive,
      checkForIssue,
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
      existingIssue,
      isCheckingIssue,
      isFlaggingActive,
      checkForIssue,
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
