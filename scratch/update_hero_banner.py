with open('web/src/components/layout/HeroBanner.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace hardcoded strings
replacements = [
    ("<span>HỆ THỐNG THUYẾT MINH TỰ ĐỘNG THẢO CẦM VIÊN</span>",
     "<span>{t?.heroEyebrow || 'HỆ THỐNG THUYẾT MINH TỰ ĐỘNG THẢO CẦM VIÊN'}</span>"),

    ("<span className=\"hero-main-title\">Thảo Cầm Viên Sài Gòn</span>",
     "<span className=\"hero-main-title\">{t?.heroMainTitle || 'Thảo Cầm Viên Sài Gòn'}</span>"),

    ("<span className=\"hero-subheadline\">Khám phá thiên nhiên di sản 160 năm</span>",
     "<span className=\"hero-subheadline\">{t?.heroSubheadline || 'Khám phá thiên nhiên di sản 160 năm'}</span>"),

    ("<p className=\"hero-description\">\n                            Trải nghiệm hướng dẫn tham quan số với bản đồ địa lý thực tế (OpenStreetMap), thuyết minh âm thanh đa ngôn ngữ cho từng loài động vật quý hiếm và đặt vé trực tuyến VietQR tức thì.\n                        </p>",
     "<p className=\"hero-description\">\n                            {t?.heroDescription || 'Trải nghiệm hướng dẫn tham quan số với bản đồ địa lý thực tế (OpenStreetMap), thuyết minh âm thanh đa ngôn ngữ cho từng loài động vật quý hiếm và đặt vé trực tuyến VietQR tức thì.'}\n                        </p>"),

    ("<span>Đặt Vé Tham Quan</span>",
     "<span>{t?.heroBtnBuyTicket || 'Đặt Vé Tham Quan'}</span>"),

    ("<span>Bản Đồ Đi Lại</span>",
     "<span>{t?.heroBtnMap || 'Bản Đồ Đi Lại'}</span>"),

    ("<span>Thuyết Minh Âm Thanh</span>",
     "<span>{t?.heroBtnAudio || 'Thuyết Minh Âm Thanh'}</span>"),

    ("<span>Phiên tham quan đang hoạt động:</span>",
     "<span>{t?.heroActiveSession || 'Phiên tham quan đang hoạt động:'}</span>"),

    ("Xem Thẻ Điện Tử",
     "{t?.heroViewPass || 'Xem Thẻ Điện Tử'}"),

    ("<span>Quý khách đã có vé giấy hoặc mã QR vào cổng?</span>",
     "<span>{t?.heroHasPassPrompt || 'Quý khách đã có vé giấy hoặc mã QR vào cổng?'}</span>"),

    ("Kích hoạt vé ngay →",
     "{t?.heroActivateNow || 'Kích hoạt vé ngay →'}"),

    ("• Có sẵn bài thuyết minh âm thanh",
     "• {t?.slideAvailableAudio || 'Có sẵn bài thuyết minh âm thanh'}"),

    ("<span className=\"strip-label\">Giờ mở cửa hàng ngày</span>",
     "<span className=\"strip-label\">{t?.openingHoursLabel || 'Giờ mở cửa hàng ngày'}</span>"),

    ("<span className=\"strip-label\">Địa chỉ sở thú</span>",
     "<span className=\"strip-label\">{t?.addressLabel || 'Địa chỉ sở thú'}</span>"),

    ("<span className=\"strip-label\">Giá vé vào cổng</span>",
     "<span className=\"strip-label\">{t?.ticketPriceLabel || 'Giá vé vào cổng'}</span>"),

    ("<span className=\"strip-label\">Cổng đón khách</span>",
     "<span className=\"strip-label\">{t?.gatesLabel || 'Cổng đón khách'}</span>")
]

for old, new in replacements:
    if old in text:
        text = text.replace(old, new, 1)
        print(f"Replaced: {old[:30]}...")
    else:
        # Try normalizing whitespace / CRLF
        normalized_old = old.replace('\r\n', '\n').replace('\n', '\r\n')
        if normalized_old in text:
            text = text.replace(normalized_old, new, 1)
            print(f"Replaced (normalized): {old[:30]}...")
        else:
            print(f"NOT FOUND: {old[:30]}...")

with open('web/src/components/layout/HeroBanner.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Saved HeroBanner.jsx")
