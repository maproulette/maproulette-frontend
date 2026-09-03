import { useIntl } from '@/i18n'
import type { TagFix } from '@/lib/cooperativeWork'
import { type TagChange, tagChanges, tagsFromOsmElement } from '@/lib/tagDiff'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<TagChange['status'], string> = {
  added: 'border-green-500/40 bg-green-500/10',
  changed: 'border-amber-500/40 bg-amber-500/10',
  removed: 'border-red-500/40 bg-red-500/10',
}

/**
 * What a tag-fix challenge proposes, before the editor has applied it.
 *
 * Differences are shown against each element's current tags in OpenStreetMap,
 * so a suggestion the element already satisfies isn't presented as a change.
 */
export const SuggestedChangesList = ({
  fixes,
  elementTags,
}: {
  fixes: TagFix[]
  /** Current OSM element for each fix, in the same order; undefined while loading. */
  elementTags: unknown[]
}) => {
  const { t } = useIntl()

  const label: Record<TagChange['status'], string> = {
    added: t('taskInfoPanel.suggested.add', undefined, 'add'),
    changed: t('taskInfoPanel.suggested.change', undefined, 'change'),
    removed: t('taskInfoPanel.suggested.remove', undefined, 'remove'),
  }

  return (
    <div className="space-y-3">
      {fixes.map((fix, index) => {
        const current = elementTags[index]
        // Until the element's tags are known the proposal can only be stated
        // as-is; claiming "changed from X" without knowing X would be a guess.
        const changes = current
          ? tagChanges(tagsFromOsmElement(current), fix)
          : Object.entries(fix.setTags)
              .map(([key, to]): TagChange => ({ key, from: null, to, status: 'added' }))
              .concat(
                fix.unsetTags.map(
                  (key): TagChange => ({ key, from: null, to: null, status: 'removed' })
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
                  'taskInfoPanel.suggested.alreadyApplied',
                  undefined,
                  'This element already carries the suggested tags.'
                )}
              </p>
            ) : (
              <ul className="space-y-1">
                {changes.map((change) => (
                  <li
                    key={`${change.key}-${change.status}`}
                    className={cn(
                      'flex flex-wrap items-baseline gap-x-2 rounded border px-2 py-1.5',
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
                          'font-mono text-xs line-through',
                          change.status === 'removed'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-zinc-500 dark:text-zinc-400'
                        )}
                      >
                        {change.from}
                      </code>
                    )}
                    {change.to !== null && (
                      <code className="font-mono text-green-700 text-xs dark:text-green-400">
                        {change.to}
                      </code>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
