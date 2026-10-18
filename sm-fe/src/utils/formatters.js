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
