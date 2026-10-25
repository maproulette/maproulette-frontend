/**
 * @vitest-environment happy-dom
 */
import { act, type ReactNode, useMemo, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type KeyboardShortcut,
  KeyboardShortcutsProvider,
  useRegisterShortcuts,
} from '@/contexts/KeyboardShortcutsContext'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'

// Stable navigate, as the real useNavigate provides.
const navigateSpy = vi.fn(() => Promise.resolve())
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigateSpy }))
// Stable t and context value, as the real IntlContext provides (t is a useCallback).
const t = (_k: string, _v: unknown, d: string) => d
const intl = { t }
vi.mock('@/i18n', () => ({ useIntl: () => intl }))

let container: HTMLDivElement
let root: Root
const mount = (ui: ReactNode) => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(ui)
  })
}
afterEach(() => {
  act(() => root.unmount())
  container?.remove()
})

const RENDER_CAP = 50

// Mirrors useSkipTask -> useTaskShortcuts: a useMemo whose dep is the function
// returned by useNavigateToTask. Throws rather than looping forever, so a
// regression fails the test instead of exhausting the heap.
const TaskShortcutsConsumer = ({ onRender }: { onRender: (n: number) => void }) => {
  const renders = useRef(0)
  renders.current += 1
  onRender(renders.current)
  if (renders.current > RENDER_CAP) {
    throw new Error(`re-render loop: ${renders.current} renders`)
  }

  const navigateToTask = useNavigateToTask()
  const shortcuts = useMemo<KeyboardShortcut[]>(
    () => [
      {
        key: 'w',
        description: 'Skip',
        category: 'taskActions',
        handler: () => navigateToTask(1),
      },
    ],
    [navigateToTask]
  )
  useRegisterShortcuts('task-editors', shortcuts)
  return <span>task</span>
}

describe('keyboard shortcut registry', () => {
  it('useNavigateToTask keeps a stable identity across renders', () => {
    const seen: unknown[] = []
    const Probe = () => {
      seen.push(useNavigateToTask())
      return null
    }
    mount(<Probe />)
    act(() => {
      root.render(<Probe />)
    })
    expect(seen.length).toBe(2)
    expect(seen[0]).toBe(seen[1])
  })

  it('settles instead of re-registering the task shortcut group forever', () => {
    let max = 0
    mount(
      <KeyboardShortcutsProvider>
        <TaskShortcutsConsumer
          onRender={(n) => {
            max = Math.max(max, n)
          }}
        />
      </KeyboardShortcutsProvider>
    )
    expect(max).toBeLessThanOrEqual(RENDER_CAP)
    expect(container.textContent).toBe('task')
  })
})
