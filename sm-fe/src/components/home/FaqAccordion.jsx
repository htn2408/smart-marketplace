import { useState } from 'react'
import Icon from '../common/Icon'

/**
 * Interactive React FAQ Accordion
 */
export default function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleItem = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  const defaultFaqs = [
    {
      question: 'Làm sao để biết Tasker đến nhà mình là người an toàn?',
      answer:
        'Mỗi Tasker trên nền tảng đều trải qua quy trình kiểm tra thông tin danh tính gắn với dữ liệu căn cước công dân VNeID, rà soát tiền án tiền sự và hồ sơ kỹ năng nghề nghiệp. Ngoài ra, bạn hoàn toàn xem được đánh giá sao, bình luận từ những gia đình từng sử dụng dịch vụ trước đó.',
    },
    {
      question: 'Chính sách hủy hoặc đổi lịch hẹn được quy định ra sao?',
      answer:
        'Bạn có thể hủy hoặc đổi lịch hẹn hoàn toàn miễn phí trước 24 giờ so với giờ bắt đầu công việc. Trong trường hợp cần thay đổi gấp, bạn có thể nhắn tin trực tiếp với Tasker trong mục tin nhắn của ứng dụng để hai bên cùng sắp xếp khung giờ mới thuận tiện.',
    },
    {
      question: 'Tôi thanh toán tiền cho Tasker bằng hình thức nào?',
      answer:
        'TaskMate áp dụng thanh toán không tiền mặt an toàn qua thẻ ATM/Visa/Mastercard, ví MoMo, ZaloPay hoặc chuyển khoản ngân hàng tự động. Tiền chỉ được chuyển cho Tasker sau khi bạn đã nghiệm thu xong công việc và nhấn xác nhận hài lòng trên ứng dụng.',
    },
  ]

  const list = items || defaultFaqs

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <h3 className="font-headline-md text-headline-md font-bold text-on-surface text-center mb-2">
        Câu hỏi thường gặp
      </h3>

      {list.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={index}
            className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all"
          >
            <button
              className="w-full p-5 text-left flex items-center justify-between gap-4 font-headline-sm text-headline-sm font-bold text-on-surface hover:text-primary transition-colors cursor-pointer"
              type="button"
              onClick={() => toggleItem(index)}
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              <Icon
                name="expand_more"
                size={22}
                className={`text-outline transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 font-body-sm text-body-sm text-on-surface-variant leading-relaxed border-t border-surface-variant/30 pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
