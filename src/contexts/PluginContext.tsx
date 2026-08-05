import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, apiRequest } from '@/api'
import { wrapPluginComponent } from '@/components/PluginErrorBoundary'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { navigateInApp } from '@/lib/routerRef'
import type { PluginLoadResult } from '@/plugins/DynamicPluginLoader'
import { pluginRegistry } from '@/plugins/PluginRegistry'
import { pluginUi } from '@/plugins/pluginUi'
import type {
  ChallengeFooterExtension,
  Plugin,
  PluginApiContext,
  PluginConfiguration,
  PluginNavigationItem,
  PluginPage,
  RouteParams,
  TaskActionExtension,
  TaskActionPanelExtension,
  TaskEditPolicy,
  TaskHistoryItemRenderer,
  TaskMapEditor,
  UserSettingsFieldExtension,
} from '@/types/Plugin'
import { useAuthContext } from './AuthContext'
import { useThemeContext } from './ThemeContext'

const resolvePluginUrl = (url: string): string => {
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`
  }
  return url
}

const getDeploymentPluginUrls = (): string[] => {
  const rawUrls = window.env.VITE_DEPLOYMENT_PLUGIN_URLS
  if (!rawUrls || typeof rawUrls !== 'string') {
    return []
  }

  return rawUrls
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
    .map(resolvePluginUrl)
}

const matchPath = (pattern: string, path: string): { matched: boolean; params: RouteParams } => {
  const normalizedPattern =
    pattern.endsWith('/') && pattern.length > 1 ? pattern.slice(0, -1) : pattern
  const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path

  if (!normalizedPattern.includes(':')) {
    return { matched: normalizedPattern === normalizedPath, params: {} }
  }

  const patternSegments = normalizedPattern.split('/').filter(Boolean)
  const pathSegments = normalizedPath.split('/').filter(Boolean)

  if (patternSegments.length !== pathSegments.length) {
    return { matched: false, params: {} }
  }

  const params: RouteParams = {}

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i]
    const pathSegment = pathSegments[i]

    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = pathSegment
    } else if (patternSegment !== pathSegment) {
      return { matched: false, params: {} }
    }
  }

  return { matched: true, params }
}

export interface PluginPageMatch {
  page: PluginPage
  params: RouteParams
}

interface PluginContextType {
  enabledPlugins: string[]
  togglePlugin: (pluginId: string, enabled: boolean) => void
  getAvailablePlugins: () => Plugin[]
  navigationItems: PluginNavigationItem[]
  getPluginPageByPath: (path: string) => PluginPageMatch | null
  taskMapEditors: TaskMapEditor[]
  taskActionExtensions: TaskActionExtension[]
  taskActionPanels: TaskActionPanelExtension[]
  taskEditPolicies: TaskEditPolicy[]
  challengeFooterExtensions: ChallengeFooterExtension[]
  taskHistoryItemRenderers: TaskHistoryItemRenderer[]
  userSettingsFields: UserSettingsFieldExtension[]
  isTaskEditableByPlugins: (task: unknown) => boolean
  isPluginEnabled: (pluginId: string) => boolean
  registerPluginFromUrl: (moduleUrl: string) => Promise<PluginLoadResult>
  removeRemotePlugin: (pluginId: string) => Promise<void>
  getRemotePluginUrls: () => Map<string, string>
  loading: boolean
  error: string | null
}

const PluginContext = createContext<PluginContextType | null>(null)

export const PluginProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthContext()
  const { t } = useIntl()

  const defaultPluginContext = useMemo<PluginContextType>(
    () => ({
      enabledPlugins: [],
      togglePlugin: () => {},
      getAvailablePlugins: () => [],
      navigationItems: [],
      getPluginPageByPath: () => null,
      taskMapEditors: [],
      taskActionExtensions: [],
      taskActionPanels: [],
      taskEditPolicies: [],
      challengeFooterExtensions: [],
      taskHistoryItemRenderers: [],
      userSettingsFields: [],
      isTaskEditableByPlugins: () => false,
      isPluginEnabled: () => false,
      registerPluginFromUrl: async () => ({
        success: false,
        error: t('plugins.errors.notAuthenticated', undefined, 'Not authenticated'),
      }),
      removeRemotePlugin: async () => {},
      getRemotePluginUrls: () => new Map(),
      loading: false,
      error: null,
    }),
    [t]
  )

  if (!user) {
    return <PluginContext.Provider value={defaultPluginContext}>{children}</PluginContext.Provider>
  }

  return <PluginProviderInner user={user}>{children}</PluginProviderInner>
}

const PluginProviderInner = ({
  children,
  user,
}: {
  children: React.ReactNode
  user: NonNullable<ReturnType<typeof useAuthContext>['user']>
}) => {
  const { theme } = useThemeContext()
  const { t } = useIntl()
  const [enabledPlugins, setEnabledPlugins] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [remotePluginUrls, setRemotePluginUrls] = useState<string[]>([])
  const [pluginPages, setPluginPages] = useState<PluginPage[]>([])
  const [contributionsKey, setContributionsKey] = useState('')
  const [navigationItems, setNavigationItems] = useState<PluginNavigationItem[]>([])
  const [taskMapEditors, setTaskMapEditors] = useState<TaskMapEditor[]>([])
  const [taskActionExtensions, setTaskActionExtensions] = useState<TaskActionExtension[]>([])
  const [taskActionPanels, setTaskActionPanels] = useState<TaskActionPanelExtension[]>([])
  const [taskEditPolicies, setTaskEditPolicies] = useState<TaskEditPolicy[]>([])
  const [challengeFooterExtensions, setChallengeFooterExtensions] = useState<
    ChallengeFooterExtension[]
  >([])
  const [taskHistoryItemRenderers, setTaskHistoryItemRenderers] = useState<
    TaskHistoryItemRenderer[]
  >([])
  const [userSettingsFields, setUserSettingsFields] = useState<UserSettingsFieldExtension[]>([])

  useEffect(() => {
    const getThemeTokens = (): Record<string, string> => ({})

    const apiContext: PluginApiContext = {
      theme: {
        isDarkMode: () => document.documentElement.classList.contains('dark'),
        getThemeTokens,
      },
      api: {
        task: {
          useTask: api.task.getTask,
          useStartTask: api.task.startTask,
          useTaskMarkers: api.task.getTaskMarkers,
        },
        challenge: {
          useChallenge: api.challenge.getChallenge,
          useChallengeTaskMarkers: api.challenge.getChallengeTaskMarkers,
        },
        user: {
          useCurrentUser: () => api.user.whoAmI(false),
        },
        project: {
          useProject: api.project.getProject,
        },
      },
      apiRequest,
      user: user
        ? {
            id: user.id,
            settings: (user.settings ?? undefined) as Record<string, unknown> | undefined,
          }
        : null,
      navigate: navigateInApp,
      ui: pluginUi,
    }

    pluginRegistry.setApiContext(apiContext)
    if (typeof window !== 'undefined') {
      ;(window as unknown as { __maproulettePluginApi?: PluginApiContext }).__maproulettePluginApi =
        apiContext
    }
  }, [theme, user])

  useEffect(() => {
    const loadPluginPreferences = async () => {
      try {
        setError(null)

        const storageKey = `plugin_preferences_${user.id}`
        const stored = localStorage.getItem(storageKey)
        const preferences = stored ? (JSON.parse(stored) as PluginConfiguration[]) : []
        const storedPreferenceByPluginId = new Map(
          preferences.map((config) => [config.pluginId, config])
        )

        const deploymentUrls = getDeploymentPluginUrls()
        const storedRemoteUrls = preferences
          .filter((config) => config.source === 'remote' && config.moduleUrl)
          .map((config) => config.moduleUrl as string)
        const urlsToLoad = Array.from(new Set([...deploymentUrls, ...storedRemoteUrls]))

        const remoteUrls: string[] = []
        const deploymentLoadedPluginIds: string[] = []

        for (const moduleUrl of urlsToLoad) {
          try {
            const result = await pluginRegistry.registerFromUrl(moduleUrl)
            if (result.success && result.plugin) {
              remoteUrls.push(moduleUrl)
              if (deploymentUrls.includes(moduleUrl)) {
                deploymentLoadedPluginIds.push(result.plugin.metadata.id)
              }
            } else {
              logger.error(`Failed to load remote plugin from ${moduleUrl}`, {
                error: result.error,
              })
              setError(
                t(
                  'plugins.errors.loadPluginFailed',
                  { error: String(result.error) },
                  'Failed to load plugin: {error}'
                )
              )
            }
          } catch (err) {
            logger.error(`Error loading remote plugin from ${moduleUrl}`, { error: err })
          }
        }

        setRemotePluginUrls(remoteUrls)

        const enabled = new Set(
          preferences.filter((config) => config.enabled).map((config) => config.pluginId)
        )

        for (const pluginId of deploymentLoadedPluginIds) {
          const storedPreference = storedPreferenceByPluginId.get(pluginId)
          if (storedPreference?.enabled === false) {
            continue
          }
          enabled.add(pluginId)
        }

        const enabledPluginIds = Array.from(enabled)
        for (const pluginId of enabledPluginIds) {
          await pluginRegistry.initialize(pluginId)
        }
        setEnabledPlugins(enabledPluginIds)
      } catch (error) {
        logger.error('Failed to load plugin preferences', { error })
        setError(
          t('plugins.errors.loadPreferencesFailed', undefined, 'Failed to load plugin preferences')
        )
      } finally {
        setLoading(false)
      }
    }

    loadPluginPreferences()
  }, [user, t])

  // All callbacks below are stored in the context value — stable references prevent
  // all context consumers from re-rendering on every provider render.
  const getAvailablePlugins = useCallback((): Plugin[] => {
    return pluginRegistry.getAll()
  }, [])

  const isPluginEnabled = useCallback(
    (pluginId: string): boolean => {
      return enabledPlugins.includes(pluginId)
    },
    [enabledPlugins]
  )

  const getRemotePluginUrls = useCallback((): Map<string, string> => {
    return pluginRegistry.getRemotePluginUrls()
  }, [])

  const getPluginPages = useCallback(async (): Promise<PluginPage[]> => {
    const pages: PluginPage[] = []
    for (const pluginId of enabledPlugins) {
      const plugin = pluginRegistry.get(pluginId)
      if (!plugin?.getPages) continue
      try {
        pages.push(...(await plugin.getPages()))
      } catch (error) {
        logger.error(`Failed to get pages from plugin ${pluginId}`, { error })
      }
    }
    return pages
  }, [enabledPlugins])

  const getNavigationItems = useCallback(async (): Promise<PluginNavigationItem[]> => {
    const items: PluginNavigationItem[] = []

    for (const pluginId of enabledPlugins) {
      const plugin = pluginRegistry.get(pluginId)
      if (plugin?.getNavigationItems) {
        try {
          const pluginItems = await plugin.getNavigationItems()
          items.push(...pluginItems)
        } catch (error) {
          logger.error(`Failed to get navigation items from plugin ${pluginId}`, { error })
        }
      }
    }

    items.sort((a, b) => {
      const orderA = a.order ?? 999
      const orderB = b.order ?? 999
      return orderA - orderB
    })

    return items
  }, [enabledPlugins])

  const getTaskMapEditors = useCallback(async (): Promise<TaskMapEditor[]> => {
    const editors: TaskMapEditor[] = []

    for (const pluginId of enabledPlugins) {
      const plugin = pluginRegistry.get(pluginId)
      if (plugin?.getTaskMapEditors) {
        try {
          const pluginEditors = await plugin.getTaskMapEditors()
          editors.push(...pluginEditors)
        } catch (error) {
          logger.error(`Failed to get task map editors from plugin ${pluginId}`, { error })
        }
      }
    }

    editors.sort((a, b) => {
      const orderA = a.order ?? 999
      const orderB = b.order ?? 999
      return orderA - orderB
    })

    return editors
  }, [enabledPlugins])

  const getTaskActionExtensions = useCallback(async (): Promise<TaskActionExtension[]> => {
    const extensions: TaskActionExtension[] = []

    for (const pluginId of enabledPlugins) {
      const plugin = pluginRegistry.get(pluginId)
      if (plugin?.getTaskActionExtensions) {
        try {
          const pluginExtensions = await plugin.getTaskActionExtensions()
          extensions.push(...pluginExtensions)
        } catch (error) {
          logger.error(`Failed to get task action extensions from plugin ${pluginId}`, { error })
        }
      }
    }

    extensions.sort((a, b) => {
      const orderA = a.order ?? 999
      const orderB = b.order ?? 999
      return orderA - orderB
    })

    return extensions
  }, [enabledPlugins])

  const getTaskActionPanels = useCallback(async (): Promise<TaskActionPanelExtension[]> => {
    const panels: TaskActionPanelExtension[] = []

    for (const pluginId of enabledPlugins) {
      const plugin = pluginRegistry.get(pluginId)
      if (plugin?.getTaskActionPanels) {
        try {
          const pluginPanels = await plugin.getTaskActionPanels()
          panels.push(...pluginPanels)
        } catch (error) {
          logger.error(`Failed to get task action panels from plugin ${pluginId}`, { error })
        }
      }
    }

    panels.sort((a, b) => {
      const orderA = a.order ?? 999
      const orderB = b.order ?? 999
      return orderA - orderB
    })

    return panels
  }, [enabledPlugins])

  const getTaskEditPolicies = useCallback(async (): Promise<TaskEditPolicy[]> => {
    const policies: TaskEditPolicy[] = []

    for (const pluginId of enabledPlugins) {
      const plugin = pluginRegistry.get(pluginId)
      if (plugin?.getTaskEditPolicies) {
        try {
          const pluginPolicies = await plugin.getTaskEditPolicies()
          policies.push(...pluginPolicies)
        } catch (error) {
          logger.error(`Failed to get task edit policies from plugin ${pluginId}`, { error })
        }
      }
    }

    policies.sort((a, b) => {
      const orderA = a.order ?? 999
      const orderB = b.order ?? 999
      return orderA - orderB
    })

    return policies
  }, [enabledPlugins])

  const getChallengeFooterExtensions = useCallback(async (): Promise<
    ChallengeFooterExtension[]
  > => {
    const extensions: ChallengeFooterExtension[] = []

    for (const pluginId of enabledPlugins) {
      const plugin = pluginRegistry.get(pluginId)
      if (plugin?.getChallengeFooterExtensions) {
        try {
          const pluginExtensions = await plugin.getChallengeFooterExtensions()
          extensions.push(...pluginExtensions)
        } catch (error) {
          logger.error(`Failed to get challenge footer extensions from plugin ${pluginId}`, {
            error,
          })
        }
      }
    }

    extensions.sort((a, b) => {
      const orderA = a.order ?? 999
      const orderB = b.order ?? 999
      return orderA - orderB
    })

    return extensions
  }, [enabledPlugins])

  const getTaskHistoryItemRenderers = useCallback(async (): Promise<TaskHistoryItemRenderer[]> => {
    const renderers: TaskHistoryItemRenderer[] = []

    for (const pluginId of enabledPlugins) {
      const plugin = pluginRegistry.get(pluginId)
      if (plugin?.getTaskHistoryItemRenderers) {
        try {
          const pluginRenderers = await plugin.getTaskHistoryItemRenderers()
          renderers.push(...pluginRenderers)
        } catch (error) {
          logger.error(`Failed to get task history item renderers from plugin ${pluginId}`, {
            error,
          })
        }
      }
    }

    renderers.sort((a, b) => {
      const orderA = a.order ?? 999
      const orderB = b.order ?? 999
      return orderA - orderB
    })

    return renderers
  }, [enabledPlugins])

  const getUserSettingsFields = useCallback(async (): Promise<UserSettingsFieldExtension[]> => {
    const fields: UserSettingsFieldExtension[] = []

    for (const pluginId of enabledPlugins) {
      const plugin = pluginRegistry.get(pluginId)
      if (plugin?.getUserSettingsFields) {
        try {
          const pluginFields = await plugin.getUserSettingsFields()
          fields.push(...pluginFields)
        } catch (error) {
          logger.error(`Failed to get user settings fields from plugin ${pluginId}`, { error })
        }
      }
    }

    fields.sort((a, b) => {
      const orderA = a.order ?? 999
      const orderB = b.order ?? 999
      return orderA - orderB
    })

    return fields
  }, [enabledPlugins])

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      getPluginPages(),
      getNavigationItems(),
      getTaskMapEditors(),
      getTaskActionExtensions(),
      getTaskActionPanels(),
      getTaskEditPolicies(),
      getChallengeFooterExtensions(),
      getTaskHistoryItemRenderers(),
      getUserSettingsFields(),
    ]).then(
      ([
        pages,
        navigation,
        editors,
        actions,
        panels,
        editPolicies,
        footers,
        historyRenderers,
        settingsFields,
      ]) => {
        if (cancelled) return
        setPluginPages(
          pages.map((page) => ({
            ...page,
            component: wrapPluginComponent(page.component, {
              contributionId: page.id,
              source: 'page',
              compact: false,
            }),
          }))
        )
        setNavigationItems(navigation)
        setTaskMapEditors(
          editors.map((editor) => ({
            ...editor,
            component: wrapPluginComponent(editor.component, {
              contributionId: editor.id,
              source: 'map-editor',
            }),
          }))
        )
        setTaskActionExtensions(
          actions.map((extension) => ({
            ...extension,
            component: extension.component
              ? wrapPluginComponent(extension.component, {
                  contributionId: extension.id,
                  source: 'task-action',
                })
              : undefined,
          }))
        )
        setTaskActionPanels(
          panels.map((panel) => ({
            ...panel,
            component: wrapPluginComponent(panel.component, {
              contributionId: panel.id,
              source: 'panel',
            }),
          }))
        )
        setTaskEditPolicies(editPolicies)
        setChallengeFooterExtensions(
          footers.map((footer) => ({
            ...footer,
            component: wrapPluginComponent(footer.component, {
              contributionId: footer.id,
              source: 'challenge-footer',
            }),
          }))
        )
        setTaskHistoryItemRenderers(
          historyRenderers.map((renderer) => ({
            ...renderer,
            component: wrapPluginComponent(renderer.component, {
              contributionId: renderer.id,
              source: 'history',
            }),
          }))
        )
        setUserSettingsFields(
          settingsFields.map((field) => ({
            ...field,
            component: wrapPluginComponent(field.component, {
              contributionId: field.id,
              source: 'settings-field',
            }),
          }))
        )
        setContributionsKey(enabledPlugins.join(','))
      }
    )
    return () => {
      cancelled = true
    }
  }, [
    getPluginPages,
    getNavigationItems,
    getTaskMapEditors,
    getTaskActionExtensions,
    getTaskActionPanels,
    getTaskEditPolicies,
    getChallengeFooterExtensions,
    getTaskHistoryItemRenderers,
    getUserSettingsFields,
    enabledPlugins,
  ])

  const getPluginPageByPath = useCallback(
    (path: string): PluginPageMatch | null => {
      for (const page of pluginPages) {
        const matchResult = matchPath(page.path, path)
        if (matchResult.matched) return { page, params: matchResult.params }
      }
      return null
    },
    [pluginPages]
  )

  const togglePlugin = useCallback(
    async (pluginId: string, enabled: boolean) => {
      try {
        const newEnabledPlugins = enabled
          ? [...enabledPlugins, pluginId]
          : enabledPlugins.filter((id) => id !== pluginId)

        if (enabled) {
          await pluginRegistry.initialize(pluginId)
        } else {
          await pluginRegistry.cleanup(pluginId)
        }
        setEnabledPlugins(newEnabledPlugins)

        const storageKey = `plugin_preferences_${user.id}`
        const allPlugins = pluginRegistry.getAllMetadata()
        const preferences: PluginConfiguration[] = allPlugins.map((metadata) => ({
          pluginId: metadata.id,
          enabled: newEnabledPlugins.includes(metadata.id),
        }))

        localStorage.setItem(storageKey, JSON.stringify(preferences))
      } catch (error) {
        logger.error('Failed to toggle plugin', { error })
      }
    },
    [enabledPlugins, user.id]
  )

  const registerPluginFromUrl = useCallback(
    async (moduleUrl: string): Promise<PluginLoadResult> => {
      try {
        setError(null)
        const result = await pluginRegistry.registerFromUrl(moduleUrl)

        if (result.success && result.plugin) {
          const newUrls = [...remotePluginUrls, moduleUrl]
          setRemotePluginUrls(newUrls)

          const storageKey = `plugin_preferences_${user.id}`
          const stored = localStorage.getItem(storageKey)
          const preferences: PluginConfiguration[] = stored ? JSON.parse(stored) : []

          preferences.push({
            pluginId: result.plugin.metadata.id,
            enabled: false,
            moduleUrl,
            source: 'remote',
          })

          localStorage.setItem(storageKey, JSON.stringify(preferences))

          return result
        }

        setError(
          result.error || t('plugins.errors.registerFailed', undefined, 'Failed to register plugin')
        )
        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t('plugins.errors.registerFailed', undefined, 'Failed to register plugin')
        setError(errorMessage)
        return {
          success: false,
          error: errorMessage,
        }
      }
    },
    [remotePluginUrls, user.id, t]
  )

  const removeRemotePlugin = useCallback(
    async (pluginId: string): Promise<void> => {
      try {
        setError(null)

        if (enabledPlugins.includes(pluginId)) {
          await togglePlugin(pluginId, false)
        }

        const moduleUrl = pluginRegistry.getModuleUrl(pluginId)
        pluginRegistry.unregister(pluginId)

        if (moduleUrl) {
          setRemotePluginUrls(remotePluginUrls.filter((url) => url !== moduleUrl))
        }

        const storageKey = `plugin_preferences_${user.id}`
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const preferences: PluginConfiguration[] = JSON.parse(stored)
          const filtered = preferences.filter((p) => p.pluginId !== pluginId)
          localStorage.setItem(storageKey, JSON.stringify(filtered))
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t('plugins.errors.removeFailed', undefined, 'Failed to remove plugin')
        setError(errorMessage)
        logger.error('Failed to remove remote plugin', { error: err })
      }
    },
    [enabledPlugins, togglePlugin, remotePluginUrls, user.id, t]
  )

  const isTaskEditableByPlugins = useCallback(
    (task: unknown) => {
      const userId = user.id ?? null
      return taskEditPolicies.some((policy) => policy.isEditable(task, { userId }))
    },
    [taskEditPolicies, user.id]
  )

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value: PluginContextType = useMemo(
    () => ({
      enabledPlugins,
      togglePlugin,
      getAvailablePlugins,
      navigationItems,
      getPluginPageByPath,
      taskMapEditors,
      taskActionExtensions,
      taskActionPanels,
      taskEditPolicies,
      challengeFooterExtensions,
      taskHistoryItemRenderers,
      userSettingsFields,
      isTaskEditableByPlugins,
      isPluginEnabled,
      registerPluginFromUrl,
      removeRemotePlugin,
      getRemotePluginUrls,
      loading: loading || contributionsKey !== enabledPlugins.join(','),
      error,
    }),
    [
      enabledPlugins,
      togglePlugin,
      getAvailablePlugins,
      navigationItems,
      getPluginPageByPath,
      taskMapEditors,
      taskActionExtensions,
      taskActionPanels,
      taskEditPolicies,
      challengeFooterExtensions,
      taskHistoryItemRenderers,
      userSettingsFields,
      isTaskEditableByPlugins,
      isPluginEnabled,
      registerPluginFromUrl,
      removeRemotePlugin,
      getRemotePluginUrls,
      loading,
      contributionsKey,
      error,
    ]
  )

  return <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
}

export const usePluginContext = () => {
  const context = useContext(PluginContext)
  if (!context) {
    throw new Error('usePluginContext must be used within a PluginProvider')
  }
  return context
}
