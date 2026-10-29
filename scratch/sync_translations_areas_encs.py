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

print("Preparing 12-language translations for Areas & Enclosures...")

def upsert_translation(entity_type, entity_id, lang_code, title, desc):
    cur.execute("""
        SELECT "TranslationId" FROM "CONTENT_TRANSLATIONS"
        WHERE "EntityType" = %s AND "EntityId" = %s AND "LanguageCode" = %s;
    """, (entity_type, entity_id, lang_code))
    row = cur.fetchone()
    if row:
        cur.execute("""
            UPDATE "CONTENT_TRANSLATIONS"
            SET "Title" = %s,
                "Description" = %s,
                "TranslationStatus" = 'Published',
                "IsPublished" = TRUE,
                "UpdatedAt" = NOW()
            WHERE "TranslationId" = %s;
        """, (title, desc, row['TranslationId']))
    else:
        cur.execute("""
            INSERT INTO "CONTENT_TRANSLATIONS" ("EntityType", "EntityId", "LanguageCode", "Title", "Description", "TranslationStatus", "IsPublished", "CreatedAt", "UpdatedAt")
            VALUES (%s, %s, %s, %s, %s, 'Published', TRUE, NOW(), NOW());
        """, (entity_type, entity_id, lang_code, title, desc))

# 7 Areas in 12 languages
area_translations = {
    1: { # Reptiles
        "vi": ("Khu Bảo Tồn Bò Sát & Lưỡng Cư", "Khu nhà kính bảo tồn các loài rắn hổ chúa, trăn gấm, kỳ đà và rùa cạn quý hiếm."),
        "en": ("Reptile & Amphibian Conservation House", "Climate-controlled glass conservatory conserving king cobras, reticulated pythons, monitor lizards, and rare tortoises."),
        "zh": ("爬行动物与两栖动物保护馆", "恒温温室保护馆，展示眼镜王蛇、网纹蟒、巨蜥和珍稀陆龟。"),
        "ja": ("爬虫類・両生類保護館", "キングコブラ、アミメニシキヘビ、オオトカゲ、希少なリクガメを保護する空調完備の温室展示館。"),
        "ko": ("파충류 및 양서류 보존관", "킹코브라, 그물무늬비단뱀, 왕도마뱀, 희귀 육지거북을 보존하는 온습도 조절 유리 온실."),
        "th": ("เรือนเพาะพันธุ์สัตว์เลื้อยคลานและสัตว์สะเทินน้ำสะเทินบก", "เรือนกระจกควบคุมอุณหภูมิที่อนุรักษ์งูจงอาง งูเหลือม ตะกวด และเต่าบกหายาก"),
        "fr": ("Maison de Conservation des Reptiles et Amphibiens", "Serre climatisée protégeant cobras royaux, pythons réticulés, varans et tortues terrestres rares."),
        "es": ("Casa de Conservación de Reptiles y Anfibios", "Invernadero climatizado que preserva cobras reales, pitones reticuladas, varanos y tortugas terrestres raras."),
        "de": ("Reptilien- und Amphibien-Schutzhaus", "Klimatisiertes Gewächshaus zum Schutz von Königskobras, Netzpythons, Waranen und seltenen Landschildkröten."),
        "ru": ("Дом сохранения рептилий и амфибий", "Климатическая оранжерея, где содержатся королевские кобры, сетчатые питоны, вараны и редкие сухопутные черепахи."),
        "pt": ("Casa de Conservação de Répteis e Anfíbios", "Estufa climatizada que preserva cobras-reais, pítons-reticuladas, varanos e tartarugas terrestres raras."),
        "id": ("Rumah Konservasi Reptil & Amfibi", "Rumah kaca beriklim terkontrol yang melestarikan kobra raja, sanca kembang, biawak, dan kura-kura darat langka.")
    },
    2: { # Petting Zoo
        "vi": ("Khu Vườn Thú Thiếu Nhi & Thân Thiện", "Khuôn viên tương tác trực tiếp với capybara, dê lùn, cừu và thỏ kiểng."),
        "en": ("Children's & Petting Zoo", "Interactive ecological zone for families to pet and feed capybaras, miniature goats, sheep, and rabbits."),
        "zh": ("儿童与亲善动物园", "适合家庭亲密互动的生态园区，可抚摸喂食水豚、侏儒羊、绵羊和兔类。"),
        "ja": ("こども動物園・ふれあい広場", "カピバラ、ミニヤギ、ヒツジ、ウサギと直接ふれあえるファミリー向け生態広場。"),
        "ko": ("어린이 친화 동물원 (펫팅 주)", "카피바라, 미니 염소, 양, 토끼와 직접 교감하고 먹이를 줄 수 있는 가족 친화 생태 공간."),
        "th": ("สวนสัตว์เด็กและพื้นที่สัมผัสสัตว์", "พื้นที่นิเวศสำหรับครอบครัวที่สามารถลูบคลำและให้อาหารคาปิบารา แพะแคระ แกะ และกระต่าย"),
        "fr": ("Zoo pour Enfants et Mini-Ferme", "Espace interactif où les familles peuvent caresser et nourrir capybaras, chèvres naines, moutons et lapins."),
        "es": ("Zoológico Infantil y Animales Amigables", "Área interactiva para que las familias acaricien y alimenten capibaras, cabras enanas, ovejas y conejos."),
        "de": ("Kinder- und Streichelzoo", "Interaktiver Bereich für Familien zum Streicheln und Füttern von Wasserschweinen (Capybaras), Zwergziegen, Schafen und Kaninchen."),
        "ru": ("Детский контактный зоопарк", "Интерактивная зона для семей, где можно гладить и кормить капибар, карликовых коз, овец и кроликов."),
        "pt": ("Zoológico Infantil e Fazendinha", "Área interativa onde famílias podem acariciar e alimentar capivaras, cabras anãs, ovelhas e coelhos."),
        "id": ("Kebun Binatang Anak & Satwa Ramah", "Area interaktif keluarga untuk membelai dan memberi makan kapibara, kambing kerdil, domba, dan kelinci.")
    },
    3: { # Herbivores
        "vi": ("Khu Động Vật Ăn Cỏ & Móng Guốc", "Thung lũng đồng cỏ bán hoang dã dành cho voi, hà mã, tê giác trắng, hươu cao cổ, ngựa vằn và hươu vàng."),
        "en": ("Herbivore & Ungulate Savannah", "Semi-wild open savannah valley home to Asian elephants, hippos, white rhinos, giraffes, zebras, and hog deer."),
        "zh": ("食草动物与蹄类大草原", "开阔的半野生草原山谷，栖息着亚洲象、河马、白犀牛、长颈鹿、斑马和豚鹿。"),
        "ja": ("草食動物・有蹄類サバンナ", "アジアゾウ、カバ、シロサイ、キリン、シマウマ、ホッグジカが暮らす半野生のサバンナエリア。"),
        "ko": ("초식동물 및 유제류 사바나", "아시아코끼리, 하마, 흰코뿔소, 기린, 얼룩말, 호그사슴이 서식하는 반야생 초원 계곡."),
        "th": ("ทุ่งหญ้าสะวันนาสัตว์กินพืชและสัตว์มีกีบ", "หุบเขาทุ่งหญ้ากึ่งธรรมชาติที่เป็นที่อยู่อาศัยของช้างเอเชีย ฮิปโปโปเตมัส แรดขาว ยีราฟ ม้าลาย และเนื้อทราย"),
        "fr": ("Savane des Herbivores et Ongulés", "Vallée ouverte semi-sauvage accueillant éléphants d'Asie, hippopotames, rhinocéros blancs, girafes, zèbres et cerfs cochons."),
        "es": ("Sabana de Herbívoros y Ungulados", "Valle de pradera semisalvaje hogar de elefantes asiáticos, hipopótamos, rinocerontes blancos, jirafas, cebras y ciervos porcinos."),
        "de": ("Pflanzenfresser- und Huftier-Savanne", "Weitläufiges Halbwild-Savannental für Asiatische Elefanten, Flusspferde, Breitmaulnashörner, Giraffen, Zebras und Schweinshirsche."),
        "ru": ("Саванна травоядных и копытных", "Полудикая открытая саванна, где обитают азиатские слоны, бегемоты, белые носороги, жирафы, зебры и свиные олени."),
        "pt": ("Savana de Herbívoros e Ungulados", "Vale semi-selvagem aberto onde vivem elefantes asiáticos, hipopótamos, rinocerontes-brancos, girafas, zebras e cervos-porcinos."),
        "id": ("Sabana Satwa Herbivora & Berkuku", "Lembah sabana semi-liar tempat tinggal gajah Asia, kuda nil, badak putih, jerapah, zebra, dan rusa bawean.")
    },
    4: { # Aviary
        "vi": ("Khu Vườn Chim & Đầm Nước Nhiệt Đới", "Quần xã lồng vòm cao 15m nuôi dưỡng chim hồng hoàng, niệc mỏ vằn, cao cát, bồ nông, trĩ sao và vẹt trắng."),
        "en": ("Tropical Aviary & Wetland Sanctuary", "15m monumental aviary dome conserving great hornbills, wreathed hornbills, pelicans, crested argus, and white cockatoos."),
        "zh": ("热带鸟类与湿地保护区", "15米宏伟圆顶生态网笼，栖息着双角犀鸟、花冠皱盔犀鸟、斑嘴鹈鹕、冠眼斑雉和大白凤头鹦鹉。"),
        "ja": ("熱帯鳥類ドーム・湿地サンクチュアリ", "オオサイチョウ、シワコブサイチョウ、ペリカン、カンムリセイラン、タイハクオウムが舞う高さ15mの巨大ドーム。"),
        "ko": ("열대 조류 돔 및 습지 보호구역", "큰뿔코뿔새, 주름투구코뿔새, 펠리컨, 볏공작꿩, 백유황앵무가 서식하는 15m 높이의 돔형 생태망."),
        "th": ("กรงนกยักษ์โดมเขตร้อนและพื้นที่ชุ่มน้ำ", "โดมกรงนกขนาดมหึมาสูง 15 เมตรที่อนุรักษ์นกกก นกกกชน ห่านกระสา นกหว้า และนกกระตั้วขาว"),
        "fr": ("Volière Tropicale et Sanctuaire Humide", "Dôme aviaire monumental de 15m abritant calaos bicornes, calaos ondulés, pélicans, argus ocellés et cacatoès blancs."),
        "es": ("Aviario Tropical y Humedal Silvestre", "Domo aviar monumental de 15m que alberga cálaos bicornes, cálaos de cuello ondulado, pelícanos, argos ocelados y cacatúas blancas."),
        "de": ("Tropische Großvoliere und Feuchtgebiet", "15 Meter hohe monumentale Kuppelvoliere mit Doppelhornvögeln, Furchenhornvögeln, Pelikanen, Perlenpfauen und Weißhaubenkakadus."),
        "ru": ("Тропический купольный вольер и водно-болотные угодья", "15-метровый купольный вольер, где обитают двурогие калао, волнистые калао, пеликаны, хохлатые аргусы и белые какаду."),
        "pt": ("Viveiro Tropical e Santuário de Zonas Húmidas", "Cúpula monumental de 15 metros que abriga calaus-bicornes, calaus-ondulados, pelicanos, argus-ocelados e catatuas-brancas."),
        "id": ("Kubah Burung Tropis & Suaka Lahan Basah", "Kubah sangkar raksasa setinggi 15 meter yang menaungi rangkong papan, julang emas, pelikan, kuau raja, dan kakatua putih.")
    },
    5: { # Heritage
        "vi": ("Khu Di Tích, Cảnh Quan & Cây Di Sản", "Trục di tích lịch sử quy tụ Đền Hùng 1926, Bảo Tàng Lịch Sử, Hồ Sen Thủy Tạ và cổ thụ sọ khỉ hơn 130 năm."),
        "en": ("Heritage, Landscape & Century Trees", "Historical axis featuring the 1926 Hung King Temple, History Museum, Lotus Lake, and 130+ year-old heritage African mahogany trees."),
        "zh": ("历史古迹、景观与百年古树区", "历史文化轴线，包括1926年雄王庙、历史博物馆、莲花池水榭及树龄逾130年的非凡非洲桃花心木古树。"),
        "ja": ("歴史遺産・景観・百年の古樹エリア", "1926年建造のフン王寺院、歴史博物館、蓮池の水上亭、樹齢130年を超える遺産巨木が集う歴史文化軸。"),
        "ko": ("역사 유적, 경관 및 백년 고목 구역", "1926년 건립된 훙왕 사당, 역사박물관, 연꽃 호수 정자, 130년 넘은 유산 고목들이 모여 있는 역사 문화 축."),
        "th": ("เขตโบราณสถาน ทัศนียภาพ และต้นไม้ร้อยปี", "แกนประวัติศาสตร์ที่มีวัดกษัตริย์ฮุงปี 1926 พิพิธภัณฑ์ประวัติศาสตร์ สระบัว และต้นไม้โบราณอายุกว่า 130 ปี"),
        "fr": ("Patrimoine Historique, Paysage et Arbres Centenaires", "Axe culturel abritant le Temple des Rois Hung (1926), le Musée d'Histoire, le Lac aux Lotus et des acajous du Sénégal centenaires."),
        "es": ("Patrimonio Histórico, Paisaje y Árboles Centenarios", "Eje histórico que incluye el Templo de los Reyes Hung (1926), Museo de Historia, Lago de los Lotos y árboles de caoba africana centenarios."),
        "de": ("Historisches Erbe, Landschaft und Jahrhunderte Bäume", "Historische Achse mit dem Hung-König-Tempel (1926), dem Historischen Museum, dem Lotussee und über 130 Jahre alten Erbbäumen."),
        "ru": ("Историческое наследие, ландшафт и вековые деревья", "Историческая ось с храмом королей Хунгов 1926 года, Музеем истории, озером лотосов и деревьями возрастом более 130 лет."),
        "pt": ("Património Histórico, Paisagem e Árvores Centenárias", "Eixo cultural que inclui o Templo dos Reis Hung (1926), Museu de História, Lago de Lótus e árvores centenárias com mais de 130 anos."),
        "id": ("Kawasan Warisan Budaya, Lanskap & Pohon Bersejarah", "Poros sejarah yang menampilkan Kuil Raja Hung 1926, Museum Sejarah, Danau Teratai, dan pohon pusaka berusia lebih dari 130 tahun.")
    },
    6: { # Primates
        "vi": ("Khu Đảo Vượn & Linh Trưởng Quý Hiếm", "Ốc đảo sinh thái nuôi dưỡng đười ươi Bornean, vượn má vàng, voọc chà vá chân xám và voọc chà vá chân đen đặc hữu."),
        "en": ("Rare Primate & Gibbon Island", "Lush island oasis housing Bornean orangutans, yellow-cheeked gibbons, and endemic grey-shanked and black-shanked douc langurs."),
        "zh": ("珍稀灵长类与长臂猿岛", "湖心绿洲岛，繁育婆罗洲猩猩、黄颊长臂猿、灰胫白臀叶猴和黑胫白臀叶猴。"),
        "ja": ("希少霊長類・ギボンアイランド", "ボルネオオランウータン、キッペキテナガザル、ハイイロシャンクドゥクラングールが暮らす緑豊かなオアシス島。"),
        "ko": ("희귀 영장류 및 긴팔원숭이 섬", "보르네오오랑우탄, 노란뺨긴팔원숭이, 회색다리두크원숭이, 검은다리두크원숭이가 서식하는 호수 오아시스 섬."),
        "th": ("เกาะชะนีและไพรเมตหายาก", "โอเอซิสกลางทะเลสาบที่เป็นที่อยู่อาศัยของอุรังอุตังบอร์เนียว ชะนีแก้มเหลือง และค่างห้าสีสองชนิด"),
        "fr": ("Île des Gibbons et Primates Rares", "Oasis insulaire verdoyante abritant orangs-outans de Bornéo, gibbons à joues jaunes et doucs langurs endémiques."),
        "es": ("Isla de Gibones y Primates Raros", "Oasis insular que alberga orangutanes de Borneo, gibones de mejillas amarillas y langures douc endémicos."),
        "de": ("Insel der seltenen Primaten und Gibbons", "Üppige Insel-Oase mit Borneo-Orang-Utans, Gelbwangen-Schopfgibbons und endemischen Grauschenkligen sowie Schwarzschenkligen Kleideraffen."),
        "ru": ("Остров гиббонов и редких приматов", "Зеленый остров-оазис, где живут борнейские орангутаны, желтощекие гиббоны и эндемичные лангуры дук."),
        "pt": ("Ilha de Gibões e Primatas Raros", "Oásis insular verdejante que acolhe orangotangos-de-bornéu, gibões-de-bochechas-amarelas e langures-douc endémicos."),
        "id": ("Pulau Owa & Primata Langka", "Oase pulau yang asri tempat tinggal orangutan Kalimantan, owa pipi kuning, dan lutung douc endemik.")
    },
    7: { # Carnivores
        "vi": ("Khu Động Vật Ăn Thịt Hoàng Gia", "Khu bảo tồn các loài thú săn mồi dũng mãnh: Hổ Bengal, Hổ Siberia, Sư tử châu Phi, Báo hoa mai, Báo gấm và Báo lửa."),
        "en": ("Royal Carnivore & Big Cat Safari", "Fortified predator territory conserving Bengal tigers, Siberian tigers, African lions, leopards, clouded leopards, and Asian golden cats."),
        "zh": ("皇家肉食猛兽狩猎区", "强化保护区，保护孟加拉虎、西伯利亚虎、非洲狮、金钱豹、云豹和金猫。"),
        "ja": ("百獣の王・肉食獣サファリ", "ベンガルトラ、アムールトラ、アフリカライオン、ヒョウ、ウンピョウ、アジアゴールデンキャットが君臨する大型肉食獣エリア。"),
        "ko": ("황실 맹수 및 대형 고양이과 사파리", "벵골호랑이, 시베리아호랑이, 아프리카사자, 표범, 구름표범, 아시아황금고양이를 보호하는 최첨단 맹수 구역."),
        "th": ("ซาฟารีสัตว์กินเนื้อและสัตว์ตระกูลแมวใหญ่", "พื้นที่สัตว์นักล่าที่อนุรักษ์เสือโคร่งเบงกอล เสือโคร่งไซบีเรีย สิงโตแอฟริกา เสือดาว เสือลายเมฆ และเสือไฟ"),
        "fr": ("Safari des Carnivores et Grands Félins", "Territoire fortifié préservant tigres du Bengale, tigres de Sibérie, lions d'Afrique, léopards, panthères nébuleuses et chats dorés d'Asie."),
        "es": ("Safari de Carnívoros y Grandes Felinos", "Territorio fortificado que preserva tigres de Bengala, tigres siberianos, leones africanos, leopardos, panteras nebulosas y gatos dorados asiáticos."),
        "de": ("Raubtier- und Großkatzen-Safari", "Gesichertes Areal für Bengal-Tiger, Sibirische Tiger, afrikanische Löwen, Leoparden, Nebelparder und Asiatische Goldkatzen."),
        "ru": ("Сафари хищников и больших кошек", "Укрепленная территория хищников, где обитают бенгальские тигры, амурские тигры, африканские львы, леопарды, дымчатые леопарды и азиатские золотистые кошки."),
        "pt": ("Safari dos Carnívoros e Grandes Felinos", "Território fortificado que preserva tigres-de-bengala, tigres-siberianos, leões-africanos, leopardos, panteras-nebulosas e gatos-dourados-asiáticos."),
        "id": ("Safari Satwa Karnivora & Kucing Besar", "Kawasan predator berbenteng yang melestarikan harimau Benggala, harimau Siberia, singa Afrika, macan tutul, macan dahan, dan kucing emas Asia.")
    }
}

