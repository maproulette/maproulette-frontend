import { logger } from '@/lib/logger'
import type { Bbox2D } from '@/types/Map'

export const JOSM_HOST = 'http://127.0.0.1:8111/'

const TILE_SIZE = 256

export const josmLoadObjectsUrl = (objectIds: string[], asNewLayer: boolean): string => {
  const objects = objectIds.join(',')
  const url = `${JOSM_HOST}load_object?objects=${objects}&layer_name=${objects}`
  return asNewLayer ? `${url}&new_layer=true` : url
}

export const josmZoomUrl = ([west, south, east, north]: Bbox2D): string =>
  `${JOSM_HOST}zoom?left=${west}&bottom=${south}&right=${east}&top=${north}`

export const viewportToBbox = (
  zoom: number,
  lat: number,
  lon: number,
  width: number,
  height: number
): Bbox2D => {
  const worldSize = TILE_SIZE * 2 ** zoom
  const sinLat = Math.sin((lat * Math.PI) / 180)
  const x = ((lon + 180) / 360) * worldSize
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * worldSize
  const toLon = (px: number) => (px / worldSize) * 360 - 180
  const toLat = (py: number) =>
    (Math.atan(Math.sinh(Math.PI - (2 * Math.PI * py) / worldSize)) * 180) / Math.PI
  return [toLon(x - width / 2), toLat(y + height / 2), toLon(x + width / 2), toLat(y - height / 2)]
}

const JOSM_COMMAND_DELAY_MS = 1000

const isSafari = () => 'safari' in window

export const sendJosmCommand = async (url: string): Promise<boolean> => {
  if (isSafari()) {
    const tab = window.open(url)
    await new Promise((resolve) => setTimeout(resolve, JOSM_COMMAND_DELAY_MS))
    if (tab && !tab.closed) tab.close()
    return true
  }

  try {
    const response = await fetch(url)
    return response.status === 200
  } catch (error) {
    logger.warn('JOSM remote control did not respond', { url, error })
    return false
  }
}

export const sendJosmCommands = async (urls: string[]): Promise<boolean> => {
  if (isSafari()) {
    await Promise.all(urls.map((url) => sendJosmCommand(url)))
    return true
  }

  const [first, ...rest] = urls
  if (first && !(await sendJosmCommand(first))) return false
  for (const url of rest) {
    await new Promise((resolve) => setTimeout(resolve, JOSM_COMMAND_DELAY_MS))
    await sendJosmCommand(url)
  }
  return true
}
