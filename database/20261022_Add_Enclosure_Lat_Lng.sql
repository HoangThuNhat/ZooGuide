-- Migration: Bổ sung tọa độ địa lý thực tế (Latitude, Longitude) cho bảng ENCLOSURES
-- Phục vụ tích hợp bản đồ địa lý thực tế Thảo Cầm Viên Sài Gòn (OpenStreetMap / Leaflet)

ALTER TABLE "ENCLOSURES" ADD COLUMN IF NOT EXISTS "Latitude" numeric(9,6);
ALTER TABLE "ENCLOSURES" ADD COLUMN IF NOT EXISTS "Longitude" numeric(9,6);

-- Cập nhật tọa độ WGS84 thực tế tại Thảo Cầm Viên Sài Gòn cho các chuồng trại hiện hữu
UPDATE "ENCLOSURES" SET "Latitude" = 10.788500, "Longitude" = 106.706100 WHERE "EnclosureId" = 2; -- Chuồng Hổ Bengal
UPDATE "ENCLOSURES" SET "Latitude" = 10.788700, "Longitude" = 106.706400 WHERE "EnclosureId" = 3; -- Chuồng Hổ Siberia & Hổ Trắng
UPDATE "ENCLOSURES" SET "Latitude" = 10.789200, "Longitude" = 106.706800 WHERE "EnclosureId" = 4; -- Bãi thả Voi Châu Á
UPDATE "ENCLOSURES" SET "Latitude" = 10.786900, "Longitude" = 106.704200 WHERE "EnclosureId" = 5; -- Lồng vòm Chim & Hồ Hồng Hạc
UPDATE "ENCLOSURES" SET "Latitude" = 10.788200, "Longitude" = 106.705100 WHERE "EnclosureId" = 7; -- Chuồng Sư Tử Hoàng Gia
UPDATE "ENCLOSURES" SET "Latitude" = 10.786200, "Longitude" = 106.707200 WHERE "EnclosureId" = 8; -- Khuôn viên Thú Nhỏ Thân Thiện (Petting Zoo)

-- Cập nhật tọa độ chuẩn xác Thảo Cầm Viên cho các phân khu (Areas)
UPDATE "AREAS" SET "Latitude" = 10.788200, "Longitude" = 106.705100 WHERE "AreaId" = 1; -- Khu Sư Tử
UPDATE "AREAS" SET "Latitude" = 10.788600, "Longitude" = 106.706200 WHERE "AreaId" = 2; -- Khu Hổ
UPDATE "AREAS" SET "Latitude" = 10.789200, "Longitude" = 106.706800 WHERE "AreaId" = 3; -- Khu Động Vật Ăn Cỏ (Voi)
UPDATE "AREAS" SET "Latitude" = 10.786900, "Longitude" = 106.704200 WHERE "AreaId" = 4; -- Khu Chim & Lồng Vòm
UPDATE "AREAS" SET "Latitude" = 10.788000, "Longitude" = 106.705500 WHERE "AreaId" = 5; -- Khu Gấu
UPDATE "AREAS" SET "Latitude" = 10.787100, "Longitude" = 106.705800 WHERE "AreaId" = 6; -- Khu Thú Nhỏ & Linh Trưởng
UPDATE "AREAS" SET "Latitude" = 10.788500, "Longitude" = 106.705800 WHERE "AreaId" = 7; -- Khu Động Vật Ăn Thịt
