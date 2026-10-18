/**
 * Address & Administrative Divisions Service (Vietnam)
 * Shared service for cascading provinces, districts, wards, and geocoding suggestions
 */

const OPEN_API_BASE_URL = 'https://provinces.open-api.vn/api'
const ESGOO_BASE_URL = 'https://esgoo.net/api-tinhthanh'
const PHOTON_BASE_URL = 'https://photon.komoot.io/api'

// Fallback danh sách các Tỉnh/Thành phổ biến nếu cả 2 API gặp sự cố mạng
const FALLBACK_PROVINCES = [
  { id: '01', code: '01', name: 'Hà Nội', full_name: 'Thành phố Hà Nội', latitude: '21.0285', longitude: '105.8542' },
  { id: '79', code: '79', name: 'Hồ Chí Minh', full_name: 'Thành phố Hồ Chí Minh', latitude: '10.8231', longitude: '106.6297' },
  { id: '48', code: '48', name: 'Đà Nẵng', full_name: 'Thành phố Đà Nẵng', latitude: '16.0544', longitude: '108.2022' },
  { id: '31', code: '31', name: 'Hải Phòng', full_name: 'Thành phố Hải Phòng', latitude: '20.8449', longitude: '106.6881' },
  { id: '92', code: '92', name: 'Cần Thơ', full_name: 'Thành phố Cần Thơ', latitude: '10.0452', longitude: '105.7469' },
  { id: '46', code: '46', name: 'Thừa Thiên Huế', full_name: 'Tỉnh Thừa Thiên Huế', latitude: '16.4637', longitude: '107.5909' },
  { id: '56', code: '56', name: 'Khánh Hòa', full_name: 'Tỉnh Khánh Hòa', latitude: '12.2388', longitude: '109.1967' },
  { id: '74', code: '74', name: 'Bình Dương', full_name: 'Tỉnh Bình Dương', latitude: '11.1667', longitude: '106.6667' },
  { id: '75', code: '75', name: 'Đồng Nai', full_name: 'Tỉnh Đồng Nai', latitude: '11.0000', longitude: '107.0000' },
  { id: '77', code: '77', name: 'Bà Rịa - Vũng Tàu', full_name: 'Tỉnh Bà Rịa - Vũng Tàu', latitude: '10.5417', longitude: '107.2429' },
  { id: '68', code: '68', name: 'Lâm Đồng', full_name: 'Tỉnh Lâm Đồng', latitude: '11.9404', longitude: '108.4583' },
  { id: '25', code: '25', name: 'Quảng Ninh', full_name: 'Tỉnh Quảng Ninh', latitude: '21.0069', longitude: '107.2925' },
  { id: '27', code: '27', name: 'Bắc Ninh', full_name: 'Tỉnh Bắc Ninh', latitude: '21.1861', longitude: '106.0763' },
]

