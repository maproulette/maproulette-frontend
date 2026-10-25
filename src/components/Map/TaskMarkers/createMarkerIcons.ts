import { PRIORITY_COLOR } from '@/types/Priority'
import { STATUS_CONFIG } from './const'
import { isTaskTypeKey, TASK_TYPE_SYMBOL_SVG, type TaskTypeKey } from './taskTypes'

const PIXEL_RATIO = 4

const STATUS_SYMBOL_SVG: Record<number, string> = {
  0: `<g transform="translate(7.5 7.5) scale(0.5)" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></g>`,

  1: `<g transform="translate(7.5 7.5) scale(0.5)" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></g>`,

  2: `<g transform="translate(7.5 7.5) scale(0.5)" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.6" fill="#0f172a" stroke="none"/></g>`,

  4: `<g transform="translate(7.5 7.5) scale(0.5)" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></g>`,

  5: `<g transform="translate(7.5 7.5) scale(0.5)" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></g>`,

  6: `<g transform="translate(7.5 7.5) scale(0.5)" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4"/><circle cx="12" cy="17" r="0.6" fill="#0f172a" stroke="none"/></g>`,
}

/**
 * Shared boilerplate for registering a single SVG icon with the map:
 * guards against re-registering an already-loaded icon, builds an Image
 * from base64-encoded SVG, and calls `map.addImage` once it loads.
 *
 * `onRegistered` fires only when `addImage` actually runs (i.e. the icon
 * wasn't already registered by the time the image finished loading).
 */
export const registerIcon = (
  map: React.RefObject<maplibregl.Map | null>,
  iconName: string,
  svg: string,
  size: { width: number; height: number },
  onRegistered?: () => void
) => {
  const currentMap = map.current
  if (!currentMap?.style || currentMap.hasImage(iconName)) return

  const icon = new Image(size.width * PIXEL_RATIO, size.height * PIXEL_RATIO)
  icon.src = `data:image/svg+xml;base64,${btoa(svg)}`
  icon.onload = () => {
    const mapInstance = map.current
    if (!mapInstance?.style || mapInstance.hasImage(iconName)) return
    mapInstance.addImage(iconName, icon, { pixelRatio: PIXEL_RATIO })
    onRegistered?.()
  }
}

const getStatusSymbol = (status: number): string =>
  STATUS_SYMBOL_SVG[status] ?? STATUS_SYMBOL_SVG[0]

const getPriorityHex = (priority: number): string =>
  PRIORITY_COLOR[priority as 0 | 1 | 2]?.hex ?? PRIORITY_COLOR[1].hex

const PRIORITY_CLIP_ID = 'priority-slice-clip'

const buildPriorityClipDef = (): string =>
  `<defs><clipPath id="${PRIORITY_CLIP_ID}"><path d="${BG_PATH}"/></clipPath></defs>`

const buildPrioritySlice = (priority: number): string =>
  `<polygon points="5.85,-10 50,-10 50,40 29.19,40" fill="${getPriorityHex(priority)}" clip-path="url(#${PRIORITY_CLIP_ID})"/>`

const BG_PATH =
  'M2.5,14.8001594 C2.5,18.0978578 3.35630335,20.5402912 5.50868313,23.5355445 C5.52719928,23.5613116 7.45112679,26.0422944 8.30657284,27.1640812 C8.3765299,27.2558499 8.3765299,27.2558499 8.44645166,27.3476997 C9.55271803,28.8014241 10.3631867,29.9029307 10.8139652,30.5815314 C11.4897184,31.5988082 12.1031817,32.6194663 12.6736251,33.6787945 C13.1630732,34.1070685 13.8369268,34.1070685 14.326375,33.6787944 C14.8968182,32.6194666 15.5102815,31.5988085 16.1860348,30.5815314 C16.6368133,29.9029307 17.4472819,28.8014241 18.5535483,27.3476997 C18.6234701,27.2558499 18.6234701,27.2558499 18.6934271,27.1640812 C19.5488733,26.0422943 21.4728008,23.5613115 21.4913169,23.5355444 C23.6436967,20.5402912 24.5,18.0978578 24.5,14.8001594 C24.5,7.70712432 19.5553889,2 13.5,2 C7.44461108,2 2.5,7.70712431 2.5,14.8001594 Z'

