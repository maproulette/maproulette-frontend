// This unit test runs in Vitest's `node` environment (see TESTING.md — zod
// schema tests belong in `*.test.ts`), which unlike a browser doesn't define
// a global `File` on Node 18. The schema uses `z.instanceof(File)`, so
// polyfill it from `node:buffer` (available since Node 18.13) before any
// schema is built.
import { File as NodeFile } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import type { Challenge } from '@/types/Challenge'
import {
  buildFormValues,
  type ChallengeFormValues,
  getDefaultDataSource,
  makeChallengeFormSchema,
} from './challengeFormSchema'

globalThis.File ??= NodeFile as unknown as typeof File

// A fake `t` matching the real IntlContext signature: returns the default
// message when provided (like the real implementation does when a
// translation key is missing from the catalog).
const t = (_id: string, _values?: Record<string, string | number>, defaultMessage?: string) =>
  defaultMessage ?? _id

const validValues: ChallengeFormValues = {
  projectId: 1,
  name: 'A valid name',
  description: 'A description',
  instruction: 'Some instructions',
  difficulty: 1,
  dataSource: 'overpass',
  overpassQL: 'a query',
  localGeoJSON: null,
  remoteGeoJSON: '',
  dataOriginDate: '',
  automatedEditsCodeAgreement: true,
}

describe('getDefaultDataSource', () => {
  it('defaults to overpass when there is no challenge (create mode)', () => {
    expect(getDefaultDataSource(undefined)).toBe('overpass')
  })

  it('returns overpass when the challenge has an overpassQL query', () => {
    expect(getDefaultDataSource({ overpassQL: 'some query' } as unknown as Challenge)).toBe(
      'overpass'
    )
  })

  it('returns overpass when both overpassQL and remoteGeoJson are present (overpass takes precedence)', () => {
    expect(
      getDefaultDataSource({
        overpassQL: 'some query',
        remoteGeoJson: 'https://example.com/data.json',
      } as unknown as Challenge)
    ).toBe('overpass')
  })

  it('returns remoteGeoJSON when there is no overpassQL but a remoteGeoJson URL is present', () => {
    expect(
      getDefaultDataSource({
        overpassQL: '',
        remoteGeoJson: 'https://example.com/data.json',
      } as unknown as Challenge)
    ).toBe('remoteGeoJSON')
  })

  it('falls back to localGeoJSON when neither overpassQL nor remoteGeoJson is present', () => {
    expect(
      getDefaultDataSource({ overpassQL: '', remoteGeoJson: '' } as unknown as Challenge)
    ).toBe('localGeoJSON')
  })

  it('falls back to localGeoJSON when overpassQL and remoteGeoJson are both undefined', () => {
    expect(getDefaultDataSource({} as unknown as Challenge)).toBe('localGeoJSON')
  })
})

describe('buildFormValues', () => {
  it('builds defaults for a brand new challenge (no challenge provided)', () => {
    expect(buildFormValues(undefined, 42)).toEqual({
      projectId: 42,
      name: '',
      description: '',
      instruction: '',
      difficulty: 1,
      dataSource: 'overpass',
      overpassQL: '',
      localGeoJSON: null,
      remoteGeoJSON: '',
      dataOriginDate: '',
      automatedEditsCodeAgreement: false,
    })
  })

  it('populates values from an existing challenge, preferring the challenge parent over the passed projectId', () => {
    const challenge = {
      parent: 99,
      name: 'Existing Challenge',
      description: 'Existing description',
      instruction: 'Existing instructions',
      difficulty: 3,
      overpassQL: 'existing query',
      remoteGeoJson: '',
    } as unknown as Challenge

    expect(buildFormValues(challenge, 1)).toEqual({
      projectId: 99,
      name: 'Existing Challenge',
      description: 'Existing description',
      instruction: 'Existing instructions',
      difficulty: 3,
      dataSource: 'overpass',
      overpassQL: 'existing query',
      localGeoJSON: null,
      remoteGeoJSON: '',
      dataOriginDate: '',
      automatedEditsCodeAgreement: true,
    })
  })

  it('uses challenge.parent of 0 rather than falling back to the passed projectId (0 is not nullish)', () => {
    const challenge = { parent: 0 } as unknown as Challenge
    expect(buildFormValues(challenge, 55).projectId).toBe(0)
  })

  it('falls back to the passed projectId when challenge.parent is null/undefined', () => {
    const challenge = { parent: undefined } as unknown as Challenge
    expect(buildFormValues(challenge, 55).projectId).toBe(55)
  })

  it('defaults difficulty to 1 when the challenge has no difficulty set', () => {
    const challenge = { name: 'No difficulty' } as unknown as Challenge
    expect(buildFormValues(challenge, 1).difficulty).toBe(1)
  })

  it('always resets localGeoJSON to null and dataOriginDate to empty string, even for an existing challenge', () => {
    const challenge = { parent: 1, overpassQL: 'q' } as unknown as Challenge
    const values = buildFormValues(challenge, 1)
    expect(values.localGeoJSON).toBeNull()
    expect(values.dataOriginDate).toBe('')
  })

  it('infers dataSource as remoteGeoJSON and copies the remote URL when there is no overpassQL', () => {
    const challenge = {
      parent: 1,
      overpassQL: '',
      remoteGeoJson: 'https://example.com/data.json',
    } as unknown as Challenge
    const values = buildFormValues(challenge, 1)
    expect(values.dataSource).toBe('remoteGeoJSON')
    expect(values.remoteGeoJSON).toBe('https://example.com/data.json')
  })

  it('marks automatedEditsCodeAgreement true whenever a challenge is passed, false otherwise', () => {
    expect(buildFormValues(undefined, 1).automatedEditsCodeAgreement).toBe(false)
    expect(buildFormValues({} as unknown as Challenge, 1).automatedEditsCodeAgreement).toBe(true)
  })
})

