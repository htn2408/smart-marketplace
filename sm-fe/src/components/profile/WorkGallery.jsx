import Icon from '../common/Icon'

/**
 * Past Work Gallery component for Tasker Profile
 */
export default function WorkGallery() {
  const galleryItems = [
    {
      img: '/images/gallery/pax-wardrobe.jpg',
      tag: 'Lắp ráp nội thất',
      title: 'Tủ quần áo PAX 3 buồng 2m36',
      location: 'Vinhomes Central Park',
      duration: 'Hoàn thành 3.5h',
    },
    {
      img: '/images/gallery/tv-mounting.jpg',
      tag: 'Khoan tường thẩm mỹ',
      title: 'Treo TV Sony 65 inch & giấu dây',
      location: 'Masteri Thảo Điền',
      duration: 'Hoàn thành 1h',
    },
    {
      img: '/images/gallery/drying-rack.jpg',
      tag: 'Thiết bị tiện ích',
      title: 'Lắp giàn phơi thông minh & rèm cửa',
      location: 'Celadon City, Tân Phú',
      duration: 'Hoàn thành 2h',
    },
  ]

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 border border-surface-variant/30">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <Icon name="photo_library" size={24} className="text-primary" />
            <span>Thư viện công trình thực tế đã thi công</span>
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Ảnh thực tế do Tuấn chụp trực tiếp sau khi hoàn thiện bàn giao khách
          </p>
        </div>
        <a
          className="font-label-md text-label-md text-primary font-semibold hover:underline hidden sm:inline-flex items-center gap-1"
          href="#"
        >
          <span>Xem tất cả 48 ảnh</span>
          <Icon name="arrow_forward" size={18} />
        </a>
      </div>

      {/* Asymmetric Mosaic Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {galleryItems.map((item, idx) => (
          <div
            key={idx}
            className="group relative rounded-xl overflow-hidden bg-surface-container flex flex-col shadow-sm border border-surface-variant/20 hover:shadow-md transition-all"
          >
            <div className="h-52 w-full overflow-hidden">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-3.5 bg-surface-container-lowest flex flex-col justify-between flex-1">
              <div>
                <span className="font-caption text-caption text-primary font-semibold">
                  {item.tag}
                </span>
                <h4 className="font-label-md text-label-md font-bold text-on-surface mt-0.5 line-clamp-1">
                  {item.title}
                </h4>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant font-caption text-caption pt-2 mt-2 border-t border-surface-variant/20">
                <span className="flex items-center gap-1">
                  <Icon name="location_on" size={14} />
                  {item.location}
                </span>
                <span>{item.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
