import { afterEach, describe, expect, it } from 'vitest'
import { resolveTeamImageUrl, TEAM_IMAGE_ACCEPT, TEAM_IMAGE_MAX_BYTES } from './teamImage'

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