// Fallback danh sách Quận/Huyện cho Hà Nội & TP.HCM
const FALLBACK_DISTRICTS = {
  '01': [
    { id: '001', code: '001', name: 'Ba Đình', full_name: 'Quận Ba Đình', province_code: '01' },
    { id: '002', code: '002', name: 'Hoàn Kiếm', full_name: 'Quận Hoàn Kiếm', province_code: '01' },
    { id: '003', code: '003', name: 'Tây Hồ', full_name: 'Quận Tây Hồ', province_code: '01' },
    { id: '004', code: '004', name: 'Long Biên', full_name: 'Quận Long Biên', province_code: '01' },
    { id: '005', code: '005', name: 'Cầu Giấy', full_name: 'Quận Cầu Giấy', province_code: '01' },
    { id: '006', code: '006', name: 'Đống Đa', full_name: 'Quận Đống Đa', province_code: '01' },
    { id: '007', code: '007', name: 'Hai Bà Trưng', full_name: 'Quận Hai Bà Trưng', province_code: '01' },
    { id: '008', code: '008', name: 'Hoàng Mai', full_name: 'Quận Hoàng Mai', province_code: '01' },
    { id: '009', code: '009', name: 'Thanh Xuân', full_name: 'Quận Thanh Xuân', province_code: '01' },
    { id: '019', code: '019', name: 'Nam Từ Liêm', full_name: 'Quận Nam Từ Liêm', province_code: '01' },
    { id: '020', code: '020', name: 'Bắc Từ Liêm', full_name: 'Quận Bắc Từ Liêm', province_code: '01' },
    { id: '021', code: '021', name: 'Hà Đông', full_name: 'Quận Hà Đông', province_code: '01' },
    { id: '018', code: '018', name: 'Gia Lâm', full_name: 'Huyện Gia Lâm', province_code: '01' },
    { id: '017', code: '017', name: 'Đông Anh', full_name: 'Huyện Đông Anh', province_code: '01' },
    { id: '016', code: '016', name: 'Sóc Sơn', full_name: 'Huyện Sóc Sơn', province_code: '01' },
    { id: '024', code: '024', name: 'Sơn Tây', full_name: 'Thị xã Sơn Tây', province_code: '01' },
    { id: '025', code: '025', name: 'Ba Vì', full_name: 'Huyện Ba Vì', province_code: '01' },
    { id: '027', code: '027', name: 'Thạch Thất', full_name: 'Huyện Thạch Thất', province_code: '01' },
    { id: '028', code: '028', name: 'Quốc Oai', full_name: 'Huyện Quốc Oai', province_code: '01' },
    { id: '029', code: '029', name: 'Chương Mỹ', full_name: 'Huyện Chương Mỹ', province_code: '01' },
    { id: '030', code: '030', name: 'Đan Phượng', full_name: 'Huyện Đan Phượng', province_code: '01' },
    { id: '031', code: '031', name: 'Hoài Đức', full_name: 'Huyện Hoài Đức', province_code: '01' },
    { id: '032', code: '032', name: 'Thanh Oai', full_name: 'Huyện Thanh Oai', province_code: '01' },
    { id: '033', code: '033', name: 'Mỹ Đức', full_name: 'Huyện Mỹ Đức', province_code: '01' },
    { id: '034', code: '034', name: 'Ứng Hòa', full_name: 'Huyện Ứng Hòa', province_code: '01' },
    { id: '035', code: '035', name: 'Thường Tín', full_name: 'Huyện Thường Tín', province_code: '01' },
    { id: '036', code: '036', name: 'Phú Xuyên', full_name: 'Huyện Phú Xuyên', province_code: '01' },
    { id: '037', code: '037', name: 'Mê Linh', full_name: 'Huyện Mê Linh', province_code: '01' },
  ],
  '79': [
    { id: '760', code: '760', name: 'Quận 1', full_name: 'Quận 1', province_code: '79' },
    { id: '769', code: '769', name: 'Thủ Đức', full_name: 'Thành phố Thủ Đức', province_code: '79' },
    { id: '770', code: '770', name: 'Quận 3', full_name: 'Quận 3', province_code: '79' },
    { id: '771', code: '771', name: 'Quận 10', full_name: 'Quận 10', province_code: '79' },
    { id: '772', code: '772', name: 'Quận 11', full_name: 'Quận 11', province_code: '79' },
    { id: '773', code: '773', name: 'Quận 4', full_name: 'Quận 4', province_code: '79' },
    { id: '774', code: '774', name: 'Quận 5', full_name: 'Quận 5', province_code: '79' },
    { id: '775', code: '775', name: 'Quận 6', full_name: 'Quận 6', province_code: '79' },
    { id: '776', code: '776', name: 'Quận 8', full_name: 'Quận 8', province_code: '79' },
    { id: '777', code: '777', name: 'Bình Tân', full_name: 'Quận Bình Tân', province_code: '79' },
    { id: '778', code: '778', name: 'Quận 7', full_name: 'Quận 7', province_code: '79' },
    { id: '764', code: '764', name: 'Gò Vấp', full_name: 'Quận Gò Vấp', province_code: '79' },
    { id: '765', code: '765', name: 'Bình Thạnh', full_name: 'Quận Bình Thạnh', province_code: '79' },
    { id: '766', code: '766', name: 'Tân Bình', full_name: 'Quận Tân Bình', province_code: '79' },
    { id: '767', code: '767', name: 'Tân Phú', full_name: 'Quận Tân Phú', province_code: '79' },
    { id: '768', code: '768', name: 'Phú Nhuận', full_name: 'Quận Phú Nhuận', province_code: '79' },
    { id: '783', code: '783', name: 'Củ Chi', full_name: 'Huyện Củ Chi', province_code: '79' },
    { id: '784', code: '784', name: 'Hóc Môn', full_name: 'Huyện Hóc Môn', province_code: '79' },
    { id: '785', code: '785', name: 'Bình Chánh', full_name: 'Huyện Bình Chánh', province_code: '79' },
    { id: '786', code: '786', name: 'Nhà Bè', full_name: 'Huyện Nhà Bè', province_code: '79' },
    { id: '787', code: '787', name: 'Cần Giờ', full_name: 'Huyện Cần Giờ', province_code: '79' },
  ],
}

