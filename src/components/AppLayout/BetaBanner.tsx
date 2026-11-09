import { useIntl } from '@/i18n'
import { DismissibleBanner } from './DismissibleBanner'

export const BetaBanner = () => {
  const { t } = useIntl()
  return (
    <DismissibleBanner storageKey="mr-beta-banner-dismissed">
      {t({
        id: 'appLayout.betaBanner.message',
        defaultMessage:
          'This is a beta version of MapRoulette and is actively being worked on. Some features may be incomplete or unavailable.',
      })}
    </DismissibleBanner>
  )
}
