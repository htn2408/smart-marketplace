import { useState, useRef } from 'react'
import Icon from '../common/Icon'
import Button from '../common/Button'

/**
 * Thư viện hình ảnh công trình thực tế của Tasker (Worker Gallery)
 * Tuân thủ rule.md: 100% dữ liệu thật từ bảng MySQL worker_images, không mock data.
 * Hỗ trợ thợ tải ảnh lên (upload file hoặc URL) và xóa ảnh trực tiếp khỏi CSDL.
 */
export default function WorkGallery({
  images = [],
  editable = false,
  onAddImage,
  onDeleteImage,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('')
  const [location, setLocation] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const fileInputRef = useRef(null)

  const handleOpenModal = () => {
    setSelectedFile(null)
    setFilePreview('')
    setImageUrl('')
    setTitle('')
    setTag('')
    setLocation('')
    setModalError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (submitting) return
    setIsModalOpen(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setModalError('Vui lòng chọn đúng tệp hình ảnh (JPEG, PNG, WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setModalError('Kích thước ảnh không được vượt quá 5 MB.')
      return
    }
    setModalError('')
    setSelectedFile(file)
    setFilePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile && !imageUrl.trim()) {
      setModalError('Vui lòng chọn tệp ảnh từ thiết bị hoặc nhập URL hình ảnh.')
      return
    }

    try {
      setSubmitting(true)
      setModalError('')

      let payload
      if (selectedFile) {
        payload = new FormData()
        payload.append('file', selectedFile)
        if (title.trim()) payload.append('title', title.trim())
        if (tag.trim()) payload.append('tag', tag.trim())
        if (location.trim()) payload.append('location', location.trim())
      } else {
        payload = {
          imageUrl: imageUrl.trim(),
          title: title.trim() || undefined,
          tag: tag.trim() || undefined,
          location: location.trim() || undefined,
        }
      }

      if (onAddImage) {
        await onAddImage(payload)
      }
      setIsModalOpen(false)
    } catch (err) {
      setModalError(err.message || 'Không thể tải ảnh công trình lên.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (imageId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá hình ảnh công trình này khỏi hồ sơ?')) {
      return
    }
    try {
      setDeletingId(imageId)
      if (onDeleteImage) {
        await onDeleteImage(imageId)
      }
    } catch (err) {
      alert(err.message || 'Không thể xoá ảnh.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 border border-surface-variant/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <Icon name="photo_library" size={24} className="text-primary" />
            <span>Thư viện công trình thực tế đã thi công</span>
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Hình ảnh minh chứng thực tế lưu trữ trực tiếp trên cơ sở dữ liệu TaskMate
          </p>
        </div>

        {editable && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon="add_photo_alternate"
            onClick={handleOpenModal}
            className="rounded-xl text-xs font-bold shrink-0 self-start sm:self-center"
          >
            Thêm ảnh công trình
          </Button>
        )}
      </div>

      {/* Danh sách ảnh hoặc Trạng thái trống (Empty State) */}
      {images.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-surface-variant/50 p-8 text-center flex flex-col items-center justify-center bg-surface-container-low/30">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant/70 mb-3">
            <Icon name="image_not_supported" size={28} />
          </div>
          <h3 className="font-label-md text-sm font-bold text-on-surface">
            Chưa có hình ảnh công trình nào
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant max-w-md mt-1 mb-4">
            {editable
              ? 'Thêm hình ảnh các công trình bạn đã hoàn thành để nâng cao uy tín và giúp khách hàng an tâm lựa chọn bạn hơn!'
              : 'Thợ chưa đăng tải hình ảnh công trình thực tế nào lên hồ sơ.'}
          </p>
          {editable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon="add"
              onClick={handleOpenModal}
              className="rounded-xl text-xs font-bold"
            >
              Tải ảnh công trình đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden bg-surface-container flex flex-col shadow-sm border border-surface-variant/20 hover:shadow-md transition-all"
            >
              {/* Nút xóa ảnh (khi ở chế độ Thợ tự quản lý CV) */}
              {editable && (
                <button
                  type="button"
                  title="Xoá ảnh này"
                  disabled={deletingId === item.id}
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                >
                  <Icon name={deletingId === item.id ? 'sync' : 'delete'} size={16} className={deletingId === item.id ? 'animate-spin' : ''} />
                </button>
              )}

              <div className="h-52 w-full overflow-hidden bg-surface-container-high relative">
                <img
                  src={item.imageUrl}
                  alt={item.title || 'Công trình thực tế'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Anh+Cong+Trinh'
                  }}
                />
              </div>

              <div className="p-3.5 bg-surface-container-lowest flex flex-col justify-between flex-1">
                <div>
                  {item.tag && (
                    <span className="font-caption text-[11px] text-primary font-bold uppercase tracking-wider bg-primary-fixed/40 px-2 py-0.5 rounded-md inline-block mb-1">
                      {item.tag}
                    </span>
                  )}
                  <h4 className="font-label-md text-sm font-bold text-on-surface line-clamp-1">
                    {item.title || 'Dự án hoàn thiện thực tế'}
                  </h4>
                </div>

                {item.location && (
                  <div className="flex items-center justify-between text-on-surface-variant font-caption text-xs pt-2 mt-2 border-t border-surface-variant/20">
                    <span className="flex items-center gap-1 line-clamp-1">
                      <Icon name="location_on" size={14} className="shrink-0 text-primary" />
                      <span>{item.location}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm Ảnh Công Trình */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-xl border border-surface-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-surface-variant/20 flex items-center justify-between">
              <h3 className="font-headline-sm text-base font-extrabold text-on-surface flex items-center gap-2">
                <Icon name="add_photo_alternate" size={20} className="text-primary" />
                <span>Thêm ảnh công trình thực tế</span>
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <Icon name="error" size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Upload File */}
              <div>
                <label className="block font-label-md text-xs font-bold text-on-surface mb-1.5">
                  Tải ảnh từ thiết bị
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {filePreview ? (
                  <div className="relative rounded-xl overflow-hidden h-40 border border-surface-variant/40 bg-surface-container group">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null)
                        setFilePreview('')
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-surface-variant rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center bg-surface-container-low/20"
                  >
                    <Icon name="cloud_upload" size={28} className="text-primary mb-1" />
                    <span className="text-xs font-bold text-primary">Bấm để chọn file ảnh</span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">
                      Hỗ trợ JPG, PNG, WebP (Tối đa 5MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Hoặc nhập URL ảnh */}
              {!selectedFile && (
                <div>
                  <label className="block font-label-md text-xs font-bold text-on-surface mb-1">
                    Hoặc nhập đường dẫn ảnh (URL)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/cong-trinh.jpg"
                    className="w-full px-3.5 py-2 rounded-xl border border-surface-variant/40 bg-surface text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Tiêu đề công trình */}
              <div>
                <label className="block font-label-md text-xs font-bold text-on-surface mb-1">
                  Mô tả ngắn / Tên công việc
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Lắp tủ quần áo PAX 3 buồng 2m36"
                  maxLength={255}
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-variant/40 bg-surface text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Lĩnh vực / Tag & Địa điểm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-md text-xs font-bold text-on-surface mb-1">
                    Lĩnh vực (Tag)
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Ví dụ: Lắp ráp nội thất"
                    maxLength={100}
                    className="w-full px-3.5 py-2 rounded-xl border border-surface-variant/40 bg-surface text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-label-md text-xs font-bold text-on-surface mb-1">
                    Địa điểm thi công
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ví dụ: Quận Cầu Giấy, Hà Nội"
                    maxLength={255}
                    className="w-full px-3.5 py-2 rounded-xl border border-surface-variant/40 bg-surface text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-variant/20 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  onClick={handleCloseModal}
                  className="rounded-xl text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={submitting ? 'sync' : 'upload'}
                  disabled={submitting}
                  className="rounded-xl text-xs font-bold"
                >
                  {submitting ? 'Đang lưu ảnh...' : 'Lưu vào hồ sơ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
