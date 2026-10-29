import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
conn_str = os.getenv("SUPABASE_CONNECTION_STRING")
params = {}
for part in conn_str.split(";"):
    if "=" in part:
        k, v = part.split("=", 1)
        k = k.strip().lower()
        v = v.strip()
        if k == "host": params["host"] = v
        elif k == "port": params["port"] = int(v)
        elif k == "database": params["dbname"] = v
        elif k == "username": params["user"] = v
        elif k == "password": params["password"] = v
        elif k == "ssl mode": params["sslmode"] = v.lower()

conn = psycopg2.connect(**params)
cur = conn.cursor(cursor_factory=RealDictCursor)

print("Starting transaction for Areas and Enclosures sync...")

# 1. CANONICAL AREAS (7 Areas)
canonical_areas = [
    {
        "id": 1,
        "name": "Khu Bảo Tồn Bò Sát & Lưỡng Cư",
        "code": "AREA-REPTILE",
        "description": "Khu nhà kính điều hòa và hoa viên sinh thái bảo tồn các loài rắn hổ chúa, trăn gấm, kỳ đà và các loài rùa cạn nhiệt đới quý hiếm.",
        "lat": 10.788000,
        "lng": 106.706500,
        "radius": 40.0,
        "map_x": 58.0,
        "map_y": 45.0,
        "status": "Active",
        "source": "Thảo Cầm Viên Sài Gòn - Khu bò sát sau hồ sen"
    },
    {
        "id": 2,
        "name": "Khu Vườn Thú Thiếu Nhi & Thân Thiện",
        "code": "AREA-PETTING",
        "description": "Khuôn viên sinh thái dành riêng cho trẻ em và gia đình tương tác trực tiếp với các loài thú nhỏ hiền lành: chuột lang nước Capybara, dê lùn, cừu và thỏ kiểng.",
        "lat": 10.786200,
        "lng": 106.707200,
        "radius": 45.0,
        "map_x": 89.0,
        "map_y": 89.0,
        "status": "Active",
        "source": "Thảo Cầm Viên Sài Gòn - Vườn thú thân thiện cổng B"
    },
    {
        "id": 3,
        "name": "Khu Động Vật Ăn Cỏ & Móng Guốc",
        "code": "AREA-HERBIVORE",
        "description": "Thung lũng đồng cỏ bán hoang dã rộng lớn trải dài ven kênh Nhiêu Lộc, nơi sinh sống của voi châu Á, hà mã, tê giác trắng, hươu cao cổ, ngựa vằn và hươu vàng.",
        "lat": 10.789200,
        "lng": 106.706800,
        "radius": 60.0,
        "map_x": 65.0,
        "map_y": 22.0,
        "status": "Active",
        "source": "Thảo Cầm Viên Sài Gòn - Phân khu ăn cỏ Đông Bắc"
    },
    {
        "id": 4,
        "name": "Khu Vườn Chim & Đầm Nước Nhiệt Đới",
        "code": "AREA-AVIARY",
        "description": "Quần xã lồng vòm sinh thái cao 15m cùng hồ nước ngập mặn nuôi dưỡng chim hồng hoàng, niệc mỏ vằn, cao cát, bồ nông chân xám, trĩ sao và vẹt trắng mào vàng.",
        "lat": 10.786900,
        "lng": 106.704200,
        "radius": 45.0,
        "map_x": 35.5,
        "map_y": 74.0,
        "status": "Active",
        "source": "Thảo Cầm Viên Sài Gòn - Khu lồng chim vòm Tây Nam"
    },
    {
        "id": 5,
        "name": "Khu Di Tích, Cảnh Quan & Cây Di Sản",
        "code": "AREA-HERITAGE",
        "description": "Trục cảnh quan văn hóa lịch sử trung tâm quy tụ Đền Thờ Vua Hùng (1926), Bảo Tàng Lịch Sử TP.HCM, Hồ Sen Thủy Tạ và quần thể cổ thụ sọ khỉ hơn 130 năm tuổi.",
        "lat": 10.786800,
        "lng": 106.704800,
        "radius": 50.0,
        "map_x": 48.0,
        "map_y": 55.0,
        "status": "Active",
        "source": "Thảo Cầm Viên Sài Gòn - Quần thể di tích lịch sử và cây di sản"
    },
    {
        "id": 6,
        "name": "Khu Đảo Vượn & Linh Trưởng Quý Hiếm",
        "code": "AREA-PRIMATE",
        "description": "Hệ thống cù lao ốc đảo sinh thái giữa hồ rợp bóng cổ thụ, nơi nuôi dưỡng đười ươi Bornean, vượn má vàng, voọc chà vá chân xám và voọc chà vá chân đen đặc hữu.",
        "lat": 10.787100,
        "lng": 106.705800,
        "radius": 50.0,
        "map_x": 57.0,
        "map_y": 64.0,
        "status": "Active",
        "source": "Thảo Cầm Viên Sài Gòn - Đảo vượn má hung và linh trưởng"
    },
    {
        "id": 7,
        "name": "Khu Động Vật Ăn Thịt Hoàng Gia",
        "code": "AREA-CARNIVORE",
        "description": "Khu vực bán hoang dã kiên cố Tây Bắc bảo tồn các loài thú săn mồi dũng mãnh: Hổ Bengal, Hổ Siberia, Sư tử châu Phi, Báo hoa mai, Báo gấm và Báo lửa.",
        "lat": 10.788500,
        "lng": 106.705800,
        "radius": 55.0,
        "map_x": 63.0,
        "map_y": 30.0,
        "status": "Active",
        "source": "Thảo Cầm Viên Sài Gòn - Khu chuồng cọp và thú dữ Tây Bắc"
    }
]

