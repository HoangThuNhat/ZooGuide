import React, { useState, useEffect } from 'react';
import { MOCK_DB, ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminTab({ onPlaySample }) {
    const { showToast } = useApp();
    const [currentSubTab, setCurrentSubTab] = useState('tickets');
    const [healthLogs, setHealthLogs] = useState([]);
    const [narrationsList, setNarrationsList] = useState([]);

    // Form inputs for Health Log
    const [healthForm, setHealthForm] = useState({
        animalCode: 'ANI-001',
        veterinarian: 'BS. Trần Minh Quân',
        healthStatus: 'Rất tốt',
        weightKg: '215.5',
        temperatureC: '38.2',
        notes: '',
        actionRequired: ''
    });

    // Form inputs for Narration CMS
    const [narrationForm, setNarrationForm] = useState({
        animalId: 1,
        lang: 'vi',
        title: '',
        narrator: 'Chuyên gia Sinh học ZooGuide',
        summary: '',
        script: ''
    });

    const loadHealthLogs = async () => {
        const res = await ZooApi.getHealthLogs();
        if (res.success) {
            setHealthLogs(res.data);
        }
    };

    const loadNarrations = () => {
        const items = [];
        for (const [id, narr] of Object.entries(MOCK_DB.narrations)) {
            const animal = MOCK_DB.animals.find(a => a.id === parseInt(id));
            if (narr.vi) items.push({ animal, lang: 'vi', data: narr.vi });
            if (narr.en) items.push({ animal, lang: 'en', data: narr.en });
        }
        setNarrationsList(items);
    };

    useEffect(() => {
        loadHealthLogs();
        loadNarrations();
    }, []);

    const handleHealthSubmit = async (e) => {
        e.preventDefault();
        const animal = MOCK_DB.animals.find(a => a.code === healthForm.animalCode);
        const record = {
            animalCode: healthForm.animalCode,
            animalName: animal ? animal.nameVi : healthForm.animalCode,
            veterinarian: healthForm.veterinarian,
            weightKg: parseFloat(healthForm.weightKg) || 0,
            temperatureC: parseFloat(healthForm.temperatureC) || 38.0,
            healthStatus: healthForm.healthStatus,
            notes: healthForm.notes,
            actionRequired: healthForm.actionRequired
        };

        const res = await ZooApi.addHealthRecord(record);
        if (res.success) {
            showToast("Đã lưu nhật ký khám sức khỏe động vật!", "success");
            setHealthForm({
                animalCode: 'ANI-001',
                veterinarian: 'BS. Trần Minh Quân',
                healthStatus: 'Rất tốt',
                weightKg: '',
                temperatureC: '38.0',
                notes: '',
                actionRequired: ''
            });
            loadHealthLogs();
        }
    };

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

        showToast("Đã lưu nội dung thuyết minh thành công!", "success");
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

    const tickets = MOCK_DB.tickets;
    const areas = MOCK_DB.areas;
    const animals = MOCK_DB.animals;

    return (
        <section id="tab-pane-admin" className="tab-content-pane">
            <div className="admin-view-wrapper">
                {/* Sub-navigation */}
                <div className="admin-subnav" role="tablist">
                    <button 
                        className={`admin-nav-item ${currentSubTab === 'tickets' ? 'active' : ''}`}
                        onClick={() => setCurrentSubTab('tickets')}
                    >
                        Quản Lý Vé & Phiên
                    </button>
                    <button 
                        className={`admin-nav-item ${currentSubTab === 'enclosures' ? 'active' : ''}`}
                        onClick={() => setCurrentSubTab('enclosures')}
                    >
                        Khu Vực & Chuồng Trại
                    </button>
                    <button 
                        className={`admin-nav-item ${currentSubTab === 'health' ? 'active' : ''}`}
                        onClick={() => setCurrentSubTab('health')}
                    >
                        Sức Khỏe & Sinh Sản
                    </button>
                    <button 
                        className={`admin-nav-item ${currentSubTab === 'narrations' ? 'active' : ''}`}
                        onClick={() => setCurrentSubTab('narrations')}
                    >
                        Nội Dung Thuyết Minh
                    </button>
                </div>

                {/* Metrics Overview */}
                <div className="admin-metrics-row">
                    <div className="metric-card">
                        <span className="text-xs text-muted uppercase font-bold">Tổng vé phát hành</span>
                        <span className="metric-number" id="admin-metric-total-tickets">{tickets.length}</span>
                        <span className="text-xs text-success">Hệ thống đồng bộ API</span>
                    </div>
                    <div className="metric-card">
                        <span className="text-xs text-muted uppercase font-bold">Phiên tham quan mở</span>
                        <span className="metric-number" id="admin-metric-active-tickets">
                            {tickets.filter(t => t.status === 'Active').length}
                        </span>
                        <span className="text-xs text-info">Khách đang trong vườn thú</span>
                    </div>
                    <div className="metric-card">
                        <span className="text-xs text-muted uppercase font-bold">Chuồng trại kiểm định</span>
                        <span className="metric-number">5 / 5</span>
                        <span className="text-xs text-success">100% đạt chuẩn an toàn</span>
                    </div>
                    <div className="metric-card">
                        <span className="text-xs text-muted uppercase font-bold">Bài thuyết minh</span>
                        <span className="metric-number">{narrationsList.length}</span>
                        <span className="text-xs text-muted">Song ngữ Việt - Anh</span>
                    </div>
                </div>

                {/* SUBTAB 1: TICKETS */}
                {currentSubTab === 'tickets' && (
                    <div id="admin-pane-tickets" className="admin-subtab-pane">
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Mã vé</th>
                                        <th>Khách hàng</th>
                                        <th>Loại vé</th>
                                        <th>Hạn sử dụng</th>
                                        <th>Trạng thái</th>
                                        <th>Quyền Audio</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-tickets-table-body">
                                    {tickets.map(t => (
                                        <tr key={t.ticketCode}>
                                            <td className="font-mono font-bold">{t.ticketCode}</td>
                                            <td><strong>{t.customerName}</strong></td>
                                            <td>{t.ticketType}</td>
                                            <td>{t.validDate}</td>
                                            <td>
                                                <span className={`badge ${t.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="chip chip-sm">{t.hasAudioGuide ? 'Có Audio Guide' : 'Không'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SUBTAB 2: ENCLOSURES */}
                {currentSubTab === 'enclosures' && (
                    <div id="admin-pane-enclosures" className="admin-subtab-pane">
                        <div id="admin-enclosures-grid" className="animals-grid">
                            {areas.map(area => (
                                <div key={area.id} className="admin-card">
                                    <div className="admin-card-header" style={{ borderLeft: `4px solid ${area.color}` }}>
                                        <div>
                                            <span className="text-xs uppercase tracking-wider text-muted">Khu vực {area.code}</span>
                                            <h4 className="font-bold text-base">{area.nameVi}</h4>
                                        </div>
                                        <span className="badge badge-success">Vận hành tốt</span>
                                    </div>
                                    <div className="admin-card-body">
                                        <p className="text-sm text-muted mb-3">{area.descriptionVi}</p>
                                        <div className="admin-stat-row">
                                            <span>Số lượng loài hiện tại:</span>
                                            <strong>{area.animalCount} loài</strong>
                                        </div>
                                        <div className="admin-stat-row">
                                            <span>Tình trạng vệ sinh & an toàn:</span>
                                            <span className="text-success font-semibold">✓ Đã kiểm định sáng nay</span>
                                        </div>
                                        <div className="admin-stat-row">
                                            <span>Nhiệt độ môi trường:</span>
                                            <span>28°C • Độ ẩm 72%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SUBTAB 3: HEALTH & BREEDING */}
                {currentSubTab === 'health' && (
                    <div id="admin-pane-health" className="admin-subtab-pane">
                        <div className="ticket-page-layout">
                            {/* Left: Health Log Records */}
                            <div>
                                <h3 className="font-bold text-base mb-3">Nhật Ký Y Tế & Sinh Sản Gần Nhất</h3>
                                <div id="admin-health-logs-list">
                                    {healthLogs.map(log => (
                                        <div key={log.id} className="health-log-card">
                                            <div className="health-log-header">
                                                <div>
                                                    <h4 className="font-bold text-sm text-primary">
                                                        {log.animalName} <span className="font-mono text-muted text-xs">({log.animalCode})</span>
                                                    </h4>
                                                    <span className="text-xs text-muted">Ngày khám: {log.date} • Bác sĩ: {log.veterinarian}</span>
                                                </div>
                                                <span className="badge badge-info">{log.healthStatus}</span>
                                            </div>
                                            <div className="health-log-details">
                                                <div className="pill-stat">Cân nặng: <strong>{log.weightKg} kg</strong></div>
                                                <div className="pill-stat">Thân nhiệt: <strong>{log.temperatureC}°C</strong></div>
                                            </div>
                                            <p className="health-log-notes">📝 <strong>Ghi chú:</strong> {log.notes}</p>
                                            {log.actionRequired && (
                                                <p className="health-log-action">⚠️ <strong>Hành động:</strong> {log.actionRequired}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Add Health Log Form */}
                            <div className="admin-card">
                                <h3 className="font-bold text-base mb-3">Ghi Nhận Kiểm Tra Sức Khỏe Mới</h3>
                                <form id="admin-health-form" onSubmit={handleHealthSubmit}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="health-select-animal">Chọn động vật kiểm tra</label>
                                        <select 
                                            id="health-select-animal" 
                                            className="form-select" 
                                            required
                                            value={healthForm.animalCode}
                                            onChange={(e) => setHealthForm({ ...healthForm, animalCode: e.target.value })}
                                        >
                                            {animals.map(a => (
                                                <option key={a.code} value={a.code}>{a.nameVi} ({a.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="health-input-vet">Bác sĩ phụ trách</label>
                                            <input 
                                                type="text" 
                                                id="health-input-vet" 
                                                className="form-input" 
                                                required
                                                value={healthForm.veterinarian}
                                                onChange={(e) => setHealthForm({ ...healthForm, veterinarian: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="health-input-status">Tình trạng chung</label>
                                            <select 
                                                id="health-input-status" 
                                                className="form-select"
                                                value={healthForm.healthStatus}
                                                onChange={(e) => setHealthForm({ ...healthForm, healthStatus: e.target.value })}
                                            >
                                                <option value="Rất tốt">Rất tốt</option>
                                                <option value="Khỏe mạnh">Khỏe mạnh</option>
                                                <option value="Theo dõi định kỳ">Theo dõi định kỳ</option>
                                                <option value="Cần cách ly chăm sóc">Cần cách ly chăm sóc</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="health-input-weight">Cân nặng (kg)</label>
                                            <input 
                                                type="number" 
                                                step="0.1" 
                                                id="health-input-weight" 
                                                className="form-input" 
                                                placeholder="VD: 215.5" 
                                                required
                                                value={healthForm.weightKg}
                                                onChange={(e) => setHealthForm({ ...healthForm, weightKg: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="health-input-temp">Thân nhiệt (°C)</label>
                                            <input 
                                                type="number" 
                                                step="0.1" 
                                                id="health-input-temp" 
                                                className="form-input" 
                                                required
                                                value={healthForm.temperatureC}
                                                onChange={(e) => setHealthForm({ ...healthForm, temperatureC: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="health-input-notes">Ghi chú lâm sàng & chế độ ăn</label>
                                        <textarea 
                                            id="health-input-notes" 
                                            className="form-textarea" 
                                            rows="2" 
                                            placeholder="Ghi nhận hoạt động, ăn uống, móng răng..."
                                            value={healthForm.notes}
                                            onChange={(e) => setHealthForm({ ...healthForm, notes: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="health-input-action">Hành động y tế cần tiếp theo</label>
                                        <input 
                                            type="text" 
                                            id="health-input-action" 
                                            className="form-input" 
                                            placeholder="VD: Bổ sung canxi tuần tới"
                                            value={healthForm.actionRequired}
                                            onChange={(e) => setHealthForm({ ...healthForm, actionRequired: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
                                        Lưu Nhật Ký Sức Khỏe
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* SUBTAB 4: NARRATIONS CMS */}
                {currentSubTab === 'narrations' && (
                    <div id="admin-pane-narrations" className="admin-subtab-pane">
                        <div className="ticket-page-layout">
                            {/* Left: List of narrations */}
                            <div>
                                <h3 className="font-bold text-base mb-3">Kho Bài Thuyết Minh Hiện Có</h3>
                                <div id="admin-narrations-list" className="flex flex-col gap-3">
                                    {narrationsList.map((item, idx) => (
                                        <div key={idx} className="narration-item-card">
                                            <div className="narration-item-header">
                                                <div>
                                                    <span className={`badge ${item.lang === 'vi' ? 'badge-primary' : 'badge-amber'} uppercase`}>
                                                        {item.lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
                                                    </span>
                                                    <h4 className="font-bold text-sm mt-1">{item.data.title}</h4>
                                                    <span className="text-xs text-muted">
                                                        Động vật: {item.animal ? item.animal.nameVi : 'Unknown'} • Giọng đọc: {item.data.narrator}
                                                    </span>
                                                </div>
                                                <span className="chip chip-sm font-mono">{item.data.durationFormatted}</span>
                                            </div>
                                            <p className="text-xs text-muted mt-2">{item.data.summary}</p>
                                            <div className="mt-3 flex gap-2">
                                                <button 
                                                    className="btn btn-sm btn-outline btn-play-sample" 
                                                    onClick={() => {
                                                        if (onPlaySample) onPlaySample(item.animal ? item.animal.id : 1);
                                                    }}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                    </svg>
                                                    <span>Nghe thử</span>
                                                </button>
                                                <span className="text-xs text-muted flex items-center">✓ Đã duyệt xuất bản</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Create/Edit Narration Form */}
                            <div className="admin-card">
                                <h3 className="font-bold text-base mb-3">Thêm / Cập Nhật Thuyết Minh</h3>
                                <form id="admin-narration-form" onSubmit={handleNarrationSubmit}>
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
                                            placeholder="VD: Hổ Bengal Hoàng Gia" 
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
                                            placeholder="Tóm tắt 1 câu..."
                                            value={narrationForm.summary}
                                            onChange={(e) => setNarrationForm({ ...narrationForm, summary: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="narration-input-script">Lời thoại (Mỗi đoạn 1 dòng để đồng bộ Karaoke)</label>
                                        <textarea 
                                            id="narration-input-script" 
                                            className="form-textarea" 
                                            rows="4" 
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
                )}
            </div>
        </section>
    );
}
