import { useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Icon from '../../components/common/Icon'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import TaskSearchInput from '../../components/common/TaskSearchInput'
import AddressSelector from '../../components/common/AddressSelector'
import { parseVietnameseAddress } from '../../services/addressService'
import { createTaskApi } from '../../services/taskService'
import { MAX_TASK_IMAGES, MAX_IMAGE_BYTES } from '../../constants/uploadLimits'
import { useAuth } from '../../hooks/useAuth'
import { validateTaskDetailForm } from '../../utils/validation'

/**
 * TaskMate TaskDetail (Đăng việc & Đề xuất thù lao) - Standardized JSX Component
 */
export default function TaskDetail({ onNavigate }) {
  const location = useLocation()
  const preselected = location.state?.selectedTask
  const taskDraft = location.state?.taskDraft

  // Validation errors state
  const [errors, setErrors] = useState({})

  const clearFieldError = useCallback((...fieldNames) => {
    setErrors((prev) => {
      let hasChange = false
      const next = { ...prev }
      fieldNames.forEach((field) => {
        if (next[field]) {
          delete next[field]
          hasChange = true
        }
      })
      return hasChange ? next : prev
    })
  }, [])

  // State for Section 1: Task Category (auto-filled if user selected from Home, otherwise empty)
  const [taskCategory, setTaskCategory] = useState(
    taskDraft?.title || preselected?.title || ''
  )
  // Skill thực tế trong DB — chỉ có khi người dùng chọn từ gợi ý (bắt buộc cho matching)
  const [requiredSkillId, setRequiredSkillId] = useState(taskDraft?.skillId || '')

  // State for Section 2: Description (empty by default)
  const [description, setDescription] = useState(taskDraft?.description || '')

  // State for Section 3: Images — file thật, upload qua POST /api/tasks (multipart)
  const [taskImages, setTaskImages] = useState([])
  const [imageError, setImageError] = useState('')
  const imageInputRef = useRef(null)

  const removeImage = (id) => {
    setTaskImages((prev) => {
      const found = prev.find((img) => img.id === id)
      if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl)
      return prev.filter((img) => img.id !== id)
    })
  }

  const handleImagesSelected = (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = '' // reset để chọn lại được cùng 1 file
    if (files.length === 0) return

    const problems = []
    const accepted = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        problems.push(`"${file.name}" không phải là file ảnh.`)
      } else if (file.size > MAX_IMAGE_BYTES) {
        problems.push(`Ảnh "${file.name}" vượt quá 5MB.`)
      } else {
        accepted.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          label: file.name,
        })
      }
    }

    setTaskImages((prev) => {
      const remaining = Math.max(0, MAX_TASK_IMAGES - prev.length)
      if (accepted.length > remaining) {
        problems.push(`Tối đa ${MAX_TASK_IMAGES} ảnh — đã bỏ bớt ${accepted.length - remaining} ảnh.`)
      }
      return [...prev, ...accepted.slice(0, remaining)]
    })
    setImageError(problems.join(' '))
  }

  // ==============================================================
  // State for Section 4: Address (Managed by shared <AddressSelector />)
  // ==============================================================
  const { user } = useAuth()

  const initialAddressString =
    taskDraft?.fullAddress ||
    (taskDraft?.province
      ? [taskDraft.specificAddress, taskDraft.ward, taskDraft.district, taskDraft.province]
          .filter(Boolean)
          .join(', ')
      : taskDraft?.specificAddress || user?.address || '')

  const initialParsedAddress = parseVietnameseAddress(initialAddressString)

  const [province, setProvince] = useState(
    () => taskDraft?.province || initialParsedAddress.province || ''
  )
  const [district, setDistrict] = useState(
    () => taskDraft?.district || initialParsedAddress.district || ''
  )
  const [ward, setWard] = useState(
    () => taskDraft?.ward || initialParsedAddress.ward || ''
  )
  const [specificAddress, setSpecificAddress] = useState(
    () =>
      taskDraft?.specificAddress ||
      initialParsedAddress.specificAddress ||
      user?.address ||
      ''
  )
  const [fullAddress, setFullAddress] = useState(() => initialAddressString)

  // Mã hành chính (Esgoo) + toạ độ do AddressSelector trả về — gửi lên backend để matching theo code
  const [provinceCode, setProvinceCode] = useState(() => taskDraft?.provinceCode || '')
  const [districtCode, setDistrictCode] = useState(() => taskDraft?.districtCode || '')
  const [coords, setCoords] = useState(() => ({
    lat: taskDraft?.latitude ?? (user?.latitude ? Number(user.latitude) : 21.0285),
    lng: taskDraft?.longitude ?? (user?.longitude ? Number(user.longitude) : 105.8542),
  }))

  const handleAddressChange = useCallback((addrData) => {
    setProvince(addrData.province || '')
    setDistrict(addrData.district || '')
    setWard(addrData.ward || '')
    setProvinceCode(addrData.provinceCode || '')
    setDistrictCode(addrData.districtCode || '')
    setSpecificAddress(addrData.specificAddress || '')
    setFullAddress(addrData.fullAddress || '')
    if (addrData.latitude != null && addrData.longitude != null) {
      setCoords({ lat: Number(addrData.latitude), lng: Number(addrData.longitude) })
    }
  }, [])

  // Trạng thái đăng việc thật (POST /api/tasks)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // State for Section 5: Budget
  const [amount, setAmount] = useState(
    taskDraft?.offeredPrice ? Number(taskDraft.offeredPrice) : 450000
  )
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

  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

  const [selectedDate, setSelectedDate] = useState(taskDraft?.selectedDate || 'tomorrow')
  const [customDate, setCustomDate] = useState(taskDraft?.customDate || tomorrowIso)
  const [startTime, setStartTime] = useState(taskDraft?.startTime || '08:30')
  const [endTime, setEndTime] = useState(taskDraft?.endTime || '11:30')

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
    clearFieldError('scheduleTime')
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()

    const fallbackParsed = parseVietnameseAddress(specificAddress)
    const resolvedProvince = province || fallbackParsed.province
    const resolvedDistrict = district || fallbackParsed.district
    const resolvedWard = ward || fallbackParsed.ward

    const validation = validateTaskDetailForm({
      taskCategory,
      description,
      province: resolvedProvince,
      district: resolvedDistrict,
      ward: resolvedWard,
      specificAddress,
      amount,
      selectedDate,
      customDate,
      startTime,
      endTime,
    })

    if (!validation.isValid) {
      setErrors(validation.errors)
      if (validation.firstErrorSection) {
        const sectionEl = document.getElementById(validation.firstErrorSection)
        if (sectionEl) {
          sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      return
    }

    // Skill bắt buộc phải có trong DB — chỉ xác định được khi chọn từ gợi ý
    if (!requiredSkillId) {
      setErrors({
        taskCategory:
          'Vui lòng chọn tên công việc từ danh sách gợi ý để hệ thống xác định kỹ năng cần thiết.',
      })
      document.getElementById('step-1')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    if (durationInfo.totalMinutes < 15) {
      setErrors({ scheduleTime: 'Thời lượng làm việc tối thiểu 15 phút.' })
      document.getElementById('step-6')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setErrors({})

    const activeDateOption = dateOptions.find((d) => d.id === selectedDate)
    const dateLabel =
      selectedDate === 'other'
        ? customDate
        : activeDateOption?.title || `Ngày mai, ${formatDateTitle(tomorrow)}`

    // Ngày bắt đầu: today/tomorrow theo ISO nội bộ, 'other' dùng customDate
    const dateStr =
      selectedDate === 'today' ? todayIso : selectedDate === 'other' ? customDate : tomorrowIso
    const [sh, sm] = startTime.split(':').map(Number)
    const scheduledDate = new Date(
      `${dateStr}T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00`
    )

    const taskPayload = {
      title: taskCategory.trim(),
      description: description.trim(),
      city: resolvedProvince,
      district: resolvedDistrict,
      provinceCode,
      districtCode,
      address: [specificAddress, resolvedWard].filter(Boolean).join(', '),
      latitude: coords.lat,
      longitude: coords.lng,
      scheduledStartTime: scheduledDate.toISOString(),
      expectedTime: durationInfo.totalMinutes,
      offeredPrice: Number(amount),
      requiredSkillId,
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await createTaskApi(
        taskPayload,
        taskImages.map((img) => img.file)
      )
      const created = res.task || {}

      const taskData = {
        id: created.id,
        requestCode: created.id ? `#${created.id.slice(0, 8).toUpperCase()}` : '#TM-NEW',
        title: created.title || taskPayload.title,
        categoryName: preselected?.categoryName || created.requiredSkill?.name || 'Dịch vụ đời sống',
        skillId: created.requiredSkill?.id || requiredSkillId,
        skillName: created.requiredSkill?.name,
        description: created.description || taskPayload.description,
        province: created.city || resolvedProvince,
        district: created.district || resolvedDistrict,
        ward: resolvedWard,
        specificAddress,
        fullAddress:
          created.address || fullAddress ||
          [specificAddress, resolvedWard, resolvedDistrict, resolvedProvince].filter(Boolean).join(', '),
        latitude: created.latitude ?? coords.lat,
        longitude: created.longitude ?? coords.lng,
        offeredPrice: created.offeredPrice ?? amount,
        scheduledStartTime: created.scheduledStartTime || scheduledDate.toISOString(),
        expectedTime: created.expectedTime ?? durationInfo.totalMinutes,
        scheduledText: `${dateLabel} • ${startTime} - ${endTime}`,
        images: created.images?.map((img) => img.imageUrl) || [],
      }

      if (onNavigate) {
        onNavigate('filter-tasker', {
          fromTaskDetail: true,
          taskData,
        })
      }
    } catch (err) {
      setSubmitError(err.message || 'Không thể tạo công việc. Vui lòng thử lại.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
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
            <form onSubmit={handleSubmit} noValidate className="max-w-4xl mx-auto space-y-6">
              {/* Section 1: Chuẩn hóa công việc (Đã bỏ danh sách gợi ý vì user đã chọn từ trang home) */}
              <div
                id="step-1"
                className={`bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border transition-colors ${
                  errors.taskCategory
                    ? 'border-error/60 ring-1 ring-error/20'
                    : 'border-surface-variant/30'
                }`}
              >
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
                  error={errors.taskCategory}
                  label={
                    <span>
                      Tên công việc <span className="text-error">*</span>
                    </span>
                  }
                  value={taskCategory}
                  onChange={(val) => {
                    setTaskCategory(val)
                    clearFieldError('taskCategory')
                  }}
                  onSelectTask={(task) => {
                    clearFieldError('taskCategory')
                    setRequiredSkillId(task?.skillId || '')
                    if (task?.suggestedPrice) {
                      setAmount(task.suggestedPrice)
                    }
                  }}
                  placeholder="Nhập việc cần làm (vd: Lắp tủ IKEA, sửa ống nước, chuyển nhà...)"
                  icon="handyman"
                  className="mb-1"
                />
                {errors.taskCategory && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
                    <Icon name="error" size={15} />
                    <span>{errors.taskCategory}</span>
                  </p>
                )}
              </div>

              {/* Section 2: Chi tiết mô tả (Đã bỏ bộ kiểm tra tiện ích nhanh) */}
              <div
                id="step-2"
                className={`bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border transition-colors ${
                  errors.description
                    ? 'border-error/60 ring-1 ring-error/20'
                    : 'border-surface-variant/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                      Bước 2: Chi tiết mô tả
                    </span>
                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Mô tả cụ thể hiện trạng &amp; yêu cầu <span className="text-error">*</span>
                    </h2>
                  </div>
                  <span
                    className={`font-caption text-caption px-2 py-1 rounded ${
                      description.length > 1000
                        ? 'bg-error-container text-error font-bold'
                        : 'text-on-surface-variant bg-surface-container-low'
                    }`}
                  >
                    {description.length}/1000 ký tự
                  </span>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    clearFieldError('description')
                  }}
                  rows={4}
                  placeholder="Mô tả cụ thể về đồ cần lắp, kích thước, hiện trạng vị trí lắp, tầng mấy (có thang máy không)..."
                  className={`w-full p-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none transition-all placeholder:text-on-surface-variant/60 resize-y border ${
                    errors.description
                      ? 'border-error ring-1 ring-error/20 focus:ring-2 focus:ring-error/40'
                      : 'border-transparent focus:ring-2 focus:ring-primary/40 focus:border-primary/20'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
                    <Icon name="error" size={15} />
                    <span>{errors.description}</span>
                  </p>
                )}
              </div>

              {/* Section 3: Hình ảnh hiện trạng */}
              <div
                id="step-3"
                className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-surface-variant/30"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                      Bước 3: Hình ảnh hiện trạng
                    </span>
                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Tải ảnh hiện trạng công việc ({taskImages.length}/{MAX_TASK_IMAGES})
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Đăng ảnh thực tế giúp Tasker hiểu việc chuẩn xác và nhận ngay mà không cần khảo sát rườm rà.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-primary-fixed/30 text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold shrink-0">
                    Tối đa 10 ảnh • 5MB/ảnh
                  </span>
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImagesSelected}
                />

                {imageError && (
                  <p className="mb-3 flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
                    <Icon name="error" size={15} />
                    <span>{imageError}</span>
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {taskImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative group rounded-lg overflow-hidden bg-surface-container aspect-square shadow-sm"
                    >
                      <img
                        src={img.previewUrl}
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

                  {taskImages.length < MAX_TASK_IMAGES && (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="aspect-square rounded-lg bg-surface-container-low hover:bg-surface-container flex flex-col items-center justify-center gap-1.5 p-3 text-on-surface-variant hover:text-primary transition-all group cursor-pointer border border-dashed border-outline-variant/60"
                    >
                      <span className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-on-primary transition-colors">
                        <Icon name="add_a_photo" size={22} />
                      </span>
                      <span className="font-label-sm text-label-sm font-semibold">
                        Thêm ảnh
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant/70">
                        JPG, PNG • ≤5MB
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 4: Địa điểm thực hiện (Reusing shared <AddressSelector />) */}
              <div
                id="step-4"
                className={`bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border transition-colors ${
                  errors.province || errors.district || errors.ward || errors.specificAddress
                    ? 'border-error/60 ring-1 ring-error/20'
                    : 'border-surface-variant/30'
                }`}
              >
                <AddressSelector
                  initialAddress={initialAddressString}
                  initialLat={user?.latitude ? Number(user.latitude) : 21.0285}
                  initialLng={user?.longitude ? Number(user.longitude) : 105.8542}
                  savedUserAddress={user?.address || ''}
                  savedUserCoords={
                    user?.latitude && user?.longitude
                      ? { lat: Number(user.latitude), lng: Number(user.longitude) }
                      : null
                  }
                  required
                  stepLabel="Bước 4: Địa điểm thực hiện"
                  headerTitle="Vị trí căn hộ / nhà riêng"
                  headerSubtitle="Nhập địa chỉ hoặc nhấp trực tiếp trên bản đồ bên dưới để xác định vị trí."
                  showDerivedPreview
                  showLiveMap
                  errors={errors}
                  onClearError={clearFieldError}
                  onChange={handleAddressChange}
                />
              </div>

              {/* Section 5: Thù lao đề xuất */}
              <div
                id="step-5"
                className={`bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border transition-colors ${
                  errors.amount
                    ? 'border-error/60 ring-1 ring-error/20'
                    : 'border-surface-variant/30'
                }`}
              >
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
                      onChange={(e) => {
                        setAmount(Number(e.target.value))
                        clearFieldError('amount')
                      }}
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
                  {errors.amount && (
                    <p className="mt-2 flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
                      <Icon name="error" size={15} />
                      <span>{errors.amount}</span>
                    </p>
                  )}

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
              <div
                id="step-6"
                className={`bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border transition-colors ${
                  errors.customDate || errors.startTime || errors.scheduleTime
                    ? 'border-error/60 ring-1 ring-error/20'
                    : 'border-surface-variant/30'
                }`}
              >
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
                          onClick={() => {
                            setSelectedDate(opt.id)
                            clearFieldError('customDate', 'startTime')
                          }}
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
                          onChange={(e) => {
                            setCustomDate(e.target.value)
                            clearFieldError('customDate', 'startTime')
                          }}
                          className={`bg-surface-container-lowest px-3 py-2 rounded-lg font-label-md text-sm text-on-surface outline-none border w-full max-w-xs cursor-pointer shadow-sm ${
                            errors.customDate
                              ? 'border-error ring-1 ring-error/20 focus:border-error'
                              : 'border-surface-variant/40 focus:border-primary'
                          }`}
                        />
                        {errors.customDate && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
                            <Icon name="error" size={15} />
                            <span>{errors.customDate}</span>
                          </p>
                        )}
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
                    <div
                      className={`p-3.5 rounded-xl bg-surface-container-low border flex items-center gap-3 ${
                        errors.startTime || errors.scheduleTime
                          ? 'border-error ring-1 ring-error/20'
                          : 'border-surface-variant/30'
                      }`}
                    >
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
                          onChange={(e) => {
                            setStartTime(e.target.value)
                            clearFieldError('startTime', 'scheduleTime')
                          }}
                          className="bg-transparent font-label-md text-base font-bold text-on-surface outline-none w-full cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* End Time */}
                    <div
                      className={`p-3.5 rounded-xl bg-surface-container-low border flex items-center gap-3 ${
                        errors.scheduleTime
                          ? 'border-error ring-1 ring-error/20'
                          : 'border-surface-variant/30'
                      }`}
                    >
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
                          onChange={(e) => {
                            setEndTime(e.target.value)
                            clearFieldError('scheduleTime')
                          }}
                          className="bg-transparent font-label-md text-base font-bold text-on-surface outline-none w-full cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  {(errors.startTime || errors.scheduleTime) && (
                    <div className="mb-3 space-y-1">
                      {errors.startTime && (
                        <p className="flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
                          <Icon name="error" size={15} />
                          <span>{errors.startTime}</span>
                        </p>
                      )}
                      {errors.scheduleTime && (
                        <p className="flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
                          <Icon name="error" size={15} />
                          <span>{errors.scheduleTime}</span>
                        </p>
                      )}
                    </div>
                  )}

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
                {submitError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-error-container text-error font-label-sm text-label-sm font-semibold">
                    <Icon name="error" size={18} className="shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon="send"
                    fullWidth
                    disabled={submitting}
                    className="py-4"
                  >
                    {submitting ? 'Đang đăng việc...' : 'Đăng việc ngay (Miễn phí)'}
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
