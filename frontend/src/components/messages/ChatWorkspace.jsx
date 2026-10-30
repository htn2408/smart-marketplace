import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import Icon from '../common/Icon'
import Button from '../common/Button'
import { ROUTES } from '../../routes/paths'
import ConversationList from './ConversationList'
import ChatHeader from './ChatHeader'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import {
  fetchConversations,
  fetchMessages,
  sendMessageApi,
  markAsReadApi,
  initConversationApi,
  formatMessage,
} from '../../services/chatService'
import { useAuth } from '../../hooks/useAuth'
import { useChatWebSocket } from '../../hooks/useChatWebSocket'

/**
 * ChatWorkspace Component
 * Reusable full-featured messaging workspace for both Client and Tasker roles
 * Extracted according to rule.md for maximum reusability (DRY)
 */
export default function ChatWorkspace({ onNavigate, role = 'client', className = '' }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const currentUserId = user?.id

  const {
    isConnected,
    sendMessage: sendWsMessage,
    markAsRead: markWsRead,
    subscribeMessage,
    subscribeRead,
  } = useChatWebSocket()

  const [conversations, setConversations] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState('all')
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const messagesContainerRef = useRef(null)

  const location = useLocation()
  const [searchParams] = useSearchParams()
  const targetUserId =
    location.state?.targetUserId ||
    searchParams.get('userId') ||
    searchParams.get('targetUserId')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // 1. Tải danh sách cuộc trò chuyện và tự động mở đúng đoạn chat với targetUserId (nếu có)
  useEffect(() => {
    if (!currentUserId) return
    const controller = new AbortController()
    let isMounted = true

    const loadConversations = async () => {
      try {
        let list = await fetchConversations({ signal: controller.signal, currentUserId })
        if (!isMounted) return

        // Nếu có targetUserId (được điều hướng từ TaskManager, Profile, Filter...)
        if (targetUserId && targetUserId !== currentUserId) {
          // 1. Kiểm tra xem cuộc trò chuyện với thợ/đối tác này đã tồn tại chưa
          const existing = list.find(
            (c) =>
              c.partner?.id === targetUserId ||
              c.partner?.userId === targetUserId ||
              c.raw?.participantIds?.includes(targetUserId)
          )

          if (existing) {
            setConversations(list)
            setSelectedConversationId(existing.id)
            setIsMobileChatOpen(true)
            return
          }

          // 2. Nếu chưa có, gọi API khởi tạo cuộc trò chuyện mới
          try {
            const newConv = await initConversationApi(targetUserId, currentUserId)
            if (!isMounted) return
            if (newConv && newConv.id) {
              const updatedList = [newConv, ...list.filter((c) => c.id !== newConv.id)]
              setConversations(updatedList)
              setSelectedConversationId(newConv.id)
              setIsMobileChatOpen(true)
              return
            }
          } catch (initErr) {
            console.warn('Lỗi khởi tạo hội thoại từ targetUserId:', initErr.message)
            showToast(initErr.message || 'Không thể mở cuộc trò chuyện với người này.')
          }
        }

        // 3. Trường hợp bình thường (không có targetUserId hoặc tạo mới thất bại):
        setConversations(list)
        if (list.length > 0) {
          setSelectedConversationId((prev) =>
            prev && list.some((c) => c.id === prev) ? prev : list[0].id
          )
        } else {
          setSelectedConversationId(null)
          setMessages([])
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        console.warn('Lỗi tải danh sách trò chuyện:', err)
      }
    }

    loadConversations()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [currentUserId, targetUserId])

  // 2. Cuộc trò chuyện đang chọn
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId) || null
  }, [conversations, selectedConversationId])

  // 3. Tải tin nhắn khi đổi cuộc trò chuyện
  useEffect(() => {
    if (!selectedConversationId) return
    const controller = new AbortController()

    const partnerName = activeConversation?.partner?.name

    fetchMessages(selectedConversationId, {
      signal: controller.signal,
      currentUserId,
      partnerName,
    })
      .then((msgs) => {
        setMessages(msgs)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.warn('Lỗi tải tin nhắn:', err)
      })

    return () => controller.abort()
  }, [selectedConversationId, currentUserId, activeConversation?.partner?.name])

  // 4. Lắng nghe tin nhắn mới & trạng thái đọc từ SignalR Hub thời gian thực
  useEffect(() => {
    const unsubscribeMsg = subscribeMessage((rawMsg) => {
      const incoming = formatMessage(rawMsg, currentUserId, activeConversation?.partner?.name)

      if (incoming.conversationId === selectedConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev
          return [...prev, incoming]
        })

        if (!incoming.isOwn) {
          markWsRead(incoming.conversationId)
        }
      }

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === incoming.conversationId) {
            const isCurrentChat = incoming.conversationId === selectedConversationId
            return {
              ...conv,
              lastMessage: incoming.content,
              lastMessageTime: incoming.createdAt,
              unreadCount: isCurrentChat || incoming.isOwn ? 0 : (conv.unreadCount || 0) + 1,
              updatedAt: new Date().toISOString(),
            }
          }
          return conv
        })
      )
    })

    const unsubscribeRead = subscribeRead(({ conversationId, readerUserId }) => {
      if (conversationId === selectedConversationId && readerUserId !== currentUserId) {
        setMessages((prev) =>
          prev.map((m) => (m.isOwn ? { ...m, isRead: true } : m))
        )
      }
    })

    return () => {
      unsubscribeMsg()
      unsubscribeRead()
    }
  }, [
    selectedConversationId,
    currentUserId,
    subscribeMessage,
    subscribeRead,
    markWsRead,
    activeConversation?.partner?.name,
  ])

  // 5. Tự động cuộn xuống cuối khi có tin nhắn mới (chỉ cuộn khung chat, không giật trang)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  // Lọc cuộc trò chuyện theo từ khóa và tab
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      if (filterTab === 'unread' && (conv.unreadCount || 0) === 0) return false
      if (filterTab === 'in_progress' && conv.status !== 'IN_PROGRESS') return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = conv.partner?.name?.toLowerCase().includes(q)
        const matchTask = conv.taskTitle?.toLowerCase().includes(q)
        const matchLastMsg = conv.lastMessage?.toLowerCase().includes(q)
        const matchTaskId = conv.taskId?.toLowerCase().includes(q)
        return matchName || matchTask || matchLastMsg || matchTaskId
      }

      return true
    })
  }, [conversations, filterTab, searchQuery])

  // Chọn cuộc trò chuyện
  const handleSelectConversation = useCallback(
    async (id) => {
      setSelectedConversationId(id)
      setIsMobileChatOpen(true)

      // Đánh dấu đã đọc qua cả REST và SignalR
      try {
        await markAsReadApi(id)
        markWsRead(id)
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
        )
      } catch {
        // Bỏ qua lỗi đánh dấu đọc
      }
    },
    [markWsRead]
  )

  // Gửi tin nhắn mới
  const handleSendMessage = async (text) => {
    if (!selectedConversationId || !text.trim() || isSending) return

    try {
      setIsSending(true)
      const trimmed = text.trim()
      const partnerId = activeConversation?.partner?.id

      if (isConnected && selectedConversationId && partnerId) {
        await sendWsMessage({
          conversationId: selectedConversationId,
          receiverId: partnerId,
          content: trimmed,
          type: 'text',
        })
      } else {
        const newMsg = await sendMessageApi(selectedConversationId, trimmed, {
          receiverId: partnerId,
          currentUserId,
        })
        setMessages((prev) => [...prev, newMsg])
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversationId
              ? {
                  ...c,
                  lastMessage: trimmed,
                  lastMessageTime: newMsg.createdAt,
                }
              : c
          )
        )
      }
      setInputText('')
    } catch (err) {
      showToast(err.message || 'Không thể gửi tin nhắn.')
    } finally {
      setIsSending(false)
    }
  }

  // Đánh dấu tất cả đã đọc
  const handleMarkAllRead = async () => {
    setConversations((prev) => prev.map((c) => ({ ...c, unreadCount: 0 })))
    showToast('Đã đánh dấu tất cả cuộc trò chuyện là đã đọc.')
  }

  // Các thao tác từ Header
  const handleCall = () => {
    showToast(`Đang kết nối cuộc gọi tới ${activeConversation?.partner?.name || 'đối tác'}...`)
  }

  const isClientRole = role === 'client'

  const isPartnerTasker = useCallback((partner) => {
    if (!partner) return false
    const roleStr = (partner.rawRole || partner.role || '').toLowerCase()
    return roleStr.includes('tasker')
  }, [])

  const handleViewTaskerProfile = useCallback(
    (partnerToView) => {
      const target = partnerToView || activeConversation?.partner
      if (!target) return
      const partnerId = target.id || target.userId
      if (!partnerId) return

      const targetRoute = `/tasker/${partnerId}`
      if (onNavigate) {
        onNavigate(targetRoute, { isOwnerView: false, tasker: target })
      } else {
        navigate(targetRoute, { state: { isOwnerView: false, tasker: target } })
      }
    },
    [activeConversation, onNavigate, navigate]
  )

  const handleReport = () => {
    showToast('Cảm ơn bạn. Yêu cầu báo cáo đã được chuyển tới ban quản trị TaskMate.')
  }

  const handleViewTask = () => {
    if (activeConversation?.taskId) {
      if (role === 'tasker') {
        onNavigate?.('tasker-requests')
      } else {
        onNavigate?.('my-tasks')
      }
    }
  }

  return (
    <div
      className={`relative flex-1 min-h-0 w-full bg-surface-container-lowest rounded-none sm:rounded-2xl lg:rounded-3xl border-0 sm:border border-surface-variant/40 shadow-none sm:shadow-sm flex overflow-hidden ${className}`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-surface-container-lowest border border-primary/30 rounded-2xl p-4 shadow-xl flex items-center gap-3">
            <Icon name="check_circle" size={20} className="text-primary" />
            <span className="text-xs font-bold text-on-surface">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ================= LEFT SIDEBAR (Conversation List) ================= */}
      <div
        className={`w-full md:w-[320px] lg:w-[360px] xl:w-[380px] flex-none flex flex-col min-h-0 ${
          isMobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={filterTab}
          onTabChange={setFilterTab}
          onMarkAllRead={handleMarkAllRead}
          onViewProfile={handleViewTaskerProfile}
          isClientRole={isClientRole}
        />
      </div>

      {/* ================= RIGHT CHAT PANE ================= */}
      <section
        className={`flex-1 flex flex-col bg-surface-container-lowest min-h-0 overflow-hidden ${
          !isMobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              conversation={activeConversation}
              onBack={() => setIsMobileChatOpen(false)}
              onCall={handleCall}
              onReport={handleReport}
              onViewTask={handleViewTask}
              onViewProfile={handleViewTaskerProfile}
              canViewProfile={isClientRole && isPartnerTasker(activeConversation.partner)}
            />

            {/* Chat History Area (Scrollable) */}
            <div
              ref={messagesContainerRef}
              className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-surface-container-low/30"
            >
              {/* Date Separator */}
              <div className="flex justify-center my-1">
                <span className="px-3 py-1 bg-surface-container-lowest border border-surface-variant/30 rounded-full text-xs font-semibold text-outline shadow-2xs">
                  Hôm nay
                </span>
              </div>

              {/* Escrow Guarantee Pill */}
              <div className="flex justify-center my-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/40 text-primary text-[11px] font-bold border border-primary/20">
                  <Icon name="verified_user" size={14} />
                  Giao dịch &amp; trao đổi được bảo đảm an toàn qua TaskMate Escrow
                </span>
              </div>

              {/* Message Bubbles */}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  partnerAvatar={activeConversation.partner.avatar}
                  partnerName={activeConversation.partner.name}
                  onViewProfile={() => handleViewTaskerProfile(activeConversation.partner)}
                  canViewProfile={isClientRole && isPartnerTasker(activeConversation.partner)}
                />
              ))}
            </div>

            {/* Bottom Message Input Bar */}
            <MessageInput
              value={inputText}
              onChange={setInputText}
              onSend={handleSendMessage}
              disabled={isSending}
              onAttach={() => showToast('Tính năng gửi ảnh / tệp đính kèm sẽ sớm ra mắt.')}
              onEmoji={() => showToast('Tính năng biểu tượng cảm xúc sẽ sớm ra mắt.')}
            />
          </>
        ) : !user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="lock" size={28} />
            </div>
            <h3 className="font-headline-sm text-base font-bold text-on-surface">
              Vui lòng đăng nhập để xem tin nhắn
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm">
              Đăng nhập tài khoản TaskMate của bạn để trao đổi trực tiếp và nhận thông báo công việc.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon="login"
              onClick={() => (onNavigate ? onNavigate('login') : navigate(ROUTES.LOGIN))}
              className="rounded-xl font-bold mt-1"
            >
              Đăng nhập ngay
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="forum" size={28} />
            </div>
            <h3 className="font-headline-sm text-base font-bold text-on-surface">
              Chưa chọn cuộc trò chuyện nào
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm">
              Chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu trao đổi chi tiết công việc.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
