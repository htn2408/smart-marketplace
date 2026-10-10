/**
 * Mock Data for TaskMate Platform (Using local assets)
 */

export const POPULAR_SERVICES = [
  {
    icon: 'chair',
    iconBgColor: 'primary',
    title: 'Lắp ráp',
    description: 'Lắp ráp nội thất gia đình, đồ IKEA, giường tủ, bàn làm việc, kệ sách nhanh chóng.',
    priceText: '~250.000₫ - 400.000₫',
  },
  {
    icon: 'cleaning_services',
    iconBgColor: 'secondary',
    title: 'Vệ sinh',
    description: 'Dọn dẹp nhà ở, căn hộ chung cư, tổng vệ sinh sâu, khử khuẩn không gian sống.',
    priceText: '~250.000₫ - 400.000₫',
  },
  {
    icon: 'local_shipping',
    iconBgColor: 'primary',
    title: 'Vận chuyển',
    description: 'Chuyển nhà trọn gói, bốc xếp hàng hoá, xe tải hỗ trợ, khuân vác đồ nặng cẩn trọng.',
    priceText: '~250.000₫ - 400.000₫',
  },
  {
    icon: 'handyman',
    iconBgColor: 'tonal',
    title: 'Sửa chữa nhà',
    description: 'Khắc phục sự cố điện gia dụng, đường ống nước, bảo trì trang thiết bị nhà tắm, bếp.',
    priceText: '~300.000₫ - 400.000₫',
  },
  {
    icon: 'tv',
    iconBgColor: 'primary',
    title: 'Khoan tường & Lắp đặt',
    description: 'Khoan tường chuẩn laser, treo TV, giá kệ, khung tranh nghệ thuật, rèm cửa sổ an toàn.',
    priceText: '~250.000₫ - 400.000₫',
  },
  {
    icon: 'yard',
    iconBgColor: 'secondary',
    title: 'Sân vườn',
    description: 'Cắt cỏ, dọn dẹp cành lá, cắt tỉa và chăm sóc cây cảnh sân thượng, biệt thự.',
    priceText: '~250.000₫ - 400.000₫',
  },
]

export const HOME_TASKERS = [
  {
    id: 'tuan',
    name: 'Nguyễn Anh Tuấn',
    avatar: '/images/avatars/nguyen-anh-tuan.jpg',
    badge: 'Elite Tasker',
    jobsCount: '540 việc',
    rating: 4.98,
    reviewsCount: 324,
    category: 'assembly',
    specialties: [
      { icon: 'verified', text: 'Chuyên đồ gỗ IKEA, An Cường, JYSK' },
      { icon: 'bolt', text: 'Có sẵn máy bắt vít Bosch & dụng cụ cân bằng laser' },
    ],
    quote:
      'Anh Tuấn đến rất đúng giờ, mang đầy đủ dụng cụ và lắp xong bộ tủ trong 1 tiếng rưỡi rất gọn gàng!',
    quoteAuthor: 'Chị Lan Phương, Vinhomes Central Park',
    priceText: 'từ 200.000₫',
    priceSubtext: '/h (Thương lượng)',
  },
  {
    id: 'mai',
    name: 'Trần Thanh Mai',
    avatar: '/images/avatars/tran-thanh-mai.jpg',
    badge: 'Elite Tasker',
    jobsCount: '418 việc',
    rating: 4.99,
    reviewsCount: 280,
    category: 'cleaning',
    specialties: [
      { icon: 'verified', text: 'Vệ sinh căn hộ chi tiết, khử mùi sinh học' },
      { icon: 'sanitizer', text: 'Tự túc dung dịch hữu cơ Ecos & khăn lau phân màu' },
    ],
    quote:
      'Cô Mai làm việc cực kỳ tỉ mỉ, góc ban công và cửa kính sáng bóng không một vết ố. Rất tin tưởng giao nhà!',
    quoteAuthor: 'Anh Quốc Bảo, Masteri Thảo Điền',
    priceText: 'từ 150.000₫',
    priceSubtext: '/h (Thương lượng)',
  },
  {
    id: 'nam',
    name: 'Lê Hoàng Nam',
    avatar: '/images/avatars/le-hoang-nam.jpg',
    badge: 'Elite Tasker',
    jobsCount: '620 việc',
    rating: 4.97,
    reviewsCount: 410,
    category: 'plumbing',
    specialties: [
      { icon: 'verified', text: 'Kỹ sư Điện dân dụng & Điện lạnh 7 năm' },
      { icon: 'speed', text: 'Có mặt sau 30 phút khu vực nội thành' },
    ],
    quote:
      'Xử lý dứt điểm tình trạng chập aptomat và rò nước máy giặt cực nhanh. Báo giá rõ ràng, không phát sinh!',
    quoteAuthor: 'Bác Hải Minh, Sunrise City Q7',
    priceText: 'từ 180.000₫',
    priceSubtext: '/h (Thương lượng)',
  },
]

