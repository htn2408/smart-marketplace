/**
 * Chat & Messaging Service for TaskMate
 * Complies with rule.md: Centralized API calls for conversations and messages
 * Connected strictly to .NET 8/10 Backend (SignalR + MongoDB) — 0 mock data
 */

import { getToken } from './authService'
import { formatChatTimestamp } from '../utils/formatters'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5236/api'

const formatTimestamp = formatChatTimestamp
export { formatTimestamp }

/**
 * Map MongoDB ConversationDocument to UI representation
 * @param {object} conv
 * @param {string} [currentUserId]
 * @returns {object}
 */
export function formatConversation(conv, currentUserId) {
  const partner =
    conv.participants?.find((p) => p.userId !== currentUserId) ||
    conv.participants?.[0] ||
    { name: 'Đối tác', role: 'Thành viên', userId: '' }

  const partnerAvatar =
    partner.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name || 'User')}&background=10b981&color=fff`

  const unreadCount =
    conv.unreadCounts && currentUserId ? conv.unreadCounts[currentUserId] || 0 : 0

  return {
    id: conv.id,
    partner: {
      id: partner.userId,
      name: partner.name,
      role: partner.role === 'TASKER' ? 'Tasker' : 'Khách hàng',
      avatar: partnerAvatar,
      isOnline: Boolean(partner.isOnline),
      responseSpeed: partner.responseSpeed || 'Phản hồi nhanh',
    },
    lastMessage: conv.lastMessage?.content || '',
    lastMessageTime: formatTimestamp(conv.lastMessage?.createdAt || conv.updatedAt),
    unreadCount,
    taskTitle: conv.lastMessage?.taskMeta?.title,
    updatedAt: conv.updatedAt,
    raw: conv,
  }
}

/**
 * Map MongoDB MessageDocument to UI representation
 * @param {object} msg
 * @param {string} [currentUserId]
 * @param {string} [partnerName]
 * @returns {object}
 */
export function formatMessage(msg, currentUserId, partnerName) {
  const isOwn = currentUserId ? msg.senderId === currentUserId : Boolean(msg.isOwn)

  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: isOwn ? 'Bạn' : (partnerName || 'Đối tác'),
    content: msg.content,
    createdAt: formatTimestamp(msg.createdAt),
    isOwn,
    isRead: Boolean(msg.isRead),
    type: msg.type || 'text',
    taskMeta: msg.taskMeta,
    attachments: msg.attachments || [],
    raw: msg,
  }
}

/**
 * Fetch all conversations for current user from MongoDB
 * @param {{ signal?: AbortSignal, currentUserId?: string }} [options]
 * @returns {Promise<Array<object>>}
 */
export async function fetchConversations({ signal, currentUserId } = {}) {
  const token = getToken()
  if (!token) return []

  try {
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal,
    })

    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data)) {
        return data.map((conv) => formatConversation(conv, currentUserId))
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.warn('Không thể tải danh sách cuộc trò chuyện từ máy chủ:', err.message)
  }

  return []
}

/**
 * Fetch messages for a specific conversation from MongoDB
 * @param {string} conversationId
 * @param {{ signal?: AbortSignal, currentUserId?: string, partnerName?: string }} [options]
 * @returns {Promise<Array<object>>}
 */
export async function fetchMessages(conversationId, { signal, currentUserId, partnerName } = {}) {
  const token = getToken()
  if (!token || !conversationId) return []

  try {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal,
    })

    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data)) {
        return data.map((msg) => formatMessage(msg, currentUserId, partnerName))
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.warn(`Không thể tải tin nhắn cho cuộc trò chuyện ${conversationId}:`, err.message)
  }

  return []
}

/**
 * Send a message to a conversation via REST API
 * @param {string} conversationId
 * @param {string} content
 * @param {{ receiverId?: string, currentUserId?: string, type?: string, taskMeta?: object, attachments?: string[] }} [options]
 * @returns {Promise<object>} The created message
 */
export async function sendMessageApi(conversationId, content, { receiverId, currentUserId, type = 'text', taskMeta, attachments } = {}) {
  const trimmed = (content || '').trim()
  if (!trimmed && (!attachments || attachments.length === 0)) {
    throw new Error('Nội dung tin nhắn không được để trống.')
  }

  const token = getToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để gửi tin nhắn.')
  }

  const response = await fetch(`${API_BASE_URL}/chat/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversationId,
      receiverId,
      content: trimmed,
      type,
      taskMeta,
      attachments,
    }),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error || 'Không thể gửi tin nhắn.')
  }

  const data = await response.json()
  return formatMessage(data, currentUserId)
}

/**
 * Mark all messages in conversation as read
 * @param {string} conversationId
 */
export async function markAsReadApi(conversationId) {
  const token = getToken()
  if (!token || !conversationId) return { success: false }

  try {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    return { success: response.ok }
  } catch (err) {
    console.warn('Lỗi đánh dấu đã đọc:', err.message)
    return { success: false }
  }
}

/**
 * Initialize or get conversation with another user
 * @param {string} targetUserId
 * @param {string} [currentUserId]
 * @returns {Promise<object>} Formatted conversation
 */
export async function initConversationApi(targetUserId, currentUserId) {
  const token = getToken()
  if (!token) throw new Error('Cần đăng nhập để bắt đầu trò chuyện.')

  const response = await fetch(`${API_BASE_URL}/chat/conversations/init`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetUserId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Không thể tạo cuộc trò chuyện.')
  }

  const data = await response.json()
  return formatConversation(data, currentUserId)
}
