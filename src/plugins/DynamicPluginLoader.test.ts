// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Plugin } from '@/types/Plugin'
import {
  fetchPluginManifest,
  loadPluginFromUrl,
  loadPluginsFromManifests,
  loadPluginViaScript,
  PLUGIN_SCRIPT_LOAD_TIMEOUT_MS,
  type RemotePluginManifest,
  validatePluginManifest,
} from './DynamicPluginLoader'

const globalWindow = window as unknown as Record<string, unknown>

// happy-dom's HTMLScriptElement drives its own load/error lifecycle as soon as
// it is connected to the document (JS evaluation is disabled by default, so it
// synchronously fires an "error" event on append). That races with the source
// module's own onload/onerror wiring, so appendChild/removeChild are replaced
// here with plain bookkeeping - the created <script> node is still a real DOM
// node (so `.src`/`.async`/`.crossOrigin` reads work), it just never actually
// connects to the document, letting the tests drive onload/onerror manually.
let appendedScripts: HTMLScriptElement[] = []

const lastScript = (): HTMLScriptElement => appendedScripts[appendedScripts.length - 1]

beforeEach(() => {
  appendedScripts = []
  vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
    appendedScripts.push(node as HTMLScriptElement)
    return node
  })
  vi.spyOn(document.head, 'removeChild').mockImplementation((node) => {
    appendedScripts = appendedScripts.filter((script) => script !== node)
    return node
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadPluginViaScript', () => {
  it.each([
    ['directly', 'direct', 'p1', 'Plugin One', 'DirectPlugin'],
    ['wrapped in a default export', 'default', 'p2', 'Plugin Two', 'DefaultWrapped'],
    ['wrapped under a `plugin` key', 'plugin', 'p3', 'Plugin Three', 'PluginWrapped'],
  ] as const)(
    'resolves with the plugin when window[globalName] exposes it %s',
    async (_label, kind, id, name, globalName) => {
      const plugin: Plugin = { metadata: { id, name, description: '', version: '1.0' } }
      const promise = loadPluginViaScript(`https://cdn.maproulette.org/${id}.js`, globalName)
      globalWindow[globalName] =
        kind === 'default' ? { default: plugin } : kind === 'plugin' ? { plugin } : plugin
      lastScript().onload?.(new Event('load'))

      await expect(promise).resolves.toEqual({ success: true, plugin })
    }
  )

  it('prefers `default` over `plugin` when both are present', async () => {
    const defaultPlugin: Plugin = {
      metadata: { id: 'default', name: 'Default', description: '', version: '1.0' },
    }
    const otherPlugin: Plugin = {
      metadata: { id: 'other', name: 'Other', description: '', version: '1.0' },
    }
    const promise = loadPluginViaScript('https://cdn.maproulette.org/p4.js', 'BothWrapped')
    globalWindow.BothWrapped = { default: defaultPlugin, plugin: otherPlugin }
    lastScript().onload?.(new Event('load'))

    await expect(promise).resolves.toEqual({ success: true, plugin: defaultPlugin })
  })

  it('fails when nothing is exposed at window[globalName]', async () => {
    const promise = loadPluginViaScript('https://cdn.maproulette.org/missing.js', 'MissingGlobal')
    lastScript().onload?.(new Event('load'))

    await expect(promise).resolves.toEqual({
      success: false,
      error: 'Plugin not found at window["MissingGlobal"]',
    })
    expect(appendedScripts).toHaveLength(0)
  })

  it.each([
    ['is neither an object nor wrapped in default/plugin', 'PrimitiveGlobal', 'not-a-plugin'],
    ['has both default and plugin wrappers absent', 'EmptyObjectGlobal', {}],
  ] as const)('fails when the exposed value %s', async (_label, globalName, value) => {
    const promise = loadPluginViaScript(`https://cdn.maproulette.org/${globalName}.js`, globalName)
    globalWindow[globalName] = value
    lastScript().onload?.(new Event('load'))

    await expect(promise).resolves.toEqual({
      success: false,
      error: `Plugin not found at window["${globalName}"]`,
    })
  })

  it.each([
    ['has no metadata at all', 'NoMetadataGlobal', { metadata: undefined }],
    ['metadata is missing an id', 'NoIdGlobal', { metadata: { name: 'Has Name' } }],
    ['metadata is missing a name', 'NoNameGlobal', { metadata: { id: 'has-id' } }],
  ] as const)('fails when the plugin %s', async (_label, globalName, value) => {
    const promise = loadPluginViaScript(`https://cdn.maproulette.org/${globalName}.js`, globalName)
    globalWindow[globalName] = value
    lastScript().onload?.(new Event('load'))

    await expect(promise).resolves.toEqual({
      success: false,
      error: 'Plugin is missing required metadata (id, name)',
    })
  })

  it('resolves with an error and removes the script when reading window[globalName] throws an Error', async () => {
    const promise = loadPluginViaScript('https://cdn.maproulette.org/throws.js', 'ThrowingGlobal')
    Object.defineProperty(window, 'ThrowingGlobal', {
      configurable: true,
      get() {
        throw new Error('boom')
      },
    })
    lastScript().onload?.(new Event('load'))

    await expect(promise).resolves.toEqual({ success: false, error: 'boom' })
    expect(appendedScripts).toHaveLength(0)

    Object.defineProperty(window, 'ThrowingGlobal', { configurable: true, value: undefined })
  })

  it('resolves with a generic message when a non-Error value is thrown', async () => {
    const promise = loadPluginViaScript(
      'https://cdn.maproulette.org/throwsstring.js',
      'ThrowingStringGlobal'
    )
    Object.defineProperty(window, 'ThrowingStringGlobal', {
      configurable: true,
      get() {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'not-an-error'
      },
    })
    lastScript().onload?.(new Event('load'))

    await expect(promise).resolves.toEqual({ success: false, error: 'Failed to load plugin' })

    Object.defineProperty(window, 'ThrowingStringGlobal', { configurable: true, value: undefined })
  })

  it('resolves with an error and removes the script when the script fails to load', async () => {
    const promise = loadPluginViaScript('https://cdn.maproulette.org/error.js', 'ErrorGlobal')
    lastScript().onerror?.(new Event('error'))

    await expect(promise).resolves.toEqual({
      success: false,
      error: 'Failed to load plugin script',
    })
    expect(appendedScripts).toHaveLength(0)
  })

  it('configures the script element with the given URL, async and crossOrigin attributes', () => {
    loadPluginViaScript('https://cdn.maproulette.org/config.js', 'ConfigGlobal')
    const script = lastScript()

    expect(script.src).toBe('https://cdn.maproulette.org/config.js')
    expect(script.async).toBe(true)
    expect(script.crossOrigin).toBe('anonymous')
  })

  it('rejects a disallowed host without touching the DOM when called directly', async () => {
    const result = await loadPluginViaScript('https://evil.com/plugin.js', 'EvilGlobal')

    expect(result).toEqual({
      success: false,
      error:
        'Plugin URL not allowed. URL must be from an approved host. See plugin security documentation.',
    })
    expect(appendedScripts).toHaveLength(0)
  })

  describe('load timeout', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('resolves with a timeout error when neither load nor error fires in time', async () => {
      const promise = loadPluginViaScript('https://cdn.maproulette.org/slow.js', 'SlowGlobal')
      const removeSpy = vi.spyOn(lastScript(), 'remove')

      await vi.advanceTimersByTimeAsync(PLUGIN_SCRIPT_LOAD_TIMEOUT_MS)

      await expect(promise).resolves.toEqual({
        success: false,
        error: 'Timed out loading plugin script',
      })
      expect(removeSpy).toHaveBeenCalledOnce()
    })

    it('ignores a late onload firing after the script has already timed out', async () => {
      const plugin: Plugin = {
        metadata: { id: 'late', name: 'Late', description: '', version: '1.0' },
      }
      const promise = loadPluginViaScript('https://cdn.maproulette.org/slow2.js', 'SlowGlobal2')
      const script = lastScript()

      await vi.advanceTimersByTimeAsync(PLUGIN_SCRIPT_LOAD_TIMEOUT_MS)
      await expect(promise).resolves.toEqual({
        success: false,
        error: 'Timed out loading plugin script',
      })

      globalWindow.SlowGlobal2 = plugin
      expect(() => script.onload?.(new Event('load'))).not.toThrow()
      // The promise already settled from the timeout; a late onload must not
      // change or re-resolve it.
      await expect(promise).resolves.toEqual({
        success: false,
        error: 'Timed out loading plugin script',
      })
    })

    it('ignores a late onerror firing after the script has already timed out', async () => {
      const promise = loadPluginViaScript('https://cdn.maproulette.org/slow3.js', 'SlowGlobal3')
      const script = lastScript()

      await vi.advanceTimersByTimeAsync(PLUGIN_SCRIPT_LOAD_TIMEOUT_MS)
      await expect(promise).resolves.toEqual({
        success: false,
        error: 'Timed out loading plugin script',
      })

      expect(() => script.onerror?.(new Event('error'))).not.toThrow()
      await expect(promise).resolves.toEqual({
        success: false,
        error: 'Timed out loading plugin script',
      })
    })

    it('does not time out if the script loads before the deadline', async () => {
      const plugin: Plugin = {
        metadata: { id: 'fast', name: 'Fast', description: '', version: '1.0' },
      }
      const promise = loadPluginViaScript('https://cdn.maproulette.org/fast.js', 'FastGlobal')
      globalWindow.FastGlobal = plugin

      await vi.advanceTimersByTimeAsync(PLUGIN_SCRIPT_LOAD_TIMEOUT_MS - 1)
      lastScript().onload?.(new Event('load'))

      await expect(promise).resolves.toEqual({ success: true, plugin })

      // The (now-cleared) timeout must not fire and change the result.
      await vi.advanceTimersByTimeAsync(1)
      await expect(promise).resolves.toEqual({ success: true, plugin })
    })
  })
})

