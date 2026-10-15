-- ============================================================================
-- Seed data: Users vừa là CLIENT vừa là TASKER (mỗi tasker = 1 user)
-- Các bảng: users → user_roles → worker_profiles → worker_skills → worker_districts
--
-- Mapping ràng buộc:
--   users.id                  = user_roles.user_id        (PK kép user_id+role)
--   users.id                  = worker_profiles.user_id   (unique 1-1)
--   worker_profiles.id        = worker_skills.worker_profile_id   (PK kép + skill_id)
--   worker_skills.skill_id    = skills.id                 (INSERT...SELECT theo tên → không sai FK)
--   worker_profiles.id        = worker_districts.worker_profile_id
--   province_code/district_code = mã Esgoo (giống DistrictMultiSelector phía FE)
--
-- Mật khẩu tất cả tài khoản seed: Tasker@123 (bcrypt cost 11 — sinh bằng BCrypt.Net-Next 4.0.3)
-- Chạy lại nhiều lần an toàn (INSERT IGNORE theo PK/unique).
-- Chạy: mysql -uroot -p --default-character-set=utf8mb4 smart_marketplace < seed_taskers.sql
-- ============================================================================

USE smart_marketplace;
SET NAMES utf8mb4;

-- ─── 1. USERS (mỗi user sẽ vừa CLIENT vừa TASKER) ───────────────────────────
INSERT IGNORE INTO users (id, email, password, name, address, latitude, longitude, phone_number) VALUES
('a2222222-2222-4222-8222-222222222201', 'le.van.duong@taskmate.dev',
 '$2a$11$IoS66rCHMclYW6zHTSxzruuVFf.na/RCaRwomSLQ4TSj7rOCT03/W',
 'Lê Văn Dương', 'Số 24 phố Chùa Láng, Quận Đống Đa, Hà Nội', 21.01770000, 105.81350000, '0961000101'),
('a2222222-2222-4222-8222-222222222202', 'pham.thi.hong@taskmate.dev',
 '$2a$11$IoS66rCHMclYW6zHTSxzruuVFf.na/RCaRwomSLQ4TSj7rOCT03/W',
 'Phạm Thị Hồng', 'Số 118 đường Xuân Thuỷ, Quận Cầu Giấy, Hà Nội', 21.03380000, 105.78390000, '0961000102'),
('a2222222-2222-4222-8222-222222222203', 'tran.quoc.cuong@taskmate.dev',
 '$2a$11$IoS66rCHMclYW6zHTSxzruuVFf.na/RCaRwomSLQ4TSj7rOCT03/W',
 'Trần Quốc Cường', 'Số 56 phố Nguyễn Khang, Quận Nam Từ Liêm, Hà Nội', 21.02280000, 105.78020000, '0961000103'),
('a2222222-2222-4222-8222-222222222204', 'hoang.thi.mai.anh@taskmate.dev',
 '$2a$11$IoS66rCHMclYW6zHTSxzruuVFf.na/RCaRwomSLQ4TSj7rOCT03/W',
 'Hoàng Thị Mai Anh', 'Số 9 đường Phạm Ngũ Lão, Quận 1, TP Hồ Chí Minh', 10.77950000, 106.68800000, '0961000104'),
('a2222222-2222-4222-8222-222222222205', 'do.minh.quan@taskmate.dev',
 '$2a$11$IoS66rCHMclYW6zHTSxzruuVFf.na/RCaRwomSLQ4TSj7rOCT03/W',
 'Đỗ Minh Quân', 'Số 33 phố Bạch Mai, Quận Hai Bà Trưng, Hà Nội', 20.99460000, 105.85350000, '0961000105');

-- ─── 2. USER_ROLES — quy định: Tasker cũng là một User (CLIENT + TASKER) ────
INSERT IGNORE INTO user_roles (user_id, role) VALUES
('a2222222-2222-4222-8222-222222222201', 'CLIENT'),
('a2222222-2222-4222-8222-222222222201', 'TASKER'),
('a2222222-2222-4222-8222-222222222202', 'CLIENT'),
('a2222222-2222-4222-8222-222222222202', 'TASKER'),
('a2222222-2222-4222-8222-222222222203', 'CLIENT'),
('a2222222-2222-4222-8222-222222222203', 'TASKER'),
('a2222222-2222-4222-8222-222222222204', 'CLIENT'),
('a2222222-2222-4222-8222-222222222204', 'TASKER'),
('a2222222-2222-4222-8222-222222222205', 'CLIENT'),
('a2222222-2222-4222-8222-222222222205', 'TASKER');

-- ─── 3. WORKER_PROFILES (1-1 với users) ─────────────────────────────────────
INSERT IGNORE INTO worker_profiles (id, user_id, description, status, rating, completed_tasks) VALUES
('b2222222-2222-4222-8222-222222222201', 'a2222222-2222-4222-8222-222222222201',
 'Thợ sửa chữa nhà 8 năm kinh nghiệm: điện nước, thông nghẹt, sửa tổng hợp. Báo giá minh bạch, bảo hành 60 ngày sau thi công.',
 'ONLINE', 4.85, 63),
('b2222222-2222-4222-8222-222222222202', 'a2222222-2222-4222-8222-222222222202',
 'Đội vệ sinh chuyên nghiệp 4 người, dùng máy móc hiện đại: giặt thảm, vệ sinh chuyên sâu sau xây dựng, vệ sinh nhà cửa định kỳ.',
 'ONLINE', 4.92, 88),
