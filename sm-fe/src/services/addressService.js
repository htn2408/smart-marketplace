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
      return data.features.map((f, idx) => {
        const p = f.properties || {}
        const title = p.name || p.street || trimmed
        const subtitle = [p.street, p.district, p.city || p.state]
          .filter(Boolean)
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