const BORDER_PATH =
  'M26.5,14.8001594 C26.5,18.5359281 25.5026664,21.3806221 23.1154655,24.7026525 C23.0719184,24.7632527 21.1168716,27.2843651 20.283777,28.3768415 C20.2144135,28.4678314 20.2144135,28.4678314 20.1451151,28.5588624 C19.0646506,29.9786811 18.27126,31.0569769 17.8519708,31.6881736 C17.2099278,32.6547034 16.6281975,33.6225654 16.0872923,34.6270403 L16.0015084,34.7863433 C15.9447797,34.8916901 15.8696054,34.9860011 15.7795603,35.0647919 L15.6433962,35.1839374 C14.3998922,36.2720209 12.6001078,36.2720209 11.3566038,35.1839374 L11.2204397,35.0647919 C11.1303946,34.9860011 11.0552203,34.8916901 10.9984916,34.7863433 L10.9127077,34.6270403 C10.3718024,33.6225651 9.79007204,32.6547031 9.14802915,31.6881736 C8.72873994,31.0569769 7.93534938,29.9786811 6.85488487,28.5588624 C6.78558643,28.4678314 6.78558643,28.4678314 6.71622299,28.3768415 C5.88312845,27.2843652 3.92808163,24.7632528 3.88453453,24.7026526 C1.49733361,21.3806221 0.5,18.5359281 0.5,14.8001594 C0.5,6.66120274 6.2712177,0 13.5,0 C20.7287823,0 26.5,6.66120275 26.5,14.8001594 Z M2.5,14.8001594 C2.5,18.0978578 3.35630335,20.5402912 5.50868313,23.5355445 C5.52719928,23.5613116 7.45112679,26.0422944 8.30657284,27.1640812 C8.3765299,27.2558499 8.3765299,27.2558499 8.44645166,27.3476997 C9.55271803,28.8014241 10.3631867,29.9029307 10.8139652,30.5815314 C11.4897184,31.5988082 12.1031817,32.6194663 12.6736251,33.6787945 C13.1630732,34.1070685 13.8369268,34.1070685 14.326375,33.6787944 C14.8968182,32.6194666 15.5102815,31.5988085 16.1860348,30.5815314 C16.6368133,29.9029307 17.4472819,28.8014241 18.5535483,27.3476997 C18.6234701,27.2558499 18.6234701,27.2558499 18.6934271,27.1640812 C19.5488733,26.0422943 21.4728008,23.5613115 21.4913169,23.5355444 C23.6436967,20.5402912 24.5,18.0978578 24.5,14.8001594 C24.5,7.70712432 19.5553889,2 13.5,2 C7.44461108,2 2.5,7.70712431 2.5,14.8001594 Z'

const buildMarkerSvg = (color: string, borderColor: string, status: number, priority: number) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27 36">
    ${buildPriorityClipDef()}
    <path data-name="Background" fill="${color}" d="${BG_PATH}"/>
    ${buildPrioritySlice(priority)}
    <path data-name="Border" fill="${borderColor}" d="${BORDER_PATH}"/>
    <circle data-name="Marker label background" fill="#FFFFFF" cx="13.5" cy="13.5" r="7.5"/>
    ${getStatusSymbol(status)}
  </svg>`

/** Pixel dimensions of the pin artwork above, and so of every registered marker icon. */
export const TASK_MARKER_SIZE = { width: 27, height: 36 }

/**
 * Data URI for the plain (unselected) task pin — the very artwork `createMarkerIcons`
 * registers with the map, so a one-off DOM marker matches the pins on the big maps.
 */
export const taskMarkerDataUri = (status: number, priority: number): string => {
  const { color } = STATUS_CONFIG[status] ?? STATUS_CONFIG[0]
  return `data:image/svg+xml;base64,${btoa(buildMarkerSvg(color, '#000000', status, priority))}`
}

const buildDualBorderMarkerSvg = (
  color: string,
  outerColor: string,
  innerColor: string,
  status: number,
  priority: number
) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27 36">
    ${buildPriorityClipDef()}
    <path data-name="Background" fill="${color}" d="${BG_PATH}" stroke="${innerColor}" stroke-width="1.5"/>
    ${buildPrioritySlice(priority)}
    <path data-name="Border" fill="${outerColor}" d="${BORDER_PATH}"/>
    <circle data-name="Marker label background" fill="#FFFFFF" cx="13.5" cy="13.5" r="7.5"/>
    ${getStatusSymbol(status)}
  </svg>`

