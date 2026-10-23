import Icon from './Icon'

/**
 * Standardized Pagination Component for TaskMate Design System
 * Tuân thủ rule.md: Đặt trong src/components/common/, tái sử dụng cho mọi danh sách
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Trang hiện tại (bắt đầu từ 1)
 * @param {number} props.totalPages - Tổng số trang
 * @param {number} props.totalItems - Tổng số mục dữ liệu
 * @param {number} props.pageSize - Số mục trên mỗi trang
 * @param {(page: number) => void} props.onPageChange - Callback khi đổi trang
 * @param {(size: number) => void} [props.onPageSizeChange] - Callback khi đổi kích thước trang
 * @param {number[]} [props.pageSizeOptions] - Các tùy chọn kích thước trang (mặc định [5, 10, 20])
 * @param {string} [props.itemName] - Tên đối tượng hiển thị (mặc định "công việc")
 * @param {boolean} [props.showPageSize] - Cho phép đổi kích thước trang hay không
 * @param {string} [props.className] - CSS class bổ sung
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 5,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  itemName = 'công việc',
  showPageSize = true,
  className = '',
}) {
  if (totalItems === 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Tạo dải số trang thông minh (kèm dấu ...)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages = []
    pages.push(1)

    if (currentPage > 3) {
      pages.push('...')
    }

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('...')
    }

    pages.push(totalPages)
    return pages
  }

  const pageNumbers = getPageNumbers()

  const handlePrev = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div
      className={`bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-variant/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs ${className}`}
    >
      {/* Thông tin số lượng hiển thị */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant font-medium">
        <span>
          Hiển thị{' '}
          <strong className="text-on-surface font-bold">
            {startItem} - {endItem}
          </strong>{' '}
          trên tổng số{' '}
          <strong className="text-primary font-bold">{totalItems}</strong> {itemName}
        </span>

        {/* Tùy chọn số lượng mục trên mỗi trang */}
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-surface-variant/40">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-surface-container-low border border-surface-variant/40 rounded-lg px-2 py-1 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Điều hướng số trang */}
      {totalPages > 1 && (
        <nav aria-label="Phân trang" className="flex items-center gap-1 sm:gap-1.5">
          {/* Nút Trước */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentPage <= 1}
            aria-label="Trang trước"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-surface-variant/30 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <Icon name="chevron_left" size={18} />
          </button>

          {/* Dải số trang */}
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-on-surface-variant text-xs select-none"
                >
                  •••
                </span>
              )
            }

            const isCurrent = p === currentPage
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange && onPageChange(p)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-label-md text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                    : 'bg-surface-container-lowest border border-surface-variant/30 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                {p}
              </button>
            )
          })}

          {/* Nút Tiếp theo */}
          <button
            type="button"
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            aria-label="Trang tiếp theo"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-surface-variant/30 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <Icon name="chevron_right" size={18} />
          </button>
        </nav>
      )}
    </div>
  )
}
