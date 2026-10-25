import { useCallback, useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

interface Config<TKey extends string> {
  available: TKey[]
  added: TKey[]
}

const storageKey = (tableId: string) => `mr4:columns:${tableId}`

export const useColumnConfig = <TKey extends string>(tableId: string, defaults: Config<TKey>) => {
  const [config, setConfig] = useState<Config<TKey>>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(tableId))
      if (!raw) return defaults
      const parsed = JSON.parse(raw) as Config<TKey>
      const allDefaults = new Set<TKey>([...defaults.added, ...defaults.available])
      const sanitize = (arr: TKey[]) => arr.filter((k) => allDefaults.has(k))
      return {
        available: sanitize(parsed.available ?? defaults.available),
        added: sanitize(parsed.added ?? defaults.added),
      }
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(tableId), JSON.stringify(config))
    } catch (error) {
      logger.warn(`Failed to persist column config for ${tableId}`, { error })
    }
  }, [tableId, config])

  const addColumn = useCallback((key: TKey) => {
    setConfig((prev) =>
      prev.added.includes(key)
        ? prev
        : {
            available: prev.available.filter((k) => k !== key),
            added: [...prev.added, key],
          }
    )
  }, [])

  const removeColumn = useCallback((key: TKey) => {
    setConfig((prev) =>
      prev.added.includes(key)
        ? {
            available: [...prev.available, key],
            added: prev.added.filter((k) => k !== key),
          }
        : prev
    )
  }, [])

  const moveColumn = useCallback((key: TKey, direction: -1 | 1) => {
    setConfig((prev) => {
      const idx = prev.added.indexOf(key)
      if (idx === -1) return prev
      const newIdx = idx + direction
      if (newIdx < 0 || newIdx >= prev.added.length) return prev
      const added = [...prev.added]
      const [removed] = added.splice(idx, 1)
      added.splice(newIdx, 0, removed)
      return { ...prev, added }
    })
  }, [])

  const reset = useCallback(() => setConfig(defaults), [defaults])

  return { config, addColumn, removeColumn, moveColumn, reset }
}
