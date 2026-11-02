import { describe, expect, it } from 'vitest'
import type { Challenge } from '@/types/Challenge'
import {
  buildCloneFormValues,
  clonedChallengeSettings,
  commentOutClonedOverpassQuery,
} from './cloneChallenge'

const source = {
  id: 5,
  parent: 3,
  name: 'Source',
  description: 'Desc',
  instruction: 'Do it',
  difficulty: 3,
  checkinComment: 'Fix #maproulette',
  checkinSource: 'Bing',
  overpassQL: 'way[highway];',
  remoteGeoJson: '',
  ownerTeamId: 8,
  tags: ['building', 'roofs'],
  status: 3,
  enabled: false,
  featured: true,
  paused: true,
  isArchived: true,
  highPriorityRule: '{"condition":"AND","rules":[]}',
  defaultPriority: 1,
  overpassTargetType: '',
  defaultZoom: 16,
  exportableProperties: 'name',
} as unknown as Challenge

describe('buildCloneFormValues', () => {
  it('prefills the form from the source with the Overpass query commented out and a blank name', () => {
    const values = buildCloneFormValues(source, 9)
    expect(values).toMatchObject({
      projectId: 9,
      name: '',
      description: 'Desc',
      instruction: 'Do it',
      difficulty: 3,
      category: 'buildings',
      additionalKeywords: 'roofs',
      checkinComment: 'Fix #maproulette',
      dataSource: 'overpass',
      overpassQL: commentOutClonedOverpassQuery('way[highway];'),
      localGeoJSON: null,
      remoteGeoJSON: '',
      ownerTeamId: 8,
      automatedEditsCodeAgreement: false,
    })
    expect(values.overpassQL).toContain('THIS IS THE QUERY OF THE CHALLENGE YOU CLONED')
  })

  it('keeps the source project when no target project is given', () => {
    expect(buildCloneFormValues(source, undefined).projectId).toBe(3)
  })
})

describe('clonedChallengeSettings', () => {
  it('copies settings the form does not edit and defaults the Overpass target type to none', () => {
    expect(clonedChallengeSettings(source)).toEqual({
      enabled: false,
      featured: true,
      paused: true,
      highPriorityRule: '{"condition":"AND","rules":[]}',
      defaultPriority: 1,
      overpassTargetType: 'none',
      defaultZoom: 16,
      exportableProperties: 'name',
    })
  })

  it('never copies the source id, status or name', () => {
    const settings = clonedChallengeSettings(source)
    expect(settings).not.toHaveProperty('id')
    expect(settings).not.toHaveProperty('status')
    expect(settings).not.toHaveProperty('name')
    expect(settings).not.toHaveProperty('isArchived')
  })
})
