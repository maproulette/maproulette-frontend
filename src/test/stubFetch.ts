import { vi } from 'vitest'

/** Stubs the global `fetch` to resolve with the given Response. Pair with `afterEach(() => vi.unstubAllGlobals())`. */
export function stubFetch(response: Response) {
  const fetchMock = vi.fn(async (_request: Request) => response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
