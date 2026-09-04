import { useCallback, useEffect, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'

/**
 * How long to give MapLibre to rebuild itself after a context loss we saw
 * happen, before declaring the map dead.
 */
const RECOVERY_CHECK_DELAY_MS = 500

/**
 * The context can also be taken away before React has even handed us the map
 * instance, so the listener alone isn't enough — poll for a map left without a
 * style at this interval too. It's a property read, so it costs nothing.
 */
const WATCHDOG_INTERVAL_MS = 1000

/**
 * Cap on replacements, so a machine that simply can't hand out another WebGL
 * context (GPU blocklisted, hard context limit reached) doesn't spin forever.
 */
const MAX_REMOUNTS = 3

/**
 * Replaces a map whose WebGL context the browser took away.
 *
 * MapLibre can't recover on its own when the loss lands before the style has
 * finished loading: `_contextLost` saves `Style.serialize()`, which returns
 * `undefined` until the style is loaded, then nulls `map.style`. On
 * `webglcontextrestored` it has nothing to restore, so it leaves the map
 * permanently style-less — blank, no tiles, and `onLoad` never fires. (Before
 * maplibre-gl 5.23 it also threw a pair of TypeErrors on every later
 * lost/restored cycle.)
 *
 * Safari drops contexts on its own initiative — it caps live WebGL contexts per
 * page and doesn't reclaim the slot when one is disposed (WebKit bug 218305) —
 * so a page that mounts and unmounts maps as you navigate eventually gets one
 * taken away. The only dependable cure for a style-less map is to throw the
 * instance away and mount a fresh one.
 *
 * Pass `attachMap` as the map's `ref` (it forwards the instance to `mapRef`)
 * and `mapKey` as its `key`. `setMapLoaded(false)` runs alongside the key bump
 * so effects gated on `mapLoaded` re-attach to the replacement.
 */
export const useWebGLContextRecovery = (
  mapRef: React.RefObject<MapRef | null>,
  setMapLoaded: (loaded: boolean) => void
) => {
  const [mapKey, setMapKey] = useState(0)
  const remountsRef = useRef(0)
  const detachRef = useRef<(() => void) | null>(null)

  const attachMap = useCallback(
    (instance: MapRef | null) => {
      detachRef.current?.()
      detachRef.current = null
      mapRef.current = instance

      const map = instance?.getMap()
      if (!map) return

      let recoveryCheck: ReturnType<typeof setTimeout> | null = null

      // MapLibre assigns `style` synchronously when the map is constructed and
      // whenever the style is swapped, so a null one always means the map died
      // with the context rather than a load still being in flight.
      const replaceIfDead = () => {
        if (mapRef.current?.getMap()?.style) return

        detachRef.current?.()
        detachRef.current = null

        if (remountsRef.current >= MAX_REMOUNTS) {
          console.warn('Map lost its WebGL context and could not be recovered')
          return
        }

        remountsRef.current += 1
        setMapLoaded(false)
        setMapKey((key) => key + 1)
      }

      const onContextLost = () => {
        recoveryCheck = setTimeout(replaceIfDead, RECOVERY_CHECK_DELAY_MS)
      }

      const canvas = map.getCanvas()
      canvas.addEventListener('webglcontextlost', onContextLost)
      const watchdog = setInterval(replaceIfDead, WATCHDOG_INTERVAL_MS)

      detachRef.current = () => {
        canvas.removeEventListener('webglcontextlost', onContextLost)
        clearInterval(watchdog)
        if (recoveryCheck) clearTimeout(recoveryCheck)
      }
    },
    [mapRef, setMapLoaded]
  )

  useEffect(() => () => detachRef.current?.(), [])

  return { mapKey, attachMap }
}
