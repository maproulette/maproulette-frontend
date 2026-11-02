import { useMemo } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { type KeyboardShortcut, useRegisterShortcuts } from '@/contexts/KeyboardShortcutsContext'
import { editorOptions } from '@/data/account.json'
import { useIntl } from '@/i18n'
import type { ShortcutBinding } from '@/lib/keyboardShortcuts'
import { useChallengeContext } from './contexts/ChallengeContext'
import { EDITABLE_STATUSES, useTaskContext } from './contexts/TaskContext'
import { EDITOR, useEditorLaunch } from './TaskActions/useEditorLaunch'
import { useSkipTask } from './TaskActions/useSkipTask'

export const SKIP_TASK_BINDING: ShortcutBinding = { key: 'w' }

/**
 * One key per editor, carried over from MapRoulette 3 so a mapper's muscle
 * memory still lands on the same editor.
 */
export const EDITOR_BINDINGS: Record<number, ShortcutBinding> = {
  [EDITOR.id]: { key: 'e' },
  [EDITOR.josm]: { key: 'r' },
  [EDITOR.josmLayer]: { key: 't' },
  [EDITOR.josmFeatures]: { key: 'y' },
  [EDITOR.level0]: { key: 'v' },
  [EDITOR.rapid]: { key: 'a' },
}

/**
 * Whether the mapper can act on this task right now, and if not, why — phrased
 * for the shortcuts dialog, which lists a shortcut it cannot fire rather than
 * hiding it.
 */
export const useMappingAvailability = () => {
  const { t } = useIntl()
  const { isLocked, isEditable } = useTaskContext()
  const { challenge } = useChallengeContext()
  const { isAuthenticated } = useAuthContext()

  const disabledReason = !isAuthenticated
    ? t({ id: 'keyboardShortcuts.unavailable.signIn', defaultMessage: 'Sign in to map this task' })
    : challenge.paused
      ? t({ id: 'keyboardShortcuts.unavailable.paused', defaultMessage: 'This challenge is paused' })
      : !isEditable
        ? t({ id: 'keyboardShortcuts.unavailable.notEditable', defaultMessage: 'This task is not editable' })
        : !isLocked
          ? t({ id: 'keyboardShortcuts.unavailable.notMapping', defaultMessage: 'Start mapping this task first' }
            )
          : undefined

  return { canEdit: disabledReason === undefined, disabledReason }
}

/**
 * The task screen's editor and skip shortcuts.
 *
 * Registered from the panel rather than from the buttons themselves: the
 * buttons only exist once the mapper holds the lock, and a shortcut that
 * silently ceases to exist teaches nobody anything. Registered always, and
 * carrying the reason it is out of reach, it stays visible in the shortcuts
 * dialog with an explanation.
 */
export const useTaskShortcuts = () => {
  const { t } = useIntl()
  const { task } = useTaskContext()
  const { openEditor } = useEditorLaunch(task)
  const { skipTask } = useSkipTask(task)
  const { canEdit, disabledReason } = useMappingAvailability()

  const canSkip = canEdit && EDITABLE_STATUSES.includes(task.status ?? 0)

  // Reason: stable shortcut definitions for keyboard handler registration
  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      ...editorOptions
        .filter((option) => EDITOR_BINDINGS[option.value])
        .map((option) => ({
          ...EDITOR_BINDINGS[option.value],
          description: option.label,
          category: 'editors' as const,
          handler: () => openEditor(option.value),
          enabled: canEdit,
          disabledReason,
        })),
      {
        ...SKIP_TASK_BINDING,
        description: t({ id: 'taskEditPage.taskActions.skipButton.label', defaultMessage: 'Skip this task' }),
        category: 'taskActions' as const,
        handler: skipTask,
        enabled: canSkip,
        disabledReason,
      },
    ],
    [openEditor, skipTask, canEdit, canSkip, disabledReason, t]
  )

  useRegisterShortcuts('task-editors', shortcuts)
}
