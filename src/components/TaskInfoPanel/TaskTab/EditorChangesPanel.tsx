import { useQueries } from '@tanstack/react-query'
import { PencilLine, RotateCcw, Wand2 } from 'lucide-react'
import { api } from '@/api'
import { useOptionalEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import { DocsLink } from '@/components/shared/DocsLink'
import { EntityEditList } from '@/components/shared/EntityEditList'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { tagFixes } from '@/lib/cooperativeWork'
import type { Task } from '@/types/Task'
import { SuggestedChangesList } from './SuggestedChangesList'

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
  const fixes = tagFixes(task)
  const isTagFix = fixes.length > 0

  // Current tags for the elements a tag fix names, so the suggestion can be
  // shown as a real before/after before the editor is even open.
  const elementQueries = useQueries({
    queries: fixes.map((fix) => ({
      queryKey: ['osm', 'element', fix.elementId],
      queryFn: () => api.osm.fetchOSMElement(fix.elementId),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  })

  const pendingEdits = editor?.pendingEdits ?? []
  const editorOpen = !!editor?.idEditorMounted
  const hasDiverged = (editor?.divergedTagFixCount ?? 0) > 0
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

      {/* Always offered on a tag-fix task once the editor is open, not only
          when something has diverged — a control that appears only after you
          have made a mess is a control nobody finds. */}
      {isTagFix && editorOpen && !showingSuggestion && (
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
                  { count: editor?.divergedTagFixCount ?? 0 },
                  '{count, plural, one {# element no longer matches what the challenge suggests.} other {# elements no longer match what the challenge suggests.}}'
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
            onClick={() => editor?.resetTagFixesRef.current?.()}
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

      {showingSuggestion ? (
        <SuggestedChangesList fixes={fixes} elementTags={elementQueries.map((q) => q.data)} />
      ) : (
        <EntityEditList edits={pendingEdits} />
      )}
    </section>
  )
}
