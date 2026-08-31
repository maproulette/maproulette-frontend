import { AlertCircle, Download, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Fragment, useId, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/Item'
import { Label } from '@/components/ui/Label'
import { usePluginContext } from '@/contexts/PluginContext'
import { logger } from '@/lib/logger'

interface PluginPreview {
  name: string
  description: string
  version: string
  author?: string
}

export const RemotePluginManager = () => {
  const { registerPluginFromUrl, removeRemotePlugin, getAvailablePlugins, getRemotePluginUrls } =
    usePluginContext()
  const [moduleUrl, setModuleUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [pluginPreview, setPluginPreview] = useState<PluginPreview | null>(null)
  const inputId = useId()

  const remotePluginUrls = getRemotePluginUrls()
  const availablePlugins = getAvailablePlugins()
  const remotePlugins = availablePlugins.filter((plugin) =>
    remotePluginUrls.has(plugin.metadata.id)
  )

  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url)
      if (!parsed.protocol.startsWith('http')) {
        setValidationError('Only HTTP(S) URLs are supported')
        return false
      }
      setValidationError(null)
      return true
    } catch {
      setValidationError('Invalid URL format')
      return false
    }
  }

  const handleSearchPlugin = async () => {
    if (!moduleUrl.trim()) {
      setValidationError('Please enter a module URL')
      return
    }

    if (!validateUrl(moduleUrl)) {
      return
    }

    setIsLoading(true)
    setValidationError(null)
    setPluginPreview(null)

    try {
      // Try to load the plugin to get its metadata
      const result = await registerPluginFromUrl(moduleUrl)

      if (result.success && result.plugin) {
        // Show preview of the found plugin
        setPluginPreview({
          name: result.plugin.metadata.name,
          description: result.plugin.metadata.description,
          version: result.plugin.metadata.version,
          author: result.plugin.metadata.author,
        })
        toast.success(`Plugin "${result.plugin.metadata.name}" found and added to My Plugins!`)
        setModuleUrl('')
      } else {
        setValidationError(result.error || 'Plugin not found or failed to load')
        toast.error(`Failed to load plugin: ${result.error}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load plugin'
      setValidationError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePlugin = async (pluginId: string, pluginName: string) => {
    if (!confirm(`Are you sure you want to remove the plugin "${pluginName}"?`)) {
      return
    }

    try {
      await removeRemotePlugin(pluginId)
      toast.success(`Plugin "${pluginName}" removed successfully`)
    } catch (error) {
      toast.error('Failed to remove plugin')
      logger.error('Failed to remove plugin', { error })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 font-semibold text-base">Remote Plugins</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Load plugins dynamically from external URLs. Make sure you trust the source before adding
          any plugin.
        </p>
      </div>

      <Alert variant="warning">
        <AlertCircle className="size-4" />
        <AlertTitle>Security Warning</AlertTitle>
        <AlertDescription>
          Only load plugins from trusted sources. Remote plugins have access to your application and
          data. Always verify the source before adding a plugin.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor={inputId}>Plugin Module URL</Label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            type="url"
            placeholder="https://example.com/my-plugin.js"
            value={moduleUrl}
            onChange={(e) => {
              setModuleUrl(e.target.value)
              setValidationError(null)
              setPluginPreview(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && moduleUrl.trim() && !isLoading) {
                handleSearchPlugin()
              }
            }}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="button"
            onClick={handleSearchPlugin}
            disabled={isLoading || !moduleUrl.trim()}
          >
            {isLoading ? (
              <>
                <Download className="mr-2 size-4 animate-pulse" />
                Loading...
              </>
            ) : (
              <>
                <Plus className="mr-2 size-4" />
                Add Plugin
              </>
            )}
          </Button>
        </div>
        {validationError && (
          <p className="flex items-center gap-1 text-red-600 text-sm dark:text-red-400">
            <AlertCircle className="size-3" />
            {validationError}
          </p>
        )}
        <p className="text-xs text-zinc-500">
          Enter the full URL to a plugin module (ESM format). The plugin will be searched and added
          to your plugins.
        </p>
      </div>

      {pluginPreview && (
        <div className="rounded-lg border border-lime-200 bg-lime-50 p-4 dark:border-lime-800 dark:bg-lime-950/20">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="size-4 text-lime-600 dark:text-lime-400" />
            <span className="font-semibold text-lime-900 text-sm dark:text-lime-100">
              Plugin Found!
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-lime-900 dark:text-lime-100">
                {pluginPreview.name}
              </span>
              <span className="text-lime-700 text-xs dark:text-lime-400">
                v{pluginPreview.version}
              </span>
            </div>
            <p className="text-lime-800 dark:text-lime-300">{pluginPreview.description}</p>
            {pluginPreview.author && (
              <p className="text-lime-700 text-xs dark:text-lime-400">by {pluginPreview.author}</p>
            )}
          </div>
        </div>
      )}

      {remotePlugins.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Loaded Remote Plugins</h4>
          <ItemGroup>
            {remotePlugins.map((plugin, index) => {
              const moduleUrl = remotePluginUrls.get(plugin.metadata.id)
              return (
                <Fragment key={plugin.metadata.id}>
                  <Item variant="outline" size="sm">
                    <ItemContent>
                      <ItemTitle>
                        {plugin.metadata.name}
                        <span className="text-xs text-zinc-500">v{plugin.metadata.version}</span>
                      </ItemTitle>
                      {moduleUrl && (
                        <ItemDescription>
                          <a
                            href={moduleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="size-3" />
                            {moduleUrl.length > 60 ? `${moduleUrl.substring(0, 60)}...` : moduleUrl}
                          </a>
                        </ItemDescription>
                      )}
                    </ItemContent>
                    <ItemActions>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePlugin(plugin.metadata.id, plugin.metadata.name)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </ItemActions>
                  </Item>
                  {index !== remotePlugins.length - 1 && <ItemSeparator />}
                </Fragment>
              )
            })}
          </ItemGroup>
        </div>
      )}
    </div>
  )
}
