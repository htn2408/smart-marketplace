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
