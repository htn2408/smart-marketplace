import Icon from '../common/Icon'

/**
 * About Tasker Bio & Equipment Attributes
 */
export default function AboutTasker({ taskerName = 'Tuấn' }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-5 border border-surface-variant/30">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <Icon name="person" size={24} className="text-primary" />
          <span>Giới thiệu bản thân</span>
        </h2>
        <span className="font-caption text-caption bg-surface-container px-3 py-1 rounded-full text-on-surface-variant">
          Thành viên từ 2021
        </span>
      </div>

      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        Xin chào quý khách, mình là <strong>{taskerName}</strong>. Mình có hơn 7
        năm kinh nghiệm chuyên sâu trong lĩnh vực thi công, lắp đặt đồ nội thất
        gỗ công nghiệp (đặc biệt thông thạo các dòng sản phẩm IKEA, An Cường,
        JYSK, UMA) và sửa chữa hệ thống điện nước dân dụng cho các căn hộ chung
        cư cao cấp tại TP. Hồ Chí Minh.
      </p>

      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        Tiêu chí làm việc hàng đầu của mình là:{' '}
        <em>"Cẩn trọng như làm cho chính ngôi nhà mình"</em>. Trước khi khoan hay
        lắp đặt, mình luôn sử dụng máy dò kim loại và đường điện âm tường để đảm
        bảo an toàn tuyệt đối 100%, không bao giờ để xảy ra rủi ro chập cháy hay
        thủng ống nước.
      </p>
    </div>
  )
}
