import { describe, expect, it } from 'vitest'
import { matchPath } from './matchPath.ts'

describe('matchPath', () => {
  it('matches an exact static path', () => {
    expect(matchPath('/foo/bar', '/foo/bar')).toEqual({ matched: true, params: {} })
  })

  it('does not match a completely different path', () => {
    expect(matchPath('/foo/bar', '/baz/qux')).toEqual({ matched: false, params: {} })
  })

  it('extracts a single param', () => {
    expect(matchPath('/foo/:id', '/foo/123')).toEqual({ matched: true, params: { id: '123' } })
  })

  it('extracts multiple params', () => {
    expect(matchPath('/foo/:fooId/bar/:barId', '/foo/1/bar/2')).toEqual({
      matched: true,
      params: { fooId: '1', barId: '2' },
    })
  })

  it('normalizes a trailing slash on the pattern only', () => {
    expect(matchPath('/foo/bar/', '/foo/bar')).toEqual({ matched: true, params: {} })
  })

  it('normalizes a trailing slash on the path only', () => {
    expect(matchPath('/foo/bar', '/foo/bar/')).toEqual({ matched: true, params: {} })
  })

  it('normalizes a trailing slash on both pattern and path when extracting params', () => {
    expect(matchPath('/foo/:id/', '/foo/123/')).toEqual({ matched: true, params: { id: '123' } })
  })

  it('does not match when the path has fewer segments than the pattern', () => {
    expect(matchPath('/foo/:id/bar', '/foo/123')).toEqual({ matched: false, params: {} })
  })

  it('does not match when the path has more segments than the pattern', () => {
    expect(matchPath('/foo/:id', '/foo/123/bar')).toEqual({ matched: false, params: {} })
  })

  it('does not match when a static segment differs from the param pattern', () => {
    expect(matchPath('/foo/:id', '/bar/123')).toEqual({ matched: false, params: {} })
  })

  it('treats the root path "/" as already normalized', () => {
    expect(matchPath('/', '/')).toEqual({ matched: true, params: {} })
  })
})
