with open('web/src/pages/admin/AdminPoisPage.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update modal-content -> modal-dialog with modal-backdrop and modal-body
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

print("old_edit_modal in text?", old_edit_modal.replace('\r\n', '\n') in text.replace('\r\n', '\n'))
