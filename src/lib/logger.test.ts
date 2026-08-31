import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Overrides = { DEV?: boolean; VITE_ENABLE_TEST_LOGS?: string }

const loadLogger = async (overrides: Overrides = {}) => {
  const env = import.meta.env as unknown as Record<string, unknown>
  Object.assign(env, overrides)
  vi.resetModules()
  return import('./logger.ts')
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  const env = import.meta.env as unknown as Record<string, unknown>
  delete env.VITE_ENABLE_TEST_LOGS
  env.DEV = false
})

describe('logger (test-log suppression)', () => {
  it('suppresses all log levels in test mode when VITE_ENABLE_TEST_LOGS is not set', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const { logger } = await loadLogger()
    logger.info('hello')
    expect(infoSpy).not.toHaveBeenCalled()
  })
})

describe('logger (test logs enabled)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
  })

  it('suppresses debug logs outside of dev mode', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const { logger } = await loadLogger({ VITE_ENABLE_TEST_LOGS: 'true', DEV: false })
    logger.debug('should not appear')
    expect(debugSpy).not.toHaveBeenCalled()
  })

  it('emits debug logs in dev mode', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const { logger } = await loadLogger({ VITE_ENABLE_TEST_LOGS: 'true', DEV: true })
    logger.debug('hello debug')
    expect(debugSpy).toHaveBeenCalledWith('[2026-01-01T00:00:00.000Z] [DEBUG] hello debug')
  })

  it('formats info logs without metadata', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const { logger } = await loadLogger({ VITE_ENABLE_TEST_LOGS: 'true' })
    logger.info('hello info')
    expect(infoSpy).toHaveBeenCalledWith('[2026-01-01T00:00:00.000Z] [INFO] hello info')
  })

  it('formats warn logs with metadata as pretty-printed JSON', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { logger } = await loadLogger({ VITE_ENABLE_TEST_LOGS: 'true' })
    logger.warn('hello warn', { code: 42 })
    expect(warnSpy).toHaveBeenCalledWith(
      `[2026-01-01T00:00:00.000Z] [WARN] hello warn ${JSON.stringify({ code: 42 }, null, 2)}`
    )
  })

  it('formats error logs', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { logger } = await loadLogger({ VITE_ENABLE_TEST_LOGS: 'true' })
    logger.error('hello error')
    expect(errorSpy).toHaveBeenCalledWith('[2026-01-01T00:00:00.000Z] [ERROR] hello error')
  })

  it('serializes Error metadata instead of empty {} and passes the raw Error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { logger } = await loadLogger({ VITE_ENABLE_TEST_LOGS: 'true' })
    const boom = new Error('plugin boom')
    boom.stack = 'Error: plugin boom\n    at Plugin.tsx:1:1'
    logger.error('failed', { error: boom, pluginId: 'review' })

    expect(errorSpy).toHaveBeenCalledTimes(1)
    const [message, rawError] = errorSpy.mock.calls[0] ?? []
    expect(String(message)).toContain('"message": "plugin boom"')
    expect(String(message)).toContain('"stack": "Error: plugin boom')
    expect(String(message)).toContain('"pluginId": "review"')
    expect(rawError).toBe(boom)
  })

  it('scope() prefixes messages with the scope name for every level', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { logger } = await loadLogger({ VITE_ENABLE_TEST_LOGS: 'true', DEV: true })

    const scoped = logger.scope('MyScope')
    scoped.debug('d')
    scoped.info('i')
    scoped.warn('w')
    scoped.error('e')

    expect(debugSpy).toHaveBeenCalledWith('[2026-01-01T00:00:00.000Z] [DEBUG] [MyScope] d')
    expect(infoSpy).toHaveBeenCalledWith('[2026-01-01T00:00:00.000Z] [INFO] [MyScope] i')
    expect(warnSpy).toHaveBeenCalledWith('[2026-01-01T00:00:00.000Z] [WARN] [MyScope] w')
    expect(errorSpy).toHaveBeenCalledWith('[2026-01-01T00:00:00.000Z] [ERROR] [MyScope] e')
  })

  it('wsLogger prefixes messages with "WebSocket"', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const { wsLogger } = await loadLogger({ VITE_ENABLE_TEST_LOGS: 'true' })
    wsLogger.info('connected')
    expect(infoSpy).toHaveBeenCalledWith('[2026-01-01T00:00:00.000Z] [INFO] [WebSocket] connected')
  })

  it('pluginLogger prefixes messages with "Plugin"', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const { pluginLogger } = await loadLogger({ VITE_ENABLE_TEST_LOGS: 'true' })
    pluginLogger.info('loaded')
    expect(infoSpy).toHaveBeenCalledWith('[2026-01-01T00:00:00.000Z] [INFO] [Plugin] loaded')
  })
})
