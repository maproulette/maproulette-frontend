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
        t({
          id: 'managementPages.actionErrors.challengeDelete',
          defaultMessage: 'Unable to delete challenge.',
        })
      ),
      challengeArchive: report(
        'Failed to update challenge archive status',
        t({
          id: 'managementPages.actionErrors.challengeArchive',
          defaultMessage: 'Unable to update archive status',
        })
      ),
      challengeSave: report(
        'Failed to update challenge',
        t({
          id: 'managementPages.actionErrors.challengeSave',
          defaultMessage: 'Unable to save your changes.',
        })
      ),
      projectSave: report(
        'Failed to update project',
        t({
          id: 'managementPages.actionErrors.projectSave',
          defaultMessage: 'Unable to save your changes',
        })
      ),
      projectDelete: report(
        'Failed to delete project',
        t({
          id: 'managementPages.actionErrors.projectDelete',
          defaultMessage: 'Unable to delete project.',
        })
      ),
    }
  }, [t])
}
