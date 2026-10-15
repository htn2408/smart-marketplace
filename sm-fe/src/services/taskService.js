/**
 * Task Service for API communication with Backend
 */
import { getToken } from './authService'

// Port 5236 is the default ASP.NET Core URL configured in smart-marketplace-new launchSettings.json
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5236/api'

// Header auth dùng chung — backend chặn endpoint filter/task theo role
function authHeaders(extra = {}) {
  const token = getToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

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

/**
 * Filter & score candidate Taskers for a PENDING task via Backend POST /api/tasks/filter
 * Hard Filter: ONLINE + requiredSkillId + worker_districts + no schedule conflict
 * Score: Rating (60%) + CompletedTasks (40%)
 * @param {string} taskId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ task: object, totalCandidates: number, results: Array<object> }>}
 */
export async function filterTaskersByTaskId(taskId, { signal } = {}) {
  if (!taskId) {
    throw new Error('taskId là bắt buộc.')
  }

  const response = await fetch(`${API_BASE_URL}/tasks/filter`, {
    signal,
    method: 'POST',
    headers: authHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    body: JSON.stringify({ taskId }),
  })

  const data = await response.json()
  if (!response.ok) {
    const message =
      data.error ||
      data.message ||
      data.title ||
      'Không thể lọc danh sách Tasker phù hợp.'
    throw new Error(message)
  }

  return data
}

/**
 * Create a task via Backend POST /api/tasks (multipart/form-data, role CLIENT required)
 * @param {object} taskForm { title, description, city, district, provinceCode, districtCode,
 *   address, latitude, longitude, scheduledStartTime (ISO string), expectedTime (minutes), offeredPrice, requiredSkillId }
 * @param {File[]} images 0-10 ảnh, mỗi ảnh ≤ 5MB
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ task: object }>} CreateTaskResponse
 */
export async function createTaskApi(taskForm, images = [], { signal } = {}) {
  const formData = new FormData()

  formData.append('title', taskForm.title)
  if (taskForm.description) formData.append('description', taskForm.description)
  formData.append('city', taskForm.city)
  formData.append('district', taskForm.district)
  if (taskForm.provinceCode) formData.append('provinceCode', taskForm.provinceCode)
  if (taskForm.districtCode) formData.append('districtCode', taskForm.districtCode)
  if (taskForm.address) formData.append('address', taskForm.address)
  if (taskForm.latitude != null) formData.append('latitude', String(taskForm.latitude))
  if (taskForm.longitude != null) formData.append('longitude', String(taskForm.longitude))
  formData.append('scheduledStartTime', taskForm.scheduledStartTime)
  formData.append('expectedTime', String(taskForm.expectedTime))
  formData.append('offeredPrice', String(taskForm.offeredPrice))
  formData.append('requiredSkillId', taskForm.requiredSkillId)

  for (const image of images) {
    formData.append('images', image)
  }

  // KHÔNG set Content-Type thủ công — trình duyệt tự thêm boundary của multipart
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    signal,
    headers: authHeaders({ Accept: 'application/json' }),
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) {
    // ASP.NET [ApiController] trả ProblemDetails { title, errors: { field: [msg] } }
    let message = data.error || data.title || 'Không thể tạo công việc.'
    if (data.errors) {
      const details = Object.values(data.errors).flat().join(' ')
      if (details) message = details
    }
    throw new Error(message)
  }

  return data
}

