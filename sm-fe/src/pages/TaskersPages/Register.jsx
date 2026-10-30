import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import Button from '../../components/common/Button'
import DistrictMultiSelector from '../../components/common/DistrictMultiSelector'
import TaskSearchInput from '../../components/common/TaskSearchInput'
import { useAuth } from '../../hooks/useAuth'
import { updateWorkerProfileApi } from '../../services/authService'
import { fetchServiceCategories } from '../../services/servicesService'
import { TASKMATE_LOGO_URL } from '../../assets/constants'
import { ROUTES } from '../../routes/paths'

/**
 * Tasker Registration Page (Trở thành Tasker)
 * Tuân thủ rule.md:
 * - Tái sử dụng DistrictMultiSelector và TaskSearchInput từ src/components/common/
 * - Gọi API qua updateWorkerProfileApi trong authService
 * - Tự động tạo bản ghi worker_profiles, cấp vai trò TASKER và điều hướng vào Tasker Dashboard
 */
export default function Register({ onNavigate }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, updateUser, isAuthenticated } = useAuth()

  const [districts, setDistricts] = useState(() => user?.workerProfile?.serviceDistricts || [])
  const [skills, setSkills] = useState(() => user?.workerProfile?.skills || [])
  const [categories, setCategories] = useState([])
  const [skillSearchQuery, setSkillSearchQuery] = useState('')
  const [description, setDescription] = useState(() => user?.workerProfile?.description || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Tải danh mục dịch vụ mẫu từ backend để gợi ý chọn nhanh
  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    fetchServiceCategories({ signal: controller.signal })
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setCategories(data)
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  // Xử lý thêm khu vực hoạt động
  const handleAddDistrict = (district) => {
    setDistricts((prev) => {
      if (prev.some((d) => d.districtCode === district.districtCode)) return prev
      return [...prev, district]
    })
    setErrorMessage('')
  }

  // Xử lý xoá khu vực hoạt động
  const handleRemoveDistrict = (districtCode) => {
    setDistricts((prev) => prev.filter((d) => d.districtCode !== districtCode))
  }

  // Xử lý thêm kỹ năng qua gợi ý search
  const handleSelectSkillSuggestion = (item) => {
    if (!item?.skillId) return
    setSkills((prev) => {
      if (prev.some((s) => s.skillId === item.skillId)) return prev
      return [
        ...prev,
        {
          skillId: item.skillId,
          skillName: item.title,
          categoryName: item.categoryName,
        },
      ]
    })
    setSkillSearchQuery('')
    setErrorMessage('')
  }

  // Chọn nhanh kỹ năng từ danh mục phổ biến
  const handleQuickAddSkill = (job, categoryName) => {
    setSkills((prev) => {
      if (prev.some((s) => s.skillId === job.id)) return prev
      return [
        ...prev,
        {
          skillId: job.id,
          skillName: job.name,
          categoryName,
        },
      ]
    })
    setErrorMessage('')
  }

  // Xử lý xoá kỹ năng đã chọn
  const handleRemoveSkill = (skillId) => {
    setSkills((prev) => prev.filter((s) => s.skillId !== skillId))
  }

  // Submit form đăng ký Thợ
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!isAuthenticated || !token) {
      if (onNavigate) {
        onNavigate('login', { from: location })
      } else {
        navigate(ROUTES.LOGIN, { state: { from: location } })
      }
      return
    }

    if (districts.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 Quận/Huyện trong khu vực hoạt động của bạn.')
      return
    }

    if (skills.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 loại công việc hoặc kỹ năng nhận việc.')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        description:
          description.trim() ||
          'Đối tác Thợ chuyên nghiệp trên TaskMate, làm việc uy tín, trách nhiệm và đúng giờ.',
        skillIds: skills.map((s) => s.skillId),
        serviceDistricts: districts.map((d) => ({
          provinceCode: d.provinceCode,
          provinceName: d.provinceName,
          districtCode: d.districtCode,
          districtName: d.districtName,
        })),
        status: 'ONLINE',
      }

      // Gọi API backend: Tạo WorkerProfile, cấp role TASKER và nhận JWT token mới
      const updatedUser = await updateWorkerProfileApi(token, payload)
      updateUser(updatedUser, updatedUser.token)

      // Điều hướng ngay vào Bảng điều khiển Thợ
      if (onNavigate) {
        onNavigate('tasker-dashboard')
      } else {
        navigate(ROUTES.TASKER_DASHBOARD)
      }
    } catch (err) {
      if (
        err.status === 401 ||
        err.message?.includes('token') ||
        err.message?.includes('đăng nhập') ||
        err.message?.includes('Unauthorized')
      ) {
        if (onNavigate) {
          onNavigate('login', { from: location })
        } else {
          navigate(ROUTES.LOGIN, { state: { from: location } })
        }
        return
      }
      setErrorMessage(err.message || 'Đăng ký trở thành Tasker thất bại. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col">
      {/* Top Header tối giản: Logo thương hiệu TaskMate, bỏ 3 nút góc trên */}
      <header className="w-full border-b border-surface-variant/30 bg-surface-container-lowest sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none">
            <img
              alt="TaskMate Brand Logo"
              className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
              src={TASKMATE_LOGO_URL}
            />
            <span className="font-headline-sm text-lg sm:text-xl font-bold tracking-tight text-primary">
              TaskMate
            </span>
          </Link>

          <Link
            to={ROUTES.HOME}
            className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Icon name="arrow_back" size={16} />
            <span>Trang chủ</span>
          </Link>
        </div>
      </header>

      {/* Main Registration Content: 2 Cột */}
      <main className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 flex-1">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
          {/* Cột bên trái: Ảnh James Kovin Banner */}
          <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col gap-6">
            <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-surface-container aspect-[4/3] sm:aspect-[4/4] border border-surface-variant/30">
              <img
                alt="Đối tác Thợ chuyên nghiệp TaskMate"
                className="w-full h-full object-cover object-center transform transition-transform duration-500 hover:scale-[1.02]"
                src="/images/banners/james-kovin-qqLxF3M-MA8-unsplash.jpg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
                <span className="text-xs uppercase tracking-wider font-extrabold text-secondary-fixed">
                  Cộng đồng Đối tác TaskMate
                </span>
                <h3 className="text-base sm:text-lg font-bold mt-1">
                  Chủ động thời gian, thu nhập không giới hạn
                </h3>
                <p className="text-xs text-white/80 mt-1">
                  Kết nối hàng ngàn khách hàng có nhu cầu sửa chữa, lắp ráp và dọn dẹp mỗi ngày.
                </p>
              </div>
            </div>

            {/* Quyền lợi nổi bật */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 border border-surface-variant/30 space-y-4">
              <h4 className="font-label-lg text-sm font-bold text-on-surface flex items-center gap-2">
                <Icon name="verified" size={20} className="text-primary" />
                <span>Quyền lợi khi trở thành Tasker</span>
              </h4>
              <ul className="space-y-3 text-xs text-on-surface-variant">
                <li className="flex items-start gap-2.5">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-on-surface">Bảo vệ thanh toán Escrow:</strong> Tiền công
                    được khách cọc trước, nhận ngay khi hoàn thành việc.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-on-surface">Tự do nhận việc:</strong> Linh hoạt chọn ca
                    làm việc, khu vực và mức thù lao theo mong muốn.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-on-surface">Không phí duy trì tài khoản:</strong> Đăng ký
                    hoàn toàn miễn phí, hỗ trợ kỹ thuật và cộng đồng 24/7.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Cột bên phải: Biểu mẫu đăng ký Hồ sơ Thợ */}
          <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col">
            <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-surface-variant/30 space-y-5 sm:space-y-6">
              <div>
                <span className="font-label-sm text-xs font-bold text-primary uppercase tracking-wider">
                  Đăng ký Đối tác Thợ
                </span>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
                  Kiếm thêm thu nhập theo cách của bạn
                </h1>
                <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1.5 sm:mt-2 leading-relaxed">
                  Điền khu vực hoạt động và các công việc bạn thành thạo để hệ thống tự động kết nối
                  khách hàng phù hợp nhất tới bạn.
                </p>
              </div>

              {/* Thông báo lỗi nếu có */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-3">
                  <Icon name="error" size={18} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Chọn khu vực hoạt động (Dùng DistrictMultiSelector chung của Profile) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-label-md text-sm font-bold text-on-surface">
                      Khu vực hoạt động <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-on-surface-variant">
                      Đã chọn: <strong className="text-primary">{districts.length}</strong> quận/huyện
                    </span>
                  </div>
                  <p className="font-caption text-xs text-on-surface-variant mb-3">
                    Chọn Tỉnh/Thành và Quận/Huyện bạn có thể di chuyển đến nhận việc:
                  </p>
                  <DistrictMultiSelector
                    districts={districts}
                    onAddDistrict={handleAddDistrict}
                    onRemoveDistrict={handleRemoveDistrict}
                  />
                </div>

                {/* 2. Chọn loại công việc & kỹ năng (Dùng TaskSearchInput & Quick Pick) */}
                <div className="space-y-3 pt-2 border-t border-surface-variant/20">
                  <div className="flex items-center justify-between">
                    <label className="block font-label-md text-sm font-bold text-on-surface">
                      Loại việc &amp; Chuyên môn nhận việc <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-on-surface-variant">
                      Đã chọn: <strong className="text-primary">{skills.length}</strong> chuyên môn
                    </span>
                  </div>

                  {/* Thanh tìm kiếm kỹ năng nhanh */}
                  <TaskSearchInput
                    id="register-skill-search"
                    label=""
                    placeholder="Tìm việc bạn nhận làm (vd: Lắp tủ, sửa điện, thông ống nước, dọn nhà...)"
                    value={skillSearchQuery}
                    onChange={setSkillSearchQuery}
                    onSelectTask={handleSelectSkillSuggestion}
                  />

                  {/* Danh sách kỹ năng đã chọn */}
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {skills.map((s) => (
                        <span
                          key={s.skillId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-bold text-xs border border-primary/20"
                        >
                          <Icon name="build" size={14} />
                          <span>{s.skillName}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(s.skillId)}
                            className="text-on-surface-variant hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                            title="Xóa kỹ năng này"
                          >
                            <Icon name="close" size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      Chưa có kỹ năng nào được chọn. Hãy tìm kiếm ở trên hoặc chọn nhanh từ các danh mục gợi ý bên dưới.
                    </p>
                  )}

                  {/* Gợi ý chọn nhanh từ các danh mục phổ biến */}
                  {categories.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-semibold text-on-surface-variant block">
                        Hoặc chọn nhanh từ danh mục phổ biến:
                      </span>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border border-surface-variant/20 rounded-2xl bg-surface-container-low/40">
                        {categories.flatMap((cat) =>
                          (cat.jobs || []).map((job) => {
                            const isSelected = skills.some((s) => s.skillId === job.id)
                            return (
                              <button
                                key={job.id}
                                type="button"
                                onClick={() =>
                                  isSelected
                                    ? handleRemoveSkill(job.id)
                                    : handleQuickAddSkill(job, cat.name)
                                }
                                className={`text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                                  isSelected
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-surface-variant/30'
                                }`}
                              >
                                {isSelected ? '✓ ' : '+ '}
                                {job.name}
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Giới thiệu bản thân ngắn gọn */}
                <div className="space-y-2 pt-2 border-t border-surface-variant/20">
                  <label
                    htmlFor="tasker-desc"
                    className="block font-label-md text-sm font-bold text-on-surface"
                  >
                    Giới thiệu bản thân &amp; Kinh nghiệm làm việc
                  </label>
                  <textarea
                    id="tasker-desc"
                    rows={3}
                    placeholder="Mô tả ngắn gọn về tay nghề, trang bị dụng cụ, số năm kinh nghiệm hoặc phương châm làm việc của bạn..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-surface-variant/40 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Nút Hoàn tất đăng ký */}
                <div className="pt-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full justify-center py-4 rounded-2xl text-base font-bold shadow-md cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang thiết lập hồ sơ Thợ...</span>
                      </span>
                    ) : (
                      'Hoàn tất đăng ký & Bắt đầu nhận việc'
                    )}
                  </Button>
                </div>

                <p className="text-[11px] text-center text-on-surface-variant leading-relaxed">
                  Bằng việc bấm đăng ký, bạn xác nhận đồng ý với Quy chế hoạt động đối tác và Tiêu chuẩn
                  chất lượng thợ của TaskMate.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}