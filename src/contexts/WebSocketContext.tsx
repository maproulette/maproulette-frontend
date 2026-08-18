import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import useWebSocketHook, { ReadyState } from 'react-use-websocket'
import { wsLogger } from '@/lib/logger'
import type { WebSocketMessageTypes } from '@/types/WebSocket'
import { useAuthContext } from './AuthContext'

interface WebSocketContextType {
  lastMessage: WebSocketMessageTypes | null
  readyState: ReadyState
  sendMessage: (message: string) => void
  subscribe: (subscriptionName: string) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext()

  const { lastMessage, readyState, sendMessage } = useWebSocketHook(
    user ? import.meta.env.VITE_MAP_ROULETTE_SERVER_WEBSOCKET_URL : null,
    {
      shouldReconnect: () => user !== null,
      reconnectAttempts: 10,
      reconnectInterval: (attemptNumber) => {
        // Exponential backoff with max 30 seconds
        const delay = Math.min(1000 * 2 ** attemptNumber, 30000)
        wsLogger.debug(`WebSocket reconnecting in ${delay}ms (attempt ${attemptNumber + 1})`)
        return delay
      },
      onOpen: () => {
        wsLogger.info('WebSocket connected')
      },
      onClose: (event) => {
        wsLogger.warn('WebSocket disconnected', {
          code: event.code,
          reason: event.reason,
        })
      },
      onError: (event) => {
        wsLogger.error('WebSocket error', { event })
      },
      onReconnectStop: (numAttempts) => {
        wsLogger.error(`WebSocket failed to reconnect after ${numAttempts} attempts`)
      },
    }
  )

  const parsedMessage = useMemo(
    () => (lastMessage?.data ? JSON.parse(lastMessage.data) : null),
    [lastMessage?.data]
  )

  // Reason: stored in context value and used as dependency in useEffect below
  const subscribe = useCallback(
    (subscriptionName: string) => {
      if (readyState === ReadyState.OPEN) {
        const subscribeMessage = {
          messageType: 'subscribe',
          data: { subscriptionName },
        }
        sendMessage(JSON.stringify(subscribeMessage))
      }
    },
    [readyState, sendMessage]
  )

  useEffect(() => {
    if (readyState === ReadyState.OPEN && user?.id) {
      subscribe(`user_${user.id}`)
    }
  }, [readyState, user?.id, subscribe])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo<WebSocketContextType>(
    () => ({ lastMessage: parsedMessage, readyState, sendMessage, subscribe }),
    [parsedMessage, readyState, sendMessage, subscribe]
  )

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}