describe('loadPluginFromUrl', () => {
  it('rejects non-http(s) protocols via the security allowlist check', async () => {
    const result = await loadPluginFromUrl('ftp://cdn.maproulette.org/plugin.js')

    expect(result).toEqual({
      success: false,
      error:
        'Plugin URL not allowed. URL must be from an approved host. See plugin security documentation.',
    })
    expect(appendedScripts).toHaveLength(0)
  })

  it('returns an error result for a malformed URL instead of throwing', async () => {
    const result = await loadPluginFromUrl('not a valid url')

    expect(result.success).toBe(false)
    expect(typeof result.error).toBe('string')
  })

  it('derives the global name from the URL filename and delegates to script loading', async () => {
    const plugin: Plugin = {
      metadata: { id: 'derived', name: 'Derived', description: '', version: '1.0' },
    }
    const promise = loadPluginFromUrl('https://cdn.maproulette.org/path/derivedGlobal.js')
    globalWindow.derivedGlobal = plugin
    lastScript().onload?.(new Event('load'))

    await expect(promise).resolves.toEqual({ success: true, plugin })
  })

  it('falls back to an empty global name when the URL has no filename segment', async () => {
    const result = loadPluginFromUrl('https://cdn.maproulette.org/')
    lastScript().onload?.(new Event('load'))

    await expect(result).resolves.toEqual({
      success: false,
      error: 'Plugin not found at window[""]',
    })
  })
})

