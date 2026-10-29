import re

# ==========================================
# 1. UPDATE AdminPoisPage.jsx
# ==========================================
with open('web/src/pages/admin/AdminPoisPage.jsx', 'r', encoding='utf-8') as f:
    pois_code = f.read()

pois_code = pois_code.replace('\r\n', '\n')

# Coordinate validation in handleSavePoi
old_save_start = """        setIsSaving(true);
        try {
            if (editingPoi) {"""

new_save_start = """        const lat = Number(formData.latitude);
        const lng = Number(formData.longitude);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
            showToast('Vui lòng nhập tọa độ địa lý WGS84 hợp lệ.', 'error');
            return;
        }

        // Kiểm tra ranh giới Thảo Cầm Viên Sài Gòn (vĩ độ ~10.7830 - 10.7930, kinh độ ~106.7000 - 106.7120)
        const isWithinZoo = lat >= 10.7830 && lat <= 10.7930 && lng >= 106.7000 && lng <= 106.7120;
        if (!isWithinZoo) {
            const confirmSave = window.confirm(
                `Cảnh báo tọa độ: Tọa độ (${lat.toFixed(6)}, ${lng.toFixed(6)}) có vẻ nằm ngoài ranh giới khuôn viên Thảo Cầm Viên Sài Gòn (vĩ độ ~10.787, kinh độ ~106.705).\\nBạn có chắc chắn muốn lưu điểm tham quan này không?`
            );
            if (!confirmSave) return;
        }

        setIsSaving(true);
        try {
            if (editingPoi) {"""

if old_save_start in pois_code:
    pois_code = pois_code.replace(old_save_start, new_save_start, 1)
    print("Added coordinate validation to AdminPoisPage.jsx")
else:
    print("Could not find old_save_start in AdminPoisPage.jsx")

# Leaflet invalidateSize in map effect
old_map_timer = """            mapInstanceRef.current = map;
            markerRef.current = marker;
        }, 150);"""

new_map_timer = """            mapInstanceRef.current = map;
            markerRef.current = marker;
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 250);
        }, 150);"""

if old_map_timer in pois_code:
    pois_code = pois_code.replace(old_map_timer, new_map_timer, 1)
    print("Added invalidateSize to map effect in AdminPoisPage.jsx")

# Safe deletion check in handleDeletePoi
old_del = """    const handleDeletePoi = async (poi) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa điểm tham quan "${poi.name}" (${poi.code})? Hành động này sẽ xóa cả các bài thuyết minh liên kết.`)) {
            return;
        }"""

new_del = """    const handleDeletePoi = async (poi) => {
        const narrCount = poi.narrationCount || 0;
        const msg = narrCount > 0
            ? `Điểm tham quan "${poi.name}" (${poi.code}) hiện có ${narrCount} bài thuyết minh liên kết.\\nBạn có chắc chắn muốn xóa không? Thao tác này sẽ xóa điểm và toàn bộ dữ liệu thuyết minh liên quan.`
            : `Bạn có chắc chắn muốn xóa điểm tham quan "${poi.name}" (${poi.code})? Thao tác này không thể hoàn tác.`;
        if (!window.confirm(msg)) {
            return;
        }"""

if old_del in pois_code:
    pois_code = pois_code.replace(old_del, new_del, 1)
    print("Added safe deletion confirm to AdminPoisPage.jsx")

# Edit POI Modal markup
old_edit_modal = """            {/* Modal: Create or Edit POI */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={() => !isSaving && setIsEditModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingPoi ? `Sửa Điểm Tham Quan: ${editingPoi.name}` : 'Thêm Mới Điểm Tham Quan (POI)'}
                            </h3>
                            <button 
                                type="button"
                                className="modal-close-btn"
                                onClick={() => !isSaving && setIsEditModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSavePoi}>"""

