import { describe, expect, it } from 'vitest'
import type { IdContext, IdGlobal, IdIframeWindow } from './iDEditor.ts'
import { getIdGlobal, isEntityLoaded } from './iDEditor.ts'

describe('getIdGlobal', () => {
  it('returns the iD global when present on the window', () => {
    const iD = {} as IdGlobal
    const win = { iD } as unknown as IdIframeWindow

    expect(getIdGlobal(win)).toBe(iD)
  })

  it.each([
    ['the window has no iD global', {} as IdIframeWindow],
    ['the window is null', null],
    ['the window is undefined', undefined],
  ] as const)('returns undefined when %s', (_label, win) => {
    expect(getIdGlobal(win)).toBeUndefined()
  })
})

describe('isEntityLoaded', () => {
  const contextWith = (hasEntity: (id: string) => unknown): IdContext =>
    ({ hasEntity }) as unknown as IdContext

  it('is true once iD has the element in its graph', () => {
    expect(
      isEntityLoaded(
        contextWith(() => ({ id: 'w1' })),
        'w1'
      )
    ).toBe(true)
  })

  it('is false while the element is still being downloaded', () => {
    expect(
      isEntityLoaded(
        contextWith(() => undefined),
        'w1'
      )
    ).toBe(false)
  })

  it('is false when iD throws instead of answering', () => {
    expect(
      isEntityLoaded(
        contextWith(() => {
          throw new Error('entity not found')
        }),
        'w1'
      )
    ).toBe(false)
  })
})
