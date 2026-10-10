import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Icon from '../components/common/Icon'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import { fetchServiceCategories } from '../services/servicesService'

/**
 * TaskMate Services Page - Modeled after TaskRabbit /services
 * Dynamically fetches categories & jobs from ASP.NET Core Backend (MySQL)
 */
export default function Services({ onNavigate }) {
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(
    location.state?.categoryId || location.state?.selectedCategory || 'all'
  )

  useEffect(() => {
    if (location.state?.categoryId) {
      setActiveCategoryFilter(location.state.categoryId)
    } else if (location.state?.selectedCategory) {
      setActiveCategoryFilter(location.state.selectedCategory)
    }
  }, [location.state])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function loadCategories() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchServiceCategories({ signal: controller.signal })
        if (isMounted) {
          setCategories(data || [])
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
          setError('Không thể tải danh sách dịch vụ. Vui lòng kiểm tra lại kết nối.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadCategories()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  // Filter categories and their jobs based on search query and category filter
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return categories
      .filter((cat) => {
        if (activeCategoryFilter !== 'all' && cat.id !== activeCategoryFilter) {
          return false
        }
        return true
      })
      .map((cat) => {
        if (!query) return cat

        // If category name or subtitle matches query, keep all jobs
        const catMatches =
          cat.name.toLowerCase().includes(query) ||
          (cat.subtitle && cat.subtitle.toLowerCase().includes(query))

        if (catMatches) return cat

        // Filter jobs matching query
        const matchingJobs = cat.jobs.filter(
          (j) =>
            j.name.toLowerCase().includes(query) ||
            (j.description && j.description.toLowerCase().includes(query))
        )

        return {
          ...cat,
          jobs: matchingJobs,
        }
      })
      .filter((cat) => cat.jobs && cat.jobs.length > 0)
  }, [categories, searchQuery, activeCategoryFilter])

  const handleSelectJob = (category, job) => {
    if (onNavigate) {
      onNavigate('task-detail', {
        selectedTask: {
          title: job.name,
          requiredSkillId: job.id,
          categoryName: category.name,
          offeredPrice: job.suggestedPrice || 300000,
        },
      })
    }
  }

  const handleSelectCategory = (category) => {
    if (onNavigate) {
      onNavigate('task-detail', {
        selectedTask: {
          title: category.jobs?.[0]?.name || category.name,
          requiredSkillId: category.jobs?.[0]?.id,
          categoryName: category.name,
        },
      })
    }
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Global Header */}
      <Header activePath="services" onNavigate={onNavigate} />

      <main className="w-full pt-20 bg-surface flex-1">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden bg-surface-container-low border-b border-surface-variant/30">
          {/* Ambient blurred lights */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-fixed/20 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-secondary-fixed/20 blur-3xl pointer-events-none" />

          <div className="max-w-[1240px] mx-auto px-6 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Title & Search */}
              <div className="lg:col-span-7 flex flex-col gap-5 z-10">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" icon="home_repair_service" size="sm">
                    Dịch vụ TaskMate
                  </Badge>
                  <span className="text-on-surface-variant text-caption font-medium">
                    Hơn 40+ tiện ích việc nhà
                  </span>
                </div>

                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-tight">
                  Để việc nhà cho <span className="text-primary font-extrabold">TaskMate</span> lo.
                </h1>

                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                  Tìm thợ uy tín nhanh chóng, giá minh bạch. Từ lắp ráp đồ nội thất IKEA,
                  sửa chữa điện nước, khoan tường cho đến chuyển nhà và dọn dẹp không gian sống.
                </p>

                {/* Instant Search Bar */}
                <div className="relative w-full max-w-xl mt-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-on-surface-variant flex items-center pointer-events-none">
                      <Icon name="search" size={22} className="text-primary" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm công việc (vd: lắp ráp bàn, khoan tường, sửa điện...)"
                      className="w-full pl-12 pr-10 py-3.5 bg-surface-container-lowest rounded-full border border-surface-variant/40 focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm text-on-surface placeholder:text-on-surface-variant/60 font-body-md transition-all outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full cursor-pointer"
                        title="Xoá tìm kiếm"
                      >
                        <Icon name="close" size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Graphic */}
              <div className="lg:col-span-5 relative hidden lg:flex justify-end">
                <div className="relative w-full max-w-[420px] h-[280px] rounded-2xl overflow-hidden shadow-lg border border-surface-variant/30">
                  <img
                    src="/images/services/services-hero.jpg"
                    alt="TaskMate Services"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-transparent flex items-end p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                        <Icon name="verified" size={24} />
                      </div>
                      <div>
                        <p className="font-label-md text-label-md font-bold text-on-surface">
                          100% Thợ được thẩm định
                        </p>
                        <p className="font-caption text-caption text-on-surface-variant">
                          Bảo hiểm trách nhiệm & cam kết chất lượng
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK CATEGORY FILTER PILLS */}
        <section className="w-full bg-surface-container-lowest border-b border-surface-variant/30 sticky top-20 z-30">
          <div className="max-w-[1240px] mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-4 py-2 rounded-full font-label-md text-label-md shrink-0 transition-colors cursor-pointer ${
                activeCategoryFilter === 'all'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
              }`}
            >
              Tất cả danh mục ({categories.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-4 py-2 rounded-full font-label-md text-label-md shrink-0 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeCategoryFilter === cat.id
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-black/10">
                  {cat.jobs?.length || 0}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* SERVICES CATEGORIES CARDS GRID */}
        <section className="w-full py-12 lg:py-16">
          <div className="max-w-[1240px] mx-auto px-6">
            {/* Loading State */}
            {loading && (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="font-label-md text-label-md text-on-surface-variant font-medium">
                  Đang tải danh mục dịch vụ từ hệ thống...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-8 rounded-2xl bg-error-container/20 border border-error/20 text-center max-w-lg mx-auto my-12">
                <Icon name="error" size={36} className="text-error mx-auto mb-2" />
                <p className="font-label-lg text-label-lg font-bold text-on-surface">{error}</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </Button>
              </div>
            )}

            {/* Empty Search Results */}
            {!loading && !error && filteredCategories.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <Icon name="search_off" size={48} className="text-outline" />
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Không tìm thấy dịch vụ phù hợp
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                  Không có công việc nào khớp với từ khoá "{searchQuery}". Bạn có thể thử tìm với từ khoá khác hoặc tạo công việc tuỳ chỉnh.
                </p>
                <Button
                  variant="tonal"
                  size="md"
                  className="mt-2"
                  onClick={() => setSearchQuery('')}
                >
                  Xem tất cả dịch vụ
                </Button>
              </div>
            )}

            {/* Grid of Category Cards */}
            {!loading && !error && filteredCategories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-surface-container-lowest rounded-2xl border border-surface-variant/30 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
                  >
                    {/* Card Image Banner */}
                    <div className="relative h-48 w-full overflow-hidden bg-surface-container-high">
                      <img
                        src={category.imageUrl || '/images/services/handyman.jpg'}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                        <span className="font-headline-sm text-xl font-bold drop-shadow">
                          {category.name}
                        </span>
                        <span className="font-caption text-xs bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                          {category.jobs?.length || 0} công việc
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      {/* Subtitle */}
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed min-h-[40px]">
                        {category.subtitle}
                      </p>

                      {/* Job List */}
                      <div className="border-t border-surface-variant/20 pt-3 flex flex-col gap-1.5 flex-1">
                        <span className="font-label-sm text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                          Các công việc tiêu biểu:
                        </span>
                        {category.jobs.map((job) => (
                          <div
                            key={job.id}
                            onClick={() => handleSelectJob(category, job)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-primary-fixed/20 transition-colors cursor-pointer group/job"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <Icon
                                name={job.icon || 'task_alt'}
                                size={18}
                                className="text-primary shrink-0 transition-transform group-hover/job:scale-110"
                              />
                              <span className="font-label-md text-sm font-medium text-on-surface group-hover/job:text-primary transition-colors truncate">
                                {job.name}
                              </span>
                            </div>

                            <span className="font-caption text-xs font-semibold text-primary/90 shrink-0 ml-2">
                              {job.suggestedPrice
                                ? `~${job.suggestedPrice.toLocaleString('vi-VN')}₫`
                                : 'Thương lượng'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Card Action */}
                      <div className="pt-2">
                        <Button
                          variant="tonal"
                          size="sm"
                          icon="arrow_forward"
                          className="w-full rounded-xl justify-center font-bold text-primary"
                          onClick={() => handleSelectCategory(category)}
                        >
                          Đặt việc trong danh mục này
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* TRUST & SAFETY GUARANTEE (TASKMATE PLEDGE) */}
        <section className="w-full bg-surface-container-low py-14 border-t border-surface-variant/30">
          <div className="max-w-[1240px] mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge variant="primary" icon="shield" size="sm" className="mb-3">
                Cam kết chất lượng
              </Badge>
              <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                Tại sao chọn TaskMate cho việc nhà của bạn?
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                Chúng tôi mang đến sự an tâm tuyệt đối với quy trình thẩm định nghiêm ngặt và chính sách bảo vệ khách hàng.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-variant/30 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon name="verified_user" size={26} />
                </div>
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                  Đã thẩm định 100%
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Mỗi thợ Tasker đều được xác thực CCCD, thông tin liên lạc và kiểm tra tay nghề trước khi nhận việc.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-variant/30 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary-container/20 text-secondary-container flex items-center justify-center shrink-0">
                  <Icon name="payments" size={26} />
                </div>
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                  Chủ động đề xuất giá
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Bạn đưa ra mức ngân sách kỳ vọng. Thỏa thuận minh bạch, tuyệt đối không phát sinh phụ phí ẩn.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-variant/30 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon name="health_and_safety" size={26} />
                </div>
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                  Bảo hiểm trách nhiệm
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Bảo hiểm trách nhiệm thi công lên đến 20.000.000₫ cho mỗi công việc thực hiện trên hệ thống.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-variant/30 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-tertiary-container/20 text-tertiary flex items-center justify-center shrink-0">
                  <Icon name="support_agent" size={26} />
                </div>
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                  Hỗ trợ tận tâm 24/7
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Đội ngũ chăm sóc khách hàng túc trực hỗ trợ bạn từ khi đăng việc đến khi nghiệm thu hoàn tất.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 STEPS HOW IT WORKS */}
        <section className="w-full py-16 border-t border-surface-variant/30">
          <div className="max-w-[1240px] mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                Hoàn thành công việc chỉ trong 3 bước
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                Trải nghiệm đặt việc đơn giản, thuận tiện và an toàn
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-container-low border border-surface-variant/20">
                <div className="w-14 h-14 rounded-full bg-primary text-on-primary font-headline-md font-bold flex items-center justify-center mb-4 shadow-md">
                  1
                </div>
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface mb-2">
                  Chọn việc &amp; Đặt thời gian
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Chọn dịch vụ phù hợp trong danh mục, mô tả nhu cầu và hẹn giờ bạn mong muốn thợ có mặt.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-container-low border border-surface-variant/20">
                <div className="w-14 h-14 rounded-full bg-primary text-on-primary font-headline-md font-bold flex items-center justify-center mb-4 shadow-md">
                  2
                </div>
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface mb-2">
                  Đề xuất ngân sách
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Tự đưa mức thù lao bạn muốn chi trả hoặc duyệt thợ giỏi nhận việc sau vài phút.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-container-low border border-surface-variant/20">
                <div className="w-14 h-14 rounded-full bg-primary text-on-primary font-headline-md font-bold flex items-center justify-center mb-4 shadow-md">
                  3
                </div>
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface mb-2">
                  Nghiệm thu &amp; Thanh toán
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Thợ đến tận nhà thực hiện. Bạn chỉ thanh toán khi đã hoàn toàn hài lòng với chất lượng công việc.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-14">
          <div className="max-w-[1240px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <h2 className="font-headline-lg text-headline-lg font-extrabold text-white">
                Sẵn sàng giải quyết danh sách việc cần làm?
              </h2>
              <p className="font-body-md text-white/90 mt-2 max-w-xl">
                Đăng việc ngay bây giờ để nhận phản hồi nhanh chóng từ các chuyên gia khu vực của bạn.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-bold rounded-full shadow-lg"
                onClick={() => onNavigate && onNavigate('task-detail')}
              >
                Đăng việc mới ngay
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  )
}
