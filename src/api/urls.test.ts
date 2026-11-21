import { describe, expect, it } from 'vitest'
import { apiBaseUrl } from './client'
import { attachmentDataUrl, changeFileUrl, resolveTeamImageUrl, taskTilesUrl } from './urls'

describe('taskTilesUrl', () => {
  it('asks for global challenges only when told to', () => {
    expect(taskTilesUrl()).toBe(`${apiBaseUrl}/api/v2/taskTilesMvt/{z}/{x}/{y}`)
    expect(taskTilesUrl({ global: true })).toBe(
      `${apiBaseUrl}/api/v2/taskTilesMvt/{z}/{x}/{y}?global=true`
    )
  })
})

describe('changeFileUrl', () => {
  it('points at the backend change XML with an .osc name JOSM recognises', () => {
    expect(changeFileUrl(7)).toBe(
      `${apiBaseUrl}/api/v2/task/7/cooperative/change/task_7_change.osc`
    )
  })
})

describe('attachmentDataUrl', () => {
  it('names the file after the attachment so JOSM picks the right importer', () => {
    const layer = { id: 'abc-123', kind: 'referenceLayer', type: 'geojson', name: 'Boundary Layer' }
    expect(attachmentDataUrl(99, layer)).toBe(
      `${apiBaseUrl}/api/v2/task/99/attachment/abc-123/data/boundary_layer_99.geojson`
    )
  })
})

describe('resolveTeamImageUrl', () => {
  it('returns undefined when there is no image', () => {
    expect(resolveTeamImageUrl(undefined)).toBeUndefined()
    expect(resolveTeamImageUrl(null)).toBeUndefined()
    expect(resolveTeamImageUrl('')).toBeUndefined()
  })

  it('passes external urls through untouched', () => {
    expect(resolveTeamImageUrl('https://example.org/logo.png')).toBe('https://example.org/logo.png')
    expect(resolveTeamImageUrl('http://example.org/logo.png')).toBe('http://example.org/logo.png')
    expect(resolveTeamImageUrl('//example.org/logo.png')).toBe('//example.org/logo.png')
    expect(resolveTeamImageUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA')
  })

  it('resolves team image paths against the api host', () => {
    expect(resolveTeamImageUrl('/api/v2/teamImage/7/file')).toBe(
      `${apiBaseUrl}/api/v2/teamImage/7/file`
    )
  })

  it('inserts a separator for paths that do not start with a slash', () => {
    expect(resolveTeamImageUrl('api/v2/teamImage/7/file')).toBe(
      `${apiBaseUrl}/api/v2/teamImage/7/file`
    )
  })
})
