import { useCallback, useState } from 'react'

/**
 * Reusable row-selection state for admin tables and other list-style UIs.
 *
 * Generic over the row id type — use `useRowSelection<number>()` for tasks,
 * `useRowSelection<string>()` for uuid-keyed rows, etc.
 */
export const useRowSelection = <TId>() => {
  const [ids, setIds] = useState<Set<TId>>(new Set())

  const toggle = useCallback((id: TId) => {
    setIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const set = useCallback((id: TId, selected: boolean) => {
    setIds((prev) => {
      if (selected === prev.has(id)) return prev
      const next = new Set(prev)
      if (selected) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const setMany = useCallback((many: TId[], selected: boolean) => {
    setIds((prev) => {
      const next = new Set(prev)
      for (const id of many) {
        if (selected) {
          next.add(id)
        } else {
          next.delete(id)
        }
      }
      return next
    })
  }, [])

  const selectAll = useCallback((all: TId[]) => setIds(new Set(all)), [])

  const clear = useCallback(() => setIds(new Set()), [])

  const has = (id: TId) => ids.has(id)

  return {
    ids,
    idList: Array.from(ids),
    count: ids.size,
    has,
    toggle,
    set,
    setMany,
    selectAll,
    clear,
  }
}

export type UseRowSelectionReturn<TId> = ReturnType<typeof useRowSelection<TId>>
