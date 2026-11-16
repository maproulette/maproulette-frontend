/**
 * @vitest-environment happy-dom
 */
import { act, createElement, type ReactNode, useMemo, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IntlProvider } from '@/i18n'
import { renderHook } from '@/test/renderHook'
import {
  type KeyboardShortcut,
  KeyboardShortcutsProvider,
  useKeyboardShortcuts,
  useRegisterShortcuts,
  useSuspendShortcuts,
} from './KeyboardShortcutsContext'

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(IntlProvider, null, createElement(KeyboardShortcutsProvider, null, children))

const press = (key: string, options: KeyboardEventInit = {}, target: EventTarget = window) => {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }))
  })
}

/** A focused text field, so the typing guard has something real to look at. */
const mountTextarea = () => {
  const textarea = document.createElement('textarea')
  document.body.appendChild(textarea)
  return textarea
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('KeyboardShortcutsProvider', () => {
  const setup = (shortcuts: KeyboardShortcut[]) =>
    renderHook(
      () => {
        const stable = useMemo(() => shortcuts, [])
        useRegisterShortcuts('test', stable)
        return useKeyboardShortcuts()
      },
      { wrapper }
    )

  it('fires the handler for a registered key', () => {
    const handler = vi.fn()
    const view = setup([{ key: 'f', description: 'Fixed', category: 'taskActions', handler }])

    press('f')
    expect(handler).toHaveBeenCalledTimes(1)

    press('g')
    expect(handler).toHaveBeenCalledTimes(1)

    view.unmount()
  })

  it('unregisters its shortcuts on unmount', () => {
    const handler = vi.fn()
    const view = setup([{ key: 'f', description: 'Fixed', category: 'taskActions', handler }])
    view.unmount()

    press('f')
    expect(handler).not.toHaveBeenCalled()
  })

  it('leaves a keystroke alone while the mapper is typing', () => {
    const plain = vi.fn()
    const modified = vi.fn()
    const view = setup([
      { key: 'f', description: 'Fixed', category: 'taskActions', handler: plain },
      {
        key: 'k',
        ctrlOrCmd: true,
        description: 'Search',
        category: 'general',
        handler: modified,
        allowWhileTyping: true,
      },
    ])
    const textarea = mountTextarea()

    press('f', {}, textarea)
    expect(plain).not.toHaveBeenCalled()

    // The Ctrl/Cmd tier is the one that keeps working inside a text field.
    press('k', { metaKey: true }, textarea)
    expect(modified).toHaveBeenCalledTimes(1)

    view.unmount()
  })

  it('does not fire a shortcut that is currently disabled', () => {
    const handler = vi.fn()
    const view = setup([
      { key: 'f', description: 'Fixed', category: 'taskActions', handler, enabled: false },
    ])

    press('f')
    expect(handler).not.toHaveBeenCalled()

    view.unmount()
  })

  it('holds shortcuts while suspended, except those that opt out', () => {
    const behind = vi.fn()
    const inDialog = vi.fn()

    const view = renderHook(
      () => {
        const [suspended, setSuspended] = useState(false)
        const shortcuts = useMemo<KeyboardShortcut[]>(
          () => [
            { key: 'f', description: 'Fixed', category: 'taskActions', handler: behind },
            {
              key: 'Enter',
              shift: true,
              description: 'Submit',
              category: 'taskActions',
              handler: inDialog,
              allowWhileSuspended: true,
            },
          ],
          []
        )
        useRegisterShortcuts('test', shortcuts)
        useSuspendShortcuts(suspended)
        return { setSuspended }
      },
      { wrapper }
    )

    press('f')
    expect(behind).toHaveBeenCalledTimes(1)

    act(() => {
      view.result.current.setSuspended(true)
    })

    press('f')
    expect(behind).toHaveBeenCalledTimes(1)
    press('Enter', { shiftKey: true })
    expect(inDialog).toHaveBeenCalledTimes(1)

    act(() => {
      view.result.current.setSuspended(false)
    })

    press('f')
    expect(behind).toHaveBeenCalledTimes(2)

    view.unmount()
  })

  it('resolves a contested keystroke by priority', () => {
    const low = vi.fn()
    const high = vi.fn()
    const view = setup([
      { key: 'Esc', description: 'Close the editor', category: 'editors', handler: low },
      {
        key: 'Esc',
        description: 'Cancel drawing',
        category: 'multiTask',
        handler: high,
        priority: 1,
      },
    ])

    press('Escape')
    expect(high).toHaveBeenCalledTimes(1)
    expect(low).not.toHaveBeenCalled()

    view.unmount()
  })

  it('opens the shortcuts dialog on ?, and lists it among the shortcuts', () => {
    const view = setup([])

    expect(view.result.current.isModalOpen).toBe(false)
    expect(view.result.current.shortcuts.map((shortcut) => shortcut.key)).toContain('?')

    press('?', { shiftKey: true })
    expect(view.result.current.isModalOpen).toBe(true)

    view.unmount()
  })
})
