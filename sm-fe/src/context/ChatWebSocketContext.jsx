import { useState, useEffect, useRef, useCallback } from 'react'
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr'
import { ChatWebSocketContext } from './chatWebSocketContextDef'
import { useAuth } from '../hooks/useAuth'

const HUB_URL = import.meta.env.VITE_CHAT_HUB_URL || 'http://localhost:5236/hubs/chat'

export function ChatWebSocketProvider({ children }) {
  const { token, user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const connectionRef = useRef(null)

  // Listeners sets
  const messageListenersRef = useRef(new Set())
  const readListenersRef = useRef(new Set())
  const typingListenersRef = useRef(new Set())

  // Khởi tạo và quản lý vòng đời kết nối SignalR
  useEffect(() => {
    if (!token) {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
        connectionRef.current = null
        setIsConnected(false)
      }
      return
    }

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build()

    connectionRef.current = connection

    // Đăng ký nhận tin nhắn mới từ Hub
    connection.on('ReceiveMessage', (message) => {
      messageListenersRef.current.forEach((handler) => {
        try {
          handler(message)
        } catch (err) {
          console.warn('Lỗi trong bộ xử lý ReceiveMessage:', err)
        }
      })
    })

    // Đăng ký nhận thông báo tin nhắn đã đọc
    connection.on('MessagesRead', (data) => {
      readListenersRef.current.forEach((handler) => {
        try {
          handler(data)
        } catch (err) {
          console.warn('Lỗi trong bộ xử lý MessagesRead:', err)
        }
      })
    })

    // Đăng ký nhận thông báo đang soạn tin
    connection.on('UserTyping', (data) => {
      typingListenersRef.current.forEach((handler) => {
        try {
          handler(data)
        } catch (err) {
          console.warn('Lỗi trong bộ xử lý UserTyping:', err)
        }
      })
    })

    connection.onreconnecting(() => {
      setIsConnected(false)
    })

    connection.onreconnected(() => {
      setIsConnected(true)
    })

    connection.onclose(() => {
      setIsConnected(false)
    })

    let isMounted = true

    connection
      .start()
      .then(() => {
        if (isMounted) {
          setIsConnected(true)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setIsConnected(false)
          console.warn('Không thể kết nối SignalR ChatHub:', err.message)
        }
      })

    return () => {
      isMounted = false
      connection.stop().catch(() => {})
      connectionRef.current = null
      setIsConnected(false)
    }
  }, [token])

  // Đăng ký lắng nghe sự kiện
  const subscribeMessage = useCallback((handler) => {
    messageListenersRef.current.add(handler)
    return () => {
      messageListenersRef.current.delete(handler)
    }
  }, [])

  const subscribeRead = useCallback((handler) => {
    readListenersRef.current.add(handler)
    return () => {
      readListenersRef.current.delete(handler)
    }
  }, [])

  const subscribeTyping = useCallback((handler) => {
    typingListenersRef.current.add(handler)
    return () => {
      typingListenersRef.current.delete(handler)
    }
  }, [])

  // Gửi tin nhắn qua SignalR Hub
  const sendMessage = useCallback(async ({ conversationId, receiverId, content, type = 'text', taskMeta, attachments }) => {
    if (!connectionRef.current || !isConnected) {
      throw new Error('Chưa kết nối tới máy chủ thời gian thực.')
    }
    return await connectionRef.current.invoke('SendMessage', {
      conversationId,
      receiverId,
      content,
      type,
      taskMeta,
      attachments,
    })
  }, [isConnected])

  // Đánh dấu đã đọc qua Hub
  const markAsRead = useCallback(async (conversationId) => {
    if (!connectionRef.current || !isConnected) return
    try {
      await connectionRef.current.invoke('MarkAsRead', conversationId)
    } catch (err) {
      console.warn('Không thể gửi trạng thái đã đọc qua SignalR:', err)
    }
  }, [isConnected])

  // Gửi thông báo đang gõ phím
  const sendTyping = useCallback(async (conversationId, receiverId, isTyping) => {
    if (!connectionRef.current || !isConnected) return
    try {
      await connectionRef.current.invoke('SendTyping', {
        conversationId,
        receiverId,
        isTyping,
      })
    } catch {
      // Bỏ qua lỗi gửi typing
    }
  }, [isConnected])

  // Tham gia phòng hội thoại
  const joinConversation = useCallback(async (conversationId) => {
    if (!connectionRef.current || !isConnected) return
    try {
      await connectionRef.current.invoke('JoinConversation', conversationId)
    } catch (err) {
      console.warn('Không thể join phòng hội thoại:', err)
    }
  }, [isConnected])

  // Rời phòng hội thoại
  const leaveConversation = useCallback(async (conversationId) => {
    if (!connectionRef.current || !isConnected) return
    try {
      await connectionRef.current.invoke('LeaveConversation', conversationId)
    } catch (err) {
      console.warn('Không thể leave phòng hội thoại:', err)
    }
  }, [isConnected])

  const value = {
    isConnected,
    currentUserId: user?.id,
    sendMessage,
    markAsRead,
    sendTyping,
    joinConversation,
    leaveConversation,
    subscribeMessage,
    subscribeRead,
    subscribeTyping,
  }

  return (
    <ChatWebSocketContext.Provider value={value}>
      {children}
    </ChatWebSocketContext.Provider>
  )
}
