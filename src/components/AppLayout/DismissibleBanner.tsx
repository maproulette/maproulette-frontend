import { Info, X } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useIntl } from '@/i18n'

interface Props {
  /** Called when the banner is dismissed, for persisting it server-side. */
  onDismiss?: () => void
  children: ReactNode
}

export const DismissibleBanner = ({ onDismiss, children }: Props) => {
  const { t } = useIntl()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    onDismiss?.()
    setDismissed(true)
  }

  return (
    <div className="mx-3 mt-3 flex items-center gap-3 rounded-lg border border-highlight/40 bg-highlight/10 py-2 pr-2 pl-3 text-fg text-sm md:mx-5">
      <Info className="size-4 shrink-0 text-highlight" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded p-1 text-fg-muted transition-colors hover:bg-highlight/15 hover:text-fg"
        aria-label={t({
          id: 'appLayout.dismissibleBanner.dismiss',
          defaultMessage: 'Dismiss banner',
        })}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
