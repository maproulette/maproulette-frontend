/// <reference types="vitest/config" />
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path, { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { loadEnv, type Plugin, type ProxyOptions } from 'vite'
import svgr from 'vite-plugin-svgr'
import { defineConfig } from 'vitest/config'

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
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
  'contexts/KeyboardShortcutsContext.tsx',
  'lib/SuperAdminGuard.tsx',
  'components/shared/SectionHeader.tsx',
  'components/Pages/ManagementPages/ManageChallengeDetail/ChallengeRecentActivity.tsx',
  'components/Pages/ManagementPages/ManageChallengeDetail/ChallengeTasksExplorer/ChallengeTasksExplorerContext.tsx',
  'components/Pages/SettingsPage/UserSettingsForm/FieldApiKey.tsx',
  'components/AppLayout/UserLocaleSync.tsx',
]

// Emits the VITE_* settings to env.json so they can be loaded into window.env at
// runtime (see index.html). In dev mode, env.json is generated from the user's
// local .env file. For release builds, env.json is written to dist/ and contains
// defaults (from .env.example) which can be overridden at deploy time (e.g. via
// env vars on the Docker container; see docker/90-write-env-to-json.sh)
//
// In dev mode the backend is proxied through the dev server, and env.json points
// VITE_API_BASE_URL at the dev server itself. This keeps the backend's session
// cookie first-party, which a SameSite=Lax cookie needs when the backend is
// remote (e.g. developing against production).
function runtimeEnv(): Plugin {
  let env: Record<string, string>
  return {
    name: 'maproulette:runtime-env',
    config(config, { mode, command }) {
      env = loadEnv(mode, resolve(config.root ?? process.cwd()), 'VITE_')
      if (command !== 'serve') return
      const target = env.VITE_API_BASE_URL || 'http://127.0.0.1:9000'
      const http: ProxyOptions = {
        target,
        changeOrigin: true,
        cookieDomainRewrite: '',
        configure: (proxy) => {
          // The backend derives the OAuth redirect_uri from Origin, falling
          // back to its configured frontend. Browsers omit Origin on
          // same-origin GETs, so supply the dev server's.
          proxy.on('proxyReq', (proxyReq, req) => {
            if (!req.headers.origin) proxyReq.setHeader('origin', `http://${req.headers.host}`)
          })
          // The dev server is plain http, where browsers may drop Secure cookies.
          proxy.on('proxyRes', (res) => {
            res.headers['set-cookie'] = res.headers['set-cookie']?.map((c) =>
              c.replace(/;\s*Secure/i, '')
            )
          })
        },
      }
      return {
        server: {
          proxy: {
            '/api': http,
            '/auth': http,
            '/ws': { target, changeOrigin: true, ws: true },
          },
        },
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/env.json') return next()
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(
          JSON.stringify({ ...env, VITE_API_BASE_URL: `http://${req.headers.host}` }, null, 2)
        )
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'env.json',
        source: JSON.stringify(env, null, 2),
      })
    },
  }
}
function pluginMiddleware(distDir: string) {
  return (
    req: {
      url?: string
    },
    res: {
      statusCode?: number
      setHeader: (k: string, v: string) => void
      end: (body: Buffer | string) => void
    },
    next: () => void
  ) => {
    if (!req.url?.startsWith('/plugins/')) return next()
    const requestPath = req.url.split('?')[0] ?? req.url
    const filePath = resolve(distDir, requestPath.slice(1))
    if (!filePath.startsWith(distDir)) return next()
    if (!existsSync(filePath)) return next()
    const content = readFileSync(filePath)
    const contentType = requestPath.endsWith('.map') ? 'application/json' : 'application/javascript'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'no-store')
    // Allow DevTools to fetch sibling source maps for minified plugin bundles.
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.end(content)
  }
}

/**
 * Keeps locally deployed plugin bundles across `vite build` (emptyOutDir would
 * otherwise delete dist/plugins and break same-origin /plugins/... loading).
 */
function preservePlugins(): Plugin {
  let pluginsDir = ''
  let backupDir: string | null = null
  return {
    name: 'maproulette:preserve-plugins',
    configResolved(config) {
      pluginsDir = resolve(config.root, config.build.outDir, 'plugins')
    },
    buildStart() {
      if (!existsSync(pluginsDir)) return
      backupDir = mkdtempSync(join(tmpdir(), 'mr-plugins-'))
      cpSync(pluginsDir, join(backupDir, 'plugins'), {
        recursive: true,
      })
    },
    closeBundle() {
      if (!backupDir) return
      cpSync(join(backupDir, 'plugins'), pluginsDir, {
        recursive: true,
      })
      rmSync(backupDir, {
        recursive: true,
        force: true,
      })
      backupDir = null
    },
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
    preservePlugins(),
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
    projects: [
      {
        extends: true,
        test: {
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
          environment: 'node',
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
        },
      },
    ],
  },
})
