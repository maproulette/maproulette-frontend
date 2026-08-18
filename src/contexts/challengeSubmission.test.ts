// This unit test runs in Vitest's `node` environment (see TESTING.md), which
// unlike a browser doesn't define a global `File` on Node 18. The form values
// use a real `File` instance for the localGeoJSON upload, so polyfill it from
// `node:buffer` (available since Node 18.13) before any test runs.
import { File as NodeFile } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import type { ChallengeFormValues } from '@/components/Pages/ManagementPages/ManageChallengeNew/ChallengeForm'
import { buildChallengeSubmission } from './challengeSubmission'

globalThis.File ??= NodeFile as unknown as typeof File

// RFC 7464 record separator byte that marks a line-by-line ("sequence") GeoJSON
// upload, mirroring src/lib/localGeoJSON.ts's detection logic.
const RECORD_SEPARATOR = '\x1e'

const baseValues: ChallengeFormValues = {
  projectId: 1,
  name: 'A challenge',
  description: 'A description',
  instruction: 'Some instructions',
  difficulty: 2,
  dataSource: 'overpass',
  overpassQL: 'way[highway=primary];',
  localGeoJSON: null,
  remoteGeoJSON: '',
  dataOriginDate: '',
  automatedEditsCodeAgreement: true,
}

