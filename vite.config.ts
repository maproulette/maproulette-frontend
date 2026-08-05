import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import svgr from 'vite-plugin-svgr'
import { defineConfig } from 'vitest/config'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  version: string
}

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
      cpSync(pluginsDir, join(backupDir, 'plugins'), { recursive: true })
    },
    closeBundle() {
      if (!backupDir) return
      cpSync(join(backupDir, 'plugins'), pluginsDir, { recursive: true })
      rmSync(backupDir, { recursive: true, force: true })
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
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.tsx',
        'src/**/*.d.ts',
        'src/routeTree.gen.ts',
        'src/test/**',
        'src/components/**',
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
      ],
      reporter: ['text', 'html', 'json-summary'],
    },
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
})
