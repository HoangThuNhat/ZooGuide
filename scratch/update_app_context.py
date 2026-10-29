import re

EXTRA_KEYS = {
    'vi': {
        'headerTicketActivate': 'Kích Hoạt Vé',
        'heroEyebrow': 'HỆ THỐNG THUYẾT MINH TỰ ĐỘNG THẢO CẦM VIÊN',
        'heroMainTitle': 'Thảo Cầm Viên Sài Gòn',
        'heroSubheadline': 'Khám phá thiên nhiên di sản 160 năm',
        'heroDescription': 'Trải nghiệm hướng dẫn tham quan số với bản đồ địa lý thực tế (OpenStreetMap), thuyết minh âm thanh đa ngôn ngữ cho từng loài động vật quý hiếm và đặt vé trực tuyến VietQR tức thì.',
        'heroBtnBuyTicket': 'Đặt Vé Tham Quan',
        'heroBtnMap': 'Bản Đồ Đi Lại',
        'heroBtnAudio': 'Thuyết Minh Âm Thanh',
        'heroActiveSession': 'Phiên tham quan đang hoạt động:',
        'heroViewPass': 'Xem Thẻ Điện Tử',
        'heroHasPassPrompt': 'Quý khách đã có vé giấy hoặc mã QR vào cổng?',
        'heroActivateNow': 'Kích hoạt vé ngay →',
        'openingHoursLabel': 'Giờ mở cửa hàng ngày',
        'addressLabel': 'Địa chỉ sở thú',
        'ticketPriceLabel': 'Giá vé vào cổng',
        'gatesLabel': 'Cổng đón khách',
        'btnPurchaseTicket': 'Mua vé tham quan',
        'btnActivateTicket': 'Kích hoạt vé',
        'ticketRequiredNarration': 'Bạn cần có vé tham quan hợp lệ để sử dụng chức năng thuyết minh.',
        'ticketExpiredNarration': 'Phiên tham quan của bạn đã hết hạn. Vui lòng mua vé mới để tiếp tục nghe thuyết minh.',
        'ticketGpsNearbyPrompt': 'Bạn đang ở gần chuồng thú. Vui lòng kích hoạt vé để nghe thuyết minh tự động.',
        'slideAvailableAudio': 'Có sẵn bài thuyết minh âm thanh'
    },
    'en': {
        'headerTicketActivate': 'Activate Ticket',
        'heroEyebrow': 'SAIGON ZOO SMART AUDIO TOUR SYSTEM',
        'heroMainTitle': 'Saigon Zoo & Botanical Gardens',
        'heroSubheadline': 'Discover 160 Years of Living Botanical Heritage',
        'heroDescription': 'Experience digital zoo wayfinding with live geographic maps (OpenStreetMap), multilingual audio narration for rare wildlife, and instant VietQR online ticketing.',
        'heroBtnBuyTicket': 'Buy Tickets Online',
        'heroBtnMap': 'Wayfinding Map',
        'heroBtnAudio': 'Audio Guide',
        'heroActiveSession': 'Active Tour Session:',
        'heroViewPass': 'View Digital Pass',
        'heroHasPassPrompt': 'Already have an admission ticket or QR pass?',
        'heroActivateNow': 'Activate pass now →',
        'openingHoursLabel': 'Daily Opening Hours',
        'addressLabel': 'Zoo Address',
        'ticketPriceLabel': 'Admission Fare',
        'gatesLabel': 'Visitor Gates',
        'btnPurchaseTicket': 'Buy Tickets',
        'btnActivateTicket': 'Activate Ticket',
        'ticketRequiredNarration': 'A valid admission ticket is required to access the audio guide.',
        'ticketExpiredNarration': 'Your tour session has expired. Please purchase a new ticket to continue listening.',
        'ticketGpsNearbyPrompt': 'You are near an animal enclosure. Please activate your ticket to enable automatic audio.',
        'slideAvailableAudio': 'Audio narration available'
    },
    'zh': {
        'headerTicketActivate': '激活门票',
        'heroEyebrow': '西贡动植物园智能语音导览系统',
        'heroMainTitle': '西贡动植物园',
        'heroSubheadline': '探索160年悠久生态遗产',
        'heroDescription': '体验基于真实地理地图（OpenStreetMap）的数字游览向导、珍稀野生动物多语言语音讲解与便捷在线购票。',
        'heroBtnBuyTicket': '在线购票',
        'heroBtnMap': '游园地图',
        'heroBtnAudio': '物种讲解',
        'heroActiveSession': '当前有效参观会话：',
        'heroViewPass': '查看电子门票',
        'heroHasPassPrompt': '已持有纸质门票或入园二维码？',
        'heroActivateNow': '立即激活门票 →',
        'openingHoursLabel': '每日开园时间',
        'addressLabel': '园区地址',
        'ticketPriceLabel': '门票价格',
        'gatesLabel': '入园大门',
        'btnPurchaseTicket': '购买门票',
        'btnActivateTicket': '激活门票',
        'ticketRequiredNarration': '收听语音导览需要有效的入园门票。',
        'ticketExpiredNarration': '您的游园会话已过期，请购买新门票以继续收听讲解。',
        'ticketGpsNearbyPrompt': '您已靠近展区，请激活门票以开启自动语音讲解。',
        'slideAvailableAudio': '提供多语言语音讲解'
    },
    'ja': {
        'headerTicketActivate': 'チケット有効化',
        'heroEyebrow': 'サイゴン動植物園 スマート音声ガイドシステム',
        'heroMainTitle': 'サイゴン動植物園',
        'heroSubheadline': '160年の歴史を誇る自然遺産を探訪',
        'heroDescription': 'OpenStreetMapによる園内マップ案内、希少野生動物の多言語音声解説、便利なオンラインチケットをご体験ください。',
        'heroBtnBuyTicket': 'チケット購入',
        'heroBtnMap': '園内マップ',
        'heroBtnAudio': '音声ガイド',
        'heroActiveSession': '有効な見学セッション：',
        'heroViewPass': '電子パスを表示',
        'heroHasPassPrompt': '紙チケットまたはQRコードをお持ちですか？',
        'heroActivateNow': '今すぐチケットを有効化 →',
        'openingHoursLabel': '開園時間',
        'addressLabel': '所在地',
        'ticketPriceLabel': '入園料',
        'gatesLabel': '入場ゲート',
        'btnPurchaseTicket': 'チケット購入',
        'btnActivateTicket': 'チケット有効化',
        'ticketRequiredNarration': '音声ガイドをご利用いただくには有効なチケットが必要です。',
        'ticketExpiredNarration': 'チケットセッションの有効期限が切れました。新しくチケットをお求めください。',
        'ticketGpsNearbyPrompt': '展示舎の近くにいます。自動音声ガイドを聞くにはチケットを有効化してください。',
        'slideAvailableAudio': '音声解説あり'
    },
    'ko': {
        'headerTicketActivate': '티켓 활성화',
        'heroEyebrow': '사이공 동식물원 스마트 오디오 투어 시스템',
        'heroMainTitle': '사이공 동식물원',
        'heroSubheadline': '160년 생태 유산과의 만남',
        'heroDescription': '실제 지도 기반 길찾기, 멸종위기 야생동물 다국어 오디오 해설 및 편리한 온라인 티켓 예매를 경험하세요.',
        'heroBtnBuyTicket': '티켓 예매',
        'heroBtnMap': '관람 지도',
        'heroBtnAudio': '오디오 가이드',
        'heroActiveSession': '활성화된 관람 세션:',
        'heroViewPass': '전자 티켓 보기',
        'heroHasPassPrompt': '입장권 또는 QR 코드를 이미 소지하고 계신가요?',
        'heroActivateNow': '지금 티켓 활성화 →',
        'openingHoursLabel': '개장 시간',
        'addressLabel': '동물원 주소',
        'ticketPriceLabel': '입장료',
        'gatesLabel': '입장 게이트',
        'btnPurchaseTicket': '티켓 구매',
        'btnActivateTicket': '티켓 활성화',
        'ticketRequiredNarration': '오디오 해설을 청취하려면 유효한 관람 티켓이 필요합니다.',
        'ticketExpiredNarration': '관람 세션이 만료되었습니다. 계속 청취하시려면 새 티켓을 구매해 주세요.',
        'ticketGpsNearbyPrompt': '동물 사육장 부근입니다. 자동 해설을 들으시려면 티켓을 활성화하세요.',
        'slideAvailableAudio': '오디오 해설 제공'
    },
    'th': {
        'headerTicketActivate': 'เปิดใช้งานบัตร',
        'heroEyebrow': 'ระบบทัวร์เสียงอัจฉริยะสวนสัตว์ไซง่อน',
        'heroMainTitle': 'สวนสัตว์และสวนพฤกษศาสตร์ไซง่อน',
        'heroSubheadline': 'สัมผัสมรดกธรรมชาติที่มีชีวิตกว่า 160 ปี',
        'heroDescription': 'สัมผัสประสบการณ์นำทางด้วยแผนที่จริง เสียงบรรยายสัตว์ป่าหายากหลายภาษา และการจองบัตรออนไลน์ที่สะดวกรวดเร็ว',
        'heroBtnBuyTicket': 'ซื้อบัตรเข้าชม',
        'heroBtnMap': 'แผนที่สวนสัตว์',
        'heroBtnAudio': 'เสียงบรรยาย',
        'heroActiveSession': 'เซสชันเข้าชมที่เปิดใช้งาน:',
        'heroViewPass': 'ดูบัตรอิเล็กทรอนิกส์',
        'heroHasPassPrompt': 'มีบัตรกระดาษหรือคิวอาร์โค้ดแล้วหรือยัง?',
        'heroActivateNow': 'เปิดใช้งานบัตรทันที →',
        'openingHoursLabel': 'เวลาเปิดทำการทุกวัน',
        'addressLabel': 'ที่อยู่สวนสัตว์',
        'ticketPriceLabel': 'ราคาบัตรเข้าชม',
        'gatesLabel': 'ประตูปากทางเข้า',
        'btnPurchaseTicket': 'ซื้อบัตรเข้าชม',
        'btnActivateTicket': 'เปิดใช้งานบัตร',
        'ticketRequiredNarration': 'จำเป็นต้องมีบัตรเข้าชมที่ถูกต้องเพื่อใช้งานระบบเสียงบรรยาย',
        'ticketExpiredNarration': 'เซสชันการเข้าชมของคุณหมดอายุแล้ว กรุณาซื้อบัตรใหม่เพื่อฟังต่อ',
        'ticketGpsNearbyPrompt': 'คุณอยู่ใกล้กรงสัตว์ กรุณาเปิดใช้งานบัตรเพื่อรับฟังเสียงบรรยายอัตโนมัติ',
        'slideAvailableAudio': 'มีเสียงบรรยายพร้อมให้บริการ'
    },
    'fr': {
        'headerTicketActivate': 'Activer le Billet',
        'heroEyebrow': 'SYSTÈME D’AUDIOGUIDE DU ZOO DE SAÏGON',
        'heroMainTitle': 'Jardin Botanique et Zoologique de Saïgon',
        'heroSubheadline': 'Explorez 160 ans de patrimoine naturel',
        'heroDescription': 'Découvrez la visite guidée numérique avec cartographie réelle (OpenStreetMap), commentaires audio multilingues sur les espèces et billetterie en ligne instantanée.',
        'heroBtnBuyTicket': 'Acheter un Billet',
        'heroBtnMap': 'Plan du Zoo',
        'heroBtnAudio': 'Audioguide',
        'heroActiveSession': 'Session de visite active :',
        'heroViewPass': 'Voir le Pass Numérique',
        'heroHasPassPrompt': 'Vous avez déjà un billet d’entrée ou un code QR ?',
        'heroActivateNow': 'Activer le billet maintenant →',
        'openingHoursLabel': 'Heures d’ouverture quotidiennes',
        'addressLabel': 'Adresse du zoo',
        'ticketPriceLabel': 'Tarifs d’entrée',
        'gatesLabel': 'Portes d’entrée',
        'btnPurchaseTicket': 'Acheter un billet',
        'btnActivateTicket': 'Activer le billet',
        'ticketRequiredNarration': 'Un billet d’entrée valide est requis pour accéder aux commentaires audio.',
        'ticketExpiredNarration': 'Votre session de visite a expiré. Veuillez acheter un nouveau billet pour continuer l’écoute.',
        'ticketGpsNearbyPrompt': 'Vous êtes près d’un enclos. Veuillez activer votre billet pour lancer l’audio automatique.',
        'slideAvailableAudio': 'Commentaire audio disponible'
    },
    'es': {
        'headerTicketActivate': 'Activar Entrada',
        'heroEyebrow': 'SISTEMA DE AUDIOGUÍA DEL ZOOLÓGICO DE SAIGÓN',
        'heroMainTitle': 'Jardín Botánico y Zoológico de Saigón',
        'heroSubheadline': 'Descubra 160 años de patrimonio vivo',
        'heroDescription': 'Disfrute de la guía digital con mapas reales (OpenStreetMap), narración de audio multilingüe para fauna amenazada y venta de entradas en línea.',
        'heroBtnBuyTicket': 'Comprar Entradas',
        'heroBtnMap': 'Mapa del Zoo',
        'heroBtnAudio': 'Audioguía',
        'heroActiveSession': 'Sesión de visita activa:',
        'heroViewPass': 'Ver Pase Digital',
        'heroHasPassPrompt': '¿Ya tiene su entrada física o código QR?',
        'heroActivateNow': 'Activar entrada ahora →',
        'openingHoursLabel': 'Horario de apertura',
        'addressLabel': 'Dirección del zoológico',
        'ticketPriceLabel': 'Precios de entrada',
        'gatesLabel': 'Puertas de acceso',
        'btnPurchaseTicket': 'Comprar entrada',
        'btnActivateTicket': 'Activar entrada',
        'ticketRequiredNarration': 'Se requiere una entrada válida para acceder a la audioguía.',
        'ticketExpiredNarration': 'Su sesión de visita ha caducado. Adquiera una nueva entrada para continuar escuchando.',
        'ticketGpsNearbyPrompt': 'Está cerca de un recinto. Active su entrada para reproducir la audioguía automática.',
        'slideAvailableAudio': 'Audioguía disponible'
    },
    'de': {
        'headerTicketActivate': 'Ticket Aktivieren',
        'heroEyebrow': 'SAIGON ZOO SMARTES AUDIO-TOUR SYSTEM',
        'heroMainTitle': 'Botanischer & Zoologischer Garten Saigon',
        'heroSubheadline': '160 Jahre lebendiges Naturerbe entdecken',
        'heroDescription': 'Erleben Sie digitale Zooführung mit Live-Karten (OpenStreetMap), mehrsprachigen Audiokommentaren und schnellem Online-Ticketkauf.',
        'heroBtnBuyTicket': 'Tickets Kaufen',
        'heroBtnMap': 'Zoo-Karte',
        'heroBtnAudio': 'Audioguide',
        'heroActiveSession': 'Aktive Besuchssitzung:',
        'heroViewPass': 'Digitalen Pass Anzeigen',
        'heroHasPassPrompt': 'Besitzen Sie bereits ein Papierticket oder einen QR-Code?',
        'heroActivateNow': 'Ticket jetzt aktivieren →',
        'openingHoursLabel': 'Tägliche Öffnungszeiten',
        'addressLabel': 'Adresse des Zoos',
        'ticketPriceLabel': 'Eintrittspreise',
        'gatesLabel': 'Eingangstore',
        'btnPurchaseTicket': 'Ticket kaufen',
        'btnActivateTicket': 'Ticket aktivieren',
        'ticketRequiredNarration': 'Ein gültiges Ticket ist erforderlich, um den Audioguide zu nutzen.',
        'ticketExpiredNarration': 'Ihre Besuchssitzung ist abgelaufen. Bitte erwerben Sie ein neues Ticket, um fortzufahren.',
        'ticketGpsNearbyPrompt': 'Sie befinden sich in der Nähe eines Geheges. Bitte aktivieren Sie Ihr Ticket für automatische Audioführung.',
        'slideAvailableAudio': 'Audiokommentar verfügbar'
    },
    'ru': {
        'headerTicketActivate': 'Активировать билет',
        'heroEyebrow': 'СИСТЕМА АУДИОГИДА ЗООПАРКА САЙГОНА',
        'heroMainTitle': 'Сайгонский зоопарк и ботанический сад',
        'heroSubheadline': 'Откройте для себя 160 лет природного наследия',
        'heroDescription': 'Цифровой путеводитель с интерактивной картой (OpenStreetMap), многоязычным аудиогидом по редким животным и онлайн-покупкой билетов.',
        'heroBtnBuyTicket': 'Купить билеты',
        'heroBtnMap': 'Карта зоопарка',
        'heroBtnAudio': 'Аудиогид',
        'heroActiveSession': 'Активная сессия посещения:',
        'heroViewPass': 'Электронный билет',
        'heroHasPassPrompt': 'У вас уже есть входной билет или QR-код?',
        'heroActivateNow': 'Активировать билет →',
        'openingHoursLabel': 'Часы работы ежедневно',
        'addressLabel': 'Адрес зоопарка',
        'ticketPriceLabel': 'Стоимость билетов',
        'gatesLabel': 'Входные ворота',
        'btnPurchaseTicket': 'Купить билет',
        'btnActivateTicket': 'Активировать билет',
        'ticketRequiredNarration': 'Для прослушивания аудиогида необходим действительный билет.',
        'ticketExpiredNarration': 'Срок действия сессии посещения истёк. Пожалуйста, приобретите новый билет.',
        'ticketGpsNearbyPrompt': 'Вы находитесь рядом с вольером. Активируйте билет для автоматического аудиогида.',
        'slideAvailableAudio': 'Доступна аудиоэкскурсия'
    },
    'pt': {
        'headerTicketActivate': 'Ativar Ingresso',
        'heroEyebrow': 'SISTEMA DE AUDIOGUIA DO ZOOLÓGICO DE SAIGON',
        'heroMainTitle': 'Jardim Zoológico e Botânico de Saigon',
        'heroSubheadline': 'Descubra 160 anos de patrimônio vivo',
        'heroDescription': 'Navegação digital com mapas geográficos (OpenStreetMap), comentários de áudio multilíngues e bilheteira online instantânea.',
        'heroBtnBuyTicket': 'Comprar Ingressos',
        'heroBtnMap': 'Mapa do Zoo',
        'heroBtnAudio': 'Audioguia',
        'heroActiveSession': 'Sessão de visita ativa:',
        'heroViewPass': 'Ver Ingresso Digital',
        'heroHasPassPrompt': 'Já possui ingresso físico ou código QR?',
        'heroActivateNow': 'Ativar ingresso agora →',
        'openingHoursLabel': 'Horário diário',
        'addressLabel': 'Endereço do zoológico',
        'ticketPriceLabel': 'Preço dos ingressos',
        'gatesLabel': 'Portões de entrada',
        'btnPurchaseTicket': 'Comprar ingresso',
        'btnActivateTicket': 'Ativar ingresso',
        'ticketRequiredNarration': 'É necessário um ingresso válido para ouvir as narrações em áudio.',
        'ticketExpiredNarration': 'Sua sessão de visita expirou. Adquira um novo ingresso para continuar ouvindo.',
        'ticketGpsNearbyPrompt': 'Você está próximo a um recinto. Ative seu ingresso para liberar a reprodução automática.',
        'slideAvailableAudio': 'Narração em áudio disponível'
    },
    'id': {
        'headerTicketActivate': 'Aktifkan Tiket',
        'heroEyebrow': 'SISTEM PANDUAN AUDIO KEBUN BINATANG SAIGON',
        'heroMainTitle': 'Kebun Binatang & Botani Saigon',
        'heroSubheadline': 'Jelajahi 160 tahun warisan alam hidup',
        'heroDescription': 'Panduan kunjungan digital dengan peta nyata (OpenStreetMap), narasi audio multibahasa satwa langka, dan pembelian tiket online instan.',
        'heroBtnBuyTicket': 'Beli Tiket Kunjungan',
        'heroBtnMap': 'Peta Zoo',
        'heroBtnAudio': 'Panduan Audio',
        'heroActiveSession': 'Sesi kunjungan aktif:',
        'heroViewPass': 'Lihat Tiket Digital',
        'heroHasPassPrompt': 'Sudah memiliki tiket fisik atau kode QR?',
        'heroActivateNow': 'Aktifkan tiket sekarang →',
        'openingHoursLabel': 'Jam buka harian',
        'addressLabel': 'Alamat kebun binatang',
        'ticketPriceLabel': 'Harga tiket masuk',
        'gatesLabel': 'Gerbang masuk',
        'btnPurchaseTicket': 'Beli tiket',
        'btnActivateTicket': 'Aktifkan tiket',
        'ticketRequiredNarration': 'Tiket kunjungan yang valid diperlukan untuk mengakses panduan audio.',
        'ticketExpiredNarration': 'Sesi kunjungan Anda telah berakhir. Silakan beli tiket baru untuk melanjutkan mendengarkan.',
        'ticketGpsNearbyPrompt': 'Anda berada di dekat kandang satwa. Aktifkan tiket untuk memulai audio otomatis.',
        'slideAvailableAudio': 'Tersedia narasi audio'
    }
}

