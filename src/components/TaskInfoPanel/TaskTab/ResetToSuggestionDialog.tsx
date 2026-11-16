import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog'
import { useIntl } from '@/i18n'

/**
 * Confirms a reset back to the challenge's suggestion.
 *
 * The reset takes the whole editing session back, not just the suggested tags,
 * so a mapper who has drawn or moved anything since loses that work — worth
 * asking about, and worth saying plainly.
 */
export const ResetToSuggestionDialog = ({
  open,
  onOpenChange,
  onConfirm,
  editCount,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  editCount: number
}) => {
  const { t } = useIntl()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t({
              id: 'taskInfoPanel.resetToSuggestion.title',
              defaultMessage: "Reset to the challenge's suggestion?",
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              {
                id: 'taskInfoPanel.resetToSuggestion.description',
                defaultMessage:
                  '{count, plural, one {The # unsaved edit in the editor is discarded, and the suggested change goes back to exactly what MapRoulette applied. Nothing already saved to OpenStreetMap is affected.} other {All # unsaved edits in the editor are discarded, and the suggested change goes back to exactly what MapRoulette applied. Nothing already saved to OpenStreetMap is affected.}}',
              },
              { count: editCount }
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
          >
            {t({
              id: 'taskInfoPanel.resetToSuggestion.confirm',
              defaultMessage: 'Discard and reset',
            })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
