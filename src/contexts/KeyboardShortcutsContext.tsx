import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useIntl } from '@/i18n'
import {
  findBindingConflicts,
  isTypingTarget,
  matchesBinding,
  type ShortcutBinding,
} from '@/lib/keyboardShortcuts'
import { logger } from '@/lib/logger'

/**
 * Which part of the app a shortcut belongs to. A stable id rather than a label
 * so the dialog can order categories consistently in every locale.
 */
export type ShortcutCategory = 'taskActions' | 'editors' | 'map' | 'multiTask' | 'general'

export interface KeyboardShortcut extends ShortcutBinding {
  description: string
  category: ShortcutCategory
  /** Called when the shortcut fires. A shortcut without one is display-only. */
  handler?: () => void
  /** Whether the shortcut can fire right now (default: true). */
  enabled?: boolean
  /**
   * Why the shortcut cannot fire right now, e.g. "start mapping this task
   * first". Shown alongside the greyed-out row in the shortcuts dialog, so a
   * shortcut that is out of reach explains itself instead of disappearing.
   */
  disabledReason?: string
  /**
   * Fires even while the mapper is typing. Reserved for the Ctrl/Cmd tier and
   * for submitting the form being typed into — a plain letter must never take
   * a keystroke out of a comment box.
   */
  allowWhileTyping?: boolean
  /**
   * Fires even while a dialog holds the screen. Reserved for shortcuts that
   * belong to the dialog itself.
   */
  allowWhileSuspended?: boolean
  /** Higher wins when two shortcuts could both fire. Defaults to 0. */
  priority?: number
}

interface KeyboardShortcutsContextValue {
  shortcuts: KeyboardShortcut[]
  registerShortcuts: (id: string, shortcuts: KeyboardShortcut[]) => void
  unregisterShortcuts: (id: string) => void
  /**
   * Holds every shortcut except the ones marked `allowWhileSuspended` until
   * the returned function is called. Dialogs use this so bare letters cannot
   * act on the task behind them.
   */
  suspend: () => () => void
  isModalOpen: boolean
  setModalOpen: (open: boolean) => void
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null)

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext)
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider')
  }
  return context
}

/**
 * The registry where there is one, or null. UI primitives live both inside and
 * outside it, so they ask rather than require.
 */
const useOptionalKeyboardShortcuts = () => useContext(KeyboardShortcutsContext)

/**
 * Registers a component's shortcuts for as long as it is mounted.
 *
 * Register shortcuts unconditionally and flip `enabled` instead of registering
 * only when they apply: that is what lets the dialog list a shortcut the
 * mapper cannot use yet, with the reason why.
 *
 * @param id - Unique identifier for this group of shortcuts
 * @param shortcuts - Shortcuts to register (memoize, or the effect re-runs every render)
 */
export const useRegisterShortcuts = (id: string, shortcuts: KeyboardShortcut[]) => {
  const { registerShortcuts, unregisterShortcuts } = useKeyboardShortcuts()

  useEffect(() => {
    registerShortcuts(id, shortcuts)
    return () => unregisterShortcuts(id)
  }, [id, shortcuts, registerShortcuts, unregisterShortcuts])
}

/**
 * Suspends shortcuts while `active`, for anything that takes over the screen.
 * A no-op outside the provider.
 */
export const useSuspendShortcuts = (active: boolean) => {
  const context = useOptionalKeyboardShortcuts()
  const suspend = context?.suspend

  useEffect(() => {
    if (!active || !suspend) return
    return suspend()
  }, [active, suspend])
}

export const KeyboardShortcutsProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useIntl()
  const [shortcutGroups, setShortcutGroups] = useState<Map<string, KeyboardShortcut[]>>(new Map())
  const [isModalOpen, setModalOpen] = useState(false)
  const suspensionsRef = useRef(0)

  // The keydown handler is registered once and reads through refs, so it never
  // has to be torn down and rebuilt as shortcuts come and go.
  const shortcutGroupsRef = useRef(shortcutGroups)
  shortcutGroupsRef.current = shortcutGroups

  // Reason: stable references returned from context — consumers use these as effect dependencies
  const registerShortcuts = useCallback((id: string, shortcuts: KeyboardShortcut[]) => {
    setShortcutGroups((prev) => {
      const next = new Map(prev)
      next.set(id, shortcuts)
      return next
    })
  }, [])

  const unregisterShortcuts = useCallback((id: string) => {
    setShortcutGroups((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const suspend = useCallback(() => {
    suspensionsRef.current += 1
    let released = false
    return () => {
      if (released) return
      released = true
      suspensionsRef.current -= 1
    }
  }, [])

  // The dialog is itself a shortcut, registered like any other so it appears in
  // its own list.
  const globalShortcuts = useMemo<KeyboardShortcut[]>(
    () => [
      {
        key: '?',
        description: t({ id: 'keyboardShortcuts.showShortcuts', defaultMessage: 'Show this list of keyboard shortcuts' }
        ),
        category: 'general',
        handler: () => setModalOpen(true),
      },
    ],
    [t]
  )

  useEffect(() => {
    registerShortcuts('global', globalShortcuts)
    return () => unregisterShortcuts('global')
  }, [globalShortcuts, registerShortcuts, unregisterShortcuts])

  const shortcuts = useMemo(() => {
    const all: KeyboardShortcut[] = []
    shortcutGroups.forEach((group) => {
      all.push(...group)
    })
    return all
  }, [shortcutGroups])

  // Two shortcuts racing for one keystroke resolves by priority and then by
  // registration order, which is not something to discover in production.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const conflicts = findBindingConflicts(shortcuts.filter((s) => s.enabled !== false))
    for (const group of conflicts) {
      logger.warn('Keyboard shortcut conflict', {
        key: group[0].key,
        descriptions: group.map((shortcut) => shortcut.description),
      })
    }
  }, [shortcuts])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const typing = isTypingTarget(event.target)
      const suspended = suspensionsRef.current > 0

      const candidates: KeyboardShortcut[] = []
      shortcutGroupsRef.current.forEach((group) => {
        candidates.push(...group)
      })

      const match = candidates
        .filter((shortcut) => shortcut.handler && shortcut.enabled !== false)
        .filter((shortcut) => !typing || shortcut.allowWhileTyping)
        .filter((shortcut) => !suspended || shortcut.allowWhileSuspended)
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
        .find((shortcut) => matchesBinding(shortcut, event))

      if (match?.handler) {
        event.preventDefault()
        match.handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo(
    () => ({
      shortcuts,
      registerShortcuts,
      unregisterShortcuts,
      suspend,
      isModalOpen,
      setModalOpen,
    }),
    [shortcuts, registerShortcuts, unregisterShortcuts, suspend, isModalOpen]
  )

  return (
    <KeyboardShortcutsContext.Provider value={value}>{children}</KeyboardShortcutsContext.Provider>
  )
}