with open('web/src/context/AppContext.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# For each language, insert extra keys before the end of its object
# In AppContext, each language ends with: animalListenBtn: '...' \n    }, or \n    }
for lang, keys_dict in EXTRA_KEYS.items():
    # Find block for lang
    pattern = rf'({lang}:\s*\{{[^}}]+?)(animalListenBtn:[^\n]+)'
    match = re.search(pattern, code, re.DOTALL)
    if not match:
        print(f"Could not find match for {lang}")
        continue
    
    # Format extra keys
    lines = []
    for k, v in keys_dict.items():
        v_escaped = v.replace("'", "\\'")
        lines.append(f"        {k}: '{v_escaped}',")
    extra_str = "\n".join(lines)
    
    # Replace
    replacement = rf'\1\2,\n{extra_str}'
    code = re.sub(pattern, replacement, code, count=1, flags=re.DOTALL)

# Now update mergedT and AppProvider
old_merged = """    const hasActiveSession = Boolean(currentSession);
    const mergedT = {
        ...(translations[currentLang] || translations.vi),
        ...(remoteUiTranslations[currentLang] || {})
    };"""

new_merged = """    const hasActiveSession = Boolean(currentSession);

    const checkTicketAccess = useCallback(() => {
        if (!currentSession || !currentSession.sessionId) {
            return {
                valid: false,
                reason: 'NO_TICKET',
                message: t?.ticketRequiredNarration || 'Bạn cần có vé tham quan hợp lệ để sử dụng chức năng thuyết minh.'
            };
        }
        if (new Date(currentSession.expiresAt) <= new Date()) {
            return {
                valid: false,
                reason: 'EXPIRED',
                message: t?.ticketExpiredNarration || 'Phiên tham quan của bạn đã hết hạn. Vui lòng mua vé mới để tiếp tục nghe thuyết minh.'
            };
        }
        return {
            valid: true,
            session: currentSession
        };
    }, [currentSession]);

    // Layered fallback: English base -> Vietnamese authoritative -> Target Language -> Remote DB overrides
    const mergedT = {
        ...(translations.en || {}),
        ...(translations.vi || {}),
        ...(translations[currentLang] || {}),
        ...(remoteUiTranslations[currentLang] || {})
    };"""

if old_merged in code:
    code = code.replace(old_merged, new_merged)
    print("Replaced mergedT successfully!")
else:
    print("Could not find old_merged")

# Also add checkTicketAccess to AppContext.Provider value
old_val = "            currentSession,\n            hasActiveSession,\n            validateTicketCode,"
new_val = "            currentSession,\n            hasActiveSession,\n            checkTicketAccess,\n            validateTicketCode,"
if old_val in code:
    code = code.replace(old_val, new_val)
    print("Added checkTicketAccess to Provider value!")
else:
    print("Could not find old_val for Provider value")

with open('web/src/context/AppContext.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Saved updated AppContext.jsx")
