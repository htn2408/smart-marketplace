import { useState } from 'react'
import Icon from '../common/Icon'
import Button from '../common/Button'

/**
 * About Tasker Bio & Equipment Attributes
 * Supports inline editing for Tasker CV mode.
 */
export default function AboutTasker({
  description,
  createdAt,
  editable = false,
  onSaveDescription,
  saving = false,
}) {
  const joinedYear = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear()
  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState(description || '')

  const handleStartEdit = () => {
    setDraftText(description || '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (onSaveDescription) {
      await onSaveDescription(draftText)
    }
    setIsEditing(false)
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-5 border border-surface-variant/30">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <Icon name="person" size={24} className="text-primary" />
          <span>Giới thiệu bản thân</span>
        </h2>

        <div className="flex items-center gap-2.5">
          <span className="font-caption text-caption bg-surface-container px-3 py-1 rounded-full text-on-surface-variant">
            Thành viên từ {joinedYear}
          </span>
          {editable && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              icon="edit"
              onClick={handleStartEdit}
              className="rounded-xl text-xs font-bold"
            >
              {description ? 'Chỉnh sửa' : 'Bổ sung giới thiệu'}
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            rows={4}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Nhập giới thiệu kinh nghiệm làm việc, thế mạnh chuyên môn và các trang thiết bị dụng cụ bạn có sẵn..."
            className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:border-primary resize-y"
          />
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="rounded-xl text-xs"
            >
              Huỷ
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="save"
              disabled={saving}
              onClick={handleSave}
              className="rounded-xl text-xs font-bold"
            >
              {saving ? 'Đang lưu...' : 'Lưu giới thiệu'}
            </Button>
          </div>
        </div>
      ) : description && description.trim() ? (
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
          {description}
        </p>
      ) : (
        <div className="p-5 rounded-xl bg-surface-container-low/60 border border-dashed border-outline-variant/60 flex items-center justify-between gap-4 text-on-surface-variant">
          <div className="flex items-center gap-3">
            <Icon name="edit_note" size={22} className="text-primary shrink-0" />
            <p className="font-body-sm text-sm italic">
              Phần giới thiệu bản thân hiện đang trống. Hãy bổ sung mô tả kinh nghiệm, thế mạnh và dụng cụ làm việc của bạn để tăng độ tin cậy với khách hàng.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
