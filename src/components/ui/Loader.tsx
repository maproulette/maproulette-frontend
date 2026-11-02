import { Logomark } from '@/components/ui/Logomark'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

export const Loader = ({
  className,
  message,
  isFullScreen = false,
  ...props
}: React.ComponentProps<'div'> & {
  message?: string
  isFullScreen?: boolean
}) => {
  const { t } = useIntl()
  const displayMessage = message ?? t({ id: 'common.loading2', defaultMessage: 'Loading...' })

  return (
    <div
      className={cn(
        { 'flex min-h-svh flex-col items-center justify-center': isFullScreen },
        className
      )}
      {...props}
    >
      <div className="inline-flex items-center gap-2">
        <Logomark isAnimated className="size-8" />
        <p className="font-medium text-base">{displayMessage}</p>
      </div>
    </div>
  )
}
