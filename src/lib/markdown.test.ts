import remarkBreaks from 'remark-breaks'
import { describe, expect, it } from 'vitest'
import { markdownRemarkPlugins } from './markdown'

describe('markdownRemarkPlugins', () => {
  it('renders single newlines as hard breaks via remark-breaks', () => {
    expect(markdownRemarkPlugins).toEqual([remarkBreaks])
  })
})