describe('loadPluginsFromManifests', () => {
  it('returns an empty map for an empty manifest list', async () => {
    const result = await loadPluginsFromManifests([])
    expect(result).toEqual(new Map())
  })

  it('loads each manifest and keys the results by manifest id', async () => {
    const notAllowedError =
      'Plugin URL not allowed. URL must be from an approved host. See plugin security documentation.'
    const manifests: RemotePluginManifest[] = [
      { id: 'one', name: 'One', moduleUrl: 'ftp://cdn.maproulette.org/one.js', version: '1.0' },
      { id: 'two', name: 'Two', moduleUrl: 'ftp://cdn.maproulette.org/two.js', version: '1.0' },
    ]

    const result = await loadPluginsFromManifests(manifests)

    expect(result.size).toBe(2)
    expect(result.get('one')).toEqual({ success: false, error: notAllowedError })
    expect(result.get('two')).toEqual({ success: false, error: notAllowedError })
  })
})

describe('validatePluginManifest', () => {
  it('accepts a manifest with all required string fields', () => {
    expect(
      validatePluginManifest({
        id: 'a',
        name: 'A',
        moduleUrl: 'https://cdn.maproulette.org/a.js',
        version: '1.0',
      })
    ).toBe(true)
  })

  it('rejects null', () => {
    expect(validatePluginManifest(null)).toBe(false)
  })

  it('rejects non-object values', () => {
    expect(validatePluginManifest('a string')).toBe(false)
    expect(validatePluginManifest(42)).toBe(false)
  })

  it.each([
    ['id', { name: 'A', moduleUrl: 'https://cdn.maproulette.org/a.js', version: '1.0' }],
    ['name', { id: 'a', moduleUrl: 'https://cdn.maproulette.org/a.js', version: '1.0' }],
    ['moduleUrl', { id: 'a', name: 'A', version: '1.0' }],
    ['version', { id: 'a', name: 'A', moduleUrl: 'https://cdn.maproulette.org/a.js' }],
  ] as const)('rejects a manifest missing %s', (_field, manifest) => {
    expect(validatePluginManifest(manifest)).toBe(false)
  })
})

describe('fetchPluginManifest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null for a disallowed host without fetching', async () => {
    vi.stubGlobal('fetch', vi.fn())

    await expect(fetchPluginManifest('https://evil.com/manifest.json')).resolves.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns the parsed manifest when the response is a valid manifest', async () => {
    const manifest = {
      id: 'a',
      name: 'A',
      moduleUrl: 'https://cdn.maproulette.org/a.js',
      version: '1.0',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(manifest), { status: 200 }))
    )

    await expect(fetchPluginManifest('https://cdn.maproulette.org/manifest.json')).resolves.toEqual(
      manifest
    )
  })

  it('returns null when the response body is not a valid manifest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ foo: 'bar' }), { status: 200 }))
    )

    await expect(
      fetchPluginManifest('https://cdn.maproulette.org/manifest.json')
    ).resolves.toBeNull()
  })

  it('returns null when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 }))
    )

    await expect(
      fetchPluginManifest('https://cdn.maproulette.org/manifest.json')
    ).resolves.toBeNull()
  })

  it('returns null when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      })
    )

    await expect(
      fetchPluginManifest('https://cdn.maproulette.org/manifest.json')
    ).resolves.toBeNull()
  })
})
