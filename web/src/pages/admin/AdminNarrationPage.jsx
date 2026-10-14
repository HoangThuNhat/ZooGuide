import React, { useState, useEffect } from 'react';
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
    const [audioFile, setAudioFile] = useState(null);

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

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const { animalId, languageId, title, content, audioUrl, durationSeconds, status } = narrationForm;
        if (!title.trim() || !content.trim()) {
            showToast("Vui lòng điền đầy đủ tiêu đề và nội dung thuyết minh.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                const res = await ZooApi.updateNarration(editingId, {
                    title,
                    content,
                    audioUrl: audioUrl || `/assets/audio/narration_${animalId}.mp3`,
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
                    title,
                    content,
                    audioUrl: audioUrl || `/assets/audio/narration_${animalId}.mp3`,
                    durationSeconds: Number(durationSeconds) || 120,
                    status
                });

                if (res.success) {
                    const newId = res.data?.narrationId || res.data?.id;
                    if (newId && audioFile) {
                        await ZooApi.uploadNarrationAudio(newId, audioFile);
                    }
                    showToast("Thêm và xuất bản bài thuyết minh mới thành công!", "success");
                    setNarrationForm(prev => ({
                        ...initialForm,
                        animalId: prev.animalId,
                        languageId: prev.languageId
                    }));
                    setAudioFile(null);
                    loadData();
                } else {
                    showToast(res.error || "Không thể tạo bài thuyết minh", "error");
                }
            }
        } catch (err) {
            showToast("Lỗi kết nối khi gửi dữ liệu bài thuyết minh", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (item) => {
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
    };

    const cancelEdit = () => {
        setEditingId(null);
        setAudioFile(null);
        setNarrationForm({
            ...initialForm,
            animalId: animals[0]?.id || 1,
            languageId: languages[0]?.languageId || 1
        });
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

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Nội Dung Thuyết Minh (Audio Narration CMS)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Biên soạn lời thoại đa ngôn ngữ (Việt, Anh, Trung, Nhật), quản lý âm thanh và trạng thái kiểm duyệt xuất bản.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="btn btn-sm btn-outline" onClick={loadData} disabled={isLoading}>
                        {isLoading ? "Đang tải..." : "🔄 Làm mới"}
                    </button>
                    <span className="chip font-bold">{narrationsList.length} bài biên tập</span>
                </div>
            </div>

            <div className="ticket-page-layout">
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
                            {narrationsList.map((item) => (
                                <div key={item.narrationId} className="narration-item-card">
                                    <div className="narration-item-header">
                                        <div>
                                            <span className={`badge ${item.languageCode === 'vi' ? 'badge-primary' : 'badge-amber'} uppercase`}>
                                                {item.languageCode === 'vi' ? '🇻🇳 Tiếng Việt' : item.languageCode === 'en' ? '🇬🇧 English' : item.languageName || item.languageCode}
                                            </span>
                                            <span className={`badge ${item.status === 'Published' ? 'badge-success' : 'badge-info'} uppercase ml-2`}>
                                                {item.status === 'Published' ? 'Đã xuất bản' : 'Bản nháp'}
                                            </span>
                                            <h4 className="font-bold text-sm mt-1">{item.title}</h4>
                                            <span className="text-xs text-muted">
                                                Động vật: <strong>{item.animalName || `Mã #${item.animalId}`}</strong> • Người biên soạn: {item.creatorName || 'Cán bộ ZooGuide'}
                                            </span>
                                        </div>
                                        <span className="chip chip-sm font-mono">
                                            {item.durationFormatted || `${item.durationSeconds || 120}s`}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted mt-2" style={{ whiteSpace: 'pre-line', maxHeight: '90px', overflow: 'hidden' }}>
                                        {item.content}
                                    </p>
                                    <div className="mt-3 flex gap-2 items-center justify-between">
                                        <span className="text-xs text-success font-semibold">
                                            🎧 File Audio: {item.audioUrl || "Mặc định hệ thống"}
                                        </span>
                                        <div className="flex gap-2">
                                            <button 
                                                className="btn btn-sm btn-outline"
                                                onClick={() => handleToggleStatus(item)}
                                                title="Đổi trạng thái Xuất Bản / Nháp"
                                            >
                                                {item.status === 'Published' ? 'Hạ về Nháp' : 'Xuất bản ngay'}
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline"
                                                onClick={() => handleEditClick(item)}
                                            >
                                                Sửa
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline text-danger"
                                                style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
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

                {/* Right: Create/Edit Narration Form */}
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 className="font-bold text-base m-0">
                            {editingId ? "Chỉnh Sửa Bài Thuyết Minh" : "Biên Tập Bài Thuyết Minh Mới"}
                        </h3>
                        {editingId && (
                            <button className="btn btn-sm btn-outline" onClick={cancelEdit}>
                                Hủy sửa
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleFormSubmit}>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label" htmlFor="narration-select-animal">Chọn động vật</label>
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
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="narration-select-lang">Ngôn ngữ</label>
                                <select 
                                    id="narration-select-lang" 
                                    className="form-select"
                                    value={narrationForm.languageId}
                                    onChange={(e) => setNarrationForm({ ...narrationForm, languageId: Number(e.target.value) })}
                                    disabled={!!editingId}
                                >
                                    {languages.map(l => (
                                        <option key={l.languageId} value={l.languageId}>
                                            {l.name} ({l.code?.toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="narration-input-title">Tiêu đề bài thuyết minh</label>
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
                                <label className="form-label" htmlFor="narration-input-duration">Thời lượng (giây)</label>
                                <input 
                                    type="number" 
                                    id="narration-input-duration" 
                                    className="form-input" 
                                    value={narrationForm.durationSeconds}
                                    onChange={(e) => setNarrationForm({ ...narrationForm, durationSeconds: Number(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="narration-select-status">Trạng thái xuất bản</label>
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
                            <label className="form-label" htmlFor="narration-input-audio">
                                File âm thanh thuyết minh (Tải file thực tế hoặc nhập URL)
                            </label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                                >
                                    📁 Tải file âm thanh (.mp3, .wav)
                                </button>
                                {audioFile && (
                                    <span className="text-xs text-success" style={{ fontWeight: 600 }}>
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
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="narration-input-script">Toàn văn nội dung thuyết minh</label>
                            <textarea 
                                id="narration-input-script" 
                                className="form-textarea" 
                                rows="6" 
                                placeholder="Nhập đầy đủ bài thuyết minh về tập tính, phân bố, sinh cảnh và tình trạng bảo tồn của con vật..." 
                                required
                                value={narrationForm.content}
                                onChange={(e) => setNarrationForm({ ...narrationForm, content: e.target.value })}
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary w-full" 
                            style={{ width: '100%' }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Đang xử lý..." : editingId ? "Cập Nhật Bài Thuyết Minh" : "Lưu & Xuất Bản Thuyết Minh"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
