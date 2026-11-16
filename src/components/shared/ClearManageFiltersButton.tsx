import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'

interface ClearManageFiltersButtonProps {
  hasActiveFilters: boolean
  onClear: () => void
}

export const ClearManageFiltersButton = ({
  hasActiveFilters,
  onClear,
}: ClearManageFiltersButtonProps) => {
  const { t } = useIntl()
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClear}
      className="shrink-0 gap-2 rounded-full px-3 font-normal text-zinc-700 dark:text-slate-300"
      disabled={!hasActiveFilters}
    >
      <X className="h-4 w-4" />
      {t({ id: 'shared.clearManageFiltersButton.label', defaultMessage: 'Clear filters' })}
    </Button>
  )
}
