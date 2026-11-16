import { useWebSocketEvents } from '@/hooks/useWebSocketEvents'

/**
 * Zero-DOM component that mounts the WebSocket event dispatcher inside the
 * correct provider stack (Auth + WebSocket + Congratulate + QueryClient).
 */
export const WebSocketEventsListener = () => {
  useWebSocketEvents()
  return null
}