// Toạ độ trung tâm Quận/Huyện phục vụ tìm kiếm khoảng cách gần nhất
const DISTRICT_COORDS = {
  '001': { latitude: '21.0345', longitude: '105.8200' }, // Ba Đình
  '002': { latitude: '21.0285', longitude: '105.8542' }, // Hoàn Kiếm
  '003': { latitude: '21.0715', longitude: '105.8230' }, // Tây Hồ
  '004': { latitude: '21.0450', longitude: '105.8950' }, // Long Biên
  '005': { latitude: '21.0360', longitude: '105.7905' }, // Cầu Giấy
  '006': { latitude: '21.0185', longitude: '105.8260' }, // Đống Đa
  '007': { latitude: '21.0050', longitude: '105.8550' }, // Hai Bà Trưng
  '008': { latitude: '20.9750', longitude: '105.8500' }, // Hoàng Mai
  '009': { latitude: '20.9950', longitude: '105.8050' }, // Thanh Xuân
  '019': { latitude: '21.0130', longitude: '105.7650' }, // Nam Từ Liêm
  '020': { latitude: '21.0700', longitude: '105.7600' }, // Bắc Từ Liêm
  '021': { latitude: '20.9650', longitude: '105.7700' }, // Hà Đông
  '018': { latitude: '21.0100', longitude: '105.9500' }, // Gia Lâm
  '017': { latitude: '21.1400', longitude: '105.8500' }, // Đông Anh
  '016': { latitude: '21.2600', longitude: '105.8500' }, // Sóc Sơn
  '760': { latitude: '10.7769', longitude: '106.7009' }, // Quận 1
  '769': { latitude: '10.8494', longitude: '106.7717' }, // Thủ Đức
  '770': { latitude: '10.7844', longitude: '106.6844' }, // Quận 3
  '771': { latitude: '10.7672', longitude: '106.6667' }, // Quận 10
  '772': { latitude: '10.7661', longitude: '106.6508' }, // Quận 11
  '773': { latitude: '10.7611', longitude: '106.7042' }, // Quận 4
  '774': { latitude: '10.7547', longitude: '106.6631' }, // Quận 5
  '775': { latitude: '10.7481', longitude: '106.6353' }, // Quận 6
  '776': { latitude: '10.7247', longitude: '106.6286' }, // Quận 8
  '777': { latitude: '10.7653', longitude: '106.6039' }, // Bình Tân
  '778': { latitude: '10.7342', longitude: '106.7322' }, // Quận 7
  '764': { latitude: '10.8386', longitude: '106.6653' }, // Gò Vấp
  '765': { latitude: '10.8106', longitude: '106.6978' }, // Bình Thạnh
  '766': { latitude: '10.7997', longitude: '106.6531' }, // Tân Bình
  '767': { latitude: '10.7925', longitude: '106.6278' }, // Tân Phú
  '768': { latitude: '10.7992', longitude: '106.6806' }, // Phú Nhuận
}

// Bộ nhớ đệm trong phiên giúp phản hồi tức thì 0ms (In-Memory & SessionStorage Cache)
const CACHE = {
  provinces: null,
  districts: {},
  wards: {},
  wardKeywords: {},
}

function getSessionItem(key) {
  try {
    const val = sessionStorage.getItem(key)
    return val ? JSON.parse(val) : null
  } catch {
    return null
  }
}

function setSessionItem(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore
  }
}

