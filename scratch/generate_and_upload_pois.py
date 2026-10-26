import os
import json
import asyncio
import requests
from dotenv import load_dotenv
import edge_tts

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "narration-audio")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

POIS_DATA = [
    {
        "code": "GATE-A",
        "name": "Cổng Chính A (Lê Duẩn & Nguyễn Bỉnh Khiêm)",
        "category": "Entrance",
        "lat": 10.7858000,
        "lng": 106.7046000,
        "area_id": None,
        "desc": "Cổng vào chính Thảo Cầm Viên đối diện đại lộ Lê Duẩn. Có quầy bán vé trung tâm, bến xe điện tham quan và trung tâm thông tin du khách.",
        "vi_title": "Thuyết minh: Cổng Chính A (Lê Duẩn & Nguyễn Bỉnh Khiêm)",
        "vi_content": "Chào mừng bạn đến với Cổng Chính A của Thảo Cầm Viên Sài Gòn, tọa lạc tại giao lộ Lê Duẩn và Nguyễn Bỉnh Khiêm. Đây là cổng đón tiếp trung tâm với quầy bán vé chính, điểm khởi hành của đoàn xe điện tham quan và quầy thông tin hỗ trợ du khách.",
        "en_title": "Audio Guide: Main Gate A (Le Duan & Nguyen Binh Khiem)",
        "en_content": "Welcome to Main Gate A of Saigon Zoo and Botanical Gardens, located at the intersection of Le Duan Boulevard and Nguyen Binh Khiem Street. This is the central visitor entrance featuring ticketing counters, electric tour cart departures, and visitor information."
    },
    {
        "code": "GATE-B",
        "name": "Cổng B (Số 2B Nguyễn Bỉnh Khiêm)",
        "category": "Entrance",
        "lat": 10.7864000,
        "lng": 106.7058000,
        "area_id": None,
        "desc": "Cổng phụ trên trục đường Nguyễn Bỉnh Khiêm, thuận tiện cho du khách gửi phương tiện xe máy và ôtô.",
        "vi_title": "Thuyết minh: Cổng B (Số 2B Nguyễn Bỉnh Khiêm)",
        "vi_content": "Chào mừng bạn đến với Cổng B tại số 2B Nguyễn Bỉnh Khiêm. Cổng phụ này kết nối trực tiếp với bãi giữ xe máy và ôtô rộng rãi, mang lại sự thuận tiện tối đa cho các gia đình và đoàn tham quan tự túc.",
        "en_title": "Audio Guide: Gate B (2B Nguyen Binh Khiem)",
        "en_content": "Welcome to Gate B at 2B Nguyen Binh Khiem Street. This entrance provides direct access to convenient motorcycle and automobile parking facilities for visiting families and tour groups."
    },
    {
        "code": "GATE-C",
        "name": "Cổng C (Số 1 Nguyễn Thị Minh Khai)",
        "category": "Entrance",
        "lat": 10.7886000,
        "lng": 106.7032000,
        "area_id": None,
        "desc": "Cổng Nguyễn Thị Minh Khai gần cầu Thị Nghè, thuận tiện kết nối các tuyến xe buýt đô thị.",
        "vi_title": "Thuyết minh: Cổng C (Số 1 Nguyễn Thị Minh Khai)",
        "vi_content": "Chào mừng bạn đến với Cổng C trên đường Nguyễn Thị Minh Khai, nằm sát chân cầu Thị Nghè lịch sử. Vị trí này rất thuận tiện cho du khách di chuyển bằng các tuyến xe buýt đô thị và tản bộ vào khuôn viên rợp bóng cây xanh.",
        "en_title": "Audio Guide: Gate C (1 Nguyen Thi Minh Khai)",
        "en_content": "Welcome to Gate C on Nguyen Thi Minh Khai Street, adjacent to the historic Thi Nghe Bridge. This entrance offers seamless connections to city public bus transit and shaded pedestrian access into the gardens."
    },
    {
        "code": "GATE-E",
        "name": "Cổng E (Bờ Kênh Nhiêu Lộc)",
        "category": "Entrance",
        "lat": 10.7876000,
        "lng": 106.7078000,
        "area_id": None,
        "desc": "Lối tản bộ ven bờ kênh rợp bóng mát cây xanh, ngắm cảnh kênh Nhiêu Lộc và thuyền du lịch sinh thái.",
        "vi_title": "Thuyết minh: Cổng E (Bờ Kênh Nhiêu Lộc)",
        "vi_content": "Chào mừng bạn đến với Cổng E ven bờ kênh Nhiêu Lộc - Thị Nghè. Tuyến đường dạo bộ ven sông rợp bóng mát cổ thụ, mang đến không gian thoáng đãng cho du khách ngắm cảnh dòng kênh xanh và thuyền du lịch sinh thái.",
        "en_title": "Audio Guide: Gate E (Nhieu Loc Canal Promenade)",
        "en_content": "Welcome to Gate E along the scenic Nhieu Loc Canal promenade. A tranquil, tree-shaded riverside walkway offering refreshing breezes and picturesque views of passing eco-tourism boats."
    },
    {
        "code": "POI-HUNG",
        "name": "Đền Thờ Vua Hùng Lịch Sử",
        "category": "Landmark",
        "lat": 10.7865000,
        "lng": 106.7045000,
        "area_id": None,
        "desc": "Công trình kiến trúc cung đình truyền thống xây dựng năm 1926 để tưởng nhớ Quốc Tổ Hùng Vương, rợp bóng cổ thụ trăm năm.",
        "vi_title": "Thuyết minh: Đền Thờ Vua Hùng Lịch Sử",
        "vi_content": "Chào mừng bạn đến với Đền Thờ Vua Hùng trong khuôn viên Thảo Cầm Viên. Công trình được khởi dựng năm 1926 theo lối kiến trúc cung đình truyền thống đặc sắc, là nơi tôn vinh công đức các vị Vua Hùng dựng nước giữa không gian cổ thụ trăm năm uy nghiêm.",
        "en_title": "Audio Guide: Historic Hung Kings Temple",
        "en_content": "Welcome to the Historic Hung Kings Temple inside Saigon Zoo. Constructed in 1926 following classical Vietnamese imperial architecture, this sacred monument honors the Founding Ancestors of Vietnam amidst majestic century-old heritage trees."
    },
    {
        "code": "POI-MUSEUM",
        "name": "Bảo Tàng Lịch Sử TP. Hồ Chí Minh",
        "category": "Landmark",
        "lat": 10.7860000,
        "lng": 106.7042000,
        "area_id": None,
        "desc": "Bảo tàng lưu giữ hơn 40.000 hiện vật lịch sử văn hóa quý giá của dân tộc Việt Nam.",
        "vi_title": "Thuyết minh: Bảo Tàng Lịch Sử TP. Hồ Chí Minh",
        "vi_content": "Chào mừng bạn đến với Bảo Tàng Lịch Sử TP. Hồ Chí Minh. Thành lập từ năm 1929 trong khuôn viên vườn bách thảo, bảo tàng hiện bảo tồn và trưng bày hơn 40.000 hiện vật quý giá phản ánh chiều dài lịch sử và văn hóa đa dạng của dân tộc Việt Nam.",
        "en_title": "Audio Guide: Museum of History of Ho Chi Minh City",
        "en_content": "Welcome to the Museum of History of Ho Chi Minh City. Established in 1929 within the botanical grounds, the museum preserves and showcases over 40,000 precious artifacts illustrating Vietnam's rich cultural heritage."
    },
    {
        "code": "POI-TREE",
        "name": "Cây Sọ Khỉ Di Sản (Hơn 130 năm tuổi)",
        "category": "Botanical",
        "lat": 10.7874000,
        "lng": 106.7053000,
        "area_id": None,
        "desc": "Một trong những cây cổ thụ lớn và lâu đời nhất Thảo Cầm Viên, chu vi gốc hơn 8 mét với tán lá sum suê tỏa bóng mát rợp cả góc trời.",
        "vi_title": "Thuyết minh: Cây Sọ Khỉ Di Sản (Hơn 130 năm tuổi)",
        "vi_content": "Chào mừng bạn đến với Cây Sọ Khỉ Di Sản hơn 130 năm tuổi. Đây là một trong những đại thụ cổ kính nhất Thảo Cầm Viên Sài Gòn, chu vi thân cây hơn 8 mét và tán lá sum suê tỏa bóng mát rợp cả một góc trời.",
        "en_title": "Audio Guide: Heritage African Mahogany Tree (130+ Years)",
        "en_content": "Welcome to the Heritage African Mahogany Tree, over 130 years old. One of the oldest living botanical giants in Saigon Zoo, featuring a trunk circumference surpassing 8 meters and a magnificent lush canopy."
    },
    {
        "code": "POI-LAKE",
        "name": "Hồ Sen Sinh Thái & Nhà Thủy Tạ",
        "category": "Attraction",
        "lat": 10.7878000,
        "lng": 106.7056000,
        "area_id": None,
        "desc": "Hồ cảnh quan trung tâm thoáng đãng, cầu gỗ bắc ngang cho du khách dạo mát và ngắm đàn cá bơi lội.",
        "vi_title": "Thuyết minh: Hồ Sen Sinh Thái & Nhà Thủy Tạ",
        "vi_content": "Chào mừng bạn đến với Hồ Sen Sinh Thái và Nhà Thủy Tạ. Hồ nước cảnh quan trung tâm với hoa sen khoe sắc quanh năm, cầu gỗ bắc ngang và đàn cá bơi lội thanh bình, là điểm dừng chân nghỉ ngơi lý tưởng cho mọi du khách.",
        "en_title": "Audio Guide: Lotus Lake and Floating Pavilion",
        "en_content": "Welcome to the Lotus Lake and Floating Pavilion. A serene central aquatic sanctuary surrounded by blooming lotus flowers, wooden bridges, and swimming fish, offering a restful haven for visitors."
    },
    {
        "code": "ENC-TIG-01",
        "name": "Chuồng Hổ Bengal",
        "category": "Enclosure",
        "lat": 10.7885000,
        "lng": 106.7061000,
        "area_id": 7,
        "desc": "Khu chuồng bán hoang dã dành cho loài hổ Bengal quý hiếm, trang bị suối tắm, vách đá nhân tạo và bãi cỏ tự nhiên.",
        "vi_title": "Thuyết minh: Chuồng Hổ Bengal",
        "vi_content": "Chào mừng bạn đến với Chuồng Hổ Bengal. Khu chuồng bán hoang dã được thiết kế mô phỏng sinh cảnh tự nhiên với vách đá nhân tạo, suối nước tắm và thảm cỏ rộng rãi, tạo điều kiện vận động tối ưu cho loài chúa sơn lâm quý hiếm.",
        "en_title": "Audio Guide: Bengal Tiger Enclosure",
        "en_content": "Welcome to the Bengal Tiger Enclosure. A semi-natural habitat featuring rocky cliffs, cascading bathing streams, and expansive grassy grounds designed for the enrichment and wellbeing of magnificent Bengal tigers."
    },
    {
        "code": "ENC-TIG-02",
        "name": "Chuồng Hổ Siberia & Hổ Trắng",
        "category": "Enclosure",
        "lat": 10.7887000,
        "lng": 106.7064000,
        "area_id": 7,
        "desc": "Khuôn viên nuôi dưỡng và bảo tồn loài hổ trắng kỳ vĩ cùng hổ Siberia to lớn với hồ tắm và bóng mát tự nhiên.",
        "vi_title": "Thuyết minh: Chuồng Hổ Siberia & Hổ Trắng",
        "vi_content": "Chào mừng bạn đến với Chuồng Hổ Siberia và Hổ Trắng. Không gian bảo tồn loài hổ to lớn nhất hành tinh cùng cá thể hổ trắng kỳ vĩ, được bố trí hồ nước mát và bóng râm cây cối giúp hổ thỏa sức bơi lội và thư giãn.",
        "en_title": "Audio Guide: Siberian and White Tiger Habitat",
        "en_content": "Welcome to the Siberian and White Tiger Habitat. A dedicated conservation enclosure home to the majestic Siberian and white tigers, equipped with deep bathing pools and lush shade reflecting their native climates."
    },
    {
        "code": "ENC-LIO-01",
        "name": "Chuồng Sư Tử Hoàng Gia",
        "category": "Enclosure",
        "lat": 10.7882000,
        "lng": 106.7051000,
        "area_id": 7,
        "desc": "Không gian mở rộng dành cho đàn sư tử châu Phi với gò đá cao đón nắng và khu vực nghỉ ngơi mát mẻ.",
        "vi_title": "Thuyết minh: Chuồng Sư Tử Hoàng Gia",
        "vi_content": "Chào mừng bạn đến với Chuồng Sư Tử Hoàng Gia. Không gian thảo nguyên xavan mở rộng dành cho đàn sư tử châu Phi với các gò đá tự nhiên đón nắng ấm và chòi nghỉ mát mẻ, nơi sư tử thể hiện tập tính bầy đàn đặc trưng.",
        "en_title": "Audio Guide: Royal Lion Enclosure",
        "en_content": "Welcome to the Royal Lion Enclosure. An expansive savannah open range for our African lion pride, featuring sun-drenched rocky platforms and shaded shelters where lions display their natural social behaviors."
    },
    {
        "code": "ENC-ELE-01",
        "name": "Bãi Thả Voi Châu Á",
        "category": "Enclosure",
        "lat": 10.7892000,
        "lng": 106.7068000,
        "area_id": 3,
        "desc": "Khu bãi thả đất rộng rãi với hồ tắm bùn tự nhiên, nơi các cá thể voi châu Á sinh hoạt và giao lưu thân thiện cùng du khách.",
        "vi_title": "Thuyết minh: Bãi Thả Voi Châu Á",
        "vi_content": "Chào mừng bạn đến với Bãi Thả Voi Châu Á. Khuôn viên đất rộng mở với hồ tắm bùn tự nhiên và vòi phun nước, nơi các cá thể voi châu Á sinh hoạt cộng đồng, đầm mình thư giãn và giao lưu thân thiện cùng du khách.",
        "en_title": "Audio Guide: Asian Elephant Range",
        "en_content": "Welcome to the Asian Elephant Range. A spacious outdoor habitat featuring natural mud wallows and shower stations, where our Asian elephants socialize, forage, and bathe in a stimulating environment."
    },
    {
        "code": "ENC-BIR-01",
        "name": "Lồng Vòm Chim Nhiệt Đới & Hồ Hồng Hạc",
        "category": "Enclosure",
        "lat": 10.7869000,
        "lng": 106.7042000,
        "area_id": 4,
        "desc": "Quần xã lồng vòm cao vút và hồ hồng hạc rực rỡ với hàng trăm loài chim quý hiếm của Việt Nam và thế giới.",
        "vi_title": "Thuyết minh: Lồng Vòm Chim Nhiệt Đới & Hồ Hồng Hạc",
        "vi_content": "Chào mừng bạn đến với Lồng Vòm Chim Nhiệt Đới và Hồ Hồng Hạc. Quần thể lồng vòm cao vút rợp bóng cây kết hợp vùng đầm lầy tự nhiên, nơi nuôi dưỡng hàng trăm loài chim nhiệt đới quý hiếm và đàn hồng hạc rực rỡ.",
        "en_title": "Audio Guide: Tropical Aviary and Flamingo Lagoon",
        "en_content": "Welcome to the Tropical Aviary and Flamingo Lagoon. A soaring domed sanctuary and natural wetland housing hundreds of rare tropical bird species alongside our vibrant flock of flamingos."
    },
    {
        "code": "ENC-PET-01",
        "name": "Khuôn Viên Thú Nhỏ Thân Thiện (Petting Zoo)",
        "category": "Enclosure",
        "lat": 10.7862000,
        "lng": 106.7072000,
        "area_id": 6,
        "desc": "Khu vực thú thiếu nhi thân thiện, nơi các bé có thể tiếp xúc trực tiếp, vuốt ve và cho dê lùn, cừu, thỏ ăn rau cỏ tươi.",
        "vi_title": "Thuyết minh: Khuôn Viên Thú Nhỏ Thân Thiện (Petting Zoo)",
        "vi_content": "Chào mừng bạn đến với Khuôn Viên Thú Nhỏ Thân Thiện. Khu vườn thú thiếu nhi an toàn và gần gũi, nơi các bạn nhỏ có thể tiếp xúc trực tiếp, vuốt ve và cho dê lùn, cừu và thỏ ăn rau cỏ tươi dưới sự hướng dẫn của nhân viên.",
        "en_title": "Audio Guide: Children's Petting Zoo",
        "en_content": "Welcome to the Children's Petting Zoo. A gentle interactive garden where young visitors can safely interact with, pet, and feed friendly dwarf goats, sheep, and rabbits under staff supervision."
    }
]

