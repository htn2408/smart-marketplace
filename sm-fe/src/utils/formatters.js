/**
 * Format numeric value to Vietnamese Dong currency string (e.g. 300.000₫ or 300.000 đ)
 * @param {number|string} amount
 * @param {string} [unit='₫']
 * @returns {string}
 */
export function formatCurrency(amount, unit = '₫') {
  if (amount == null || isNaN(Number(amount))) return `0${unit}`
  const num = Number(amount)
  return `${new Intl.NumberFormat('vi-VN').format(num)}${unit}`
}

/**
 * Format Date object or ISO string to standard Vietnamese date display (DD/MM/YYYY)
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return String(date)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/**
 * Format Date object or ISO string to standard Vietnamese date-time display (DD/MM/YYYY • HH:mm)
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return String(date)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} • ${hours}:${minutes}`
}

/**
 * Calculate hour slot string from start time and expected duration in minutes (e.g. 09:00 - 11:00)
 * @param {string|Date} startTime
 * @param {number} [expectedMinutes=60]
 * @returns {string}
 */
export function formatHourSlot(startTime, expectedMinutes = 60) {
  if (!startTime) return ''
  const start = new Date(startTime)
  if (isNaN(start.getTime())) return ''
  const end = new Date(start.getTime() + (Number(expectedMinutes) || 60) * 60000)
  const startH = String(start.getHours()).padStart(2, '0')
  const startM = String(start.getMinutes()).padStart(2, '0')
  const endH = String(end.getHours()).padStart(2, '0')
  const endM = String(end.getMinutes()).padStart(2, '0')
  return `${startH}:${startM} - ${endH}:${endM}`
}

/**
 * Map service / category name to Material Symbols icon
 * @param {string} categoryName
 * @returns {string}
 */
export function getCategoryIcon(categoryName) {
  if (!categoryName) return 'handyman'
  const cat = categoryName.toLowerCase()
  if (cat.includes('điện') && cat.includes('nước')) return 'plumbing'
  if (cat.includes('điện') || cat.includes('quạt') || cat.includes('đèn') || cat.includes('aptomat'))
    return 'electric_bolt'
  if (cat.includes('nước') || cat.includes('ống') || cat.includes('bồn')) return 'plumbing'
  if (
    cat.includes('lắp') ||
    cat.includes('nội thất') ||
    cat.includes('bàn') ||
    cat.includes('ghế') ||
    cat.includes('tủ')
  )
    return 'shelves'
  if (cat.includes('dọn') || cat.includes('vệ sinh')) return 'cleaning_services'
  if (cat.includes('chuyển') || cat.includes('vận chuyển') || cat.includes('bốc'))
    return 'local_shipping'
  if (cat.includes('sơn') || cat.includes('sửa')) return 'build'
  return 'handyman'
}

/**
 * Format chat timestamp to localized Vietnamese display (e.g. 10:45, Hôm qua, 21/10)
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatChatTimestamp(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return String(dateInput)

  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isYesterday) {
    return 'Hôm qua'
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

/**
 * Tính toán thời lượng chênh lệch giữa giờ bắt đầu và giờ kết thúc (HH:mm)
 * @param {string} start '08:30'
 * @param {string} end '10:30'
 * @returns {{ hours: number, minutes: number, totalMinutes: number }}
 */
export function calculateDuration(start, end) {
  if (!start || !end) return { hours: 0, minutes: 0, totalMinutes: 0 }
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let total = (eh * 60 + em) - (sh * 60 + sm)
  if (total < 0) total += 24 * 60 // xử lý trường hợp qua nửa đêm
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return { hours, minutes, totalMinutes: total }
}

/**
 * Calculate remaining time in minutes and seconds until expiration date
 * @param {string|Date} expiresAt
 * @returns {{ isExpired: boolean, minutes: number, seconds: number, formatted: string, totalSeconds: number }}
 */
export function calculateTimeRemaining(expiresAt) {
  if (!expiresAt) {
    return { isExpired: true, minutes: 0, seconds: 0, formatted: '00:00', totalSeconds: 0 }
  }
  const expiryTime = new Date(expiresAt).getTime()
  if (isNaN(expiryTime)) {
    return { isExpired: true, minutes: 0, seconds: 0, formatted: '00:00', totalSeconds: 0 }
  }
  const now = Date.now()
  const diffMs = expiryTime - now

  if (diffMs <= 0) {
    return { isExpired: true, minutes: 0, seconds: 0, formatted: '00:00', totalSeconds: 0 }
  }

  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const formatted =
    hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return {
    isExpired: false,
    hours,
    minutes,
    seconds,
    formatted,
    totalSeconds,
  }
}