// Từ điển ánh xạ tức thì các Phường/Xã trọng điểm tại Hà Nội (01) và TP.HCM (79) (0ms)
const LOCAL_WARD_MAP = {
  // Hà Nội (01)
  giangvo: { districtCode: '001', wardName: 'Phường Giảng Võ', provinceCode: '01' },
  kimma: { districtCode: '001', wardName: 'Phường Kim Mã', provinceCode: '01' },
  congvi: { districtCode: '001', wardName: 'Phường Cống Vị', provinceCode: '01' },
  lieugiai: { districtCode: '001', wardName: 'Phường Liễu Giai', provinceCode: '01' },
  ngoctha: { districtCode: '001', wardName: 'Phường Ngọc Hà', provinceCode: '01' },
  trangtien: { districtCode: '002', wardName: 'Phường Tràng Tiền', provinceCode: '01' },
  hangbac: { districtCode: '002', wardName: 'Phường Hàng Bạc', provinceCode: '01' },
  hangdao: { districtCode: '002', wardName: 'Phường Hàng Đào', provinceCode: '01' },
  hanggai: { districtCode: '002', wardName: 'Phường Hàng Gai', provinceCode: '01' },
  cuadong: { districtCode: '002', wardName: 'Phường Cửa Đông', provinceCode: '01' },
  dichvong: { districtCode: '005', wardName: 'Phường Dịch Vọng', provinceCode: '01' },
  dichvonghau: { districtCode: '005', wardName: 'Phường Dịch Vọng Hậu', provinceCode: '01' },
  nghiatan: { districtCode: '005', wardName: 'Phường Nghĩa Tân', provinceCode: '01' },
  nghiado: { districtCode: '005', wardName: 'Phường Nghĩa Đô', provinceCode: '01' },
  maidich: { districtCode: '005', wardName: 'Phường Mai Dịch', provinceCode: '01' },
  yenhoa: { districtCode: '005', wardName: 'Phường Yên Hoà', provinceCode: '01' },
  trunghoa: { districtCode: '005', wardName: 'Phường Trung Hoà', provinceCode: '01' },
  quanhoa: { districtCode: '005', wardName: 'Phường Quan Hoa', provinceCode: '01' },
  ochodua: { districtCode: '006', wardName: 'Phường Ô Chợ Dừa', provinceCode: '01' },
  langha: { districtCode: '006', wardName: 'Phường Láng Hạ', provinceCode: '01' },
  langthuong: { districtCode: '006', wardName: 'Phường Láng Thượng', provinceCode: '01' },
  khamthien: { districtCode: '006', wardName: 'Phường Khâm Thiên', provinceCode: '01' },
  quangtrung: { districtCode: '006', wardName: 'Phường Quang Trung', provinceCode: '01' },
  bachkhoa: { districtCode: '007', wardName: 'Phường Bách Khoa', provinceCode: '01' },
  dongtam: { districtCode: '007', wardName: 'Phường Đồng Tâm', provinceCode: '01' },
  minhkhai: { districtCode: '007', wardName: 'Phường Minh Khai', provinceCode: '01' },
  truongdinh: { districtCode: '007', wardName: 'Phường Trương Định', provinceCode: '01' },
  metri: { districtCode: '019', wardName: 'Phường Mễ Trì', provinceCode: '01' },
  mydinh1: { districtCode: '019', wardName: 'Phường Mỹ Đình 1', provinceCode: '01' },
  mydinh2: { districtCode: '019', wardName: 'Phường Mỹ Đình 2', provinceCode: '01' },
  caudien: { districtCode: '019', wardName: 'Phường Cầu Diễn', provinceCode: '01' },
  trungvan: { districtCode: '019', wardName: 'Phường Trung Văn', provinceCode: '01' },
  xuantao: { districtCode: '020', wardName: 'Phường Xuân Tảo', provinceCode: '01' },
  conhue1: { districtCode: '020', wardName: 'Phường Cổ Nhuế 1', provinceCode: '01' },
  conhue2: { districtCode: '020', wardName: 'Phường Cổ Nhuế 2', provinceCode: '01' },
  phudien: { districtCode: '020', wardName: 'Phường Phú Diễn', provinceCode: '01' },
  vinhhung: { districtCode: '008', wardName: 'Phường Vĩnh Hưng', provinceCode: '01' },
  hoangliet: { districtCode: '008', wardName: 'Phường Hoàng Liệt', provinceCode: '01' },
  dinhcong: { districtCode: '008', wardName: 'Phường Định Công', provinceCode: '01' },
  giapbat: { districtCode: '008', wardName: 'Phường Giáp Bát', provinceCode: '01' },
  khuongtrung: { districtCode: '009', wardName: 'Phường Khương Trung', provinceCode: '01' },
  nhanchinh: { districtCode: '009', wardName: 'Phường Nhân Chính', provinceCode: '01' },
  thanhxuanbac: { districtCode: '009', wardName: 'Phường Thanh Xuân Bắc', provinceCode: '01' },
  thanhxuannam: { districtCode: '009', wardName: 'Phường Thanh Xuân Nam', provinceCode: '01' },
  molao: { districtCode: '021', wardName: 'Phường Mộ Lao', provinceCode: '01' },
  hacau: { districtCode: '021', wardName: 'Phường Hà Cầu', provinceCode: '01' },
  vanquan: { districtCode: '021', wardName: 'Phường Văn Quán', provinceCode: '01' },
  // TP.HCM (79)
  bennghe: { districtCode: '760', wardName: 'Phường Bến Nghé', provinceCode: '79' },
  benthanh: { districtCode: '760', wardName: 'Phường Bến Thành', provinceCode: '79' },
  phamngulao: { districtCode: '760', wardName: 'Phường Phạm Ngũ Lão', provinceCode: '79' },
  dakao: { districtCode: '760', wardName: 'Phường Đa Kao', provinceCode: '79' },
  tandinh: { districtCode: '760', wardName: 'Phường Tân Định', provinceCode: '79' },
  thaodien: { districtCode: '769', wardName: 'Phường Thảo Điền', provinceCode: '79' },
  anphu: { districtCode: '769', wardName: 'Phường An Phú', provinceCode: '79' },
  ankhanh: { districtCode: '769', wardName: 'Phường An Khánh', provinceCode: '79' },
  linhtrung: { districtCode: '769', wardName: 'Phường Linh Trung', provinceCode: '79' },
  hiepbinhchanh: { districtCode: '769', wardName: 'Phường Hiệp Bình Chánh', provinceCode: '79' },
  phuong22: { districtCode: '765', wardName: 'Phường 22', provinceCode: '79' },
  phuong19: { districtCode: '765', wardName: 'Phường 19', provinceCode: '79' },
  phuong25: { districtCode: '765', wardName: 'Phường 25', provinceCode: '79' },
  phuong12: { districtCode: '766', wardName: 'Phường 12', provinceCode: '79' },
  phuong13: { districtCode: '766', wardName: 'Phường 13', provinceCode: '79' },
  tansonnhi: { districtCode: '767', wardName: 'Phường Tân Sơn Nhì', provinceCode: '79' },
  taythanh: { districtCode: '767', wardName: 'Phường Tây Thạnh', provinceCode: '79' },
}

