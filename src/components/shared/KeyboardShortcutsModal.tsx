import { Keyboard } from 'lucide-react'
import { DocsLink } from '@/components/shared/DocsLink'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { KbdBinding } from '@/components/ui/Kbd'
import {
  type KeyboardShortcut,
  type ShortcutCategory,
  useKeyboardShortcuts,
} from '@/contexts/KeyboardShortcutsContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

/** Categories in the order a mapper meets them, not the order they register. */
const CATEGORY_ORDER: ShortcutCategory[] = ['taskActions', 'editors', 'map', 'multiTask', 'general']

export const KeyboardShortcutsModal = () => {
  const { t } = useIntl()
  const { shortcuts, isModalOpen, setModalOpen } = useKeyboardShortcuts()

  const categoryLabels: Record<ShortcutCategory, string> = {
    taskActions: t({
      id: 'keyboardShortcuts.category.taskActions',
      defaultMessage: 'Task actions',
    }),
    editors: t({ id: 'keyboardShortcuts.category.editors', defaultMessage: 'Editors' }),
    map: t({ id: 'common.map', defaultMessage: 'Map' }),
    multiTask: t({ id: 'keyboardShortcuts.category.multiTask', defaultMessage: 'Multi-task' }),
    general: t({ id: 'keyboardShortcuts.category.general', defaultMessage: 'General' }),
  }

  // Within a category, what the mapper can do right now comes first; the rest
  // stay listed, greyed out, with the reason they are out of reach.
  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    shortcuts: shortcuts
      .filter((shortcut) => shortcut.category === category)
      .sort((a, b) => Number(a.enabled === false) - Number(b.enabled === false)),
  })).filter((group) => group.shortcuts.length > 0)

  return (
    <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t({ id: 'keyboardShortcuts.title', defaultMessage: 'Keyboard Shortcuts' })}
          </DialogTitle>
          <DialogDescription>
            {t({
              id: 'keyboardShortcuts.description',
              defaultMessage: 'Use these shortcuts to speed up your workflow',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {byCategory.map(({ category, shortcuts: categoryShortcuts }) => (
            <div key={category}>
              <h3 className="mb-2 font-medium text-sm text-zinc-500 dark:text-zinc-400">
                {categoryLabels[category]}
              </h3>
              <div className="space-y-1.5">
                {categoryShortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcutRowKey(shortcut)} shortcut={shortcut} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <DocsLink page="keyboardShortcuts" className="text-sm">
          {t({
            id: 'keyboardShortcuts.docsLink',
            defaultMessage: 'See the full list of keyboard shortcuts',
          })}
        </DocsLink>
      </DialogContent>
    </Dialog>
  )
}

const shortcutRowKey = (shortcut: KeyboardShortcut) =>
  `${shortcut.category}-${shortcut.ctrlOrCmd ? 'mod-' : ''}${shortcut.shift ? 'shift-' : ''}${shortcut.key}`

const ShortcutRow = ({ shortcut }: { shortcut: KeyboardShortcut }) => {
  const unavailable = shortcut.enabled === false

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-slate-900',
        unavailable && 'opacity-60'
      )}
    >
      <span className="text-sm text-zinc-700 dark:text-zinc-300">
        {shortcut.description}
        {unavailable && shortcut.disabledReason && (
          <span className="block text-xs text-zinc-400 dark:text-zinc-500">
            {shortcut.disabledReason}
          </span>
        )}
      </span>
      <KbdBinding binding={shortcut} />
    </div>
  )
}
