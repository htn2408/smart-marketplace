/**
 * Services and Categories Service for TaskMate
 * Connects directly to .NET Backend API (MySQL DB)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5236/api'

/**
 * Fetch all categories and their jobs from the backend
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Array>} List of category objects
 */
export async function fetchServiceCategories({ signal } = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/services/categories`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    })

    if (!res.ok) {
      throw new Error(`Máy chủ phản hồi mã lỗi: ${res.status}`)
    }

    const data = await res.json()
    return data
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.warn('[servicesService] Không thể tải dữ liệu từ Backend:', err)
    throw err
  }
}

/**
 * Fetch a single category by ID
 * @param {string} id
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 */
export async function fetchCategoryById(id, { signal } = {}) {
  const res = await fetch(`${API_BASE_URL}/services/categories/${id}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!res.ok) {
    throw new Error(`Lỗi khi tải chi tiết danh mục: ${res.status}`)
  }

  return await res.json()
}
