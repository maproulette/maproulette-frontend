import { useQueries } from '@tanstack/react-query'
import { PencilLine, RotateCcw, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import { useOptionalEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import { DocsLink } from '@/components/shared/DocsLink'
import { EntityEditList } from '@/components/shared/EntityEditList'
import { Button } from '@/components/ui/Button'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import { useIntl } from '@/i18n'
import { tagFixes } from '@/lib/cooperativeWork'
import type { Task } from '@/types/Task'
import { ResetToSuggestionDialog } from './ResetToSuggestionDialog'
import { SuggestedChangesList } from './SuggestedChangesList'

/**
 * What the mapper currently has pending in the editor.
 *
 * For a tag-fix task this includes the tags MapRoulette applied on their
 * behalf, so there is one list rather than a suggestion sitting next to a
 * near-identical set of edits. When they have gone on to change things —
 * undone the suggestion, retyped a value, moved or drawn geometry — a reset
 * puts the editor back to the suggestion as it was applied.
 */
export const EditorChangesPanel = ({ task }: { task: Task }) => {
  const { t } = useIntl()
  const editor = useOptionalEditorContext()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const fixes = tagFixes(task)
  const isTagFix = fixes.length > 0

  // Current tags for the elements a tag fix names, so the suggestion can be
  // shown as a real before/after before the editor is even open.
  const elementQueries = useQueries({
    queries: fixes.map((fix) => api.osm.elementOptions(fix.elementId)),
  })

  const pendingEdits = editor?.pendingEdits ?? []
  const editorOpen = !!editor?.idEditorMounted
  // Only meaningful once MapRoulette has actually applied the suggestion:
  // until then there is no state for a reset to go back to.
  const suggestionApplied = !!editor?.suggestionApplied
  const hasDiverged = !!editor?.editsDivergeFromSuggestion
  // Before the editor has anything pending there is nothing of the mapper's to
  // show, so a tag-fix task falls back to what the challenge is asking for.
  const showingSuggestion = pendingEdits.length === 0

  if (showingSuggestion && !isTagFix) return null

  return (
    <section className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-slate-700">
      <div className="flex items-center gap-2">
        {showingSuggestion ? (
          <Wand2 className="size-4 text-amber-500" aria-hidden="true" />
        ) : (
          <PencilLine className="size-4 text-amber-500" aria-hidden="true" />
        )}
        <h3 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
          {showingSuggestion
            ? t('taskInfoPanel.editorChanges.suggestionTitle', undefined, 'Suggested tag changes')
            : t('taskInfoPanel.editorChanges.title', undefined, 'Your unsaved edits')}
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
        {showingSuggestion
          ? t(
              'taskInfoPanel.editorChanges.suggestionDescription',
              undefined,
              'What this challenge suggests changing. Opening the editor applies it for you to review.'
            )
          : isTagFix
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

      {/* Always offered once the suggestion has been applied, not only after
          something has diverged from it — a control that appears only once you
          have made a mess is a control nobody finds. */}
      {isTagFix && editorOpen && !showingSuggestion && suggestionApplied && (
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
                  undefined,
                  "You have edited since the challenge's suggestion was applied."
                )
              : t(
                  'taskInfoPanel.editorChanges.matches',
                  undefined,
                  "The editor holds the challenge's suggestion and nothing else."
                )}
          </p>
          <DisabledTooltip
            show={!hasDiverged}
            message={t(
              'taskInfoPanel.editorChanges.resetDisabledTitle',
              undefined,
              'Nothing to reset — the editor already holds exactly what the challenge suggests'
            )}
          >
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={!hasDiverged}
              onClick={() => setConfirmingReset(true)}
              title={t(
                'taskInfoPanel.editorChanges.resetTitle',
                undefined,
                "Discard everything unsaved and go back to the challenge's suggestion"
              )}
            >
              <RotateCcw className="size-3.5" />
              {t('taskInfoPanel.editorChanges.reset', undefined, 'Reset')}
            </Button>
          </DisabledTooltip>
        </div>
      )}

      <ResetToSuggestionDialog
        open={confirmingReset}
        onOpenChange={setConfirmingReset}
        editCount={pendingEdits.length}
        onConfirm={() => editor?.resetToSuggestionRef.current?.()}
      />

      {showingSuggestion ? (
        <SuggestedChangesList fixes={fixes} elementTags={elementQueries.map((q) => q.data)} />
      ) : (
        <EntityEditList edits={pendingEdits} />
      )}
    </section>
  )
}