/**
 * Lấy toạ độ GPS chính xác của thiết bị qua Browser Geolocation API
 * @returns {Promise<{ lat: number, lng: number }>}
 */
export function getCurrentDeviceLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ định vị GPS.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      (err) => {
        reject(err)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    )
  })
}

/**
 * Fetch all provinces/cities in Vietnam
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array>}
 */
export async function fetchProvinces(signal) {
  // 0. Kiểm tra Cache
  if (CACHE.provinces && CACHE.provinces.length > 0) {
    return CACHE.provinces
  }
  const sessionCached = getSessionItem('provinces_cache_v1')
  if (sessionCached && sessionCached.length > 0) {
    CACHE.provinces = sessionCached
    return sessionCached
  }

  let result = null

  // 1. Thử lấy từ open-api.vn
  try {
    const res = await fetch(`${OPEN_API_BASE_URL}/p/`, { signal })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        result = data.map((p) => {
          const id = String(p.code).padStart(2, '0')
          const name = p.name.replace(/^(Thành phố|Tỉnh)\s+/i, '').trim()
          return {
            id,
            code: id,
            name,
            full_name: p.name,
            latitude: id === '01' ? '21.0285' : id === '79' ? '10.8231' : id === '48' ? '16.0544' : undefined,
            longitude: id === '01' ? '105.8542' : id === '79' ? '106.6297' : id === '48' ? '108.2022' : undefined,
          }
        })
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Lỗi khi tải danh sách Tỉnh/Thành từ open-api.vn:', err)
    }
  }

  // 2. Dự phòng qua esgoo nếu có
  if (!result) {
    try {
      const res = await fetch(`${ESGOO_BASE_URL}/1/0.htm`, { signal })
      const json = await res.json()
      if (json.error === 0 && Array.isArray(json.data)) {
        result = json.data
      }
    } catch {
      // Esgoo có thể bị captcha
    }
  }

  // 3. Fallback danh sách tĩnh chuẩn
  const finalProvinces = result || FALLBACK_PROVINCES
  CACHE.provinces = finalProvinces
  setSessionItem('provinces_cache_v1', finalProvinces)
  return finalProvinces
}

