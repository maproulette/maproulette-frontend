import type { ComponentType, ReactNode } from 'react'

/**
 * Route parameters extracted from dynamic paths
 */
export interface RouteParams {
  [key: string]: string
}

export interface PluginTaskMapItem {
  id: number
  parent: number
  bundleId?: number | null
  location: {
    coordinates: [number, number]
  }
}

/**
 * API context provided to plugins from MapRoulette
 * All API methods are React hooks that return { data, isLoading, error }
 */
export interface PluginApiContext {
  /** Theme context from the host app */
  theme: {
    isDarkMode: () => boolean
    getThemeTokens: () => Record<string, string>
  }
  /** API hooks for making requests */
  api: {
    /** Task API hooks */
    task: {
      /** Hook to get a task by ID */
      useTask: (taskId: number) => { data: unknown; isLoading: boolean; error: unknown }
      /** Hook to start a task */
      useStartTask: (taskId: number) => { data: unknown; isLoading: boolean; error: unknown }
      /** Hook to get task markers */
      useTaskMarkers: (params: {
        statuses: string
        global?: boolean
        cluster?: boolean
        bounds?: string | null
      }) => { data: unknown; isLoading: boolean; error: unknown }
    }
    /** Challenge API hooks */
    challenge: {
      /** Hook to get a challenge by ID */
      useChallenge: (challengeId: number) => { data: unknown; isLoading: boolean; error: unknown }
      /** Hook to get challenge task markers */
      useChallengeTaskMarkers: (challengeId: number) => {
        data: unknown
        isLoading: boolean
        error: unknown
      }
    }
    /** User API hooks */
    user: {
      /** Hook to get current user */
      useCurrentUser: () => { data: unknown; isLoading: boolean; error: unknown }
    }
    /** Project API hooks */
    project: {
      /** Hook to get a project by ID */
      useProject: (projectId: number) => { data: unknown; isLoading: boolean; error: unknown }
    }
  }
  /** Base API request function (ky instance) for custom requests */
  apiRequest: unknown
  /** Current authenticated user, when available */
  user?: {
    id: number
    /** Opaque user settings from the API — plugins interpret domain-specific keys. */
    settings?: Record<string, unknown>
  } | null
  /** Navigate within the host SPA (path may include search params) */
  navigate?: (path: string) => void
  /** Host UI components so plugins match native styling without bundling their own */
  ui: {
    Button: ComponentType<Record<string, unknown>>
    Badge: ComponentType<Record<string, unknown>>
    Alert: ComponentType<Record<string, unknown>>
    AlertTitle: ComponentType<Record<string, unknown>>
    AlertDescription: ComponentType<Record<string, unknown>>
    Separator: ComponentType<Record<string, unknown>>
    StatCard: ComponentType<{
      className?: string
      tone?: 'neutral' | 'muted' | 'info' | 'success' | 'warning' | 'danger'
      size?: 'sm' | 'md' | 'lg'
      label: ReactNode
      value: ReactNode
      icon?: ReactNode
      description?: ReactNode
    }>
    StatCardGrid: ComponentType<{ children?: ReactNode; className?: string }>
    ProgressBar: ComponentType<{
      percentage?: number
      segments?: Array<{
        key: string
        percentage: number
        color: string
        title?: string
        opacity?: number
      }>
      className?: string
    }>
    Label: ComponentType<Record<string, unknown>>
    Textarea: ComponentType<Record<string, unknown>>
    Tabs: ComponentType<{
      children?: ReactNode
      className?: string
      defaultValue?: string
      value?: string
      onValueChange?: (value: string) => void
    }>
    TabsList: ComponentType<{ children?: ReactNode; className?: string }>
    TabsTrigger: ComponentType<{ children?: ReactNode; className?: string; value: string }>
    TabsContent: ComponentType<{ children?: ReactNode; className?: string; value: string }>
    Dialog: ComponentType<{
      children?: ReactNode
      open?: boolean
      onOpenChange?: (open: boolean) => void
    }>
    DialogContent: ComponentType<{
      children?: ReactNode
      className?: string
      size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    }>
    DialogHeader: ComponentType<{ children?: ReactNode; className?: string }>
    DialogFooter: ComponentType<{ children?: ReactNode; className?: string }>
    DialogTitle: ComponentType<{ children?: ReactNode; className?: string }>
    DialogDescription: ComponentType<{ children?: ReactNode; className?: string }>
    RadioGroup: ComponentType<{
      children?: ReactNode
      value?: string
      onValueChange?: (value: string) => void
    }>
    RadioGroupItem: ComponentType<{ className?: string; id?: string; value: string }>
    Select: ComponentType<{
      children?: ReactNode
      value?: string
      defaultValue?: string
      onValueChange?: (value: string) => void
      disabled?: boolean
    }>
    SelectValue: ComponentType<{ placeholder?: string; className?: string }>
    SelectTrigger: ComponentType<{
      children?: ReactNode
      className?: string
      size?: 'sm' | 'default'
      'aria-label'?: string
      onClick?: (event: { stopPropagation: () => void }) => void
    }>
    SelectContent: ComponentType<{ children?: ReactNode; className?: string }>
    SelectItem: ComponentType<{
      children?: ReactNode
      className?: string
      value: string
      disabled?: boolean
    }>
    TaskSelectionMap: ComponentType<{
      currentTask: PluginTaskMapItem
      tasks: PluginTaskMapItem[]
      selectedTaskId: number | null
      onTaskSelect: (taskId: number | null) => void
      showSelectedBadge?: boolean
    }>
    CommentsHistoryTab: ComponentType<{ taskId?: number }>
    Table: ComponentType<Record<string, unknown>>
    TableHeader: ComponentType<Record<string, unknown>>
    TableBody: ComponentType<Record<string, unknown>>
    TableRow: ComponentType<Record<string, unknown>>
    TableHead: ComponentType<Record<string, unknown>>
    TableCell: ComponentType<Record<string, unknown>>
    Card: ComponentType<Record<string, unknown>>
    CardHeader: ComponentType<Record<string, unknown>>
    CardTitle: ComponentType<Record<string, unknown>>
    CardDescription: ComponentType<Record<string, unknown>>
    CardContent: ComponentType<Record<string, unknown>>
    CardFooter: ComponentType<Record<string, unknown>>
    Empty: ComponentType<Record<string, unknown>>
    EmptyHeader: ComponentType<Record<string, unknown>>
    EmptyTitle: ComponentType<Record<string, unknown>>
    EmptyDescription: ComponentType<Record<string, unknown>>
    EmptyContent: ComponentType<Record<string, unknown>>
    Skeleton: ComponentType<Record<string, unknown>>
    Collapsible: ComponentType<{
      children?: ReactNode
      className?: string
      open?: boolean
      defaultOpen?: boolean
      onOpenChange?: (open: boolean) => void
    }>
    CollapsibleTrigger: ComponentType<Record<string, unknown>>
    CollapsibleContent: ComponentType<Record<string, unknown>>
    SidePanel: ComponentType<{
      open: boolean
      onClose: () => void
      children?: ReactNode
      className?: string
      widthClassName?: string
      'aria-label'?: string
    }>
    SidePanelHeader: ComponentType<Record<string, unknown>>
    SidePanelTitle: ComponentType<Record<string, unknown>>
    SidePanelBody: ComponentType<Record<string, unknown>>
    SidePanelFooter: ComponentType<Record<string, unknown>>
  }
}

