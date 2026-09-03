import { PencilLine, RotateCcw } from 'lucide-react'
import { useOptionalEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import { DocsLink } from '@/components/shared/DocsLink'
import { EntityEditList } from '@/components/shared/EntityEditList'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { isTagFixTask } from '@/lib/cooperativeWork'
import type { Task } from '@/types/Task'

/**
 * What the mapper currently has pending in the editor.
 *
 * For a tag-fix task this includes the tags MapRoulette applied on their
 * behalf, so there is one list rather than a suggestion sitting next to a
 * near-identical set of edits. When the elements no longer look the way the
 * challenge suggested — undone, mistyped, or edited further — a reset puts
 * them back.
 */
export const EditorChangesPanel = ({ task }: { task: Task }) => {
  const { t } = useIntl()
  const editor = useOptionalEditorContext()
  const isTagFix = isTagFixTask(task)

  if (!editor?.idEditorMounted) return null

  const { pendingEdits, divergedTagFixCount, resetTagFixesRef } = editor
  const hasDiverged = divergedTagFixCount > 0

  if (pendingEdits.length === 0) return null

  return (
    <section className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-slate-700">
      <div className="flex items-center gap-2">
        <PencilLine className="size-4 text-amber-500" aria-hidden="true" />
        <h3 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
          {t('taskInfoPanel.editorChanges.title', undefined, 'Your unsaved edits')}
        </h3>
        {isTagFix && (
          <DocsLink
            page="tagFixChallenges"
            label={t('taskInfoPanel.editorChanges.docsLink', undefined, 'About tag fix challenges')}
            className="ml-auto text-zinc-400 no-underline hover:text-zinc-600"
          />
        )}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {isTagFix
          ? t(
              'taskInfoPanel.editorChanges.tagFixDescription',
              undefined,
              "The challenge's suggested tags were applied for you and are included below. Save from the editor to send everything to OpenStreetMap."
            )
          : t(
              'taskInfoPanel.editorChanges.description',
              undefined,
              'Everything currently pending in the editor. Save from the editor to send it to OpenStreetMap.'
            )}
      </p>

      {/* Always offered on a tag-fix task, not only once something has
          diverged — a control that appears only when you have already made a
          mess is a control nobody finds. */}
      {isTagFix && (
        <div
          className={`flex flex-wrap items-center gap-2 rounded border px-2 py-1.5 ${
            hasDiverged
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-zinc-200 dark:border-slate-700'
          }`}
        >
          <p className="min-w-0 flex-1 text-xs text-zinc-600 dark:text-zinc-300">
            {hasDiverged
              ? t(
                  'taskInfoPanel.editorChanges.diverged',
                  { count: divergedTagFixCount },
                  '{count, plural, one {# element no longer matches} other {# elements no longer match}} what the challenge suggests.'
                )
              : t(
                  'taskInfoPanel.editorChanges.matches',
                  undefined,
                  'These elements match what the challenge suggests.'
                )}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!hasDiverged}
            onClick={() => resetTagFixesRef.current?.()}
            title={
              hasDiverged
                ? t(
                    'taskInfoPanel.editorChanges.resetTitle',
                    undefined,
                    'Discard your changes to these elements and restore the suggested tags'
                  )
                : t(
                    'taskInfoPanel.editorChanges.resetDisabledTitle',
                    undefined,
                    'Nothing to reset — these elements already carry the suggested tags'
                  )
            }
          >
            <RotateCcw className="size-3.5" />
            {t('taskInfoPanel.editorChanges.reset', undefined, 'Reset')}
          </Button>
        </div>
      )}

      <EntityEditList edits={pendingEdits} />
    </section>
  )
}
