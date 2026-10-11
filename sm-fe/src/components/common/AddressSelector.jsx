import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'
import Button from './Button'
import GoogleMapModal from '../task-detail/GoogleMapModal'
import {
  fetchProvinces,
  fetchDistricts,
  fetchWards,
  searchAddressSuggestions,
} from '../../services/addressService'
import { geocodeAddress, reverseGeocode } from '../../services/mapService'

/**
 * AddressSelector Component
 * Reusable cascading address selector (Province -> District -> Ward -> Specific Address)
 * with map picker and address suggestions.
 *
 * @param {Object} props
 * @param {string} props.initialAddress - Initial full address string if available
 * @param {number} [props.initialLat] - Initial latitude
 * @param {number} [props.initialLng] - Initial longitude
 * @param {Function} props.onChange - Callback receiving { address, fullAddress, province, district, ward, specificAddress, lat, lng }
 */
export default function AddressSelector({
  initialAddress = '',
  initialLat = 21.0285,
  initialLng = 105.8542,
  savedUserAddress = '',
  savedUserCoords = null,
  onChange,
}) {
  const [provincesList, setProvincesList] = useState([])
  const [districtsList, setDistrictsList] = useState([])
  const [wardsList, setWardsList] = useState([])

  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [ward, setWard] = useState('')
  const [specificAddress, setSpecificAddress] = useState(initialAddress || '')

  const [coords, setCoords] = useState({
    lat: initialLat || 21.0285,
    lng: initialLng || 105.8542,
  })
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false)
  const [isGeocodedDetail, setIsGeocodedDetail] = useState(Boolean(initialAddress && initialLat && initialLng))

  const addressContainerRef = useRef(null)

  // 1. Tải danh sách Tỉnh/Thành ban đầu
  useEffect(() => {
    let isMounted = true
    async function load() {
      const data = await fetchProvinces()
      if (isMounted && data.length > 0) {
        setProvincesList(data)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  // Helper tính full address và thông báo ra ngoài
  const emitChange = (p = province, d = district, w = ward, s = specificAddress, c = coords) => {
    const parts = [s, w, d, p].filter(Boolean)
    const fullAddress = parts.join(', ')
    if (onChange) {
      onChange({
        fullAddress,
        address: fullAddress,
        province: p,
        district: d,
        ward: w,
        specificAddress: s,
        latitude: c.lat,
        longitude: c.lng,
      })
    }
  }

  // Chọn Tỉnh
  const handleProvinceChange = async (e) => {
    const selected = e.target.value
    setProvince(selected)
    setDistrict('')
    setWard('')
    setWardsList([])

    if (!selected) {
      setDistrictsList([])
      emitChange('', '', '', specificAddress, coords)
      return
    }

    const pObj = provincesList.find(
      (item) => item.full_name === selected || item.name === selected
    )
    if (!pObj) {
      setDistrictsList([])
      emitChange(selected, '', '', specificAddress, coords)
      return
    }

    let newCoords = coords
    if (pObj.latitude && pObj.longitude) {
      newCoords = { lat: parseFloat(pObj.latitude), lng: parseFloat(pObj.longitude) }
      setCoords(newCoords)
    }

    const data = await fetchDistricts(pObj.id)
    setDistrictsList(data)
    emitChange(selected, '', '', specificAddress, newCoords)
  }

  // Chọn Huyện
  const handleDistrictChange = async (e) => {
    const selected = e.target.value
    setDistrict(selected)
    setWard('')

    if (!selected) {
      setWardsList([])
      emitChange(province, '', '', specificAddress, coords)
      return
    }

    const dObj = districtsList.find(
      (item) => item.full_name === selected || item.name === selected
    )
    if (!dObj) {
      setWardsList([])
      emitChange(province, selected, '', specificAddress, coords)
      return
    }

    let newCoords = coords
    if (dObj.latitude && dObj.longitude) {
      newCoords = { lat: parseFloat(dObj.latitude), lng: parseFloat(dObj.longitude) }
      setCoords(newCoords)
    }

    const data = await fetchWards(dObj.id)
    setWardsList(data)
    emitChange(province, selected, '', specificAddress, newCoords)
  }

  // Chọn Xã
  const handleWardChange = (e) => {
    const selected = e.target.value
    setWard(selected)
    if (!selected) {
      emitChange(province, district, '', specificAddress, coords)
      return
    }

    const wObj = wardsList.find(
      (item) => item.full_name === selected || item.name === selected
    )
    let newCoords = coords
    if (wObj && wObj.latitude && wObj.longitude) {
      newCoords = { lat: parseFloat(wObj.latitude), lng: parseFloat(wObj.longitude) }
      setCoords(newCoords)
    }

    emitChange(province, district, selected, specificAddress, newCoords)
  }

  // Gợi ý địa chỉ từ Photon
  useEffect(() => {
    const trimmed = specificAddress.trim()
    if (trimmed.length < 2) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsSearchingAddress(true)
      try {
        const queryWithContext = [trimmed, district, province].filter(Boolean).join(', ')
        const suggestions = await searchAddressSuggestions(
          queryWithContext,
          coords,
          { signal: controller.signal, limit: 5 }
        )
        setAddressSuggestions(suggestions)
        if (suggestions.length > 0) {
          setIsAddressDropdownOpen(true)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Lỗi gợi ý địa chỉ:', err)
        }
      } finally {
        setIsSearchingAddress(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [specificAddress, district, province, coords])

  // Click ngoài đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addressContainerRef.current && !addressContainerRef.current.contains(e.target)) {
        setIsAddressDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper chuẩn hoá chuỗi để so sánh không dấu (ví dụ: "hà nội" == "hanoi" == "thành phố hà nội")
  const normalize = (str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^(thanh pho|tinh|quan|huyen|thi xa|phuong|xa|thi tran)\s+/gi, '')
      .replace(/[^a-z0-9]/g, '')

  // Hàm tính khoảng cách toạ độ gần nhất (Euclidean approximation)
  const findClosest = (list, targetLat, targetLng) => {
    let closest = null
    let minDist = Infinity
    for (const item of list) {
      if (item.latitude && item.longitude) {
        const dLat = parseFloat(item.latitude) - targetLat
        const dLng = parseFloat(item.longitude) - targetLng
        const dist = dLat * dLat + dLng * dLng
        if (dist < minDist) {
          minDist = dist
          closest = item
        }
      }
    }
    return closest
  }

  // Tự động tìm và chọn Tỉnh/Thành -> Quận/Huyện -> Phường/Xã dựa trên tên địa chỉ và toạ độ
  const autoSyncDistrictAndWard = async (addrText, targetCoords) => {
    if (!provincesList.length) return

    let geoCity = ''
    let geoDistrict = ''
    let geoWard = ''

    if (targetCoords?.lat && targetCoords?.lng) {
      try {
        const rev = await reverseGeocode(targetCoords.lat, targetCoords.lng)
        if (rev) {
          geoCity = rev.city || ''
          geoDistrict = rev.district || ''
          geoWard = rev.road || ''
        }
      } catch (e) {
        console.warn('Lỗi reverse geocode:', e)
      }
    }

    const fullSearchText = `${addrText || ''} ${geoCity} ${geoDistrict} ${geoWard}`.toLowerCase()
    const normSearchText = normalize(fullSearchText)

    // 1. Tìm Tỉnh / Thành phố
    let pFound = provincesList.find((p) => {
      const pNorm = normalize(p.name)
      return (
        normSearchText.includes(pNorm) ||
        fullSearchText.includes(p.name.toLowerCase()) ||
        (p.name_en && fullSearchText.includes(p.name_en.toLowerCase()))
      )
    })

    if (!pFound && targetCoords?.lat && targetCoords?.lng) {
      pFound = findClosest(provincesList, targetCoords.lat, targetCoords.lng)
    }

    if (!pFound) return

    const matchedProv = pFound.full_name
    setProvince(matchedProv)

    // 2. Tải và tìm Quận / Huyện
    try {
      const distData = await fetchDistricts(pFound.id)
      setDistrictsList(distData)

      let dFound = distData.find((d) => {
        const dNorm = normalize(d.name)
        return (
          normSearchText.includes(dNorm) ||
          fullSearchText.includes(d.name.toLowerCase()) ||
          (d.name_en && fullSearchText.includes(d.name_en.toLowerCase()))
        )
      })

      // Nếu tên text không chứa tên quận, tìm quận có toạ độ gần toạ độ GPS nhất
      if (!dFound && targetCoords?.lat && targetCoords?.lng) {
        dFound = findClosest(distData, targetCoords.lat, targetCoords.lng)
      }

      if (!dFound) {
        emitChange(matchedProv, '', '', addrText || specificAddress, targetCoords)
        return
      }

      const matchedDist = dFound.full_name
      setDistrict(matchedDist)

      // 3. Tải và tìm Phường / Xã
      const wardData = await fetchWards(dFound.id)
      setWardsList(wardData)

      let wFound = wardData.find((w) => {
        const wNorm = normalize(w.name)
        return (
          normSearchText.includes(wNorm) ||
          fullSearchText.includes(w.name.toLowerCase()) ||
          (w.name_en && fullSearchText.includes(w.name_en.toLowerCase()))
        )
      })

      if (!wFound && targetCoords?.lat && targetCoords?.lng) {
        wFound = findClosest(wardData, targetCoords.lat, targetCoords.lng)
      }

      const matchedWd = wFound ? wFound.full_name : ''
      if (matchedWd) setWard(matchedWd)

      emitChange(matchedProv, matchedDist, matchedWd, addrText || specificAddress, targetCoords)
    } catch (err) {
      console.warn('Lỗi tự động map địa chính:', err)
    }
  }

  // Chọn từ danh sách gợi ý ô input
  const handleSelectSuggestion = async (suggestion) => {
    const fullText = suggestion.displayName || suggestion.title
    setSpecificAddress(fullText)
    setIsAddressDropdownOpen(false)
    setIsGeocodedDetail(true)

    let newCoords = coords
    if (suggestion.lat && suggestion.lng) {
      newCoords = { lat: suggestion.lat, lng: suggestion.lng }
      setCoords(newCoords)
    }

    emitChange(province, district, ward, fullText, newCoords)
    await autoSyncDistrictAndWard(fullText, newCoords)
  }

  const triggerGeocodeSpecificAddress = async () => {
    const trimmed = specificAddress.trim()
    if (trimmed.length < 3) return
    const fullQuery = [trimmed, ward, district, province].filter(Boolean).join(', ')
    try {
      const geo = await geocodeAddress(fullQuery)
      if (geo && geo.lat && geo.lng) {
        const newCoords = { lat: geo.lat, lng: geo.lng }
        setCoords(newCoords)
        setIsGeocodedDetail(true)
        emitChange(province, district, ward, trimmed, newCoords)
        await autoSyncDistrictAndWard(trimmed, newCoords)
      }
    } catch {
      // Bỏ qua lỗi geocode
    }
  }

  // Kết quả chọn từ GoogleMapModal - Tự động đồng bộ dropdown Tỉnh, Huyện, Xã
  const handleMapConfirm = async (selectedAddress, pickedCoords) => {
    let addr = typeof selectedAddress === 'string' ? selectedAddress : selectedAddress?.address || ''
    const coordObj = pickedCoords || (typeof selectedAddress === 'object' ? selectedAddress : null)

    let newCoords = coords
    if (coordObj && coordObj.lat && coordObj.lng) {
      newCoords = { lat: coordObj.lat, lng: coordObj.lng }
      setCoords(newCoords)
      setIsGeocodedDetail(true)
    }

    if (addr) {
      setSpecificAddress(addr)
    }

    setIsMapModalOpen(false)
    emitChange(province, district, ward, addr || specificAddress, newCoords)
    await autoSyncDistrictAndWard(addr || specificAddress, newCoords)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="font-label-md text-sm font-bold text-on-surface flex items-center gap-1.5">
          <Icon name="location_on" size={18} className="text-primary" />
          <span>Khu vực &amp; Vị trí địa chỉ</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon="map"
          onClick={() => setIsMapModalOpen(true)}
          className="self-start sm:self-auto text-primary rounded-xl font-bold border-primary/30 hover:bg-primary-fixed/20 shadow-sm cursor-pointer"
        >
          Chọn trên bản đồ
        </Button>
      </div>

      {/* 3 Cascading Dropdowns: Tỉnh -> Huyện -> Xã */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tỉnh / Thành phố */}
        <div>
          <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
            Tỉnh / Thành phố
          </label>
          <div className="relative">
            <select
              value={province}
              onChange={handleProvinceChange}
              className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all cursor-pointer appearance-none"
            >
              <option value="">-- Chọn Tỉnh / Thành --</option>
              {provincesList.map((p) => (
                <option key={p.id} value={p.full_name}>
                  {p.full_name}
                </option>
              ))}
            </select>
            <Icon
              name="expand_more"
              size={20}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            />
          </div>
        </div>

        {/* Quận / Huyện */}
        <div>
          <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
            Quận / Huyện
          </label>
          <div className="relative">
            <select
              value={district}
              onChange={handleDistrictChange}
              disabled={!province || districtsList.length === 0}
              className="w-full px-3.5 py-2.5 bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-on-surface font-label-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all cursor-pointer appearance-none"
            >
              <option value="">-- Chọn Quận / Huyện --</option>
              {districtsList.map((d) => (
                <option key={d.id} value={d.full_name}>
                  {d.full_name}
                </option>
              ))}
            </select>
            <Icon
              name="expand_more"
              size={20}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            />
          </div>
        </div>

        {/* Phường / Xã */}
        <div>
          <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
            Phường / Xã
          </label>
          <div className="relative">
            <select
              value={ward}
              onChange={handleWardChange}
              disabled={!district || wardsList.length === 0}
              className="w-full px-3.5 py-2.5 bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-on-surface font-label-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all cursor-pointer appearance-none"
            >
              <option value="">-- Chọn Phường / Xã --</option>
              {wardsList.map((w) => (
                <option key={w.id} value={w.full_name}>
                  {w.full_name}
                </option>
              ))}
            </select>
            <Icon
              name="expand_more"
              size={20}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Số nhà, tên đường with Autocomplete */}
      <div className="relative" ref={addressContainerRef}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-outline uppercase tracking-wider">
            Số nhà, tên đường, toà nhà
          </label>
          <div className="flex items-center gap-2">
            {savedUserAddress && (
              <button
                type="button"
                onClick={() => {
                  setSpecificAddress(savedUserAddress)
                  let uCoords = coords
                  if (savedUserCoords && savedUserCoords.lat && savedUserCoords.lng) {
                    uCoords = savedUserCoords
                    setCoords(uCoords)
                    setIsGeocodedDetail(true)
                  }
                  autoSyncDistrictAndWard(savedUserAddress, uCoords)
                }}
                className="text-[11px] font-semibold text-primary bg-primary-fixed/30 hover:bg-primary-fixed/50 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Sử dụng địa chỉ đã lưu trong hồ sơ của bạn"
              >
                <Icon name="bookmark" size={13} />
                Dùng địa chỉ đã lưu
              </button>
            )}
            {isGeocodedDetail && (
              <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                <Icon name="check_circle" size={13} />
                Đã xác định toạ độ
              </span>
            )}
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Icon
              name="home"
              size={20}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
            />
            <input
              type="text"
              value={specificAddress}
              onChange={(e) => {
                const val = e.target.value
                setSpecificAddress(val)
                setIsGeocodedDetail(false)
                emitChange(province, district, ward, val, coords)
                if (val.trim().length >= 2) {
                  setIsAddressDropdownOpen(true)
                } else {
                  setAddressSuggestions([])
                  setIsAddressDropdownOpen(false)
                }
              }}
              onFocus={() => {
                if (addressSuggestions.length > 0) setIsAddressDropdownOpen(true)
              }}
              onBlur={() => triggerGeocodeSpecificAddress()}
              placeholder="VD: 123 Nguyễn Huệ, Chung cư Vincom..."
              className="w-full pl-11 pr-10 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all"
            />
            {isSearchingAddress && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline animate-spin">
                <Icon name="progress_activity" size={18} />
              </span>
            )}
          </div>
        </div>

        {/* Dropdown gợi ý */}
        {isAddressDropdownOpen && addressSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-variant/30 py-1.5 z-40 max-h-56 overflow-y-auto">
            {addressSuggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectSuggestion(s)}
                className="w-full px-4 py-2.5 text-left flex items-start gap-2.5 hover:bg-surface-container transition-colors cursor-pointer"
              >
                <Icon name="near_me" size={18} className="text-primary mt-0.5 shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-on-surface truncate">{s.title}</p>
                  {s.subtitle && (
                    <p className="text-xs text-on-surface-variant truncate">{s.subtitle}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Google Map */}
      <GoogleMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialCoords={coords}
        initialAddress={specificAddress}
        onConfirm={handleMapConfirm}
      />
    </div>
  )
}
