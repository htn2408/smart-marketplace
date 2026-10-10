import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Icon from '../components/common/Icon'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import TaskSearchInput from '../components/common/TaskSearchInput'
import {
  fetchProvinces,
  fetchDistricts,
  fetchWards,
  searchAddressSuggestions,
} from '../services/addressService'
import { geocodeAddress } from '../services/mapService'
import GoogleMapModal from '../components/task-detail/GoogleMapModal'
import MapPicker from '../components/task-detail/MapPicker'
import { useAuth } from '../hooks/useAuth'

/**
 * TaskMate TaskDetail (Đăng việc & Đề xuất thù lao) - Standardized JSX Component
 */
export default function TaskDetail({ onNavigate }) {
  const location = useLocation()
  const preselected = location.state?.selectedTask

  // State for Section 1: Task Category (auto-filled if user selected from Home, otherwise empty)
  const [taskCategory, setTaskCategory] = useState(
    preselected?.title || ''
  )

  // State for Section 2: Description (empty by default)
  const [description, setDescription] = useState('')

  // State for Section 3: Images
  const [uploadedImages, setUploadedImages] = useState([
    {
      id: 1,
      src: '/images/task-detail/ikea-boxes.jpg',
      label: 'Thùng kiện IKEA',
    },
    {
      id: 2,
      src: '/images/task-detail/empty-corner.jpg',
      label: 'Góc tường trống',
    },
    {
      id: 3,
      src: '/images/task-detail/manual-schematic.jpg',
      label: 'Sơ đồ sách mẫu',
    },
  ])

  const removeImage = (id) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id))
  }

  // ==============================================================
  // State for Section 4: Cascading Address (Tỉnh -> Huyện -> Xã) & Google Maps Modal
  // ==============================================================
  const [provincesList, setProvincesList] = useState([])
  const [districtsList, setDistrictsList] = useState([])
  const [wardsList, setWardsList] = useState([])

  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [ward, setWard] = useState('')
  const [specificAddress, setSpecificAddress] = useState('')

  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [mapSearchQuery, setMapSearchQuery] = useState('')
  const [coords, setCoords] = useState({ lat: 21.0285, lng: 105.8542 })
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false)
  const addressContainerRef = useRef(null)

  const { user } = useAuth()

  // Bước 1: Khởi tạo State và tải danh sách Tỉnh/Thành
  useEffect(() => {
    const loadProvinces = async () => {
      const data = await fetchProvinces()
      if (data.length > 0) {
        setProvincesList(data)
      }
    }
    loadProvinces()
  }, [])

  // Tự động điền địa chỉ mặc định của người dùng từ CSDL nếu đã có
  useEffect(() => {
    if (user?.address && !specificAddress) {
      setSpecificAddress(user.address)
      if (user.latitude && user.longitude) {
        const uCoords = { lat: Number(user.latitude), lng: Number(user.longitude) }
        setCoords(uCoords)
        setIsGeocodedDetail(true)
      }
    }
  }, [user])

  // Bước 2: Logic chọn Tỉnh → Tải Quận/Huyện (Cascading 1)
  const handleProvinceChange = async (e) => {
    const selectedProvince = e.target.value
    setProvince(selectedProvince)
    setDistrict('')
    setWard('')
    setWardsList([])

    if (!selectedProvince) {
      setDistrictsList([])
      return
    }

    const p = provincesList.find(
      (item) => item.full_name === selectedProvince || item.name === selectedProvince
    )
    if (!p) {
      setDistrictsList([])
      return
    }

    if (p.latitude && p.longitude) {
      setCoords({ lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) })
    }

    const data = await fetchDistricts(p.id)
    setDistrictsList(data)
  }

  // Bước 3: Logic chọn Huyện → Tải Phường/Xã (Cascading 2)
  const handleDistrictChange = async (e) => {
    const selectedDistrict = e.target.value
    setDistrict(selectedDistrict)
    setWard('')

    if (!selectedDistrict) {
      setWardsList([])
      return
    }

    const d = districtsList.find(
      (item) => item.full_name === selectedDistrict || item.name === selectedDistrict
    )
    if (!d) {
      setWardsList([])
      return
    }

    if (d.latitude && d.longitude) {
      setCoords({ lat: parseFloat(d.latitude), lng: parseFloat(d.longitude) })
    }

    const data = await fetchWards(d.id)
    setWardsList(data)
  }

  // Logic chọn Phường/Xã (Cascading 3)
  const handleWardChange = (e) => {
    const selectedWard = e.target.value
    setWard(selectedWard)
    if (!selectedWard) return

    const w = wardsList.find(
      (item) => item.full_name === selectedWard || item.name === selectedWard
    )
    if (w && w.latitude && w.longitude) {
      setCoords({ lat: parseFloat(w.latitude), lng: parseFloat(w.longitude) })
    }
  }

  // Tự động gợi ý địa điểm theo từ khoá nhập và toạ độ khu vực hiện tại
  useEffect(() => {
    const trimmed = specificAddress.trim()
    if (trimmed.length < 2) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsSearchingAddress(true)
      try {
        const list = await searchAddressSuggestions(
          trimmed,
          { lat: coords.lat, lng: coords.lng },
          {
            signal: controller.signal,
            limit: 5,
          }
        )
        setAddressSuggestions(list)
        setIsAddressDropdownOpen(list.length > 0)
      } finally {
        setIsSearchingAddress(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [specificAddress, coords.lat, coords.lng])

  const [isGeocodedDetail, setIsGeocodedDetail] = useState(false)
  const [geocodedLabel, setGeocodedLabel] = useState('')

  // Đóng dropdown gợi ý khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        addressContainerRef.current &&
        !addressContainerRef.current.contains(e.target)
      ) {
        setIsAddressDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Tự động geocoding vị trí chi tiết khi nhập số nhà, tên đường, toà nhà
  const triggerGeocodeSpecificAddress = useCallback(
    async (addrToSearch) => {
      const input = (addrToSearch !== undefined ? addrToSearch : specificAddress).trim()
      if (input.length < 2) return

      // Thử tìm địa chỉ kết hợp: số nhà/toà nhà + Phường/Xã + Quận/Huyện + Tỉnh/Thành
      const fullQuery = [input, ward, district, province].filter(Boolean).join(', ')
      setIsSearchingAddress(true)

      try {
        let results = await geocodeAddress(fullQuery, {
          biasCoords: coords,
          limit: 3,
        })

        // Nếu query đầy đủ chưa tìm thấy, thử tìm [input, district, province]
        if (!results || results.length === 0) {
          const districtQuery = [input, district, province].filter(Boolean).join(', ')
          results = await geocodeAddress(districtQuery, {
            biasCoords: coords,
            limit: 3,
          })
        }

        // Nếu vẫn chưa thấy, thử tìm riêng tên input với bias tọa độ hiện tại
        if (!results || results.length === 0) {
          results = await geocodeAddress(input, {
            biasCoords: coords,
            limit: 3,
          })
        }

        if (results && results.length > 0) {
          const match = results[0]
          if (match.lat && match.lng) {
            setCoords({ lat: match.lat, lng: match.lng })
            setIsGeocodedDetail(true)
            setGeocodedLabel(match.displayName || match.title)
          }
        }
      } catch (err) {
        console.warn('Geocoding specific address error:', err)
      } finally {
        setIsSearchingAddress(false)
      }
    },
    [specificAddress, ward, district, province, coords]
  )

  const handleSelectSuggestion = (item) => {
    setSpecificAddress(item.title)
    if (item.lat && item.lng) {
      setCoords({ lat: item.lat, lng: item.lng })
      setIsGeocodedDetail(true)
      setGeocodedLabel(item.displayName || item.title)
    }
    setIsAddressDropdownOpen(false)
  }

  // Bước 4: Tự động tổng hợp địa chỉ hoàn chỉnh ($derived)
  const fullAddress = [specificAddress, ward, district, province]
    .filter(Boolean)
    .join(', ')

  // Cập nhật toạ độ khi người dùng click hoặc kéo ghim trên bản đồ
  const handleMapLocationSelect = (loc) => {
    if (loc.lat && loc.lng) {
      setCoords({ lat: loc.lat, lng: loc.lng })
      setIsGeocodedDetail(true)
    }
  }

  const handleMapAddressResolved = (resolved) => {
    if (resolved && resolved.displayName) {
      setGeocodedLabel(resolved.displayName)
    }
  }

  // Bước 5: Logic tương tác với Google Maps
  const handleOpenMapModal = () => {
    setMapSearchQuery(fullAddress || 'Thành phố Hà Nội, Việt Nam')
    setIsMapModalOpen(true)
  }

  const handleConfirmFromMap = (confirmedQuery, newCoords) => {
    if (newCoords && newCoords.lat && newCoords.lng) {
      setCoords(newCoords)
      setIsGeocodedDetail(true)
      setGeocodedLabel(confirmedQuery)
    }
    if (confirmedQuery) {
      setSpecificAddress(confirmedQuery)
    }
  }

  // State for Section 5: Budget
  const [amount, setAmount] = useState(450000)
  const [allowNegotiate, setAllowNegotiate] = useState(true)

  // State for Section 6: Schedule & Duration (Real-time Date & Start-End Time)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const formatDateTitle = (date) => {
    const d = String(date.getDate()).padStart(2, '0')
    const m = date.getMonth() + 1
    return `${d} Th${m}`
  }

  const todayIso = today.toISOString().split('T')[0]
  const tomorrowIso = tomorrow.toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState('tomorrow')
  const [customDate, setCustomDate] = useState(tomorrowIso)
  const [startTime, setStartTime] = useState('08:30')
  const [endTime, setEndTime] = useState('11:30')

  const dateOptions = [
    {
      id: 'today',
      title: 'Hôm nay (Gấp)',
      sub: 'Có thợ đến sau 30p',
      icon: 'bolt',
      iconColor: 'text-secondary',
    },
    {
      id: 'tomorrow',
      title: `Ngày mai, ${formatDateTitle(tomorrow)}`,
      sub: 'Được chọn nhiều nhất',
      icon: 'event_available',
      iconColor: 'text-primary',
    },
    {
      id: 'other',
      title: 'Chọn ngày khác',
      sub: selectedDate === 'other' ? customDate : 'Lên lịch linh hoạt',
      icon: 'calendar_month',
      iconColor: 'text-on-surface-variant',
    },
  ]

  // Calculate duration between startTime and endTime
  const calculateDuration = (start, end) => {
    if (!start || !end) return { hours: 0, minutes: 0, totalMinutes: 0 }
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    let total = (eh * 60 + em) - (sh * 60 + sm)
    if (total < 0) total += 24 * 60 // cross-midnight fallback
    const hours = Math.floor(total / 60)
    const minutes = total % 60
    return { hours, minutes, totalMinutes: total }
  }

  const durationInfo = calculateDuration(startTime, endTime)

  const applyDurationPreset = (hoursToAdd) => {
    const [sh, sm] = startTime.split(':').map(Number)
    const newEndHour = (sh + hoursToAdd) % 24
    const formatted = `${String(newEndHour).padStart(2, '0')}:${String(sm).padStart(2, '0')}`
    setEndTime(formatted)
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!taskCategory.trim()) {
      alert('Vui lòng nhập tên công việc cần hỗ trợ.')
      return
    }
    alert(`Đã đăng yêu cầu dịch vụ thành công! Hệ thống đang chuyển đến danh sách thợ phù hợp.`)
    if (onNavigate) {
      onNavigate('search')
    }
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Global Header */}
      <Header activePath="task-detail" onNavigate={onNavigate} />

      <main className="w-full pt-20 bg-surface flex-1">
        {/* Progress & Page Header Bar */}
        <section className="w-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(13,112,84,0.04)] border-b border-surface-variant/30">
          <div className="max-w-[1240px] mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="primary" icon="add_task">
                    Tạo yêu cầu dịch vụ
                  </Badge>
                  <span className="text-outline-variant font-body-sm text-body-sm">•</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Không mất phí đăng tin • Đảm bảo giá minh bạch
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight">
                  Đăng việc &amp; Đề xuất thù lao
                </h1>
              </div>

              {/* Steps Breadcrumb */}
              <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                    1
                  </span>
                  <span className="font-label-md text-label-md text-primary font-bold">
                    Chi tiết công việc
                  </span>
                </div>
                <Icon name="chevron_right" size={18} className="text-outline-variant" />
                <div className="flex items-center gap-2 text-on-surface-variant opacity-60">
                  <span className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-label-sm text-label-sm font-semibold">
                    2
                  </span>
                  <span className="font-label-md text-label-md">Xem đề xuất từ thợ</span>
                </div>
                <Icon name="chevron_right" size={18} className="text-outline-variant" />
                <div className="flex items-center gap-2 text-on-surface-variant opacity-60">
                  <span className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-label-sm text-label-sm font-semibold">
                    3
                  </span>
                  <span className="font-label-md text-label-md">Xác nhận &amp; Nghiệm thu</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Form */}
        <div className="w-full bg-surface py-8">
          <div className="max-w-[1240px] mx-auto px-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
              {/* Section 1: Chuẩn hóa công việc (Đã bỏ danh sách gợi ý vì user đã chọn từ trang home) */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-surface-variant/30">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                        Bước 1: Chuẩn hóa công việc
                      </span>
                    </div>
                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Bạn cần hỗ trợ công việc gì?
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Tên công việc chuẩn hóa giúp thuật toán ghép thợ lành nghề nhanh gấp 3 lần.
                    </p>
                  </div>
                  <Badge variant="secondary" icon="trending_up" size="sm">
                    Phổ biến rất cao
                  </Badge>
                </div>

                <TaskSearchInput
                  id="task-category-input"
                  required
                  label={
                    <span>
                      Tên công việc <span className="text-error">*</span>
                    </span>
                  }
                  value={taskCategory}
                  onChange={setTaskCategory}
                  onSelectTask={(task) => {
                    if (task?.suggestedPrice) {
                      setAmount(task.suggestedPrice)
                    }
                  }}
                  placeholder="Nhập việc cần làm (vd: Lắp tủ IKEA, sửa ống nước, chuyển nhà...)"
                  icon="handyman"
                  className="mb-2"
                />
              </div>

              {/* Section 2: Chi tiết mô tả (Đã bỏ bộ kiểm tra tiện ích nhanh) */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-surface-variant/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                      Bước 2: Chi tiết mô tả
                    </span>
                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Mô tả cụ thể hiện trạng &amp; yêu cầu
                    </h2>
                  </div>
                  <span className="font-caption text-caption text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
                    {description.length}/1000 ký tự
                  </span>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Mô tả cụ thể về đồ cần lắp, kích thước, hiện trạng vị trí lắp, tầng mấy (có thang máy không)..."
                  className="w-full p-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-on-surface-variant/60 resize-y border border-transparent focus:border-primary/20"
                />
              </div>

              {/* Section 3: Hình ảnh hiện trạng */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-surface-variant/30">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                      Bước 3: Hình ảnh hiện trạng
                    </span>
                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Tải ảnh hộp đồ &amp; vị trí cần lắp ({uploadedImages.length}/6)
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Đăng ảnh thực tế giúp Tasker hiểu việc chuẩn xác và nhận ngay mà không cần khảo sát rườm rà.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-primary-fixed/30 text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold shrink-0">
                    Tối đa 6 ảnh
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative group rounded-lg overflow-hidden bg-surface-container aspect-square shadow-sm"
                    >
                      <img
                        src={img.src}
                        alt={img.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                        <span className="font-caption text-caption text-white font-medium truncate">
                          {img.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        aria-label="Xoá hình ảnh"
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-error transition-colors cursor-pointer"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ))}

                  {uploadedImages.length < 6 && (
                    <button
                      type="button"
                      onClick={() => alert('Chọn tệp ảnh hoặc video từ thiết bị của bạn')}
                      className="aspect-square rounded-lg bg-surface-container-low hover:bg-surface-container flex flex-col items-center justify-center gap-1.5 p-3 text-on-surface-variant hover:text-primary transition-all group cursor-pointer border border-dashed border-outline-variant/60"
                    >
                      <span className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-on-primary transition-colors">
                        <Icon name="add_a_photo" size={22} />
                      </span>
                      <span className="font-label-sm text-label-sm font-semibold">
                        Thêm ảnh / video
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant/70">
                        JPG, PNG, MP4
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 4: Địa điểm thực hiện (Cascading Dropdowns & Google Maps) */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-surface-variant/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                      Bước 4: Địa điểm thực hiện
                    </span>
                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Vị trí căn hộ / nhà riêng
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Chọn Tỉnh/Thành, Quận/Huyện, Phường/Xã hoặc chọn trực tiếp trên Google Maps.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon="map"
                    onClick={handleOpenMapModal}
                    className="self-start sm:self-auto text-primary rounded-xl font-bold border-primary/30 hover:bg-primary-fixed/20 shadow-sm cursor-pointer"
                  >
                    Chọn trên bản đồ
                  </Button>
                </div>

                {/* 3 Cascading Dropdowns: Tỉnh -> Huyện -> Xã */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {/* Cấp 1: Tỉnh / Thành phố */}
                  <div>
                    <label
                      htmlFor="province-select"
                      className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5"
                    >
                      Tỉnh / Thành phố <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="province-select"
                        value={province}
                        onChange={handleProvinceChange}
                        className="w-full px-3.5 py-3 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all cursor-pointer appearance-none"
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
                  </div>

                  {/* Cấp 2: Quận / Huyện */}
                  <div>
                    <label
                      htmlFor="district-select"
                      className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5"
                    >
                      Quận / Huyện <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="district-select"
                        value={district}
                        onChange={handleDistrictChange}
                        disabled={!province || districtsList.length === 0}
                        className="w-full px-3.5 py-3 bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-on-surface font-label-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all cursor-pointer appearance-none"
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

                  {/* Cấp 3: Phường / Xã */}
                  <div>
                    <label
                      htmlFor="ward-select"
                      className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5"
                    >
                      Phường / Xã <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="ward-select"
                        value={ward}
                        onChange={handleWardChange}
                        disabled={!district || wardsList.length === 0}
                        className="w-full px-3.5 py-3 bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-on-surface font-label-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all cursor-pointer appearance-none"
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

                {/* Specific Address: Số nhà, tên đường with Autocomplete Dropdown */}
                <div className="mb-4 relative" ref={addressContainerRef}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="specific-address-input"
                      className="block text-xs font-bold text-outline uppercase tracking-wider"
                    >
                      Số nhà, tên đường, toà nhà / căn hộ
                    </label>
                    <div className="flex items-center gap-2">
                      {user?.address && (
                        <button
                          type="button"
                          onClick={() => {
                            setSpecificAddress(user.address)
                            if (user.latitude && user.longitude) {
                              setCoords({ lat: Number(user.latitude), lng: Number(user.longitude) })
                              setIsGeocodedDetail(true)
                            }
                            triggerGeocodeSpecificAddress(user.address)
                          }}
                          className="text-[11px] font-semibold text-primary bg-primary-fixed/30 hover:bg-primary-fixed/50 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Sử dụng địa chỉ đã lưu trong hồ sơ cá nhân"
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
                          setIsGeocodedDetail(false)
                          if (val.trim().length >= 2) {
                            setIsAddressDropdownOpen(true)
                          } else {
                            setAddressSuggestions([])
                            setIsAddressDropdownOpen(false)
                          }
                        }}
                        onFocus={() => {
                          if (addressSuggestions.length > 0) {
                            setIsAddressDropdownOpen(true)
                          }
                        }}
                        onBlur={() => {
                          triggerGeocodeSpecificAddress()
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            setIsAddressDropdownOpen(false)
                            triggerGeocodeSpecificAddress()
                          }
                        }}
                        placeholder="Ví dụ: Tiểu học Vĩnh Hưng, 53 Lĩnh Nam, Toà nhà Park 12..."
                        className="w-full pl-11 pr-14 py-3 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border border-surface-variant/40 focus:border-primary focus:bg-surface-container-lowest transition-all"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {isSearchingAddress && (
                          <Icon
                            name="sync"
                            size={16}
                            className="animate-spin text-primary"
                          />
                        )}
                        {specificAddress && !isSearchingAddress && (
                          <button
                            type="button"
                            onClick={() => {
                              setSpecificAddress('')
                              setAddressSuggestions([])
                              setIsAddressDropdownOpen(false)
                              setIsGeocodedDetail(false)
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

                  {/* Suggestions Dropdown */}
                  {isAddressDropdownOpen && addressSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-variant/40 overflow-hidden divide-y divide-surface-variant/20 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3.5 py-2 bg-surface-container-low text-[11px] font-bold text-primary uppercase tracking-wider flex items-center justify-between">
                        <span>Gợi ý địa điểm &amp; toà nhà</span>
                        <span className="text-outline font-normal">Click để định vị bản đồ</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {addressSuggestions.map((item) => (
                          <div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectSuggestion(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleSelectSuggestion(item)
                              }
                            }}
                            className="p-3 hover:bg-primary-fixed/20 flex items-start gap-3 transition-colors cursor-pointer text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                              <Icon name="location_on" size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-on-surface truncate">
                                {item.title}
                              </div>
                              {item.subtitle && (
                                <div className="text-xs text-on-surface-variant truncate">
                                  {item.subtitle}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Derived Full Address Preview */}
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
                      {fullAddress || (
                        <span className="text-outline font-normal italic">
                          Chưa có thông tin. Vui lòng chọn Tỉnh/Huyện/Xã hoặc bấm &quot;Chọn trên bản đồ&quot;.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Live Interactive Map Preview */}
                {fullAddress && (
                  <div className="mt-4 rounded-2xl overflow-hidden border border-surface-variant/40 bg-surface-container-low shadow-sm">
                    <div className="px-4 py-2.5 bg-surface-container flex items-center justify-between border-b border-surface-variant/30">
                      <div className="flex items-center gap-2">
                        <Icon name="map" size={18} className="text-primary" />
                        <span className="font-label-sm text-xs font-bold text-on-surface">
                          Vị trí trên bản đồ (Click hoặc kéo ghim để định vị chính xác)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenMapModal}
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
                        onLocationSelect={handleMapLocationSelect}
                        onAddressResolved={handleMapAddressResolved}
                        className="w-full h-full rounded-none border-none shadow-none"
                      />
                    </div>
                  </div>
                )}

                {/* Google Maps Modal */}
                <GoogleMapModal
                  isOpen={isMapModalOpen}
                  initialQuery={mapSearchQuery}
                  initialCoords={coords}
                  onClose={() => setIsMapModalOpen(false)}
                  onConfirm={handleConfirmFromMap}
                />
              </div>

              {/* Section 5: Thù lao đề xuất */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-surface-variant/30">
                <div className="mb-5">
                  <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                    Bước 5: Thù lao đề xuất
                  </span>
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Đề xuất mức giá bạn mong muốn
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Tasker sẽ dựa vào mức giá này để nhận việc hoặc gửi báo giá tối ưu.
                  </p>
                </div>

                {/* Amount display card */}
                <div className="bg-surface-container-low rounded-2xl p-5 sm:p-6 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                      Mức giá bạn chi trả
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-display-hero text-display-hero font-extrabold text-primary tracking-tight">
                        {amount.toLocaleString('vi-VN')}
                      </span>
                      <span className="font-headline-md text-headline-md text-primary font-bold">
                        VNĐ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Horizontal roller / slider */}
                <div className="px-2 pt-2 pb-2">
                  <div className="relative py-2">
                    <input
                      type="range"
                      min={100000}
                      max={2000000}
                      step={20000}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full h-3 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between items-center text-on-surface-variant font-caption text-xs mt-2 font-medium px-1">
                      <span>100.000 đ</span>
                      <span>500.000 đ</span>
                      <span>1.000.000 đ</span>
                      <span>1.500.000 đ</span>
                      <span>2.000.000 đ</span>
                    </div>
                  </div>

                  {/* Note if urgent */}
                  <div className="mt-4 p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2.5 text-xs text-on-surface">
                    <Icon name="info" size={18} className="text-primary shrink-0" />
                    <span>
                      <strong className="text-primary font-semibold">Lưu ý:</strong> Nên để giá cao hơn nếu bạn cần tìm thợ tuyển gấp.
                    </span>
                  </div>
                </div>

                <label className="flex items-start gap-3 mt-4 p-3.5 rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={allowNegotiate}
                    onChange={(e) => setAllowNegotiate(e.target.checked)}
                    className="w-4 h-4 mt-1 accent-primary rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      Cho phép Tasker đề xuất thương lượng thù lao
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Tasker có thể gửi báo giá kèm lý do cụ thể nếu cần thêm đồ nghề đặc thù hoặc phụ kiện bổ sung.
                    </p>
                  </div>
                </label>
              </div>

              {/* Section 6: Lịch hẹn & Thời lượng (Real-time Date & Start-End Duration) */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-surface-variant/30">
                <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                  Bước 6: Lịch hẹn &amp; Thời lượng
                </span>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-4">
                  Khi nào bạn muốn bắt đầu?
                </h2>

                {/* 1. Date options */}
                <div className="mb-6">
                  <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-2">
                    Chọn ngày làm việc:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {dateOptions.map((opt) => {
                      const isActive = selectedDate === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedDate(opt.id)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-primary-fixed/30 ring-2 ring-primary shadow-sm'
                              : 'bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <Icon
                            name={opt.icon}
                            size={24}
                            className={isActive ? 'text-primary' : opt.iconColor}
                          />
                          <div>
                            <p className={`font-label-md text-label-md font-bold ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                              {opt.title}
                            </p>
                            <p className="font-caption text-caption text-on-surface-variant">
                              {opt.sub}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Dynamic Date Picker when "Chọn ngày khác" is chosen */}
                  {selectedDate === 'other' && (
                    <div className="mt-3 p-4 rounded-xl bg-surface-container-low border border-primary/20 flex items-center gap-3 animate-in fade-in duration-200">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                        <Icon name="calendar_today" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor="custom-date-picker"
                          className="block text-xs font-bold text-primary uppercase tracking-wider mb-1"
                        >
                          Chọn ngày làm việc cụ thể:
                        </label>
                        <input
                          id="custom-date-picker"
                          type="date"
                          min={todayIso}
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          className="bg-surface-container-lowest px-3 py-2 rounded-lg font-label-md text-sm text-on-surface outline-none border border-surface-variant/40 focus:border-primary w-full max-w-xs cursor-pointer shadow-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Duration: Start Time - End Time */}
                <div className="mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <label className="block font-label-sm text-label-sm font-semibold text-on-surface">
                      Thời lượng dự kiến hoàn thành (Start – End):
                    </label>
                    <span className="font-label-sm text-xs font-bold text-primary bg-primary-fixed/30 px-2.5 py-1 rounded-full self-start sm:self-auto">
                      Ước tính: {durationInfo.hours} giờ {durationInfo.minutes > 0 ? `${durationInfo.minutes} phút` : ''} ({durationInfo.totalMinutes} phút)
                    </span>
                  </div>

                  {/* Start - End Time Input Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {/* Start Time */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-variant/30 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                        <Icon name="schedule" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor="start-time-input"
                          className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-0.5"
                        >
                          Giờ bắt đầu (Start)
                        </label>
                        <input
                          id="start-time-input"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="bg-transparent font-label-md text-base font-bold text-on-surface outline-none w-full cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* End Time */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-variant/30 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm flex-shrink-0">
                        <Icon name="timelapse" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor="end-time-input"
                          className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-0.5"
                        >
                          Giờ kết thúc (End)
                        </label>
                        <input
                          id="end-time-input"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="bg-transparent font-label-md text-base font-bold text-on-surface outline-none w-full cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-label-sm text-xs text-outline font-semibold">
                      Gợi ý nhanh (+):
                    </span>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(1)}
                      className="px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-primary-fixed/40 hover:text-primary transition-colors font-label-sm text-xs font-semibold cursor-pointer"
                    >
                      + 1 giờ
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(2)}
                      className="px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-primary-fixed/40 hover:text-primary transition-colors font-label-sm text-xs font-semibold cursor-pointer"
                    >
                      + 2 giờ (Tủ IKEA)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(3)}
                      className="px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-primary-fixed/40 hover:text-primary transition-colors font-label-sm text-xs font-semibold cursor-pointer"
                    >
                      + 3 giờ (Nhiều chi tiết)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(4)}
                      className="px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-primary-fixed/40 hover:text-primary transition-colors font-label-sm text-xs font-semibold cursor-pointer"
                    >
                      + 4 giờ (Nửa ngày)
                    </button>
                  </div>
                </div>
              </div>

              {/* Final Action CTA Buttons */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm space-y-4 border border-surface-variant/30">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon="send"
                    fullWidth
                    className="py-4"
                  >
                    Đăng việc ngay (Miễn phí)
                  </Button>
                  <Button
                    type="button"
                    variant="tonal"
                    size="lg"
                    icon="save"
                    className="w-full sm:w-auto py-4"
                    onClick={() => alert('Đã lưu bài đăng vào bản nháp!')}
                  >
                    Lưu bản nháp
                  </Button>
                </div>
                <p className="text-center font-caption text-caption text-on-surface-variant">
                  Bằng việc đăng yêu cầu, bạn đồng ý với{' '}
                  <a className="text-primary underline" href="#">
                    Điều khoản dịch vụ
                  </a>{' '}
                  và được bảo vệ bởi{' '}
                  <a className="text-primary underline font-semibold" href="#">
                    Chính sách Cam kết Hài lòng 100%
                  </a>{' '}
                  của TaskMate.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  )
}