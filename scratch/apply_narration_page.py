import os

admin_narration_content = """import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminNarrationPage() {
    const { showToast } = useApp();
    const [narrationsList, setNarrationsList] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [audioFile, setAudioFile] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedLangFilter, setSelectedLangFilter] = useState('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

    const initialForm = {
        animalId: 1,
        languageId: 1,
        title: '',
        narrator: 'Chuyên gia Sinh học ZooGuide',
        summary: '',
        content: '',
        audioUrl: '',
        durationSeconds: 120,
        status: 'Published'
    };

    const [narrationForm, setNarrationForm] = useState(initialForm);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [narrRes, animRes, langRes] = await Promise.all([
                ZooApi.getNarrations(),
                ZooApi.getAnimals(),
                ZooApi.getLanguages()
            ]);

            if (narrRes.success) setNarrationsList(narrRes.data || []);
            if (animRes.success && animRes.data?.length > 0) {
                setAnimals(animRes.data);
                if (!editingId) {
                    setNarrationForm(prev => ({
                        ...prev,
                        animalId: animRes.data[0].id || animRes.data[0].animalId || 1
                    }));
                }
            }
            if (langRes.success && langRes.data?.length > 0) {
                setLanguages(langRes.data);
                if (!editingId) {
                    setNarrationForm(prev => ({
                        ...prev,
                        languageId: langRes.data[0].languageId || 1
                    }));
                }
            }
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu thuyết minh:", err);
            showToast("Lỗi khi tải danh sách bài thuyết minh từ máy chủ", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenCreateModal = () => {
        setEditingId(null);
        setAudioFile(null);
        setNarrationForm({
            ...initialForm,
            animalId: animals[0]?.id || animals[0]?.animalId || 1,
            languageId: languages[0]?.languageId || 1
        });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (item) => {
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
        setIsFormModalOpen(true);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setAudioFile(null);
        setNarrationForm({
            ...initialForm,
            animalId: animals[0]?.id || animals[0]?.animalId || 1,
            languageId: languages[0]?.languageId || 1
        });
        setIsFormModalOpen(false);
    };

    const handleCloseModal = () => {
        if (isSubmitting) return;

        if (editingId) {
            const original = narrationsList.find(n => n.narrationId === editingId);
            const isChanged = original && (
                narrationForm.title !== (original.title || '') ||
                narrationForm.content !== (original.content || '') ||
                narrationForm.status !== (original.status || 'Published') ||
                Number(narrationForm.durationSeconds) !== Number(original.durationSeconds || 120) ||
                narrationForm.audioUrl !== (original.audioUrl || '') ||
                audioFile !== null
            );
            if (isChanged) {
                if (!window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thay đổi này?")) {
                    return;
                }
            }
        } else {
            const isDirty = narrationForm.title.trim() !== '' || narrationForm.content.trim() !== '' || audioFile !== null;
            if (isDirty) {
                if (!window.confirm("Dữ liệu bài thuyết minh đang nhập chưa được lưu. Bạn có chắc chắn muốn hủy?")) {
                    return;
                }
            }
        }
        cancelEdit();
    };

    // Body scroll lock & Escape key handling
    useEffect(() => {
        if (!isFormModalOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isSubmitting) {
                handleCloseModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFormModalOpen, isSubmitting, narrationForm, audioFile, editingId, narrationsList]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const { animalId, languageId, title, content, audioUrl, durationSeconds, status } = narrationForm;
        if (!title.trim() || !content.trim()) {
            showToast("Vui lòng điền đầy đủ tiêu đề và nội dung bài thuyết minh.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                const res = await ZooApi.updateNarration(editingId, {
                    title: title.trim(),
                    content: content.trim(),
                    audioUrl: audioUrl?.trim() || null,
                    durationSeconds: Number(durationSeconds) || 120,
                    status
                });

                if (res.success) {
                    if (audioFile) {
                        await ZooApi.uploadNarrationAudio(editingId, audioFile);
                    }
                    showToast("Cập nhật bài thuyết minh thành công!", "success");
                    cancelEdit();
                    loadData();
                } else {
                    showToast(res.error || "Không thể cập nhật bài thuyết minh", "error");
                }
            } else {
                const res = await ZooApi.createNarration({
                    animalId: Number(animalId),
                    languageId: Number(languageId),
                    title: title.trim(),
                    content: content.trim(),
                    audioUrl: audioUrl?.trim() || null,
                    durationSeconds: Number(durationSeconds) || 120,
                    status
                });

                if (res.success) {
                    const newId = res.data?.narrationId || res.data?.id;
                    if (newId && audioFile) {
                        await ZooApi.uploadNarrationAudio(newId, audioFile);
                    }
                    showToast("Thêm và xuất bản bài thuyết minh mới thành công!", "success");
                    cancelEdit();
                    loadData();
                } else {
                    showToast(res.error || "Không thể tạo bài thuyết minh mới", "error");
                }
            }
        } catch (err) {
            console.error("Lỗi khi lưu bài thuyết minh:", err);
            showToast("Lỗi kết nối khi gửi dữ liệu bài thuyết minh", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (item) => {
        const nextStatus = item.status === 'Published' ? 'Draft' : 'Published';
        try {
            const res = await ZooApi.updateNarrationStatus(item.narrationId, nextStatus);
            if (res.success) {
                showToast(`Đã chuyển trạng thái sang: ${nextStatus === 'Published' ? 'Đã xuất bản' : 'Bản nháp'}`, "info");
                loadData();
            } else {
                showToast(res.error || "Không thể cập nhật trạng thái", "error");
            }
        } catch {
            showToast("Lỗi khi cập nhật trạng thái bài thuyết minh", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài thuyết minh này? Thao tác này không thể hoàn tác.")) {
            return;
        }

        try {
            const res = await ZooApi.deleteNarration(id);
            if (res.success) {
                showToast("Đã xóa bài thuyết minh khỏi hệ thống", "info");
                if (editingId === id) cancelEdit();
                loadData();
            } else {
                showToast(res.error || "Không thể xóa bài thuyết minh", "error");
            }
        } catch {
            showToast("Lỗi máy chủ khi xóa bài thuyết minh", "error");
        }
    };

    const filteredNarrations = narrationsList.filter(item => {
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

    return (
        <div>
            {/* Header Toolbar */}
            <div className="admin-page-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Nội Dung Thuyết Minh (Audio Narration CMS)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Biên soạn lời thoại 12 ngôn ngữ chuẩn quốc tế, quản lý file âm thanh và trạng thái kiểm duyệt xuất bản.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button 
                        type="button" 
                        className="btn btn-sm btn-primary"
                        onClick={handleOpenCreateModal}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, padding: '8px 16px' }}
                    >
                        <span>＋</span> Thêm Bài Thuyết Minh
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={loadData} disabled={isLoading}>
                        {isLoading ? "Đang tải..." : "Làm mới"}
                    </button>
                    <span className="chip font-bold">
                        {filteredNarrations.length} / {narrationsList.length} bài biên tập
                    </span>
                </div>
            </div>

            {/* Responsive Filter Toolbar */}
            <div className="admin-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
                    <div>
                        <label className="form-label text-xs" style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Tìm kiếm bài thuyết minh</label>
                        <input 
                            type="text"
                            className="form-input"
                            placeholder="Tên loài động vật, tiêu đề bài..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="form-label text-xs" style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Lọc theo ngôn ngữ ({languages.length})</label>
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
                        <label className="form-label text-xs" style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Trạng thái phát hành</label>
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
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                            type="button" 
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

            {/* Main Content: Full-width Narration Card Grid */}
            <div className="admin-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h3 className="font-bold text-base m-0" style={{ color: '#0F172A' }}>
                            Kho Bài Thuyết Minh Động Vật ({filteredNarrations.length})
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                            Danh sách các bản thuyết minh đa ngôn ngữ được liên kết trực tiếp với các cá thể loài tại Thảo Cầm Viên.
                        </p>
                    </div>
                    <button 
                        type="button" 
                        className="btn btn-sm btn-primary"
                        onClick={handleOpenCreateModal}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    >
                        <span>＋</span> Thêm Bài Mới
                    </button>
                </div>

                {isLoading && narrationsList.length === 0 ? (
                    <div className="p-8 text-center text-muted" style={{ padding: '48px 16px' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
                        Đang tải kho bài thuyết minh từ máy chủ...
                    </div>
                ) : filteredNarrations.length === 0 ? (
                    <div className="text-center text-muted" style={{ padding: '48px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                        <div className="font-bold text-sm" style={{ color: '#475569' }}>Không tìm thấy bài thuyết minh nào</div>
                        <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '4px 0 16px 0' }}>
                            Hãy thử đổi từ khóa tìm kiếm hoặc lọc lại theo ngôn ngữ/trạng thái.
                        </p>
                        <button 
                            type="button" 
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                                setSearchKeyword('');
                                setSelectedLangFilter('all');
                                setSelectedStatusFilter('all');
                            }}
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
                        gap: '20px' 
                    }}>
                        {filteredNarrations.map((item) => (
                            <div key={item.narrationId} className="narration-item-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div className="narration-item-header" style={{ marginBottom: '12px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            <span className={`badge ${item.languageCode === 'vi' ? 'badge-primary' : 'badge-amber'} uppercase`}>
                                                {item.languageCode === 'vi' ? '🇻🇳 Tiếng Việt' : item.languageCode === 'en' ? '🇬🇧 English' : `${item.languageName || item.languageCode}`}
                                            </span>
                                            <span className={`badge ${item.status === 'Published' ? 'badge-success' : 'badge-info'} uppercase`}>
                                                {item.status === 'Published' ? 'Đã xuất bản' : 'Bản nháp'}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm" style={{ margin: '0 0 4px 0', color: '#0F172A', wordBreak: 'break-word', lineHeight: 1.4 }}>
                                            {item.title}
                                        </h4>
                                        <span className="text-xs text-muted" style={{ display: 'block' }}>
                                            Động vật: <strong style={{ color: '#1E293B' }}>{item.animalName || `Mã #${item.animalId}`}</strong> • Biên soạn: {item.creatorName || 'Cán bộ ZooGuide'}
                                        </span>
                                    </div>
                                    <span className="chip chip-sm font-mono" style={{ flexShrink: 0 }}>
                                        {item.durationFormatted || `${item.durationSeconds || 120}s`}
                                    </span>
                                </div>

                                <div style={{ flex: 1, marginBottom: '14px' }}>
                                    <p 
                                        className="text-xs text-muted" 
                                        style={{ 
                                            whiteSpace: 'pre-line', 
                                            margin: 0,
                                            lineHeight: 1.5,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 4,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}
                                        title={item.content}
                                    >
                                        {item.content}
                                    </p>
                                </div>

                                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: 'auto' }}>
                                    <div style={{ marginBottom: '10px', fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.audioUrl || "Mặc định hệ thống"}>
                                        <span>🎧</span>
                                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.audioUrl || "Mặc định hệ thống"}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-outline"
                                            onClick={() => handleToggleStatus(item)}
                                            title="Đổi trạng thái Xuất Bản / Nháp"
                                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                        >
                                            {item.status === 'Published' ? 'Hạ về Nháp' : 'Xuất bản'}
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-primary"
                                            onClick={() => handleEditClick(item)}
                                            style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                                        >
                                            Sửa
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-outline text-danger"
                                            style={{ borderColor: '#FCA5A5', color: '#DC2626', fontSize: '0.75rem', padding: '4px 10px' }}
                                            onClick={() => handleDelete(item.narrationId)}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal: Create or Edit Narration */}
            {isFormModalOpen && (
                <div 
                    className="modal-overlay" 
                    style={{ zIndex: 1250, padding: '16px' }} 
                    role="dialog" 
                    aria-modal="true"
                    aria-labelledby="narration-modal-title"
                >
                    <div 
                        className="modal-backdrop" 
                        onClick={handleCloseModal}
                    />
                    <div 
                        className="modal-dialog narration-modal-dialog" 
                        style={{
                            maxWidth: '760px',
                            width: '100%',
                            maxHeight: 'min(calc(100dvh - 32px), calc(100vh - 32px))',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            padding: 0,
                            borderRadius: '16px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            zIndex: 10
                        }}
                    >
                        <form 
                            id="narration-form" 
                            onSubmit={handleFormSubmit}
                            style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, margin: 0 }}
                        >
                            {/* 1. Fixed Header */}
                            <div 
                                className="modal-header" 
                                style={{ 
                                    flexShrink: 0, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    padding: '16px 24px',
                                    borderBottom: '1px solid var(--color-border, #E2E8F0)',
                                    background: '#FFFFFF'
                                }}
                            >
                                <div>
                                    <h3 id="narration-modal-title" className="modal-title font-bold text-base" style={{ margin: 0, color: '#0F172A' }}>
                                        {editingId ? "Chỉnh Sửa Bài Thuyết Minh" : "Biên Tập Bài Thuyết Minh Mới"}
                                    </h3>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                                        {editingId ? `Đang chỉnh sửa bài ID #${editingId}` : "Biên soạn thuyết minh động vật với chuẩn 12 ngôn ngữ và âm thanh"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-icon btn-sm"
                                    aria-label="Đóng"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                    style={{
                                        fontSize: '1.25rem',
                                        lineHeight: 1,
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '8px',
                                        border: '1px solid #E2E8F0',
                                        background: '#F8FAFC',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* 2. Scrollable Body */}
                            <div 
                                className="modal-body" 
                                style={{ 
                                    flex: 1, 
                                    overflowY: 'auto', 
                                    padding: '24px',
                                    background: '#FFFFFF'
                                }}
                            >
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label font-semibold" htmlFor="narration-select-animal">Chọn loài động vật</label>
                                        <select 
                                            id="narration-select-animal" 
                                            className="form-select"
                                            value={narrationForm.animalId}
                                            onChange={(e) => setNarrationForm({ ...narrationForm, animalId: Number(e.target.value) })}
                                            disabled={!!editingId}
                                        >
                                            {animals.map(a => (
                                                <option key={a.id || a.animalId} value={a.id || a.animalId}>
                                                    {a.nameVi || a.name} (Khu {a.zoneCode || a.areaId || 'A'})
                                                </option>
                                            ))}
                                        </select>
                                        {editingId && (
                                            <span className="text-xs text-muted" style={{ display: 'block', marginTop: '4px' }}>
                                                🔒 Động vật được cố định theo bài thuyết minh
                                            </span>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label font-semibold" htmlFor="narration-select-lang">Ngôn ngữ thuyết minh</label>
                                        <select 
                                            id="narration-select-lang" 
                                            className="form-select"
                                            value={narrationForm.languageId}
                                            onChange={(e) => setNarrationForm({ ...narrationForm, languageId: Number(e.target.value) })}
                                            disabled={!!editingId}
                                        >
                                            {languages.map(l => (
                                                <option key={l.languageId} value={l.languageId}>
                                                    {l.flagIcon || '🌐'} {l.nativeName || l.name} ({l.code?.toUpperCase()})
                                                </option>
                                            ))}
                                        </select>
                                        {editingId && (
                                            <span className="text-xs text-muted" style={{ display: 'block', marginTop: '4px' }}>
                                                🔒 Ngôn ngữ được cố định theo bản dịch này
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label font-semibold" htmlFor="narration-input-title">Tiêu đề bài thuyết minh <span style={{ color: '#DC2626' }}>*</span></label>
                                    <input 
                                        type="text" 
                                        id="narration-input-title" 
                                        className="form-input" 
                                        placeholder="VD: Hổ Bengal Hoàng Gia - Chúa Sơn Lâm" 
                                        required
                                        value={narrationForm.title}
                                        onChange={(e) => setNarrationForm({ ...narrationForm, title: e.target.value })}
                                    />
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label font-semibold" htmlFor="narration-input-duration">Thời lượng phát (giây)</label>
                                        <input 
                                            type="number" 
                                            id="narration-input-duration" 
                                            className="form-input" 
                                            min="10"
                                            max="3600"
                                            value={narrationForm.durationSeconds}
                                            onChange={(e) => setNarrationForm({ ...narrationForm, durationSeconds: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label font-semibold" htmlFor="narration-select-status">Trạng thái phát hành</label>
                                        <select 
                                            id="narration-select-status" 
                                            className="form-select"
                                            value={narrationForm.status}
                                            onChange={(e) => setNarrationForm({ ...narrationForm, status: e.target.value })}
                                        >
                                            <option value="Published">Xuất bản ngay (Published)</option>
                                            <option value="Draft">Lưu bản nháp (Draft)</option>
                                            <option value="Archived">Lưu trữ (Archived)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label font-semibold" htmlFor="narration-input-audio">
                                        Tệp âm thanh thuyết minh (Tải lên file hoặc chỉ định URL)
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input 
                                            type="file" 
                                            id="narration-file-upload" 
                                            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac" 
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setAudioFile(file);
                                                    setNarrationForm(prev => ({ ...prev, audioUrl: file.name }));
                                                }
                                            }}
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-outline" 
                                            onClick={() => document.getElementById('narration-file-upload').click()}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <span>📁</span> Chọn file âm thanh (.mp3, .wav)
                                        </button>
                                        {audioFile && (
                                            <span className="text-xs text-success" style={{ fontWeight: 600, background: '#DCFCE7', padding: '4px 10px', borderRadius: '6px' }}>
                                                ✓ Đã chọn: {audioFile.name} ({(audioFile.size / 1024).toFixed(0)} KB)
                                            </span>
                                        )}
                                    </div>
                                    <input 
                                        type="text" 
                                        id="narration-input-audio" 
                                        className="form-input" 
                                        placeholder="Hoặc nhập đường dẫn audio: /assets/audio/tiger_vi.mp3" 
                                        value={narrationForm.audioUrl}
                                        onChange={(e) => setNarrationForm({ ...narrationForm, audioUrl: e.target.value })}
                                    />
                                    <span className="text-xs text-muted" style={{ display: 'block', marginTop: '4px' }}>
                                        💡 File âm thanh sẽ được lưu trữ và đồng bộ cùng bài thuyết minh trên hệ thống phát thanh tự động.
                                    </span>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <label className="form-label font-semibold" htmlFor="narration-input-script" style={{ margin: 0 }}>
                                            Toàn văn nội dung bài thuyết minh <span style={{ color: '#DC2626' }}>*</span>
                                        </label>
                                        <span className="text-xs text-muted font-mono">
                                            {narrationForm.content.length} ký tự
                                        </span>
                                    </div>
                                    <textarea 
                                        id="narration-input-script" 
                                        className="form-textarea" 
                                        rows="8" 
                                        placeholder="Nhập toàn bộ nội dung thuyết minh chi tiết: nguồn gốc, phân loại sinh học, tập tính sinh thái, môi trường sống, khẩu phần dinh dưỡng và công tác bảo tồn..." 
                                        required
                                        value={narrationForm.content}
                                        onChange={(e) => setNarrationForm({ ...narrationForm, content: e.target.value })}
                                        style={{ minHeight: '180px', lineHeight: 1.6 }}
                                    ></textarea>
                                </div>
                            </div>

                            {/* 3. Fixed Footer */}
                            <div 
                                className="modal-footer" 
                                style={{ 
                                    flexShrink: 0, 
                                    display: 'flex', 
                                    justifyContent: 'flex-end', 
                                    gap: '12px',
                                    padding: '16px 24px',
                                    borderTop: '1px solid var(--color-border, #E2E8F0)',
                                    background: '#F8FAFC'
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Hủy Bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary font-bold"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Đang xử lý..." : editingId ? "Cập Nhật Bài Thuyết Minh" : "Lưu & Xuất Bản Thuyết Minh"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
"""

dest_path = r"C:\Users\admin\Desktop\Study\Công nghệ phần mềm\ZooGuide\web\src\pages\admin\AdminNarrationPage.jsx"
with open(dest_path, "w", encoding="utf-8") as f:
    f.write(admin_narration_content.strip() + "\n")

print(f"Successfully wrote {len(admin_narration_content)} chars to {dest_path}")