/**
 * Navigation item that can be provided by a plugin
 */
export interface PluginNavigationItem {
  /** Unique identifier for the navigation item */
  id: string
  /** Display label for the navigation item */
  label: string
  /** Route path or URL (e.g., '/example', 'https://external.com') */
  to: string
  /** Icon component (optional) */
  icon?: ReactNode
  /** Whether to open in a new tab */
  openInNewTab?: boolean
  /** Order/priority for display (lower numbers appear first) */
  order?: number
}

/**
 * Plugin page definition
 */
export interface PluginPage {
  /** Unique identifier for the page */
  id: string
  /** Display title */
  title: string
  /** Component to render - receives route params as props */
  component: ComponentType<{ params?: RouteParams }>
  /**
   * Custom route path with optional parameters
   * Examples: '/example', '/tasks/:id', '/challenge/:challengeId/tasks/:taskId'
   */
  path: string
  /** Optional description */
  description?: string
}

/**
 * Task map editor definition
 * Allows plugins to provide editor overlays for the task map
 */
export interface TaskMapEditor {
  /** Unique identifier for the editor */
  id: string
  /** Display label for the button */
  label: string
  /** Icon component for the button */
  icon: ReactNode
  /** Editor component to render - receives onClose callback */
  component: ComponentType<{ onClose: () => void }>
  /** Optional order/priority for button display (lower numbers appear first) */
  order?: number
}

