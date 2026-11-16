// @vitest-environment happy-dom
import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { renderHook } from '@/test/renderHook'
import { useRowSelection } from './useRowSelection'

describe('useRowSelection', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useRowSelection<number>())

    expect(result.current.ids.size).toBe(0)
    expect(result.current.idList).toEqual([])
    expect(result.current.count).toBe(0)
    expect(result.current.has(1)).toBe(false)
  })

  it('toggle adds an id when not present', () => {
    const { result } = renderHook(() => useRowSelection<number>())

    act(() => result.current.toggle(1))

    expect(result.current.has(1)).toBe(true)
    expect(result.current.count).toBe(1)
    expect(result.current.idList).toEqual([1])
  })

  it('toggle removes an id when already present', () => {
    const { result } = renderHook(() => useRowSelection<number>())

    act(() => result.current.toggle(1))
    act(() => result.current.toggle(1))

    expect(result.current.has(1)).toBe(false)
    expect(result.current.count).toBe(0)
  })

  it('set(id, true) adds the id', () => {
    const { result } = renderHook(() => useRowSelection<number>())

    act(() => result.current.set(5, true))

    expect(result.current.has(5)).toBe(true)
  })

  it('set(id, false) removes the id', () => {
    const { result } = renderHook(() => useRowSelection<number>())

    act(() => result.current.toggle(5))
    act(() => result.current.set(5, false))

    expect(result.current.has(5)).toBe(false)
  })

  it('set is a no-op when selected state already matches (adding)', () => {
    const { result } = renderHook(() => useRowSelection<number>())

    act(() => result.current.set(5, true))
    const idsBefore = result.current.ids
    act(() => result.current.set(5, true))

    expect(result.current.ids).toBe(idsBefore)
  })

  it('set is a no-op when selected state already matches (removing)', () => {
    const { result } = renderHook(() => useRowSelection<number>())

    const idsBefore = result.current.ids
    act(() => result.current.set(5, false))

    expect(result.current.ids).toBe(idsBefore)
    expect(result.current.has(5)).toBe(false)
  })

  it('selectAll replaces the selection with the given ids', () => {
    const { result } = renderHook(() => useRowSelection<number>())

    act(() => result.current.toggle(99))
    act(() => result.current.selectAll([1, 2, 3]))

    expect(result.current.idList.sort()).toEqual([1, 2, 3])
    expect(result.current.has(99)).toBe(false)
  })

  it('clear empties the selection', () => {
    const { result } = renderHook(() => useRowSelection<number>())

    act(() => result.current.selectAll([1, 2, 3]))
    act(() => result.current.clear())

    expect(result.current.count).toBe(0)
    expect(result.current.idList).toEqual([])
  })

  it('supports string ids via the generic parameter', () => {
    const { result } = renderHook(() => useRowSelection<string>())

    act(() => result.current.toggle('abc'))

    expect(result.current.has('abc')).toBe(true)
  })
})
