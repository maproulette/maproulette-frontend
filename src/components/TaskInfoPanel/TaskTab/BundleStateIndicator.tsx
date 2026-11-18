import { Package, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'

interface BundleStateIndicatorProps {
  canAddToBundle: boolean
  isAddingToBundle?: boolean
  canRemoveFromBundle: boolean
  isInBundle: boolean
  onAddToBundle?: () => void
  onRemoveFromBundle?: () => void
}

export const BundleStateIndicator = ({
  canAddToBundle,
  isAddingToBundle = false,
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
        disabled={isAddingToBundle}
        variant="outline"
        size="sm"
        className="w-full border-accent/50 bg-accent/10 text-link transition-all hover:border-accent hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Package className="mr-2 h-3.5 w-3.5" />
        {isAddingToBundle
          ? t({
              id: 'taskInfoPanel.taskTab.bundleState.addingToBundle',
              defaultMessage: 'Locking task...',
            })
          : t({
              id: 'taskInfoPanel.taskTab.bundleState.addToBundle',
              defaultMessage: 'Add to Bundle',
            })}
      </Button>
    )
  }

  if (canRemoveFromBundle && onRemoveFromBundle) {
    return (
      <Button
        onClick={onRemoveFromBundle}
        variant="outline"
        size="sm"
        className="w-full border-danger/50 bg-danger/10 text-danger transition-all hover:border-danger hover:bg-danger/20"
      >
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        {t({
          id: 'taskInfoPanel.taskTab.bundleState.removeFromBundle',
          defaultMessage: 'Remove from Bundle',
        })}
      </Button>
    )
  }

  if (isInBundle) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 font-medium text-fg-muted text-xs">
        <Package className="h-3.5 w-3.5" />
        {t({ id: 'taskInfoPanel.taskTab.bundleState.inBundle', defaultMessage: 'In bundle' })}
      </div>
    )
  }

  return null
}