/**
 * Task action extension definition
 * Allows plugins to inject custom controls into the task action modal
 */
export interface TaskActionExtension {
  /** Unique identifier for the extension */
  id: string
  /** Optional display label */
  label?: string
  /** Extension component rendered inside task action modal (omit for params-only extensions) */
  component?: ComponentType<{
    task: unknown
    newStatus: number
    setNewStatus: (status: number) => void
    formState: Record<string, unknown>
    setFormState: (patch: Record<string, unknown>) => void
  }>
  /**
   * Optional query params to attach to the task/bundle status PUT.
   * Host forwards these without interpreting keys.
   */
  getStatusQueryParams?: (
    formState: Record<string, unknown>,
    context: { newStatus: number; task: unknown }
  ) => Record<string, string | boolean | number | undefined | null>
  /** Optional order/priority for display (lower numbers appear first) */
  order?: number
}

/**
 * Task action panel extension definition
 * Allows plugins to replace or append content in the task footer panel.
 */
export interface TaskActionPanelExtension {
  /** Unique identifier for the extension */
  id: string
  /** Optional display label */
  label?: string
  /**
   * Where to render the panel:
   * - replace: replaces the default task actions if active
   * - append: renders alongside default task actions
   */
  slot?: 'replace' | 'append'
  /** Optional order/priority for display (lower numbers appear first) */
  order?: number
  /**
   * Optional activation check for current task/page context.
   * If omitted, the panel is considered active.
   */
  isActive?: (context: {
    pathname: string
    search: Record<string, unknown>
    task: unknown
  }) => boolean
  /** Panel component rendered in the task footer */
  component: ComponentType<{
    task: unknown
    search: Record<string, unknown>
    pathname: string
  }>
}

/**
 * Lets plugins unlock lock/completion for tasks whose status is otherwise final
 * (e.g. rejected tasks that mappers must revise).
 */
export interface TaskEditPolicy {
  id: string
  order?: number
  isEditable: (task: unknown, context: { userId: number | null }) => boolean
}

/**
 * Challenge action tab contributed by a plugin.
 * The host renders the shared challenge progress widget and action button.
 */
export interface ChallengeActionContext {
  challenge: unknown
  user?: {
    id: number
    settings?: Record<string, unknown>
  } | null
}

export interface ChallengeFooterExtension {
  /** Unique identifier for the extension */
  id: string
  /** Optional order/priority (lower numbers appear first) */
  order?: number
  /** Footer content rendered with the native map content */
  component: ComponentType<ChallengeActionContext & { mapContent: ReactNode }>
}

/**
 * History item passed to plugin renderers.
 * Core only guarantees shared fields; plugins narrow domain-specific extras.
 */
export type PluginTaskHistoryItem = {
  taskId: number
  timestamp: string
  actionType: number
  user?: { id: number; username: string } | null
  oldStatus?: number
  status?: number
  startedAt?: string
  comment?: unknown
  [key: string]: unknown
}

export interface TaskHistoryItemRenderer {
  /** Unique identifier for the renderer */
  id: string
  /** Optional order/priority (lower numbers tried first) */
  order?: number
  /** Whether this renderer handles the given history item */
  canRender: (item: PluginTaskHistoryItem) => boolean
  /** Component that renders the history row */
  component: ComponentType<{ item: PluginTaskHistoryItem; index: number }>
}

