/**
 * Task Service for API communication with Backend
 */

// Port 5236 is the default ASP.NET Core URL configured in smart-marketplace-new launchSettings.json
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5236/api'

// Fallback suggestions ONLY used if backend server is not running
const FALLBACK_SUGGESTIONS = [
  {
    skillId: 'mock-1',
    title: 'Lắp ráp tủ quần áo 3 cánh IKEA',
    categoryName: 'Nội thất & Lắp ráp',
    icon: 'shelves',
    suggestedPrice: 450000,
    estimatedMinutes: 150,
  },
  {
    skillId: 'mock-2',
    title: 'Lắp ráp giường ngủ đôi / hộc kéo',
    categoryName: 'Nội thất & Lắp ráp',
    icon: 'bed',
    suggestedPrice: 380000,
    estimatedMinutes: 120,
  },
  {
    skillId: 'mock-3',
    title: 'Khoan tường treo TV 55 - 75 inch & giấu dây',
    categoryName: 'Điện & Lắp đặt',
    icon: 'tv',
    suggestedPrice: 300000,
    estimatedMinutes: 60,
  },
  {
    skillId: 'mock-4',
    title: 'Sửa vòi nước rò rỉ / thay dây cấp nước',
    categoryName: 'Điện nước dân dụng',
    icon: 'plumbing',
    suggestedPrice: 250000,
    estimatedMinutes: 45,
  },
  {
    skillId: 'mock-5',
    title: 'Dọn dẹp căn hộ 2 phòng ngủ chuyên sâu',
    categoryName: 'Vệ sinh nhà cửa',
    icon: 'cleaning_services',
    suggestedPrice: 400000,
    estimatedMinutes: 180,
  },
]

/**
 * Fetch task/skill suggestions based on query keyword directly from MySQL DB via .NET API
 * @param {string} query Search text
 * @param {AbortSignal} [signal] Optional abort signal for canceling race conditions
 * @param {number} [limit=6] Limit count
 */
export async function fetchTaskSuggestions(query, { signal, limit = 6 } = {}) {
  const trimmed = (query || '').trim()

  try {
    const url = `${API_BASE_URL}/tasks/suggestions?q=${encodeURIComponent(trimmed)}&limit=${limit}`
    const response = await fetch(url, {
      signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`)
    }

    const data = await response.json()
    if (Array.isArray(data) && data.length > 0) {
      return data
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err
    }
    console.warn(
      `[taskService] Không thể kết nối tới Backend (.NET port 5236): ${err.message}. Đang dùng dữ liệu dự phòng tạm thời.`
    )
  }

  // Fallback filter
  if (!trimmed) {
    return FALLBACK_SUGGESTIONS.slice(0, limit)
  }

  const lower = trimmed.toLowerCase()
  const matched = FALLBACK_SUGGESTIONS.filter(
    (item) =>
      item.title.toLowerCase().includes(lower) ||
      item.categoryName.toLowerCase().includes(lower)
  )

  return matched.length > 0
    ? matched.slice(0, limit)
    : [
        {
          skillId: 'custom',
          title: trimmed,
          categoryName: 'Dịch vụ đời sống',
          icon: 'edit_note',
          suggestedPrice: 350000,
          estimatedMinutes: 120,
        },
      ]
}
