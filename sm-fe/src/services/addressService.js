/**
 * Address & Administrative Divisions Service (Vietnam)
 * Shared service for cascading provinces, districts, wards, and geocoding suggestions
 */

const ESGOO_BASE_URL = 'https://esgoo.net/api-tinhthanh'
const PHOTON_BASE_URL = 'https://photon.komoot.io/api'

/**
 * Fetch all provinces/cities in Vietnam
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array>}
 */
export async function fetchProvinces(signal) {
  try {
    const res = await fetch(`${ESGOO_BASE_URL}/1/0.htm`, { signal })
    const json = await res.json()
    if (json.error === 0 && Array.isArray(json.data)) {
      return json.data
    }
    return []
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Lỗi khi tải danh sách Tỉnh/Thành:', err)
    }
    return []
  }
}

/**
 * Fetch districts by province ID
 * @param {string|number} provinceId
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array>}
 */
export async function fetchDistricts(provinceId, signal) {
  if (!provinceId) return []
  try {
    const res = await fetch(`${ESGOO_BASE_URL}/2/${provinceId}.htm`, { signal })
    const json = await res.json()
    if (json.error === 0 && Array.isArray(json.data)) {
      return json.data
    }
    return []
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Lỗi khi tải danh sách Quận/Huyện:', err)
    }
    return []
  }
}

/**
 * Fetch wards by district ID
 * @param {string|number} districtId
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array>}
 */
export async function fetchWards(districtId, signal) {
  if (!districtId) return []
  try {
    const res = await fetch(`${ESGOO_BASE_URL}/3/${districtId}.htm`, { signal })
    const json = await res.json()
    if (json.error === 0 && Array.isArray(json.data)) {
      return json.data
    }
    return []
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Lỗi khi tải danh sách Phường/Xã:', err)
    }
    return []
  }
}

/**
 * Search autocomplete address suggestions biased towards current coordinates
 * @param {string} query
 * @param {{ lat: number, lng: number }} [coords]
 * @param {{ signal?: AbortSignal, limit?: number }} [options]
 * @returns {Promise<Array>}
 */
export async function searchAddressSuggestions(query, coords = { lat: 21.0285, lng: 105.8542 }, options = {}) {
  const trimmed = (query || '').trim()
  if (trimmed.length < 2) return []

  try {
    const limit = options.limit || 5
    const url = `${PHOTON_BASE_URL}/?q=${encodeURIComponent(
      trimmed
    )}&lat=${coords.lat}&lon=${coords.lng}&limit=${limit}`

    const res = await fetch(url, { signal: options.signal })
    const data = await res.json()

    if (Array.isArray(data.features) && data.features.length > 0) {
      return data.features
        .filter((f) => {
          const cc = f.properties?.countrycode
          return !cc || cc.toUpperCase() === 'VN'
        })
        .map((f, idx) => {
          const p = f.properties || {}
          const title = p.name || p.street || trimmed
          const subtitle = [p.street !== title ? p.street : '', p.district, p.city || p.state]
            .filter(Boolean)
            .filter((part) => !/^national route\b/i.test(part))
            .join(', ')

          return {
            id: `${p.osm_id || idx}-${f.geometry.coordinates.join('-')}`,
            title,
            subtitle,
            fullText: [title, subtitle].filter(Boolean).join(', '),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          }
        })
    }
    return []
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Lỗi tìm kiếm gợi ý địa chỉ:', err)
    }
    return []
  }
}

/**
 * Parse a comma-separated Vietnamese full address into structured components:
 * { specificAddress, ward, district, province }
 * Only extracts province/district/ward if they match Vietnamese administrative patterns
 * (never misclassifies "Thôn 1" or "National Route 26" as Province/District).
 * @param {string} rawAddress
 * @returns {{ specificAddress: string, ward: string, district: string, province: string }}
 */
export function parseVietnameseAddress(rawAddress) {
  if (!rawAddress || typeof rawAddress !== 'string') {
    return { specificAddress: '', ward: '', district: '', province: '' }
  }

  const parts = rawAddress
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^(việt nam|vietnam|\d{5,6})$/i.test(s))

  const provinceRegex =
    /^(thành phố|tỉnh|tp\.?\s+|hà nội|hồ chí minh|đà nẵng|hải phòng|cần thơ|huế)/i
  const districtRegex = /^(quận|huyện|thị xã|thành phố|tp\.?\s+)/i
  const wardRegex = /^(phường|xã|thị trấn)\b/i

  let province = ''
  let district = ''
  let ward = ''
  const usedIndices = new Set()

  // Find province from right to left
  for (let i = parts.length - 1; i >= 0; i--) {
    if (provinceRegex.test(parts[i])) {
      province = parts[i]
      usedIndices.add(i)
      break
    }
  }

  // Find district from right to left (excluding used province index)
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!usedIndices.has(i) && districtRegex.test(parts[i])) {
      district = parts[i]
      usedIndices.add(i)
      break
    }
  }

  // Find ward from right to left
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!usedIndices.has(i) && wardRegex.test(parts[i])) {
      ward = parts[i]
      usedIndices.add(i)
      break
    }
  }

  const specificParts = parts.filter((_, idx) => !usedIndices.has(idx))
  const specificAddress =
    specificParts.length > 0 ? specificParts.join(', ') : rawAddress.trim()

  return { specificAddress, ward, district, province }
}

/**
 * Normalize Vietnamese administrative name by stripping common prefixes for comparison
 * @param {string} str
 * @returns {string}
 */
function stripAdminPrefix(str) {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/^(thành phố|tỉnh|tp\.?|quận|huyện|thị xã|phường|xã|thị trấn)\s+/i, '')
    .trim()
}

/**
 * Match a candidate text (e.g., "Thành phố Hà Nội" or "Hà Nội") against an esgoo administrative list
 * @param {Array<{ id: string|number, name: string, full_name: string }>} list
 * @param {string} candidateText
 * @returns {{ id: string|number, name: string, full_name: string, latitude?: string, longitude?: string } | null}
 */
export function matchAdministrativeItem(list, candidateText) {
  if (!Array.isArray(list) || list.length === 0 || !candidateText) return null
  const norm = candidateText.trim().toLowerCase()
  const strippedCandidate = stripAdminPrefix(norm)
  if (!norm || !strippedCandidate) return null

  return (
    list.find(
      (item) =>
        item.full_name?.toLowerCase() === norm ||
        item.name?.toLowerCase() === norm ||
        stripAdminPrefix(item.full_name) === strippedCandidate
    ) || null
  )
}


