/**
 * Map & Geocoding Service (Vietnam biased)
 * Provides Forward Geocoding (Address -> Coordinates) and Reverse Geocoding (Coordinates -> Address)
 * Using Photon Komoot API with multi-tier fallback (BigDataCloud, OSM Nominatim)
 */

const PHOTON_BASE_URL = 'https://photon.komoot.io/api'
const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse'
const BDC_REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

// Fallback curated locations in Vietnam if offline
const FALLBACK_LOCATIONS = [
  {
    displayName: 'Đảo Kim Cương, Phường Thạnh Mỹ Lợi, TP. Thủ Đức, TP. Hồ Chí Minh',
    title: 'Đảo Kim Cương',
    subtitle: 'Phường Thạnh Mỹ Lợi, TP. Thủ Đức, TP. Hồ Chí Minh',
    lat: 10.7675,
    lng: 106.7533,
    city: 'TP. Hồ Chí Minh',
    district: 'TP. Thủ Đức',
    road: 'Đường Số 1, Đảo Kim Cương',
  },
  {
    displayName: 'Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    title: 'Vinhomes Central Park',
    subtitle: '208 Nguyễn Hữu Cảnh, Bình Thạnh, TP. Hồ Chí Minh',
    lat: 10.7937,
    lng: 106.7214,
    city: 'TP. Hồ Chí Minh',
    district: 'Quận Bình Thạnh',
    road: '208 Nguyễn Hữu Cảnh',
  },
  {
    displayName: 'Chung cư Masteri Thảo Điền, 159 Xa Lộ Hà Nội, Phường Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
    title: 'Chung cư Masteri Thảo Điền',
    subtitle: '159 Xa Lộ Hà Nội, TP. Thủ Đức, TP. Hồ Chí Minh',
    lat: 10.8038,
    lng: 106.7416,
    city: 'TP. Hồ Chí Minh',
    district: 'TP. Thủ Đức',
    road: '159 Xa Lộ Hà Nội',
  },
  {
    displayName: '72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    title: '72 Lê Thánh Tôn',
    subtitle: 'Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    lat: 10.7779,
    lng: 106.7018,
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    road: '72 Lê Thánh Tôn',
  },
  {
    displayName: 'Khu đô thị Sala, 10 Mai Chí Thọ, Phường An Lợi Đông, TP. Thủ Đức, TP. Hồ Chí Minh',
    title: 'Khu đô thị Sala',
    subtitle: '10 Mai Chí Thọ, TP. Thủ Đức, TP. Hồ Chí Minh',
    lat: 10.7709,
    lng: 106.7219,
    city: 'TP. Hồ Chí Minh',
    district: 'TP. Thủ Đức',
    road: '10 Mai Chí Thọ',
  },
]

/**
 * Forward Geocoding: Find coordinates from address text query
 * Biased towards provided coordinates (e.g. current selected district/ward)
 * 
 * @param {string} query
 * @param {{ biasCoords?: { lat: number, lng: number }, signal?: AbortSignal, limit?: number }} [options]
 * @returns {Promise<Array<{ displayName: string, title: string, subtitle: string, lat: number, lng: number, road?: string, district?: string, city?: string }>>}
 */
