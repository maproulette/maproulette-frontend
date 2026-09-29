import { ChevronDown, ChevronUp, Globe, Layers, ZoomIn, ZoomOut } from 'lucide-react'
import { useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { MapStyleSwitcher } from '@/components/Map/MapStyleSwitcher'
import { resetMapView } from '@/components/Map/mapUtils'
import { Button } from '@/components/ui/Button'
import { KbdBinding } from '@/components/ui/Kbd'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Separator } from '@/components/ui/Separator'
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
  isActive?: boolean
  /** Shortcut that does the same thing, shown as a key cap in the tooltip. */
  binding?: ShortcutBinding
}

export interface MapControlsProps {
  map: React.RefObject<MapRef | null>
  mapLoaded: boolean
  customButtons?: MapControlButton[]
  showZoom?: boolean
  showReset?: boolean
  showLayers?: boolean
  collapsible?: boolean
  defaultOpen?: boolean
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
  showReset = true,
  showLayers = true,
  collapsible = false,
  defaultOpen = true,
  className,
  zoomBindings,
}: MapControlsProps) => {
  const { t } = useIntl()
  const [isOpen, setIsOpen] = useState(defaultOpen)

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

  const handleResetView = () => {
    if (map.current && mapLoaded) {
      const maplibreMap = map.current.getMap()
      resetMapView(maplibreMap)
    }
  }

  return (
    <TooltipProvider>
      <div className={cn('absolute top-0 right-0 flex flex-col items-end', className)}>
        <div className="mt-2 mr-2 flex flex-col items-center rounded-xl bg-white/95 p-1.5 shadow-sm dark:bg-slate-900/95 dark:shadow-none">
          {/* Collapsible icons section */}
          <div
            className={cn(
              'flex flex-col items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out',
              collapsible && !isOpen ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
            )}
          >
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
                      >
                        <Layers className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {t('map.controls.mapStyle', undefined, 'Map style')}
                  </TooltipContent>
                </Tooltip>
                <PopoverContent
                  side="left"
                  align="start"
                  sideOffset={8}
                  aria-label={t('map.controls.mapStyle', undefined, 'Map style')}
                  className="w-72"
                >
                  <MapStyleSwitcher map={map} mapLoaded={mapLoaded} />
                </PopoverContent>
              </Popover>
            )}

            {showReset && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleResetView}
                    disabled={!mapLoaded}
                    className={mapButtonClass}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {t('map.controls.resetView', undefined, 'Reset view')}
                </TooltipContent>
              </Tooltip>
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
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <TooltipLabel
                      text={t('map.controls.zoomIn', undefined, 'Zoom in')}
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
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <TooltipLabel
                      text={t('map.controls.zoomOut', undefined, 'Zoom out')}
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
                      className={cn(
                        mapButtonClass,
                        button.isActive && 'text-blue-400 hover:text-blue-300'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  {button.tooltip && (
                    <TooltipContent>
                      <TooltipLabel text={button.tooltip} binding={button.binding} />
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>

          {/* Divider + collapse toggle */}
          {collapsible && (
            <>
              <Separator className="my-1 w-6 bg-zinc-200 dark:bg-slate-600" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(!isOpen)}
                    className={mapButtonClass}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {isOpen
                    ? t('map.controls.hideControls', undefined, 'Hide controls')
                    : t('map.controls.showControls', undefined, 'Show controls')}
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
