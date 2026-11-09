import { MoveRight } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import type { MapControlButton } from '@/components/Map/MapControls'
import { type KeyboardShortcut, useRegisterShortcuts } from '@/contexts/KeyboardShortcutsContext'
import { useIntl } from '@/i18n'
import type { ShortcutBinding } from '@/lib/keyboardShortcuts'

export const DIRECTIONS_BINDING = { key: 's' } satisfies ShortcutBinding

interface DirectionsControlOptions {
  show: boolean
  onToggle: (show: boolean) => void
  disabled: boolean
  t: ReturnType<typeof useIntl>['t']
}

export const directionsControlButton = ({
  show,
  onToggle,
  disabled,
  t,
}: DirectionsControlOptions): MapControlButton => ({
  id: 'toggle-direction-indicators',
  icon: MoveRight,
  onClick: () => onToggle(!show),
  tooltip: show
    ? t({
        id: 'taskMap.controls.hideDirectionIndicators',
        defaultMessage: 'Hide direction indicators',
      })
    : t({
        id: 'taskMap.controls.showDirectionIndicators',
        defaultMessage: 'Show direction indicators',
      }),
  disabled,
  isActive: show,
  binding: DIRECTIONS_BINDING,
})

const useDirectionsShortcut = (
  show: boolean,
  onToggle: (show: boolean) => void,
  enabled: boolean
) => {
  const { t } = useIntl()
  const id = useId()

  const shortcuts = useMemo<KeyboardShortcut[]>(
    () => [
      {
        ...DIRECTIONS_BINDING,
        description: t({
          id: 'taskMap.shortcuts.toggleDirectionIndicators',
          defaultMessage: 'Toggle direction indicators on task geometry',
        }),
        category: 'map',
        handler: () => onToggle(!show),
        enabled,
      },
    ],
    [show, onToggle, enabled, t]
  )

  useRegisterShortcuts(`direction-indicators-${id}`, shortcuts)
}

export const useDirectionsToggle = (mapLoaded: boolean) => {
  const { t } = useIntl()
  const [showDirections, setShowDirections] = useState(true)

  useDirectionsShortcut(showDirections, setShowDirections, mapLoaded)

  const directionsButton = useMemo(
    () =>
      directionsControlButton({
        show: showDirections,
        onToggle: setShowDirections,
        disabled: !mapLoaded,
        t,
      }),
    [showDirections, mapLoaded, t]
  )

  return { showDirections, directionsButton }
}
