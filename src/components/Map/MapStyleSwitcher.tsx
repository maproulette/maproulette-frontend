import { Plus, Trash2 } from 'lucide-react'
import type { StyleSpecification } from 'maplibre-gl'
import { useState } from 'react'
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
              <div className="font-medium text-sm">{style.name}</div>
            </button>
            {custom && (
              <button
                type="button"
                onClick={() => handleRemove(custom.id)}
                className="rounded p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                aria-label={t(
                  'map.styleSwitcher.removeLayer',
                  { name: custom.name },
                  'Remove {name}'
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
            <Label htmlFor="custom-layer-name">
              {t('map.styleSwitcher.nameLabel', undefined, 'Name')}
            </Label>
            <Input
              id="custom-layer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My imagery"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="custom-layer-type">
              {t('map.styleSwitcher.typeLabel', undefined, 'Type')}
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as CustomLayerType)}>
              <SelectTrigger id="custom-layer-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xyz">XYZ tiles</SelectItem>
                <SelectItem value="wms">WMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="custom-layer-url">
              {type === 'xyz'
                ? t('map.styleSwitcher.xyzUrlLabel', undefined, 'Tile URL')
                : t('map.styleSwitcher.wmsUrlLabel', undefined, 'WMS endpoint')}
            </Label>
            <Input
              id="custom-layer-url"
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
              <Label htmlFor="custom-layer-layers">
                {t('map.styleSwitcher.wmsLayersLabel', undefined, 'WMS layers')}
              </Label>
              <Input
                id="custom-layer-layers"
                value={layers}
                onChange={(e) => setLayers(e.target.value)}
                placeholder="workspace:layer"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
              {t('common.cancel', undefined, 'Cancel')}
            </Button>
            <Button size="sm" disabled={!canSave} onClick={handleAdd}>
              {t('map.styleSwitcher.addLayer', undefined, 'Add layer')}
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
          {t('map.styleSwitcher.addCustom', undefined, 'Add your own layer')}
        </Button>
      )}
    </div>
  )
}
