import { afterEach, describe, expect, it } from 'vitest'
import { DOCS_PAGES, docsBaseUrl, docsUrl } from './docs.ts'

const setDocsBaseUrl = (value: string | undefined) => {
  ;(window.env as unknown as Record<string, string | undefined>).VITE_DOCS_BASE_URL = value
}

afterEach(() => {
  setDocsBaseUrl(undefined)
})

describe('docsBaseUrl', () => {
  it('falls back to the public docs site when unconfigured', () => {
    setDocsBaseUrl(undefined)
    expect(docsBaseUrl()).toBe('https://learn.maproulette.org')
  })

  it('uses VITE_DOCS_BASE_URL when configured', () => {
    setDocsBaseUrl('https://docs.example.org')
    expect(docsBaseUrl()).toBe('https://docs.example.org')
  })

  it('strips trailing slashes so paths are not doubled up', () => {
    setDocsBaseUrl('https://docs.example.org//')
    expect(docsBaseUrl()).toBe('https://docs.example.org')
  })
})

describe('docsUrl', () => {
  it('links to the docs home page when given no page', () => {
    setDocsBaseUrl('https://docs.example.org')
    expect(docsUrl()).toBe('https://docs.example.org/')
  })

  it('links to a documentation page by name', () => {
    setDocsBaseUrl('https://docs.example.org')
    expect(docsUrl('teams')).toBe('https://docs.example.org/documentation/teams/')
  })

  it('keeps every registered page under the documentation collection', () => {
    for (const path of Object.values(DOCS_PAGES)) {
      expect(path).toMatch(/^documentation\/[a-z0-9-]+$/)
    }
  })
})
