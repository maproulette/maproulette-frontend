import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Plugin, PluginApiContext } from '@/types/Plugin'

vi.mock('./DynamicPluginLoader', () => ({
  loadPluginFromUrl: vi.fn(),
}))

vi.mock('./pluginSecurity', () => ({
  validatePluginUrl: vi.fn(),
  validatePluginUrls: vi.fn(),
}))

const makePlugin = (id: string, overrides: Partial<Plugin> = {}): Plugin => ({
  metadata: { id, name: id, description: '', version: '1.0' },
  ...overrides,
})

async function freshRegistry() {
  vi.resetModules()
  const [dynamicLoaderModule, securityModule, { pluginRegistry }] = await Promise.all([
    import('./DynamicPluginLoader'),
    import('./pluginSecurity'),
    import('./PluginRegistry'),
  ])

  return {
    pluginRegistry,
    loadPluginFromUrl: vi.mocked(dynamicLoaderModule.loadPluginFromUrl),
    validatePluginUrl: vi.mocked(securityModule.validatePluginUrl),
    validatePluginUrls: vi.mocked(securityModule.validatePluginUrls),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('register', () => {
  it('registers a new plugin and makes it retrievable', async () => {
    const { pluginRegistry } = await freshRegistry()
    const plugin = makePlugin('a')

    pluginRegistry.register(plugin)

    expect(pluginRegistry.get('a')).toBe(plugin)
    expect(pluginRegistry.getAll()).toEqual([plugin])
  })

  it('keeps the original plugin when a duplicate id is registered', async () => {
    const { pluginRegistry } = await freshRegistry()
    const first = makePlugin('dup')
    const second = makePlugin('dup')

    pluginRegistry.register(first)
    pluginRegistry.register(second)

    expect(pluginRegistry.get('dup')).toBe(first)
    expect(pluginRegistry.getAll()).toHaveLength(1)
  })
})

describe('unregister', () => {
  it('removes a plugin that was never initialized', async () => {
    const { pluginRegistry } = await freshRegistry()
    const plugin = makePlugin('a')
    pluginRegistry.register(plugin)

    await pluginRegistry.unregister('a')

    expect(pluginRegistry.get('a')).toBeUndefined()
  })

  it('calls cleanup and clears initialized state for an initialized plugin', async () => {
    const { pluginRegistry } = await freshRegistry()
    const cleanup = vi.fn()
    const plugin = makePlugin('a', { cleanup })
    pluginRegistry.register(plugin)
    await pluginRegistry.initialize('a')

    await pluginRegistry.unregister('a')

    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(pluginRegistry.get('a')).toBeUndefined()
    expect(pluginRegistry.isInitialized('a')).toBe(false)
  })

  it('does not call cleanup when the plugin has no cleanup method', async () => {
    const { pluginRegistry } = await freshRegistry()
    const plugin = makePlugin('a')
    pluginRegistry.register(plugin)
    await pluginRegistry.initialize('a')

    await expect(pluginRegistry.unregister('a')).resolves.not.toThrow()
    expect(pluginRegistry.get('a')).toBeUndefined()
  })

  it('is a no-op for an id that is not registered', async () => {
    const { pluginRegistry } = await freshRegistry()

    await expect(pluginRegistry.unregister('missing')).resolves.not.toThrow()
  })

  it('logs and still fully removes the plugin when cleanup rejects', async () => {
    const { pluginRegistry } = await freshRegistry()
    const { logger } = await import('@/lib/logger')
    const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const cleanup = vi.fn().mockRejectedValue(new Error('cleanup failed'))
    const plugin = makePlugin('a', { cleanup })
    pluginRegistry.register(plugin)
    await pluginRegistry.initialize('a')

    await expect(pluginRegistry.unregister('a')).resolves.not.toThrow()

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Failed to cleanup plugin a',
      expect.objectContaining({ error: expect.any(Error) })
    )
    expect(pluginRegistry.get('a')).toBeUndefined()
    expect(pluginRegistry.isInitialized('a')).toBe(false)

    loggerErrorSpy.mockRestore()
  })
})

describe('get / getAll / getAllMetadata', () => {
  it('returns undefined for an unknown plugin id', async () => {
    const { pluginRegistry } = await freshRegistry()
    expect(pluginRegistry.get('missing')).toBeUndefined()
  })

  it('returns an empty list when no plugins are registered', async () => {
    const { pluginRegistry } = await freshRegistry()
    expect(pluginRegistry.getAll()).toEqual([])
    expect(pluginRegistry.getAllMetadata()).toEqual([])
  })

  it('returns metadata for all registered plugins', async () => {
    const { pluginRegistry } = await freshRegistry()
    const a = makePlugin('a')
    const b = makePlugin('b')
    pluginRegistry.register(a)
    pluginRegistry.register(b)

    expect(pluginRegistry.getAllMetadata()).toEqual([a.metadata, b.metadata])
  })
})

describe('initialize', () => {
  it('warns and returns without throwing for an unknown plugin id', async () => {
    const { pluginRegistry } = await freshRegistry()
    await expect(pluginRegistry.initialize('missing')).resolves.toBeUndefined()
    expect(pluginRegistry.isInitialized('missing')).toBe(false)
  })

  it('calls plugin.initialize with the configured api context', async () => {
    const { pluginRegistry } = await freshRegistry()
    const initialize = vi.fn()
    const plugin = makePlugin('a', { initialize })
    const apiContext = { api: {} } as unknown as PluginApiContext
    pluginRegistry.setApiContext(apiContext)
    pluginRegistry.register(plugin)

    await pluginRegistry.initialize('a')

    expect(initialize).toHaveBeenCalledWith(apiContext)
    expect(pluginRegistry.isInitialized('a')).toBe(true)
  })

  it('calls plugin.initialize with undefined when no api context is set', async () => {
    const { pluginRegistry } = await freshRegistry()
    const initialize = vi.fn()
    const plugin = makePlugin('a', { initialize })
    pluginRegistry.register(plugin)

    await pluginRegistry.initialize('a')

    expect(initialize).toHaveBeenCalledWith(undefined)
  })

  it('does not throw and marks the plugin initialized when it has no initialize method', async () => {
    const { pluginRegistry } = await freshRegistry()
    const plugin = makePlugin('a')
    pluginRegistry.register(plugin)

    await pluginRegistry.initialize('a')

    expect(pluginRegistry.isInitialized('a')).toBe(true)
  })

  it('warns and skips re-initialization when the plugin is already initialized', async () => {
    const { pluginRegistry } = await freshRegistry()
    const initialize = vi.fn()
    const plugin = makePlugin('a', { initialize })
    pluginRegistry.register(plugin)

    await pluginRegistry.initialize('a')
    await pluginRegistry.initialize('a')

    expect(initialize).toHaveBeenCalledTimes(1)
  })

  it('logs and does not mark the plugin initialized when initialize throws', async () => {
    const { pluginRegistry } = await freshRegistry()
    const initialize = vi.fn().mockRejectedValue(new Error('init failed'))
    const plugin = makePlugin('a', { initialize })
    pluginRegistry.register(plugin)

    await pluginRegistry.initialize('a')

    expect(pluginRegistry.isInitialized('a')).toBe(false)
  })
})

describe('cleanup', () => {
  it('returns without throwing for an unknown plugin id', async () => {
    const { pluginRegistry } = await freshRegistry()
    await expect(pluginRegistry.cleanup('missing')).resolves.toBeUndefined()
  })

  it('does nothing when the plugin is registered but not initialized', async () => {
    const { pluginRegistry } = await freshRegistry()
    const cleanup = vi.fn()
    const plugin = makePlugin('a', { cleanup })
    pluginRegistry.register(plugin)

    await pluginRegistry.cleanup('a')

    expect(cleanup).not.toHaveBeenCalled()
  })

  it('calls cleanup and clears initialized state', async () => {
    const { pluginRegistry } = await freshRegistry()
    const cleanup = vi.fn()
    const plugin = makePlugin('a', { cleanup })
    pluginRegistry.register(plugin)
    await pluginRegistry.initialize('a')

    await pluginRegistry.cleanup('a')

    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(pluginRegistry.isInitialized('a')).toBe(false)
  })

  it('logs and leaves initialized state intact when cleanup throws', async () => {
    const { pluginRegistry } = await freshRegistry()
    const cleanup = vi.fn().mockRejectedValue(new Error('cleanup failed'))
    const plugin = makePlugin('a', { cleanup })
    pluginRegistry.register(plugin)
    await pluginRegistry.initialize('a')

    await pluginRegistry.cleanup('a')

    expect(pluginRegistry.isInitialized('a')).toBe(true)
  })
})

describe('isInitialized', () => {
  it('returns false for a plugin id that was never initialized', async () => {
    const { pluginRegistry } = await freshRegistry()
    expect(pluginRegistry.isInitialized('missing')).toBe(false)
  })
})

describe('registerFromUrl', () => {
  it('rejects a URL that fails security validation without loading it', async () => {
    const { pluginRegistry, validatePluginUrl, loadPluginFromUrl } = await freshRegistry()
    validatePluginUrl.mockReturnValue(false)

    const result = await pluginRegistry.registerFromUrl('https://evil.com/plugin.js')

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/not allowed/)
    expect(loadPluginFromUrl).not.toHaveBeenCalled()
  })

  it('registers the loaded plugin and tracks its remote URL on success', async () => {
    const { pluginRegistry, validatePluginUrl, loadPluginFromUrl } = await freshRegistry()
    const plugin = makePlugin('remote-a')
    validatePluginUrl.mockReturnValue(true)
    loadPluginFromUrl.mockResolvedValue({ success: true, plugin })

    const result = await pluginRegistry.registerFromUrl('https://github.com/plugin.js')

    expect(result).toEqual({ success: true, plugin })
    expect(pluginRegistry.get('remote-a')).toBe(plugin)
    expect(pluginRegistry.getModuleUrl('remote-a')).toBe('https://github.com/plugin.js')
    expect(pluginRegistry.isRemotePlugin('remote-a')).toBe(true)
  })

  it('does not register anything when loading fails', async () => {
    const { pluginRegistry, validatePluginUrl, loadPluginFromUrl } = await freshRegistry()
    validatePluginUrl.mockReturnValue(true)
    loadPluginFromUrl.mockResolvedValue({ success: false, error: 'boom' })

    const result = await pluginRegistry.registerFromUrl('https://github.com/plugin.js')

    expect(result).toEqual({ success: false, error: 'boom' })
    expect(pluginRegistry.getAll()).toEqual([])
  })

  it('does not register anything when the load result has no plugin despite success', async () => {
    const { pluginRegistry, validatePluginUrl, loadPluginFromUrl } = await freshRegistry()
    validatePluginUrl.mockReturnValue(true)
    loadPluginFromUrl.mockResolvedValue({ success: true })

    const result = await pluginRegistry.registerFromUrl('https://github.com/plugin.js')

    expect(result).toEqual({ success: true })
    expect(pluginRegistry.getAll()).toEqual([])
  })
})