for aid, langs in area_translations.items():
    for lang_code, (title, desc) in langs.items():
        upsert_translation('Area', aid, lang_code, title, desc)

print("Seeded 12-language translations for all 7 canonical Areas.")

# Enclosures translations for VI and EN
cur.execute('SELECT "EnclosureId", "Code", "Name", "Description" FROM "ENCLOSURES";')
all_encs = cur.fetchall()
for enc in all_encs:
    enc_id = enc['EnclosureId']
    name_vi = enc['Name']
    desc_vi = enc['Description']
    upsert_translation('Enclosure', enc_id, 'vi', name_vi, desc_vi)
    
    # EN Translation
    name_en = (name_vi
        .replace("Chuồng Nuôi Báo Hoa Mai", "Leopard Enclosure")
        .replace("Chuồng Bảo Tồn Báo Gấm", "Clouded Leopard Enclosure")
        .replace("Chuồng Nuôi Dưỡng Báo Lửa", "Asian Golden Cat Enclosure")
        .replace("Chuồng Hổ Bengal", "Bengal Tiger Enclosure")
        .replace("Chuồng Hổ Siberia & Hổ Trắng", "Siberian & White Tiger Enclosure")
        .replace("Chuồng Sư Tử Hoàng Gia", "Royal Lion Enclosure")
        .replace("Bãi Thả Voi Châu Á", "Asian Elephant Open Habitat")
        .replace("Bãi Thả Hà Mã", "Hippo River Pool Habitat")
        .replace("Khu Vực Tê Giác Trắng", "White Rhino Sanctuary")
        .replace("Đồng Cỏ Hươu Cao Cổ", "Giraffe Savannah")
        .replace("Khu Thảo Nguyên Ngựa Vằn", "Zebra Plains Enclosure")
        .replace("Chuồng Bảo Tồn Hươu Vàng", "Hog Deer Conservation Enclosure")
        .replace("Lồng Vòm Chim Nhiệt Đới", "Tropical Aviary Dome")
        .replace("Chuồng Chim Niệc Mỏ Vằn", "Wreathed Hornbill Enclosure")
        .replace("Khu Vực Cao Cát Bụng Trắng", "Oriental Pied Hornbill Aviary")
        .replace("Hồ Thủy Điểu & Bồ Nông", "Pelican Lake & Waterfowl Sanctuary")
        .replace("Khu Vực Trĩ Sao Bản Địa", "Crested Argus Enclosure")
        .replace("Nhà Lưới Vẹt Trắng Mào Vàng", "White Cockatoo Aviary Netting")
        .replace("Ngôi Nhà Đười Ươi Bornean", "Bornean Orangutan House")
        .replace("Đảo Vượn Má Vàng", "Yellow-cheeked Gibbon Island")
        .replace("Khu Bán Hoang Dã Voọc Chà Vá", "Douc Langur Semi-Wild Habitat")
        .replace("Khuôn Viên Thú Nhỏ Thân Thiện", "Friendly Petting Zoo Enclosure")
        .replace("Nhà Trưng Bày Rắn Hổ Chúa & Bò Sát", "King Cobra & Reptile Pavilion")
    )
    desc_en = f"Official Saigon Zoo verified enclosure: {name_en}."
    upsert_translation('Enclosure', enc_id, 'en', name_en, desc_en)

conn.commit()
print("All translations committed successfully!")
conn.close()
