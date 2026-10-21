import { useContext } from 'react'
import { ChatWebSocketContext } from '../context/chatWebSocketContextDef'

/**
 * Custom Hook useChatWebSocket
 * Exposes real-time chat connection and methods
 */
export function useChatWebSocket() {
  const context = useContext(ChatWebSocketContext)
  if (!context) {
    throw new Error('useChatWebSocket must be used within a ChatWebSocketProvider')
  }
  return context
}
