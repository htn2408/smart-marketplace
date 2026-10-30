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

/**
 * Validate TaskDetail form fields (6 steps)
 * Matches UI requirements and Backend CreateTaskRequest constraints
 * @param {{
 *   taskCategory?: string,
 *   description?: string,
 *   province?: string,
 *   district?: string,
 *   ward?: string,
 *   specificAddress?: string,
 *   amount?: number,
 *   selectedDate?: string,
 *   customDate?: string,
 *   startTime?: string,
 *   endTime?: string
 * }} fields
 * @returns {{ isValid: boolean, errors: Record<string, string>, firstErrorSection: string | null }}
 */
export function validateTaskDetailForm({
  taskCategory,
  description,
  province,
  district,
  ward,
  specificAddress,
  amount,
  selectedDate,
  customDate,
  startTime,
  endTime,
}) {
  const errors = {}
  let firstErrorSection = null

  const markSection = (sectionKey) => {
    if (!firstErrorSection) {
      firstErrorSection = sectionKey
    }
  }

  // Bước 1: Tên công việc (Bắt buộc, 3 - 255 ký tự)
  const trimmedTitle = (taskCategory || '').trim()
  if (!trimmedTitle) {
    errors.taskCategory = 'Vui lòng nhập tên công việc bạn cần hỗ trợ.'
    markSection('step-1')
  } else if (trimmedTitle.length < 3) {
    errors.taskCategory = 'Tên công việc cần có ít nhất 3 ký tự.'
    markSection('step-1')
  } else if (trimmedTitle.length > 255) {
    errors.taskCategory = 'Tên công việc không được vượt quá 255 ký tự.'
    markSection('step-1')
  }

  // Bước 2: Mô tả chi tiết (Bắt buộc, 10 - 1000 ký tự)
  const trimmedDesc = (description || '').trim()
  if (!trimmedDesc) {
    errors.description = 'Vui lòng nhập mô tả cụ thể hiện trạng và yêu cầu công việc.'
    markSection('step-2')
  } else if (trimmedDesc.length < 10) {
    errors.description = 'Mô tả chi tiết cần có ít nhất 10 ký tự để Tasker nắm rõ yêu cầu.'
    markSection('step-2')
  } else if (trimmedDesc.length > 1000) {
    errors.description = 'Mô tả chi tiết không được vượt quá 1000 ký tự.'
    markSection('step-2')
  }

  // Bước 4: Địa điểm thực hiện (Tỉnh/Thành, Quận/Huyện, Phường/Xã, Số nhà/Tên đường)
  const trimmedSpecific = (specificAddress || '').trim()
  const addressSegments = trimmedSpecific
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const hasCompleteInlineAddress = addressSegments.length >= 3 && trimmedSpecific.length >= 12

  if (!hasCompleteInlineAddress) {
    if (!province || !province.trim()) {
      errors.province = 'Vui lòng chọn Tỉnh / Thành phố.'
      markSection('step-4')
    }
    if (!district || !district.trim()) {
      errors.district = 'Vui lòng chọn Quận / Huyện.'
      markSection('step-4')
    }
    if (!ward || !ward.trim()) {
      errors.ward = 'Vui lòng chọn Phường / Xã.'
      markSection('step-4')
    }
  }

  if (!trimmedSpecific) {
    errors.specificAddress = 'Vui lòng nhập số nhà, tên đường hoặc toà nhà / căn hộ.'
    markSection('step-4')
  } else if (trimmedSpecific.length > 500) {
    errors.specificAddress = 'Địa chỉ cụ thể không được vượt quá 500 ký tự.'
    markSection('step-4')
  }

  // Bước 5: Thù lao đề xuất (100.000đ - 2.000.000đ)
  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount) || numericAmount < 100000 || numericAmount > 2000000) {
    errors.amount = 'Mức thù lao đề xuất phải nằm trong khoảng từ 100.000₫ đến 2.000.000₫.'
    markSection('step-5')
  }

  // Bước 6: Lịch hẹn & Thời lượng
  const now = new Date()
  const localTodayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  if (selectedDate === 'other') {
    if (!customDate || !customDate.trim()) {
      errors.customDate = 'Vui lòng chọn ngày làm việc cụ thể.'
      markSection('step-6')
    } else if (customDate < localTodayIso) {
      errors.customDate = 'Ngày làm việc không được nằm trong quá khứ.'
      markSection('step-6')
    }
  }

  if (!startTime || !endTime) {
    errors.scheduleTime = 'Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc.'
    markSection('step-6')
  } else {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const startMinutes = sh * 60 + sm
    const endMinutes = eh * 60 + em
    const isTodaySelected =
      selectedDate === 'today' || (selectedDate === 'other' && customDate === localTodayIso)

    if (isTodaySelected) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      if (startMinutes <= currentMinutes) {
        errors.startTime = 'Giờ bắt đầu trong hôm nay phải sau thời điểm hiện tại.'
        markSection('step-6')
      }
    }

    const diffMinutes = endMinutes - startMinutes
    if (diffMinutes <= 0) {
      errors.scheduleTime = 'Giờ kết thúc phải lớn hơn giờ bắt đầu trong cùng ngày.'
      markSection('step-6')
    } else if (diffMinutes < 30) {
      errors.scheduleTime = 'Thời lượng công việc tối thiểu là 30 phút.'
      markSection('step-6')
    } else if (diffMinutes > 720) {
      errors.scheduleTime = 'Thời lượng công việc không được vượt quá 12 giờ (720 phút).'
      markSection('step-6')
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstErrorSection,
  }
}

