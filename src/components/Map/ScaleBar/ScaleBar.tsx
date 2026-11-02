import { useEffect, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

const METRIC_STEPS_METERS = [
  1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000,
  1000000, 2000000, 5000000,
]
const FEET_PER_MILE = 5280
const IMPERIAL_STEPS_FEET = [
  1,
  2,
  5,
  10,
  20,
  50,
  100,
  200,
  500,
  1000,
  2000,
  FEET_PER_MILE,
  2 * FEET_PER_MILE,
  5 * FEET_PER_MILE,
  10 * FEET_PER_MILE,
  20 * FEET_PER_MILE,
  50 * FEET_PER_MILE,
  100 * FEET_PER_MILE,
  200 * FEET_PER_MILE,
  500 * FEET_PER_MILE,
  1000 * FEET_PER_MILE,
  2000 * FEET_PER_MILE,
]

interface ScaleInfo {
  label: string
  width: number
}

type TFunction = ReturnType<typeof useIntl>['t']

const formatMetric = (meters: number, t: TFunction): string => {
  if (meters >= 1000) {
    const km = meters / 1000
    return t({ id: 'map.scaleBar.kilometers', defaultMessage: '{value} km' }, { value: km % 1 === 0 ? km.toFixed(0) : km.toFixed(1) }
    )
  }
  return t({ id: 'map.scaleBar.meters', defaultMessage: '{value} m' }, { value: meters })
}

const formatImperial = (feet: number, t: TFunction): string => {
  if (feet >= FEET_PER_MILE) {
    const mi = feet / FEET_PER_MILE
    return t({ id: 'map.scaleBar.miles', defaultMessage: '{value} mi' }, { value: mi % 1 === 0 ? mi.toFixed(0) : mi.toFixed(1) }
    )
  }
  return t({ id: 'map.scaleBar.feet', defaultMessage: '{value} ft' }, { value: feet })
}

const pickStep = (steps: number[], max: number): number => {
  let chosen = steps[0]
  for (const s of steps) {
    if (s <= max) chosen = s
    else break
  }
  return chosen
}

interface Props {
  mapRef: React.RefObject<MapRef | null>
  mapLoaded?: boolean
  maxWidth?: number
  className?: string
}

export const ScaleBar = ({ mapRef, mapLoaded, maxWidth = 100, className }: Props) => {
  const { t } = useIntl()
  const [metric, setMetric] = useState<ScaleInfo | null>(null)
  const [imperial, setImperial] = useState<ScaleInfo | null>(null)

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    const update = () => {
      const containerHeight = map.getContainer().clientHeight
      const y = containerHeight / 2
      const p1 = map.unproject([0, y])
      const p2 = map.unproject([maxWidth, y])
      const distanceMeters = p1.distanceTo(p2)
      if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return
      const metersPerPixel = distanceMeters / maxWidth

      const metricMax = maxWidth * metersPerPixel
      const metricChosen = pickStep(METRIC_STEPS_METERS, metricMax)
      setMetric({
        label: formatMetric(metricChosen, t),
        width: metricChosen / metersPerPixel,
      })

      const feetPerMeter = 3.28084
      const imperialMax = maxWidth * metersPerPixel * feetPerMeter
      const imperialChosen = pickStep(IMPERIAL_STEPS_FEET, imperialMax)
      setImperial({
        label: formatImperial(imperialChosen, t),
        width: imperialChosen / (metersPerPixel * feetPerMeter),
      })
    }

    update()
    map.on('move', update)
    map.on('load', update)
    return () => {
      map.off('move', update)
      map.off('load', update)
    }
  }, [mapRef, maxWidth, mapLoaded, t])

  if (!metric || !imperial) return null

  return (
    <div
      className={cn(
        'flex flex-col rounded-md bg-white/95 px-2 py-1 shadow-md backdrop-blur dark:bg-slate-900/95',
        className
      )}
    >
      <ScaleBarRow info={metric} placement="top" />
      <ScaleBarRow info={imperial} placement="bottom" />
    </div>
  )
}

const ScaleBarRow = ({ info, placement }: { info: ScaleInfo; placement: 'top' | 'bottom' }) => (
  <div className="flex items-center gap-1.5">
    <div
      className={cn(
        'h-2 border-zinc-700 border-r border-l dark:border-zinc-300',
        placement === 'top' ? 'border-b' : 'border-t'
      )}
      style={{ width: `${Math.round(info.width)}px` }}
      aria-hidden="true"
    />
    <span className="text-[10px] text-zinc-700 leading-none dark:text-zinc-300">{info.label}</span>
  </div>
)
