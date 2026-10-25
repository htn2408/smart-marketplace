import { useState, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Icon from '../../components/common/Icon'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import TaskSearchInput from '../../components/common/TaskSearchInput'
import AddressSelector from '../../components/common/AddressSelector'
import TaskBudgetSelector from '../../components/common/TaskBudgetSelector'
import TaskScheduleSelector from '../../components/common/TaskScheduleSelector'
import { calculateDuration } from '../../utils/formatters'
import { parseVietnameseAddress } from '../../services/addressService'
import { createTaskApi, assignWorkerApi } from '../../services/taskService'
import { DEFAULT_AVATAR } from '../../assets/constants'
import { MAX_TASK_IMAGES, MAX_IMAGE_BYTES } from '../../constants/uploadLimits'
import { useAuth } from '../../hooks/useAuth'
import { validateTaskDetailForm } from '../../utils/validation'
import { ROUTES } from '../../routes/paths'

/**
 * TaskMate TaskDetail (Đăng việc & Đề xuất thù lao) - Standardized JSX Component
 */
export default function TaskDetail({ onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const preselected = location.state?.selectedTask
  const taskDraft = location.state?.taskDraft
  const [targetTasker, setTargetTasker] = useState(
    () => location.state?.targetTasker || null
  )

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
  const [requiredSkillId, setRequiredSkillId] = useState(
    taskDraft?.skillId ||
      location.state?.targetTasker?.skills?.[0]?.id ||
      location.state?.targetTasker?.skills?.[0]?.skillId ||
      ''
  )

  // State for Section 2: Description (empty by default)
  const [description, setDescription] = useState(taskDraft?.description || '')

  // State for Section 3: Images — khôi phục từ taskDraft (nếu quay lại từ FilterTasker) hoặc khởi tạo rỗng
  const [taskImages, setTaskImages] = useState(() => {
    if (Array.isArray(taskDraft?.taskImages) && taskDraft.taskImages.length > 0) {
      return taskDraft.taskImages
    }
    if (Array.isArray(taskDraft?.images) && taskDraft.images.length > 0) {
      return taskDraft.images
        .map((img, idx) => {
          const url = typeof img === 'string' ? img : img?.imageUrl || ''
          if (!url) return null
          return {
            id: `draft-server-img-${idx}-${Date.now()}`,
            file: null,
            previewUrl: url,
            label: `Ảnh đính kèm ${idx + 1}`,
            existingUrl: url,
          }
        })
        .filter(Boolean)
    }
    return []
  })
  const [imageError, setImageError] = useState('')
  const imageInputRef = useRef(null)

  const removeImage = (id) => {
    setTaskImages((prev) => {
      const found = prev.find((img) => img.id === id)
      if (
        found?.previewUrl &&
        found.file &&
        typeof found.previewUrl === 'string' &&
        found.previewUrl.startsWith('blob:')
      ) {
        URL.revokeObjectURL(found.previewUrl)
      }
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
  const { user, token, isAuthenticated, logout } = useAuth()

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

  const durationInfo = calculateDuration(startTime, endTime)

  const handleSubmit = async (e) => {
    e?.preventDefault()

    // Nếu chưa đăng nhập hoặc token không tồn tại -> out ra trang đăng nhập luôn
    if (!token || !isAuthenticated) {
      logout?.()
      if (onNavigate) {
        onNavigate('login', { from: location })
      } else {
        navigate(ROUTES.LOGIN, { state: { from: location } })
      }
      return
    }

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
      // Chuẩn bị danh sách File để gửi API:
      // - Nếu là File thật (từ input người dùng): giữ nguyên
      // - Nếu là ảnh server (URL từ Cloudinary): tải blob và tạo File để đính kèm lại vào request
      const filesToUpload = (
        await Promise.all(
          taskImages.map(async (img) => {
            if (img.file instanceof File) return img.file
            const remoteUrl = img.existingUrl || img.previewUrl
            if (remoteUrl && typeof remoteUrl === 'string') {
              try {
                const res = await fetch(remoteUrl)
                const blob = await res.blob()
                const ext = (blob.type?.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
                const filename =
                  img.label && img.label.includes('.')
                    ? img.label
                    : `task-image-${Date.now()}.${ext}`
                return new File([blob], filename, { type: blob.type || 'image/jpeg' })
              } catch (fetchErr) {
                console.warn('Không thể tải lại ảnh cũ từ server:', fetchErr)
                return null
              }
            }
            return null
          })
        )
      ).filter(Boolean)

      const res = await createTaskApi(
        taskPayload,
        filesToUpload
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
        provinceCode,
        districtCode,
        selectedDate,
        customDate,
        startTime,
        endTime,
        images: created.images?.map((img) => img.imageUrl) || [],
        taskImages: taskImages, // Giữ lại mảng ảnh và file thật cho các bước tiếp theo/chỉnh sửa
      }

      if (targetTasker) {
        try {
          await assignWorkerApi(created.id, targetTasker.id || targetTasker.userId)
        } catch (assignErr) {
          console.warn('Assign worker directly failed:', assignErr)
        }

        const successMsg = `Đã gửi đề xuất công việc tới thợ ${targetTasker.name} thành công!`
        if (onNavigate) {
          onNavigate('my-tasks', { alertMessage: successMsg })
        } else {
          navigate(ROUTES.CLIENT_TASKS, { state: { alertMessage: successMsg } })
        }
        return
      }

      if (onNavigate) {
        onNavigate('filter-tasker', {
          fromTaskDetail: true,
          taskData,
        })
      } else {
        navigate(`/tasks/${created.id}/filter-tasker`, {
          state: { fromTaskDetail: true, taskData },
        })
      }
    } catch (err) {
      if (
        err.status === 401 ||
        err.message?.includes('token') ||
        err.message?.includes('đăng nhập') ||
        err.message?.includes('Unauthorized')
      ) {
        logout?.()
        if (onNavigate) {
          onNavigate('login', { from: location })
        } else {
          navigate(ROUTES.LOGIN, { state: { from: location } })
        }
        return
      }
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
              {/* Direct Offer Banner if targetTasker is present */}
              {targetTasker && (
                <div className="p-4 sm:p-5 rounded-2xl bg-primary-fixed/25 border-2 border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={targetTasker.avatar || DEFAULT_AVATAR}
                      alt={targetTasker.name}
                      className="w-13 h-13 rounded-full object-cover border-2 border-primary shadow-sm shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="primary" icon="bolt" size="xs">
                          Chỉ định trực tiếp
                        </Badge>
                        <span className="font-caption text-xs text-on-surface-variant font-medium">
                          (Direct Offer)
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
                        Gửi yêu cầu trực tiếp cho thợ: <span className="text-primary">{targetTasker.name}</span>
                      </h3>
                      <p className="font-caption text-xs text-on-surface-variant mt-0.5">
                        Hoàn tất địa chỉ và hình ảnh bên dưới. Yêu cầu sẽ được chuyển thẳng tới {targetTasker.name}.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTargetTasker(null)}
                    className="text-xs font-semibold text-on-surface-variant hover:text-error transition-colors underline self-start sm:self-center cursor-pointer shrink-0"
                  >
                    Đổi sang tìm thợ tự do
                  </button>
                </div>
              )}

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
              <TaskBudgetSelector
                amount={amount}
                onChangeAmount={(val) => {
                  setAmount(val)
                  clearFieldError('amount')
                }}
                allowNegotiate={allowNegotiate}
                onChangeAllowNegotiate={setAllowNegotiate}
                error={errors.amount}
              />

              {/* Section 6: Lịch hẹn & Thời lượng (Real-time Date & Start-End Duration) */}
              <TaskScheduleSelector
                selectedDate={selectedDate}
                onChangeSelectedDate={(val) => {
                  setSelectedDate(val)
                  clearFieldError('customDate', 'startTime')
                }}
                customDate={customDate}
                onChangeCustomDate={(val) => {
                  setCustomDate(val)
                  clearFieldError('customDate', 'startTime')
                }}
                startTime={startTime}
                onChangeStartTime={(val) => {
                  setStartTime(val)
                  clearFieldError('startTime', 'scheduleTime')
                }}
                endTime={endTime}
                onChangeEndTime={(val) => {
                  setEndTime(val)
                  clearFieldError('scheduleTime')
                }}
                errors={errors}
              />
              
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
                    {submitting
                      ? 'Đang gửi yêu cầu...'
                      : targetTasker
                      ? `Gửi đề xuất việc trực tiếp cho ${targetTasker.name}`
                      : 'Đăng việc ngay (Miễn phí)'}
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
