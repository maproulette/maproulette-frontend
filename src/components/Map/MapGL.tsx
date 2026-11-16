import { useEffect } from 'react'
import { type MapProps, type MapRef, Map as ReactMapGL, useMap } from 'react-map-gl/maplibre'
import { formatMapHash, parseMapHash } from './mapUrlHash'

type MapGLProps = Omit<
  MapProps,
  'hash' | 'reuseMaps' | 'refreshExpiredTiles' | 'maxTileCacheZoomLevels'
> & {
  hash?: boolean
  ref?: React.Ref<MapRef>
}

export const MapGL = ({ hash = false, children, ...props }: MapGLProps) => (
  <ReactMapGL {...props} reuseMaps refreshExpiredTiles={false} maxTileCacheZoomLevels={10}>
    {hash && <MapUrlHash />}
    {children}
  </ReactMapGL>
)

const MapUrlHash = () => {
  const { current } = useMap()

  useEffect(() => {
    const map = current?.getMap()
    if (!map) return

    const readHash = () => {
      const view = parseMapHash(window.location.hash)
      if (view) map.jumpTo(view)
      return view !== null
    }
    const writeHash = () => {
      const url = window.location.href.replace(/(#.*)?$/, formatMapHash(map))
      window.history.replaceState(window.history.state, '', url)
    }

    if (!readHash()) writeHash()
    map.on('moveend', writeHash)
    window.addEventListener('hashchange', readHash)
    return () => {
      map.off('moveend', writeHash)
      window.removeEventListener('hashchange', readHash)
    }
  }, [current])

  return null
}
