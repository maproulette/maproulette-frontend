import { Layers, Settings2, ZoomIn, ZoomOut } from 'lucide-react'
import type { ReactNode } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { MapStyleSwitcher } from '@/components/Map/MapStyleSwitcher'
import { Button } from '@/components/ui/Button'
import { KbdBinding } from '@/components/ui/Kbd'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'
import { useIntl } from '@/i18n'
import type { ShortcutBinding } from '@/lib/keyboardShortcuts'
import { cn } from '@/lib/utils'

export interface MapControlButton {
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  tooltip?: string
  disabled?: boolean
  id?: string
  /** Shortcut that does the same thing, shown as a key cap in the tooltip. */
  binding?: ShortcutBinding
}

export interface MapControlsProps {
  map: React.RefObject<MapRef | null>
  mapLoaded: boolean
  customButtons?: MapControlButton[]
  showZoom?: boolean
  showLayers?: boolean
  /** Content of the Map settings panel, built from the parts in MapSettings. */
  settings?: ReactNode
  /** Marks the settings button when a setting is away from its default. */
  settingsModified?: boolean
  className?: string
  /** Shortcuts for the built-in zoom buttons, shown as key caps in their tooltips. */
  zoomBindings?: { zoomIn?: ShortcutBinding; zoomOut?: ShortcutBinding }
}

/** A tooltip's text, followed by the key cap for the shortcut that does the same. */
const TooltipLabel = ({ text, binding }: { text: string; binding?: ShortcutBinding }) => (
  <span className="flex items-center gap-2">
    {text}
    {binding && <KbdBinding binding={binding} />}
  </span>
)

const mapButtonClass =
  'text-zinc-500 hover:bg-transparent hover:text-zinc-900 dark:text-slate-300 dark:hover:text-white'

export const MapControls = ({
  map,
  mapLoaded,
  customButtons = [],
  showZoom = true,
  showLayers = true,
  settings,
  settingsModified = false,
  className,
  zoomBindings,
}: MapControlsProps) => {
  const { t } = useIntl()

  const handleZoomIn = () => {
    if (map.current && mapLoaded) {
      const maplibreMap = map.current.getMap()
      maplibreMap.zoomIn({ duration: 0 })
    }
  }

  const handleZoomOut = () => {
    if (map.current && mapLoaded) {
      const maplibreMap = map.current.getMap()
      maplibreMap.zoomOut({ duration: 0 })
    }
  }

  return (
    <TooltipProvider>
      <div className={cn('absolute top-0 right-0 flex flex-col items-end', className)}>
        <div className="mt-2 mr-2 flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          {showLayers && (
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!mapLoaded}
                      className={mapButtonClass}
                      aria-label={t({ id: 'map.controls.mapStyle', defaultMessage: 'Map style' })}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {t({ id: 'map.controls.mapStyle', defaultMessage: 'Map style' })}
                </TooltipContent>
              </Tooltip>
              <PopoverContent
                side="left"
                align="start"
                sideOffset={8}
                aria-label={t({ id: 'map.controls.mapStyle', defaultMessage: 'Map style' })}
                className="w-72"
              >
                <MapStyleSwitcher map={map} mapLoaded={mapLoaded} />
              </PopoverContent>
            </Popover>
          )}

          {settings && (
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!mapLoaded}
                      className={cn(mapButtonClass, 'relative')}
                      aria-label={t({
                        id: 'map.controls.mapSettings',
                        defaultMessage: 'Map settings',
                      })}
                    >
                      <Settings2 className="h-4 w-4" />
                      {settingsModified && (
                        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-blue-500" />
                      )}
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {t({ id: 'map.controls.mapSettings', defaultMessage: 'Map settings' })}
                </TooltipContent>
              </Tooltip>
              <PopoverContent
                side="left"
                align="start"
                sideOffset={8}
                aria-label={t({ id: 'map.controls.mapSettings', defaultMessage: 'Map settings' })}
                className="w-72"
              >
                {settings}
              </PopoverContent>
            </Popover>
          )}

          {showZoom && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={!mapLoaded}
                    className={mapButtonClass}
                    aria-label={t({ id: 'map.controls.zoomIn', defaultMessage: 'Zoom in' })}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <TooltipLabel
                    text={t({ id: 'map.controls.zoomIn', defaultMessage: 'Zoom in' })}
                    binding={zoomBindings?.zoomIn}
                  />
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={!mapLoaded}
                    className={mapButtonClass}
                    aria-label={t({ id: 'map.controls.zoomOut', defaultMessage: 'Zoom out' })}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <TooltipLabel
                    text={t({ id: 'map.controls.zoomOut', defaultMessage: 'Zoom out' })}
                    binding={zoomBindings?.zoomOut}
                  />
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {customButtons.map((button, index) => {
            const Icon = button.icon
            const key = button.id || button.tooltip || `custom-button-${index}`
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={button.onClick}
                    disabled={button.disabled}
                    aria-label={button.tooltip}
                    className={mapButtonClass}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                {button.tooltip && (
                  <TooltipContent side="left">
                    <TooltipLabel text={button.tooltip} binding={button.binding} />
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
