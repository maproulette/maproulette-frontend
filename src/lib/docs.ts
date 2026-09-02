// Links from the app into the MapRoulette documentation site
// (https://github.com/maproulette/docs). The site is deployed separately, so
// its host is runtime-configurable via VITE_DOCS_BASE_URL — deployments that
// run their own copy of the docs can point the whole app at it without a
// rebuild.

const DEFAULT_DOCS_BASE_URL = 'https://learn.maproulette.org'

/**
 * Documentation pages linked from the app, keyed by a stable name so call
 * sites don't repeat slugs. Values are paths on the docs site, which serves
 * every page of the `documentation` collection at /documentation/<slug>/.
 */
export const DOCS_PAGES = {
  // Getting started
  yourDashboard: 'documentation/your-dashboard',
  discoveringChallenges: 'documentation/discovering-challenges',
  searchboxShortCommands: 'documentation/searchbox-short-commands',
  pointScoring: 'documentation/point-scoring',
  // Mapping
  usingLayouts: 'documentation/using-layouts',
  rapidEditor: 'documentation/rapid-editor',
  solvingMultipleTasksTogether: 'documentation/solving-multiple-tasks-together',
  // User settings
  defaultOsmEditor: 'documentation/setting-your-default-osm-editor',
  mapBaseLayer: 'documentation/setting-your-map-base-layer',
  settingBasemapForChallenge: 'documentation/setting-basemap-for-challenge',
  notificationsAndEmail: 'documentation/notifications-and-email',
  // Projects
  projectsAndProjectManagers: 'documentation/projects-and-project-managers',
  // Challenges
  creatingAChallenge: 'documentation/creating-a-challenge',
  overpassChallenges: 'documentation/using-overpass-to-create-challenges',
  gistsForRemoteGeoJSON: 'documentation/gists-for-remote-geojson',
  lineByLineGeoJSON: 'documentation/line-by-line-geojson',
  challengeVisibility: 'documentation/challenge-visibility-and-discovery',
  rebuildingChallengeTasks: 'documentation/rebuilding-challenge-tasks',
  challengeComments: 'documentation/challenge-comments',
  reportingAChallenge: 'documentation/reporting-a-challenge',
  challengeFlagging: 'documentation/challenge-flagging',
  exportingChallengeData: 'documentation/exporting-challenge-data',
  filteringTasksByProperties: 'documentation/filtering-the-task-list-by-properties',
  challengeInstructionsTemplating: 'documentation/challenge-instructions-templating',
  // Tasks
  taskPriorityRules: 'documentation/task-priority-rules',
  maprouletteTags: 'documentation/using-maproulette-tags',
  externalTaskIdentifiers: 'documentation/setting-external-task-identifiers',
  taskSourcedDate: 'documentation/defining-task-sourced-date',
  mustacheTagReplacement: 'documentation/mustache-tag-replacement',
  taskAttachments: 'documentation/task-attachments',
  bulkEditingChallenges: 'documentation/bulk-editing-challenges',
  // Teams
  teams: 'documentation/teams',
  following: 'documentation/following',
  // Advanced
  keyboardShortcuts: 'documentation/using-keyboard-shortcuts',
  markdown: 'documentation/markdown',
  commentShortCodes: 'documentation/comment-short-codes',
  // Server administration
  runtimeConfiguration: 'documentation/runtime-configuration',
  mapLayerManagement: 'documentation/map-layer-management',
  systemNoticeManagement: 'documentation/system-notice-management',
} as const

export type DocsPage = keyof typeof DOCS_PAGES

/** Docs site root, without a trailing slash. */
export const docsBaseUrl = (): string =>
  (window.env?.VITE_DOCS_BASE_URL || DEFAULT_DOCS_BASE_URL).replace(/\/+$/, '')

/**
 * URL of a documentation page, or of the docs home page when no page is given.
 * Paths keep their trailing slash: the docs site's canonical URLs end in one.
 */
export const docsUrl = (page?: DocsPage): string =>
  page ? `${docsBaseUrl()}/${DOCS_PAGES[page]}/` : `${docsBaseUrl()}/`
