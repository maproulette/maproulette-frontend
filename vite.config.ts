import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import svgr from 'vite-plugin-svgr'
import { defineConfig } from 'vitest/config'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  version: string
}

// Pure utility modules under src/components (paths relative to src/components/)
// that have unit tests and should count toward coverage. Everything else under
// src/components is untested UI/hooks and is carved out below. Add a file's
// relative path here once it has real test coverage.
const TESTED_COMPONENT_UTILS = [
  'Map/TaskMarkers/utils.ts',
  'Map/TaskMarkers/spiderUtils.ts',
  'Map/mapUtils.ts',
  'Map/FeatureStyleLegend/styleRuleToText.ts',
  'ui/columnResizeUtils.ts',
  'shared/TaskPropertyQueryBuilder/backendRuleShape.ts',
  'shared/TaskPropertyQueryBuilder/propertyRuleConversion.ts',
  'shared/TaskTags/taskTagsPermissions.ts',
  'AppLayout/Header/GlobalSearch/shared/searchTypes.ts',
  'TaskInfoPanel/taskUtils/osmUtils.ts',
  'TaskInfoPanel/taskUtils/propertyUtils.ts',
  'Pages/DashboardPage/contributionsAggregation.ts',
  'Pages/DashboardPage/levelUtils.ts',
  'Pages/ExploreChallengesPage/FilterBar/filterUtils.ts',
  'Pages/ManagementPages/TaskPrioritizationPage/prioritizationParsing.ts',
  'Pages/ManagementPages/TaskPrioritizationPage/evaluation/ruleAnalysis.ts',
  'Pages/ManagementPages/TaskPrioritizationPage/Preview/createPriorityMarkerIcons.ts',
  'Pages/ManagementPages/ManageChallengeNew/challengeFormSchema.ts',
  'Pages/ManagementPages/ManageProjectNew/projectFormSchema.ts',
  'Pages/ManagementPages/ManageTaskEdit/taskFormSchema.ts',
  'Pages/ManagementPages/ManageProjects/pinnedProjects.ts',
  'Pages/BrowsedChallengePage/ChallengePanel/ChallengeModals/ReportModalHelpers.ts',
  'Pages/NotificationsPage/savedViews.ts',
  'Pages/SettingsPage/UserSettingsForm/formSchema.ts',
  'Pages/TaskEditPage/TaskMap/lassoUtils.ts',
  'Pages/TeamsPage/teamSchema.ts',
]

// Pure .tsx modules (paths relative to src/) that have unit tests and should
// count toward coverage despite the blanket .tsx exclusion below. Add a
// file's relative path here once it has real test coverage — not just an
// exported pure helper.
const TESTED_TSX_FILES = [
  'contexts/AuthContext.tsx',
  'lib/SuperAdminGuard.tsx',
  'components/shared/SectionHeader.tsx',
  'components/Pages/ManagementPages/ManageChallengeDetail/ChallengeRecentActivity.tsx',
  'components/Pages/ManagementPages/ManageChallengeDetail/ChallengeTasksExplorer/ChallengeTasksExplorerContext.tsx',
  'components/Pages/SettingsPage/UserSettingsForm/FieldApiKey.tsx',
]

// Emits the VITE_* settings to env.json so they can be loaded into window.env at
// runtime (see index.html). In dev mode, env.json is generated from the user's
// local .env file. For release builds, env.json is written to dist/ and contains
// defaults (from .env.example) which can be overridden at deploy time (e.g. via
// env vars on the Docker container; see docker/90-write-env-to-json.sh)
function runtimeEnv(): Plugin {
  let json: string
  return {
    name: 'maproulette:runtime-env',
    configResolved(config) {
      json = JSON.stringify(loadEnv(config.mode, config.root, 'VITE_'), null, 2)
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/env.json') return next()
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(json)
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'env.json', source: json })
    },
  }
}

function pluginMiddleware(distDir: string) {
  return (
    req: { url?: string },
    res: { setHeader: (k: string, v: string) => void; end: (body: Buffer) => void },
    next: () => void
  ) => {
    if (!req.url?.startsWith('/plugins/')) return next()
    const filePath = resolve(distDir, req.url.slice(1))
    if (!filePath.startsWith(distDir)) return next()
    if (!existsSync(filePath)) return next()
    const content = readFileSync(filePath)
    res.setHeader('Content-Type', 'application/javascript')
    res.setHeader('Cache-Control', 'no-store')
    res.end(content)
  }
}

function servePlugins(): Plugin {
  let distDir: string
  return {
    name: 'maproulette:serve-plugins',
    configResolved(config) {
      distDir = resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use(pluginMiddleware(distDir))
    },
    configurePreviewServer(server) {
      server.middlewares.use(pluginMiddleware(distDir))
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svgr(),
    tailwindcss(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routeFileIgnorePattern: '\\.test\\.',
    }),
    viteReact(),
    runtimeEnv(),
    servePlugins(),
  ],
  build: {
    sourcemap: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  preview: {
    port: 3001,
    host: true,
  },
  server: {
    port: 3001,
    host: true,
  },
  test: {
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/**/*.ts',
        // .tsx files are excluded from coverage by default (see exclude below);
        // carve out the fully-tested files listed in TESTED_TSX_FILES above.
        ...TESTED_TSX_FILES.map((f) => `src/${f}`),
      ],
      exclude: [
        'src/**/*.test.ts',
        // Carve out the files listed in TESTED_TSX_FILES (and include above)
        // from the otherwise blanket .tsx exclusion.
        `src/**/!(${TESTED_TSX_FILES.map((f) =>
          f
            .split('/')
            .pop()
            ?.replace(/\.tsx$/, '')
        ).join('|')}).tsx`,
        'src/**/*.d.ts',
        'src/routeTree.gen.ts',
        'src/test/**',
        // Rest of src/components is untested UI/hooks; carve out the pure
        // utility modules listed in TESTED_COMPONENT_UTILS above.
        `src/components/!(${TESTED_COMPONENT_UTILS.join('|')})/**`,
        // Pure re-export / type-only modules: zero executable statements, so
        // v8 reports 0/0 as 0% rather than 100%. Nothing to cover here.
        'src/i18n/index.ts',
        'src/types/Challenge.ts',
        'src/types/Comment.ts',
        'src/types/Map.ts',
        'src/types/MapLayer.ts',
        'src/types/Oauth.ts',
        'src/types/Plugin.ts',
        'src/types/Project.ts',
        'src/types/Task.ts',
        'src/types/User.ts',
        'src/types/WebSocket.ts',
        'src/types/openApiTypes.ts',
        // Vite rewrites this template-literal dynamic import into a glob-based
        // lookup at build time, so v8 can never attribute an invocation back
        // to this source line even though it's genuinely exercised by
        // messageFormatting.test.ts. A build-tool instrumentation limit, not
        // an untested path — see the file's own comment for detail.
        'src/i18n/defaultCatalogLoader.ts',
      ],
      reporter: ['text', 'html', 'json-summary'],
    },
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