export const SEARCH_TASKERS = [
  {
    id: 'tuan',
    name: 'Nguyễn Anh Tuấn',
    avatar: '/images/avatars/nguyen-anh-tuan.jpg',
    badge: 'Elite Tasker',
    jobsCount: '100%',
    rating: 4.9,
    reviewsCount: 186,
    distance: '2.3km (Thủ Đức)',
    matchScore: 98,
    responseTime: '5 phút',
    aiMatchTitle: '⚡ Điểm tương thích cao nhất - Chuyên gia nội thất IKEA',
    aiMatchPoints: [
      'Đã lắp hơn 45 tủ IKEA PAX cùng chủng loại',
      'Vị trí tiện di chuyển (cách 2.3km)',
      'Sẵn máy khoan Bosch & thước cân laser',
    ],
    quote:
      'Thợ mộc lành nghề 7 năm kinh nghiệm chuyên lắp ráp và hoàn thiện nội thất căn hộ IKEA, JYSK. Cẩn thận, tỉ mỉ, luôn mang theo đầy đủ máy móc chuyên dụng và máy hút bụi mini để đảm bảo vệ sinh công trình sau khi hoàn thành.',
    equipments: [
      'Thang nhôm',
      'Máy vặn vít pin Makita',
      'Khoan bê tông',
      'Búa cao su chống trầy',
    ],
    availableTime: 'Sáng mai 09:00 - 12:00',
  },
  {
    id: 'hung',
    name: 'Trần Văn Hùng',
    avatar: '/images/avatars/tran-van-hung.jpg',
    badge: 'Top Rated',
    rating: 4.8,
    reviewsCount: 124,
    distance: '1.5km (10 phút)',
    matchScore: 94,
    responseTime: '8 phút',
    aiMatchTitle: '⚡ Vị trí gần bạn nhất (1.5km) - Phản hồi nhanh',
    aiMatchPoints: [
      '5+ năm chuyên mộc nội thất gia đình',
      'Cam kết dọn sạch bao bì xốp sau khi ráp',
    ],
    quote:
      'Hơn 5 năm kinh nghiệm mộc dân dụng và sửa chữa đồ gỗ tại nhà khu vực TP. Thủ Đức. Tận tâm, chu đáo, khảo sát kỹ và cam kết không gây trầy xước sàn tường, có mặt nhanh chóng trong 15 phút.',
    equipments: ['Thang rút', 'Bộ lục giác đa năng', 'Máy khoan pin'],
    availableTime: 'Sáng mai 08:30 - 11:30',
  },
  {
    id: 'long',
    name: 'Lê Hoàng Long',
    avatar: '/images/avatars/le-hoang-long.jpg',
    badge: 'Thợ mộc chuyên nghiệp',
    rating: 5.0,
    reviewsCount: 62,
    distance: '3.8km',
    matchScore: 89,
    responseTime: '10 phút',
    aiMatchTitle: '⚡ Kỹ thuật cao - Bảo hành kết cấu 6 tháng',
    aiMatchPoints: [
      'Kỹ thuật viên cơ khí & nội thất 6 năm',
      'Bảo hành kết cấu 6 tháng sau lắp đặt',
    ],
    quote:
      'Kỹ thuật viên cơ khí và nội thất chuyên nghiệp 6 năm kinh nghiệm. Nhận lắp đặt, gia cố chịu lực các thiết bị tủ kệ, rèm cửa, giàn phơi an toàn tuyệt đối cho gia đình, bảo hành kết cấu 6 tháng sau lắp đặt.',
    equipments: ['Thang nhôm', 'Dụng cụ đo laser', 'Máy khoan bắt vít'],
    availableTime: 'Chiều mai 14:00 - 17:00',
  },
  {
    id: 'quan',
    name: 'Vũ Minh Quân',
    avatar: '/images/avatars/vu-minh-quan.jpg',
    badge: 'Giá tốt nhất',
    rating: 4.7,
    reviewsCount: 88,
    distance: '2.1km (Masteri An Phú)',
    matchScore: 85,
    responseTime: '3 phút',
    aiMatchTitle: '⚡ Thợ đa năng trẻ - Sẵn sàng ngay hôm nay',
    aiMatchPoints: [
      'Đang rảnh hôm nay & mai',
      'Nhiệt tình, có mặt nhanh sau 15 phút',
    ],
    quote:
      'Thợ đa năng khu vực Quận 2 - Bình Thạnh, nhận các việc lắp ráp nhanh, sửa điện nước vặt gia đình. Nhiệt tình, thân thiện, có mặt nhanh và làm việc cẩn thận, đúng quy chuẩn an toàn.',
    equipments: ['Hộp dụng cụ cơ bản', 'Máy bắt vít pin'],
    availableTime: 'Linh hoạt mọi khung giờ',
  },
]

export const TESTIMONIALS = [
  {
    quote:
      'Mua giường tầng cho hai bé nhưng loay hoay cả buổi chiều không xong vì ốc vít quá nhiều. Đặt Tasker trên app, đúng 40 phút sau anh kỹ thuật có mặt, lắp xong xuôi chắc nịch chỉ trong một nốt nhạc!',
    author: 'Phương Thảo',
    location: 'Chung cư Estella Heights, TP. Thủ Đức',
    avatar: '/images/testimonials/phuong-thao.jpg',
  },
  {
    quote:
      'Là dân công sở bận rộn từ sáng đến tối, dịch vụ dọn dẹp định kỳ 2 lần/tuần của TaskMate là cứu tinh thực sự. Nhà cửa lúc nào cũng thơm tho, đồ ăn trong tủ lạnh được sắp xếp siêu khoa học.',
    author: 'Hoàng Dũng',
    location: 'Quận Bình Thạnh, TP.HCM',
    avatar: '/images/testimonials/hoang-dung.jpg',
  },
  {
    quote:
      'Mình chuyển trọ một mình rất ngại việc bưng bê đồ nặng. Hai bạn Tasker đến mang theo xe kéo chuyên dụng, đóng gói máy giặt cẩn thận, không trầy xước một góc nào. Giá lại minh bạch!',
    author: 'Khánh Vy',
    location: 'Quận Cầu Giấy, Hà Nội',
    avatar: '/images/testimonials/khanh-vy.jpg',
  },
]