describe('buildChallengeSubmission', () => {
  describe('create mode (isCreate = true)', () => {
    it('builds an overpass submission', async () => {
      const result = await buildChallengeSubmission(
        { ...baseValues, dataSource: 'overpass', overpassQL: 'way[highway=primary];' },
        true
      )

      expect(result).toEqual({
        challengeData: {
          name: 'A challenge',
          description: 'A description',
          instruction: 'Some instructions',
          difficulty: 2,
          overpassQL: 'way[highway=primary];',
        },
        localGeoJSONUpload: undefined,
      })
    })

    it('defaults overpassQL to an empty string when the overpass source has none entered yet', async () => {
      const result = await buildChallengeSubmission(
        { ...baseValues, dataSource: 'overpass', overpassQL: '' },
        true
      )

      expect(result.challengeData.overpassQL).toBe('')
    })

    it('builds a remoteGeoJSON submission, clearing overpassQL and setting remoteGeoJson', async () => {
      const result = await buildChallengeSubmission(
        {
          ...baseValues,
          dataSource: 'remoteGeoJSON',
          overpassQL: '',
          remoteGeoJSON: 'https://example.com/data.geojson',
        },
        true
      )

      expect(result).toEqual({
        challengeData: {
          name: 'A challenge',
          description: 'A description',
          instruction: 'Some instructions',
          difficulty: 2,
          overpassQL: '',
          remoteGeoJson: 'https://example.com/data.geojson',
        },
        localGeoJSONUpload: undefined,
      })
    })

    it('builds a localGeoJSON submission for a plain (non line-by-line) GeoJSON file, parsing its contents inline', async () => {
      const geoJSON = { type: 'FeatureCollection', features: [] }
      const file = new File([JSON.stringify(geoJSON)], 'data.geojson', {
        type: 'application/json',
      })

      const result = await buildChallengeSubmission(
        {
          ...baseValues,
          dataSource: 'localGeoJSON',
          overpassQL: '',
          localGeoJSON: file,
          dataOriginDate: '2024-01-15',
        },
        true
      )

      expect(result).toEqual({
        challengeData: {
          name: 'A challenge',
          description: 'A description',
          instruction: 'Some instructions',
          difficulty: 2,
          overpassQL: '',
          localGeoJSON: geoJSON,
          dataOriginDate: '2024-01-15',
        },
        localGeoJSONUpload: undefined,
      })
    })

    it('omits dataOriginDate for a plain localGeoJSON file when none is provided', async () => {
      const geoJSON = { type: 'FeatureCollection', features: [] }
      const file = new File([JSON.stringify(geoJSON)], 'data.geojson', {
        type: 'application/json',
      })

      const result = await buildChallengeSubmission(
        {
          ...baseValues,
          dataSource: 'localGeoJSON',
          overpassQL: '',
          localGeoJSON: file,
          dataOriginDate: '',
        },
        true
      )

      expect(result.challengeData).not.toHaveProperty('dataOriginDate')
    })

    it('resolves asynchronously to a line-by-line submission for a record-separator-framed GeoJSON file, deferring the upload instead of parsing it inline', async () => {
      const lineByLineContent = `${RECORD_SEPARATOR}{"type":"Feature"}\n${RECORD_SEPARATOR}{"type":"Feature"}\n`
      const file = new File([lineByLineContent], 'sequence.geojsonl', {
        type: 'application/json',
      })

      const promise = buildChallengeSubmission(
        {
          ...baseValues,
          dataSource: 'localGeoJSON',
          overpassQL: '',
          localGeoJSON: file,
          dataOriginDate: '2024-02-01',
        },
        true
      )

      // The lineByLine branch awaits detectLocalGeoJSONSubmission internally,
      // so the overall call is genuinely asynchronous.
      expect(promise).toBeInstanceOf(Promise)

      const result = await promise

      expect(result.challengeData).not.toHaveProperty('localGeoJSON')
      expect(result.localGeoJSONUpload).toEqual({
        file,
        lineByLine: true,
        dataOriginDate: '2024-02-01',
      })
    })

    it('omits dataOriginDate on the deferred upload when none is provided', async () => {
      const lineByLineContent = `${RECORD_SEPARATOR}{"type":"Feature"}\n`
      const file = new File([lineByLineContent], 'sequence.geojsonl', {
        type: 'application/json',
      })

      const result = await buildChallengeSubmission(
        {
          ...baseValues,
          dataSource: 'localGeoJSON',
          overpassQL: '',
          localGeoJSON: file,
          dataOriginDate: '',
        },
        true
      )

      expect(result.localGeoJSONUpload).toEqual({
        file,
        lineByLine: true,
        dataOriginDate: undefined,
      })
    })

    it('defaults description and instruction to empty strings when blank', async () => {
      const result = await buildChallengeSubmission(
        { ...baseValues, description: '', instruction: '' },
        true
      )

      expect(result.challengeData.description).toBe('')
      expect(result.challengeData.instruction).toBe('')
    })
  })

  describe('edit mode (isCreate = false)', () => {
    it('omits all data-source fields regardless of dataSource, since editing only changes metadata', async () => {
      const result = await buildChallengeSubmission(
        {
          ...baseValues,
          dataSource: 'overpass',
          overpassQL: 'should not appear',
          remoteGeoJSON: 'https://example.com/should-not-appear.geojson',
        },
        false
      )

      expect(result).toEqual({
        challengeData: {
          name: 'A challenge',
          description: 'A description',
          instruction: 'Some instructions',
          difficulty: 2,
        },
        localGeoJSONUpload: undefined,
      })
    })

    it('never produces a localGeoJSONUpload, even with a line-by-line file selected', async () => {
      const lineByLineContent = `${RECORD_SEPARATOR}{"type":"Feature"}\n`
      const file = new File([lineByLineContent], 'sequence.geojsonl', {
        type: 'application/json',
      })

      const result = await buildChallengeSubmission(
        { ...baseValues, dataSource: 'localGeoJSON', localGeoJSON: file },
        false
      )

      expect(result.localGeoJSONUpload).toBeUndefined()
      expect(result.challengeData).not.toHaveProperty('localGeoJSON')
    })

    it('sets description and instruction to undefined (not empty string) when blank', async () => {
      const result = await buildChallengeSubmission(
        { ...baseValues, description: '', instruction: '' },
        false
      )

      expect(result.challengeData.description).toBeUndefined()
      expect(result.challengeData.instruction).toBeUndefined()
    })
  })
})
