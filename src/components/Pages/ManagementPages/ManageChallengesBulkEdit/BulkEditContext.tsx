import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useSetPageTitle } from '@/contexts/ChromeContext'
import { useIntl } from '@/i18n'
import { getErrorMessage } from '@/lib/apiError'
import { logger } from '@/lib/logger'
import type { Challenge } from '@/types/Challenge'
import {
  type BulkEditValues,
  buildChallengeBulkUpdate,
  buildPriorityUpdate,
  changedBulkEditFields,
} from './bulkEditPayload'

interface BulkEditFailure {
  savedNames: string[]
  failedName: string
  message: string
}

interface BulkEditContextValue {
  projectId: number
  projectName: string | undefined
  challenges: Challenge[]
  isLoading: boolean
  removeChallenge: (challengeId: number) => void
  progress: { saved: number; total: number } | null
  failure: BulkEditFailure | null
  save: (values: BulkEditValues) => Promise<void>
  cancel: () => void
}

const BulkEditContext = createContext<BulkEditContextValue | undefined>(undefined)

export const useBulkEditContext = () => {
  const context = useContext(BulkEditContext)
  if (!context) {
    throw new Error('useBulkEditContext must be used within BulkEditProvider')
  }
  return context
}

export const BulkEditProvider = ({
  projectId,
  challengeIds,
  children,
}: {
  projectId: number
  challengeIds: number[]
  children: ReactNode
}) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: project, isLoading: isLoadingProject } = api.project.getProject(projectId)
  const { data: projectChallenges, isLoading: isLoadingChallenges } =
    api.project.getProjectChallenges(projectId)
  const removeKeywords = api.challenge.useRemoveChallengeKeywords()
  const updatePriorities = api.challenge.useUpdatePriorities()
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [failure, setFailure] = useState<BulkEditFailure | null>(null)

  const projectName = project?.displayName || project?.name
  useSetPageTitle(projectName ?? null)

  const challenges = useMemo(() => {
    const selected = new Set(challengeIds)
    return (projectChallenges ?? []).filter((challenge) => selected.has(challenge.id))
  }, [projectChallenges, challengeIds])

  const removeChallenge = useCallback(
    (challengeId: number) => {
      navigate({
        to: '/manage/project/$projectId/challenges/bulk-edit',
        params: { projectId: String(projectId) },
        search: { challengeIds: challengeIds.filter((id) => id !== challengeId) },
        replace: true,
      })
    },
    [navigate, projectId, challengeIds]
  )

  const cancel = useCallback(() => {
    navigate({ to: '/manage/project/$projectId', params: { projectId: String(projectId) } })
  }, [navigate, projectId])

  const save = useCallback(
    async (values: BulkEditValues) => {
      const fields = new Set(changedBulkEditFields(values))
      const saved: Challenge[] = []
      let current = challenges[0]
      setFailure(null)
      setSavedCount(0)

      try {
        const tagsById = fields.has('additionalKeywords')
          ? await api.challenge.fetchChallengeTagsBatch(challenges.map(({ id }) => id))
          : {}

        for (const challenge of challenges) {
          current = challenge
          const keywords = (tagsById[String(challenge.id)] ?? []).map(({ name }) => name)
          const { updates, removedKeywords } = buildChallengeBulkUpdate(values, keywords, fields)

          const updated =
            Object.keys(updates).length > 0
              ? await api.challenge.putChallenge(challenge.id, updates)
              : undefined
          if (removedKeywords.length > 0) {
            await removeKeywords.mutateAsync({
              challengeId: challenge.id,
              keywords: removedKeywords,
            })
          }
          if (fields.has('priorities')) {
            const latest =
              updated ??
              (await queryClient.fetchQuery({
                ...api.challenge.getChallengeOptions(challenge.id),
                staleTime: 0,
              }))
            await updatePriorities.mutateAsync({
              challengeId: challenge.id,
              priorities: buildPriorityUpdate(values.priorities, latest),
            })
          }

          saved.push(challenge)
          setSavedCount(saved.length)
        }
      } catch (error) {
        logger.error('Bulk challenge edit failed', { challengeId: current?.id, error })
        setSavedCount(null)
        setFailure({
          savedNames: saved.map(({ name }) => name),
          failedName: current?.name ?? '',
          message: await getErrorMessage(
            error,
            t({
              id: 'manageChallengesBulkEdit.context.saveError',
              defaultMessage: 'The challenge could not be saved.',
            })
          ),
        })
        return
      } finally {
        if (saved.length > 0) {
          api.challenge.invalidateChallengeListings(queryClient)
          for (const { id } of saved) {
            void queryClient.invalidateQueries({ queryKey: ['challenge', id] })
          }
        }
      }

      setSavedCount(null)
      toast.success(
        t(
          {
            id: 'manageChallengesBulkEdit.context.saveSuccess',
            defaultMessage:
              '{count, plural, one {Updated # challenge} other {Updated # challenges}}',
          },
          { count: saved.length }
        )
      )
      cancel()
    },
    [challenges, queryClient, removeKeywords, updatePriorities, t, cancel]
  )

  const value = useMemo<BulkEditContextValue>(
    () => ({
      projectId,
      projectName,
      challenges,
      isLoading: isLoadingProject || isLoadingChallenges,
      removeChallenge,
      progress: savedCount === null ? null : { saved: savedCount, total: challenges.length },
      failure,
      save,
      cancel,
    }),
    [
      projectId,
      projectName,
      challenges,
      isLoadingProject,
      isLoadingChallenges,
      removeChallenge,
      savedCount,
      failure,
      save,
      cancel,
    ]
  )

  return <BulkEditContext.Provider value={value}>{children}</BulkEditContext.Provider>
}
