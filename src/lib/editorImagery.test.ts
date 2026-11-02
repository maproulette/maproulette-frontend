import type { StyleSpecification } from 'maplibre-gl'
import { describe, expect, it } from 'vitest'
import BingAerial from '@/components/Map/bing-aerial.json'
import { customRasterStyle } from '@/components/Map/customBaseLayers'
import EsriWorldImagery from '@/components/Map/esri-world-imagery.json'
import OsmBright from '@/components/Map/osm-bright.json'
import { editorBackgroundParam, editorImageryForStyle, josmImageryCommand } from './editorImagery'

const style = (s: unknown) => s as StyleSpecification

describe('editorImageryForStyle', () => {
  it('maps bundled imagery to the editor layer index ids iD and JOSM know', () => {
    expect(editorImageryForStyle(style(EsriWorldImagery))?.id).toBe('EsriWorldImagery')
    expect(editorImageryForStyle(style(BingAerial))).toMatchObject({ id: 'Bing', type: 'bing' })
  })

  it('passes a custom raster layer by its tile url', () => {
    const imagery = editorImageryForStyle(
      customRasterStyle('https://tiles.example/{z}/{x}/{y}.png')
    )
    expect(imagery).toMatchObject({ url: 'https://tiles.example/{z}/{x}/{y}.png', type: 'tms' })
    expect(editorBackgroundParam(imagery as NonNullable<typeof imagery>)).toBe(
      'background=custom:https%3A%2F%2Ftiles.example%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png'
    )
  })

  it('sends nothing for a vector style no editor can show', () => {
    expect(editorImageryForStyle(style(OsmBright))).toBeNull()
  })
})

describe('josmImageryCommand', () => {
  it('builds the imagery remote-control command with the url last', () => {
    const imagery = editorImageryForStyle(style(EsriWorldImagery))
    const command = josmImageryCommand(
      'http://127.0.0.1:8111/',
      imagery as NonNullable<typeof imagery>
    )
    expect(command.startsWith('http://127.0.0.1:8111/imagery?id=EsriWorldImagery&title=')).toBe(
      true
    )
    expect(command).toMatch(/&url=[^&]+$/)
  })
})
