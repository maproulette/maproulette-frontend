import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import useWebSocketHook, { ReadyState } from 'react-use-websocket'
import { apiBaseUrl } from '@/api/client'
import { wsLogger } from '@/lib/logger'
import type { WebSocketMessageTypes } from '@/types/WebSocket'
import { useAuthContext } from './AuthContext'

interface WebSocketContextType {
  lastMessage: WebSocketMessageTypes | null
  readyState: ReadyState
  /** Subscribe to a backend topic. Returns a function that releases the subscription. */
  subscribe: (subscriptionName: string) => () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext()

  const { lastMessage, readyState, sendMessage } = useWebSocketHook(
    user ? `${apiBaseUrl.replace(/^http/, 'ws').replace(/\/$/, '')}/ws` : null,
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

  // Active subscriptions, ref-counted because the backend's unsubscribe is not:
  // one consumer unmounting must not cancel a topic another consumer still needs.
  const subscriptions = useRef(new Map<string, number>())
  const socket = useRef({ readyState, sendMessage })
  socket.current = { readyState, sendMessage }

  const send = useCallback((messageType: 'subscribe' | 'unsubscribe', subscriptionName: string) => {
    if (socket.current.readyState !== ReadyState.OPEN) return
    socket.current.sendMessage(JSON.stringify({ messageType, data: { subscriptionName } }))
  }, [])

  const subscribe = useCallback(
    (subscriptionName: string) => {
      const count = subscriptions.current.get(subscriptionName) ?? 0
      subscriptions.current.set(subscriptionName, count + 1)
      if (count === 0) send('subscribe', subscriptionName)

      return () => {
        const remaining = (subscriptions.current.get(subscriptionName) ?? 1) - 1
        if (remaining > 0) {
          subscriptions.current.set(subscriptionName, remaining)
        } else {
          subscriptions.current.delete(subscriptionName)
          send('unsubscribe', subscriptionName)
        }
      }
    },
    [send]
  )

  // Server-side subscriptions belong to the connection, so (re)send them all
  // whenever a connection opens.
  useEffect(() => {
    if (readyState !== ReadyState.OPEN) return
    for (const subscriptionName of subscriptions.current.keys()) {
      send('subscribe', subscriptionName)
    }
  }, [readyState, send])

  const userId = user?.id
  useEffect(() => (userId ? subscribe(`user_${userId}`) : undefined), [userId, subscribe])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo<WebSocketContextType>(
    () => ({ lastMessage: parsedMessage, readyState, subscribe }),
    [parsedMessage, readyState, subscribe]
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

/**
 * Receive live task events (claims, releases, status changes) for one challenge
 * while the calling component is mounted. They are handled by useWebSocketEvents.
 */
export const useChallengeSubscription = (challengeId: number) => {
  const { subscribe } = useWebSocketContext()
  useEffect(() => subscribe(`challengeTasks_${challengeId}`), [challengeId, subscribe])
}
