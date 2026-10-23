/**
 * Worker Service — giao tiếp với Backend GET /api/workers/{userId}
 * Hồ sơ public của Tasker (không chứa PII: email/phone đã bị loại khỏi response)
 */
import { getToken } from './authService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5236/api'

/**
 * Lấy hồ sơ public của một Tasker theo userId của họ
 * @param {string} userId UUID của user (bảng users), không phải workerProfileId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ userId, name, description, status, rating, completedTasks, memberSince, skills: [{id,name}], serviceDistricts: [{provinceCode,provinceName,districtCode,districtName}] }>}
 */
export async function fetchWorkerProfileById(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('userId là bắt buộc.')
  }

  const token = getToken()
  const response = await fetch(`${API_BASE_URL}/workers/${encodeURIComponent(userId)}`, {
    signal,
    headers: {
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || data.title || 'Không thể tải hồ sơ Tasker.')
  }

  return data
}

/**
 * Thêm hình ảnh công trình vào thư viện của Thợ (POST /api/workers/gallery)
 * @param {FormData|{ imageUrl?: string, title?: string, tag?: string, location?: string }} payload
 * @returns {Promise<{ id: string, imageUrl: string, title?: string, tag?: string, location?: string, createdAt: string }>}
 */
export async function addWorkerGalleryImageApi(payload) {
  const token = getToken()
  if (!token) throw new Error('Vui lòng đăng nhập.')

  let body
  const headers = {
    Authorization: `Bearer ${token}`,
  }

  if (payload instanceof FormData) {
    body = payload
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(payload)
  }

  const response = await fetch(`${API_BASE_URL}/workers/gallery`, {
    method: 'POST',
    headers,
    body,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || data.title || 'Không thể tải ảnh công trình lên.')
  }
  return data
}

/**
 * Xóa hình ảnh công trình khỏi thư viện của Thợ (DELETE /api/workers/gallery/{imageId})
 * @param {string} imageId
 * @returns {Promise<{ message: string }>}
 */
export async function deleteWorkerGalleryImageApi(imageId) {
  const token = getToken()
  if (!token) throw new Error('Vui lòng đăng nhập.')

  const response = await fetch(`${API_BASE_URL}/workers/gallery/${encodeURIComponent(imageId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || data.title || 'Không thể xóa ảnh công trình.')
  }
  return data
}
