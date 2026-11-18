import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/Popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

interface Props {
  icon: LucideIcon
  label: string
  /** Nudge text, put in a callout while the description is still unread. */
  recommendationLabel?: string
  recommended?: boolean
  disabled?: boolean
  /** Reason the button is unavailable, shown in the tooltip instead of the label. */
  disabledReason?: string
  onClick: () => void
}

/**
 * The round button beside a breadcrumb name that opens that description in the panel.
 *
 * While the description is still unread (the mapper never passed the challenge page) the
 * button glows to keep drawing the eye, and a callout explains why. The callout is not a
 * hover tooltip: it opens on arrival and stays until the mapper closes it or reads the
 * description, so it can't be missed by never hovering.
 */
export const DescriptionBreadcrumbButton = ({
  icon: Icon,
  label,
  recommendationLabel,
  recommended = false,
  disabled = false,
  disabledReason,
  onClick,
}: Props) => {
  const { t } = useIntl()
  const [calloutOpen, setCalloutOpen] = useState(false)

  useEffect(() => {
    setCalloutOpen(recommended)
  }, [recommended])

  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={disabled ? (disabledReason ?? label) : label}
      className={cn(
        'relative inline-flex size-5 items-center justify-center rounded-full border transition-colors',
        disabled
          ? 'cursor-not-allowed border-line text-fg-subtle opacity-50'
          : 'cursor-pointer border-line-strong text-fg-muted hover:border-accent hover:text-link',
        recommended && !disabled && 'border-accent bg-accent/10 text-link ring-2 ring-accent/40'
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
    </button>
  )

  // Unread: highlighted button plus a callout the mapper has to dismiss themselves.
  if (recommended && !disabled) {
    return (
      <Popover open={calloutOpen}>
        <PopoverAnchor asChild>{button}</PopoverAnchor>
        <PopoverContent
          side="bottom"
          align="start"
          aria-label={label}
          className="w-80 p-3"
          // Stays put until it's closed deliberately, and never steals focus on arrival.
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="flex items-start gap-2">
            <p className="text-fg text-sm">{recommendationLabel}</p>
            <button
              type="button"
              onClick={() => setCalloutOpen(false)}
              aria-label={t({ id: 'common.close', defaultMessage: 'Close' })}
              className="-mr-1 -mt-1 shrink-0 cursor-pointer rounded-sm p-1 text-fg-subtle transition-colors hover:text-fg"
            >
              <X className="size-4" />
            </button>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Read already (or nothing to read): an ordinary button with an ordinary tooltip.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{button}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="max-w-xs">
        {disabled ? disabledReason : label}
      </TooltipContent>
    </Tooltip>
  )
}
