type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMetadata {
  [key: string]: unknown
}

interface Logger {
  debug: (message: string, metadata?: LogMetadata) => void
  info: (message: string, metadata?: LogMetadata) => void
  warn: (message: string, metadata?: LogMetadata) => void
  error: (message: string, metadata?: LogMetadata) => void
  scope: (scopeName: string) => Omit<Logger, 'scope'>
}

const isDev = import.meta.env.DEV
const isTest = import.meta.env.MODE === 'test'

/** JSON.stringify drops Error fields; keep message/stack for production diagnosis. */
const serializeLogValue = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    }
  }
  if (Array.isArray(value)) {
    return value.map(serializeLogValue)
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = serializeLogValue(nested)
    }
    return out
  }
  return value
}

const log = (level: LogLevel, message: string, metadata?: LogMetadata) => {
  if (isTest && !import.meta.env.VITE_ENABLE_TEST_LOGS) {
    return
  }

  if (!isDev && level === 'debug') {
    return
  }

  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  const formattedMessage = metadata
    ? `${prefix} ${message} ${JSON.stringify(serializeLogValue(metadata), null, 2)}`
    : `${prefix} ${message}`

  switch (level) {
    case 'debug':
      console.debug(formattedMessage)
      break
    case 'info':
      console.info(formattedMessage)
      break
    case 'warn':
      console.warn(formattedMessage)
      break
    case 'error': {
      // Pass the raw Error as a second arg so DevTools keeps an expandable stack
      // even when the plugin / host bundle is minified.
      const rawError = metadata?.error
      if (rawError instanceof Error) {
        console.error(formattedMessage, rawError)
      } else {
        console.error(formattedMessage)
      }
      break
    }
  }
}

const createScope = (scopeName: string): Omit<Logger, 'scope'> => ({
  debug: (message: string, metadata?: LogMetadata) =>
    log('debug', `[${scopeName}] ${message}`, metadata),
  info: (message: string, metadata?: LogMetadata) =>
    log('info', `[${scopeName}] ${message}`, metadata),
  warn: (message: string, metadata?: LogMetadata) =>
    log('warn', `[${scopeName}] ${message}`, metadata),
  error: (message: string, metadata?: LogMetadata) =>
    log('error', `[${scopeName}] ${message}`, metadata),
})

export const logger: Logger = {
  debug: (message: string, metadata?: LogMetadata) => log('debug', message, metadata),
  info: (message: string, metadata?: LogMetadata) => log('info', message, metadata),
  warn: (message: string, metadata?: LogMetadata) => log('warn', message, metadata),
  error: (message: string, metadata?: LogMetadata) => log('error', message, metadata),
  scope: createScope,
}

// Create pre-configured scoped loggers for common use cases
export const wsLogger = createScope('WebSocket')
export const pluginLogger = createScope('Plugin')
