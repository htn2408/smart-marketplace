-- Script insert du lieu mau cac Tasker lien ket chat che giua cac bang
-- users -> user_roles -> worker_profiles -> worker_districts & worker_skills
SET NAMES utf8mb4;
USE smart_marketplace;

START TRANSACTION;

-- 1. INSERT USERS (Cac User deu co thong tin lien he, toa do GPS va so du ban dau)
INSERT INTO users (id, email, password, name, phone_number, created_at, balance, held_balance, address, latitude, longitude, updated_at)
VALUES
(
    'a1111111-1111-4111-8111-111111111101',
    'hung.tran@taskmate.vn',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'Trần Văn Hùng',
    '0912345601',
    NOW(),
    1500000.00,
    0.00,
    'Số 136 Hồ Tùng Mậu, Phường Phú Diễn, Quận Bắc Từ Liêm, Thành phố Hà Nội',
    21.03960000,
    105.76680000,
    NOW()
),
(
    'a1111111-1111-4111-8111-111111111102',
    'nam.le@taskmate.vn',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'Lê Hoàng Nam',
    '0912345602',
    NOW(),
    2000000.00,
    0.00,
    'Số 45 Chùa Bộc, Phường Quang Trung, Quận Đống Đa, Thành phố Hà Nội',
    21.00840000,
    105.82820000,
    NOW()
),
(
    'a1111111-1111-4111-8111-111111111103',
    'tuan.pham@taskmate.vn',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'Phạm Minh Tuấn',
    '0912345603',
    NOW(),
    1800000.00,
    0.00,
    'Tòa Park 3 Times City, 458 Minh Khai, Phường Vĩnh Tuy, Quận Hai Bà Trưng, Thành phố Hà Nội',
    20.99470000,
    105.86750000,
    NOW()
),
(
    'a1111111-1111-4111-8111-111111111104',
    'mai.nguyen@taskmate.vn',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'Nguyễn Thị Mai',
    '0912345604',
    NOW(),
    1200000.00,
    0.00,
    'Số 88 Trung Kính, Phường Trung Hòa, Quận Cầu Giấy, Thành phố Hà Nội',
    21.01820000,
    105.79540000,
    NOW()
),
(
    'a1111111-1111-4111-8111-111111111105',
    'thang.vu@taskmate.vn',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'Vũ Đức Thắng',
    '0912345605',
    NOW(),
    2500000.00,
    0.00,
    'Số 250 Kim Giang, Phường Đại Kim, Quận Hoàng Mai, Thành phố Hà Nội',
    20.98120000,
    105.81430000,
    NOW()
),
(
    'a1111111-1111-4111-8111-111111111106',
    'bao.dang@taskmate.vn',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'Đặng Quốc Bảo',
    '0912345606',
    NOW(),
    1600000.00,
    0.00,
    'Vinhomes Riverside, Phường Phúc Lợi, Quận Long Biên, Thành phố Hà Nội',
    21.05150000,
    105.91890000,
    NOW()
),
(
    'a1111111-1111-4111-8111-111111111107',
    'phat.huynh@taskmate.vn',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'Huỳnh Tấn Phát',
    '0912345607',
    NOW(),
    2200000.00,
    0.00,
    'Số 120 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, Thành phố Hồ Chí Minh',
    10.79630000,
    106.70320000,
    NOW()
),
(
    'a1111111-1111-4111-8111-111111111108',
    'an.vo@taskmate.vn',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'Võ Hoài An',
    '0912345608',
    NOW(),
    1950000.00,
    0.00,
    'Số 85 Nguyễn Thị Thập, Phường Tân Phú, Quận 7, Thành phố Hồ Chí Minh',
    10.73810000,
    106.72180000,
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    phone_number = VALUES(phone_number),
    address = VALUES(address),
    latitude = VALUES(latitude),
    longitude = VALUES(longitude),
    updated_at = NOW();

-- 2. INSERT USER_ROLES (Moi user duoc gan ca role TASKER va CLIENT)
INSERT INTO user_roles (user_id, role)
VALUES
('a1111111-1111-4111-8111-111111111101', 'CLIENT'),
('a1111111-1111-4111-8111-111111111101', 'TASKER'),

('a1111111-1111-4111-8111-111111111102', 'CLIENT'),
('a1111111-1111-4111-8111-111111111102', 'TASKER'),

('a1111111-1111-4111-8111-111111111103', 'CLIENT'),
('a1111111-1111-4111-8111-111111111103', 'TASKER'),

('a1111111-1111-4111-8111-111111111104', 'CLIENT'),
('a1111111-1111-4111-8111-111111111104', 'TASKER'),

('a1111111-1111-4111-8111-111111111105', 'CLIENT'),
('a1111111-1111-4111-8111-111111111105', 'TASKER'),

('a1111111-1111-4111-8111-111111111106', 'CLIENT'),
('a1111111-1111-4111-8111-111111111106', 'TASKER'),

('a1111111-1111-4111-8111-111111111107', 'CLIENT'),
('a1111111-1111-4111-8111-111111111107', 'TASKER'),

('a1111111-1111-4111-8111-111111111108', 'CLIENT'),
('a1111111-1111-4111-8111-111111111108', 'TASKER')
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- 3. INSERT WORKER_PROFILES (Lien ket 1-1 voi users thong qua user_id)
INSERT INTO worker_profiles (id, user_id, description, status, rating, completed_tasks)
VALUES
(
    'b1111111-1111-4111-8111-111111111101',
    'a1111111-1111-4111-8111-111111111101',
    'Thợ mộc lành nghề với hơn 8 năm kinh nghiệm lắp ráp đồ nội thất IKEA, tủ quần áo, giường phản, kệ treo tường, bàn làm việc. Có đầy đủ máy bắn vít, thước laser, máy khoan bê tông.',
    'ONLINE',
    4.95,
    86
),
(
    'b1111111-1111-4111-8111-111111111102',
    'a1111111-1111-4111-8111-111111111102',
    'Kỹ thuật viên điện dân dụng, nhận xử lý chập cháy điện, thay aptomat, lắp đặt quạt trần, đèn trang trí, xử lý rò rỉ đường ống nước, thay vòi sen lavabo nhanh chóng, an toàn.',
    'ONLINE',
    4.90,
    112
),
(
    'b1111111-1111-4111-8111-111111111103',
    'a1111111-1111-4111-8111-111111111103',
    'Chuyên gia khoan tường không bụi, căn cốt laser chuẩn xác 100%. Nhận treo TV kích thước lớn, giàn phơi thông minh, gương led, tranh nghệ thuật, kệ sách và rèm cửa.',
    'ONLINE',
    4.98,
    145
),
(
    'b1111111-1111-4111-8111-111111111104',
    'a1111111-1111-4111-8111-111111111104',
    'Cung cấp dịch vụ giúp việc gia đình, vệ sinh nhà mới nhận bàn giao, tổng vệ sinh sâu căn hộ, khử mùi và làm sạch dầu mỡ nhà bếp, chà ron gạch phòng tắm cẩn thận, sạch sẽ.',
    'ONLINE',
    4.88,
    94
),
(
    'b1111111-1111-4111-8111-111111111105',
    'a1111111-1111-4111-8111-111111111105',
    'Đội thợ trẻ khoẻ, nhiệt tình, có xe bán tải hỗ trợ chuyển nhà trọn gói, bốc vác đồ nặng tầng cao, đóng gói màng PE chống trầy xước đồ đạc nội thất chuyên nghiệp.',
    'ONLINE',
    4.92,
    160
),
(
    'b1111111-1111-4111-8111-111111111106',
    'a1111111-1111-4111-8111-111111111106',
    'Có tay nghề cao về chăm sóc cây cảnh bonsai, cắt cỏ khuôn viên biệt thự sân vườn, bón phân tạo dáng cây cảnh, dọn cỏ dại và xử lý thoát nước cảnh quan.',
    'ONLINE',
    4.96,
    73
),
(
    'b1111111-1111-4111-8111-111111111107',
    'a1111111-1111-4111-8111-111111111107',
    'Thợ mộc tại TP. HCM, chuyên lắp ráp đồ gỗ JYSK, IKEA, tủ bếp, bàn ghế văn phòng và sửa chữa cửa gỗ, khóa cửa.',
    'ONLINE',
    4.91,
    105
),
(
    'b1111111-1111-4111-8111-111111111108',
    'a1111111-1111-4111-8111-111111111108',
    'Kỹ thuật viên cơ điện tử nhận sửa điện nước gia đình, lắp máy bơm tăng áp, vệ sinh máy giặt, gắn bình nóng lạnh và thiết bị thông minh tại Quận 7 & TP Thủ Đức.',
    'ONLINE',
    4.94,
    88
)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    status = VALUES(status),
    rating = VALUES(rating),
    completed_tasks = VALUES(completed_tasks);

-- 4. INSERT WORKER_DISTRICTS (Khu vuc hoat dong cua tung Worker)
-- Xoa truoc cac worker_districts cua cac profile tren de tranh trung lap khi chay lai
DELETE FROM worker_districts WHERE worker_profile_id IN (
    'b1111111-1111-4111-8111-111111111101',
    'b1111111-1111-4111-8111-111111111102',
    'b1111111-1111-4111-8111-111111111103',
    'b1111111-1111-4111-8111-111111111104',
    'b1111111-1111-4111-8111-111111111105',
    'b1111111-1111-4111-8111-111111111106',
    'b1111111-1111-4111-8111-111111111107',
    'b1111111-1111-4111-8111-111111111108'
);

INSERT INTO worker_districts (id, worker_profile_id, province_code, province_name, district_code, district_name)
VALUES
-- Tasker 1: Tran Van Hung (Cau Giay, Nam Tu Liem, Bac Tu Liem)
('c1111111-1111-4111-8111-111111111101', 'b1111111-1111-4111-8111-111111111101', '01', 'Thành phố Hà Nội', '005', 'Quận Cầu Giấy'),
('c1111111-1111-4111-8111-111111111102', 'b1111111-1111-4111-8111-111111111101', '01', 'Thành phố Hà Nội', '019', 'Quận Nam Từ Liêm'),
('c1111111-1111-4111-8111-111111111103', 'b1111111-1111-4111-8111-111111111101', '01', 'Thành phố Hà Nội', '020', 'Quận Bắc Từ Liêm'),

-- Tasker 2: Le Hoang Nam (Dong Da, Ba Dinh, Thanh Xuan)
('c1111111-1111-4111-8111-111111111201', 'b1111111-1111-4111-8111-111111111102', '01', 'Thành phố Hà Nội', '006', 'Quận Đống Đa'),
('c1111111-1111-4111-8111-111111111202', 'b1111111-1111-4111-8111-111111111102', '01', 'Thành phố Hà Nội', '001', 'Quận Ba Đình'),
('c1111111-1111-4111-8111-111111111203', 'b1111111-1111-4111-8111-111111111102', '01', 'Thành phố Hà Nội', '009', 'Quận Thanh Xuân'),

-- Tasker 3: Pham Minh Tuan (Hai Ba Trung, Hoang Mai, Hoan Kiem)
('c1111111-1111-4111-8111-111111111301', 'b1111111-1111-4111-8111-111111111103', '01', 'Thành phố Hà Nội', '007', 'Quận Hai Bà Trưng'),
('c1111111-1111-4111-8111-111111111302', 'b1111111-1111-4111-8111-111111111103', '01', 'Thành phố Hà Nội', '008', 'Quận Hoàng Mai'),
('c1111111-1111-4111-8111-111111111303', 'b1111111-1111-4111-8111-111111111103', '01', 'Thành phố Hà Nội', '002', 'Quận Hoàn Kiếm'),

-- Tasker 4: Nguyen Thi Mai (Cau Giay, Thanh Xuan, Tay Ho)
('c1111111-1111-4111-8111-111111111401', 'b1111111-1111-4111-8111-111111111104', '01', 'Thành phố Hà Nội', '005', 'Quận Cầu Giấy'),
('c1111111-1111-4111-8111-111111111402', 'b1111111-1111-4111-8111-111111111104', '01', 'Thành phố Hà Nội', '009', 'Quận Thanh Xuân'),
('c1111111-1111-4111-8111-111111111403', 'b1111111-1111-4111-8111-111111111104', '01', 'Thành phố Hà Nội', '003', 'Quận Tây Hồ'),

-- Tasker 5: Vu Duc Thang (Hoang Mai, Thanh Xuan, Ha Dong)
('c1111111-1111-4111-8111-111111111501', 'b1111111-1111-4111-8111-111111111105', '01', 'Thành phố Hà Nội', '008', 'Quận Hoàng Mai'),
('c1111111-1111-4111-8111-111111111502', 'b1111111-1111-4111-8111-111111111105', '01', 'Thành phố Hà Nội', '009', 'Quận Thanh Xuân'),
('c1111111-1111-4111-8111-111111111503', 'b1111111-1111-4111-8111-111111111105', '01', 'Thành phố Hà Nội', '021', 'Quận Hà Đông'),

-- Tasker 6: Dang Quoc Bao (Long Bien, Hoan Kiem, Hai Ba Trung)
('c1111111-1111-4111-8111-111111111601', 'b1111111-1111-4111-8111-111111111106', '01', 'Thành phố Hà Nội', '004', 'Quận Long Biên'),
('c1111111-1111-4111-8111-111111111602', 'b1111111-1111-4111-8111-111111111106', '01', 'Thành phố Hà Nội', '002', 'Quận Hoàn Kiếm'),
('c1111111-1111-4111-8111-111111111603', 'b1111111-1111-4111-8111-111111111106', '01', 'Thành phố Hà Nội', '007', 'Quận Hai Bà Trưng'),

-- Tasker 7: Huynh Tan Phat (Binh Thanh, Quan 1, Quan 3)
('c1111111-1111-4111-8111-111111111701', 'b1111111-1111-4111-8111-111111111107', '79', 'Thành phố Hồ Chí Minh', '778', 'Quận Bình Thạnh'),
('c1111111-1111-4111-8111-111111111702', 'b1111111-1111-4111-8111-111111111107', '79', 'Thành phố Hồ Chí Minh', '760', 'Quận 1'),
('c1111111-1111-4111-8111-111111111703', 'b1111111-1111-4111-8111-111111111107', '79', 'Thành phố Hồ Chí Minh', '770', 'Quận 3'),

-- Tasker 8: Vo Hoai An (Quan 7, TP Thu Duc)
('c1111111-1111-4111-8111-111111111801', 'b1111111-1111-4111-8111-111111111108', '79', 'Thành phố Hồ Chí Minh', '774', 'Quận 7'),
('c1111111-1111-4111-8111-111111111802', 'b1111111-1111-4111-8111-111111111108', '79', 'Thành phố Hồ Chí Minh', '769', 'Thành phố Thủ Đức');

-- 5. INSERT WORKER_SKILLS (Ky nang thuc te phu hop voi tung Worker)
-- Xoa truoc cac worker_skills cua cac profile tren de tranh trung lap khi chay lai
DELETE FROM worker_skills WHERE worker_profile_id IN (
    'b1111111-1111-4111-8111-111111111101',
    'b1111111-1111-4111-8111-111111111102',
    'b1111111-1111-4111-8111-111111111103',
    'b1111111-1111-4111-8111-111111111104',
    'b1111111-1111-4111-8111-111111111105',
    'b1111111-1111-4111-8111-111111111106',
    'b1111111-1111-4111-8111-111111111107',
    'b1111111-1111-4111-8111-111111111108'
);

INSERT INTO worker_skills (worker_profile_id, skill_id)
VALUES
-- Tasker 1: Tran Van Hung (Chuyen Lap rap do IKEA, Ban, Ke, Do noi that)
('b1111111-1111-4111-8111-111111111101', 'a5fa005c-a81f-11f1-a91a-0a0027000004'), -- Lắp ráp đồ IKEA
('b1111111-1111-4111-8111-111111111101', 'a5f9f6b4-a81f-11f1-a91a-0a0027000004'), -- Lắp ráp đồ nội thất
('b1111111-1111-4111-8111-111111111101', 'a5fa06cd-a81f-11f1-a91a-0a0027000004'), -- Lắp ráp bàn
('b1111111-1111-4111-8111-111111111101', 'a5fa11b4-a81f-11f1-a91a-0a0027000004'), -- Lắp ráp kệ

-- Tasker 2: Le Hoang Nam (Chuyen Dien, Nuoc, Den quat)
('b1111111-1111-4111-8111-111111111102', 'a5f38933-a81f-11f1-a91a-0a0027000004'), -- Sửa chữa điện
('b1111111-1111-4111-8111-111111111102', 'a5f3802f-a81f-11f1-a91a-0a0027000004'), -- Sửa chữa ống nước
('b1111111-1111-4111-8111-111111111102', 'b1205913-1c62-4396-8a2c-9baef62e8c77'), -- Lắp quạt trần & đèn chùm

-- Tasker 3: Pham Minh Tuan (Khoan laser, Treo TV, Treo tranh, Gan ke, Lap rem)
('b1111111-1111-4111-8111-111111111103', '5566a3c3-cbc5-4259-bc44-f5e212ba11a4'), -- Khoan tường chuẩn laser thăng bằng
('b1111111-1111-4111-8111-111111111103', '773f537e-a066-4b86-89f4-1fa9442c8821'), -- Treo TV lên tường
('b1111111-1111-4111-8111-111111111103', '4a74c030-db6b-4729-a068-d58c7cec35e8'), -- Treo gương & tranh nghệ thuật
('b1111111-1111-4111-8111-111111111103', '74a663e4-ce9f-4480-a6f9-11c9170f6b35'), -- Gắn giá kệ & móc treo
('b1111111-1111-4111-8111-111111111103', 'b2fede00-64a7-4aaa-a810-35fb3a6361b5'), -- Lắp rèm cửa sổ & màn che

-- Tasker 4: Nguyen Thi Mai (Ve sinh nha cua, chuyen sau, nha bep, phong tam)
('b1111111-1111-4111-8111-111111111104', 'a5f1cbc4-a81f-11f1-a91a-0a0027000004'), -- Vệ sinh nhà cửa
('b1111111-1111-4111-8111-111111111104', 'a5f1d4fa-a81f-11f1-a91a-0a0027000004'), -- Vệ sinh chuyên sâu
('b1111111-1111-4111-8111-111111111104', 'a5f1e4cb-a81f-11f1-a91a-0a0027000004'), -- Vệ sinh nhà bếp
('b1111111-1111-4111-8111-111111111104', 'a5f1e8f2-a81f-11f1-a91a-0a0027000004'), -- Vệ sinh phòng tắm

-- Tasker 5: Vu Duc Thang (Chuyen nha, Boc xep, Van chuyen do dac, Thao do dong goi)
('b1111111-1111-4111-8111-111111111105', 'a5f55d23-a81f-11f1-a91a-0a0027000004'), -- Chuyển nhà
('b1111111-1111-4111-8111-111111111105', 'a5f553ad-a81f-11f1-a91a-0a0027000004'), -- Vận chuyển đồ nội thất
('b1111111-1111-4111-8111-111111111105', 'a5f566c8-a81f-11f1-a91a-0a0027000004'), -- Tháo dỡ và đóng gói
('b1111111-1111-4111-8111-111111111105', 'a5f56b65-a81f-11f1-a91a-0a0027000004'), -- Khuân vác đồ nặng
('b1111111-1111-4111-8111-111111111105', 'a5f56fbd-a81f-11f1-a91a-0a0027000004'), -- Bốc xếp hàng hóa

-- Tasker 6: Dang Quoc Bao (San vuon, Cay canh, Cat co, Tia cay)
('b1111111-1111-4111-8111-111111111106', 'a5fd044b-a81f-11f1-a91a-0a0027000004'), -- Chăm sóc cây cảnh
('b1111111-1111-4111-8111-111111111106', 'a5fd0a00-a81f-11f1-a91a-0a0027000004'), -- Cắt tỉa cây
('b1111111-1111-4111-8111-111111111106', 'a5fcfa2b-a81f-11f1-a91a-0a0027000004'), -- Cắt cỏ
('b1111111-1111-4111-8111-111111111106', 'a5fd0f14-a81f-11f1-a91a-0a0027000004'), -- Dọn dẹp sân vườn

-- Tasker 7: Huynh Tan Phat (Lap rap go, Sua chua do go, Cua go)
('b1111111-1111-4111-8111-111111111107', 'a5fa005c-a81f-11f1-a91a-0a0027000004'), -- Lắp ráp đồ IKEA
('b1111111-1111-4111-8111-111111111107', 'a5f9f6b4-a81f-11f1-a91a-0a0027000004'), -- Lắp ráp đồ nội thất
('b1111111-1111-4111-8111-111111111107', 'a5f39762-a81f-11f1-a91a-0a0027000004'), -- Sửa chữa đồ nội thất
('b1111111-1111-4111-8111-111111111107', 'a5f392f4-a81f-11f1-a91a-0a0027000004'), -- Sửa chữa cửa

-- Tasker 8: Vo Hoai An (Sua chua dien nuoc, Lap den quat)
('b1111111-1111-4111-8111-111111111108', 'a5f38933-a81f-11f1-a91a-0a0027000004'), -- Sửa chữa điện
('b1111111-1111-4111-8111-111111111108', 'a5f3802f-a81f-11f1-a91a-0a0027000004'), -- Sửa chữa ống nước
('b1111111-1111-4111-8111-111111111108', 'b1205913-1c62-4396-8a2c-9baef62e8c77'); -- Lắp quạt trần & đèn chùm

COMMIT;