async def generate_speech(text, voice):
    comm = edge_tts.Communicate(text, voice)
    audio_data = bytearray()
    max_duration = 0.0
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio_data.extend(chunk["data"])
        elif chunk["type"] == "SentenceBoundary":
            dur = (chunk["offset"] + chunk["duration"]) / 10000000.0
            if dur > max_duration:
                max_duration = dur
    duration_sec = round(max_duration)
    if duration_sec <= 0:
        duration_sec = max(10, round(len(text) / 15))
    return bytes(audio_data), duration_sec

def upload_to_supabase(object_path, audio_bytes):
    endpoint = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{object_path}"
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "apikey": SERVICE_KEY,
        "x-upsert": "true",
        "Content-Type": "audio/mpeg"
    }
    resp = requests.post(endpoint, headers=headers, data=audio_bytes, timeout=30)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Upload failed: HTTP {resp.status_code} - {resp.text}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{object_path}"

def save_local_mirror(object_path, audio_bytes):
    target_dirs = [
        os.path.join("src", "API", "wwwroot", "storage", BUCKET),
        os.path.join("web", "public", "storage", BUCKET),
        os.path.join("web", "dist", "storage", BUCKET)
    ]
    for base in target_dirs:
        full_path = os.path.join(base, object_path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as f:
            f.write(audio_bytes)

async def main():
    print(f"Starting POI Speech Generation & Upload for {len(POIS_DATA)} POIs...")
    manifest = []

    for idx, item in enumerate(POIS_DATA, 1):
        slug = item["code"].lower().replace("-", "_")
        print(f"\n[{idx}/{len(POIS_DATA)}] POI [{item['code']}] {item['name']}...")

        # 1. Vietnamese audio
        print(f"  -> Generating VI voice...")
        vi_bytes, vi_dur = await generate_speech(item["vi_content"], "vi-VN-HoaiMyNeural")
        vi_path = f"poi/vi/{slug}_vi.mp3"
        print(f"     Size: {len(vi_bytes)} bytes, Duration: {vi_dur}s. Uploading to Supabase Storage...")
        vi_url = upload_to_supabase(vi_path, vi_bytes)
        save_local_mirror(vi_path, vi_bytes)

        # 2. English audio
        print(f"  -> Generating EN voice...")
        en_bytes, en_dur = await generate_speech(item["en_content"], "en-US-JennyNeural")
        en_path = f"poi/en/{slug}_en.mp3"
        print(f"     Size: {len(en_bytes)} bytes, Duration: {en_dur}s. Uploading to Supabase Storage...")
        en_url = upload_to_supabase(en_path, en_bytes)
        save_local_mirror(en_path, en_bytes)

        manifest.append({
            "code": item["code"],
            "name": item["name"],
            "category": item["category"],
            "lat": item["lat"],
            "lng": item["lng"],
            "area_id": item["area_id"],
            "description": item["desc"],
            "vi": {
                "title": item["vi_title"],
                "content": item["vi_content"],
                "url": vi_url,
                "duration": vi_dur,
                "size": len(vi_bytes)
            },
            "en": {
                "title": item["en_title"],
                "content": item["en_content"],
                "url": en_url,
                "duration": en_dur,
                "size": len(en_bytes)
            }
        })

    with open("scratch/poi_audio_manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"\n=== SUCCESS! Generated & Uploaded all 28 POI audios. Manifest saved to scratch/poi_audio_manifest.json ===")

if __name__ == "__main__":
    asyncio.run(main())
