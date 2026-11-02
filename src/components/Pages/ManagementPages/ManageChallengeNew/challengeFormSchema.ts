import { z } from 'zod'
import { basemapSelection } from '@/components/Map/basemap'
import type { useIntl } from '@/i18n'
import type { Challenge } from '@/types/Challenge'
import { CHALLENGE_CATEGORIES, splitChallengeKeywords } from './challengeKeywords'

type T = ReturnType<typeof useIntl>['t']

// Building the schema requires translated validation messages, so it's built
// from a function (called from within the component, where `t` is available)
// rather than as a static module-level constant.
const makeBaseChallengeFormSchema = (t: T) =>
  z.object({
    projectId: z
      .number()
      .min(1, t({ id: 'common.pleaseSelectAProject', defaultMessage: 'Please select a project' })),
    name: z
      .string()
      .min(
        3,
        t({ id: 'manageChallengeNew.challengeForm.validation.nameMinLength', defaultMessage: 'Challenge name must be at least 3 characters' }
        )
      )
      .max(255),
    description: z
      .string()
      .min(
        1,
        t({ id: 'manageChallengeNew.challengeForm.validation.descriptionRequired', defaultMessage: 'Description is required' }
        )
      ),
    instruction: z
      .string()
      .min(
        1,
        t({ id: 'manageChallengeNew.challengeForm.validation.instructionRequired', defaultMessage: 'Instructions are required' }
        )
      ),
    difficulty: z.number().min(1).max(3),
    category: z.enum(CHALLENGE_CATEGORIES),
    additionalKeywords: z.string().optional().or(z.literal('')),
    checkinComment: z
      .string()
      .trim()
      .min(
        1,
        t({ id: 'manageChallengeNew.challengeForm.validation.checkinCommentRequired', defaultMessage: 'A changeset comment is required' }
        )
      ),
    checkinSource: z
      .string()
      .trim()
      .min(
        1,
        t({ id: 'manageChallengeNew.challengeForm.validation.checkinSourceRequired', defaultMessage: 'A changeset source is required' }
        )
      ),
    dataSource: z.enum(['overpass', 'localGeoJSON', 'remoteGeoJSON']),
    overpassQL: z.string().optional().or(z.literal('')),
    localGeoJSON: z.instanceof(File).nullable().optional(),
    remoteGeoJSON: z.string().optional().or(z.literal('')),
    dataOriginDate: z.string().optional().or(z.literal('')),
    // The team that owns this challenge, or null for no team. Owning it hands
    // the team's managers the run of the challenge and puts the team's image
    // on its card. Whether the id is one the user may actually use is enforced
    // server-side, since the picker only ever offers teams they manage.
    // Basemap the challenge forces on its maps: a bundled style's name,
    // `custom` (paired with basemapUrl), or `none` to leave the mapper's own
    // preference in charge.
    // Feature property holding each task's identifier; blank means "detect it".
    osmIdProperty: z.string().optional().or(z.literal('')),
    taskBundleIdProperty: z.string().optional().or(z.literal('')),
    // Comma-separated MapRoulette tags suggested to mappers, and whether they
    // are the only tags accepted.
    basemap: z.string(),
    basemapUrl: z.string().optional().or(z.literal('')),
    ownerTeamId: z.number().nullable(),
    automatedEditsCodeAgreement: z.boolean(),
  })

export type ChallengeFormValues = z.infer<ReturnType<typeof makeBaseChallengeFormSchema>>

// When editing, the challenge's task data already lives on the server, so a
// local GeoJSON re-upload isn't required to save — only enforce it when
// creating. Overpass and remote sources still need their value either way.
export const makeChallengeFormSchema = (isEdit: boolean, t: T) =>
  makeBaseChallengeFormSchema(t).superRefine((data, ctx) => {
    // dataSource is a zod enum of exactly these three values, and each check
    // below only fires an issue for its own source, so these are independent
    // checks rather than an if/else-if chain.
    if (data.dataSource === 'overpass') {
      if (!data.overpassQL || data.overpassQL.trim().length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['overpassQL'],
          message: t({ id: 'manageChallengeNew.challengeForm.validation.overpassRequired', defaultMessage: 'An Overpass query is required' }
          ),
        })
      }
    }
    if (data.dataSource === 'localGeoJSON') {
      if (!isEdit && !data.localGeoJSON) {
        ctx.addIssue({
          code: 'custom',
          path: ['localGeoJSON'],
          message: t({ id: 'manageChallengeNew.challengeForm.validation.localGeoJSONRequired', defaultMessage: 'Please upload a GeoJSON file' }
          ),
        })
      }
    }
    if (data.dataSource === 'remoteGeoJSON') {
      if (!data.remoteGeoJSON || data.remoteGeoJSON.trim().length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['remoteGeoJSON'],
          message: t({ id: 'manageChallengeNew.challengeForm.validation.remoteGeoJSONRequired', defaultMessage: 'A GeoJSON URL is required' }
          ),
        })
      }
    }

    if (!isEdit && data.automatedEditsCodeAgreement !== true) {
      ctx.addIssue({
        code: 'custom',
        path: ['automatedEditsCodeAgreement'],
        message: t({ id: 'manageChallengeNew.challengeForm.validation.agreementRequired', defaultMessage: 'You must read and accept the Automated Edits code of conduct' }
        ),
      })
    }
  })

export const isChallengeSourceEditable = (challenge: Challenge | undefined) =>
  !challenge || (challenge.completionMetrics?.total ?? 0) === 0

export const getDefaultDataSource = (
  challenge?: Challenge
): 'overpass' | 'localGeoJSON' | 'remoteGeoJSON' => {
  // New challenge: default to Overpass. For an existing challenge the source
  // is inferred from which field is populated; with neither an Overpass query
  // nor a remote URL the tasks came from a local upload. `requiresLocal` can't
  // be trusted here — it defaults to false and is frequently never set.
  if (!challenge) return 'overpass'
  if (challenge.overpassQL) return 'overpass'
  if (challenge.remoteGeoJson) return 'remoteGeoJSON'
  return 'localGeoJSON'
}

export const buildFormValues = (
  challenge: Challenge | undefined,
  projectId: number
): ChallengeFormValues => ({
  projectId: challenge?.parent ?? projectId,
  name: challenge?.name ?? '',
  description: challenge?.description ?? '',
  instruction: challenge?.instruction ?? '',
  difficulty: challenge?.difficulty ?? 2,
  ...splitChallengeKeywords(challenge?.tags),
  checkinComment: challenge?.checkinComment ?? '',
  checkinSource: challenge?.checkinSource ?? '',
  dataSource: getDefaultDataSource(challenge),
  overpassQL: challenge?.overpassQL ?? '',
  localGeoJSON: null,
  remoteGeoJSON: challenge?.remoteGeoJson ?? '',
  dataOriginDate: '',
  osmIdProperty: challenge?.osmIdProperty ?? '',
  taskBundleIdProperty: challenge?.taskBundleIdProperty ?? '',
  basemap: basemapSelection(challenge),
  basemapUrl: challenge?.customBasemap ?? '',
  ownerTeamId: challenge?.ownerTeamId ?? null,
  // Editing an existing challenge isn't an automated edit, so the agreement is
  // pre-satisfied; new challenges must explicitly accept it (see schema).
  automatedEditsCodeAgreement: challenge !== undefined,
})
