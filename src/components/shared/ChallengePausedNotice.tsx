import { PauseCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { useIntl } from '@/i18n'

export const ChallengePausedNotice = ({ message }: { message?: string }) => {
  const { t } = useIntl()

  return (
    <Alert variant="warning">
      <PauseCircle />
      <AlertTitle>{t('common.challengePausedTitle', undefined, 'Challenge Paused')}</AlertTitle>
      <AlertDescription>
        {message ??
          t('common.challengePausedDescription', undefined, 'This challenge is currently paused.')}
      </AlertDescription>
    </Alert>
  )
}
