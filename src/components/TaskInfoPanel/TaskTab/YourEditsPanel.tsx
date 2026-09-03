import { PencilLine } from 'lucide-react'
import { useOptionalEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import { EntityEditList } from '@/components/shared/EntityEditList'
import { useIntl } from '@/i18n'

/**
 * What the mapper currently has pending in the editor, shown alongside the
 * task rather than only behind the unsaved-changes button.
 *
 * This is the editor's own state — every element they have touched, whether or
 * not the challenge suggested it — as opposed to the suggested-changes panel,
 * which lists what the challenge asked for whether or not it happened.
 */
export const YourEditsPanel = () => {
  const { t } = useIntl()
  const editor = useOptionalEditorContext()

  // Nothing to say when the editor was never opened, or nothing is pending.
  if (!editor?.idEditorMounted || editor.pendingEdits.length === 0) return null

  return (
    <section className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-slate-700">
      <div className="flex items-center gap-2">
        <PencilLine className="size-4 text-amber-500" aria-hidden="true" />
        <h3 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
          {t('taskInfoPanel.yourEdits.title', undefined, 'Your unsaved edits')}
        </h3>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {t(
          'taskInfoPanel.yourEdits.description',
          undefined,
          'Everything currently pending in the editor. Save from the editor to send it to OpenStreetMap.'
        )}
      </p>

      <EntityEditList edits={editor.pendingEdits} />
    </section>
  )
}
