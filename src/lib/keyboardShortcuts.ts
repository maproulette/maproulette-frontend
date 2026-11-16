/**
 * Matching and formatting for keyboard shortcuts.
 *
 * Kept free of React so the rules that decide "did this keystroke fire that
 * shortcut" can be tested directly, and so both the handler and the shortcut
 * dialog render key names from one place.
 */

export interface ShortcutBinding {
  /**
   * The key as the mapper sees it on their keyboard, matched against
   * `KeyboardEvent.key`: a letter (`'f'`), a printable character (`'+'`), or
   * one of the named keys `'esc'`, `'delete'`, `'enter'`.
   *
   * Matching against `key` rather than `code` means a mapper on a non-QWERTY
   * layout gets the key that is actually printed on the cap, which is also
   * what the shortcut dialog shows them.
   */
  key: string
  /** Extra keys that trigger the same shortcut, e.g. `'='` alongside `'+'`. */
  aliases?: string[]
  /** Requires the Ctrl (Windows/Linux) or Cmd (Mac) modifier to be held. */
  ctrlOrCmd?: boolean
  /** Requires Shift to be held. */
  shift?: boolean
}

const NAMED_KEYS: Record<string, string> = {
  esc: 'escape',
  escape: 'escape',
  del: 'delete',
  delete: 'delete',
  enter: 'enter',
  return: 'enter',
  space: ' ',
}

const normalizeKey = (key: string) => {
  const lowered = key.toLowerCase()
  return NAMED_KEYS[lowered] ?? lowered
}

const isLetter = (key: string) => key.length === 1 && key >= 'a' && key <= 'z'

/**
 * Whether a keystroke should be routed to a shortcut at all, or belongs to
 * whatever the mapper is typing into.
 */
export const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement && target.isContentEditable)

interface ModifierState {
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  key: string
}

export const matchesBinding = (binding: ShortcutBinding, event: ModifierState) => {
  const pressed = normalizeKey(event.key)
  const candidates = [binding.key, ...(binding.aliases ?? [])].map(normalizeKey)

  const keyMatches = candidates.some(
    (candidate) =>
      candidate === pressed ||
      // Backspace is where mappers reach for Delete on a laptop keyboard.
      (candidate === 'delete' && pressed === 'backspace')
  )
  if (!keyMatches) return false

  // Ctrl/Cmd shortcuts only fire while it is held, and plain ones must not fire
  // while it is held — so a plain `f` never steals Cmd+F from the browser.
  const hasCtrlOrCmd = event.ctrlKey || event.metaKey
  if (hasCtrlOrCmd !== Boolean(binding.ctrlOrCmd)) return false

  // Shift is only checked for letters, where the pressed key reads the same
  // with or without it (`Shift+B` and `b` both arrive as `'b'` once lowered).
  // For a character that *needs* Shift to type at all — `?`, `+` on a US
  // layout — the modifier state varies by layout and carries no meaning.
  if (candidates.some(isLetter)) {
    return event.shiftKey === Boolean(binding.shift)
  }

  return binding.shift ? event.shiftKey : true
}

const DISPLAY_KEYS: Record<string, string> = {
  escape: 'Esc',
  delete: 'Del',
  enter: 'Enter',
  ' ': 'Space',
}

const isMacPlatform = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '')

/**
 * The key names to show for a binding, one per key cap, in the order they are
 * held: `['Ctrl', 'K']`, or `['⌘', 'K']` on a Mac.
 */
export const formatBinding = (binding: ShortcutBinding, isMac = isMacPlatform()): string[] => {
  const keys: string[] = []
  if (binding.ctrlOrCmd) keys.push(isMac ? '⌘' : 'Ctrl')
  if (binding.shift) keys.push('Shift')

  const normalized = normalizeKey(binding.key)
  keys.push(
    DISPLAY_KEYS[normalized] ?? (isLetter(normalized) ? normalized.toUpperCase() : normalized)
  )

  return keys
}

/** A binding rendered inline, for a native `title` attribute: `"Ctrl + K"`. */
const formatBindingText = (binding: ShortcutBinding, isMac = isMacPlatform()) =>
  formatBinding(binding, isMac).join(' + ')

/**
 * Composes a control's own label with its shortcut, so the key never has to be
 * written into a translated string and can move without a translation change.
 */
export const withBindingHint = (label: string, binding: ShortcutBinding, isMac?: boolean) =>
  `${label} (${formatBindingText(binding, isMac)})`

/**
 * Bindings that would race each other: the same keystroke matching more than
 * one shortcut. Used to fail loudly in development rather than silently
 * letting whichever registered first win.
 */
export const findBindingConflicts = <T extends ShortcutBinding>(bindings: T[]) => {
  const conflicts: T[][] = []
  const seen: T[][] = []

  for (const binding of bindings) {
    const group = seen.find(([first]) =>
      matchesBinding(first, {
        key: binding.key,
        ctrlKey: Boolean(binding.ctrlOrCmd),
        metaKey: false,
        shiftKey: Boolean(binding.shift),
      })
    )
    if (group) {
      group.push(binding)
      if (group.length === 2) conflicts.push(group)
    } else {
      seen.push([binding])
    }
  }

  return conflicts
}
