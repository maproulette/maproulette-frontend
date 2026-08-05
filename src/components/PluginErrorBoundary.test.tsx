/**
 * @vitest-environment happy-dom
 */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PluginErrorBoundary, wrapPluginComponent } from './PluginErrorBoundary'

const Boom = ({ message = 'plugin boom' }: { message?: string }) => {
  throw new Error(message)
}

describe('PluginErrorBoundary', () => {
  let container: HTMLDivElement
  let root: Root

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
  })

  const mount = (ui: ReactNode) => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root.render(ui)
    })
  }

  it('catches render errors and logs a structured console.error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mount(
      <PluginErrorBoundary contributionId="review-page" source="page">
        <Boom />
      </PluginErrorBoundary>
    )

    expect(container.textContent).toContain('Plugin page failed')
    expect(container.textContent).toContain('plugin boom')
    expect(
      consoleSpy.mock.calls.some(
        (args) => typeof args[0] === 'string' && args[0].includes('[Plugin] Render error')
      )
    ).toBe(true)
    expect(consoleSpy.mock.calls.some((args) => args[1] instanceof Error)).toBe(true)
  })

  it('retries after a failure', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true
    const Flaky = () => {
      if (shouldThrow) throw new Error('plugin boom')
      return <div>recovered</div>
    }

    mount(
      <PluginErrorBoundary contributionId="review-page" source="page">
        <Flaky />
      </PluginErrorBoundary>
    )

    const button = container.querySelector('button')
    expect(button).toBeTruthy()
    shouldThrow = false
    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(container.textContent).toContain('recovered')
  })

  it('wrapPluginComponent isolates render errors without call-site wrappers', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Boom = () => {
      throw new Error('wrapped boom')
    }
    const Safe = wrapPluginComponent(Boom, {
      contributionId: 'x',
      source: 'panel',
    })

    mount(<Safe />)
    expect(container.textContent).toMatch(/Plugin panel failed/)
    expect(
      consoleSpy.mock.calls.some(
        (args) => typeof args[0] === 'string' && args[0].includes('panel:x')
      )
    ).toBe(true)
  })
})
