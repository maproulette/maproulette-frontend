import { describe, expect, it } from 'vitest'
import type { Task } from '@/types/Task'
import {
  attachmentDataUrl,
  attachmentFilename,
  josmImportUrl,
  referenceLayers,
  taskAttachments,
} from './taskAttachments.ts'

const layer = { id: 'abc-123', kind: 'referenceLayer', type: 'geojson', name: 'Boundary Layer' }
const blob = { id: 'def-456', kind: 'blob', type: 'json' }

const makeTask = (geometries: unknown, id = 99): Task => ({ id, geometries }) as unknown as Task

describe('taskAttachments', () => {
  it('reads attachments from the task FeatureCollection', () => {
    const task = makeTask({ type: 'FeatureCollection', features: [], attachments: [layer] })
    expect(taskAttachments(task)).toHaveLength(1)
  })

  it('reads attachments hung off an individual feature', () => {
    const task = makeTask({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', attachments: [layer] }],
    })
    expect(taskAttachments(task)).toHaveLength(1)
  })

  it('is empty when a task carries none', () => {
    expect(taskAttachments(makeTask({ type: 'FeatureCollection', features: [] }))).toEqual([])
    expect(taskAttachments(makeTask(undefined))).toEqual([])
  })

  it('ignores entries missing an id or kind', () => {
    const task = makeTask({ attachments: [layer, { id: 'x' }, { kind: 'referenceLayer' }] })
    expect(taskAttachments(task)).toHaveLength(1)
  })
})

describe('referenceLayers', () => {
  it('selects only reference layers, leaving blobs for external processes', () => {
    const task = makeTask({ attachments: [layer, blob] })
    expect(referenceLayers(task).map((a) => a.id)).toEqual(['abc-123'])
  })
})

describe('attachmentFilename', () => {
  it('builds a name from the layer name and task, ending in the data type', () => {
    expect(attachmentFilename(99, layer)).toBe('boundary_layer_99.geojson')
  })

  it('falls back to the attachment id when the layer is unnamed', () => {
    expect(attachmentFilename(99, { id: 'abc', kind: 'referenceLayer', type: 'osm' })).toBe(
      'task_attachment_99_abc.osm'
    )
  })

  it('assumes geojson when no type is given', () => {
    expect(attachmentFilename(1, { id: 'a', kind: 'referenceLayer' })).toBe(
      'task_attachment_1_a.geojson'
    )
  })
})

describe('attachmentDataUrl', () => {
  it('points at the backend route serving the data', () => {
    expect(attachmentDataUrl('https://api.example.org', 99, layer)).toBe(
      'https://api.example.org/api/v2/task/99/attachment/abc-123/data/boundary_layer_99.geojson'
    )
  })

  it('tolerates a base URL with a trailing slash', () => {
    expect(attachmentDataUrl('https://api.example.org/', 99, layer)).toContain(
      'https://api.example.org/api/v2/'
    )
  })
})

describe('josmImportUrl', () => {
  const url = () => josmImportUrl('http://127.0.0.1:8111/', 'https://api.example.org', 99, layer)

  it('locks the layer and forbids upload and download by default', () => {
    expect(url()).toContain('layer_locked=true')
    expect(url()).toContain('download_policy=never')
    expect(url()).toContain('upload_policy=never')
  })

  it('imports into a new layer named after the attachment', () => {
    expect(url()).toContain('new_layer=true')
    expect(url()).toContain('layer_name=Boundary%20Layer')
  })

  it('lets a challenge relax the defaults through settings', () => {
    const relaxed = josmImportUrl('http://127.0.0.1:8111', 'https://api.example.org', 99, {
      ...layer,
      settings: { layerLocked: false, downloadPolicy: '' },
    })
    expect(relaxed).toContain('layer_locked=false')
    expect(relaxed).toContain('download_policy=&')
  })

  it('encodes the data URL so JOSM receives it whole', () => {
    expect(url()).toContain('url=https%3A%2F%2Fapi.example.org%2Fapi%2Fv2%2Ftask%2F99')
  })
})
