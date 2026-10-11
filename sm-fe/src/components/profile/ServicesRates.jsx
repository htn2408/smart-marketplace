import { useState } from 'react'
import Icon from '../common/Icon'
import Button from '../common/Button'
import TaskSearchInput from '../common/TaskSearchInput'

/**
 * Services and Estimated Rates List
 * Supports searching and picking skills via TaskSearchInput in Tasker CV mode.
 */
export default function ServicesRates({
  skills = [],
  editable = false,
  onAddSkill,
  onRemoveSkill,
}) {
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [skillSearchQuery, setSkillSearchQuery] = useState('')

  const handleSelectSuggestion = (item) => {
    if (!item || !item.skillId) return
    onAddSkill?.({
      skillId: item.skillId,
      skillName: item.title,
      categoryName: item.categoryName,
    })
    setSkillSearchQuery('')
    setIsAddingSkill(false)
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 border border-surface-variant/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <Icon name="tune" size={24} className="text-primary" />
            <span>Lĩnh vực chuyên môn &amp; Kỹ năng nhận việc</span>
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Danh sách kỹ năng chuyên môn đã đăng ký trong hồ sơ của bạn
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <span className="font-label-sm text-label-sm text-primary bg-primary-fixed/30 px-3 py-1.5 rounded-full font-semibold">
            Mở cho thương lượng &amp; đề xuất
          </span>
          {editable && (
            <Button
              variant={isAddingSkill ? 'tonal' : 'primary'}
              size="sm"
              icon={isAddingSkill ? 'close' : 'add'}
              onClick={() => setIsAddingSkill(!isAddingSkill)}
              className="rounded-xl text-xs font-bold"
            >
              {isAddingSkill ? 'Đóng tìm kiếm' : 'Thêm chuyên môn'}
            </Button>
          )}
        </div>
      </div>

      {/* Search bar to pick skills when clicking "Thêm chuyên môn" */}
      {editable && isAddingSkill && (
        <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-primary/25 space-y-2">
          <TaskSearchInput
            id="tasker-skill-search"
            label="Tìm kiếm và chọn lĩnh vực chuyên môn muốn thêm"
            placeholder="Gõ tên kỹ năng (vd: Lắp tủ IKEA, Khoan tường, Treo TV, Sửa ống nước...)"
            value={skillSearchQuery}
            onChange={setSkillSearchQuery}
            onSelectTask={handleSelectSuggestion}
          />
          <p className="font-caption text-xs text-on-surface-variant">
            Gõ từ khóa công việc và bấm chọn từ danh sách gợi ý để thêm ngay vào hồ sơ.
          </p>
        </div>
      )}

      {skills && skills.length > 0 ? (
        <div className="flex flex-col gap-3">
          {skills.map((svc, idx) => (
            <div
              key={svc.skillId || svc.id || idx}
              className="p-4 sm:p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-transparent hover:border-primary/10"
            >
              <div>
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                  {svc.skillName || svc.title || svc.name}
                </h3>
                {svc.categoryName && (
                  <span className="font-caption text-xs text-on-surface-variant">
                    Danh mục: {svc.categoryName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                <div className="flex flex-col sm:items-end">
                  <span className="font-label-md text-label-md font-bold text-primary">
                    {svc.rate ? `Kỳ vọng: ${svc.rate}` : 'Nhận báo giá theo công việc'}
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {svc.subtext || 'Thương lượng linh hoạt'}
                  </span>
                </div>

                {editable && onRemoveSkill && (
                  <button
                    type="button"
                    onClick={() => onRemoveSkill(svc.skillId)}
                    className="p-2 rounded-lg text-outline hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Xoá kỹ năng này"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5 rounded-xl bg-surface-container-low/60 border border-dashed border-outline-variant/60 flex items-center gap-3 text-on-surface-variant">
          <Icon name="construction" size={22} className="text-primary shrink-0" />
          <p className="font-body-sm text-sm italic">
            Lĩnh vực chuyên môn hiện đang trống. Hãy bấm nút &ldquo;Thêm chuyên môn&rdquo; ở góc phải để tìm và chọn các kỹ năng nghề nghiệp của bạn.
          </p>
        </div>
      )}
    </div>
  )
}