describe('registerFromUrls', () => {
  it('records an error for invalid URLs without attempting to load them', async () => {
    const { pluginRegistry, validatePluginUrls, loadPluginFromUrl } = await freshRegistry()
    validatePluginUrls.mockReturnValue({ valid: [], invalid: ['https://evil.com/plugin.js'] })

    const results = await pluginRegistry.registerFromUrls(['https://evil.com/plugin.js'])

    expect(results.get('https://evil.com/plugin.js')).toEqual({
      success: false,
      error: 'Plugin URL not allowed: https://evil.com/plugin.js',
    })
    expect(loadPluginFromUrl).not.toHaveBeenCalled()
  })

  it('keys successful loads by plugin id and failed loads by URL', async () => {
    const { pluginRegistry, validatePluginUrl, validatePluginUrls, loadPluginFromUrl } =
      await freshRegistry()
    const plugin = makePlugin('remote-b')
    validatePluginUrl.mockReturnValue(true)
    validatePluginUrls.mockReturnValue({
      valid: ['https://github.com/good.js', 'https://github.com/bad.js'],
      invalid: [],
    })
    loadPluginFromUrl.mockImplementation(async (url: string) =>
      url.includes('good') ? { success: true, plugin } : { success: false, error: 'failed to load' }
    )

    const results = await pluginRegistry.registerFromUrls([
      'https://github.com/good.js',
      'https://github.com/bad.js',
    ])

    expect(results.get('remote-b')).toEqual({ success: true, plugin })
    expect(results.get('https://github.com/bad.js')).toEqual({
      success: false,
      error: 'failed to load',
    })
  })
})

describe('getModuleUrl / isRemotePlugin / getRemotePluginUrls', () => {
  it('returns undefined/false for a plugin that was never loaded from a URL', async () => {
    const { pluginRegistry } = await freshRegistry()
    expect(pluginRegistry.getModuleUrl('missing')).toBeUndefined()
    expect(pluginRegistry.isRemotePlugin('missing')).toBe(false)
  })

  it('returns a defensive copy of the remote plugin URL map', async () => {
    const { pluginRegistry, validatePluginUrl, loadPluginFromUrl } = await freshRegistry()
    const plugin = makePlugin('remote-c')
    validatePluginUrl.mockReturnValue(true)
    loadPluginFromUrl.mockResolvedValue({ success: true, plugin })
    await pluginRegistry.registerFromUrl('https://github.com/plugin.js')

    const urls = pluginRegistry.getRemotePluginUrls()
    urls.delete('remote-c')

    expect(pluginRegistry.getRemotePluginUrls().has('remote-c')).toBe(true)
  })
})
