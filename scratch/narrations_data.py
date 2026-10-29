# -*- coding: utf-8 -*-
"""
Verified 12-Language Multilingual Narration Data for Saigon Zoo Featured Animals.
Contains: vi, en, zh, ja, ko, th, fr, es, de, ru, pt, id.
Scientific names remain in Latin across all 12 languages.
"""

FEATURED_NARRATIONS = [
    {
        "species_id": 1, # Voi Châu Á
        "animal_id": 1,
        "slug": "voi_chau_a",
        "scientific_name": "Elephas maximus",
        "translations": {
            "vi": {
                "title": "Voi Châu Á - Người Khổng Lồ Hiền Hòa Của Rừng Nhiệt Đới",
                "content": "Chào mừng bạn đến với bãi thả Voi Châu Á tại Thảo Cầm Viên Sài Gòn. Voi Châu Á, tên khoa học là Elephas maximus, là loài động vật có vú trên cạn lớn nhất khu vực Châu Á. Khác với voi châu Phi, voi Châu Á có đôi tai nhỏ hơn, lưng vòm cong và đỉnh đầu có hai bướu u nổi rõ. Chiếc vòi voi là một kỳ quan tiến hóa với hơn 40.000 bó cơ linh hoạt, giúp chúng có thể nhặt một hạt đậu nhỏ hoặc nâng bổng khúc gỗ nặng hàng trăm kilogram. Đàn voi tại đây được chăm sóc với chế độ cỏ tươi, mía, chuối và thường xuyên tắm bùn để bảo vệ làn da nhạy cảm dưới ánh nắng nhiệt đới."
            },
            "en": {
                "title": "Asian Elephant - Gentle Giant of the Tropical Rainforest",
                "content": "Welcome to the Asian Elephant habitat at Saigon Zoo and Botanical Gardens. The Asian elephant, scientifically known as Elephas maximus, is the largest terrestrial mammal in Asia. Unlike African elephants, Asian elephants feature smaller ears, an arched back, and twin prominent domes on the forehead. The elephant's trunk is an evolutionary marvel comprising over 40,000 muscles, capable of picking up a single grain or lifting heavy tree trunks. Our elephant herd enjoys fresh forage, sugarcane, bananas, and daily mud baths to protect their sensitive skin from the tropical sun."
            },
            "zh": {
                "title": "亚洲象 - 热带雨林的温和巨人",
                "content": "欢迎来到西贡动植物园的亚洲象展区。亚洲象学名为 Elephas maximus，是亚洲大陆现存最大的陆生哺乳动物。与非洲象相比，亚洲象的耳朵较小，背部呈拱形，头顶有两个明显的凸起。象鼻是由四万多条肌肉组成的奇迹器官，既能灵活捡拾细小的豆粒，也能轻松举起数百公斤的巨木。在这里，大象每天享用新鲜青草、甘蔗和香蕉，并经常享受泥巴浴，以保护皮肤免受热带日晒的伤害。"
            },
            "ja": {
                "title": "アジアゾウ - 熱帯雨林の穏やかな巨人",
                "content": "サイゴン動植物園のアジアゾウ飼育場へようこそ。学名 Elephas maximus であるアジアゾウは、アジア地域最大の陸上哺乳類です。アフリカゾウと比較して耳が小さく、背中が丸いドーム状で、頭部に2つのコブがあるのが特徴です。象の鼻は4万以上の筋肉からなる驚異的な器官で、小さな種子をつまむ繊細さと、大木を持ち上げる力強さを兼ね備えています。園内のゾウたちは新鮮な牧草やサトウキビ、バナナを食べ、肌を保護するために心地よい泥浴びを楽しんでいます。"
            },
            "ko": {
                "title": "아시아코끼리 - 열대우림의 온화한 거인",
                "content": "사이공 동식물원의 아시아코끼리 서식지에 오신 것을 환영합니다. 학명이 Elephas maximus 인 아시아코끼리는 아시아 대륙에서 가장 큰 육상 포유류입니다. 아프리카코끼리에 비해 귀가 작고 등이 둥글며 이마에 두 개의 돌기가 있는 것이 특징입니다. 4만 개 이상의 근육으로 이루어진 코는 작은 콩알을 집어 올릴 만큼 섬세하면서도 무거운 통나무를 들어 올릴 수 있습니다. 이곳의 코끼리들은 신선한 풀과 사탕수수, 바나나를 먹으며 열대 햇볕으로부터 피부를 보호하기 위해 진흙 목욕을 즐깁니다."
            },
            "th": {
                "title": "ช้างเอเชีย - ยักษ์ใหญ่ผู้อ่อนโยนแห่งป่าเขตร้อน",
                "content": "ยินดีต้อนรับสู่ส่วนจัดแสดงช้างเอเชีย ณ สวนสัตว์ไซ่ง่อน ช้างเอเชียมีชื่อทางวิทยาศาสตร์ว่า Elephas maximus เป็นสัตว์เลี้ยงลูกด้วยนมบนบกที่ใหญ่ที่สุดในทวีปเอเชีย แตกต่างจากช้างแอฟริกาตรงที่มีใบหูเล็กกว่า หลังโค้งมน และมีโหนกคู่บนหน้าผาก งวงช้างประกอบด้วยกล้ามเนื้อมากกว่า 40,000 มัด สามารถหยิบจับเมล็ดพืชขนาดเล็กและยกท่อนซุงขนาดใหญ่ได้อย่างง่ายดาย ช้างที่นี่ได้รับอาหารสด เช่น หญ้า อ้อย กล้วย และเพลิดเพลินกับการแช่โคลนเพื่อปกป้องผิวจากแสงแดด"
            },
            "fr": {
                "title": "Éléphant d'Asie - Le Géant Paisible des Forêts Tropicales",
                "content": "Bienvenue dans l'enclos des éléphants d'Asie au Zoo de Saïgon. L'éléphant d'Asie, de son nom scientifique Elephas maximus, est le plus grand mammifère terrestre du continent asiatique. Contrairement à l'éléphant d'Afrique, il possède des oreilles plus petites, un dos voûté et deux bosses distinctes sur le front. Sa trompe est une merveille de la nature dotée de plus de 40 000 muscles, capable de ramasser une graine minuscule ou de soulever de lourds troncs d'arbres. Notre harde profite d'un régime d'herbe fraîche, de canne à sucre et de réguliers bains de boue pour protéger sa peau délicate."
            },
            "es": {
                "title": "Elefante Asiático - El Gigante Apacible de la Selva Tropical",
                "content": "Bienvenidos al recinto del elefante asiático en el Jardín Zoológico de Saigón. El elefante asiático, científicamente denominado Elephas maximus, es el mamífero terrestre más grande de Asia. A diferencia del elefante africano, presenta orejas más pequeñas, espalda arqueada y dos prominencias en la frente. Su trompa posee más de 40.000 músculos, capaz de recoger una pequeña semilla o levantar pesados troncos de árboles. En nuestro zoológico reciben forraje fresco, caña de azúcar y disfrutan de baños de lodo para proteger su piel del sol tropical."
            },
            "de": {
                "title": "Asiatischer Elefant - Der Sanfte Riese des Regenwaldes",
                "content": "Willkommen im Gehege der Asiatischen Elefanten im Zoo Saigon. Der Asiatische Elefant, wissenschaftlich Elephas maximus, ist das größte Landsäugetier Asiens. Im Vergleich zum afrikanischen Verwandten hat er kleinere Ohren, einen gewölbten Rücken und zwei markante Stirnhöcker. Sein Rüssel ist ein anatomisches Wunderwerk aus über 40.000 Muskeln, fähig, ein kleines Reiskorn aufzuheben oder gewaltige Baumstämme zu bewegen. Unsere Elefanten genießen frisches Gras, Zuckerrohr, Bananen sowie regelmäßige Schlammbäder zum Schutz ihrer Haut vor der tropischen Sonne."
            },
            "ru": {
                "title": "Азиатский слон - Миролюбивый великан тропических лесов",
                "content": "Добро пожаловать к вольеру азиатских слонов в зоопарке Сайгона. Азиатский слон, научное название Elephas maximus, является крупнейшим наземным млекопитающим Азии. В отличие от африканских сородичей, у него меньшие уши, выпуклая спина и два выраженных бугра на лбу. Хобот слона состоит из более чем 40 000 мышц, что позволяет поднимать как крошечные зерна, так и тяжелые бревна. Наши слоны питаются свежей травой, сахарным тростником и бананами, а также регулярно принимают грязевые ванны для защиты кожи от тропического солнца."
            },
            "pt": {
                "title": "Elefante-asiático - O Gigante Gentil da Floresta Tropical",
                "content": "Bem-vindos ao recinto do elefante-asiático no Zoológico de Saigon. O elefante-asiático, cientificamente denominado Elephas maximus, é o maior mamífero terrestre do continente asiático. Ao contrário do elefante-africano, apresenta orelhas menores, dorso arqueado e duas saliências na cabeça. Sua tromba é uma obra-prima evolutiva com mais de 40.000 músculos, capaz de apanhar pequenos grãos ou erguer troncos pesados. Nossa manada consome forragem fresca, cana-de-açúcar, bananas e desfruta de banhos de lama para proteger a pele do calor tropical."
            },
            "id": {
                "title": "Gajah Asia - Raksasa Lembut dari Hutan Hujan Tropis",
                "content": "Selamat datang di area Gajah Asia di Kebun Binatang Saigon. Gajah Asia, dengan nama ilmiah Elephas maximus, adalah mamalia darat terbesar di benua Asia. Berbeda dengan gajah Afrika, gajah Asia memiliki telinga yang lebih kecil, punggung melengkung, dan dua tonjolan di dahi. Belalainya merupakan keajaiban evolusi dengan lebih dari 40.000 otot, mampu memungut biji kecil maupun mengangkat batang kayu besar. Kawanan gajah di sini menikmati pakan rumput segar, tebu, pisang, serta rutin berkubang lumpur untuk melindungi kulitnya dari terik matahari tropis."
            }
        }
    },
    {
        "species_id": 2, # Hổ Bengal
        "animal_id": 2,
        "slug": "ho_bengal",
        "scientific_name": "Panthera tigris tigris",
        "translations": {
            "vi": {
                "title": "Hổ Bengal Ngộ Không - Chúa Tể Sơn Lâm Oai Hùng",
                "content": "Chào mừng bạn đến với khu chuồng Hổ Bengal tại Thảo Cầm Viên Sài Gòn. Hổ Bengal, tên khoa học là Panthera tigris tigris, là loài thú ăn thịt đầu bảng biểu tượng của rừng rậm Nam Á. Cá thể nổi tiếng tại đây là chú hổ trắng Ngộ Không sinh ra ngay tại Thảo Cầm Viên từ đột biến gen tự nhiên quý hiếm. Hổ Bengal là loài bơi lội cự phách, thích ngâm mình dưới nước trong những ngày nắng nóng. Chúng có bộ lông vằn độc nhất vô nhị ở từng cá thể, đóng vai trò ngụy trang hoàn hảo khi rình mồi trong bóng râm nhiệt đới."
            },
            "en": {
                "title": "Bengal Tiger Ngo Khong - Majestic King of the Jungle",
                "content": "Welcome to the Bengal Tiger habitat at Saigon Zoo and Botanical Gardens. The Bengal tiger, scientifically known as Panthera tigris tigris, is an apex predator of South Asian forests. A celebrated resident here was Ngo Khong, a magnificent white Bengal tiger born naturally right at Saigon Zoo. Unlike most felines, Bengal tigers are exceptional swimmers who relish cooling off in deep pools on hot afternoons. Each tiger possesses a distinct stripe pattern that serves as camouflage in the dappled jungle light."
            },
            "zh": {
                "title": "孟加拉虎悟空 - 威严的森林之王",
                "content": "欢迎来到西贡动植物园的孟加拉虎展区。孟加拉虎学名为 Panthera tigris tigris，是南亚森林中顶级的大型猫科捕食者。这里最著名的当属白虎“悟空”，它诞生于西贡动植物园，源自珍贵的隐性基因遗传。与大多数怕水的猫科动物不同，孟加拉虎非常擅长游泳，炎热午后常在水池中畅游嬉戏。每只老虎的斑纹图案都是独一无二的，在阳光斑驳的密林中提供了完美的伪装。"
            },
            "ja": {
                "title": "ベンガルトラ・ゴクウ - 威厳ある密林の王者",
                "content": "サイゴン動植物園のベンガルトラ展示エリアへようこそ。学名 Panthera tigris tigris のベンガルトラは、南アジアの森林生態系の頂点に君臨する肉食動物です。ここでの象徴的な存在が、サイゴン動植物園で自然交配により誕生した白トラの「ゴクウ」です。トラは多くのネコ科動物と異なり水浴びが大好きで、暑い日にはプールで巧みに泳ぎます。一頭ごとに異なる縞模様は、木漏れ日の熱帯林において優れた保護色となっています。"
            },
            "ko": {
                "title": "벵골호랑이 오공 - 밀림의 위엄 있는 제왕",
                "content": "사이공 동식물원의 벵골호랑이 서식지에 오신 것을 환영합니다. 학명이 Panthera tigris tigris 인 벵골호랑이는 남아시아 열대림의 최상위 포식자입니다. 이곳의 유명한 주인공은 사이공 동물원에서 태어난 백호 '오공(Ngo Khong)'입니다. 물을 무서워하는 다른 고양잇과 동물들과 달리 호랑이는 수영에 매우 능숙하며 무더운 날 수영장에서 휴식을 취합니다. 개체마다 고유한 줄무늬는 햇빛이 비치는 숲속에서 완벽한 위장 역할을 합니다."
            },
            "th": {
                "title": "เสือโคร่งเบงกอลหงอคง - เจ้าป่าผู้น่าเกรงขาม",
                "content": "ยินดีต้อนรับสู่ส่วนจัดแสดงเสือโคร่งเบงกอล ณ สวนสัตว์ไซ่ง่อน เสือโคร่งเบงกอลมีชื่อวิทยาศาสตร์ว่า Panthera tigris tigris เป็นนักล่าชั้นยอดแห่งป่าเอเชียใต้ หนึ่งในสมาชิกที่มีชื่อเสียงที่สุดคือเสือขาว 'หงอคง' ซึ่งถือกำเนิดขึ้น ณ สวนสัตว์แห่งนี้ เสือโคร่งต่างจากสัตว์ตระกูลแมวส่วนใหญ่ตรงที่รักการว่ายน้ำเป็นชีวิตจิตใจ ลวดลายพาดกลอนของเสือแต่ละตัวมีเอกลักษณ์เฉพาะตัว ช่วยในการพรางตัวท่ามกลางแมกไม้อย่างแนบเนียน"
            },
            "fr": {
                "title": "Tigre du Bengale Ngo Khong - Majestueux Roi de la Jungle",
                "content": "Bienvenue dans l'espace du Tigre du Bengale au Zoo de Saïgon. Le tigre du Bengale, Panthera tigris tigris, est le prédateur suprême des forêts d'Asie du Sud. Une figure emblématique de notre zoo était le tigre blanc Ngo Khong, né naturellement au sein du parc. Contrairement à beaucoup de félins, les tigres sont d'excellents nageurs qui adorent se rafraîchir dans l'eau pendant les heures chaudes. Les rayures uniques de chaque tigre lui procurent un camouflage idéal au cœur de la végétation tropicale."
            },
            "es": {
                "title": "Tigre de Bengala Ngo Khong - Majestuoso Rey de la Selva",
                "content": "Bienvenidos al hábitat del Tigre de Bengala en el Zoológico de Saigón. El tigre de Bengala, científicamente Panthera tigris tigris, es el depredador ápice de los bosques del sur de Asia. Un residente emblemático fue el tigre blanco Ngo Khong, nacido de forma natural en este mismo parque. A diferencia de otros felinos, a los tigres les encanta el agua y son excelentes nadadores. Las rayas de cada tigre son únicas, proporcionando un camuflaje perfecto en la espesura de la jungla."
            },
            "de": {
                "title": "Bengaltiger Ngo Khong - Majestätischer König des Dschungels",
                "content": "Willkommen im Gehege der Bengal-Tiger im Zoo Saigon. Der Königstiger, wissenschaftlich Panthera tigris tigris, ist das Spitzenraubtier der südasiatischen Wälder. Zu unseren bekanntesten Schützlingen gehörte der weiße Tiger Ngo Khong, der direkt im Zoo Saigon geboren wurde. Anders als die meisten Katzen lieben Tiger das Wasser und schwimmen meisterhaft, um sich abzukühlen. Das einzigartige Streifenmuster jedes Tieres bietet perfekte Tarnung im schattigen Dickicht."
            },
            "ru": {
                "title": "Бенгальский тигр Нго Конг - Величественный властелин джунглей",
                "content": "Добро пожаловать в вольер бенгальских тигров зоопарка Сайгона. Бенгальский тигр, Panthera tigris tigris — грозный хищник лесов Южной Азии. Особенной гордостью зоопарка был белый тигр Нго Конг, родившийся здесь в результате естественной мутации. В отличие от большинства кошачьих, тигры великолепно плавают и любят купаться в жаркие дни. Уникальный узор полос обеспечивает идеальную маскировку среди солнечных бликов тропического леса."
            },
            "pt": {
                "title": "Tigre-de-bengala Ngo Khong - Majestoso Rei da Selva",
                "content": "Bem-vindos ao espaço do Tigre-de-bengala no Zoológico de Saigon. O tigre-de-bengala, Panthera tigris tigris, é o predador de topo das florestas do Sul da Ásia. Uma das personalidades mais amadas do parque foi o tigre-branco Ngo Khong, nascido naturalmente aqui no zoológico. Ao contrário da maioria dos felinos, os tigres adoram água e são nadadores talentosos. As listras exclusivas de cada indivíduo oferecem uma camuflagem impecável sob as copas das árvores."
            },
            "id": {
                "title": "Harimau Benggala Ngo Khong - Raja Rimba yang Perkasa",
                "content": "Selamat datang di habitat Harimau Benggala di Kebun Binatang Saigon. Harimau Benggala, secara ilmiah dikenal sebagai Panthera tigris tigris, adalah pemangsa puncak hutan Asia Selatan. Salah satu ikon terkenal di sini adalah harimau putih bernama Ngo Khong yang lahir secara alami di Kebun Binatang Saigon. Berbeda dari kebanyakan kucing, harimau sangat suka berenang dan berendam saat cuaca panas. Pola belang pada bulunya unik pada setiap individu dan menjadi kamuflase sempurna di hutan tropis."
            }
        }
    },
    {
        "species_id": 3, # Sư Tử Châu Phi
        "animal_id": 3,
        "slug": "su_tu_chau_phi",
        "scientific_name": "Panthera leo",
        "translations": {
            "vi": {
                "title": "Sư Tử Châu Phi Mimi - Chúa Tể Bầy Đàn Thảo Nguyên",
                "content": "Chào mừng bạn đến với khu bảo tồn Sư tử tại Thảo Cầm Viên Sài Gòn. Sư tử, tên khoa học Panthera leo, là loài mèo lớn duy nhất sống theo bầy đàn gắn kết. Tại Thảo Cầm Viên, cụ sư tử trắng Mimi đã gắn bó suốt 16 năm và đạt tuổi thọ kỷ lục 18 năm, trở thành người bạn thân thương của nhiều thế hệ người dân thành phố. Tiếng gầm của sư tử trưởng thành có thể vang xa tới 8 kilomet trên thảo nguyên mở, là biểu tượng của sức mạnh và quyền uy tối thượng trong thế giới tự nhiên."
            },
            "en": {
                "title": "African Lion Mimi - Ruler of the Savannah Pride",
                "content": "Welcome to the African Lion sanctuary at Saigon Zoo and Botanical Gardens. The lion, scientifically known as Panthera leo, is the only wild felid species that lives in cooperative social groups called prides. Our beloved white lioness Mimi spent 16 memorable years here, living to the remarkable age of 18 as a cherished icon for generations of visitors. An adult lion's roar can resonate up to 8 kilometers across open grasslands, symbolizing unmatched power in the animal kingdom."
            },
            "zh": {
                "title": "非洲狮咪咪 - 草原狮群的传奇领袖",
                "content": "欢迎来到西贡动植物园的非洲狮展区。狮子学名为 Panthera leo，是猫科动物中唯一过着高度社会化群居生活的物种。在这里，白狮“咪咪”度过了长达16年的温馨岁月，享年18岁，是陪伴无数游客成长的珍贵记忆。成年狮子的咆哮声可传播远达8公里，在广阔的大草原上宣告着王者无与伦比的力量与尊严。"
            },
            "ja": {
                "title": "ライオン・ミミ - サバンナのプライドを率いる王",
                "content": "サイゴン動植物園のライオン保護エリアへようこそ。学名 Panthera leo のライオンは、ネコ科で唯一「プライド」と呼ばれる群れを作って暮らす社会的な動物です。当園で16年間にわたり親しまれたホワイトライオンの「ミミ」は、18歳という長寿を全うし、多くの来園者の心に生き続けています。成獣の咆哮は最大8キロメートル先まで響き渡り、百獣の王の圧倒的な威厳を示しています。"
            },
            "ko": {
                "title": "아프리카사자 미미 - 사바나 무리의 위대한 통치자",
                "content": "사이공 동식물원의 아프리카사자 서식지에 오신 것을 환영합니다. 학명이 Panthera leo 인 사자는 고양잇과 동물 중 유일하게 '프라이드'라는 무리를 이루어 생활합니다. 이곳에서 16년 동안 사랑받은 백사자 '미미'는 18세라는 놀라운 장수를 누리며 수많은 시민들에게 큰 감동을 주었습니다. 성체 사자의 포효는 최대 8킬로미터 밖까지 울려 퍼지며 야생에서의 강력한 힘을 상징합니다."
            },
            "th": {
                "title": "สิงโตแอฟริกามิมี่ - จ้าวแห่งทุ่งหญ้าสะวันนา",
                "content": "ยินดีต้อนรับสู่ส่วนจัดแสดงสิงโตแอฟริกา ณ สวนสัตว์ไซ่ง่อน สิงโตมีชื่อทางวิทยาศาสตร์ว่า Panthera leo เป็นสัตว์ตระกูลแมวชนิดเดียวที่อาศัยอยู่ร่วมกันเป็นฝูง สิงโตขาว 'มิมี่' ได้ผูกพันกับสวนสัตว์แห่งนี้มายาวนานถึง 16 ปี และมีอายุยืนยาวถึง 18 ปี เป็นขวัญใจของนักท่องเที่ยวทุกเพศทุกวัย เสียงคำรามของสิงโตตัวเต็มวัยสามารถก้องกังวานไปไกลถึง 8 กิโลเมตร สะท้อนถึงพลังอำนาจแห่งพงไพร"
            },
            "fr": {
                "title": "Lion d'Afrique Mimi - Souverain de la Savane",
                "content": "Bienvenue dans l'espace du Lion d'Afrique au Zoo de Saïgon. Le lion, Panthera leo, est le seul grand félin à vivre en groupes sociaux structurés appelés troupes. Notre lionne blanche Mimi a vécu 16 années mémorables au zoo, atteignant l'âge vénérable de 18 ans et marquant le cœur des visiteurs. Le rugissement puissant d'un lion adulte peut s'entendre jusqu'à 8 kilomètres à la ronde, affirmant sa souveraineté incontestée sur la savane."
            },
            "es": {
                "title": "León Africano Mimi - Soberano de la Sabana",
                "content": "Bienvenidos a la reserva del León Africano en el Zoológico de Saigón. El león, Panthera leo, es el único felino salvaje que vive en manadas familiares cooperativas. Nuestra recordada leona blanca Mimi habitó aquí durante 16 años, alcanzando la longevidad de 18 años como un tesoro para generaciones de visitantes. El rugido de un león adulto puede escucharse a más de 8 kilómetros de distancia, simbolizando su imponente presencia."
            },
            "de": {
                "title": "Afrikanischer Löwe Mimi - Herrscher der Savanne",
                "content": "Willkommen im Löwengehege des Zoos von Saigon. Der Löwe, Panthera leo, ist die einzige Großkatze, die in organisierten Rudeln zusammenlebt. Unsere geschätzte weiße Löwin Mimi verbrachte 16 wundervolle Jahre im Zoo und erreichte das biblische Alter von 18 Jahren. Das Brüllen eines ausgewachsenen Löwen ist über eine Distanz von bis zu 8 Kilometern zu hören und beweist seine unangefochtene Stellung als König der Tiere."
            },
            "ru": {
                "title": "Африканский лев Мими - Повелитель саванны",
                "content": "Добро пожаловать к вольеру африканских львов в зоопарке Сайгона. Лев, Panthera leo — единственная кошка, живущая сплоченными семейными группами — прайдами. Наша знаменитая белая львица Мими прожила в зоопарке 16 лет, дожив до почтенного возраста 18 лет. Грозный рык взрослого льва разносится по саванне на расстояние до 8 километров, символизируя абсолютную силу дикой природы."
            },
            "pt": {
                "title": "Leão-africano Mimi - Soberano da Savana",
                "content": "Bem-vindos ao espaço do Leão-africano no Zoológico de Saigon. O leão, cientificamente Panthera leo, é o único felino que vive em grupos sociais organizados chamados alcateias ou bandos. Nossa saudosa leoa-branca Mimi viveu aqui durante 16 anos marcantes, atingindo 18 anos de idade. O rugido de um leão adulto pode ecoar por até 8 quilômetros de distância, demonstrando sua força incontestável na natureza."
            },
            "id": {
                "title": "Singa Afrika Mimi - Penguasa Sabana yang Perkasa",
                "content": "Selamat datang di area Singa Afrika di Kebun Binatang Saigon. Singa, dengan nama ilmiah Panthera leo, adalah satu-satunya kucing besar yang hidup dalam kelompok sosial terstruktur. Singa putih betina kami, Mimi, tinggal di sini selama 16 tahun penuh kenangan dan mencapai usia 18 tahun, menjadi kesayangan warga kota. Raungan singa dewasa dapat terdengar hingga jarak 8 kilometer, melambangkan kekuasaan di alam liar."
            }
        }
    },
    {
        "species_id": 4, # Hà Mã
        "animal_id": 4,
        "slug": "ha_ma",
        "scientific_name": "Hippopotamus amphibius",
        "translations": {
            "vi": {
                "title": "Hà Mã - Gã Khổng Lồ Bán Thủy Sinh Vùng Nước Lớn",
                "content": "Chào mừng bạn đến với khu vực Hà Mã tại Thảo Cầm Viên Sài Gòn. Hà mã, tên khoa học Hippopotamus amphibius, là một trong những loài thú ăn cỏ nặng ký nhất thế giới. Ban ngày, chúng ngâm phần lớn cơ thể dưới nước mát để giữ ẩm cho làn da nhạy cảm không có tuyến mồ hôi. Khi đêm xuống, hà mã lên cạn và có thể đi bộ nhiều cây số để gặm hàng chục kilogram cỏ tươi. Chiếc miệng rộng lớn với lực cắn khủng khiếp là vũ khí tự vệ đáng gờm giúp chúng xua đuổi các loài thú săn mồi nguy hiểm."
            },
            "en": {
                "title": "Hippopotamus - Semi-Aquatic Giant of River Basins",
                "content": "Welcome to the Hippopotamus pool at Saigon Zoo and Botanical Gardens. The hippo, scientifically Hippopotamus amphibius, is one of the heaviest herbivorous mammals on Earth. During sunny days, they submerge their massive bodies in cool water to protect their sensitive, sweat-gland-free skin. At night, hippos emerge onto riverbanks, grazing on dozens of kilograms of fresh grass. Their formidable jaws and massive canines deliver one of nature's strongest bite forces."
            },
            "zh": {
                "title": "河马 - 水陆两栖的庞然大物",
                "content": "欢迎来到西贡动植物园的河马展区。河马学名为 Hippopotamus amphibius，是地球上体型最大的植食性哺乳动物之一。在白天的烈日下，它们大部分时间浸泡在清凉的水中，以保护没有汗腺的娇嫩皮肤。夜幕降临后，河马便会走上陆地，巡游数公里觅食数十公斤鲜草。它们宽阔的大嘴和强劲的咬合力是令所有食肉动物生畏的防御武器。"
            },
            "ja": {
                "title": "カバ - 水辺に暮らす巨大な草食獣",
                "content": "サイゴン動植物園のカバのプールへようこそ。学名 Hippopotamus amphibius のカバは、地球上で最も重い草食哺乳類の一つです。汗腺を持たない繊細な皮膚を乾燥や紫外線から守るため、日中は水の中で涼しく過ごします。夜になると陸に上がり、数キロ歩いて数十キロの新鮮な草を食べます。大きな口と強力な噛む力は、野生界屈指の防衛力を誇ります。"
            },
            "ko": {
                "title": "하마 - 강변의 거대한 반수생 동물",
                "content": "사이공 동식물원의 하마 수조에 오신 것을 환영합니다. 학명이 Hippopotamus amphibius 인 하마는 지구상에서 가장 무거운 초식 포유류 중 하나입니다. 땀샘이 없는 민감한 피부를 보호하기 위해 낮에는 시원한 물속에 몸을 담그고 지냅니다. 밤이 되면 뭍으로 나와 수 킬로미터를 걸으며 신선한 풀을 섭취합니다. 엄청난 치악력을 지닌 거대한 턱은 야생에서 강력한 자기방어 무기가 됩니다."
            },
            "th": {
                "title": "ฮิปโปโปเตมัส - ยักษ์ใหญ่ครึ่งบกครึ่งน้ำแห่งลุ่มน้ำ",
                "content": "ยินดีต้อนรับสู่สระน้ำฮิปโปโปเตมัส ณ สวนสัตว์ไซ่ง่อน ฮิปโปโปเตมัสมีชื่อทางวิทยาศาสตร์ว่า Hippopotamus amphibius เป็นหนึ่งในสัตว์กินพืชที่ตัวใหญ่และหนักที่สุดในโลก ในเวลากลางวันพวกมันจะแช่อยู่ในน้ำเพื่อปกป้องผิวหนังที่ไม่มีต่อมเหงื่อจากแสงแดด เมื่อถึงเวลาค่ำจะขึ้นมาเดินเล็มหญ้าสดหลายสิบกิโลกรัม ริมฝีปากที่กว้างและแรงกัดมหาศาลทำให้ฮิปโปเป็นสัตว์ที่น่าเกรงขามที่สุดชนิดหนึ่ง"
            },
            "fr": {
                "title": "Hippopotame - Le Colosse Semi-Aquatique des Rivières",
                "content": "Bienvenue au bassin des hippopotames du Zoo de Saïgon. L'hippopotame, Hippopotamus amphibius, compte parmi les plus lourds mammifères herbivores terrestres. Durant la journée, il passe son temps immergé dans l'eau fraîche pour hydrater sa peau dépourvue de glandes sudoripares. À la nuit tombée, il gagne la terre ferme pour brouter de grandes quantités d'herbe. Sa mâchoire colossale possède l'une des morsures les plus puissantes du règne animal."
            },
            "es": {
                "title": "Hipopótamo - El Coloso Semiacuático de los Ríos",
                "content": "Bienvenidos a la laguna de los hipopótamos en el Zoológico de Saigón. El hipopótamo, denominado Hippopotamus amphibius, es uno de los mamíferos herbívoros más pesados del planeta. Durante las horas soleadas permanece sumergido en agua fresca para proteger su piel sensible. Por la noche sale a tierra firme para alimentarse de hierba fresca. Su enorme boca y sus poderosos colmillos le otorgan una de las mordidas más temibles de la naturaleza."
            },
            "de": {
                "title": "Flusspferd - Der Halbaquatische Koloss der Flussläufe",
                "content": "Willkommen am Flusspferdbecken im Zoo Saigon. Das Flusspferd, wissenschaftlich Hippopotamus amphibius, gehört zu den schwersten Landsäugetieren der Erde. Tagsüber verbringt es die meiste Zeit im kühlen Wasser, um seine empfindliche Haut vor dem Austrocknen zu bewahren. Nach Einbruch der Dunkelheit geht es an Land, um kiloweise Gras zu fressen. Seine gewaltigen Kiefer besitzen eine der stärksten Beißkräfte im gesamten Tierreich."
            },
            "ru": {
                "title": "Бегемот - Полуводный гигант речных просторов",
                "content": "Добро пожаловать к бассейну бегемотов в зоопарке Сайгона. Обыкновенный бегемот, Hippopotamus amphibius — одно из самых массивных травоядных млекопитающих планеты. Днем гиганты нежатся в прохладной воде, спасая чувствительную кожу от перегрева. Ночью они выходят на сушу, съедая десятки килограммов свежей травы. Огромные челюсти бегемота обладают сокрушительной силой укуса, способной отпугнуть любого хищника."
            },
            "pt": {
                "title": "Hipopótamo - O Gigante Semiaquático dos Rios",
                "content": "Bem-vindos ao lago dos hipopótamos no Zoológico de Saigon. O hipopótamo, Hippopotamus amphibius, é um dos mamíferos herbívoros mais pesados da Terra. Durante o dia, permanece quase todo submerso em água fresca para proteger sua pele sensível sem glândulas sudoríparas. À noite, sai para pastar dezenas de quilos de capim. Sua mandíbula gigantesca abriga uma das mordidas mais poderosas de todo o reino animal."
            },
            "id": {
                "title": "Kuda Nil - Raksasa Semi-Akuatik di Daerah Aliran Sungai",
                "content": "Selamat datang di kolam Kuda Nil di Kebun Binatang Saigon. Kuda nil, dengan nama ilmiah Hippopotamus amphibius, adalah salah satu mamalia herbivora terberat di dunia. Pada siang hari, mereka berendam di air sejuk untuk melembapkan kulitnya yang tidak memiliki kelenjar keringat. Saat malam tiba, kuda nil naik ke darat untuk memakan puluhan kilogram rumput segar. Rahangnya yang sangat lebar memiliki kekuatan gigitan yang luar biasa kuat."
            }
        }
    },
    {
        "species_id": 5, # Hươu Cao Cổ
        "animal_id": 6,
        "slug": "huou_cao_co",
        "scientific_name": "Giraffa camelopardalis",
        "translations": {
            "vi": {
                "title": "Hươu Cao Cổ - Ngọn Tháp Sinh Học Trên Đồng Cỏ",
                "content": "Chào mừng bạn đến với khu bảo tồn Hươu Cao Cổ tại Thảo Cầm Viên Sài Gòn. Hươu cao cổ, tên khoa học Giraffa camelopardalis, là loài động vật có vú cao nhất hành tinh. Với chiếc cổ dài vươn cao tới gần 6 mét, chúng dễ dàng thưởng thức những chồi non và lá keo tươi ngon trên ngọn cây cao mà không loài thú nào với tới được. Chiếc lưỡi màu tím sẫm dài gần nửa mét có khả năng uốn lượn khéo léo để tránh những gai nhọn sắc bén của cành cây. Trái tim hà mã và hươu cao cổ đều là những kỳ quan sinh học đặc biệt giúp bơm máu lên tận não bộ."
            },
            "en": {
                "title": "Giraffe - Biological Tower of the African Savannah",
                "content": "Welcome to the Giraffe enclosure at Saigon Zoo and Botanical Gardens. The giraffe, scientifically Giraffa camelopardalis, is the tallest mammal on Earth. Standing up to nearly six meters tall, their long neck allows them to browse on nutritious acacia leaves and fresh shoots unreachable by other herbivores. Their prehensile dark-purple tongue measures up to 45 centimeters, expertly maneuvering around sharp thorns. A powerful heart generates tremendous blood pressure to deliver oxygen all the way to their brain."
            },
            "zh": {
                "title": "长颈鹿 - 非洲草原的高耸生命奇迹",
                "content": "欢迎来到西贡动植物园的长颈鹿展区。长颈鹿学名为 Giraffa camelopardalis，是地球上最高的哺乳动物。它们的身高可达近6米，修长的颈部使它们能够轻松采食树顶最鲜嫩的相思树叶，不受其他食草动物竞争。长颈鹿拥有长达45厘米的深紫色灵活舌头，能巧妙地避开尖锐树刺摘取绿叶。其强大的心脏能产生极高的血压，将血液源源不断泵送至高高在上的大脑。"
            },
            "ja": {
                "title": "キリン - サバンナにそびえ立つ命の塔",
                "content": "サイゴン動植物園のキリン飼育エリアへようこそ。学名 Giraffa camelopardalis のキリンは、地球上で最も背の高い哺乳類です。体高は最大で約6メートルにも達し、長い首を活かして他の動物が届かないアカシアの高枝の若葉を器用に食べます。約45センチもある柔軟な紫色の舌は、鋭いトゲを器用に避けて葉を巻き取ります。高い頭部に血液を送るため、キリンの心臓は非常に力強く発達しています。"
            },
            "ko": {
                "title": "기린 - 아프리카 사바나의 거대한 생명 탑",
                "content": "사이공 동식물원의 기린 서식지에 오신 것을 환영합니다. 학명이 Giraffa camelopardalis 인 기린은 지구상에서 키가 가장 큰 포유류입니다. 키가 약 6미터에 달해 다른 초식동물이 닿지 못하는 높은 나뭇가지의 신선한 아카시아 잎을 손쉽게 먹을 수 있습니다. 약 45센티미터에 이르는 짙은 보라색 혀는 날카로운 가시를 피해 먹이를 잡는 데 능숙합니다. 높은 뇌까지 혈액을 보내기 위해 강력한 심장 순환계를 지니고 있습니다."
            },
            "th": {
                "title": "ยีราฟ - หอคอยมีชีวิตแห่งทุ่งหญ้าแอฟริกา",
                "content": "ยินดีต้อนรับสู่ส่วนจัดแสดงยีราฟ ณ สวนสัตว์ไซ่ง่อน ยีราฟมีชื่อทางวิทยาศาสตร์ว่า Giraffa camelopardalis เป็นสัตว์เลี้ยงลูกด้วยนมที่สูงที่สุดในโลก ด้วยความสูงเกือบ 6 เมตร ลำคอยาวช่วยให้พวกมันเล็มใบอะเคเซียบนยอดไม้สูงได้อย่างง่ายดาย ลิ้นสีม่วงเข้มขนาดยาวถึง 45 เซนติเมตรมีความยืดหยุ่นสูง สามารถหลบหลีกหนามแหลมคมได้อย่างยอดเยี่ยม หัวใจของยีราฟมีขนาดใหญ่และทรงพลังเพื่อสูบฉีดเลือดขึ้นสู่สมองที่อยู่สูง"
            },
            "fr": {
                "title": "Girafe - La Sentinelle Élancée de la Savane",
                "content": "Bienvenue dans l'espace des girafes au Zoo de Saïgon. La girafe, Giraffa camelopardalis, est le plus grand animal terrestre. Culminant à près de six mètres de hauteur, son long cou lui permet d'atteindre les tendres feuilles d'acacia inaccessibles aux autres herbivores. Sa langue préhensile bleu violacé de près de 45 centimètres contourne adroitement les épines les plus acérées. Son cœur surpuissant génère une pression artérielle remarquable pour irriguer son cerveau élevé."
            },
            "es": {
                "title": "Jirafa - La Torre Viviente de la Sabana",
                "content": "Bienvenidos al mirador de las jirafas en el Zoológico de Saigón. La jirafa, Giraffa camelopardalis, es el mamífero más alto del planeta. Con una altura de casi seis metros, su cuello estilizado le permite alimentarse de las hojas más altas de acacia que ningún otro herbívoro puede alcanzar. Su lengua prensil de color púrpura oscuro mide hasta 45 centímetros, permitiéndole esquivar espinas con gran destreza. Su poderoso corazón bombea sangre con fuerza hasta su cabeza."
            },
            "de": {
                "title": "Giraffe - Der Lebendige Turm der Savanne",
                "content": "Willkommen bei den Giraffen im Zoo Saigon. Die Giraffe, Giraffa camelopardalis, ist das höchste Säugetier der Welt. Mit einer Höhe von fast sechs Metern erreicht ihr langer Hals nahrhafte Akazienblätter in Baumkronen, an die kein anderes Tier herankommt. Ihre bis zu 45 Zentimeter lange, blauviolette Zunge ist extrem beweglich und weicht dornigen Zweigen mühelos aus. Ein kraftvolles Herz pumpt das Blut unermüdlich gegen die Schwerkraft bis ins hochgelegene Gehirn."
            },
            "ru": {
                "title": "Жираф - Живая башня африканской саванны",
                "content": "Добро пожаловать к жирафам в зоопарке Сайгона. Жираф, Giraffa camelopardalis — самое высокое животное на планете. Достигая в высоту почти шести метров, он с легкостью объедает сочные листья акации на вершинах деревьев, недосягаемые для других травоядных. Длинный фиолетовый язык длиной около 45 сантиметров ловко огибает острые шипы. Мощное сердце жирафа развивает высокое давление, чтобы доставлять кровь на головокружительную высоту."
            },
            "pt": {
                "title": "Girafa - A Torre Viva da Savana Africana",
                "content": "Bem-vindos ao recinto das girafas no Zoológico de Saigon. A girafa, Giraffa camelopardalis, é o mamífero mais alto da Terra. Com quase seis metros de altura, seu pescoço imponente permite que se alimente de brotos e folhas de acácia inacessíveis a outros animais. Sua língua preênsil roxa-escura mede até 45 centímetros, desviando-se com maestria de espinhos afiados. Seu coração potente bombeia sangue com eficiência incomparável até o topo de sua cabeça."
            },
            "id": {
                "title": "Jerapah - Menara Hayati di Padang Sabana",
                "content": "Selamat datang di area Jerapah di Kebun Binatang Saigon. Jerapah, dengan nama ilmiah Giraffa camelopardalis, adalah mamalia tertinggi di dunia. Dengan tinggi mencapai hampir enam meter, lehernya yang panjang memungkinkannya memakan daun akasia di puncak pohon yang tidak dapat dijangkau hewan lain. Lidahnya yang berwarna ungu gelap sepanjang 45 sentimeter mampu meliuk lincah menghindari duri tajam. Jantungnya yang bertenaga memompa darah hingga ke otak di ketinggian."
            }
        }
    },
    {
        "species_id": 16, # Hồng Hoàng
        "animal_id": 16,
        "slug": "hong_hoang",
        "scientific_name": "Buceros bicornis",
        "translations": {
            "vi": {
                "title": "Hồng Hoàng - Sứ Giả Đại Ngàn Của Vương Quốc Loài Chim",
                "content": "Chào mừng bạn đến với nhà lồng vòm chim nhiệt đới tại Thảo Cầm Viên Sài Gòn. Hồng hoàng, tên khoa học Buceros bicornis, là loài chim mỏ sừng lớn và rực rỡ bậc nhất châu Á. Trên đỉnh chiếc mỏ cong vàng óng là một chiếc mũ sừng rỗng đặc trưng có vai trò khuếch đại âm thanh tiếng kêu và thu hút bạn tình. Sải cánh của hồng hoàng rộng tới 1.5 mét, khi bay tạo nên những luồng gió rào rào tựa như tiếng động cơ lướt qua tán rừng nhiệt đới. Chúng đóng vai trò cực kỳ quan trọng trong việc gieo rắc hạt giống, gìn giữ sự sinh sôi cho những cánh rừng nguyên sinh."
            },
            "en": {
                "title": "Great Hornbill - Regal Ambassador of the Avian Canopy",
                "content": "Welcome to the Tropical Aviary at Saigon Zoo and Botanical Gardens. The Great Hornbill, scientifically Buceros bicornis, is one of Asia's largest and most magnificent hornbill species. Crowning its large yellow bill is a prominent hollow casque that amplifies vocal calls and serves in territorial displays. With a wingspan reaching 1.5 meters, its flight produces a rhythmic rushing sound like a small locomotive soaring through the canopy. Great hornbills are vital seed dispersers that sustain tropical rainforest ecosystems."
            },
            "zh": {
                "title": "双角犀鸟 - 热带雨林树冠的华贵使者",
                "content": "欢迎来到西贡动植物园的热带飞禽馆。双角犀鸟学名为 Buceros bicornis，是亚洲体型最大、最引人注目的犀鸟之一。其鲜黄色的巨大鸟喙上方生长着标志性的中空盔突，能够增强鸣叫共鸣并用于求偶炫耀。双角犀鸟的翼展可达1.5米，飞行时翅膀拍击空气发出如引擎轰鸣般的宏大声响。作为自然界杰出的种子传播者，它们对维系热带原始森林的繁衍具有不可替代的生态意义。"
            },
            "ja": {
                "title": "オオサイチョウ - 熱帯林の林冠を舞う荘厳な使者",
                "content": "サイゴン動植物園の熱帯鳥類ドームへようこそ。学名 Buceros bicornis のオオサイチョウは、アジア最大級の堂々たるサイチョウです。大きな黄色い嘴の上には特徴的な中空の兜状突起があり、鳴き声を反響させたり求愛のアピールに役立っています。翼を広げると1.5メートルにも達し、飛翔時には蒸気機関のような豪快な羽音が森に響き渡ります。果実の種子を広く散布することで、熱帯雨林の再生に欠かせない役割を果たしています。"
            },
            "ko": {
                "title": "큰뿔코뿔새 - 열대림 상공의 위풍당당한 사절",
                "content": "사이공 동식물원의 열대 조류관에 오신 것을 환영합니다. 학명이 Buceros bicornis 인 큰뿔코뿔새는 아시아에서 가장 크고 화려한 코뿔새 종 중 하나입니다. 거대한 노란색 부리 위에 솟은 독특한 투구 모양의 돌기는 소리를 증폭시키고 짝을 유혹하는 역할을 합니다. 날개폭이 1.5미터에 달해 비행할 때 숲속에 거대한 바람 소리가 울려 퍼집니다. 열대림의 씨앗을 퍼뜨려 밀림의 생태계를 건강하게 유지하는 매우 중요한 조류입니다."
            },
            "th": {
                "title": "นกกก - ทูตผู้สง่างามแห่งเรือนยอดป่าดงดิบ",
                "content": "ยินดีต้อนรับสู่กรงนกขนาดใหญ่ ณ สวนสัตว์ไซ่ง่อน นกกกมีชื่อทางวิทยาศาสตร์ว่า Buceros bicornis เป็นนกเงือกขนาดใหญ่และสง่างามที่สุดชนิดหนึ่งในเอเชีย เหนือจะงอยปากสีเหลืองทองมีโหนกขนาดใหญ่ที่ช่วยขยายเสียงร้องและดึงดูดคู่ ด้วยปีกกว้างถึง 1.5 เมตร ขณะบินจึงเกิดเสียงลมกระพือปีกดังสนั่นคล้ายเสียงเครื่องจักรกล นกกกมีบทบาทสำคัญอย่างยิ่งในการปลูกป่าด้วยการกระจายเมล็ดพันธุ์ไม้ป่าธรรมชาติ"
            },
            "fr": {
                "title": "Grand Calao - L'Ambassadeur Majestueux de la Canopée",
                "content": "Bienvenue dans la volière tropicale du Zoo de Saïgon. Le Grand Calao, Buceros bicornis, est l'un des calaos les plus imposants et spectaculaires d'Asie. Son volumineux bec jaune est surmonté d'un casque creux qui amplifie ses cris puissants et joue un rôle dans les parades nuptiales. Avec une envergure de 1,5 mètre, son vol produit un vrombissement saisissant dans la cime des arbres. Il joue un rôle crucial de disséminateur de graines pour préserver la canopée tropicale."
            },
            "es": {
                "title": "Cálao Bicorne - Noble Mensajero del Dosel Tropical",
                "content": "Bienvenidos al aviario tropical del Zoológico de Saigón. El cálao bicorne, Buceros bicornis, es una de las aves más grandes y majestuosas de Asia. Sobre su pico curvado destaca un prominente casco hueco que amplifica sus vocalizaciones y ayuda en el cortejo. Con una envergadura alar de 1,5 metros, el batir de sus alas genera un potente zumbido audible en la selva. Estas magníficas aves son indispensables dispersoras de semillas en los bosques lluviosos."
            },
            "de": {
                "title": "Doppelhornvogel - Majestätischer Botschafter der Baumkronen",
                "content": "Willkommen in der Tropenvoliere des Zoos von Saigon. Der Doppelhornvogel, wissenschaftlich Buceros bicornis, ist eine der größten und eindrucksvollsten Hornvogelarten Asiens. Seinen mächtigen gelben Schnabel krönt ein hohler Hornaufsatz, der als Resonanzkörper für Rufe dient. Mit einer Spannweite von bis zu 1,5 Metern erzeugt sein Flug ein unverwechselbares Rauschen im Blätterdach. Als fleißiger Samenausbreiter leistet er einen unverzichtbaren Beitrag zum Fortbestand tropischer Urwälder."
            },
            "ru": {
                "title": "Большой индийский калао - Величественный посол крон тропиков",
                "content": "Добро пожаловать в тропический вольер зоопарка Сайгона. Большой индийский калао, Buceros bicornis — одна из самых крупных и красивых птиц-носорогов Азии. Над массивным желтым клювом возвышается полый шлем, служащий резонатором голоса и украшением в брачный период. Размах крыльев птицы достигает 1,5 метра, а ее полет сопровождается мощным гулом. Калао жизненно важен для леса, так как распространяет семена редких деревьев на огромные расстояния."
            },
            "pt": {
                "title": "Calau-bicorne - Embaixador Majestoso da Copa Tropical",
                "content": "Bem-vindos ao aviário tropical do Zoológico de Saigon. O calau-bicorne, cientificamente Buceros bicornis, é uma das maiores e mais impressionantes aves da Ásia. Sobre seu grande bico amarelo ergue-se um capacete oco distintivo que amplifica suas vocalizações territoriais. Com envergadura de até 1,5 metro, seu bater de asas produz um som rítmico vibrante através da mata. Essas aves desempenham um papel ecológico essencial como dispersoras de sementes nativas."
            },
            "id": {
                "title": "Rangkong Papan - Duta Agung Kanopi Hutan Tropis",
                "content": "Selamat datang di kubah burung tropis di Kebun Binatang Saigon. Rangkong Papan, secara ilmiah Buceros bicornis, adalah salah satu spesies burung enggang terbesar dan paling megah di Asia. Di atas paruh kuningnya terdapat tanduk berongga khas yang berfungsi memperkuat suara panggilan teritorial. Dengan rentang sayap mencapai 1,5 meter, kepakan sayapnya menghasilkan desau angin yang menggelegar di kanopi hutan. Burung ini sangat berjasa menyebarkan benih untuk kelestarian hutan hujan tropis."
            }
        }
    }
]

print(f"Loaded {len(FEATURED_NARRATIONS)} featured animal narrations with all 12 languages.")
