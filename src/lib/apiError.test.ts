import type { NormalizedOptions } from 'ky'
import { HTTPError } from 'ky'
import { describe, expect, it } from 'vitest'
import { getApiErrorMessage, getLockConflict, getLockConflictInfo } from './apiError.ts'

const makeHttpError = (body: unknown, status = 400) => {
  const response = new Response(JSON.stringify(body), { status })
  const request = new Request('http://example.test/api')
  return new HTTPError(response, request, {} as NormalizedOptions)
}

describe('getApiErrorMessage', () => {
  it('returns undefined for a plain Error', async () => {
    await expect(getApiErrorMessage(new Error('boom'))).resolves.toBeUndefined()
  })

  it('returns undefined for non-error values', async () => {
    await expect(getApiErrorMessage('nope')).resolves.toBeUndefined()
    await expect(getApiErrorMessage(undefined)).resolves.toBeUndefined()
    await expect(getApiErrorMessage(null)).resolves.toBeUndefined()
  })

  it('extracts the message field from the backend error body', async () => {
    const error = makeHttpError({ status: 'KO', message: 'Challenge not found' })
    await expect(getApiErrorMessage(error)).resolves.toBe('Challenge not found')
  })

  it('returns undefined when the body has no message field', async () => {
    const error = makeHttpError({ status: 'KO' })
    await expect(getApiErrorMessage(error)).resolves.toBeUndefined()
  })

  it('returns undefined when the message field is not a string', async () => {
    const error = makeHttpError({ status: 'KO', message: 123 })
    await expect(getApiErrorMessage(error)).resolves.toBeUndefined()
  })

  it('returns undefined when the response body is not valid JSON', async () => {
    const response = new Response('not json', { status: 500 })
    const request = new Request('http://example.test/api')
    const error = new HTTPError(response, request, {} as NormalizedOptions)
    await expect(getApiErrorMessage(error)).resolves.toBeUndefined()
  })
})

describe('getLockConflict', () => {
  it('returns undefined for a plain Error', async () => {
    await expect(getLockConflict(new Error('boom'))).resolves.toBeUndefined()
  })

  it('returns undefined for a non-409 HTTPError', async () => {
    const error = makeHttpError({ lockedTaskId: 5, bundledTasks: [] }, 403)
    await expect(getLockConflict(error)).resolves.toBeUndefined()
  })

  it('returns undefined when the 409 body has no lockedTaskId', async () => {
    const error = makeHttpError({ status: 'Conflict', message: 'nope' }, 409)
    await expect(getLockConflict(error)).resolves.toBeUndefined()
  })

  it('parses a full lock conflict body', async () => {
    const error = makeHttpError(
      {
        lockedTaskId: 42,
        parentName: 'My Challenge',
        bundledTasks: [43, 44],
        startedAt: '2026-01-01T00:00:00.000Z',
      },
      409
    )
    await expect(getLockConflict(error)).resolves.toEqual({
      lockedTaskId: 42,
      parentName: 'My Challenge',
      bundledTasks: [43, 44],
      startedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('defaults optional fields when missing', async () => {
    const error = makeHttpError({ lockedTaskId: 7 }, 409)
    await expect(getLockConflict(error)).resolves.toEqual({
      lockedTaskId: 7,
      parentName: undefined,
      bundledTasks: [],
      startedAt: undefined,
    })
  })

  it('returns undefined when the 409 response body is not valid JSON', async () => {
    const response = new Response('not json', { status: 409 })
    const request = new Request('http://example.test/api')
    const error = new HTTPError(response, request, {} as NormalizedOptions)
    await expect(getLockConflict(error)).resolves.toBeUndefined()
  })
})

describe('getLockConflictInfo', () => {
  it('includes the message field when it is a string', async () => {
    const error = makeHttpError({ lockedTaskId: 7, message: 'already locked elsewhere' }, 409)
    await expect(getLockConflictInfo(error)).resolves.toEqual(
      expect.objectContaining({ lockedTaskId: 7, message: 'already locked elsewhere' })
    )
  })

  it('omits the message field when it is not a string', async () => {
    const error = makeHttpError({ lockedTaskId: 7, message: 123 }, 409)
    await expect(getLockConflictInfo(error)).resolves.toEqual(
      expect.objectContaining({ lockedTaskId: 7, message: undefined })
    )
  })
})
