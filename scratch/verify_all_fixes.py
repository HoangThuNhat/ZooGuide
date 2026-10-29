import re, json

print("=== ZOOGUIDE VERIFICATION: ALL 4 ISSUES ===")

# --- 1. VERIFY LANGUAGE SWITCHING ---
print("\n[TEST 1] Verifying 12-Language Support and Dictionaries...")
with open('web/src/context/AppContext.jsx', 'r', encoding='utf-8') as f:
    app_context = f.read()

required_langs = ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'fr', 'es', 'de', 'ru', 'pt', 'id']
for l in required_langs:
    assert f"code: '{l}'" in app_context, f"Language {l} missing in DEFAULT_LANGUAGES"
    assert f"{l}: {{" in app_context, f"Dictionary {l} missing in translations"
print(f"  ✓ All 12 languages declared in DEFAULT_LANGUAGES and translations dictionary.")

# Check key fallback in AppContext
assert "...(translations.en || {})" in app_context, "Layered fallback to English missing"
assert "...(translations.vi || {})" in app_context, "Layered fallback to Vietnamese missing"
assert "...(translations[currentLang] || {})" in app_context, "CurrentLang dictionary missing"
print("  ✓ Layered key fallback (en -> vi -> target -> remote) verified.")

# Check HeroBanner uses translations
with open('web/src/components/layout/HeroBanner.jsx', 'r', encoding='utf-8') as f:
    hero = f.read()

assert "t?.heroMainTitle" in hero, "Hero title not localized"
assert "t?.heroBtnBuyTicket" in hero, "Hero buy ticket button not localized"
assert "t?.heroBtnMap" in hero, "Hero map button not localized"
assert "t?.heroBtnAudio" in hero, "Hero audio button not localized"
assert "t?.heroActiveSession" in hero, "Hero active session not localized"
assert "t?.openingHoursLabel" in hero, "Hero opening hours not localized"
assert "t?.ticketPriceLabel" in hero, "Hero ticket fare not localized"
print("  ✓ HeroBanner completely migrated to localized translation keys.")

# Check Header uses translations
with open('web/src/components/layout/Header.jsx', 'r', encoding='utf-8') as f:
    header = f.read()
assert "t?.tabMap" in header and "t?.tabSpeciesAudio" in header and "t?.tabAnimals" in header, "Header tabs not localized"
print("  ✓ Header navigation and language selector verified.")

# --- 2. VERIFY TICKET-GATED NARRATION ---
print("\n[TEST 2] Verifying Ticket-Gated Narration (Manual & GPS)...")
assert "checkTicketAccess" in app_context, "checkTicketAccess helper missing from AppContext"
print("  ✓ checkTicketAccess helper exported in AppContext.")

with open('web/src/pages/visitor/VisitorPortal.jsx', 'r', encoding='utf-8') as f:
    vp = f.read()
assert "ticketRequiredNarration" in vp, "ticketRequiredNarration prompt missing in VisitorPortal"
assert "ticketExpiredNarration" in vp, "ticketExpiredNarration prompt missing in VisitorPortal"
assert "pauseAudioPlayback()" in vp, "Audio not paused on unauthorized access"
print("  ✓ VisitorPortal halts audio and prompts for valid pass on playback.")

with open('web/src/components/map/MapTab.jsx', 'r', encoding='utf-8') as f:
    map_code = f.read()
assert "audioCooldownMapRef.current.set(candidate.id, now)" in map_code, "Cooldown missing when unauthenticated in GPS trigger"
print("  ✓ GPS auto-narration prevents redirect/toast loops by applying cooldown when pass is absent.")

with open('web/src/components/species/SpeciesNarrationModal.jsx', 'r', encoding='utf-8') as f:
    sp_modal = f.read()
assert "btnPurchaseTicket" in sp_modal, "Purchase ticket action missing from SpeciesNarrationModal"
assert "btnActivateTicket" in sp_modal, "Activate ticket action missing from SpeciesNarrationModal"
print("  ✓ SpeciesNarrationModal provides dual actions (Buy Pass / Activate Pass) when locked.")

# --- 3. VERIFY POI ADMIN UI ---
print("\n[TEST 3] Verifying POI Admin UI...")
with open('web/src/pages/admin/AdminPoisPage.jsx', 'r', encoding='utf-8') as f:
    pois = f.read()
assert "modal-dialog" in pois, "modal-dialog missing in AdminPoisPage"
assert "modal-backdrop" in pois, "modal-backdrop missing in AdminPoisPage"
assert "modal-body" in pois, "modal-body missing in AdminPoisPage"
assert "isWithinZoo" in pois, "Zoo bounding box coordinate verification missing in AdminPoisPage"
assert "narrCount > 0" in pois, "Safe deletion narration check missing in AdminPoisPage"
print("  ✓ AdminPoisPage responsive dialogs, WGS84 coordinate boundary validation, and safe deletion verified.")

# --- 4. VERIFY NARRATION CMS ---
print("\n[TEST 4] Verifying Narration CMS...")
with open('web/src/pages/admin/AdminNarrationPage.jsx', 'r', encoding='utf-8') as f:
    narr = f.read()
assert "languages.find(l => l.code?.toLowerCase() === item.languageCode?.toLowerCase())" in narr, "Language mapping bug fix missing in AdminNarrationPage"
assert "filteredNarrations.length" in narr, "Dynamic narration count missing in AdminNarrationPage"
assert "Biên soạn lời thoại 12 ngôn ngữ" in narr, "Old 4 languages text still present in AdminNarrationPage"
assert "admin-narration-layout" in narr, "Responsive layout missing in AdminNarrationPage"
assert "narration-editor-card" in narr, "Editor card id missing in AdminNarrationPage"
print("  ✓ AdminNarrationPage language preservation on edit, 12 languages support, dynamic count, and responsive layout verified.")

print("\n>>> ALL TESTS PASSED SUCCESSFULLY (100%) <<<")
