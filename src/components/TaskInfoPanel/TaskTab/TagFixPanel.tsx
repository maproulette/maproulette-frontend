import { useQueries } from '@tanstack/react-query'
import { ArrowRight, Wand2 } from 'lucide-react'
import { api } from '@/api'
import { DocsLink } from '@/components/shared/DocsLink'
import { useIntl } from '@/i18n'
import { tagFixes } from '@/lib/cooperativeWork'
import { type TagChange, tagChanges, tagsFromOsmElement } from '@/lib/tagDiff'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/Task'

const STATUS_STYLES: Record<TagChange['status'], string> = {
  added: 'border-green-500/40 bg-green-500/10',
  changed: 'border-amber-500/40 bg-amber-500/10',
  removed: 'border-red-500/40 bg-red-500/10',
}

const TagChangeRow = ({ change }: { change: TagChange }) => {
  const { t } = useIntl()
  const label: Record<TagChange['status'], string> = {
    added: t('taskInfoPanel.tagFix.added', undefined, 'add'),
    changed: t('taskInfoPanel.tagFix.changed', undefined, 'change'),
    removed: t('taskInfoPanel.tagFix.removed', undefined, 'remove'),
  }

  return (
    <li
      className={cn(
        'flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded border px-2 py-1.5',
        STATUS_STYLES[change.status]
      )}
    >
      <span className="font-medium text-[10px] text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
        {label[change.status]}
      </span>
      <code className="font-mono text-xs">{change.key}</code>
      {change.from !== null && (
        <code
          className={cn(
            'font-mono text-xs',
            change.status === 'removed'
              ? 'text-red-600 line-through dark:text-red-400'
              : 'text-zinc-500 line-through dark:text-zinc-400'
          )}
        >
          {change.from}
        </code>
      )}
      {change.from !== null && change.to !== null && (
        <ArrowRight className="size-3 shrink-0 text-zinc-400" aria-hidden="true" />
      )}
      {change.to !== null && (
        <code className="font-mono text-green-700 text-xs dark:text-green-400">{change.to}</code>
      )}
    </li>
  )
}

/**
 * What a Tag Fix challenge proposes to change on this task's OSM elements.
 *
 * The editor applies these for the mapper, which leaves them looking at a full
 * tag list with no indication of which entries came from the challenge — so
 * the change itself is spelled out here, against the element's current tags in
 * OpenStreetMap.
 */
export const TagFixPanel = ({ task }: { task: Task }) => {
  const { t } = useIntl()
  const fixes = tagFixes(task)

  const elementQueries = useQueries({
    queries: fixes.map((fix) => ({
      queryKey: ['osm', 'element', fix.elementId],
      queryFn: () => api.osm.fetchOSMElement(fix.elementId),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  })

  if (fixes.length === 0) return null

  return (
    <section className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-slate-700">
      <div className="flex items-center gap-2">
        <Wand2 className="size-4 text-amber-500" aria-hidden="true" />
        <h3 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
          {t('taskInfoPanel.tagFix.title', undefined, 'Suggested tag changes')}
        </h3>
        <DocsLink
          page="tagFixChallenges"
          label={t('taskInfoPanel.tagFix.docsLink', undefined, 'About tag fix challenges')}
          className="ml-auto text-zinc-400 no-underline hover:text-zinc-600"
        />
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {t(
          'taskInfoPanel.tagFix.description',
          undefined,
          'Applied for you in the editor. Review them there before saving — you can change or undo any of them.'
        )}
      </p>

      {fixes.map((fix, index) => {
        const query = elementQueries[index]
        const currentTags = query?.data ? tagsFromOsmElement(query.data) : null
        // Until the element's current tags are known, the proposal can only be
        // stated as-is; claiming "changed from X" without knowing X would be a
        // guess.
        const changes = currentTags
          ? tagChanges(currentTags, fix)
          : Object.entries(fix.setTags)
              .map(([key, to]): TagChange => ({ key, from: null, to, status: 'added' }))
              .concat(
                fix.unsetTags.map(
                  (key): TagChange => ({
                    key,
                    from: null,
                    to: null,
                    status: 'removed',
                  })
                )
              )

        return (
          <div key={fix.elementId} className="space-y-1.5">
            <code className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {fix.elementId}
            </code>
            {changes.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t(
                  'taskInfoPanel.tagFix.alreadyApplied',
                  undefined,
                  'This element already carries the suggested tags.'
                )}
              </p>
            ) : (
              <ul className="space-y-1">
                {changes.map((change) => (
                  <TagChangeRow key={`${change.key}-${change.status}`} change={change} />
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </section>
  )
}
