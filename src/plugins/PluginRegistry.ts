import { logger } from '@/lib/logger'
import type { Plugin, PluginApiContext } from '@/types/Plugin'
import { loadPluginFromUrl, type PluginLoadResult } from './DynamicPluginLoader'
import { validatePluginUrl, validatePluginUrls } from './pluginSecurity'

/**
 * Central registry for all available plugins
 * Plugins must be registered here to be available to users
 */
class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map()
  private initializedPlugins: Set<string> = new Set()
  private remotePluginUrls: Map<string, string> = new Map() // pluginId -> moduleUrl
  private loadedModuleUrls: Map<string, string> = new Map() // moduleUrl -> pluginId
  private apiContext: PluginApiContext | null = null

  /**
   * Register a plugin in the registry
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.metadata.id)) {
      logger.warn(`Plugin ${plugin.metadata.id} is already registered`)
      return
    }
    this.plugins.set(plugin.metadata.id, plugin)
  }

  /**
   * Unregister a plugin from the registry
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      if (this.initializedPlugins.has(pluginId)) {
        try {
          await plugin.cleanup?.()
        } catch (error) {
          logger.error(`Failed to cleanup plugin ${pluginId}`, { error })
        }
        this.initializedPlugins.delete(pluginId)
      }
      this.plugins.delete(pluginId)
    }
  }

  /**
   * Get a plugin by ID
   */
  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * Get all registered plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get all plugin metadata
   */
  getAllMetadata(): Array<Plugin['metadata']> {
    return Array.from(this.plugins.values()).map((plugin) => plugin.metadata)
  }

  /**
   * Set the API context that will be provided to plugins
   */
  setApiContext(context: PluginApiContext): void {
    this.apiContext = context
  }

  /**
   * Initialize a plugin
   */
  async initialize(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      logger.warn(`Plugin ${pluginId} not found`)
      return
    }

    if (this.initializedPlugins.has(pluginId)) {
      logger.warn(`Plugin ${pluginId} is already initialized`)
      return
    }

    try {
      await plugin.initialize?.(this.apiContext ?? undefined)
      this.initializedPlugins.add(pluginId)
    } catch (error) {
      logger.error(`Failed to initialize plugin ${pluginId}`, { error })
    }
  }

  /**
   * Cleanup a plugin
   */
  async cleanup(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      return
    }

    if (!this.initializedPlugins.has(pluginId)) {
      return
    }

    try {
      await plugin.cleanup?.()
      this.initializedPlugins.delete(pluginId)
    } catch (error) {
      logger.error(`Failed to cleanup plugin ${pluginId}`, { error })
    }
  }

  /**
   * Check if a plugin is initialized
   */
  isInitialized(pluginId: string): boolean {
    return this.initializedPlugins.has(pluginId)
  }

  /**
   * Register a plugin from a remote URL
   * URL must be in the security allowlist
   */
  async registerFromUrl(moduleUrl: string): Promise<PluginLoadResult> {
    // Validate URL against security allowlist
    if (!validatePluginUrl(moduleUrl)) {
      return {
        success: false,
        error:
          'Plugin URL not allowed. URL must be from an approved host. See plugin security documentation.',
      }
    }

    const existingPluginId = this.loadedModuleUrls.get(moduleUrl)
    if (existingPluginId) {
      const plugin = this.plugins.get(existingPluginId)
      if (plugin) {
        return { success: true, plugin }
      }
    }

    const result = await loadPluginFromUrl(moduleUrl)

    if (result.success && result.plugin) {
      this.register(result.plugin)
      this.remotePluginUrls.set(result.plugin.metadata.id, moduleUrl)
      this.loadedModuleUrls.set(moduleUrl, result.plugin.metadata.id)
    }

    return result
  }

  /**
   * Register multiple plugins from URLs
   * Validates all URLs before loading
   */
  async registerFromUrls(moduleUrls: string[]): Promise<Map<string, PluginLoadResult>> {
    const results = new Map<string, PluginLoadResult>()
    const { valid, invalid } = validatePluginUrls(moduleUrls)

    // Add errors for invalid URLs
    for (const url of invalid) {
      results.set(url, {
        success: false,
        error: `Plugin URL not allowed: ${url}`,
      })
    }

    // Load valid URLs
    for (const url of valid) {
      const result = await this.registerFromUrl(url)
      if (result.plugin) {
        results.set(result.plugin.metadata.id, result)
      } else {
        results.set(url, result)
      }
    }

    return results
  }

  /**
   * Get the module URL for a remote plugin
   */
  getModuleUrl(pluginId: string): string | undefined {
    return this.remotePluginUrls.get(pluginId)
  }

  /**
   * Check if a plugin was loaded from a remote URL
   */
  isRemotePlugin(pluginId: string): boolean {
    return this.remotePluginUrls.has(pluginId)
  }

  /**
   * Get all remote plugin URLs
   */
  getRemotePluginUrls(): Map<string, string> {
    return new Map(this.remotePluginUrls)
  }
}

// Export singleton instance
export const pluginRegistry = new PluginRegistry()