export async function geocodeAddress(query, { biasCoords, signal, limit = 5 } = {}) {
  const trimmed = (query || '').trim()
  if (!trimmed || trimmed.length < 2) return []

  try {
    let url = `${PHOTON_BASE_URL}/?q=${encodeURIComponent(trimmed)}&limit=${limit}`
    if (biasCoords && biasCoords.lat && biasCoords.lng) {
      url += `&lat=${biasCoords.lat}&lon=${biasCoords.lng}`
    }

    const res = await fetch(url, { signal })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.features) && data.features.length > 0) {
        return data.features
          .filter((f) => {
            const cc = f.properties?.countrycode
            return !cc || cc.toUpperCase() === 'VN'
          })
          .map((f, idx) => {
            const p = f.properties || {}
            const rawStreet =
              p.street && !/^national route\b/i.test(p.street) ? p.street : ''
            const title =
              p.name ||
              (p.housenumber ? `${p.housenumber} ${rawStreet}`.trim() : '') ||
              rawStreet ||
              trimmed
            const subtitleParts = [
              rawStreet && rawStreet !== title ? rawStreet : '',
              p.quarter || p.suburb,
              p.district || p.city_district,
              p.city || p.state,
            ].filter(Boolean)
            const subtitle = subtitleParts.join(', ')
            const fullDisplayName = [title, subtitle].filter(Boolean).join(', ')

            return {
              id: `${p.osm_id || idx}-${f.geometry.coordinates.join('-')}`,
              displayName: fullDisplayName,
              title,
              subtitle,
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
              road: rawStreet,
              district: p.district || p.city_district || '',
              city: p.city || p.state || '',
            }
          })
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.warn('Geocoding photon error, falling back:', err.message)
  }

  // Fallback match in curated locations
  const lower = trimmed.toLowerCase()
  const matched = FALLBACK_LOCATIONS.filter((loc) =>
    loc.displayName.toLowerCase().includes(lower)
  )

  if (matched.length > 0) {
    return matched
  }

  // If bias coordinates are available, return them with the queried label
  if (biasCoords && biasCoords.lat && biasCoords.lng) {
    return [
      {
        displayName: `${trimmed}`,
        title: trimmed,
        subtitle: 'Khu vực đã chọn',
        lat: biasCoords.lat,
        lng: biasCoords.lng,
      },
    ]
  }

  return []
}

/**
 * Reverse Geocoding: Get human-readable address from coordinates
 * 
 * @param {number} lat
 * @param {number} lng
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ displayName: string, road: string, district: string, city: string, lat: number, lng: number }>}
 */
export async function reverseGeocode(lat, lng, { signal } = {}) {
  // Tier 1: Try Photon Reverse for detailed street/house level
  try {
    const res = await fetch(`${PHOTON_REVERSE_URL}?lat=${lat}&lon=${lng}`, { signal })
    if (res.ok) {
      const data = await res.json()
      const p = data.features?.[0]?.properties
      if (p) {
        const rawStreet =
          p.street && !/^national route\b/i.test(p.street) ? p.street : ''
        const parts = [
          p.name,
          p.housenumber ? `${p.housenumber} ${rawStreet}`.trim() : rawStreet,
          p.quarter || p.suburb,
          p.district || p.city_district,
          p.city || p.state,
        ].filter(Boolean)

        const displayName = parts.join(', ') || `Toạ độ (${lat.toFixed(5)}, ${lng.toFixed(5)})`
        return {
          displayName,
          road: rawStreet || p.name || '',
          district: p.district || p.city_district || '',
          city: p.city || p.state || '',
          lat,
          lng,
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err
    // Continue to next tier
  }

  // Tier 2: Try BigDataCloud Reverse Geocoding
  try {
    const bdcUrl = `${BDC_REVERSE_URL}?latitude=${lat}&longitude=${lng}&localityLanguage=vi`
    const res = await fetch(bdcUrl, { signal })
    if (res.ok) {
      const d = await res.json()
      const parts = [d.locality, d.principalSubdivision].filter(Boolean)
      const displayName = parts.length > 0
        ? `Khu vực ${parts.join(', ')}`
        : `Toạ độ (${lat.toFixed(5)}, ${lng.toFixed(5)})`

      return {
        displayName,
        road: '',
        district: d.locality || '',
        city: d.principalSubdivision || '',
        lat,
        lng,
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err
  }

  // Tier 3: Fallback coordinates text
  return {
    displayName: `Toạ độ (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    road: '',
    district: '',
    city: '',
    lat,
    lng,
  }
}

// Backward compatibility aliases
export const searchAddressOSM = geocodeAddress
export const reverseGeocodeOSM = reverseGeocode
