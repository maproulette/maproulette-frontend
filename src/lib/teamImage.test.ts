import { afterEach, describe, expect, it } from 'vitest'
import type { TranslateFn } from '@/i18n'
import {
  isUploadedTeamAvatarUrl,
  resolveTeamImageUrl,
  TEAM_IMAGE_ACCEPT,
  TEAM_IMAGE_MAX_BYTES,
  TEAM_IMAGE_MIME_TYPES,
  teamImageFileProblem,
} from './teamImage'

const t: TranslateFn = (id, values, defaultMessage) =>
  (defaultMessage ?? id).replace(/\{(\w+)\}/g, (_match, key: string) => String(values?.[key]))

type MutableEnv = { VITE_API_BASE_URL?: string }
const env = window.env as MutableEnv
const originalBaseUrl = env.VITE_API_BASE_URL

afterEach(() => {
  env.VITE_API_BASE_URL = originalBaseUrl
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
    env.VITE_API_BASE_URL = 'https://api.example.org'
    expect(resolveTeamImageUrl('/api/v2/teamImage/7/file')).toBe(
      'https://api.example.org/api/v2/teamImage/7/file'
    )
  })

  it('does not double up slashes when the base url has a trailing one', () => {
    env.VITE_API_BASE_URL = 'https://api.example.org/'
    expect(resolveTeamImageUrl('/api/v2/teamImage/7/file')).toBe(
      'https://api.example.org/api/v2/teamImage/7/file'
    )
  })

  it('inserts a separator for paths that do not start with a slash', () => {
    env.VITE_API_BASE_URL = 'https://api.example.org'
    expect(resolveTeamImageUrl('api/v2/teamImage/7/file')).toBe(
      'https://api.example.org/api/v2/teamImage/7/file'
    )
  })

  it('falls back to the local backend when no base url is configured', () => {
    env.VITE_API_BASE_URL = undefined
    expect(resolveTeamImageUrl('/api/v2/teamImage/7/file')).toBe(
      'http://127.0.0.1:9000/api/v2/teamImage/7/file'
    )
  })
})

describe('image constraints', () => {
  it('matches the 2MB cap the backend enforces', () => {
    expect(TEAM_IMAGE_MAX_BYTES).toBe(2 * 1024 * 1024)
  })

  it('accepts only the bitmap formats the backend stores', () => {
    expect(TEAM_IMAGE_ACCEPT).toBe('image/png,image/jpeg,image/webp,image/gif')
    expect(TEAM_IMAGE_ACCEPT).not.toContain('svg')
  })
})

describe('isUploadedTeamAvatarUrl', () => {
  it('recognises an avatar we store for the team', () => {
    expect(isUploadedTeamAvatarUrl('/api/v2/team/7/avatar/file', 7)).toBe(true)
  })

  it('does not claim the avatar of a different team', () => {
    expect(isUploadedTeamAvatarUrl('/api/v2/team/8/avatar/file', 7)).toBe(false)
  })

  it('does not claim an external url the team pasted in', () => {
    expect(isUploadedTeamAvatarUrl('https://example.org/logo.png', 7)).toBe(false)
  })

  it('is false when there is no avatar at all', () => {
    expect(isUploadedTeamAvatarUrl(undefined, 7)).toBe(false)
    expect(isUploadedTeamAvatarUrl(null, 7)).toBe(false)
    expect(isUploadedTeamAvatarUrl('', 7)).toBe(false)
  })
})

describe('teamImageFileProblem', () => {
  it.each(TEAM_IMAGE_MIME_TYPES)('accepts a %s file within the size cap', (type) => {
    expect(teamImageFileProblem(new File(['bytes'], 'logo', { type }), t)).toBeUndefined()
  })

  it('rejects a format the backend does not store', () => {
    const svg = new File(['<svg />'], 'logo.svg', { type: 'image/svg+xml' })
    expect(teamImageFileProblem(svg, t)).toBe('Image must be a PNG, JPEG, WebP or GIF file')
  })

  it('rejects a file over the 2MB cap, naming the limit', () => {
    const huge = new File([new Uint8Array(TEAM_IMAGE_MAX_BYTES + 1)], 'logo.png', {
      type: 'image/png',
    })
    expect(teamImageFileProblem(huge, t)).toBe('Image must be smaller than 2MB')
  })

  it('accepts a file sitting exactly on the cap', () => {
    const exact = new File([new Uint8Array(TEAM_IMAGE_MAX_BYTES)], 'logo.png', {
      type: 'image/png',
    })
    expect(teamImageFileProblem(exact, t)).toBeUndefined()
  })
})
