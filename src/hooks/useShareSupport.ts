import { useSyncExternalStore } from 'react'

const getSnapshot = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function'

const subscribe = () => () => {}

// Only ever invoked during SSR hydration; this app is client-only.
/* v8 ignore next -- @preserve */
const getServerSnapshot = () => false

export const useShareSupport = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
