import { describe, expect, it } from 'vitest'
import type { TranslateFn } from '@/i18n'
import { getGitHubErrorMessage } from './ReportModalHelpers'

// Mimics the real t() default-message fallback: since the message catalog
// isn't loaded in this test, always return the provided default message
// (or the id itself if no default was given).
const t: TranslateFn = (_id, _values, defaultMessage) => defaultMessage ?? _id

describe('getGitHubErrorMessage', () => {
  it('returns the auth error message when the message includes "Bad credentials"', () => {
    const result = getGitHubErrorMessage(t, 500, 'Bad credentials')
    expect(result).toBe(
      'GitHub authentication failed. Please check that your GitHub token is valid and has the necessary permissions.'
    )
  })

  it('returns the auth error message when status is 401, regardless of message text', () => {
    const result = getGitHubErrorMessage(t, 401, 'Unauthorized')
    expect(result).toBe(
      'GitHub authentication failed. Please check that your GitHub token is valid and has the necessary permissions.'
    )
  })

  it('returns the forbidden error message when status is 403', () => {
    const result = getGitHubErrorMessage(t, 403, 'Forbidden')
    expect(result).toBe(
      'GitHub API access forbidden. The token may not have the required permissions or the repository may be private.'
    )
  })

  it('returns the not-found error message when status is 404', () => {
    const result = getGitHubErrorMessage(t, 404, 'Not Found')
    expect(result).toBe(
      'GitHub repository not found. Please check that the repository exists and is accessible.'
    )
  })

  it('falls back to the raw message for an unrecognized status/message combination', () => {
    const result = getGitHubErrorMessage(t, 500, 'Internal Server Error')
    expect(result).toBe('Internal Server Error')
  })

  it('prioritizes the "Bad credentials" message check even when status is unrelated', () => {
    const result = getGitHubErrorMessage(t, 422, 'Bad credentials')
    expect(result).toBe(
      'GitHub authentication failed. Please check that your GitHub token is valid and has the necessary permissions.'
    )
  })
})