for a in canonical_areas:
    cur.execute("""
        INSERT INTO "AREAS" ("AreaId", "Code", "Name", "Description", "Latitude", "Longitude", "RadiusMeters", "MapX", "MapY", "Status", "ReferenceSource", "CreatedAt", "UpdatedAt")
        VALUES (%(id)s, %(code)s, %(name)s, %(description)s, %(lat)s, %(lng)s, %(radius)s, %(map_x)s, %(map_y)s, %(status)s, %(source)s, NOW(), NOW())
        ON CONFLICT ("AreaId") DO UPDATE SET
            "Code" = EXCLUDED."Code",
            "Name" = EXCLUDED."Name",
            "Description" = EXCLUDED."Description",
            "Latitude" = EXCLUDED."Latitude",
            "Longitude" = EXCLUDED."Longitude",
            "RadiusMeters" = EXCLUDED."RadiusMeters",
            "MapX" = EXCLUDED."MapX",
            "MapY" = EXCLUDED."MapY",
            "Status" = EXCLUDED."Status",
            "ReferenceSource" = EXCLUDED."ReferenceSource",
            "UpdatedAt" = NOW();
    """, a)
print("Updated 7 canonical Areas successfully.")

# 2. CANONICAL ENCLOSURES (23 Enclosures for 22 resident species + tiger variants)
canonical_enclosures = [
    # CARNIVORES (Area 7)
    {
        "id": 2, "area_id": 7, "code": "ENC-TIG-01", "name": "Chuồng Hổ Bengal",
        "description": "Khuôn viên bán hoang dã dành cho loài hổ Bengal quý hiếm, trang bị hồ nước ngâm mình, vách đá nhân tạo và bóng râm tự nhiên.",
        "lat": 10.788500, "lng": 106.706100, "map_x": 63.0, "map_y": 28.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/bao-hoa-mai/z7342043335000-164034e3e1c286c255bec1bddf6cc023.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Chuồng Hổ Bengal"
    },
    {
        "id": 3, "area_id": 7, "code": "ENC-TIG-02", "name": "Chuồng Hổ Siberia & Hổ Trắng",
        "description": "Khuôn viên nuôi dưỡng và bảo tồn loài hổ trắng kỳ vĩ cùng hổ Siberia to lớn với hồ tắm suối mát và nền đất cỏ tự nhiên.",
        "lat": 10.788700, "lng": 106.706400, "map_x": 67.0, "map_y": 31.5, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/bao-hoa-mai/z7342043335000-164034e3e1c286c255bec1bddf6cc023.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Chuồng Hổ Trắng"
    },
    {
        "id": 7, "area_id": 7, "code": "ENC-LIO-01", "name": "Chuồng Sư Tử Hoàng Gia",
        "description": "Không gian mở rộng dành cho đàn sư tử châu Phi với gò đá cao đón nắng, bóng cây xanh mát và hào nước ngăn cách an toàn.",
        "lat": 10.788200, "lng": 106.705100, "map_x": 42.5, "map_y": 17.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/image-1-1.png",
        "source": "Thảo Cầm Viên Sài Gòn - Chuồng Sư Tử"
    },
    {
        "id": 9, "area_id": 7, "code": "ENC-LEO-01", "name": "Chuồng Nuôi Báo Hoa Mai",
        "description": "Khu chuồng với hệ thống cành cây leo trèo tự nhiên mô phỏng môi trường rừng rậm cho báo hoa mai sinh hoạt vận động.",
        "lat": 10.788400, "lng": 106.705600, "map_x": 55.0, "map_y": 25.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/bao-hoa-mai/z7342043335000-164034e3e1c286c255bec1bddf6cc023.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Khu thú họ Mèo"
    },
    {
        "id": 10, "area_id": 7, "code": "ENC-CLO-01", "name": "Chuồng Bảo Tồn Báo Gấm",
        "description": "Chuồng nuôi dưỡng báo gấm thiết kế nhiều tầng sàn gỗ cao và cành cây lớn, tôn trọng tập tính ẩn dật và leo trèo tuyệt đỉnh.",
        "lat": 10.788600, "lng": 106.705400, "map_x": 58.0, "map_y": 23.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/bao-gam/img-7106.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Khu bảo tồn Báo Gấm"
    },
    {
        "id": 11, "area_id": 7, "code": "ENC-GCA-01", "name": "Chuồng Nuôi Dưỡng Báo Lửa",
        "description": "Khuôn viên yên tĩnh với thảm thực vật rậm rạp phù hợp với bản tính nhút nhát và cảnh giác của loài báo lửa quý hiếm.",
        "lat": 10.788750, "lng": 106.705200, "map_x": 60.0, "map_y": 21.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/z7342043177913-83bd655fa361a73223199848bbac149f.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Khu bảo tồn Báo Lửa"
    },

    # HERBIVORES (Area 3)
    {
        "id": 4, "area_id": 3, "code": "ENC-ELE-01", "name": "Bãi Thả Voi Châu Á",
        "description": "Khu bãi đất rộng lớn với sân vận động tập luyện và hồ tắm bùn tự nhiên cho đàn voi châu Á vận động và tương tác du khách.",
        "lat": 10.789200, "lng": 106.706800, "map_x": 65.0, "map_y": 22.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/z7140293588104-8e47e8df88406e1c32fc5c5b77635903.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Bãi thả Voi"
    },
    {
        "id": 12, "area_id": 3, "code": "ENC-HIP-01", "name": "Bãi Thả Hà Mã",
        "description": "Hồ nước sâu thông thủy và bãi tắm bùn ven bờ kênh Nhiêu Lộc, nơi đàn hà mã bơi lội và thư giãn dưới làn nước mát.",
        "lat": 10.789450, "lng": 106.707300, "map_x": 70.0, "map_y": 18.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/z7382686431535-ea0719e14b8c3dc7c0db83b066d73cef.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Hồ Hà Mã"
    },
    {
        "id": 13, "area_id": 3, "code": "ENC-RHI-01", "name": "Khu Vực Tê Giác Trắng",
        "description": "Bãi thả đất kiên cố ngoài trời với bãi tắm bùn khoáng và máng cỏ khô cho các cá thể tê giác trắng châu Phi khổng lồ.",
        "lat": 10.789600, "lng": 106.706500, "map_x": 62.0, "map_y": 15.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/z7384023045171-e79b841ad199c4acd5cea4af3be9a33d.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Khu Tê Giác"
    },
    {
        "id": 14, "area_id": 3, "code": "ENC-GIR-01", "name": "Đồng Cỏ Hươu Cao Cổ",
        "description": "Khuôn viên thảo nguyên rào chắn cao với giàn cho ăn trên cao cho bầy hươu cao cổ đón nhận thức ăn lá cây tươi ngon.",
        "lat": 10.788950, "lng": 106.707100, "map_x": 73.0, "map_y": 26.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/image-1-4.png",
        "source": "Thảo Cầm Viên Sài Gòn - Khu Hươu Cao Cổ"
    },
    {
        "id": 15, "area_id": 3, "code": "ENC-ZEB-01", "name": "Khu Thảo Nguyên Ngựa Vằn",
        "description": "Đồng cỏ xanh tươi nơi đàn ngựa vằn châu Phi tự do phi nước kiệu và gặm cỏ trong không gian ngập tràn nắng ấm.",
        "lat": 10.788800, "lng": 106.707450, "map_x": 76.0, "map_y": 28.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/sony-ilce-1-5664x3768-000797-dxo-deepprime-xd2s-xd.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Khu Ngựa Vằn"
    },
    {
        "id": 16, "area_id": 3, "code": "ENC-HOG-01", "name": "Chuồng Bảo Tồn Hươu Vàng",
        "description": "Khu vực bảo tồn yên bình cho loài hươu vàng bản địa Đông Nam Á với thảm cỏ và rặng cây xanh che bóng mát.",
        "lat": 10.789100, "lng": 106.706100, "map_x": 60.0, "map_y": 24.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/image-1.png",
        "source": "Thảo Cầm Viên Sài Gòn - Khu Hươu Vàng"
    },

    # AVIARY (Area 4)
    {
        "id": 5, "area_id": 4, "code": "ENC-BIR-01", "name": "Lồng Vòm Chim Nhiệt Đới",
        "description": "Lồng vòm lưới thép cao 15m nuôi thả tự nhiên chim Hồng hoàng cùng nhiều loài chim rừng nhiệt đới quý hiếm.",
        "lat": 10.786900, "lng": 106.704200, "map_x": 35.5, "map_y": 74.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/z7140293627964-b81f1853606b29f9df3bb9f0d0144512.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Lồng vòm chim"
    },
    {
        "id": 17, "area_id": 4, "code": "ENC-WRE-01", "name": "Chuồng Chim Niệc Mỏ Vằn",
        "description": "Khu chuồng với các thân cây rỗng tạo tổ sinh sản chuyên biệt cho loài niệc mỏ vằn quý hiếm.",
        "lat": 10.787100, "lng": 106.704000, "map_x": 33.0, "map_y": 70.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/niec-mo-van/z7342042858900-502a5cf3a520f8fe6ff8ff978536f756.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Chuồng Niệc Mỏ Vằn"
    },
    {
        "id": 18, "area_id": 4, "code": "ENC-HOR-01", "name": "Khu Vực Cao Cát Bụng Trắng",
        "description": "Nhà lồng thoáng mát dành cho loài cao cát bụng trắng hiếu động với nhiều cành đậu bằng gỗ lim.",
        "lat": 10.787250, "lng": 106.704300, "map_x": 37.0, "map_y": 68.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/cao-cat-bung-trang/z7342042730628-912f2c83c27181f72782782e468da40e.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Khu Cao Cát"
    },
    {
        "id": 19, "area_id": 4, "code": "ENC-PEL-01", "name": "Hồ Thủy Điểu & Bồ Nông",
        "description": "Hồ nước trung tâm với các bãi đáp bằng gỗ và đảo đá nổi dành riêng cho đàn bồ nông chân xám bơi lội và bắt cá.",
        "lat": 10.786700, "lng": 106.704500, "map_x": 39.0, "map_y": 77.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/z7140293466185-3529d443e94474f885e3f421df67db32.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Hồ Thủy Điểu"
    },
    {
        "id": 20, "area_id": 4, "code": "ENC-ARG-01", "name": "Khu Vực Trĩ Sao Bản Địa",
        "description": "Khuôn viên sinh cảnh rậm rạp mô phỏng tán rừng Trường Sơn dành cho loài trĩ sao đặc hữu múa đuôi khoe sắc.",
        "lat": 10.786850, "lng": 106.703800, "map_x": 31.0, "map_y": 75.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/tri-sao/img-7140.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Khu Trĩ Sao"
    },
    {
        "id": 21, "area_id": 4, "code": "ENC-COC-01", "name": "Nhà Lưới Vẹt Trắng Mào Vàng",
        "description": "Nhà lưới bán cầu đầy màu sắc dành cho các cá thể vẹt mào trắng thông minh, hoạt bát và thân thiện với du khách.",
        "lat": 10.787350, "lng": 106.704500, "map_x": 38.0, "map_y": 66.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/vet-trang-mao-vang/img-7157.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Khu Vẹt Mào"
    },

    # PRIMATES (Area 6)
    {
        "id": 22, "area_id": 6, "code": "ENC-ORA-01", "name": "Ngôi Nhà Đười Ươi Bornean",
        "description": "Quần thể nhà leo trèo dây thừng và giàn gỗ tầng cao kiên cố cho loài vượn người Borneo vận động và rèn luyện trí tuệ.",
        "lat": 10.787300, "lng": 106.705900, "map_x": 58.0, "map_y": 60.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/duoi-uoi/img-7072.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Khu Đười Ươi"
    },
    {
        "id": 23, "area_id": 6, "code": "ENC-GIB-01", "name": "Đảo Vượn Má Vàng",
        "description": "Đảo nổi giữa hồ đối diện khu chuồng cọp với các cột gỗ và dây đu cho bầy vượn má vàng đu chuyền cất tiếng hót vang rực rỡ buổi sớm.",
        "lat": 10.787100, "lng": 106.705800, "map_x": 57.0, "map_y": 64.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/vuon-ma-vang/img-7049.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Đảo Vượn Má Vàng"
    },
    {
        "id": 24, "area_id": 6, "code": "ENC-DOU-01", "name": "Khu Bán Hoang Dã Voọc Chà Vá",
        "description": "Khu bảo tồn chuyên biệt nuôi dưỡng cả hai loài nữ hoàng linh trưởng: Chà vá chân xám và Chà vá chân đen với tán cây rừng xanh mướt.",
        "lat": 10.786950, "lng": 106.706100, "map_x": 60.0, "map_y": 68.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/cha-va-chan-xam/z7342042971216-5fa7b67069c9b139b4b9b91c8baef415.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Khu Voọc Chà Vá"
    },

    # PETTING ZOO (Area 2)
    {
        "id": 8, "area_id": 2, "code": "ENC-PET-01", "name": "Khuôn Viên Thú Nhỏ Thân Thiện",
        "description": "Khu vực vườn thú thiếu nhi thân thiện gần Cổng B, nơi du khách và trẻ nhỏ có thể vuốt ve, cho chuột lang nước Capybara, dê lùn, cừu và thỏ ăn rau cỏ tươi.",
        "lat": 10.786200, "lng": 106.707200, "map_x": 89.0, "map_y": 89.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/z7140293527263-6cfc72d169c97b83d10a26df081498b5.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Vườn thú thân thiện"
    },

    # REPTILES (Area 1)
    {
        "id": 25, "area_id": 1, "code": "ENC-REP-01", "name": "Nhà Trưng Bày Rắn Hổ Chúa & Bò Sát",
        "description": "Nhà kính bảo tồn bò sát sau hồ sen trang bị kiểm soát nhiệt độ an toàn, nuôi dưỡng cá thể rắn hổ chúa kỳ vĩ, trăn gấm và rùa cạn nhiệt đới.",
        "lat": 10.788000, "lng": 106.706500, "map_x": 58.0, "map_y": 45.0, "status": "Active",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/ran-ho-chua/z7342042790939-2a933f38e6ff8a63583648e42777ae03.jpg",
        "source": "Thảo Cầm Viên Sài Gòn - Khu Bò Sát"
    }
]

