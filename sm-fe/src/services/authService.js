/**
 * Shared Authentication Service
 * Follows rule.md: Centralized API calls for auth (Login, Register, Me) & token storage
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5236/api'
const TOKEN_KEY = 'taskmate_jwt_token'

/**
 * Get JWT token from LocalStorage
 * @returns {string|null}
 */
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * Save JWT token to LocalStorage
 * @param {string} token
 */
export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // Ignore localStorage quota errors
  }
}

/**
 * Remove JWT token from LocalStorage
 */
export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore
  }
}

/**
 * Login API call
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ token: string, user: { id: string, name: string, email: string, role: string } }>}
 */
export async function loginApi({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    // Handle GlobalExceptionHandler error responses
    const message =
      data.error ||
      data.message ||
      data.title ||
      (data.errors && Object.values(data.errors).flat().join(' ')) ||
      'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
    throw new Error(message)
  }

  return data
}

/**
 * Register API call
 * @param {{ email: string, password: string, name: string, phoneNumber: string }} payload
 * @returns {Promise<{ message?: string, user: { id: string, email: string, name: string, phoneNumber: string, role: string } }>}
 */
export async function registerApi({ email, password, name, phoneNumber }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    const message =
      data.error ||
      data.message ||
      data.title ||
      (data.errors && Object.values(data.errors).flat().join(' ')) ||
      'Đăng ký tài khoản thất bại. Vui lòng thử lại.'
    throw new Error(message)
  }

  return data
}

/**
 * Verify JWT token and get current user profile via BE /api/auth/me
 * @param {string} token
 * @returns {Promise<{ id: string, email: string, name: string, phoneNumber?: string, role: string }>}
 */
export async function fetchCurrentUserApi(token) {
  if (!token) {
    throw new Error('Không có token xác thực.')
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Token không hợp lệ hoặc đã hết hạn.')
  }

  return await response.json()
}

/**
 * Update user personal information (name, phone, address, coordinates)
 * @param {string} token
 * @param {{ name?: string, phoneNumber?: string, address?: string, latitude?: number, longitude?: number }} payload
 */
export async function updateProfileApi(token, payload) {
  if (!token) throw new Error('Không có token xác thực.')

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    const message =
      data.error ||
      data.message ||
      data.title ||
      (data.errors && Object.values(data.errors).flat().join(' ')) ||
      'Cập nhật thông tin thất bại.'
    throw new Error(message)
  }

  return data
}

/**
 * Change user password
 * @param {string} token
 * @param {{ oldPassword: string, newPassword: string }} payload
 */
export async function changePasswordApi(token, payload) {
  if (!token) throw new Error('Không có token xác thực.')

  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    const message =
      data.error ||
      data.message ||
      data.title ||
      (data.errors && Object.values(data.errors).flat().join(' ')) ||
      'Đổi mật khẩu thất bại.'
    throw new Error(message)
  }

  return data
}

/**
 * Update Tasker CV / WorkerProfile (description, skillIds, serviceDistricts)
 * @param {string} token
 * @param {{ description?: string, skillIds?: string[], serviceDistricts?: Array<{ provinceCode: string, provinceName: string, districtCode: string, districtName: string }> }} payload
 */
export async function updateWorkerProfileApi(token, payload) {
  if (!token) throw new Error('Không có token xác thực.')

  const response = await fetch(`${API_BASE_URL}/auth/worker-profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    const message =
      data.error ||
      data.message ||
      data.title ||
      (data.errors && Object.values(data.errors).flat().join(' ')) ||
      'Cập nhật hồ sơ Tasker thất bại.'
    throw new Error(message)
  }

  if (data?.token) {
    setToken(data.token)
  }

  return data
}

/**
 * Upload ảnh đại diện người dùng lên Cloudinary và lưu vào CSDL (POST /api/auth/avatar)
 * @param {string} token
 * @param {File} file
 * @returns {Promise<{ id: string, name: string, email: string, avatarUrl: string }>}
 */
export async function uploadAvatarApi(token, file) {
  if (!token) throw new Error('Vui lòng đăng nhập.')
  if (!file) throw new Error('Vui lòng chọn file hình ảnh.')

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) {
    const message =
      data.error ||
      data.message ||
      data.title ||
      'Không thể cập nhật ảnh đại diện.'
    throw new Error(message)
  }

  return data
}

