import { logger } from '@/lib/logger'

export const JOSM_HOST = 'http://127.0.0.1:8111/'

const JOSM_COMMAND_DELAY_MS = 1000

const isSafari = () => 'safari' in window

export const sendJosmCommand = async (url: string): Promise<boolean> => {
  if (isSafari()) {
    const tab = window.open(url)
    await new Promise((resolve) => setTimeout(resolve, JOSM_COMMAND_DELAY_MS))
    if (tab && !tab.closed) tab.close()
    return true
  }

  try {
    const response = await fetch(url)
    return response.status === 200
  } catch (error) {
    logger.warn('JOSM remote control did not respond', { url, error })
    return false
  }
}

export const sendJosmCommands = async (urls: string[]): Promise<boolean> => {
  if (isSafari()) {
    await Promise.all(urls.map((url) => sendJosmCommand(url)))
    return true
  }

  const [first, ...rest] = urls
  if (first && !(await sendJosmCommand(first))) return false
  for (const url of rest) {
    await new Promise((resolve) => setTimeout(resolve, JOSM_COMMAND_DELAY_MS))
    await sendJosmCommand(url)
  }
  return true
}
