import { describe, expect, it } from 'vitest'
import {
  findBindingConflicts,
  formatBinding,
  matchesBinding,
  withBindingHint,
} from './keyboardShortcuts'

const press = (key: string, modifiers: Partial<KeyboardEvent> = {}) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...modifiers,
})

describe('matchesBinding', () => {
  it('matches a plain letter regardless of case', () => {
    expect(matchesBinding({ key: 'f' }, press('f'))).toBe(true)
    expect(matchesBinding({ key: 'f' }, press('F', { shiftKey: true }))).toBe(false)
  })

  it('keeps a plain letter away from its Ctrl/Cmd counterpart', () => {
    expect(matchesBinding({ key: 'f' }, press('f', { metaKey: true }))).toBe(false)
    expect(matchesBinding({ key: 'f' }, press('f', { ctrlKey: true }))).toBe(false)
    expect(matchesBinding({ key: 'k', ctrlOrCmd: true }, press('k', { metaKey: true }))).toBe(true)
    expect(matchesBinding({ key: 'k', ctrlOrCmd: true }, press('k'))).toBe(false)
  })

  it('distinguishes a shifted letter from its bare form', () => {
    const shifted = { key: 'b', shift: true }
    expect(matchesBinding(shifted, press('B', { shiftKey: true }))).toBe(true)
    expect(matchesBinding(shifted, press('b'))).toBe(false)
    expect(matchesBinding({ key: 'b' }, press('B', { shiftKey: true }))).toBe(false)
  })

  it('ignores the Shift state of characters that need it to be typed', () => {
    // `?` is Shift+/ on a US layout but unshifted elsewhere, and `+` is
    // Shift+= on one keyboard and its own cap on a numpad.
    expect(matchesBinding({ key: '?' }, press('?', { shiftKey: true }))).toBe(true)
    expect(matchesBinding({ key: '?' }, press('?'))).toBe(true)
    expect(matchesBinding({ key: '+' }, press('+', { shiftKey: true }))).toBe(true)
  })

  it('matches aliases', () => {
    const zoomIn = { key: '+', aliases: ['='] }
    expect(matchesBinding(zoomIn, press('='))).toBe(true)
    expect(matchesBinding(zoomIn, press('+'))).toBe(true)
    expect(matchesBinding(zoomIn, press('-'))).toBe(false)
  })

  it('accepts named keys and treats Backspace as Delete', () => {
    expect(matchesBinding({ key: 'Esc' }, press('Escape'))).toBe(true)
    expect(matchesBinding({ key: 'Delete' }, press('Backspace'))).toBe(true)
    expect(matchesBinding({ key: 'Enter', shift: true }, press('Enter', { shiftKey: true }))).toBe(
      true
    )
    expect(matchesBinding({ key: 'Enter', shift: true }, press('Enter'))).toBe(false)
  })
})

describe('formatBinding', () => {
  it('names one cap per key, in the order they are held', () => {
    expect(formatBinding({ key: 'f' }, false)).toEqual(['F'])
    expect(formatBinding({ key: 'b', shift: true }, false)).toEqual(['Shift', 'B'])
    expect(formatBinding({ key: 'k', ctrlOrCmd: true }, false)).toEqual(['Ctrl', 'K'])
    expect(formatBinding({ key: 'k', ctrlOrCmd: true }, true)).toEqual(['⌘', 'K'])
    expect(formatBinding({ key: 'Esc' }, false)).toEqual(['Esc'])
    expect(formatBinding({ key: '+' }, false)).toEqual(['+'])
  })

  it('composes a label with its shortcut so translations never hold key names', () => {
    expect(withBindingHint('Mark as Fixed', { key: 'f' }, false)).toBe('Mark as Fixed (F)')
  })
})

describe('findBindingConflicts', () => {
  it('reports bindings that the same keystroke would both trigger', () => {
    const conflicts = findBindingConflicts([
      { key: 'f', description: 'fixed' },
      { key: 'q', description: 'not an issue' },
      { key: 'f', description: 'filter' },
    ])

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].map((binding) => binding.description)).toEqual(['fixed', 'filter'])
  })

  it('does not report bindings separated by a modifier', () => {
    expect(
      findBindingConflicts([{ key: 'f' }, { key: 'f', shift: true }, { key: 'f', ctrlOrCmd: true }])
    ).toEqual([])
  })

  it('reports a conflict that only an alias creates', () => {
    expect(findBindingConflicts([{ key: '+', aliases: ['='] }, { key: '=' }])).toHaveLength(1)
  })
})