const BORDER_COLORS: Record<string, string> = {
  selected: '#8b5cf6',
  bundled: '#22c55e',
  primary: '#f59e0b',
  hovered: '#3b82f6',
  lasso: '#eab308',
}

type Border =
  | { kind: 'plain' }
  | { kind: 'single'; color: string }
  | { kind: 'dual'; outer: string; inner: string }

const parseBorder = (suffix: string | undefined): Border | null => {
  if (!suffix) return { kind: 'plain' }
  if (BORDER_COLORS[suffix]) return { kind: 'single', color: BORDER_COLORS[suffix] }
  const inner = suffix.endsWith('-selected')
    ? BORDER_COLORS[suffix.slice(0, -'-selected'.length)]
    : undefined
  return inner ? { kind: 'dual', outer: BORDER_COLORS.selected, inner } : null
}

const buildPinSvg = (status: number, priority: number, border: Border): string => {
  const { color } = STATUS_CONFIG[status]
  switch (border.kind) {
    case 'plain':
      return buildMarkerSvg(color, '#000000', status, priority)
    case 'single':
      return buildMarkerSvg(color, border.color, status, priority)
    case 'dual':
      return buildDualBorderMarkerSvg(color, border.outer, border.inner, status, priority)
  }
}

const TYPE_PIN_COLOR = '#22d3ee'

