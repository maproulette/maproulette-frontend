import { Plus, Puzzle, Trash2 } from 'lucide-react'
import { Fragment } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/Field'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/Item'
import { Separator } from '@/components/ui/Separator'
import { Switch } from '@/components/ui/Switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { usePluginContext } from '@/contexts/PluginContext'
import { logger } from '@/lib/logger'
import { RemotePluginManager } from './RemotePluginManager'

// Workshop plugins - these are available for users to discover and add
const WORKSHOP_PLUGINS = [
  {
    id: 'analytics-plugin',
    name: 'Analytics Dashboard',
    description: 'Track your mapping statistics and view detailed analytics of your contributions',
    author: 'MapRoulette Team',
    version: '1.0.0',
    url: 'http://localhost:3002/AnalyticsPlugin.js',
  },
]

export const PluginSettings = () => {
  const {
    getAvailablePlugins,
    isPluginEnabled,
    togglePlugin,
    loading,
    registerPluginFromUrl,
    removeRemotePlugin,
    getRemotePluginUrls,
  } = usePluginContext()
  const availablePlugins = getAvailablePlugins()
  const remotePluginUrls = getRemotePluginUrls()

  // User's plugins are those that have been registered (either built-in or added from remote/workshop)
  const myPlugins = availablePlugins

  // Workshop plugins that haven't been added yet
  const workshopPlugins = WORKSHOP_PLUGINS.filter(
    (workshopPlugin) => !myPlugins.some((plugin) => plugin.metadata.id === workshopPlugin.id)
  )

  const handleAddFromWorkshop = async (workshopPlugin: (typeof WORKSHOP_PLUGINS)[0]) => {
    try {
      const result = await registerPluginFromUrl(workshopPlugin.url)
      if (result.success && result.plugin) {
        toast.success(`"${workshopPlugin.name}" added to your plugins!`)
      } else {
        toast.error(`Failed to add plugin: ${result.error}`)
      }
    } catch (error) {
      toast.error('Failed to add plugin')
      logger.error('Failed to add plugin', { error: String(error) })
    }
  }

  const handleRemovePlugin = async (pluginId: string, pluginName: string) => {
    if (!confirm(`Are you sure you want to remove "${pluginName}" from your plugins?`)) {
      return
    }

    try {
      await removeRemotePlugin(pluginId)
      toast.success(`"${pluginName}" removed from your plugins`)
    } catch (error) {
      toast.error('Failed to remove plugin')
      logger.error('Failed to remove plugin', { error: String(error) })
    }
  }

  if (loading) {
    return (
      <FieldSet>
        <FieldLegend>Plugins</FieldLegend>
        <FieldDescription>Loading plugins...</FieldDescription>
      </FieldSet>
    )
  }

  return (
    <FieldSet>
      <FieldLegend>Plugins</FieldLegend>
      <FieldDescription>
        Enable or disable plugins to customize your MapRoulette experience. Plugin navigation items
        will appear in the main navigation menu.
      </FieldDescription>

      <Tabs defaultValue="my-plugins" className="mt-6">
        <TabsList>
          <TabsTrigger value="my-plugins">My Plugins</TabsTrigger>
          <TabsTrigger value="workshop">Plugins Workshop</TabsTrigger>
        </TabsList>

        {/* My Plugins Tab */}
        <TabsContent value="my-plugins" className="space-y-4">
          {myPlugins.length === 0 ? (
            <div className="rounded-lg border border-zinc-300 border-dashed p-6 text-center dark:border-slate-700">
              <Puzzle className="mx-auto mb-3 size-12 text-zinc-400" />
              <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
                No plugins yet
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Visit the Plugins Workshop to discover and add plugins
              </p>
            </div>
          ) : (
            <ItemGroup>
              {myPlugins.map((plugin, index) => {
                const enabled = isPluginEnabled(plugin.metadata.id)
                const isRemote = remotePluginUrls.has(plugin.metadata.id)

                return (
                  <Fragment key={plugin.metadata.id}>
                    <Item variant="outline">
                      <ItemMedia
                        variant="icon"
                        className="bg-lime-100 text-lime-600 dark:bg-lime-900/20"
                      >
                        <Puzzle />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          {plugin.metadata.name}
                          <Badge variant={enabled ? 'default' : 'outline'} className="text-xs">
                            {enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <span className="text-xs text-zinc-500">v{plugin.metadata.version}</span>
                        </ItemTitle>
                        <ItemDescription>
                          {plugin.metadata.description}
                          {plugin.metadata.author && (
                            <span className="text-xs"> • by {plugin.metadata.author}</span>
                          )}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Switch
                          id={`plugin-${plugin.metadata.id}`}
                          checked={enabled}
                          onCheckedChange={(checked) => togglePlugin(plugin.metadata.id, checked)}
                          aria-label={`Toggle ${plugin.metadata.name}`}
                        />
                        {isRemote && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemovePlugin(plugin.metadata.id, plugin.metadata.name)
                            }
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </ItemActions>
                    </Item>
                    {index !== myPlugins.length - 1 && <ItemSeparator />}
                  </Fragment>
                )
              })}
            </ItemGroup>
          )}
        </TabsContent>

        {/* Plugins Workshop Tab */}
        <TabsContent value="workshop" className="space-y-6">
          {/* Remote Plugin Manager */}
          <RemotePluginManager />

          <Separator />

          {/* Workshop Plugins List */}
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold text-base">Discover Plugins</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Browse and add curated plugins from the community
              </p>
            </div>

            {workshopPlugins.length === 0 ? (
              <div className="rounded-lg border border-zinc-300 border-dashed p-6 text-center dark:border-slate-700">
                <Puzzle className="mx-auto mb-3 size-12 text-zinc-400" />
                <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
                  All plugins added
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  You've added all available workshop plugins!
                </p>
              </div>
            ) : (
              <ItemGroup>
                {workshopPlugins.map((plugin, index) => (
                  <Fragment key={plugin.id}>
                    <Item variant="outline">
                      <ItemMedia
                        variant="icon"
                        className="bg-lime-100 text-lime-600 dark:bg-lime-900/20"
                      >
                        <Puzzle />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          {plugin.name}
                          <span className="text-xs text-zinc-500">v{plugin.version}</span>
                        </ItemTitle>
                        <ItemDescription>
                          {plugin.description}
                          {plugin.author && <span className="text-xs"> • by {plugin.author}</span>}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddFromWorkshop(plugin)}
                        >
                          <Plus className="mr-1 size-4" />
                          Add
                        </Button>
                      </ItemActions>
                    </Item>
                    {index !== workshopPlugins.length - 1 && <ItemSeparator />}
                  </Fragment>
                ))}
              </ItemGroup>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </FieldSet>
  )
}