/**
 * Fetch districts by province ID
 * @param {string|number} provinceId
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array>}
 */
export async function fetchDistricts(provinceId, signal) {
  if (!provinceId) return []
  const numId = parseInt(provinceId, 10)
  const padCode = String(numId).padStart(2, '0')

  // 0. Cache check (0ms)
  if (CACHE.districts[padCode] && CACHE.districts[padCode].length > 0) {
    return CACHE.districts[padCode]
  }
  const sessionCached = getSessionItem(`districts_${padCode}`)
  if (sessionCached && sessionCached.length > 0) {
    CACHE.districts[padCode] = sessionCached
    return sessionCached
  }

  let result = null

  // 1. Thử lấy từ open-api.vn
  try {
    const res = await fetch(`${OPEN_API_BASE_URL}/p/${numId}?depth=2`, { signal })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.districts) && data.districts.length > 0) {
        result = data.districts.map((d) => {
          const id = String(d.code).padStart(3, '0')
          const name = d.name.replace(/^(Quận|Huyện|Thị xã|Thành phố)\s+/i, '').trim()
          const c = DISTRICT_COORDS[id]
          return {
            id,
            code: id,
            name,
            full_name: d.name,
            province_code: padCode,
            latitude: c?.latitude,
            longitude: c?.longitude,
          }
        })
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Lỗi khi tải danh sách Quận/Huyện từ open-api.vn:', err)
    }
  }

  // 2. Dự phòng qua esgoo nếu có
  if (!result) {
    try {
      const res = await fetch(`${ESGOO_BASE_URL}/2/${provinceId}.htm`, { signal })
      const json = await res.json()
      if (json.error === 0 && Array.isArray(json.data)) {
        result = json.data
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback danh sách tĩnh cho Hà Nội & TP.HCM
  const fallback = FALLBACK_DISTRICTS[padCode] || []
  const finalDistricts =
    result ||
    fallback.map((d) => {
      const c = DISTRICT_COORDS[d.id]
      return {
        ...d,
        latitude: d.latitude || c?.latitude,
        longitude: d.longitude || c?.longitude,
      }
    })

  CACHE.districts[padCode] = finalDistricts
  setSessionItem(`districts_${padCode}`, finalDistricts)
  return finalDistricts
}

/**
 * Try to resolve District and Ward from a ward keyword or query (e.g., "Giang Vo", "Mễ Trì")
 * @param {string} keyword
 * @param {string} [provinceCode]
 * @returns {Promise<{ districtCode: string, wardCode: string, wardName: string } | null>}
 */
export async function resolveDistrictAndWardFromKeyword(keyword, provinceCode) {
  if (!keyword || typeof keyword !== 'string') return null
  const cleanKw = keyword
    .replace(/^(phường|xã|thị trấn|ward|p\.)\s+/i, '')
    .replace(/\s+(phường|xã|thị trấn|ward)$/i, '')
    .trim()

  if (cleanKw.length < 2) return null

  // 0. Siêu tốc 0ms: Kiểm tra LOCAL_WARD_MAP của Hà Nội & TP.HCM
  const normKey = cleanKw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')

  if (LOCAL_WARD_MAP[normKey]) {
    const local = LOCAL_WARD_MAP[normKey]
    if (
      !provinceCode ||
      local.provinceCode === String(parseInt(provinceCode, 10)).padStart(2, '0')
    ) {
      return {
        districtCode: local.districtCode,
        wardCode: '',
        wardName: local.wardName,
      }
    }
  }

  // 1. Kiểm tra cache
  const cacheKey = `${normKey}_${provinceCode || ''}`
  if (CACHE.wardKeywords[cacheKey] !== undefined) {
    return CACHE.wardKeywords[cacheKey]
  }

  let resolved = null

  try {
    const res = await fetch(`${OPEN_API_BASE_URL}/w/search/?q=${encodeURIComponent(cleanKw)}`)
    if (res.ok) {
      const wards = await res.json()
      if (Array.isArray(wards) && wards.length > 0) {
        for (const candidate of wards.slice(0, 5)) {
          const detailRes = await fetch(`${OPEN_API_BASE_URL}/w/${candidate.code}?depth=2`)
          if (detailRes.ok) {
            const detail = await detailRes.json()
            const dCode = String(detail.district_code).padStart(3, '0')
            if (provinceCode) {
              const pCodePad = String(parseInt(provinceCode, 10))
              const distRes = await fetch(`${OPEN_API_BASE_URL}/d/${detail.district_code}`)
              if (distRes.ok) {
                const distDetail = await distRes.json()
                if (String(distDetail.province_code) !== pCodePad) {
                  continue
                }
              }
            }
            resolved = {
              districtCode: dCode,
              wardCode: String(detail.code).padStart(5, '0'),
              wardName: detail.name,
            }
            break
          }
        }
      }
    }
  } catch {
    // ignore
  }

  CACHE.wardKeywords[cacheKey] = resolved
  return resolved
}

/**
 * Fetch wards by district ID
 * @param {string|number} districtId
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array>}
 */
export async function fetchWards(districtId, signal) {
  if (!districtId) return []
  const numId = parseInt(districtId, 10)
  const padCode = String(numId).padStart(3, '0')

  // 0. Cache check (0ms)
  if (CACHE.wards[padCode] && CACHE.wards[padCode].length > 0) {
    return CACHE.wards[padCode]
  }
  const sessionCached = getSessionItem(`wards_${padCode}`)
  if (sessionCached && sessionCached.length > 0) {
    CACHE.wards[padCode] = sessionCached
    return sessionCached
  }

  let result = null

  // 1. Thử lấy từ open-api.vn
  try {
    const res = await fetch(`${OPEN_API_BASE_URL}/d/${numId}?depth=2`, { signal })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.wards) && data.wards.length > 0) {
        result = data.wards.map((w) => {
          const id = String(w.code).padStart(5, '0')
          const name = w.name.replace(/^(Phường|Xã|Thị trấn)\s+/i, '').trim()
          return {
            id,
            code: id,
            name,
            full_name: w.name,
            district_code: padCode,
          }
        })
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Lỗi khi tải danh sách Phường/Xã từ open-api.vn:', err)
    }
  }

  // 2. Dự phòng qua esgoo nếu có
  if (!result) {
    try {
      const res = await fetch(`${ESGOO_BASE_URL}/3/${districtId}.htm`, { signal })
      const json = await res.json()
      if (json.error === 0 && Array.isArray(json.data)) {
        result = json.data
      }
    } catch {
      // ignore
    }
  }

  const finalWards = result || []
  CACHE.wards[padCode] = finalWards
  setSessionItem(`wards_${padCode}`, finalWards)
  return finalWards
}

