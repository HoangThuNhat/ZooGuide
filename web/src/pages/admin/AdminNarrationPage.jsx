import React, { useState, useEffect } from 'react';
import { MOCK_DB } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminNarrationPage() {
    const { showToast } = useApp();
    const [narrationsList, setNarrationsList] = useState([]);
    const [animals, setAnimals] = useState([]);

    const [narrationForm, setNarrationForm] = useState({
        animalId: 1,
        lang: 'vi',
        title: '',
        narrator: 'Chuyên gia Sinh học ZooGuide',
        summary: '',
        script: ''
    });

    const loadNarrations = () => {
        const items = [];
        for (const [id, narr] of Object.entries(MOCK_DB.narrations)) {
            const animal = MOCK_DB.animals.find(a => a.id === parseInt(id));
            if (narr.vi) items.push({ animal, lang: 'vi', data: narr.vi });
            if (narr.en) items.push({ animal, lang: 'en', data: narr.en });
        }
        setNarrationsList(items);
        setAnimals(MOCK_DB.animals);
    };

    useEffect(() => {
        loadNarrations();
    }, []);

    const handleNarrationSubmit = (e) => {
        e.preventDefault();
        const { animalId, lang, title, narrator, summary, script } = narrationForm;
        if (!title || !script) return;

        if (!MOCK_DB.narrations[animalId]) {
            MOCK_DB.narrations[animalId] = {};
        }

        const transcript = script.split('\n').filter(s => s.trim()).map((line, idx) => ({
            time: idx * 12,
            text: line.trim()
        }));

        MOCK_DB.narrations[animalId][lang] = {
            animalId: Number(animalId),
            title,
            narrator: narrator || "Cán bộ chuyên môn ZooGuide",
            durationSec: transcript.length * 12,
            durationFormatted: `${Math.floor((transcript.length * 12) / 60)}:${((transcript.length * 12) % 60).toString().padStart(2, '0')}`,
            summary,
            transcript
        };

        showToast("Đã lưu và xuất bản bài thuyết minh!", "success");
        setNarrationForm({
            animalId: 1,
            lang: 'vi',
            title: '',
            narrator: 'Chuyên gia Sinh học ZooGuide',
            summary: '',
            script: ''
        });
        loadNarrations();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Nội Dung Thuyết Minh (Audio Narration CMS)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Biên soạn lời thoại song ngữ Việt - Anh, đồng bộ mốc thời gian karaoke cho du khách nghe audio guide tự động.
                    </p>
                </div>
                <span className="chip font-bold">{narrationsList.length} bài đã biên tập</span>
            </div>

            <div className="ticket-page-layout">
                {/* Left: List of narrations */}
                <div>
                    <h3 className="font-bold text-base mb-3">Kho Bài Thuyết Minh Xuất Bản</h3>
                    <div className="flex flex-col gap-3">
                        {narrationsList.map((item, idx) => (
                            <div key={idx} className="narration-item-card">
                                <div className="narration-item-header">
                                    <div>
                                        <span className={`badge ${item.lang === 'vi' ? 'badge-primary' : 'badge-amber'} uppercase`}>
                                            {item.lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
                                        </span>
                                        <h4 className="font-bold text-sm mt-1">{item.data.title}</h4>
                                        <span className="text-xs text-muted">
                                            Động vật: <strong>{item.animal ? item.animal.nameVi : 'Unknown'}</strong> • Giọng đọc: {item.data.narrator}
                                        </span>
                                    </div>
                                    <span className="chip chip-sm font-mono">{item.data.durationFormatted}</span>
                                </div>
                                <p className="text-xs text-muted mt-2">{item.data.summary}</p>
                                <div className="mt-3 flex gap-2 items-center">
                                    <span className="text-xs text-success font-semibold">✓ Đã đồng bộ {item.data.transcript ? item.data.transcript.length : 0} câu thoại Karaoke</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Create/Edit Narration Form */}
                <div className="admin-card">
                    <h3 className="font-bold text-base mb-3">Biên Tập Bài Thuyết Minh Mới</h3>
                    <form onSubmit={handleNarrationSubmit}>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label" htmlFor="narration-select-animal">Chọn động vật</label>
                                <select 
                                    id="narration-select-animal" 
                                    className="form-select"
                                    value={narrationForm.animalId}
                                    onChange={(e) => setNarrationForm({ ...narrationForm, animalId: Number(e.target.value) })}
                                >
                                    {animals.map(a => (
                                        <option key={a.id} value={a.id}>{a.nameVi} (Khu {a.zoneCode})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="narration-select-lang">Ngôn ngữ</label>
                                <select 
                                    id="narration-select-lang" 
                                    className="form-select"
                                    value={narrationForm.lang}
                                    onChange={(e) => setNarrationForm({ ...narrationForm, lang: e.target.value })}
                                >
                                    <option value="vi">Tiếng Việt (VI)</option>
                                    <option value="en">English (EN)</option>
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
                        <div className="form-group">
                            <label className="form-label" htmlFor="narration-input-narrator">Người đọc / Chuyên gia</label>
                            <input 
                                type="text" 
                                id="narration-input-narrator" 
                                className="form-input" 
                                value={narrationForm.narrator}
                                onChange={(e) => setNarrationForm({ ...narrationForm, narrator: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="narration-input-summary">Tóm tắt nội dung</label>
                            <input 
                                type="text" 
                                id="narration-input-summary" 
                                className="form-input" 
                                placeholder="Tóm tắt 1 câu ngắn gọn..."
                                value={narrationForm.summary}
                                onChange={(e) => setNarrationForm({ ...narrationForm, summary: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="narration-input-script">Lời thoại (Mỗi đoạn 1 dòng để đồng bộ Karaoke)</label>
                            <textarea 
                                id="narration-input-script" 
                                className="form-textarea" 
                                rows="5" 
                                placeholder="Đoạn 1 chào mừng...&#10;Đoạn 2 thông tin sinh thái...&#10;Đoạn 3 câu chuyện bảo tồn..." 
                                required
                                value={narrationForm.script}
                                onChange={(e) => setNarrationForm({ ...narrationForm, script: e.target.value })}
                            ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
                            Lưu & Xuất Bản Thuyết Minh
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