/**
 * User settings field extension
 * Plugin owns the input UI; host binds it into the shared Account form by `name`.
 */
export interface UserSettingsFieldExtension {
  /** Unique identifier for the field extension */
  id: string
  /** Form field name (must exist on the host settings schema) */
  name: string
  /** Optional order/priority for display (lower numbers appear first) */
  order?: number
  /** Field UI — receives the bound value from the host form */
  component: ComponentType<{
    value: unknown
    onChange: (value: unknown) => void
    disabled?: boolean
  }>
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Unique identifier for the plugin */
  id: string
  /** Display name of the plugin */
  name: string
  /** Plugin description */
  description: string
  /** Plugin version */
  version: string
  /** Plugin author */
  author?: string
  /** Optional icon URL */
  icon?: string
  /** Optional homepage URL */
  homepage?: string
}

/**
 * Main plugin interface that all plugins must implement
 */
export interface Plugin {
  /** Plugin metadata */
  metadata: PluginMetadata

  /**
   * Initialize the plugin
   * Called when the plugin is first loaded
   * @param context - API context providing access to MapRoulette APIs
   */
  initialize?: (context?: PluginApiContext) => void | Promise<void>

  /**
   * Cleanup the plugin
   * Called when the plugin is disabled or unloaded
   */
  cleanup?: () => void | Promise<void>

  /**
   * Get navigation items to display in the header
   * This is called during render time for each enabled plugin
   */
  getNavigationItems?: () => PluginNavigationItem[] | Promise<PluginNavigationItem[]>

  /**
   * Get pages provided by this plugin
   * Each page defines its own custom route path (e.g., '/example')
   */
  getPages?: () => PluginPage[] | Promise<PluginPage[]>

  /**
   * Get task map editors provided by this plugin
   * These editors appear as overlay buttons on the task map
   */
  getTaskMapEditors?: () => TaskMapEditor[] | Promise<TaskMapEditor[]>

  /**
   * Get task action extensions provided by this plugin
   * These extensions appear inside the task action modal.
   */
  getTaskActionExtensions?: () => TaskActionExtension[] | Promise<TaskActionExtension[]>

  /**
   * Get task footer panel extensions provided by this plugin
   * These extensions can replace or append task footer UI.
   */
  getTaskActionPanels?: () => TaskActionPanelExtension[] | Promise<TaskActionPanelExtension[]>

  /**
   * Policies that unlock editing/completion for otherwise final task statuses.
   * Evaluated by the host without interpreting domain-specific review fields.
   */
  getTaskEditPolicies?: () => TaskEditPolicy[] | Promise<TaskEditPolicy[]>

  /**
   * Get challenge action tabs rendered alongside the native Map action.
   */
  getChallengeFooterExtensions?: () =>
    | ChallengeFooterExtension[]
    | Promise<ChallengeFooterExtension[]>

  /**
   * Get task history item renderers for the comments/history tab.
   * Used for domain-specific action types (e.g. review) without baking
   * that domain into core.
   */
  getTaskHistoryItemRenderers?: () => TaskHistoryItemRenderer[] | Promise<TaskHistoryItemRenderer[]>

  /**
   * Get user settings fields provided by this plugin.
   * Host binds each field into the shared Account form by `name`.
   */
  getUserSettingsFields?: () => UserSettingsFieldExtension[] | Promise<UserSettingsFieldExtension[]>

  /**
   * Optional hook to extend the plugin with custom functionality
   */
  onUserSettingsChange?: (settings: Record<string, unknown>) => void

  /**
   * React to app events
   */
  onEvent?: (event: string, data?: unknown) => void
}

/**
 * Plugin configuration stored per user
 */
export interface PluginConfiguration {
  /** Plugin ID */
  pluginId: string
  /** Whether the plugin is enabled */
  enabled: boolean
  /** Custom settings for the plugin */
  settings?: Record<string, unknown>
  /** Optional module URL for dynamically loaded plugins */
  moduleUrl?: string
  /** Whether this is a built-in or remote plugin */
  source?: 'builtin' | 'remote'
}