('b2222222-2222-4222-8222-222222222203', 'a2222222-2222-4222-8222-222222222203',
 'Chuyên lắp ráp nội thất IKEA, XING FA: kệ tường, bàn làm việc, tủ áo. Mang đủ dụng cụ, lắp xong dọn dẹp sạch sẽ.',
 'ONLINE', 4.78, 41),
('b2222222-2222-4222-8222-222222222204', 'a2222222-2222-4222-8222-222222222204',
 'Shipper nữ nhanh nhẹn, giao đồ ăn - tài liệu - hàng hoá trong nội thành HCM, nhận việc trước 18h, giao đúng giờ 99%.',
 'ONLINE', 4.88, 120),
('b2222222-2222-4222-8222-222222222205', 'a2222222-2222-4222-8222-222222222205',
 'Thợ trẻ nhiệt huyết: khoan tường chuẩn laser, treo TV, lắp móc treo; phụ thêm chăm sóc sân vườn, cắt cỏ định kỳ.',
 'ONLINE', 4.70, 27);

-- ─── 4. WORKER_SKILLS (FK skill_id tra theo tên skills có sẵn) ──────────────
-- Lê Văn Dương — Sửa chữa nhà
INSERT IGNORE INTO worker_skills (worker_profile_id, skill_id)
SELECT 'b2222222-2222-4222-8222-222222222201', s.id FROM skills s
WHERE s.name IN ('Sửa chữa ống nước', 'Sửa chữa điện', 'Sửa chữa tổng hợp');
-- Phạm Thị Hồng — Vệ sinh
INSERT IGNORE INTO worker_skills (worker_profile_id, skill_id)
SELECT 'b2222222-2222-4222-8222-222222222202', s.id FROM skills s
WHERE s.name IN ('Vệ sinh nhà cửa', 'Vệ sinh chuyên sâu', 'Vệ sinh thảm');
-- Trần Quốc Cường — Lắp ráp
INSERT IGNORE INTO worker_skills (worker_profile_id, skill_id)
SELECT 'b2222222-2222-4222-8222-222222222203', s.id FROM skills s
WHERE s.name IN ('Lắp ráp đồ IKEA', 'Lắp ráp kệ', 'Lắp ráp bàn');
-- Hoàng Thị Mai Anh — Giao hàng
INSERT IGNORE INTO worker_skills (worker_profile_id, skill_id)
SELECT 'b2222222-2222-4222-8222-222222222204', s.id FROM skills s
WHERE s.name IN ('Giao đồ ăn', 'Giao tài liệu', 'Giao hàng trong ngày');
-- Đỗ Minh Quân — Khoan tường & Lắp đặt + Sân vườn
INSERT IGNORE INTO worker_skills (worker_profile_id, skill_id)
SELECT 'b2222222-2222-4222-8222-222222222205', s.id FROM skills s
WHERE s.name IN ('Treo TV lên tường', 'Khoan tường chuẩn laser thăng bằng', 'Cắt cỏ');

-- ─── 5. WORKER_DISTRICTS (mã hành chính Esgoo) ──────────────────────────────
INSERT IGNORE INTO worker_districts (id, worker_profile_id, province_code, province_name, district_code, district_name) VALUES
-- Lê Văn Dương: Đống Đa, Thanh Xuân (Hà Nội)
('d2222222-2222-4222-8222-222222222211', 'b2222222-2222-4222-8222-222222222201', '01', 'Thành phố Hà Nội', '006', 'Quận Đống Đa'),
('d2222222-2222-4222-8222-222222222212', 'b2222222-2222-4222-8222-222222222201', '01', 'Thành phố Hà Nội', '009', 'Quận Thanh Xuân'),
-- Phạm Thị Hồng: Cầu Giấy, Tây Hồ (Hà Nội)
('d2222222-2222-4222-8222-222222222221', 'b2222222-2222-4222-8222-222222222202', '01', 'Thành phố Hà Nội', '005', 'Quận Cầu Giấy'),
('d2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222202', '01', 'Thành phố Hà Nội', '003', 'Quận Tây Hồ'),
-- Trần Quốc Cường: Nam Từ Liêm, Hà Đông (Hà Nội)
('d2222222-2222-4222-8222-222222222231', 'b2222222-2222-4222-8222-222222222203', '01', 'Thành phố Hà Nội', '019', 'Quận Nam Từ Liêm'),
('d2222222-2222-4222-8222-222222222232', 'b2222222-2222-4222-8222-222222222203', '01', 'Thành phố Hà Nội', '021', 'Quận Hà Đông'),
-- Hoàng Thị Mai Anh: Quận 1, Quận 3, Bình Thạnh (TP HCM)
('d2222222-2222-4222-8222-222222222241', 'b2222222-2222-4222-8222-222222222204', '79', 'Thành phố Hồ Chí Minh', '760', 'Quận 1'),
('d2222222-2222-4222-8222-222222222242', 'b2222222-2222-4222-8222-222222222204', '79', 'Thành phố Hồ Chí Minh', '770', 'Quận 3'),
('d2222222-2222-4222-8222-222222222243', 'b2222222-2222-4222-8222-222222222204', '79', 'Thành phố Hồ Chí Minh', '778', 'Quận Bình Thạnh'),
-- Đỗ Minh Quân: Hai Bà Trưng, Hoàng Mai (Hà Nội)
('d2222222-2222-4222-8222-222222222251', 'b2222222-2222-4222-8222-222222222205', '01', 'Thành phố Hà Nội', '007', 'Quận Hai Bà Trưng'),
('d2222222-2222-4222-8222-222222222252', 'b2222222-2222-4222-8222-222222222205', '01', 'Thành phố Hà Nội', '008', 'Quận Hoàng Mai');
