import { describe, expect, it } from 'vitest'
import type { z } from 'zod'
import { Route } from './index.tsx'

type ChallengesSearch = {
  viewMode?: 'grid' | 'list' | 'grid-map'
  difficulty?: 'Any' | 'Easy' | 'Normal' | 'Expert'
  workOn?:
    | 'Anything'
    | 'Roads / Pedestrian / Cycleways'
    | 'Water'
    | 'Points / Areas of Interest'
    | 'Buildings'
    | 'Land Use / Administrative Boundaries'
    | 'Transit'
  categories?: string
  sortBy?: 'default' | 'name' | 'created' | 'modified' | 'popularity' | 'difficulty'
  global?: boolean
  osm_type?: 'N' | 'W' | 'R'
  osm_id?: number
}

// The route's search schema is a local, unexported const, so it's reached the
// same way the router itself reaches it: off `Route.options`.
const schema = Route.options.validateSearch as z.ZodType<ChallengesSearch>

describe('explore challenges route search schema', () => {
  it('accepts an empty search', () => {
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts a fully populated valid search', () => {
    const result = schema.safeParse({
      viewMode: 'list',
      difficulty: 'Easy',
      workOn: 'Water',
      categories: 'water,buildings',
      sortBy: 'popularity',
      global: true,
      osm_type: 'W',
      osm_id: 42,
    })
    expect(result.success).toBe(true)
  })

  it('falls back to the catch default for an invalid viewMode', () => {
    const result = schema.safeParse({ viewMode: 'not-a-mode' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.viewMode).toBe('grid-map')
    }
  })

  it('falls back to the catch default for an invalid difficulty', () => {
    const result = schema.safeParse({ difficulty: 'Impossible' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.difficulty).toBe('Any')
    }
  })

  it('falls back to the catch default for an invalid workOn', () => {
    const result = schema.safeParse({ workOn: 'Something else' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.workOn).toBe('Anything')
    }
  })

  it('falls back to the catch default for an invalid sortBy', () => {
    const result = schema.safeParse({ sortBy: 'nonsense' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sortBy).toBe('default')
    }
  })

  it('falls back to the catch default for a non-boolean global', () => {
    const result = schema.safeParse({ global: 'yes' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.global).toBe(false)
    }
  })

  it('rejects an invalid osm_type since it has no catch fallback', () => {
    const result = schema.safeParse({ osm_type: 'X' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-numeric osm_id since it has no catch fallback', () => {
    const result = schema.safeParse({ osm_id: 'not-a-number' })
    expect(result.success).toBe(false)
  })
})
