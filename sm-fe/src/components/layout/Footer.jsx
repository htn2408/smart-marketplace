import { useNavigate } from 'react-router-dom'
import { TASKMATE_LOGO_URL } from '../../assets/constants'
import Icon from '../common/Icon'
import Badge from '../common/Badge'
import { ROUTES } from '../../routes/paths'

/**
 * Standardized Global Footer for TaskMate
 */
export default function Footer({ onNavigate }) {
  const navigate = useNavigate()

  const handleLinkClick = (e, path) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(path)
    } else {
      const routeMap = {
        home: ROUTES.HOME,
        services: ROUTES.SERVICES,
        search: ROUTES.CLIENT_FILTER_TASKER,
        'become-tasker': ROUTES.TASKER_REGISTER,
        'task-detail': ROUTES.CLIENT_TASK_DETAIL,
        'my-tasks': ROUTES.CLIENT_TASKS,
        profile: ROUTES.CLIENT_PROFILE,
      }
      navigate(routeMap[path] || ROUTES.HOME)
    }
  }

  return (
    <footer className="w-full bg-surface-container-low pt-10 sm:pt-16 pb-8 sm:pb-12 mt-8 sm:mt-10">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-8 sm:pb-12 border-b border-surface-variant/40">
          {/* Brand Info */}
          <div className="lg:col-span-2 flex flex-col items-start gap-4 pr-0 lg:pr-8">
            <div className="flex items-center gap-3">
              <img
                alt="TaskMate Brand Logo"
                className="h-7 w-auto object-contain"
                src={TASKMATE_LOGO_URL}
              />
              <span className="sr-only">TaskMate</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
              Nền tảng kết nối dịch vụ sửa chữa và bảo dưỡng gia đình hàng đầu.
              Trao gửi không gian sống an tâm đến hàng triệu gia đình với đội ngũ
              thợ lành nghề, minh bạch giá cả và được xác thực đa tầng.
            </p>
            <Badge variant="primary" icon="verified_user" size="md">
              Cam kết Hài lòng 100% (Happiness Pledge)
            </Badge>
          </div>

          {/* Column 1: Services */}
          <div className="flex flex-col gap-3">
            <h4 className="font-label-lg text-label-lg font-bold text-on-surface">
              Khám phá dịch vụ
            </h4>
            <ul className="flex flex-col gap-2.5 font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <a
                  className="hover:text-primary transition-colors"
                  href="#services"
                  onClick={(e) => handleLinkClick(e, 'services')}
                >
                  Lắp ráp nội thất
                </a>
              </li>
              <li>
                <a
                  className="hover:text-primary transition-colors"
                  href="#services"
                  onClick={(e) => handleLinkClick(e, 'services')}
                >
                  Dọn dẹp nhà cửa
                </a>
              </li>
              <li>
                <a
                  className="hover:text-primary transition-colors"
                  href="#services"
                  onClick={(e) => handleLinkClick(e, 'services')}
                >
                  Sửa chữa điện nước
                </a>
              </li>
              <li>
                <a
                  className="hover:text-primary transition-colors"
                  href="#services"
                  onClick={(e) => handleLinkClick(e, 'services')}
                >
                  Vận chuyển đồ đạc
                </a>
              </li>
              <li>
                <a
                  className="hover:text-primary transition-colors"
                  href="#services"
                  onClick={(e) => handleLinkClick(e, 'services')}
                >
                  Sơn sửa &amp; Decor
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: For Taskers */}
          <div className="flex flex-col gap-3">
            <h4 className="font-label-lg text-label-lg font-bold text-on-surface">
              Dành cho Tasker
            </h4>
            <ul className="flex flex-col gap-2.5 font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <a
                  className="hover:text-primary transition-colors"
                  href="#profile"
                  onClick={(e) => handleLinkClick(e, 'profile')}
                >
                  Hồ sơ Tasker mẫu
                </a>
              </li>
              <li>
                <a
                  className="hover:text-primary transition-colors"
                  href="#become-tasker"
                  onClick={(e) => handleLinkClick(e, 'become-tasker')}
                >
                  Quyền lợi Tasker
                </a>
              </li>
              <li>
                <a
                  className="hover:text-primary transition-colors"
                  href="#become-tasker"
                  onClick={(e) => handleLinkClick(e, 'become-tasker')}
                >
                  Đăng ký đối tác
                </a>
              </li>
              <li>
                <a
                  className="hover:text-primary transition-colors"
                  href="#safety"
                  onClick={(e) => handleLinkClick(e, 'trust')}
                >
                  Cẩm nang an toàn
                </a>
              </li>
              <li>
                <a
                  className="hover:text-primary transition-colors"
                  href="#community"
                  onClick={(e) => handleLinkClick(e, 'search')}
                >
                  Cộng đồng thợ lành nghề
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Help */}
          <div className="flex flex-col gap-3">
            <h4 className="font-label-lg text-label-lg font-bold text-on-surface">
              Hỗ trợ &amp; Pháp lý
            </h4>
            <ul className="flex flex-col gap-2.5 font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Trung tâm trợ giúp
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Chính sách bảo hiểm
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Điều khoản dịch vụ
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Middle Utility & App Download Strip */}
        <div className="py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 border-b border-surface-variant/40 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-sm">
              <Icon name="language" size={18} className="text-on-surface-variant" />
              <span>Tiếng Việt</span>
              <span className="text-outline-variant">•</span>
              <span>VND (₫)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-primary transition-colors shadow-sm"
                type="button"
                aria-label="Website"
              >
                <Icon name="public" size={20} className="block" />
              </button>
              <button
                className="p-2 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-primary transition-colors shadow-sm"
                type="button"
                aria-label="Forum"
              >
                <Icon name="forum" size={20} className="block" />
              </button>
              <button
                className="p-2 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-primary transition-colors shadow-sm"
                type="button"
                aria-label="Share"
              >
                <Icon name="share" size={20} className="block" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-inverse-surface text-inverse-on-surface cursor-pointer hover:opacity-95 transition-opacity">
              <Icon name="install_mobile" size={22} />
              <div className="flex flex-col text-left">
                <span className="font-caption text-caption text-surface-variant leading-none">
                  Tải về trên
                </span>
                <span className="font-label-sm text-label-sm font-bold leading-tight">
                  App Store
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-inverse-surface text-inverse-on-surface cursor-pointer hover:opacity-95 transition-opacity">
              <Icon name="android" size={22} />
              <div className="flex flex-col text-left">
                <span className="font-caption text-caption text-surface-variant leading-none">
                  Tải về trên
                </span>
                <span className="font-label-sm text-label-sm font-bold leading-tight">
                  Google Play
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-caption text-caption text-on-surface-variant">
          <p>© 2025 TaskMate Inc. Tất cả quyền được bảo lưu.</p>
          <div className="flex items-center gap-4">
            <a className="hover:text-primary transition-colors" href="#">
              Bảo mật
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Điều khoản
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Trợ giúp
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
