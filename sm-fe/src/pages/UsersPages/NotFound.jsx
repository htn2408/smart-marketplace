import { useNavigate } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import Button from '../../components/common/Button'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { ROUTES } from '../../routes/paths'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header activePath="" />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-20 sm:py-32">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-error-container/40 flex items-center justify-center text-error mb-4 sm:mb-6">
          <Icon name="error_outline" size={40} className="sm:scale-125" />
        </div>
        <h1 className="font-headline-lg text-2xl sm:text-4xl font-extrabold text-on-surface mb-2 sm:mb-3">
          404 - Không tìm thấy trang
        </h1>
        <p className="font-body-md text-xs sm:text-body-md text-on-surface-variant max-w-md mb-6 sm:mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang đường dẫn khác.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto max-w-xs">
          <Button variant="primary" icon="home" onClick={() => navigate(ROUTES.HOME)} className="w-full sm:w-auto">
            Về Trang Chủ
          </Button>
          <Button variant="outline" icon="arrow_back" onClick={() => navigate(-1)} className="w-full sm:w-auto">
            Quay Lại
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}