const buildTypeMarkerSvg = (typeKey: TaskTypeKey, priority: number, borderColor: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27 36">
    ${buildPriorityClipDef()}
    <path data-name="Background" fill="${TYPE_PIN_COLOR}" d="${BG_PATH}"/>
    ${buildPrioritySlice(priority)}
    <path data-name="Border" fill="${borderColor}" d="${BORDER_PATH}"/>
    <circle data-name="Marker label background" fill="#FFFFFF" cx="13.5" cy="13.5" r="7.5"/>
    ${TASK_TYPE_SYMBOL_SVG[typeKey]}
  </svg>`

const OVERLAP_SIZE = { width: 32, height: 44 }
const OVERLAP_FILL = '#1e3a8a'
const OVERLAP_PATH = 'M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z'

const buildOverlapSvg = (taskCount: number | 'many', border: Border): string => {
  const twoDigits = typeof taskCount === 'number' && taskCount >= 10
  const label = taskCount === 'many' ? '20+' : String(taskCount)
  const outline =
    border.kind === 'dual'
      ? `<path d="${OVERLAP_PATH}" fill="${OVERLAP_FILL}" stroke="${border.outer}" stroke-width="5" stroke-linejoin="round"/>
         <path d="${OVERLAP_PATH}" fill="none" stroke="${border.inner}" stroke-width="2" stroke-linejoin="round"/>`
      : `<path d="${OVERLAP_PATH}" fill="${OVERLAP_FILL}" stroke="${border.kind === 'single' ? border.color : 'white'}" stroke-width="${border.kind === 'single' ? 3 : 2}" stroke-linejoin="round"/>`

  return `
    <svg width="32" height="44" viewBox="-4 -4 32 44" xmlns="http://www.w3.org/2000/svg">
      ${outline}
      <circle cx="12" cy="12" r="7" fill="white"/>
      <text x="12" y="${twoDigits ? 15 : 16}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${twoDigits ? 9 : 10}" font-weight="bold" fill="${OVERLAP_FILL}">${label}</text>
    </svg>`
}

type MarkerIcon = { svg: string; size: { width: number; height: number } }

export const markerIcon = (name: string): MarkerIcon | null => {
  const pin = /^marker-pin-(\d+)-([0-2])(?:-(.+))?$/.exec(name)
  if (pin) {
    const status = Number(pin[1])
    const border = parseBorder(pin[3])
    if (!STATUS_CONFIG[status] || !border) return null
    return { svg: buildPinSvg(status, Number(pin[2]), border), size: TASK_MARKER_SIZE }
  }

  const type = /^marker-type-([a-z]+)-([0-2])(-selected)?$/.exec(name)
  if (type) {
    const typeKey = type[1]
    if (!isTaskTypeKey(typeKey)) return null
    const borderColor = type[3] ? BORDER_COLORS.selected : '#000000'
    return {
      svg: buildTypeMarkerSvg(typeKey, Number(type[2]), borderColor),
      size: TASK_MARKER_SIZE,
    }
  }

  const overlap = /^marker-overlap-(\d+|many)(?:-(.+))?$/.exec(name)
  if (overlap) {
    const border = parseBorder(overlap[2])
    if (!border) return null
    const taskCount = overlap[1] === 'many' ? 'many' : Number(overlap[1])
    return { svg: buildOverlapSvg(taskCount, border), size: OVERLAP_SIZE }
  }

  return null
}

const RENDERED_ICON_LIMIT = 64
const renderedIcons = new Map<string, HTMLImageElement>()
const pendingIcons = new Map<string, Promise<HTMLImageElement>>()

const cachedIcon = (name: string): HTMLImageElement | undefined => {
  const icon = renderedIcons.get(name)
  if (icon) {
    renderedIcons.delete(name)
    renderedIcons.set(name, icon)
  }
  return icon
}

const cacheIcon = (name: string, icon: HTMLImageElement) => {
  renderedIcons.set(name, icon)
  for (const oldest of renderedIcons.keys()) {
    if (renderedIcons.size <= RENDERED_ICON_LIMIT) break
    renderedIcons.delete(oldest)
  }
}

const renderIcon = (name: string, { svg, size }: MarkerIcon): Promise<HTMLImageElement> => {
  const pending = pendingIcons.get(name)
  if (pending) return pending

  const icon = new Image(size.width * PIXEL_RATIO, size.height * PIXEL_RATIO)
  const rendered = new Promise<HTMLImageElement>((resolve, reject) => {
    icon.onload = () => resolve(icon)
    icon.onerror = () => reject(new Error(`Could not render map icon "${name}"`))
    icon.src = `data:image/svg+xml;base64,${btoa(svg)}`
  })
    .then(() => {
      cacheIcon(name, icon)
      return icon
    })
    .finally(() => pendingIcons.delete(name))

  pendingIcons.set(name, rendered)
  return rendered
}

export const attachMarkerIcons = (map: maplibregl.Map): (() => void) => {
  let attached = true

  const onImageMissing = ({ id }: { id: string }) => {
    const cached = cachedIcon(id)
    if (cached) {
      map.addImage(id, cached, { pixelRatio: PIXEL_RATIO })
      return
    }

    const icon = markerIcon(id)
    if (!icon) return

    const width = icon.size.width * PIXEL_RATIO
    const height = icon.size.height * PIXEL_RATIO
    map.addImage(
      id,
      { width, height, data: new Uint8Array(width * height * 4) },
      { pixelRatio: PIXEL_RATIO }
    )

    void renderIcon(id, icon).then((rendered) => {
      if (!attached || !map.hasImage(id)) return
      map.updateImage(id, rendered)
      map.triggerRepaint()
    })
  }

  map.on('styleimagemissing', onImageMissing)
  return () => {
    attached = false
    map.off('styleimagemissing', onImageMissing)
  }
}
