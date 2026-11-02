import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { api } from '@/api'
import type { ChallengeFormValues } from '@/components/Pages/ManagementPages/ManageChallengeNew/ChallengeForm'
import { isChallengeSourceEditable } from '@/components/Pages/ManagementPages/ManageChallengeNew/challengeFormSchema'
import {
  buildCloneFormValues,
  clonedChallengeSettings,
} from '@/components/Pages/ManagementPages/ManageChallengeNew/cloneChallenge'
import { buildChallengeSubmission } from '@/contexts/challengeSubmission'
import { useIntl } from '@/i18n'
import type { Challenge } from '@/types/Challenge'

interface ChallengeFormContextType {
  challenge?: Challenge
  initialValues?: ChallengeFormValues
  projectId?: number
  isLoading: boolean
  onSubmit: (values: ChallengeFormValues) => Promise<void>
  onCancel: () => void
}

const ChallengeFormContext = createContext<ChallengeFormContextType | undefined>(undefined)

export const CreateChallengeFormProvider = ({
  children,
  projectId,
  cloneFromChallengeId,
}: {
  children: ReactNode
  projectId?: number
  cloneFromChallengeId?: number
}) => {
  const navigate = useNavigate()
  const { t } = useIntl()
  const { data: cloneSource, isLoading: isLoadingCloneSource } = api.challenge.getChallenge(
    cloneFromChallengeId ?? 0
  )
  const initialValues = useMemo(
    () => (cloneSource ? buildCloneFormValues(cloneSource, projectId) : undefined),
    [cloneSource, projectId]
  )
  const createChallengeMutation = api.challenge.useCreateChallenge()
  const uploadGeoJSONMutation = api.challenge.useUploadGeoJSON()
  const deleteChallengeMutation = api.challenge.useDeleteChallenge()

  const onSubmit = useCallback(
    async (values: ChallengeFormValues) => {
      const selectedProjectId = values.projectId
      if (!selectedProjectId) {
        throw new Error(
          t({ id: 'challengeForm.errors.projectIdRequired', defaultMessage: 'Project ID is required to create a challenge' }
          )
        )
      }

      const { challengeData, localGeoJSONUpload } = await buildChallengeSubmission(
        values,
        true,
        true,
        cloneSource
      )

      const newChallenge = await createChallengeMutation.mutateAsync({
        projectId: selectedProjectId,
        challengeData: cloneSource
          ? { ...clonedChallengeSettings(cloneSource), ...challengeData }
          : challengeData,
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
    [
      createChallengeMutation,
      deleteChallengeMutation,
      navigate,
      uploadGeoJSONMutation,
      t,
      cloneSource,
    ]
  )

  const onCancel = useCallback(() => {
    if (projectId) {
      navigate({ to: '/manage/project/$projectId', params: { projectId: projectId.toString() } })
    } else {
      navigate({ to: '/manage/challenges' })
    }
  }, [navigate, projectId])

  const value = useMemo<ChallengeFormContextType>(
    () => ({ initialValues, projectId, isLoading: isLoadingCloneSource, onSubmit, onCancel }),
    [initialValues, projectId, isLoadingCloneSource, onSubmit, onCancel]
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
  const removeKeywordsMutation = api.challenge.useRemoveChallengeKeywords()
  const uploadGeoJSONMutation = api.challenge.useUploadGeoJSON()

  const onSubmit = useCallback(
    async (values: ChallengeFormValues) => {
      const { challengeData, localGeoJSONUpload } = await buildChallengeSubmission(
        values,
        false,
        isChallengeSourceEditable(challenge),
        challenge
      )

      const removedKeywords = ((challenge as Challenge | undefined)?.tags ?? []).filter(
        (keyword) => keyword !== '' && !(challengeData.tags ?? []).includes(keyword)
      )
      if (removedKeywords.length > 0) {
        await removeKeywordsMutation.mutateAsync({ challengeId, keywords: removedKeywords })
      }

      await updateChallengeMutation.mutateAsync({
        challengeId,
        updates: challengeData,
      })

      if (localGeoJSONUpload) {
        await uploadGeoJSONMutation.mutateAsync({
          challengeId,
          geoJSONFile: localGeoJSONUpload.file,
          options: {
            lineByLine: localGeoJSONUpload.lineByLine,
            dataOriginDate: localGeoJSONUpload.dataOriginDate,
          },
        })
      }

      navigate({
        to: '/manage/challenge/$challengeId',
        params: { challengeId: String(challengeId) },
      })
    },
    [
      challenge,
      challengeId,
      navigate,
      removeKeywordsMutation,
      updateChallengeMutation,
      uploadGeoJSONMutation,
    ]
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