/**
 * Search autocomplete address suggestions biased towards current coordinates
 * @param {string} query
 * @param {{ lat: number, lng: number }} [coords]
 * @param {{ signal?: AbortSignal, limit?: number }} [options]
 * @returns {Promise<Array>}
 */
export async function searchAddressSuggestions(query, coords = { lat: 21.0285, lng: 105.8542 }, options = {}) {
  const trimmed = (query || '').trim()
  if (trimmed.length < 2) return []

  try {
    const limit = options.limit || 5
    const url = `${PHOTON_BASE_URL}/?q=${encodeURIComponent(
      trimmed
    )}&lat=${coords.lat}&lon=${coords.lng}&limit=${limit}`

    const res = await fetch(url, { signal: options.signal })
    const data = await res.json()

    if (Array.isArray(data.features) && data.features.length > 0) {
      return data.features
        .filter((f) => {
          const cc = f.properties?.countrycode
          return !cc || cc.toUpperCase() === 'VN'
        })
        .map((f, idx) => {
          const p = f.properties || {}
          const title = p.name || p.street || trimmed
          const subtitle = [p.street !== title ? p.street : '', p.district, p.city || p.state]
            .filter(Boolean)
            .filter((part) => !/^national route\b/i.test(part))
            .join(', ')

          return {
            id: `${p.osm_id || idx}-${f.geometry.coordinates.join('-')}`,
            title,
            subtitle,
            fullText: [title, subtitle].filter(Boolean).join(', '),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          }
        })
    }
    return []
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Lỗi tìm kiếm gợi ý địa chỉ:', err)
    }
    return []
  }
}

