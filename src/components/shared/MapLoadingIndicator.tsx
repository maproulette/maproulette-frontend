import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

interface MapLoadingIndicatorProps {
  isLoading: boolean
  centered?: boolean
}

export const MapLoadingIndicator = ({ isLoading, centered }: MapLoadingIndicatorProps) => {
  const { t } = useIntl()
  if (!isLoading) {
    return null
  }

  return (
    <div
      className={cn(
        'absolute top-4 z-10 rounded bg-white/90 px-3 py-2 text-sm shadow-md dark:bg-slate-900/90',
        centered ? '-translate-x-1/2 left-1/2' : 'left-4'
      )}
    >
      {t({ id: 'shared.mapLoadingIndicator.loading', defaultMessage: 'Loading task markers...' })}
    </div>
  )
}
