import { Keyboard } from 'lucide-react'
import { useMemo } from 'react'
import {
  type KeyboardShortcut,
  useKeyboardShortcuts,
} from '@/components/Pages/TaskEditPage/contexts/KeyboardShortcutsContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useIntl } from '@/i18n'

export const KeyboardShortcutsModal = () => {
  const { t } = useIntl()
  const { shortcuts, isModalOpen, setModalOpen } = useKeyboardShortcuts()

  // Always show the help shortcut
  const globalShortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        key: '?',
        description: t(
          'taskEditPage.keyboardShortcuts.showShortcuts',
          undefined,
          'Show keyboard shortcuts'
        ),
        category: 'General',
      },
    ],
    [t]
  )

  // Reason: data transformation for display grouping — merges registered and global shortcuts
  const allShortcuts = useMemo(
    () => [...shortcuts, ...globalShortcuts],
    [shortcuts, globalShortcuts]
  )

  // Reason: data transformation for display grouping — groups shortcuts by category
  const groupedShortcuts = useMemo(() => {
    return allShortcuts.reduce(
      (acc, shortcut) => {
        if (!acc[shortcut.category]) {
          acc[shortcut.category] = []
        }
        acc[shortcut.category].push(shortcut)
        return acc
      },
      {} as Record<string, KeyboardShortcut[]>
    )
  }, [allShortcuts])

  // Reason: data transformation for display grouping — sorts categories for consistent UI order
  const sortedCategories = useMemo(() => {
    const order = ['Bundle', 'Map', 'Navigation', 'General']
    return Object.keys(groupedShortcuts).sort((a, b) => {
      const aIndex = order.indexOf(a)
      const bIndex = order.indexOf(b)
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }, [groupedShortcuts])

  return (
    <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('taskEditPage.keyboardShortcuts.title', undefined, 'Keyboard Shortcuts')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'taskEditPage.keyboardShortcuts.description',
              undefined,
              'Use these shortcuts to speed up your workflow'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {sortedCategories.map((category) => (
            <div key={category}>
              <h3 className="mb-2 font-medium text-sm text-zinc-500 dark:text-zinc-400">
                {category}
              </h3>
              <div className="space-y-1.5">
                {groupedShortcuts[category].map((shortcut) => (
                  <div
                    key={`${shortcut.category}-${shortcut.key}`}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-slate-900"
                  >
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {shortcut.description}
                    </span>
                    <kbd className="ml-4 shrink-0 rounded border border-zinc-300 bg-white px-2 py-1 font-mono text-xs text-zinc-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-zinc-400">
                      {shortcut.ctrlOrCmd ? `Ctrl/Cmd + ${shortcut.key}` : shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {allShortcuts.length === 1 && (
          <p className="pt-2 text-center text-xs text-zinc-400">
            {t(
              'taskEditPage.keyboardShortcuts.noneRegistered',
              undefined,
              'No shortcuts registered yet'
            )}
          </p>
        )}

        <p className="pt-2 text-center text-xs text-zinc-400">
          {t('taskEditPage.keyboardShortcuts.pressPrefix', undefined, 'Press')}{' '}
          <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800">
            ?
          </kbd>{' '}
          {t(
            'taskEditPage.keyboardShortcuts.pressSuffix',
            undefined,
            'anytime to show this dialog'
          )}
        </p>
      </DialogContent>
    </Dialog>
  )
}