describe('makeChallengeFormSchema', () => {
  describe('shared field validation (applies in both create and edit mode)', () => {
    it.each([true, false])('accepts a fully valid overpass submission (isEdit=%s)', (isEdit) => {
      const result = makeChallengeFormSchema(isEdit, t).safeParse(validValues)
      expect(result.success).toBe(true)
    })

    it.each([true, false])('rejects a projectId of 0 (isEdit=%s)', (isEdit) => {
      const result = makeChallengeFormSchema(isEdit, t).safeParse({ ...validValues, projectId: 0 })
      expect(result.success).toBe(false)
      expect(result.success ? undefined : result.error.issues[0].message).toBe(
        'Please select a project'
      )
    })

    it.each([true, false])('rejects a name shorter than 3 characters (isEdit=%s)', (isEdit) => {
      const result = makeChallengeFormSchema(isEdit, t).safeParse({ ...validValues, name: 'ab' })
      expect(result.success).toBe(false)
      expect(result.success ? undefined : result.error.issues[0].message).toBe(
        'Challenge name must be at least 3 characters'
      )
    })

    it.each([true, false])('rejects a name longer than 255 characters (isEdit=%s)', (isEdit) => {
      const result = makeChallengeFormSchema(isEdit, t).safeParse({
        ...validValues,
        name: 'a'.repeat(256),
      })
      expect(result.success).toBe(false)
    })

    it.each([true, false])('rejects an empty description (isEdit=%s)', (isEdit) => {
      const result = makeChallengeFormSchema(isEdit, t).safeParse({
        ...validValues,
        description: '',
      })
      expect(result.success).toBe(false)
      expect(result.success ? undefined : result.error.issues[0].message).toBe(
        'Description is required'
      )
    })

    it.each([true, false])('rejects an empty instruction (isEdit=%s)', (isEdit) => {
      const result = makeChallengeFormSchema(isEdit, t).safeParse({
        ...validValues,
        instruction: '',
      })
      expect(result.success).toBe(false)
      expect(result.success ? undefined : result.error.issues[0].message).toBe(
        'Instructions are required'
      )
    })

    it.each([true, false])('rejects a difficulty outside 1-3 (isEdit=%s)', (isEdit) => {
      expect(
        makeChallengeFormSchema(isEdit, t).safeParse({ ...validValues, difficulty: 0 }).success
      ).toBe(false)
      expect(
        makeChallengeFormSchema(isEdit, t).safeParse({ ...validValues, difficulty: 4 }).success
      ).toBe(false)
    })

    it.each([true, false])(
      'rejects a dataSource outside the known enum values (isEdit=%s)',
      (isEdit) => {
        const result = makeChallengeFormSchema(isEdit, t).safeParse({
          ...validValues,
          dataSource: 'somethingElse',
        })
        expect(result.success).toBe(false)
      }
    )

    it.each([true, false])(
      'requires a non-blank overpassQL when dataSource is overpass, regardless of edit mode (isEdit=%s)',
      (isEdit) => {
        const result = makeChallengeFormSchema(isEdit, t).safeParse({
          ...validValues,
          overpassQL: '',
        })
        expect(result.success).toBe(false)
        const issue = result.success ? undefined : result.error.issues[0]
        expect(issue?.message).toBe('An Overpass query is required')
        expect(issue?.path).toEqual(['overpassQL'])
      }
    )

    it.each([true, false])('treats a whitespace-only overpassQL as blank (isEdit=%s)', (isEdit) => {
      const result = makeChallengeFormSchema(isEdit, t).safeParse({
        ...validValues,
        overpassQL: '   ',
      })
      expect(result.success).toBe(false)
    })

    it.each([true, false])(
      'requires a non-blank remoteGeoJSON when dataSource is remoteGeoJSON, regardless of edit mode (isEdit=%s)',
      (isEdit) => {
        const result = makeChallengeFormSchema(isEdit, t).safeParse({
          ...validValues,
          dataSource: 'remoteGeoJSON',
          overpassQL: '',
          remoteGeoJSON: '',
        })
        expect(result.success).toBe(false)
        const issue = result.success ? undefined : result.error.issues[0]
        expect(issue?.message).toBe('A GeoJSON URL is required')
        expect(issue?.path).toEqual(['remoteGeoJSON'])
      }
    )

    it.each([true, false])(
      'treats a whitespace-only remoteGeoJSON as blank (isEdit=%s)',
      (isEdit) => {
        const result = makeChallengeFormSchema(isEdit, t).safeParse({
          ...validValues,
          dataSource: 'remoteGeoJSON',
          overpassQL: '',
          remoteGeoJSON: '   ',
        })
        expect(result.success).toBe(false)
      }
    )

    it.each([true, false])(
      'accepts dataSource remoteGeoJSON once a URL is provided (isEdit=%s)',
      (isEdit) => {
        const result = makeChallengeFormSchema(isEdit, t).safeParse({
          ...validValues,
          dataSource: 'remoteGeoJSON',
          overpassQL: '',
          remoteGeoJSON: 'https://example.com/data.json',
        })
        expect(result.success).toBe(true)
      }
    )
  })

  describe('create-mode-only requirements', () => {
    it('requires a localGeoJSON file when dataSource is localGeoJSON and creating', () => {
      const result = makeChallengeFormSchema(false, t).safeParse({
        ...validValues,
        dataSource: 'localGeoJSON',
        overpassQL: '',
        localGeoJSON: null,
      })
      expect(result.success).toBe(false)
      const issue = result.success ? undefined : result.error.issues[0]
      expect(issue?.message).toBe('Please upload a GeoJSON file')
      expect(issue?.path).toEqual(['localGeoJSON'])
    })

    it('does not require a localGeoJSON file when dataSource is localGeoJSON and editing', () => {
      const result = makeChallengeFormSchema(true, t).safeParse({
        ...validValues,
        dataSource: 'localGeoJSON',
        overpassQL: '',
        localGeoJSON: null,
      })
      expect(result.success).toBe(true)
    })

    it('accepts a localGeoJSON File instance when creating', () => {
      const file = new File(['{}'], 'data.geojson', { type: 'application/json' })
      const result = makeChallengeFormSchema(false, t).safeParse({
        ...validValues,
        dataSource: 'localGeoJSON',
        overpassQL: '',
        localGeoJSON: file,
      })
      expect(result.success).toBe(true)
    })

    it('requires the automated edits agreement checkbox when creating', () => {
      const result = makeChallengeFormSchema(false, t).safeParse({
        ...validValues,
        automatedEditsCodeAgreement: false,
      })
      expect(result.success).toBe(false)
      const issue = result.success ? undefined : result.error.issues[0]
      expect(issue?.message).toBe('You must read and accept the Automated Edits code of conduct')
      expect(issue?.path).toEqual(['automatedEditsCodeAgreement'])
    })

    it('does not require the automated edits agreement checkbox when editing', () => {
      const result = makeChallengeFormSchema(true, t).safeParse({
        ...validValues,
        automatedEditsCodeAgreement: false,
      })
      expect(result.success).toBe(true)
    })
  })

  it('reports every applicable issue at once (multiple blank required fields on create)', () => {
    const result = makeChallengeFormSchema(false, t).safeParse({
      ...validValues,
      name: '',
      description: '',
      instruction: '',
      overpassQL: '',
      automatedEditsCodeAgreement: false,
    })
    expect(result.success).toBe(false)
    if (result.success) return
    const paths = result.error.issues.map((issue) => issue.path.join('.'))
    expect(paths).toEqual(
      expect.arrayContaining([
        'name',
        'description',
        'instruction',
        'overpassQL',
        'automatedEditsCodeAgreement',
      ])
    )
  })
})
