# QUY TẮC PHÁT TRIỂN & TÁI SỬ DỤNG CODE (FRONTEND)

Tài liệu này quy định các chuẩn mực về cấu trúc thư mục, phân loại mã nguồn và nguyên tắc tái sử dụng (DRY - Don't Repeat Yourself) áp dụng cho toàn bộ dự án Frontend (`sm-fe`).

---

## 1. Nguyên Tắc Cốt Lõi (Core Principle)

> **Mọi hàm (functions), hooks, logic nghiệp vụ hoặc giao diện (components) có khả năng tái sử dụng BẮT BUỘC phải được đưa vào các thư mục dùng chung tương ứng. Tuyệt đối không viết inline, duplicate mã nguồn hoặc để cục bộ trong một trang/component riêng lẻ.**

---

## 2. Quy Chuẩn Thư Mục Dùng Chung (Shared Folders Structure)

```
sm-fe/src/
├── components/
│   ├── common/         # Các UI Components dùng chung (Button, Icon, Badge, Input, Modal...)
│   ├── layout/         # Các thành phần khung sườn giao diện (Header, Footer, Sidebar...)
│   └── [feature]/      # Các component ĐẶC THÙ riêng cho từng tính năng/màn hình
├── services/           # Tất cả các hàm gọi API (Backend .NET, Third-party APIs)
├── hooks/              # Custom React Hooks dùng chung (useDebounce, useClickOutside...)
├── utils/              # Các hàm tiện ích thuần tuý (formatDate, formatCurrency, validate...)
├── constants/          # Hằng số, cấu hình tĩnh, enum, mock/fallback data
└── routes/             # Định tuyến URL và điều hướng trang
```

---

## 3. Chi Tiết Từng Phân Loại & Trách Nhiệm

### 3.1. `src/components/common/` (Shared UI Components)
- **Nhiệm vụ**: Chứa các component giao diện cơ bản hoặc có tính năng tự đóng gói cao dùng được ở nhiều màn hình.
- **Ví dụ**:
  - `TaskSearchInput.jsx`: Ô tìm kiếm công việc kèm autocomplete (dùng chung cho Trang chủ & Trang đăng việc).
  - `Button.jsx`, `Icon.jsx`, `Badge.jsx`, `StarRating.jsx`, `ScrollToTop.jsx`.
- **Quy tắc**:
  - Nhận dữ liệu qua props, phát sự kiện qua callback (`onChange`, `onSelect`...).
  - Thiết kế linh hoạt (hỗ trợ các variants khác nhau nếu cần), có giá trị mặc định (default props) an toàn.

### 3.2. `src/services/` (API & Data Fetching)
- **Nhiệm vụ**: Quản lý toàn bộ giao tiếp mạng (HTTP requests, API endpoints).
- **Ví dụ**:
  - `taskService.js`: Gọi API Backend .NET (gợi ý công việc, danh sách việc, chi tiết...).
  - `addressService.js`: Gọi API hành chính Việt Nam (Tỉnh/Thành, Quận/Huyện, Phường/Xã) và gợi ý địa chỉ (Photon/Nominatim).
  - `mapService.js`: Tương tác với bản đồ, toạ độ địa lý.
- **Quy tắc**:
  - **Tuyệt đối không gọi `fetch()` hoặc `axios()` trực tiếp bên trong component React.**
  - Mọi hàm service phải có xử lý lỗi (`try...catch`), hỗ trợ `AbortSignal` (để tránh memory leak/race condition), và có fallback an toàn.

### 3.3. `src/hooks/` (Custom Hooks)
- **Nhiệm vụ**: Tách biệt logic trạng thái (stateful logic) có thể tái sử dụng.
- **Ví dụ**:
  - `useDebounce`: Debounce giá trị input tìm kiếm.
  - `useClickOutside`: Bắt sự kiện click ra ngoài để đóng dropdown / modal.
  - `useGeolocation`: Lấy toạ độ vị trí hiện tại của người dùng.

### 3.4. `src/utils/` (Helper & Pure Functions)
- **Nhiệm vụ**: Chứa các hàm xử lý dữ liệu thuần tuý (không chứa React State/Hooks).
- **Ví dụ**:
  - Định dạng tiền tệ: `formatCurrency(amount)` -> `450.000 đ`.
  - Định dạng thời gian: `formatDate(date)`.
  - Validate: `isValidPhoneNumber(phone)`.

### 3.5. `src/constants/` (Constants & Configuration)
- **Nhiệm vụ**: Định nghĩa các giá trị không thay đổi trong vòng đời ứng dụng.
- **Ví dụ**:
  - `mockData.js`, danh mục ngành nghề, cấu hình giới hạn phân trang, endpoint URL...

---

## 4. Checklist Trước Khi Hoàn Thành Code (Definition of Done)

Khi thêm tính năng mới hoặc chỉnh sửa mã nguồn:
1. [ ] **Kiểm tra trùng lặp**: Logic/UI này đã tồn tại trong các thư mục dùng chung chưa?
2. [ ] **Trích xuất dùng chung**: Nếu logic/UI này có thể dùng lại ở màn hình khác, đã tách nó ra `src/components/common/`, `src/services/`, hoặc `src/utils/` chưa?
3. [ ] **Không gọi API trực tiếp trong component**: Đã chuyển các lời gọi `fetch` sang file tương ứng trong `src/services/` chưa?
4. [ ] **Tuân thủ ESLint**: Đảm bảo chạy `npm run lint` đạt **0 lỗi, 0 cảnh báo**.
5. [ ] **Build ổn định**: Chạy `npm run build` thành công không có lỗi biên dịch.
