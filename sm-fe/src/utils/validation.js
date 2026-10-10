/**
 * Shared Validation Utilities
 * Follows rule.md: Pure validation functions for email, password, phone, name, etc.
 */

/**
 * Check if email is valid RFC standard format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Check if password satisfies minimum length requirement (>= 6 chars)
 * @param {string} password
 * @param {number} [minLength=6]
 * @returns {boolean}
 */
export function isValidPassword(password, minLength = 6) {
  if (!password || typeof password !== 'string') return false
  return password.length >= minLength
}

/**
 * Check if Vietnamese phone number has 9-11 digits (matches Backend DataAnnotations)
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false
  const phoneRegex = /^[0-9]{9,11}$/
  return phoneRegex.test(phone.trim())
}

/**
 * Check if name is non-empty and reasonably sized (1 - 100 characters)
 * @param {string} name
 * @returns {boolean}
 */
export function isValidName(name) {
  if (!name || typeof name !== 'string') return false
  const trimmed = name.trim()
  return trimmed.length >= 2 && trimmed.length <= 100
}

/**
 * Validate Login form fields
 * @param {{ email?: string, password?: string }} fields
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateLoginForm({ email, password }) {
  const errors = {}

  if (!email || !email.trim()) {
    errors.email = 'Vui lòng nhập email đăng nhập.'
  } else if (!isValidEmail(email)) {
    errors.email = 'Email không hợp lệ (ví dụ: ban@domain.com).'
  }

  if (!password) {
    errors.password = 'Vui lòng nhập mật khẩu.'
  } else if (!isValidPassword(password, 6)) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate Registration form fields
 * @param {{ email?: string, password?: string, name?: string, phoneNumber?: string }} fields
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateRegisterForm({ email, password, name, phoneNumber }) {
  const errors = {}

  if (!name || !name.trim()) {
    errors.name = 'Vui lòng nhập họ và tên.'
  } else if (!isValidName(name)) {
    errors.name = 'Họ và tên cần có từ 2 đến 100 ký tự.'
  }

  if (!email || !email.trim()) {
    errors.email = 'Vui lòng nhập địa chỉ email.'
  } else if (!isValidEmail(email)) {
    errors.email = 'Email không đúng định dạng (ví dụ: user@example.com).'
  }

  if (!phoneNumber || !phoneNumber.trim()) {
    errors.phoneNumber = 'Vui lòng nhập số điện thoại.'
  } else if (!isValidPhone(phoneNumber)) {
    errors.phoneNumber = 'Số điện thoại phải từ 9 đến 11 chữ số.'
  }

  if (!password) {
    errors.password = 'Vui lòng nhập mật khẩu.'
  } else if (!isValidPassword(password, 6)) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
