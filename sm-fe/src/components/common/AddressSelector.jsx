import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'
import Button from './Button'
import GoogleMapModal from '../task-detail/GoogleMapModal'
import MapPicker from '../task-detail/MapPicker'
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
 * with map picker, address suggestions, and automatic reverse-geocoding / GPS nearest-match
 * synchronization back to the 3 dropdowns.
 */
export default function AddressSelector({
  initialAddress = '',
  initialLat = 21.0285,
  initialLng = 105.8542,
  savedUserAddress = '',
  savedUserCoords = null,
  onChange,
  errors = {},
  onClearError,
  required = false,
  stepLabel = '',
  headerTitle = '',
  headerSubtitle = '',
  showDerivedPreview = false,
  showLiveMap = false,
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
  const [isGeocodedDetail, setIsGeocodedDetail] = useState(
    Boolean(initialAddress && initialLat && initialLng)
  )

  const addressContainerRef = useRef(null)

  // Helper chuẩn hoá chuỗi để so sánh không dấu (ví dụ: "hà nội" == "hanoi" == "thành phố hà nội")
  const normalize = (str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/^(thanh pho|tinh|tp\.?|quan|huyen|thi xa|phuong|xa|thi tran)\s+/gi, '')
      .replace(/[^a-z0-9]/g, '')

  // Tách bỏ phần Phường/Quận/Tỉnh khỏi chuỗi địa chỉ chi tiết để tránh bị lặp 2 lần
  const stripAdminPartsFromSpecific = (rawSpecific, provObj, distObj, wardObj) => {
    if (!rawSpecific) return ''
    const segments = rawSpecific
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !/^(việt nam|vietnam|\d{5,6})$/i.test(s))

    if (segments.length <= 1) return rawSpecific.trim()

    const adminNorms = [
      provObj?.name && normalize(provObj.name),
      provObj?.full_name && normalize(provObj.full_name),
      distObj?.name && normalize(distObj.name),
      distObj?.full_name && normalize(distObj.full_name),
      wardObj?.name && normalize(wardObj.name),
      wardObj?.full_name && normalize(wardObj.full_name),
    ].filter(Boolean)

    const remaining = segments.filter((seg, idx) => {
      // Giữ lại phần tử đầu tiên (số nhà/tên đường/tòa nhà)
      if (idx === 0) return true
      const segNorm = normalize(seg)
      if (!segNorm) return false
      return !adminNorms.some((aNorm) => aNorm === segNorm)
    })

    return remaining.join(', ') || segments[0]
  }

  // Helper tính full address và thông báo ra ngoài
  const emitChange = (
    p = province,
    d = district,
    w = ward,
    s = specificAddress,
    c = coords
  ) => {
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
  const autoSyncDistrictAndWard = async (
    addrText,
    targetCoords,
    loadedProvinces = provincesList
  ) => {
    if (!loadedProvinces || !loadedProvinces.length) return

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
    let pFound = loadedProvinces.find((p) => {
      const pNorm = normalize(p.name)
      return (
        normSearchText.includes(pNorm) ||
        fullSearchText.includes(p.name.toLowerCase()) ||
        (p.name_en && fullSearchText.includes(p.name_en.toLowerCase()))
      )
    })

    if (!pFound && targetCoords?.lat && targetCoords?.lng) {
      pFound = findClosest(loadedProvinces, targetCoords.lat, targetCoords.lng)
    }

    if (!pFound) return

    const matchedProv = pFound.full_name
    setProvince(matchedProv)
    onClearError?.('province')

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
        const cleanedOnlyProv = stripAdminPartsFromSpecific(
          addrText || specificAddress,
          pFound,
          null,
          null
        )
        setSpecificAddress(cleanedOnlyProv)
        emitChange(matchedProv, '', '', cleanedOnlyProv, targetCoords || coords)
        return
      }

      const matchedDist = dFound.full_name
      setDistrict(matchedDist)
      onClearError?.('district')

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
      if (matchedWd) {
        setWard(matchedWd)
        onClearError?.('ward')
      }

      const cleanedSpec = stripAdminPartsFromSpecific(
        addrText || specificAddress,
        pFound,
        dFound,
        wFound
      )
      setSpecificAddress(cleanedSpec)
      onClearError?.('specificAddress')

      emitChange(
        matchedProv,
        matchedDist,
        matchedWd,
        cleanedSpec,
        targetCoords || coords
      )
    } catch (err) {
      console.warn('Lỗi tự động map địa chính:', err)
    }
  }

  // 1. Tải danh sách Tỉnh/Thành ban đầu và tự động map địa chỉ khởi tạo (nếu có)
  useEffect(() => {
    let isMounted = true
    async function load() {
      const data = await fetchProvinces()
      if (isMounted && data.length > 0) {
        setProvincesList(data)
        if (initialAddress) {
          await autoSyncDistrictAndWard(
            initialAddress,
            { lat: initialLat || 21.0285, lng: initialLng || 105.8542 },
            data
          )
        }
      }
    }
    load()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Chọn Tỉnh
  const handleProvinceChange = async (e) => {
    const selected = e.target.value
    setProvince(selected)
    setDistrict('')
    setWard('')
    setWardsList([])
    onClearError?.('province')

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
    onClearError?.('district')

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
    onClearError?.('ward')
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
        let suggestions = await searchAddressSuggestions(
          queryWithContext,
          coords,
          { signal: controller.signal, limit: 5 }
        )
        if ((!suggestions || suggestions.length === 0) && queryWithContext !== trimmed) {
          suggestions = await searchAddressSuggestions(
            trimmed,
            coords,
            { signal: controller.signal, limit: 5 }
          )
        }
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
    }, 350)

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

  // Chọn từ danh sách gợi ý ô input -> Tự động đồng bộ luôn 3 dropdown Tỉnh/Quận/Phường
  const handleSelectSuggestion = async (suggestion) => {
    const fullText = suggestion.fullText || suggestion.displayName || suggestion.title
    setSpecificAddress(suggestion.title || fullText)
    setIsAddressDropdownOpen(false)
    setIsGeocodedDetail(true)
    onClearError?.('specificAddress')

    let newCoords = coords
    if (suggestion.lat && suggestion.lng) {
      newCoords = { lat: suggestion.lat, lng: suggestion.lng }
      setCoords(newCoords)
    }

    emitChange(province, district, ward, suggestion.title || fullText, newCoords)
    await autoSyncDistrictAndWard(fullText, newCoords)
  }

  const triggerGeocodeSpecificAddress = async (addrOverride) => {
    const trimmed = (addrOverride !== undefined ? addrOverride : specificAddress).trim()
    if (trimmed.length < 2) return
    const fullQuery = [trimmed, ward, district, province].filter(Boolean).join(', ')
    setIsSearchingAddress(true)
    try {
      const results = await geocodeAddress(fullQuery, {
        biasCoords: coords,
        limit: 3,
      })
      const geo = Array.isArray(results) ? results[0] : results
      if (geo && geo.lat && geo.lng) {
        const newCoords = { lat: geo.lat, lng: geo.lng }
        setCoords(newCoords)
        setIsGeocodedDetail(true)
        emitChange(province, district, ward, trimmed, newCoords)
        await autoSyncDistrictAndWard(geo.displayName || fullQuery, newCoords)
      }
    } catch {
      // Bỏ qua lỗi geocode
    } finally {
      setIsSearchingAddress(false)
    }
  }

  // Kết quả chọn từ GoogleMapModal -> Tự động đồng bộ dropdown Tỉnh, Huyện, Xã
  const handleMapConfirm = async (selectedAddress, pickedCoords) => {
    const addr =
      typeof selectedAddress === 'string'
        ? selectedAddress
        : selectedAddress?.address || ''
    const coordObj =
      pickedCoords || (typeof selectedAddress === 'object' ? selectedAddress : null)

    let newCoords = coords
    if (coordObj && coordObj.lat && coordObj.lng) {
      newCoords = { lat: coordObj.lat, lng: coordObj.lng }
      setCoords(newCoords)
      setIsGeocodedDetail(true)
    }

    if (addr) {
      setSpecificAddress(addr)
      onClearError?.('specificAddress')
    }

    setIsMapModalOpen(false)
    emitChange(province, district, ward, addr || specificAddress, newCoords)
    await autoSyncDistrictAndWard(addr || specificAddress, newCoords)
  }

  // Khi người dùng kéo thả ghim trực tiếp trên bản đồ nhỏ
  const handleLiveMapPinMove = async (loc) => {
    if (loc?.lat && loc?.lng) {
      const newCoords = { lat: loc.lat, lng: loc.lng }
      setCoords(newCoords)
      setIsGeocodedDetail(true)
      await autoSyncDistrictAndWard(specificAddress, newCoords)
    }
  }

  const derivedFullAddress = [specificAddress, ward, district, province]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {headerTitle ? (
          <div>
            {stepLabel && (
              <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                {stepLabel}
              </span>
            )}
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {headerTitle}
            </h2>
            {headerSubtitle && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {headerSubtitle}
              </p>
            )}
          </div>
        ) : (
          <span className="font-label-md text-sm font-bold text-on-surface flex items-center gap-1.5">
            <Icon name="location_on" size={18} className="text-primary" />
            <span>Khu vực &amp; Vị trí địa chỉ</span>
          </span>
        )}
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
          <label
            htmlFor="province-select"
            className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5"
          >
            Tỉnh / Thành phố {required && <span className="text-error">*</span>}
          </label>
          <div className="relative">
            <select
              id="province-select"
              value={province}
              onChange={handleProvinceChange}
              className={`w-full px-3.5 py-3 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all cursor-pointer appearance-none ${
                errors.province
                  ? 'border-error ring-1 ring-error/20 focus:border-error'
                  : 'border-surface-variant/40 focus:border-primary'
              }`}
            >
              <option value="">-- Chọn Tỉnh / Thành phố --</option>
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
          {errors.province && (
            <p className="mt-1 flex items-center gap-1 text-error font-body-sm text-xs font-semibold">
              <Icon name="error" size={14} />
              <span>{errors.province}</span>
            </p>
          )}
        </div>

        {/* Quận / Huyện */}
        <div>
          <label
            htmlFor="district-select"
            className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5"
          >
            Quận / Huyện {required && <span className="text-error">*</span>}
          </label>
          <div className="relative">
            <select
              id="district-select"
              value={district}
              onChange={handleDistrictChange}
              disabled={!province || districtsList.length === 0}
              className={`w-full px-3.5 py-3 bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all cursor-pointer appearance-none ${
                errors.district
                  ? 'border-error ring-1 ring-error/20 focus:border-error'
                  : 'border-surface-variant/40 focus:border-primary'
              }`}
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
          {errors.district && (
            <p className="mt-1 flex items-center gap-1 text-error font-body-sm text-xs font-semibold">
              <Icon name="error" size={14} />
              <span>{errors.district}</span>
            </p>
          )}
        </div>

        {/* Phường / Xã */}
        <div>
          <label
            htmlFor="ward-select"
            className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5"
          >
            Phường / Xã {required && <span className="text-error">*</span>}
          </label>
          <div className="relative">
            <select
              id="ward-select"
              value={ward}
              onChange={handleWardChange}
              disabled={!district || wardsList.length === 0}
              className={`w-full px-3.5 py-3 bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all cursor-pointer appearance-none ${
                errors.ward
                  ? 'border-error ring-1 ring-error/20 focus:border-error'
                  : 'border-surface-variant/40 focus:border-primary'
              }`}
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
          {errors.ward && (
            <p className="mt-1 flex items-center gap-1 text-error font-body-sm text-xs font-semibold">
              <Icon name="error" size={14} />
              <span>{errors.ward}</span>
            </p>
          )}
        </div>
      </div>

      {/* Số nhà, tên đường with Autocomplete */}
      <div className="relative" ref={addressContainerRef}>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="specific-address-input"
            className="block text-xs font-bold text-outline uppercase tracking-wider"
          >
            Số nhà, tên đường, toà nhà / căn hộ{' '}
            {required && <span className="text-error">*</span>}
          </label>
          <div className="flex items-center gap-2">
            {savedUserAddress && (
              <button
                type="button"
                onClick={() => {
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
                Dùng địa chỉ đã lưu của bạn
              </button>
            )}
            {isGeocodedDetail && (
              <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                <Icon name="check_circle" size={13} />
                Đã ghim chi tiết
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
              id="specific-address-input"
              type="text"
              value={specificAddress}
              onChange={(e) => {
                const val = e.target.value
                setSpecificAddress(val)
                onClearError?.('specificAddress')
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setIsAddressDropdownOpen(false)
                  triggerGeocodeSpecificAddress()
                }
              }}
              placeholder="Ví dụ: Tiểu học Vĩnh Hưng, 53 Lĩnh Nam, Toà nhà Park 12..."
              className={`w-full pl-11 pr-10 py-3 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border focus:bg-surface-container-lowest transition-all ${
                errors.specificAddress
                  ? 'border-error ring-1 ring-error/20 focus:border-error'
                  : 'border-surface-variant/40 focus:border-primary'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isSearchingAddress && (
                <span className="text-primary animate-spin">
                  <Icon name="progress_activity" size={18} />
                </span>
              )}
              {specificAddress && !isSearchingAddress && (
                <button
                  type="button"
                  onClick={() => {
                    setSpecificAddress('')
                    setAddressSuggestions([])
                    setIsAddressDropdownOpen(false)
                    setIsGeocodedDetail(false)
                    emitChange(province, district, ward, '', coords)
                  }}
                  className="text-outline hover:text-on-surface p-1 transition-colors cursor-pointer"
                  title="Xoá"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => triggerGeocodeSpecificAddress()}
            disabled={!specificAddress.trim() || isSearchingAddress}
            className="px-3.5 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl border border-primary/20 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            title="Định vị ngay địa chỉ này trên bản đồ"
          >
            <Icon name="my_location" size={16} />
            <span className="hidden sm:inline">Ghim vị trí</span>
          </button>
        </div>

        {errors.specificAddress && (
          <p className="mt-1.5 flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
            <Icon name="error" size={15} />
            <span>{errors.specificAddress}</span>
          </p>
        )}

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
                  <p className="text-sm font-semibold text-on-surface truncate">
                    {s.title}
                  </p>
                  {s.subtitle && (
                    <p className="text-xs text-on-surface-variant truncate">
                      {s.subtitle}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Derived Full Address Preview */}
      {showDerivedPreview && (
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-primary/20 flex items-start gap-3">
          <Icon
            name="location_on"
            size={22}
            className="text-primary flex-shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <span className="block text-[11px] font-bold text-primary uppercase tracking-wider mb-0.5">
              Địa chỉ hoàn chỉnh được tổng hợp:
            </span>
            <p className="text-sm font-semibold text-on-surface break-words">
              {derivedFullAddress || (
                <span className="text-outline font-normal italic">
                  Chưa có thông tin. Vui lòng chọn Tỉnh/Huyện/Xã hoặc bấm &quot;Chọn trên bản đồ&quot;.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Live Interactive Map Preview */}
      {showLiveMap && derivedFullAddress && (
        <div className="rounded-2xl overflow-hidden border border-surface-variant/40 bg-surface-container-low shadow-sm">
          <div className="px-4 py-2.5 bg-surface-container flex items-center justify-between border-b border-surface-variant/30">
            <div className="flex items-center gap-2">
              <Icon name="map" size={18} className="text-primary" />
              <span className="font-label-sm text-xs font-bold text-on-surface">
                Vị trí trên bản đồ (Click hoặc kéo ghim để định vị chính xác)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Phóng to bản đồ</span>
              <Icon name="open_in_full" size={14} />
            </button>
          </div>
          <div className="relative w-full h-64 sm:h-72 bg-surface-container">
            <MapPicker
              lat={coords.lat}
              lng={coords.lng}
              onLocationSelect={handleLiveMapPinMove}
              className="w-full h-full rounded-none border-none shadow-none"
            />
          </div>
        </div>
      )}

      {/* Modal Google Map */}
      <GoogleMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialCoords={coords}
        initialQuery={derivedFullAddress || specificAddress}
        onConfirm={handleMapConfirm}
      />
    </div>
  )
}
