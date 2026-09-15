import { Package, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'

interface BundleStateIndicatorProps {
  canAddToBundle: boolean
  canRemoveFromBundle: boolean
  isInBundle: boolean
  onAddToBundle?: () => void
  onRemoveFromBundle?: () => void
}

export const BundleStateIndicator = ({
  canAddToBundle,
  canRemoveFromBundle,
  isInBundle,
  onAddToBundle,
  onRemoveFromBundle,
}: BundleStateIndicatorProps) => {
  const { t } = useIntl()

  if (canAddToBundle && onAddToBundle) {
    return (
      <Button
        onClick={onAddToBundle}
        variant="outline"
        size="sm"
        className="w-full border-green-500/50 bg-green-50 text-green-700 shadow-sm transition-all hover:border-green-500 hover:bg-green-100 hover:shadow-md dark:border-green-600/50 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50"
      >
        <Package className="mr-2 h-3.5 w-3.5" />
        {t('taskInfoPanel.taskTab.bundleState.addToBundle', undefined, 'Add to Bundle')}
      </Button>
    )
  }

  if (canRemoveFromBundle && onRemoveFromBundle) {
    return (
      <Button
        onClick={onRemoveFromBundle}
        variant="outline"
        size="sm"
        className="w-full border-red-500/50 bg-red-50 text-red-700 shadow-sm transition-all hover:border-red-500 hover:bg-red-100 hover:shadow-md dark:border-red-600/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
      >
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        {t('taskInfoPanel.taskTab.bundleState.removeFromBundle', undefined, 'Remove from Bundle')}
      </Button>
    )
  }

  if (isInBundle) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 font-medium text-xs text-zinc-600 dark:bg-slate-800/50 dark:text-slate-400">
        <Package className="h-3.5 w-3.5" />
        {t('taskInfoPanel.taskTab.bundleState.inBundle', undefined, 'In bundle')}
      </div>
    )
  }

  return null
}
