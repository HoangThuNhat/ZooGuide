# Update MapTab.jsx
with open('web/src/components/map/MapTab.jsx', 'r', encoding='utf-8') as f:
    maptab = f.read()

old_maptab_str = """        // Kiểm tra quyền nghe thuyết minh (yêu cầu phiên vé)
        if (!hasActiveSession) {
            showToast(`Bạn đang ở gần "${candidate.name}". Vui lòng kích hoạt vé tham quan để nghe thuyết minh tự động.`, 'info');
            setIsTicketModalOpen(true);
            return;
        }"""

new_maptab_str = """        // Kiểm tra quyền nghe thuyết minh (yêu cầu phiên vé)
        if (!hasActiveSession) {
            audioCooldownMapRef.current.set(candidate.id, now);
            showToast(`Bạn đang ở gần "${candidate.name}". Vui lòng mua hoặc kích hoạt vé tham quan để nghe thuyết minh tự động.`, 'info');
            return;
        }"""

if old_maptab_str.replace('\r\n', '\n') in maptab.replace('\r\n', '\n'):
    # Normalize CRLF
    maptab_norm = maptab.replace('\r\n', '\n')
    maptab_norm = maptab_norm.replace(old_maptab_str.replace('\r\n', '\n'), new_maptab_str.replace('\r\n', '\n'), 1)
    with open('web/src/components/map/MapTab.jsx', 'w', encoding='utf-8') as f:
        f.write(maptab_norm)
    print("Updated MapTab.jsx ticket check successfully!")
else:
    print("Could not find ticket check in MapTab.jsx")

# Update VisitorPortal.jsx
with open('web/src/pages/visitor/VisitorPortal.jsx', 'r', encoding='utf-8') as f:
    vp = f.read()

old_vp_check = """        if (!hasActiveSession || !currentSession?.sessionId) {
            showToast('Vui lòng kích hoạt vé tham quan hợp lệ để sử dụng chức năng thuyết minh.', 'error');
            pauseAudioPlayback();
            setIsTicketModalOpen(true);
            return;
        }"""

new_vp_check = """        if (!hasActiveSession || !currentSession?.sessionId) {
            showToast(t?.ticketRequiredNarration || 'Vui lòng kích hoạt vé tham quan hợp lệ để sử dụng chức năng thuyết minh.', 'error');
            pauseAudioPlayback();
            setIsTicketModalOpen(true);
            return;
        }

        if (new Date(currentSession.expiresAt) <= new Date()) {
            showToast(t?.ticketExpiredNarration || 'Phiên tham quan của bạn đã hết hạn. Vui lòng mua vé mới để tiếp tục nghe thuyết minh.', 'error');
            clearSession();
            pauseAudioPlayback();
            setIsTicketModalOpen(true);
            return;
        }"""

old_vp_poi_check = """        if (!hasActiveSession || !currentSession?.sessionId) {
            showToast('Vui lòng kích hoạt vé tham quan hợp lệ để sử dụng chức năng thuyết minh.', 'error');
            pauseAudioPlayback();
            setIsTicketModalOpen(true);
            return;
        }"""

vp_norm = vp.replace('\r\n', '\n')
if old_vp_check.replace('\r\n', '\n') in vp_norm:
    vp_norm = vp_norm.replace(old_vp_check.replace('\r\n', '\n'), new_vp_check.replace('\r\n', '\n'))
    with open('web/src/pages/visitor/VisitorPortal.jsx', 'w', encoding='utf-8') as f:
        f.write(vp_norm)
    print("Updated VisitorPortal.jsx ticket checks successfully!")
else:
    print("Could not find ticket check in VisitorPortal.jsx")