for enc in canonical_enclosures:
    cur.execute("""
        INSERT INTO "ENCLOSURES" ("EnclosureId", "AreaId", "Code", "Name", "Description", "Latitude", "Longitude", "MapX", "MapY", "Status", "ImageUrl", "ReferenceSource", "CreatedAt", "UpdatedAt")
        VALUES (%(id)s, %(area_id)s, %(code)s, %(name)s, %(description)s, %(lat)s, %(lng)s, %(map_x)s, %(map_y)s, %(status)s, %(image_url)s, %(source)s, NOW(), NOW())
        ON CONFLICT ("EnclosureId") DO UPDATE SET
            "AreaId" = EXCLUDED."AreaId",
            "Code" = EXCLUDED."Code",
            "Name" = EXCLUDED."Name",
            "Description" = EXCLUDED."Description",
            "Latitude" = EXCLUDED."Latitude",
            "Longitude" = EXCLUDED."Longitude",
            "MapX" = EXCLUDED."MapX",
            "MapY" = EXCLUDED."MapY",
            "Status" = EXCLUDED."Status",
            "ImageUrl" = EXCLUDED."ImageUrl",
            "ReferenceSource" = EXCLUDED."ReferenceSource",
            "UpdatedAt" = NOW();
    """, enc)
print("Updated 23 canonical Enclosures successfully.")

