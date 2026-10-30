import { useState, useEffect, useMemo } from 'react'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Icon from '../../components/common/Icon'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import HeroSearch from '../../components/home/HeroSearch'
import ServiceCard from '../../components/home/ServiceCard'
import FaqAccordion from '../../components/home/FaqAccordion'
import { fetchServiceCategories } from '../../services/servicesService'
import {
  POPULAR_SERVICES,
  TESTIMONIALS,
} from '../../constants/mockData'

/**
 * TaskMate Homepage - Standardized JSX Component
 */
export default function Homepage({ onNavigate }) {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function loadCategories() {
      try {
        const data = await fetchServiceCategories({ signal: controller.signal })
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCategories(data)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[Homepage] Không thể tải danh mục dịch vụ từ Backend:', err)
        }
      }
    }

    loadCategories()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  // Map danh mục từ DB thành danh sách dịch vụ hiển thị ở mục Tham khảo giá (lấy đúng 6 danh mục để cân đối layout 2x3)
  const popularServicesList = useMemo(() => {
    if (!categories || categories.length === 0) {
      return POPULAR_SERVICES.slice(0, 6)
    }

    // Thứ tự ưu tiên hiển thị các danh mục phổ biến nhất
    const priorityOrder = [
      'lắp ráp',
      'vệ sinh',
      'khoan tường & lắp đặt',
      'sửa chữa nhà',
      'vận chuyển',
      'sân vườn',
      'giao hàng',
    ]

    const sorted = [...categories].sort((a, b) => {
      const idxA = priorityOrder.findIndex((p) =>
        a.name.toLowerCase().includes(p)
      )
      const idxB = priorityOrder.findIndex((p) =>
        b.name.toLowerCase().includes(p)
      )
      const rankA = idxA === -1 ? 99 : idxA
      const rankB = idxB === -1 ? 99 : idxB
      return rankA - rankB
    })

    return sorted.slice(0, 6).map((cat, index) => {
      const bgColors = ['primary', 'secondary', 'tonal']
      const iconBgColor = bgColors[index % bgColors.length]

      let icon = 'handyman'
      const slug = cat.slug || ''
      const lower = cat.name.toLowerCase()
      if (slug === 'furniture-assembly' || lower.includes('lắp ráp')) icon = 'chair'
      else if (slug === 'cleaning' || lower.includes('vệ sinh')) icon = 'cleaning_services'
      else if (slug === 'moving' || lower.includes('vận chuyển')) icon = 'local_shipping'
      else if (slug === 'mounting' || lower.includes('khoan') || lower.includes('lắp đặt')) icon = 'tv'
      else if (slug === 'handyman' || lower.includes('sửa chữa')) icon = 'handyman'
      else if (slug === 'yardwork' || lower.includes('sân vườn') || lower.includes('vườn')) icon = 'yard'
      else if (slug === 'delivery' || lower.includes('giao hàng')) icon = 'delivery_dining'

      let priceText = '~250.000₫ - 400.000₫'
      if (cat.jobs && cat.jobs.length > 0) {
        const prices = cat.jobs
          .map((j) => j.suggestedPrice)
          .filter((p) => typeof p === 'number' && p > 0)
        if (prices.length > 0) {
          const min = Math.min(...prices)
          const max = Math.max(...prices)
          if (min === max) {
            priceText = `~${min.toLocaleString('vi-VN')}₫`
          } else {
            priceText = `~${min.toLocaleString('vi-VN')}₫ - ${max.toLocaleString('vi-VN')}₫`
          }
        }
      }

      return {
        id: cat.id,
        icon,
        iconBgColor,
        title: cat.name,
        description: cat.subtitle || `Dịch vụ ${cat.name.toLowerCase()} chuyên nghiệp, thợ uy tín tại nhà.`,
        priceText,
      }
    })
  }, [categories])

  const handleHeroSearch = (searchData) => {
    if (onNavigate) {
      onNavigate('task-detail', {
        selectedTask: searchData?.selectedTask || {
          title: searchData?.taskQuery,
        },
      })
    }
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Global Header */}
      <Header activePath="home" onNavigate={onNavigate} />

      <main className="w-full pt-20 bg-surface flex-1">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-low via-surface to-surface pb-16 lg:pb-24">
          {/* Ambient blurred background elements */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-fixed/20 blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-secondary-fixed/25 blur-3xl pointer-events-none" />

          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 lg:pt-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Copy & Interactive Search */}
              <div className="lg:col-span-7 flex flex-col gap-6 z-10">
                <Badge variant="primary" icon="payments" iconFilled={true} size="md">
                  Nền tảng đăng việc vặt &amp; tự đề xuất giá #1 Việt Nam
                </Badge>

                <h1 className="font-headline-xl text-2xl sm:text-3xl lg:text-headline-xl text-on-surface tracking-tight leading-tight">
                  Bạn cần việc gì?{' '}
                  <br className="hidden sm:inline" />
                  <span className="text-primary font-extrabold">
                    Tự đưa mức giá bạn muốn, thợ giỏi nhận ngay.
                  </span>
                </h1>

                <p className="font-body-lg text-sm sm:text-base lg:text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                  Đăng việc kèm ngân sách mong muốn. Nhận báo giá hoặc xác nhận từ
                  các Tasker uy tín chỉ sau vài phút. Minh bạch, không lo bị đội
                  giá.
                </p>

                {/* Interactive Search Card */}
                <HeroSearch onSearch={handleHeroSearch} />
              </div>

              {/* Right Column: Visual Collage with verified badges */}
              <div className="lg:col-span-5 relative flex justify-center items-center">
                <div className="relative w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[440px] aspect-[4/5] rounded-xl overflow-hidden shadow-xl bg-surface-container-high mx-auto">
                  <img
                    className="w-full h-full object-cover"
                    alt="Homepage Banner" width="440" height="550" fetchPriority="high" decoding="async"
                    src="/images/banners/matt-adams-optimized.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Trust Proof Micro-Bar */}
            <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 bg-surface-container-lowest/60 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-surface-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed/40 flex items-center justify-center text-primary shrink-0">
                  <Icon name="tune" size={22} />
                </div>
                <div>
                  <h2 className="font-label-md text-label-md font-bold text-on-surface">
                    Tự Chủ Ngân Sách
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Bạn toàn quyền quyết định mức giá công việc
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary shrink-0">
                  <Icon name="security" size={22} />
                </div>
                <div>
                  <h2 className="font-label-md text-label-md font-bold text-on-surface">
                    Bảo Hiểm Tới 20.000.000₫
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Bảo vệ tài sản và công trình cho mỗi đơn
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                  <Icon name="bolt" size={22} />
                </div>
                <div>
                  <h2 className="font-label-md text-label-md font-bold text-on-surface">
                    Thợ Nhận Việc Sau 5 Phút
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Hơn 150.000 thợ sẵn sàng phản hồi đề xuất
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* POPULAR SERVICES SECTION */}
        <section className="w-full py-16 bg-surface">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="font-label-sm text-label-sm font-bold text-primary tracking-wide uppercase">
                  Lựa chọn hàng đầu
                </span>
                <h2 className="font-headline-lg text-xl sm:text-2xl lg:text-headline-lg font-bold text-on-surface mt-1">
                  Tham khảo mức giá cộng đồng đề xuất hôm nay
                </h2>
              </div>
              <a
                className="font-label-md text-label-md text-primary font-bold hover:underline flex items-center gap-1 group"
                href="/services"
                onClick={(e) => {
                  e.preventDefault()
                  if (onNavigate) onNavigate('services')
                }}
              >
                <span>Xem tất cả 45+ dịch vụ</span>
                <Icon
                  name="arrow_forward"
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </a>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularServicesList.map((service, index) => (
                <ServiceCard
                  key={service.id || index}
                  icon={service.icon}
                  iconBgColor={service.iconBgColor}
                  title={service.title}
                  description={service.description}
                  priceText={service.priceText}
                  onClick={() =>
                    onNavigate && onNavigate('services', { categoryId: service.id })
                  }
                />
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="w-full py-16 lg:py-24 bg-surface">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="font-label-sm text-label-sm font-bold text-primary uppercase tracking-wider">
                Trải nghiệm thuận tiện
              </span>
              <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-headline-xl font-bold text-on-surface mt-1">
                Cách TaskMate hoạt động
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-3">
                Chỉ với 4 bước đơn giản, mọi rắc rối việc nhà đều được giải quyết
                nhanh gọn và minh bạch.
              </p>
            </div>

            {/* 4 Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col relative group hover:shadow-md transition-all border border-surface-variant/30">
                <div className="w-12 h-12 rounded-full bg-primary-fixed/40 text-primary font-headline-sm text-headline-sm font-extrabold flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  1
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
                  Đăng việc &amp; Đề xuất giá
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Mô tả công việc, địa điểm và số tiền bạn muốn trả (trọn gói
                  hoặc theo giờ) hoàn toàn theo ngân sách của bạn.
                </p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col relative group hover:shadow-md transition-all border border-surface-variant/30">
                <div className="w-12 h-12 rounded-full bg-secondary-fixed/50 text-secondary font-headline-sm text-headline-sm font-extrabold flex items-center justify-center mb-5 group-hover:bg-secondary-container group-hover:text-on-secondary-container transition-colors">
                  2
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
                  Nhận phản hồi từ Tasker
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Các thợ lành nghề rảnh quanh bạn sẽ nhận việc đúng mức giá của
                  bạn hoặc gửi đề xuất phù hợp nhất trong 5 phút.
                </p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col relative group hover:shadow-md transition-all border border-surface-variant/30">
                <div className="w-12 h-12 rounded-full bg-primary-fixed/40 text-primary font-headline-sm text-headline-sm font-extrabold flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  3
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
                  Chọn thợ &amp; Trao đổi
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Xem hồ sơ, hình ảnh thực tế và hàng trăm đánh giá sao chân thực
                  của thợ, sau đó chốt lịch hẹn qua nhắn tin trực tiếp.
                </p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col relative group hover:shadow-md transition-all border border-surface-variant/30">
                <div className="w-12 h-12 rounded-full bg-surface-container-high text-primary font-headline-sm text-headline-sm font-extrabold flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  4
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
                  Nghiệm thu &amp; Thanh toán
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Chỉ thanh toán khi công việc đã hoàn thành ưng ý 100% qua ví
                  điện tử hoặc chuyển khoản an toàn, không phát sinh chi phí.
                </p>
              </div>
            </div>

            {/* Process Visual Accent Callout */}
            <div className="mt-12 p-6 rounded-xl bg-primary-fixed/30 flex flex-col md:flex-row items-center justify-between gap-6 border border-primary/20">
              <div className="flex items-center gap-4">
                <Icon name="schedule" size={36} className="text-primary" />
                <div>
                  <h4 className="font-headline-sm text-headline-sm font-bold text-on-primary-fixed">
                    Cần hỗ trợ gấp trong 60 phút?
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-primary-fixed-variant">
                    Hơn 400 thợ phản hồi ngay lập tức cho các sự cố rò rỉ điện
                    nước và dọn trọ khẩn cấp.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate && onNavigate('search')}
              >
                Đặt thợ khẩn cấp
              </Button>
            </div>
          </div>
        </section>

        {/* TRUST, SAFETY & HAPPINESS PLEDGE SECTION */}
        <section className="w-full py-16 bg-surface-container-lowest border-y border-surface-variant/30">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left: Badge story block */}
              <div className="lg:col-span-5 bg-gradient-to-br from-primary-fixed/20 via-surface-container to-surface p-8 rounded-xl shadow-sm flex flex-col justify-between border border-surface-variant/40">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md">
                    <Icon name="verified_user" size={28} />
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm font-bold text-primary uppercase">
                      Cam kết dịch vụ
                    </span>
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                      TaskMate Happiness Pledge™
                    </h3>
                  </div>
                </div>

                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
                  Chúng tôi hiểu rằng ngôi nhà là không gian thiêng liêng và riêng
                  tư nhất. Cam kết Hạnh Phúc của TaskMate bảo đảm rằng nếu bạn
                  không hài lòng về chất lượng công việc, chúng tôi sẽ nỗ lực
                  khắc phục miễn phí hoặc hoàn tiền.
                </p>

                <div className="p-4 rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-between border border-surface-variant/30">
                  <div>
                    <span className="font-caption text-caption text-outline block">
                      Mức bảo hiểm trách nhiệm
                    </span>
                    <span className="font-headline-md text-headline-md font-extrabold text-primary">
                      Tối đa 20.000.000₫
                    </span>
                  </div>
                  <Icon
                    name="verified"
                    size={32}
                    className="text-secondary-fixed-dim"
                  />
                </div>
              </div>

              {/* Right: 3 Value Pillars */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-start gap-4 p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-surface-variant/20">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed/50 text-primary flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Icon name="payments" size={20} filled={true} />
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Tự do thương lượng &amp; Tự quyết định giá
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Nền tảng đăng việc vặt và đề xuất giá minh bạch hàng đầu Việt
                      Nam, không lo bị kê khống chi phí phát sinh.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-surface-variant/20">
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Icon name="shield" size={20} />
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Bảo hiểm thiệt hại tài sản minh bạch
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Hợp tác cùng đối tác bảo hiểm hàng đầu nhằm bảo vệ gia đình
                      bạn trước các sự cố rủi ro hỏng hóc đồ đạc trong suốt thời
                      gian Tasker làm việc tại nhà.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-surface-variant/20">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Icon name="support_agent" size={20} />
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Hỗ trợ khách hàng chuyên trách 24/7
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Đội ngũ chăm sóc khách hàng bản địa sẵn sàng can thiệp qua
                      Hotline và LiveChat trong từng công đoạn: từ điều phối thợ
                      đến giải quyết khiếu nại.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BECOME A TASKER RECRUITMENT BANNER */}
        <section className="w-full py-16 bg-surface">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="relative rounded-2xl overflow-hidden bg-primary-container text-on-primary shadow-xl">
              <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-primary/40 blur-2xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 relative z-10">
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <Badge variant="secondary" icon="payments" iconFilled={true} size="md">
                    Gia tăng thu nhập vững chắc
                  </Badge>

                  <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-headline-xl font-bold tracking-tight leading-tight">
                    Tự làm chủ thời gian. <br />
                    Kiếm tới 25.000.000₫/tháng cùng TaskMate.
                  </h2>

                  <p className="font-body-md text-body-md text-on-primary-container max-w-lg leading-relaxed">
                    Đăng việc kèm ngân sách mong muốn. Nhận báo giá hoặc xác nhận từ
                    các Tasker uy tín chỉ sau vài phút. Minh bạch, không lo bị đội
                    giá.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
                    <div className="p-3 rounded-lg bg-primary/40 flex flex-col">
                      <span className="font-headline-sm text-headline-sm font-bold text-secondary-fixed">
                        100%
                      </span>
                      <span className="font-caption text-caption text-surface-variant">
                        Tự chủ chọn lịch làm việc
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/40 flex flex-col">
                      <span className="font-headline-sm text-headline-sm font-bold text-secondary-fixed">
                        0 đồng
                      </span>
                      <span className="font-caption text-caption text-surface-variant">
                        Phí đăng ký tài khoản thợ
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/40 flex flex-col">
                      <span className="font-headline-sm text-headline-sm font-bold text-secondary-fixed">
                        24h
                      </span>
                      <span className="font-caption text-caption text-surface-variant">
                        Rút tiền về tài khoản linh hoạt
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => onNavigate && onNavigate('become-tasker')}
                    >
                      Đăng ký nhận việc ngay
                    </Button>
                    <a
                      className="font-label-md text-label-md text-on-primary hover:underline flex items-center gap-1"
                      href="#tasker-benefits"
                      onClick={(e) => {
                        e.preventDefault()
                        if (onNavigate) onNavigate('become-tasker')
                      }}
                    >
                      <span>Tìm hiểu thêm về quyền lợi Tasker</span>
                      <Icon name="chevron_right" size={18} />
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-sm aspect-[4/4] rounded-xl overflow-hidden shadow-lg bg-primary">
                    <img
                      className="w-full h-full object-cover"
                      alt="Successful Tasker"
                      src="/images/banners/become-tasker.jpg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CUSTOMER TESTIMONIALS & FAQ SECTION */}
        <section className="w-full py-16 bg-surface-container-low">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="font-label-sm text-label-sm font-bold text-primary uppercase tracking-wider">
                Cộng đồng tin chọn
              </span>
              <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-headline-xl font-bold text-on-surface mt-1">
                Khách hàng nói gì về TaskMate?
              </h2>
            </div>

            {/* Testimonial Cards Mosaic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {TESTIMONIALS.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between border border-surface-variant/30"
                >
                  <div>
                    <div className="flex items-center text-secondary gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, sIdx) => (
                        <Icon
                          key={sIdx}
                          name="star"
                          size={20}
                          filled={true}
                          className="text-secondary"
                        />
                      ))}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant italic leading-relaxed">
                      "{item.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-surface-variant/20">
                    <img
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/10"
                      alt={item.author}
                      src={item.avatar}
                    />
                    <div>
                      <h5 className="font-label-md text-label-md font-bold text-on-surface">
                        {item.author}
                      </h5>
                      <span className="font-caption text-caption text-outline">
                        {item.location}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ Accordion */}
            <FaqAccordion />
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION STRIP */}
        <section className="w-full py-12 bg-primary text-on-primary">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-headline-lg text-xl sm:text-2xl lg:text-headline-lg font-bold">
                Có việc cần làm? Đăng ngay với mức giá của bạn
              </h2>
              <p className="font-body-md text-body-md text-on-primary-container mt-1">
                Hơn 500+ thợ lành nghề đang sẵn sàng nhận việc với mức thù lao
                bạn đề xuất.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="white"
                size="lg"
                icon="add_task"
                onClick={() => onNavigate && onNavigate('search')}
              >
                Đăng việc &amp; Đề xuất giá ngay
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




