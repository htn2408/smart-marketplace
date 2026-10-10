import Icon from '../common/Icon'

/**
 * Trust & Protection Sticky Sidebar for SearchTasker
 */
export default function TrustSidebar() {
  return (
    <aside className="lg:col-span-4 flex flex-col gap-5 lg:sticky lg:top-24">
      {/* Happiness Pledge Card */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-variant/30">
        <div className="flex items-center gap-3 pb-4">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <Icon name="verified_user" size={24} />
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
              Cam kết Verdant Trust
            </h4>
            <p className="font-caption text-caption text-primary font-semibold">
              Bảo vệ khách hàng 100%
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {/* Feature 1 */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="lock" size={16} />
            </div>
            <div className="flex-1">
              <h5 className="font-label-md text-label-md font-bold text-on-surface">
                Giữ tiền công an toàn (Escrow)
              </h5>
              <p className="font-body-sm text-body-sm text-on-surface-variant pt-0.5 leading-relaxed">
                Chỉ thanh toán khi thợ đồng ý nhận lời mời, hoàn thành công việc
                và bạn trực tiếp nghiệm thu hài lòng.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="health_and_safety" size={16} />
            </div>
            <div className="flex-1">
              <h5 className="font-label-md text-label-md font-bold text-on-surface">
                Bảo hiểm tài sản 20.000.000₫
              </h5>
              <p className="font-body-sm text-body-sm text-on-surface-variant pt-0.5 leading-relaxed">
                Mọi sự cố trầy xước đồ gỗ hoặc hỏng hóc phát sinh đều được bảo
                hiểm bồi hoàn minh bạch.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="badge" size={16} />
            </div>
            <div className="flex-1">
              <h5 className="font-label-md text-label-md font-bold text-on-surface">
                Thợ xác minh 3 lớp
              </h5>
              <p className="font-body-sm text-body-sm text-on-surface-variant pt-0.5 leading-relaxed">
                100% hồ sơ thợ đều xác minh CCCD qua VNeID, trích lục tư pháp và
                sát hạch tay nghề.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-surface-variant/40 flex items-center justify-between">
          <span className="font-caption text-caption text-on-surface-variant">
            Cần trợ giúp chọn thợ?
          </span>
          <a
            className="font-label-sm text-label-sm text-primary font-bold hover:underline inline-flex items-center gap-1"
            href="#support"
          >
            <span>Hỏi CSKH 24/7</span>
            <Icon name="arrow_forward" size={16} />
          </a>
        </div>
      </div>

      {/* TaskMate AI Matching Breakdown Card */}
      <div className="bg-gradient-to-br from-primary/10 via-surface-container-low to-surface-container-highest rounded-xl p-6 shadow-sm border border-surface-variant/30">
        <div className="flex items-center gap-2 pb-3">
          <Icon name="auto_awesome" size={22} className="text-primary" />
          <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Thuật toán Match AI
          </h4>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
          Điểm tương thích được tính dựa trên 4 yếu tố trọng số thực:
        </p>
        <div className="space-y-2.5 font-caption text-caption">
          <div>
            <div className="flex justify-between font-semibold text-on-surface mb-1">
              <span>Kinh nghiệm lắp đồ IKEA tương tự</span>
              <span className="text-primary font-bold">40%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-[40%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between font-semibold text-on-surface mb-1">
              <span>Khoảng cách &amp; Thời gian có mặt</span>
              <span className="text-primary font-bold">25%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-[25%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between font-semibold text-on-surface mb-1">
              <span>Trang bị máy móc chuyên dụng</span>
              <span className="text-primary font-bold">20%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-[20%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between font-semibold text-on-surface mb-1">
              <span>Điểm đánh giá &amp; Tỷ lệ đúng hẹn</span>
              <span className="text-primary font-bold">15%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-[15%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Need Help Quick Contact */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon name="support_agent" size={24} className="text-primary" />
          <div>
            <p className="font-label-md text-label-md font-bold text-on-surface">
              Hotline hỗ trợ khẩn
            </p>
            <p className="font-caption text-caption text-on-surface-variant">
              1900 6868 (Miễn phí 24/7)
            </p>
          </div>
        </div>
        <button
          className="p-2 rounded-full bg-surface-container-high text-primary hover:bg-surface-container-highest transition-colors cursor-pointer"
          type="button"
          aria-label="Gọi hotline"
        >
          <Icon name="call" size={20} className="block" />
        </button>
      </div>
    </aside>
  )
}
