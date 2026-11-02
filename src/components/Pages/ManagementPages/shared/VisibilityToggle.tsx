import { useId } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/Switch'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'

interface Props {
  id: number
  enabled: boolean
  onToggle: (id: number, enabled: boolean) => Promise<unknown>
  label?: string
  disabled?: boolean
  errorMessage?: string
}

export const VisibilityToggle = ({
  id,
  enabled,
  onToggle,
  label,
  disabled,
  errorMessage,
}: Props) => {
  const { t } = useIntl()
  const switchId = useId()
  const resolvedErrorMessage =
    errorMessage ?? t({ id: 'common.couldNotUpdateVisibility', defaultMessage: 'Could not update visibility' })
  const handleChange = async (checked: boolean) => {
    try {
      await onToggle(id, checked)
    } catch (error) {
      logger.error('Toggle visibility failed', { error })
      toast.error(resolvedErrorMessage)
    }
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <Switch
        id={switchId}
        checked={enabled}
        onCheckedChange={handleChange}
        disabled={disabled}
        aria-label={label}
      />
      {label && (
        <label htmlFor={switchId} className="cursor-pointer">
          {label}
        </label>
      )}
    </span>
  )
}
