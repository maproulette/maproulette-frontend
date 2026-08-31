import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { api } from '@/api'
import type { ChallengeFormValues } from '@/components/Pages/ManagementPages/ManageChallengeNew/ChallengeForm'
import { buildChallengeSubmission } from '@/contexts/challengeSubmission'
import { useIntl } from '@/i18n'
import type { Challenge } from '@/types/Challenge'

interface ChallengeFormContextType {
  challenge?: Challenge
  projectId?: number
  isLoading: boolean
  onSubmit: (values: ChallengeFormValues) => Promise<void>
  onCancel: () => void
}

const ChallengeFormContext = createContext<ChallengeFormContextType | undefined>(undefined)

export const CreateChallengeFormProvider = ({
  children,
  projectId,
}: {
  children: ReactNode
  projectId?: number
}) => {
  const navigate = useNavigate()
  const { t } = useIntl()
  const createChallengeMutation = api.challenge.useCreateChallenge()
  const uploadGeoJSONMutation = api.challenge.useUploadGeoJSON()
  const deleteChallengeMutation = api.challenge.useDeleteChallenge()

  const onSubmit = useCallback(
    async (values: ChallengeFormValues) => {
      const selectedProjectId = values.projectId
      if (!selectedProjectId) {
        throw new Error(
          t(
            'challengeForm.errors.projectIdRequired',
            undefined,
            'Project ID is required to create a challenge'
          )
        )
      }

      const { challengeData, localGeoJSONUpload } = await buildChallengeSubmission(values, true)

      const newChallenge = await createChallengeMutation.mutateAsync({
        projectId: selectedProjectId,
        challengeData,
      })

      if (newChallenge.id && localGeoJSONUpload) {
        try {
          await uploadGeoJSONMutation.mutateAsync({
            challengeId: newChallenge.id,
            geoJSONFile: localGeoJSONUpload.file,
            options: {
              lineByLine: localGeoJSONUpload.lineByLine,
              dataOriginDate: localGeoJSONUpload.dataOriginDate,
            },
          })
        } catch (error) {
          await deleteChallengeMutation.mutateAsync(newChallenge.id).catch((cleanupError) => {
            console.error(
              `Failed to delete challenge ${newChallenge.id} after task upload failure`,
              cleanupError
            )
          })
          throw error
        }
      }

      if (newChallenge.id) {
        navigate({
          to: '/manage/challenge/$challengeId',
          params: { challengeId: String(newChallenge.id) },
        })
      } else {
        navigate({
          to: '/manage/project/$projectId',
          params: { projectId: selectedProjectId.toString() },
        })
      }
    },
    [createChallengeMutation, deleteChallengeMutation, navigate, uploadGeoJSONMutation, t]
  )

  const onCancel = useCallback(() => {
    if (projectId) {
      navigate({ to: '/manage/project/$projectId', params: { projectId: projectId.toString() } })
    } else {
      navigate({ to: '/manage/challenges' })
    }
  }, [navigate, projectId])

  const value = useMemo<ChallengeFormContextType>(
    () => ({ projectId, isLoading: false, onSubmit, onCancel }),
    [projectId, onSubmit, onCancel]
  )

  return <ChallengeFormContext.Provider value={value}>{children}</ChallengeFormContext.Provider>
}

export const EditChallengeFormProvider = ({
  children,
  challengeId,
}: {
  children: ReactNode
  challengeId: number
}) => {
  const navigate = useNavigate()
  const { data: challenge, isLoading } = api.challenge.getChallenge(challengeId)
  const updateChallengeMutation = api.challenge.useUpdateChallenge()

  const onSubmit = useCallback(
    async (values: ChallengeFormValues) => {
      const { challengeData } = await buildChallengeSubmission(values, false)

      await updateChallengeMutation.mutateAsync({
        challengeId,
        updates: challengeData,
      })

      navigate({
        to: '/manage/challenge/$challengeId',
        params: { challengeId: String(challengeId) },
      })
    },
    [challengeId, navigate, updateChallengeMutation]
  )

  const onCancel = useCallback(() => {
    navigate({
      to: '/manage/challenge/$challengeId',
      params: { challengeId: String(challengeId) },
    })
  }, [challengeId, navigate])

  const value = useMemo<ChallengeFormContextType>(
    () => ({
      challenge,
      projectId: challenge?.parent,
      isLoading,
      onSubmit,
      onCancel,
    }),
    [challenge, isLoading, onSubmit, onCancel]
  )

  return <ChallengeFormContext.Provider value={value}>{children}</ChallengeFormContext.Provider>
}

export const useChallengeFormContext = () => {
  const context = useContext(ChallengeFormContext)
  if (!context) {
    throw new Error('useChallengeFormContext must be used within a ChallengeFormProvider')
  }
  return context
}
