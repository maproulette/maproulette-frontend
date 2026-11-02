import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

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
      size="sm"
      onClick={onClear}
      className={cn(
        'h-6 gap-1 rounded-full bg-cyan-600 px-2.5 font-semibold text-black text-xs hover:bg-cyan-500 dark:bg-cyan-700 dark:text-white dark:hover:bg-cyan-600',
        !hasActiveFilters && 'cursor-not-allowed opacity-50'
      )}
      disabled={!hasActiveFilters}
    >
      <X className="h-3 w-3" />
      {t({ id: 'shared.clearManageFiltersButton.label', defaultMessage: 'CLEAR FILTERS' })}
    </Button>
  )
}
