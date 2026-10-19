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

