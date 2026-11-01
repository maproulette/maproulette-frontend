import { useMemo } from 'react'
import { toast } from 'sonner'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'

export const useManageActionErrors = () => {
  const { t } = useIntl()

  return useMemo(() => {
    const report = (logMessage: string, message: string) => (error: unknown) => {
      logger.error(logMessage, { error })
      toast.error(message)
    }

    return {
      challengeDelete: report(
        'Failed to delete challenge',
        t('managementPages.actionErrors.challengeDelete', undefined, 'Unable to delete challenge.')
      ),
      challengeArchive: report(
        'Failed to update challenge archive status',
        t(
          'managementPages.actionErrors.challengeArchive',
          undefined,
          'Unable to update archive status'
        )
      ),
      challengeSave: report(
        'Failed to update challenge',
        t('managementPages.actionErrors.challengeSave', undefined, 'Unable to save your changes.')
      ),
      projectSave: report(
        'Failed to update project',
        t('managementPages.actionErrors.projectSave', undefined, 'Unable to save your changes')
      ),
      projectDelete: report(
        'Failed to delete project',
        t('managementPages.actionErrors.projectDelete', undefined, 'Unable to delete project.')
      ),
    }
  }, [t])
}
