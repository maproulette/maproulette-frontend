import { useId, useMemo } from 'react'
import { z } from 'zod'
import { MapSettingSwitch } from '@/components/Map/MapSettings'
import { type KeyboardShortcut, useRegisterShortcuts } from '@/contexts/KeyboardShortcutsContext'
import { useIntl } from '@/i18n'
import type { ShortcutBinding } from '@/lib/keyboardShortcuts'
import { localStored, useStored } from '@/lib/storage'

export const DIRECTIONS_BINDING = { key: 's' } satisfies ShortcutBinding

const showDirections = localStored('map.showDirections', z.boolean(), true)

export const useStoredDirections = () => useStored(showDirections)

export const DirectionsSetting = ({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) => {
  const { t } = useIntl()
  return (
    <MapSettingSwitch
      label={t({
        id: 'map.settings.directionIndicators',
        defaultMessage: 'Direction indicators',
      })}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      binding={DIRECTIONS_BINDING}
    />
  )
}

export const useDirectionsToggle = (mapLoaded: boolean) => {
  const { t } = useIntl()
  const id = useId()
  const [showDirections, setShowDirections] = useStoredDirections()

  const shortcuts = useMemo<KeyboardShortcut[]>(
    () => [
      {
        ...DIRECTIONS_BINDING,
        description: t({
          id: 'taskMap.shortcuts.toggleDirectionIndicators',
          defaultMessage: 'Toggle direction indicators on task geometry',
        }),
        category: 'map',
        handler: () => setShowDirections(!showDirections),
        enabled: mapLoaded,
      },
    ],
    [showDirections, setShowDirections, mapLoaded, t]
  )

  useRegisterShortcuts(`direction-indicators-${id}`, shortcuts)

  return { showDirections, setShowDirections }
}
