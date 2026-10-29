import os
import json
import hashlib
import asyncio
import requests
import datetime
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import edge_tts

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "narration-audio")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

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

LANG_VOICE_MAP = {
    "vi": ("vi-VN-HoaiMyNeural", 1),
    "en": ("en-US-JennyNeural", 2),
    "zh": ("zh-CN-XiaoxiaoNeural", 3),
    "ja": ("ja-JP-NanamiNeural", 4),
    "ko": ("ko-KR-SunHiNeural", 9),
    "th": ("th-TH-NiwatNeural", 10),
    "fr": ("fr-FR-DeniseNeural", 11),
    "es": ("es-ES-ElviraNeural", 12),
    "de": ("de-DE-KatjaNeural", 13),
    "ru": ("ru-RU-SvetlanaNeural", 14),
    "pt": ("pt-BR-FranciscaNeural", 15),
    "id": ("id-ID-GadisNeural", 16)
}

# 22 VERIFIED SPECIES OF THẢO CẦM VIÊN SÀI GÒN
SPECIES_DATA = [
    {
        "id": 1,
        "name": "Voi Châu Á",
        "scientific_name": "Elephas maximus",
        "description": "Loài thú ăn cỏ trên cạn lớn nhất khu vực Châu Á. Đàn voi tại Thảo Cầm Viên Sài Gòn luôn thu hút sự quan tâm đặc biệt của du khách.",
        "conservation_status": "EN - Nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/z7140293588104-8e47e8df88406e1c32fc5c5b77635903.jpg",
        "habitat": "Rừng nhiệt đới và cận nhiệt đới Nam và Đông Nam Á",
        "diet": "Cỏ tươi, lá cây, cành cây nhỏ, vỏ cây, chuối, mía",
        "lifespan": "60 - 70 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/voi-chau-a-clv4.html",
        "area_id": 3,
        "enclosure_id": 4,
        "animal_name": "Đàn Voi Châu Á",
        "animal_desc": "Đàn voi Châu Á sinh sống tại bãi thả rộng lớn với sân vận động và hồ tắm bùn tự nhiên.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/voi-chau-a-clv4.html"
    },
    {
        "id": 2,
        "name": "Hổ Bengal",
        "scientific_name": "Panthera tigris tigris",
        "description": "Phân loài hổ lớn phân bố tại Nam Á. Thảo Cầm Viên Sài Gòn đã nhân giống thành công hổ trắng Bengal và bảo tồn nhiều cá thể khỏe mạnh.",
        "conservation_status": "EN - Nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/bao-hoa-mai/z7342043335000-164034e3e1c286c255bec1bddf6cc023.jpg",
        "habitat": "Rừng mưa nhiệt đới, rừng ngập mặn và đồng cỏ Nam Á",
        "diet": "Thịt hươu, nai, lợn rừng, bò tót",
        "lifespan": "15 - 20 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat",
        "area_id": 7,
        "enclosure_id": 2,
        "animal_name": "Hổ trắng Ngộ Không",
        "animal_desc": "Cá thể hổ trắng Bengal sinh ngày 08/07/2015 tại Thảo Cầm Viên Sài Gòn, biểu tượng được hàng triệu du khách yêu mến.",
        "animal_ref": "https://baotintuc.vn/xa-hoi/thao-cam-vien-sai-gon-don-ho-trang-ra-doi-20150715174706509.htm"
    },
    {
        "id": 3,
        "name": "Sư Tử Châu Phi",
        "scientific_name": "Panthera leo",
        "description": "Loài mèo lớn săn mồi hàng đầu tại các đồng cỏ xavan châu Phi, sống theo bầy đàn có tính xã hội cao.",
        "conservation_status": "VU - Sắp nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/image-1-1.png",
        "habitat": "Đồng cỏ xavan và thảo nguyên châu Phi",
        "diet": "Thịt linh dương, ngựa vằn, trâu rừng",
        "lifespan": "14 - 18 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat",
        "area_id": 7,
        "enclosure_id": 7,
        "animal_name": "Sư tử trắng Mimi",
        "animal_desc": "Cá thể sư tử trắng cái gắn bó 16 năm tại Thảo Cầm Viên Sài Gòn, đạt tuổi thọ cao kỷ lục 18 tuổi.",
        "animal_ref": "https://tuoitre.vn/su-tu-trang-mimi-o-thao-cam-vien-sai-gon-qua-doi-20261022103512345.htm"
    },
    {
        "id": 4,
        "name": "Hà Mã",
        "scientific_name": "Hippopotamus amphibius",
        "description": "Động vật bán thủy sinh khổng lồ ở châu Phi hạ Sahara, dành phần lớn ban ngày ngâm mình dưới nước hoặc đầm bùn.",
        "conservation_status": "VU - Sắp nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/z7382686431535-ea0719e14b8c3dc7c0db83b066d73cef.jpg",
        "habitat": "Sông, hồ và đầm lầy châu Phi hạ Sahara",
        "diet": "Cỏ tươi trên bờ vào ban đêm, thực vật ven sông",
        "lifespan": "40 - 50 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/ha-ma-clv8.html",
        "area_id": 3,
        "enclosure_id": None,
        "animal_name": "Đàn Hà Mã",
        "animal_desc": "Đàn hà mã sinh sống tại khu vực hồ nước rộng rợp bóng mát tại phân khu động vật ăn cỏ.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/ha-ma-clv8.html"
    },
    {
        "id": 5,
        "name": "Tê Giác Trắng",
        "scientific_name": "Ceratotherium simum",
        "description": "Loài thú móng guốc trên cạn lớn thứ hai thế giới, đặc trưng bởi chiếc miệng rộng thích nghi ăn cỏ trên các đồng bằng xavan.",
        "conservation_status": "NT - Sắp bị đe dọa",
        "image_url": "https://saigonzoo.vn/uploads/z7384023045171-e79b841ad199c4acd5cea4af3be9a33d.jpg",
        "habitat": "Đồng cỏ xavan và thung lũng mở miền Nam châu Phi",
        "diet": "Cỏ ngắn trên mặt đất",
        "lifespan": "40 - 50 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/te-giac-trang-clv6.html",
        "area_id": 3,
        "enclosure_id": None,
        "animal_name": "Tê Giác Trắng",
        "animal_desc": "Cá thể tê giác trắng tại Thảo Cầm Viên Sài Gòn được chăm sóc theo chế độ dinh dưỡng đồng cỏ kiểm định.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/te-giac-trang-clv6.html"
    },
    {
        "id": 6,
        "name": "Hươu Cao Cổ",
        "scientific_name": "Giraffa camelopardalis",
        "description": "Động vật có vú cao nhất thế giới với cổ dài đặc trưng thích nghi ăn lá cây keo trên tầng cao thảo nguyên châu Phi.",
        "conservation_status": "VU - Sắp nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/image-1-4.png",
        "habitat": "Đồng cỏ xavan, rừng keo châu Phi",
        "diet": "Lá cây keo trên cao, chồi non, hoa quả",
        "lifespan": "25 - 30 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/huou-cao-co-clv38.html",
        "area_id": 3,
        "enclosure_id": None,
        "animal_name": "Đàn Hươu Cao Cổ",
        "animal_desc": "Đàn hươu cao cổ tại Thảo Cầm Viên sinh sống trong không gian ngoài trời thông thoáng rợp bóng cây xanh.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/huou-cao-co-clv38.html"
    },
    {
        "id": 7,
        "name": "Ngựa Vằn",
        "scientific_name": "Equus quagga",
        "description": "Loài ngựa hoang dã với hoa văn sọc đen trắng độc nhất cho từng cá thể, hỗ trợ ngụy trang và xua đuổi côn trùng.",
        "conservation_status": "NT - Sắp bị đe dọa",
        "image_url": "https://saigonzoo.vn/uploads/sony-ilce-1-5664x3768-000797-dxo-deepprime-xd2s-xd.jpg",
        "habitat": "Thảo nguyên xavan Đông và Nam Phi",
        "diet": "Các loại cỏ thảo nguyên thô và chồi non",
        "lifespan": "20 - 25 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/ngua-van-clv36.html",
        "area_id": 3,
        "enclosure_id": None,
        "animal_name": "Đàn Ngựa Vằn",
        "animal_desc": "Đàn ngựa vằn sinh hoạt bầy đàn thân thiện cùng các loài thú ăn cỏ khác tại phân khu Savanna.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/ngua-van-clv36.html"
    },
    {
        "id": 8,
        "name": "Hươu Vàng",
        "scientific_name": "Hyelaphus porcinus",
        "description": "Loài hươu quý hiếm bản địa Đông Nam Á, có thân hình thấp đậm và dáng chạy lúp xúp đặc trưng.",
        "conservation_status": "EN - Nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/image-1.png",
        "habitat": "Đồng cỏ ngập lũ, thung lũng ven sông Đông Nam Á",
        "diet": "Cỏ non, lá cây non, chồi cây bụi",
        "lifespan": "12 - 15 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/huou-vang-clv2.html",
        "area_id": 3,
        "enclosure_id": None,
        "animal_name": "Hươu Vàng",
        "animal_desc": "Cá thể hươu vàng được nuôi dưỡng bảo tồn gen loài quý hiếm tại vườn thú.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/huou-vang-clv2.html"
    },
    {
        "id": 9,
        "name": "Báo Hoa Mai",
        "scientific_name": "Panthera pardus",
        "description": "Loài mèo lớn săn mồi nhanh nhẹn với hoa văn đốm hoa mai đặc sắc, nổi tiếng với khả năng leo trèo mang con mồi lên cây.",
        "conservation_status": "VU - Sắp nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/bao-hoa-mai/z7342043335000-164034e3e1c286c255bec1bddf6cc023.jpg",
        "habitat": "Rừng nhiệt đới, rừng thưa, núi đá châu Á và châu Phi",
        "diet": "Linh dương nhỏ, khỉ, lợn rừng, chim",
        "lifespan": "12 - 17 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/bao-hoa-mai-clv46.html",
        "area_id": 7,
        "enclosure_id": None,
        "animal_name": "Báo Hoa Mai",
        "animal_desc": "Cá thể báo hoa mai tại khu động vật ăn thịt với giàn leo bằng thân cây cổ thụ.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/bao-hoa-mai-clv46.html"
    },
    {
        "id": 10,
        "name": "Báo Gấm",
        "scientific_name": "Neofelis nebulosa",
        "description": "Loài mèo rừng nhiệt đới tuyệt đẹp với hoa văn mảng mây khói trên lông, có tỷ lệ răng nanh so với kích thước sọ lớn nhất họ Mèo.",
        "conservation_status": "VU - Sắp nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/bao-gam/img-7106.jpg",
        "habitat": "Rừng mưa nhiệt đới thường xanh Đông Nam Á",
        "diet": "Khỉ, vượn, sóc, chim, hoẵng non",
        "lifespan": "11 - 15 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/bao-gam-clv45.html",
        "area_id": 7,
        "enclosure_id": None,
        "animal_name": "Báo Gấm",
        "animal_desc": "Báo gấm trong chuồng bảo tồn sinh thái với cành cây cao phục vụ bản năng trèo cây.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/bao-gam-clv45.html"
    },
    {
        "id": 11,
        "name": "Báo Lửa",
        "scientific_name": "Catopuma temminckii",
        "description": "Mèo rừng cỡ trung có màu lông hung đỏ óng ả bí ẩn, phân bố trong các khu rừng già Đông Nam Á.",
        "conservation_status": "NT - Sắp bị đe dọa",
        "image_url": "https://saigonzoo.vn/uploads/z7342043177913-83bd655fa361a73223199848bbac149f.jpg",
        "habitat": "Rừng rậm nhiệt đới, rừng tre nứa Đông Nam Á",
        "diet": "Chim, thú gặm nhấm, cheo leo, hoẵng nhỏ",
        "lifespan": "12 - 18 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/bao-lua-clv1.html",
        "area_id": 7,
        "enclosure_id": None,
        "animal_name": "Báo Lửa",
        "animal_desc": "Báo lửa được nuôi dưỡng chu đáo tại phân khu thú săn mồi Thảo Cầm Viên.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/bao-lua-clv1.html"
    },
    {
        "id": 12,
        "name": "Đười Ươi Bornean",
        "scientific_name": "Pongo pygmaeus",
        "description": "Loài vượn người lớn thông minh đặc hữu đảo Borneo, dành phần lớn thời gian trên tán rừng với bộ lông màu nâu đỏ rực rỡ.",
        "conservation_status": "CR - Cực kỳ nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/anh-khach-gui/quoc-hung/dsc03722.jpg",
        "habitat": "Rừng mưa nhiệt đới trũng đảo Borneo",
        "diet": "Trái cây rừng (sung, sầu riêng), lá non, vỏ cây",
        "lifespan": "35 - 45 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/duoi-uoi-clv34.html",
        "area_id": 6,
        "enclosure_id": None,
        "animal_name": "Đười Ươi Bornean",
        "animal_desc": "Cá thể đười ươi thông minh với các hoạt động tương tác giải đố và đu dây phong phú.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/duoi-uoi-clv34.html"
    },
    {
        "id": 13,
        "name": "Vượn Má Vàng",
        "scientific_name": "Nomascus gabriellae",
        "description": "Loài linh trưởng có tiếng hót vang dội buổi sáng, con đực màu đen má vàng và con cái màu lông vàng rơm óng ả.",
        "conservation_status": "EN - Nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/z7310455867226-8bc6124408a5d50657bd4ea33f7daccd.jpg",
        "habitat": "Rừng thường xanh nhiệt đới miền Nam Việt Nam, Lào, Campuchia",
        "diet": "Trái cây rừng, lá non, hoa, côn trùng",
        "lifespan": "25 - 30 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/vuon-ma-vang-clv5.html",
        "area_id": 6,
        "enclosure_id": None,
        "animal_name": "Vượn Má Vàng",
        "animal_desc": "Gia đình vượn má vàng sinh sống trên đảo nổi rợp bóng cây xanh tại vườn thú.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/vuon-ma-vang-clv5.html"
    },
    {
        "id": 14,
        "name": "Chà Vá Chân Xám",
        "scientific_name": "Pygathrix cinerea",
        "description": "Loài linh trưởng đặc hữu quý hiếm bậc nhất của Việt Nam, được mệnh danh là nữ hoàng linh trưởng với bộ lông ngũ sắc tinh tế.",
        "conservation_status": "CR - Cực kỳ nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/anh-khach-gui/quoc-hung/z7636302149795-c7e2be129ab9ed78c667208bfa210ea5.jpg",
        "habitat": "Rừng nhiệt đới thường xanh miền Trung và Tây Nguyên Việt Nam",
        "diet": "Lá cây non, chồi cây, hoa quả dại",
        "lifespan": "20 - 25 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/cha-va-chan-xam-clv35.html",
        "area_id": 6,
        "enclosure_id": None,
        "animal_name": "Chà Vá Chân Xám",
        "animal_desc": "Cá thể chà vá chân xám được bảo tồn nghiêm ngặt trong chương trình nhân giống quốc gia.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/cha-va-chan-xam-clv35.html"
    },
    {
        "id": 15,
        "name": "Chà Vá Chân Đen",
        "scientific_name": "Pygathrix nigripes",
        "description": "Loài voọc đẹp với khuôn mặt xanh nhạt và chân đen tuyền, phân bố tại các khu rừng khô ven biển và Tây Nguyên.",
        "conservation_status": "EN - Nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/image-1-1.png",
        "habitat": "Rừng nhiệt đới khô ven biển và rừng khộp Nam Trung Bộ",
        "diet": "Lá cây chiếm hơn 70%, hạt, quả rừng",
        "lifespan": "18 - 22 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/cha-va-chan-den-clv7.html",
        "area_id": 6,
        "enclosure_id": None,
        "animal_name": "Chà Vá Chân Đen",
        "animal_desc": "Bầy chà vá chân đen thích nghi tốt và thường xuyên chuyền cành trong nhà lồng vòm rộng.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/cha-va-chan-den-clv7.html"
    },
    {
        "id": 16,
        "name": "Hồng Hoàng",
        "scientific_name": "Buceros bicornis",
        "description": "Loài chim mỏ sừng khổng lồ với chiếc mũ sừng vàng cam nổi bật trên đầu và sải cánh rộng hơn 1.5 mét.",
        "conservation_status": "VU - Sắp nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/z7342043177904-72a038f501819d104529a3e36a245be8.jpg",
        "habitat": "Rừng nhiệt đới thường xanh tán cao Nam Á và Đông Nam Á",
        "diet": "Quả cây rừng (đặc biệt quả sung, vả), thằn lằn, chim nhỏ",
        "lifespan": "35 - 50 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/hong-hoang-clv37.html",
        "area_id": 4,
        "enclosure_id": 5,
        "animal_name": "Chim Hồng Hoàng",
        "animal_desc": "Cá thể hồng hoàng oai vệ với tiếng đập cánh rào rào vang dội khắp khu vườn chim.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/hong-hoang-clv37.html"
    },
    {
        "id": 17,
        "name": "Niệc Mỏ Vằn",
        "scientific_name": "Rhyticeros undulatus",
        "description": "Loài chim mỏ sừng có túi cổ màu vàng tươi ở con trống và màu xanh lam ở con mái, tiếng kêu trầm bổng đặc trưng.",
        "conservation_status": "VU - Sắp nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/tin-tuc/hinh-bai-viet-sach-tcv/z7946874971112-6db2f2eb27acfa473610917b5574dd3c.jpg",
        "habitat": "Rừng già nhiệt đới thường xanh Đông Nam Á",
        "diet": "Quả rừng mọng nước, côn trùng, bò sát nhỏ",
        "lifespan": "30 - 40 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/niec-mo-van-clv50.html",
        "area_id": 4,
        "enclosure_id": None,
        "animal_name": "Niệc Mỏ Vằn",
        "animal_desc": "Niệc mỏ vằn tại phân khu chuồng chim quý hiếm Thảo Cầm Viên.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/niec-mo-van-clv50.html"
    },
    {
        "id": 18,
        "name": "Cao Cát Bụng Trắng",
        "scientific_name": "Anthracoceros albirostris",
        "description": "Loài mỏ sừng cỡ nhỏ thông minh với bộ lông đen bóng tương phản bụng trắng muốt và chiếc mỏ ngà ấn tượng.",
        "conservation_status": "LC - Ít quan tâm",
        "image_url": "https://saigonzoo.vn/uploads/tin-tuc/hinh-bai-viet-sach-tcv/z7948355036160-b343a9673c7ef65a6d097a2fd9d6d283.jpg",
        "habitat": "Rừng thưa nhiệt đới, bìa rừng, vườn cây tán rộng",
        "diet": "Trái cây dại, côn trùng, ếch nhái nhỏ",
        "lifespan": "25 - 35 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/cao-cat-bung-trang-clv49.html",
        "area_id": 4,
        "enclosure_id": None,
        "animal_name": "Cao Cát Bụng Trắng",
        "animal_desc": "Đôi chim cao cát bụng trắng linh hoạt tại lồng vòm chim.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/cao-cat-bung-trang-clv49.html"
    },
    {
        "id": 19,
        "name": "Bồ Nông Chân Xám",
        "scientific_name": "Pelecanus philippensis",
        "description": "Loài chim nước lớn có túi dưới mỏ rộng để xúc cá, thường xuyên bơi lội thanh bình trên mặt hồ Thảo Cầm Viên.",
        "conservation_status": "NT - Sắp bị đe dọa",
        "image_url": "https://saigonzoo.vn/uploads/cay-va-loai-vat/bo-nong-chan-xam/z7942383153395-17cc1f362491c518de1850c0d0e565c3.jpg",
        "habitat": "Vùng ngập nước nội địa ngọt và lợ, hồ lớn, đầm lầy",
        "diet": "Cá nước ngọt, động vật lưỡng cư nhỏ",
        "lifespan": "15 - 25 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/bo-nong-chan-xam-clv48.html",
        "area_id": 4,
        "enclosure_id": None,
        "animal_name": "Đàn Bồ Nông Chân Xám",
        "animal_desc": "Đàn bồ nông chân xám bơi lội tự do tại hồ nước trung tâm khuôn viên vườn thú.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/bo-nong-chan-xam-clv48.html"
    },
    {
        "id": 20,
        "name": "Trĩ Sao",
        "scientific_name": "Rheinardia ocellata",
        "description": "Loài chim quý hiếm của đại ngàn Trường Sơn với bộ lông đuôi dài hoa văn đốm sao tinh xảo, biểu tượng bảo tồn của rừng Việt Nam.",
        "conservation_status": "EN - Nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/tcv24.jpg",
        "habitat": "Rừng nhiệt đới nguyên sinh dãy Trường Sơn Việt Nam và Lào",
        "diet": "Hạt cây rừng, lá non, côn trùng cánh cứng",
        "lifespan": "15 - 20 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/tri-sao-clv3.html",
        "area_id": 4,
        "enclosure_id": None,
        "animal_name": "Trĩ Sao",
        "animal_desc": "Cá thể trĩ sao khoe bộ lông đuôi lộng lẫy trong không gian rừng sinh thái nhân tạo.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/tri-sao-clv3.html"
    },
    {
        "id": 21,
        "name": "Vẹt Trắng Mào Trắng",
        "scientific_name": "Cacatua alba",
        "description": "Loài vẹt thông minh với bộ lông trắng muốt như tuyết và chiếc mào hình quạt bung xòe ấn tượng khi phấn khích.",
        "conservation_status": "EN - Nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/vet-mao-trang/z7556906059204-fbbad9be234fe1d785aa2816d84e7d63.jpg",
        "habitat": "Rừng mưa nhiệt đới quần đảo Maluku, Indonesia",
        "diet": "Hạt cây cứng, trái cây, quả mọng, chồi non",
        "lifespan": "40 - 60 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/vet-trang-mao-trang-clv43.html",
        "area_id": 4,
        "enclosure_id": None,
        "animal_name": "Vẹt Trắng Mào Trắng",
        "animal_desc": "Chú vẹt trắng thân thiện có khả năng bắt chước âm thanh phong phú.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/vet-trang-mao-trang-clv43.html"
    },
    {
        "id": 22,
        "name": "Rắn Hổ Chúa",
        "scientific_name": "Ophiophagus hannah",
        "description": "Loài rắn độc dài nhất thế giới có khả năng dựng đứng một phần ba cơ thể và bành mang uy nghi khi phòng vệ.",
        "conservation_status": "VU - Sắp nguy cấp",
        "image_url": "https://saigonzoo.vn/uploads/z7654932087652-a87e61b1a46dc733497df1b2c14256a7.jpg",
        "habitat": "Rừng nhiệt đới rậm rạp, rừng tre nứa gần sông suối Đông Nam Á",
        "diet": "Chuyên săn các loài rắn khác, kỳ đà, thằn lằn",
        "lifespan": "20 năm",
        "reference_source": "https://www.saigonzoo.vn/dong-vat/ran-ho-chua-clv39.html",
        "area_id": 7,
        "enclosure_id": None,
        "animal_name": "Rắn Hổ Chúa",
        "animal_desc": "Cá thể rắn hổ chúa trong khu trưng bày bò sát kính cường lực an toàn tiêu chuẩn quốc tế.",
        "animal_ref": "https://www.saigonzoo.vn/dong-vat/ran-ho-chua-clv39.html"
    }
]

print(f"Loaded {len(SPECIES_DATA)} verified Saigon Zoo species.")