# Update EnclosureId sequence if needed
cur.execute('SELECT setval(pg_get_serial_sequence(\'"ENCLOSURES"\', \'EnclosureId\'), (SELECT MAX("EnclosureId") FROM "ENCLOSURES"));')

# 3. MAP ALL 22 ANIMALS TO THEIR EXACT ENCLOSURE & AREA
animal_mappings = [
    # Herbivores (Area 3)
    {"animal_id": 1, "area_id": 3, "enc_id": 4},   # Đàn Voi Châu Á -> Bãi Thả Voi
    {"animal_id": 4, "area_id": 3, "enc_id": 12},  # Đàn Hà Mã -> Bãi Thả Hà Mã
    {"animal_id": 5, "area_id": 3, "enc_id": 13},  # Tê Giác Trắng -> Khu Vực Tê Giác
    {"animal_id": 6, "area_id": 3, "enc_id": 14},  # Đàn Hươu Cao Cổ -> Đồng Cỏ Hươu Cao Cổ
    {"animal_id": 7, "area_id": 3, "enc_id": 15},  # Đàn Ngựa Vằn -> Khu Thảo Nguyên Ngựa Vằn
    {"animal_id": 8, "area_id": 3, "enc_id": 16},  # Hươu Vàng -> Chuồng Bảo Tồn Hươu Vàng

    # Carnivores (Area 7)
    {"animal_id": 2, "area_id": 7, "enc_id": 2},   # Hổ trắng Ngộ Không -> Chuồng Hổ Bengal
    {"animal_id": 3, "area_id": 7, "enc_id": 7},   # Sư tử trắng Mimi -> Chuồng Sư Tử Hoàng Gia
    {"animal_id": 9, "area_id": 7, "enc_id": 9},   # Báo Hoa Mai -> Chuồng Báo Hoa Mai
    {"animal_id": 10, "area_id": 7, "enc_id": 10}, # Báo Gấm -> Chuồng Báo Gấm
    {"animal_id": 11, "area_id": 7, "enc_id": 11}, # Báo Lửa -> Chuồng Báo Lửa

    # Aviary (Area 4)
    {"animal_id": 16, "area_id": 4, "enc_id": 5},  # Chim Hồng Hoàng -> Lồng Vòm Chim Nhiệt Đới
    {"animal_id": 17, "area_id": 4, "enc_id": 17}, # Niệc Mỏ Vằn -> Chuồng Chim Niệc Mỏ Vằn
    {"animal_id": 18, "area_id": 4, "enc_id": 18}, # Cao Cát Bụng Trắng -> Khu Vực Cao Cát Bụng Trắng
    {"animal_id": 19, "area_id": 4, "enc_id": 19}, # Đàn Bồ Nông Chân Xám -> Hồ Thủy Điểu & Bồ Nông
    {"animal_id": 20, "area_id": 4, "enc_id": 20}, # Trĩ Sao -> Khu Vực Trĩ Sao Bản Địa
    {"animal_id": 21, "area_id": 4, "enc_id": 21}, # Vẹt Trắng Mào Trắng -> Nhà Lưới Vẹt Trắng Mào Vàng

    # Primates (Area 6)
    {"animal_id": 12, "area_id": 6, "enc_id": 22}, # Đười Ươi Bornean -> Ngôi Nhà Đười Ươi Bornean
    {"animal_id": 13, "area_id": 6, "enc_id": 23}, # Vượn Má Vàng -> Đảo Vượn Má Vàng
    {"animal_id": 14, "area_id": 6, "enc_id": 24}, # Chà Vá Chân Xám -> Khu Bán Hoang Dã Voọc Chà Vá
    {"animal_id": 15, "area_id": 6, "enc_id": 24}, # Chà Vá Chân Đen -> Khu Bán Hoang Dã Voọc Chà Vá

    # Reptiles (Area 1)
    {"animal_id": 22, "area_id": 1, "enc_id": 25}  # Rắn Hổ Chúa -> Nhà Trưng Bày Rắn Hổ Chúa & Bò Sát
]

for m in animal_mappings:
    cur.execute("""
        UPDATE "ANIMALS"
        SET "AreaId" = %(area_id)s,
            "EnclosureId" = %(enc_id)s,
            "UpdatedAt" = NOW()
        WHERE "AnimalId" = %(animal_id)s;
    """, m)
print("Updated all 22 Animals with verified EnclosureId and AreaId.")

# 4. SYNC POINTS_OF_INTEREST (Ensure no stale coordinates or incorrect links)
cur.execute("""
    UPDATE "POINTS_OF_INTEREST"
    SET "AreaId" = 5
    WHERE "Category" IN ('Landmark', 'Botanical', 'Attraction');
""")
cur.execute("""
    UPDATE "POINTS_OF_INTEREST"
    SET "AreaId" = 2
    WHERE "Code" = 'ENC-PET-01';
""")
print("Synced POI Area links.")

conn.commit()
print("All sync operations committed successfully!")
conn.close()
