import { Plus, Trash2 } from 'lucide-react'
import type { StyleSpecification } from 'maplibre-gl'
import { useId, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useCustomBaseLayers } from '@/contexts/CustomBaseLayersContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { CustomLayerType } from './customBaseLayers'
import { allMapStyles, bundledMapStyles, getCurrentMapStyleIndex, saveMapStyle } from './mapStyles'

interface MapStyleSwitcherProps {
  map: React.RefObject<MapRef | null>
  mapLoaded: boolean
}

export const MapStyleSwitcher = ({ map, mapLoaded }: MapStyleSwitcherProps) => {
  const { t } = useIntl()
  const [selectedIndex, setSelectedIndex] = useState(getCurrentMapStyleIndex)
  const { layers: customLayers, addLayer, removeLayer } = useCustomBaseLayers()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<CustomLayerType>('xyz')
  const [url, setUrl] = useState('')
  const [layers, setLayers] = useState('')
  const fieldId = useId()

  const styles = allMapStyles()

  const handleStyleChange = (style: StyleSpecification, index: number) => {
    if (!map.current || !mapLoaded) return
    map.current.getMap().setStyle(style)
    setSelectedIndex(index)
    saveMapStyle(index)
  }

  const canSave = name.trim() && url.trim() && (type === 'xyz' || layers.trim())

  const handleAdd = () => {
    if (!canSave) return
    addLayer({
      name: name.trim(),
      type,
      url: url.trim(),
      ...(type === 'wms' ? { layers: layers.trim() } : {}),
    })
    setName('')
    setUrl('')
    setLayers('')
    setAdding(false)
  }

  const handleRemove = (id: string) => {
    removeLayer(id)
    // The removed layer may have been the selected one; fall back to the first.
    setSelectedIndex(getCurrentMapStyleIndex())
  }

  return (
    <div className="max-h-[70vh] w-72 overflow-y-auto p-2">
      {styles.map((style, index) => {
        const custom =
          index >= bundledMapStyles.length
            ? customLayers[index - bundledMapStyles.length]
            : undefined
        return (
          <div key={style.name ?? index} className="mb-2 flex items-center gap-1 last:mb-0">
            <button
              type="button"
              onClick={() => handleStyleChange(style, index)}
              className={cn(
                'block flex-1 rounded-lg border p-3 text-left transition-colors',
                selectedIndex === index
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-zinc-200 hover:bg-zinc-50 dark:border-slate-700 dark:hover:bg-slate-800'
              )}
            >
              <span className="block font-medium text-sm">{style.name}</span>
            </button>
            {custom && (
              <button
                type="button"
                onClick={() => handleRemove(custom.id)}
                className="rounded p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                aria-label={t(
                  { id: 'map.styleSwitcher.removeLayer', defaultMessage: 'Remove {name}' },
                  { name: custom.name }
                )}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        )
      })}

      {adding ? (
        <div className="mt-2 space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-slate-700">
          <div className="space-y-1">
            <Label htmlFor={`${fieldId}-name`}>
              {t({ id: 'map.styleSwitcher.nameLabel', defaultMessage: 'Name' })}
            </Label>
            <Input
              id={`${fieldId}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t({ id: 'map.styleSwitcher.namePlaceholder', defaultMessage: 'My imagery' })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${fieldId}-type`}>
              {t({ id: 'map.styleSwitcher.typeLabel', defaultMessage: 'Type' })}
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as CustomLayerType)}>
              <SelectTrigger id={`${fieldId}-type`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xyz">
                  {t({ id: 'map.styleSwitcher.typeXyz', defaultMessage: 'XYZ tiles' })}
                </SelectItem>
                <SelectItem value="wms">WMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${fieldId}-url`}>
              {type === 'xyz'
                ? t({ id: 'map.styleSwitcher.xyzUrlLabel', defaultMessage: 'Tile URL' })
                : t({ id: 'map.styleSwitcher.wmsUrlLabel', defaultMessage: 'WMS endpoint' })}
            </Label>
            <Input
              id={`${fieldId}-url`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                type === 'xyz'
                  ? 'https://example.org/tile/{z}/{x}/{y}.png'
                  : 'https://example.org/geoserver/wms'
              }
            />
          </div>
          {type === 'wms' && (
            <div className="space-y-1">
              <Label htmlFor={`${fieldId}-layers`}>
                {t({ id: 'map.styleSwitcher.wmsLayersLabel', defaultMessage: 'WMS layers' })}
              </Label>
              <Input
                id={`${fieldId}-layers`}
                value={layers}
                onChange={(e) => setLayers(e.target.value)}
                placeholder="workspace:layer"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
              {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
            </Button>
            <Button size="sm" disabled={!canSave} onClick={handleAdd}>
              {t({ id: 'map.styleSwitcher.addLayer', defaultMessage: 'Add layer' })}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full gap-1.5"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-4" />
          {t({ id: 'map.styleSwitcher.addCustom', defaultMessage: 'Add your own layer' })}
        </Button>
      )}
    </div>
  )
}
