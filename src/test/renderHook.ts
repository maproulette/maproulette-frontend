import { act, createElement, Fragment, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

/**
 * Minimal renderHook harness built on React's own `act` + `react-dom/client`
 * (no external testing library). Hook test files using this must run under
 * the happy-dom environment (`// @vitest-environment happy-dom`), since it
 * mounts into a real DOM container.
 */
export function renderHook<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: { initialProps?: TProps; wrapper?: (props: { children: ReactNode }) => ReactNode }
) {
  let currentProps = options?.initialProps as TProps
  let thrownError: unknown
  const Wrapper = options?.wrapper ?? Fragment
  // A stable ref object (not a getter) — `result` is destructured by callers,
  // so its `.current` must be mutated in place to stay live across renders.
  const result = { current: undefined as unknown as TResult }

  function TestComponent({ hookProps }: { hookProps: TProps }) {
    try {
      result.current = hook(hookProps)
    } catch (error) {
      thrownError = error
    }
    return null
  }

  const container = document.createElement('div')
  document.body.appendChild(container)
  let root: Root

  act(() => {
    root = createRoot(container)
    root.render(
      createElement(Wrapper, null, createElement(TestComponent, { hookProps: currentProps }))
    )
  })
  if (thrownError) throw thrownError

  return {
    result,
    rerender(newProps?: TProps) {
      if (newProps !== undefined) currentProps = newProps
      act(() => {
        root.render(
          createElement(Wrapper, null, createElement(TestComponent, { hookProps: currentProps }))
        )
      })
      if (thrownError) throw thrownError
    },
    unmount() {
      act(() => {
        root.unmount()
      })
      container.remove()
    },
  }
}
