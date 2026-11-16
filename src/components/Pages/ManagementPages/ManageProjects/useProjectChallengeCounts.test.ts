// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderHook } from '@/test/renderHook'
import type { Project } from '@/types/Project'
import { useProjectChallengeCounts } from './useProjectChallengeCounts'

describe('useProjectChallengeCounts', () => {
  it('maps each project to the challenge counts the listing returned', () => {
    const projects = [
      { id: 1, challengeCounts: { total: 3, completed: 2 } },
      { id: 2 },
    ] as Project[]

    const { result } = renderHook(() => useProjectChallengeCounts(projects))

    expect(result.current).toEqual({
      1: { total: 3, completed: 2 },
      2: { total: 0, completed: 0 },
    })
  })

  it('skips projects without an id', () => {
    const { result } = renderHook(() =>
      useProjectChallengeCounts([{ challengeCounts: { total: 1, completed: 0 } }] as Project[])
    )

    expect(result.current).toEqual({})
  })
})
