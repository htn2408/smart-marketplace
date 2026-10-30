-- ============================================================
-- Thêm cột mã hành chính (Esgoo) vào bảng tasks
--
-- Bối cảnh: matching Tasker trước đây so tên tỉnh/quận bằng chữ
-- (dễ gãy vì dấu tiếng Việt, định dạng "Quận 1" vs "Q.1").
-- Từ nay task lưu thêm province_code/district_code và filter
-- ưu tiên so code; task cũ không có code vẫn chạy theo tên.
--
-- Cách chạy (MySQL Workbench hoặc mysql CLI):
--   mysql -u <user> -p smart_marketplace < alter_tasks_add_codes.sql
-- ============================================================

USE smart_marketplace;

ALTER TABLE tasks
    ADD COLUMN province_code VARCHAR(20) NULL AFTER district,
    ADD COLUMN district_code VARCHAR(20) NULL AFTER province_code;

-- (Tuỳ chọn) Backfill task cũ theo tên — chỉnh lại chuỗi so khớp
-- theo dữ liệu thực tế của bạn nếu cần:
-- UPDATE tasks t
-- JOIN worker_districts wd
--   ON LOWER(wd.province_name) = LOWER(t.city)
--  AND LOWER(wd.district_name) = LOWER(t.district)
-- SET t.province_code = wd.province_code,
--     t.district_code = wd.district_code;
