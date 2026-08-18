import { PRIORITY_COLOR } from '@/types/Priority'
import { STATUS_CONFIG } from './const'
import { TASK_TYPE_KEYS, TASK_TYPE_SYMBOL_SVG, type TaskTypeKey } from './taskTypes'

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
const registerIcon = (
  map: React.RefObject<maplibregl.Map | null>,
  iconName: string,
  svg: string,
  size: { width: number; height: number },
  onRegistered?: () => void
) => {
  const currentMap = map.current
  if (!currentMap) return

  try {
    if (currentMap.hasImage(iconName)) {
      return
    }
  } catch {
    return
  }

  const icon = new Image(size.width * PIXEL_RATIO, size.height * PIXEL_RATIO)
  icon.src = `data:image/svg+xml;base64,${btoa(svg)}`
  icon.onload = () => {
    const mapInstance = map.current
    if (!mapInstance) return
    try {
      if (!mapInstance.hasImage(iconName)) {
        mapInstance.addImage(iconName, icon, { pixelRatio: PIXEL_RATIO })
        onRegistered?.()
      }
    } catch {}
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

export const createMarkerIcons = (
  map: React.RefObject<maplibregl.Map | null>,
  onComplete?: () => void
) => {
  if (!map.current) return

  let iconsLoaded = 0
  let callbackFired = false

  const addIconsWhenReady = () => {
    const currentMap = map.current
    if (!currentMap) return

    const getBorderSuffix = (borderColor: string): string => {
      switch (borderColor) {
        case '#8b5cf6':
          return 'selected'
        case '#22c55e':
          return 'bundled'
        case '#f59e0b':
          return 'primary'
        case '#eab308':
          return 'lasso'
        default:
          return 'selected'
      }
    }

    const createMarkerIcon = (
      status: string,
      color: string,
      priority: number,
      borderColor?: string,
      suffixOverride?: string
    ) => {
      const iconName = borderColor
        ? `marker-pin-${status}-${priority}-${suffixOverride ?? getBorderSuffix(borderColor)}`
        : `marker-pin-${status}-${priority}`

      const pinSvg = buildMarkerSvg(color, borderColor ?? '#000000', Number(status), priority)

      registerIcon(map, iconName, pinSvg, { width: 27, height: 36 }, () => {
        iconsLoaded++
        if (onComplete && iconsLoaded >= 20 && !callbackFired) {
          callbackFired = true
          onComplete()
        }
      })
    }

    const createDualBorderMarkerIcon = (
      status: string,
      color: string,
      priority: number,
      outerColor: string,
      innerColor: string,
      suffix: string
    ) => {
      const iconName = `marker-pin-${status}-${priority}-${suffix}`

      const pinSvg = buildDualBorderMarkerSvg(
        color,
        outerColor,
        innerColor,
        Number(status),
        priority
      )

      registerIcon(map, iconName, pinSvg, { width: 27, height: 36 }, () => {
        iconsLoaded++
      })
    }

    const PRIORITY_LEVELS = [0, 1, 2]
    Object.entries(STATUS_CONFIG).forEach(([status, { color }]) => {
      PRIORITY_LEVELS.forEach((priority) => {
        createMarkerIcon(status, color, priority)

        createMarkerIcon(status, color, priority, '#8b5cf6')

        createMarkerIcon(status, color, priority, '#22c55e')

        createMarkerIcon(status, color, priority, '#f59e0b')

        createMarkerIcon(status, color, priority, '#3b82f6', 'hovered')

        createMarkerIcon(status, color, priority, '#eab308')

        createDualBorderMarkerIcon(
          status,
          color,
          priority,
          '#8b5cf6',
          '#22c55e',
          'bundled-selected'
        )

        createDualBorderMarkerIcon(
          status,
          color,
          priority,
          '#8b5cf6',
          '#f59e0b',
          'primary-selected'
        )

        createDualBorderMarkerIcon(status, color, priority, '#8b5cf6', '#eab308', 'lasso-selected')
      })
    })

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

    const createTypeMarkerIcon = (
      typeKey: TaskTypeKey,
      priority: number,
      borderColor: string = '#000000',
      suffix?: string
    ) => {
      const iconName = suffix
        ? `marker-type-${typeKey}-${priority}-${suffix}`
        : `marker-type-${typeKey}-${priority}`
      const pinSvg = buildTypeMarkerSvg(typeKey, priority, borderColor)
      registerIcon(map, iconName, pinSvg, { width: 27, height: 36 })
    }

    TASK_TYPE_KEYS.forEach((typeKey) => {
      ;[0, 1, 2].forEach((priority) => {
        createTypeMarkerIcon(typeKey, priority)
        // Purple-bordered selected variant — same border treatment as
        // marker-pin-…-selected, so the type indicator stays visible when a
        // task is clicked or rendered on the spider/selected overlay.
        createTypeMarkerIcon(typeKey, priority, '#8b5cf6', 'selected')
      })
    })

    const createOverlapIcon = (
      taskCount: number | string,
      iconName: string,
      borderColor?: string,
      borderWidth = 4
    ) => {
      const displayText = typeof taskCount === 'number' ? String(taskCount) : taskCount
      const fontSize = typeof taskCount === 'number' && taskCount >= 10 ? '9' : '10'
      const textY = typeof taskCount === 'number' && taskCount >= 10 ? '15' : '16'

      const darkBlue = '#1e3a8a'

      const overlapPinSvg = borderColor
        ? `
        <svg width="32" height="44" viewBox="-4 -4 32 44" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
                fill="${darkBlue}" stroke="${borderColor}" stroke-width="${borderWidth}" stroke-linejoin="round"/>
          <circle cx="12" cy="12" r="7" fill="white"/>
          <text x="12" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${darkBlue}">${displayText}</text>
        </svg>`
        : `
        <svg width="32" height="44" viewBox="-4 -4 32 44" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
                fill="${darkBlue}" stroke="white" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="12" cy="12" r="7" fill="white"/>
          <text x="12" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${darkBlue}">${displayText}</text>
        </svg>`

      registerIcon(map, iconName, overlapPinSvg, { width: 32, height: 44 })
    }

    const createDualBorderOverlapIcon = (
      taskCount: number | string,
      iconName: string,
      outerColor: string,
      innerColor: string
    ) => {
      const displayText = typeof taskCount === 'number' ? String(taskCount) : taskCount
      const fontSize = typeof taskCount === 'number' && taskCount >= 10 ? '9' : '10'
      const textY = typeof taskCount === 'number' && taskCount >= 10 ? '15' : '16'
      const darkBlue = '#1e3a8a'

      const overlapPinSvg = `
        <svg width="32" height="44" viewBox="-4 -4 32 44" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
                fill="${darkBlue}" stroke="${outerColor}" stroke-width="5" stroke-linejoin="round"/>
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
                fill="none" stroke="${innerColor}" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="12" cy="12" r="7" fill="white"/>
          <text x="12" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${darkBlue}">${displayText}</text>
        </svg>`

      registerIcon(map, iconName, overlapPinSvg, { width: 32, height: 44 })
    }

    for (let taskCount = 2; taskCount <= 20; taskCount++) {
      createOverlapIcon(taskCount, `marker-overlap-${taskCount}`)

      createOverlapIcon(taskCount, `marker-overlap-${taskCount}-selected`, '#8b5cf6', 3)

      createOverlapIcon(taskCount, `marker-overlap-${taskCount}-bundled`, '#22c55e', 3)

      createOverlapIcon(taskCount, `marker-overlap-${taskCount}-primary`, '#f59e0b', 3)

      createOverlapIcon(taskCount, `marker-overlap-${taskCount}-hovered`, '#3b82f6', 3)

      createOverlapIcon(taskCount, `marker-overlap-${taskCount}-lasso`, '#eab308', 3)

      createDualBorderOverlapIcon(
        taskCount,
        `marker-overlap-${taskCount}-bundled-selected`,
        '#8b5cf6',
        '#22c55e'
      )

      createDualBorderOverlapIcon(
        taskCount,
        `marker-overlap-${taskCount}-primary-selected`,
        '#8b5cf6',
        '#f59e0b'
      )

      createDualBorderOverlapIcon(
        taskCount,
        `marker-overlap-${taskCount}-lasso-selected`,
        '#8b5cf6',
        '#eab308'
      )
    }

    createOverlapIcon('20+', 'marker-overlap-many')
    createOverlapIcon('20+', 'marker-overlap-many-selected', '#8b5cf6', 3)
    createOverlapIcon('20+', 'marker-overlap-many-bundled', '#22c55e', 3)
    createOverlapIcon('20+', 'marker-overlap-many-primary', '#f59e0b', 3)
    createOverlapIcon('20+', 'marker-overlap-many-hovered', '#3b82f6', 3)
    createOverlapIcon('20+', 'marker-overlap-many-lasso', '#eab308', 3)
    createDualBorderOverlapIcon('20+', 'marker-overlap-many-bundled-selected', '#8b5cf6', '#22c55e')
    createDualBorderOverlapIcon('20+', 'marker-overlap-many-primary-selected', '#8b5cf6', '#f59e0b')
    createDualBorderOverlapIcon('20+', 'marker-overlap-many-lasso-selected', '#8b5cf6', '#eab308')
  }

  const currentMap = map.current
  if (!currentMap) return

  if (currentMap.isStyleLoaded()) {
    addIconsWhenReady()
  } else {
    const onStyleLoad = () => {
      if (map.current) {
        addIconsWhenReady()
        map.current.off('styledata', onStyleLoad)
      }
    }
    currentMap.on('styledata', onStyleLoad)
  }
}
