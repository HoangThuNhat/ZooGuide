with open('web/src/pages/admin/AdminNarrationPage.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('\r\n', '\n')

# 1. Add filter states
old_states = """    const [editingId, setEditingId] = useState(null);
    const [audioFile, setAudioFile] = useState(null);"""

new_states = """    const [editingId, setEditingId] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedLangFilter, setSelectedLangFilter] = useState('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');"""

code = code.replace(old_states, new_states, 1)

# 2. Fix handleEditClick language resolution
old_edit_click = """    const handleEditClick = (item) => {
        setEditingId(item.narrationId);
        setAudioFile(null);
        setNarrationForm({
            animalId: item.animalId,
            languageId: item.languageId || (item.languageCode === 'en' ? 2 : 1),
            title: item.title,
            narrator: item.creatorName || 'Cán bộ chuyên môn',
            summary: item.title,
            content: item.content,
            audioUrl: item.audioUrl || '',
            durationSeconds: item.durationSeconds || 120,
            status: item.status || 'Published'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };"""

new_edit_click = """    const handleEditClick = (item) => {
        setEditingId(item.narrationId);
        setAudioFile(null);

        // Chuẩn hóa và ánh xạ chính xác LanguageId cho cả 12 ngôn ngữ
        let matchedLangId = item.languageId;
        if (!matchedLangId || !languages.some(l => Number(l.languageId) === Number(matchedLangId))) {
            const found = languages.find(l => l.code?.toLowerCase() === item.languageCode?.toLowerCase());
            matchedLangId = found ? found.languageId : (languages[0]?.languageId || 1);
        }

        setNarrationForm({
            animalId: item.animalId,
            languageId: matchedLangId,
            title: item.title || '',
            narrator: item.creatorName || 'Cán bộ chuyên môn',
            summary: item.title || '',
            content: item.content || '',
            audioUrl: item.audioUrl || '',
            durationSeconds: item.durationSeconds || 120,
            status: item.status || 'Published'
        });

        // Tự động cuộn tới khung biên tập
        const editorCard = document.getElementById('narration-editor-card');
        if (editorCard) {
            editorCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };"""

code = code.replace(old_edit_click, new_edit_click, 1)

# 3. Add filteredNarrations logic right before return
old_ret = "    return ("
new_ret = """    const filteredNarrations = narrationsList.filter(item => {
        if (searchKeyword.trim()) {
            const q = searchKeyword.trim().toLowerCase();
            const matchTitle = (item.title || '').toLowerCase().includes(q);
            const matchContent = (item.content || '').toLowerCase().includes(q);
            const matchAnimal = (item.animalName || '').toLowerCase().includes(q);
            if (!matchTitle && !matchContent && !matchAnimal) return false;
        }
        if (selectedLangFilter !== 'all') {
            if ((item.languageCode || '').toLowerCase() !== selectedLangFilter.toLowerCase()) return false;
        }
        if (selectedStatusFilter !== 'all') {
            if (item.status !== selectedStatusFilter) return false;
        }
        return true;
    });

    return ("""

code = code.replace(old_ret, new_ret, 1)

# 4. Update header subtitle and dynamic count
old_hdr = """                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Biên soạn lời thoại đa ngôn ngữ (Việt, Anh, Trung, Nhật), quản lý âm thanh và trạng thái kiểm duyệt xuất bản.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-outline" onClick={loadData} disabled={isLoading}>
                        {isLoading ? "Đang tải..." : "Làm mới"}
                    </button>
                    <span className="chip font-bold">{narrationsList.length} bài biên tập</span>
                </div>"""

new_hdr = """                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Biên soạn lời thoại 12 ngôn ngữ chuẩn quốc tế, quản lý file âm thanh và trạng thái kiểm duyệt xuất bản.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-outline" onClick={loadData} disabled={isLoading}>
                        {isLoading ? "Đang tải..." : "Làm mới"}
                    </button>
                    <span className="chip font-bold">
                        {filteredNarrations.length} / {narrationsList.length} bài biên tập
                    </span>
                </div>"""

code = code.replace(old_hdr, new_hdr, 1)

# 5. Replace layout and left list
old_layout = """            <div className="ticket-page-layout">
                {/* Left: List of narrations */}
                <div>
                    <h3 className="font-bold text-base mb-3">Kho Bài Thuyết Minh Hệ Thống</h3>
                    {isLoading && narrationsList.length === 0 ? (
                        <div className="p-6 text-center text-muted">Đang tải kho thuyết minh từ máy chủ...</div>
                    ) : narrationsList.length === 0 ? (
                        <div className="admin-card text-center text-muted p-6">
                            Chưa có bài thuyết minh nào được biên soạn. Hãy tạo bài đầu tiên ở form bên phải!
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {narrationsList.map((item) => ("""

new_layout = """            {/* Responsive Filter Toolbar */}
            <div className="admin-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
                    <div>
                        <label className="form-label text-xs">Tìm kiếm bài thuyết minh</label>
                        <input 
                            type="text"
                            className="form-input"
                            placeholder="Tên loài động vật, tiêu đề bài..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="form-label text-xs">Lọc theo ngôn ngữ ({languages.length})</label>
                        <select 
                            className="form-select"
                            value={selectedLangFilter}
                            onChange={(e) => setSelectedLangFilter(e.target.value)}
                        >
                            <option value="all">Tất cả 12 ngôn ngữ</option>
                            {languages.map(l => (
                                <option key={l.languageId} value={l.code}>
                                    {l.flagIcon || '🌐'} {l.nativeName || l.name} ({l.code?.toUpperCase()})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="form-label text-xs">Trạng thái phát hành</label>
                        <select 
                            className="form-select"
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="Published">Đã xuất bản (Published)</option>
                            <option value="Draft">Bản nháp (Draft)</option>
                            <option value="Archived">Lưu trữ (Archived)</option>
                        </select>
                    </div>
                </div>

                {(searchKeyword || selectedLangFilter !== 'all' || selectedStatusFilter !== 'all') && (
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                                setSearchKeyword('');
                                setSelectedLangFilter('all');
                                setSelectedStatusFilter('all');
                            }}
                        >
                            Đặt lại bộ lọc
                        </button>
                    </div>
                )}
            </div>

            <div className="admin-narration-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
                {/* Left: List of narrations */}
                <div>
                    <h3 className="font-bold text-base mb-3">
                        Kho Bài Thuyết Minh ({filteredNarrations.length})
                    </h3>
                    {isLoading && narrationsList.length === 0 ? (
                        <div className="p-6 text-center text-muted">Đang tải kho thuyết minh từ máy chủ...</div>
                    ) : filteredNarrations.length === 0 ? (
                        <div className="admin-card text-center text-muted p-6">
                            Không tìm thấy bài thuyết minh nào phù hợp với bộ lọc đã chọn.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {filteredNarrations.map((item) => ("""

code = code.replace(old_layout, new_layout, 1)

# 6. Update editor card id and sticky style
old_editor_card = """                {/* Right: Create/Edit Narration Form */}
                <div className="admin-card">"""

new_editor_card = """                {/* Right: Create/Edit Narration Form */}
                <div id="narration-editor-card" className="admin-card" style={{ position: 'sticky', top: '16px', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto' }}>"""

code = code.replace(old_editor_card, new_editor_card, 1)

# 7. Update language dropdown options in form to show flags and nativeName
old_lang_opt = """                                    {languages.map(l => (
                                        <option key={l.languageId} value={l.languageId}>
                                            {l.name} ({l.code?.toUpperCase()})
                                        </option>
                                    ))}"""

new_lang_opt = """                                    {languages.map(l => (
                                        <option key={l.languageId} value={l.languageId}>
                                            {l.flagIcon || '🌐'} {l.nativeName || l.name} ({l.code?.toUpperCase()})
                                        </option>
                                    ))}"""

code = code.replace(old_lang_opt, new_lang_opt, 1)

with open('web/src/pages/admin/AdminNarrationPage.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Saved AdminNarrationPage.jsx")