new_edit_modal = """            {/* Modal: Create or Edit POI */}
            {isEditModalOpen && (
                <div className="modal-overlay" style={{ zIndex: 1200 }} role="dialog" aria-modal="true">
                    <div className="modal-backdrop" onClick={() => !isSaving && setIsEditModalOpen(false)}></div>
                    <div className="modal-dialog" style={{ maxWidth: '780px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3 className="modal-title font-bold text-base">
                                {editingPoi ? `Sửa Điểm Tham Quan: ${editingPoi.name}` : 'Thêm Mới Điểm Tham Quan (POI)'}
                            </h3>
                            <button 
                                type="button"
                                className="btn btn-icon btn-sm"
                                onClick={() => !isSaving && setIsEditModalOpen(false)}
                                aria-label="Đóng"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '20px' }}>
                            <form onSubmit={handleSavePoi}>"""

if old_edit_modal in pois_code:
    pois_code = pois_code.replace(old_edit_modal, new_edit_modal, 1)
    # Also add closing div for modal-body
    old_edit_modal_end = """                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Đang lưu...' : (editingPoi ? 'Cập Nhật Điểm' : 'Tạo Điểm Mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}"""
    new_edit_modal_end = """                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Đang lưu...' : (editingPoi ? 'Cập Nhật Điểm' : 'Tạo Điểm Mới')}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}"""
    if old_edit_modal_end in pois_code:
        pois_code = pois_code.replace(old_edit_modal_end, new_edit_modal_end, 1)
        print("Updated edit POI modal in AdminPoisPage.jsx")

# Narration modal markup
old_narr_modal = """            {/* Modal: Manage Multilingual Narrations for POI */}
            {isNarrationModalOpen && selectedPoiForNarration && (
                <div className="modal-overlay" onClick={() => setIsNarrationModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '880px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    Thuyết Minh Đa Ngôn Ngữ: {selectedPoiForNarration.name}
                                </h3>
                                <span className="text-xs text-muted">
                                    Mã POI: <strong>{selectedPoiForNarration.code}</strong> • Phân loại: <strong>{selectedPoiForNarration.category}</strong>
                                </span>
                            </div>
                            <button 
                                type="button"
                                className="modal-close-btn"
                                onClick={() => setIsNarrationModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>"""

new_narr_modal = """            {/* Modal: Manage Multilingual Narrations for POI */}
            {isNarrationModalOpen && selectedPoiForNarration && (
                <div className="modal-overlay" style={{ zIndex: 1200 }} role="dialog" aria-modal="true">
                    <div className="modal-backdrop" onClick={() => setIsNarrationModalOpen(false)}></div>
                    <div className="modal-dialog" style={{ maxWidth: '880px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title font-bold text-base">
                                    Thuyết Minh Đa Ngôn Ngữ: {selectedPoiForNarration.name}
                                </h3>
                                <span className="text-xs text-muted">
                                    Mã POI: <strong>{selectedPoiForNarration.code}</strong> • Phân loại: <strong>{selectedPoiForNarration.category}</strong>
                                </span>
                            </div>
                            <button 
                                type="button"
                                className="btn btn-icon btn-sm"
                                onClick={() => setIsNarrationModalOpen(false)}
                                aria-label="Đóng"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '20px' }}>"""

if old_narr_modal in pois_code:
    pois_code = pois_code.replace(old_narr_modal, new_narr_modal, 1)
    old_narr_modal_end = """                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={isUploadingAudio}
                                >
                                    {isUploadingAudio ? 'Đang tải lên audio...' : (narrationForm.poiNarrationId ? 'Cập Nhật Thuyết Minh' : 'Lưu & Xuất Bản')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}"""
    new_narr_modal_end = """                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={isUploadingAudio}
                                >
                                    {isUploadingAudio ? 'Đang tải lên audio...' : (narrationForm.poiNarrationId ? 'Cập Nhật Thuyết Minh' : 'Lưu & Xuất Bản')}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}"""
    if old_narr_modal_end in pois_code:
        pois_code = pois_code.replace(old_narr_modal_end, new_narr_modal_end, 1)
        print("Updated narration modal in AdminPoisPage.jsx")

with open('web/src/pages/admin/AdminPoisPage.jsx', 'w', encoding='utf-8') as f:
    f.write(pois_code)

print("Saved AdminPoisPage.jsx")
