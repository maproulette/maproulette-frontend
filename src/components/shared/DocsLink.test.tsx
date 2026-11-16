/**
 * @vitest-environment happy-dom
 */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { DocsLink } from './DocsLink'

const setDocsBaseUrl = (value: string | undefined) => {
  ;(window.env as unknown as Record<string, string | undefined>).VITE_DOCS_BASE_URL = value
}

describe('DocsLink', () => {
  let container: HTMLDivElement
  let root: Root

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    setDocsBaseUrl(undefined)
  })

  const mount = (ui: ReactNode) => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root.render(ui)
    })
    return container.querySelector('a') as HTMLAnchorElement
  }

  it('resolves the href from the configured docs base URL', () => {
    setDocsBaseUrl('https://docs.example.org')
    const link = mount(<DocsLink page="teams">Teams</DocsLink>)
    expect(link.getAttribute('href')).toBe('https://docs.example.org/documentation/teams/')
    expect(link.textContent).toContain('Teams')
  })

  it('opens in a new tab without leaking the referrer', () => {
    const link = mount(<DocsLink page="markdown">Markdown</DocsLink>)
    expect(link.target).toBe('_blank')
    expect(link.rel).toBe('noreferrer')
  })

  it('names an icon-only link from its label', () => {
    const link = mount(<DocsLink page="teams" label="Learn more about teams" />)
    expect(link.getAttribute('aria-label')).toBe('Learn more about teams')
    expect(link.title).toBe('Learn more about teams')
  })

  it('leaves a link with visible text unlabelled so the text names it', () => {
    const link = mount(<DocsLink page="teams">Teams</DocsLink>)
    expect(link.getAttribute('aria-label')).toBeNull()
  })
})