/**
 * Parse a comma-separated Vietnamese full address into structured components:
 * { specificAddress, ward, district, province }
 * Only extracts province/district/ward if they match Vietnamese administrative patterns
 * (never misclassifies "Thôn 1" or "National Route 26" as Province/District).
 * @param {string} rawAddress
 * @returns {{ specificAddress: string, ward: string, district: string, province: string }}
 */
export function parseVietnameseAddress(rawAddress) {
  if (!rawAddress || typeof rawAddress !== 'string') {
    return { specificAddress: '', ward: '', district: '', province: '' }
  }

  const parts = rawAddress
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^(việt nam|vietnam|\d{5,6})$/i.test(s))

  const provinceRegex =
    /^(thành phố|tỉnh|tp\.?\s+|hà nội|hồ chí minh|đà nẵng|hải phòng|cần thơ|huế)/i
  const districtRegex = /^(quận|huyện|thị xã|thành phố|tp\.?\s+)/i
  const wardRegex = /^(phường|xã|thị trấn)\b/i

  let province = ''
  let district = ''
  let ward = ''
  const usedIndices = new Set()

  // Find province from right to left
  for (let i = parts.length - 1; i >= 0; i--) {
    if (provinceRegex.test(parts[i])) {
      province = parts[i]
      usedIndices.add(i)
      break
    }
  }

  // Find district from right to left (excluding used province index)
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!usedIndices.has(i) && districtRegex.test(parts[i])) {
      district = parts[i]
      usedIndices.add(i)
      break
    }
  }

  // Find ward from right to left
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!usedIndices.has(i) && wardRegex.test(parts[i])) {
      ward = parts[i]
      usedIndices.add(i)
      break
    }
  }

  const specificParts = parts.filter((_, idx) => !usedIndices.has(idx))
  const specificAddress =
    specificParts.length > 0 ? specificParts.join(', ') : rawAddress.trim()

  return { specificAddress, ward, district, province }
}

/**
 * Normalize Vietnamese administrative name by stripping common prefixes for comparison
 * @param {string} str
 * @returns {string}
 */
function stripAdminPrefix(str) {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/^(thành phố|tỉnh|tp\.?|quận|huyện|thị xã|phường|xã|thị trấn)\s+/i, '')
    .trim()
}

/**
 * Match a candidate text (e.g., "Thành phố Hà Nội" or "Hà Nội") against an esgoo administrative list
 * @param {Array<{ id: string|number, name: string, full_name: string }>} list
 * @param {string} candidateText
 * @returns {{ id: string|number, name: string, full_name: string, latitude?: string, longitude?: string } | null}
 */
export function matchAdministrativeItem(list, candidateText) {
  if (!Array.isArray(list) || list.length === 0 || !candidateText) return null
  const norm = candidateText.trim().toLowerCase()
  const strippedCandidate = stripAdminPrefix(norm)
  if (!norm || !strippedCandidate) return null

  return (
    list.find(
      (item) =>
        item.full_name?.toLowerCase() === norm ||
        item.name?.toLowerCase() === norm ||
        stripAdminPrefix(item.full_name) === strippedCandidate
    ) || null
  )
}


