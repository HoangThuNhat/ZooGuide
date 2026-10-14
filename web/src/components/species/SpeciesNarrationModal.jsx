import React, { useState, useEffect } from 'react';
import { ZooApi, MOCK_DB } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function SpeciesNarrationModal({ 
    species, 
    isOpen, 
    onClose, 
    onPlayAudio, 
    onNavigateMap 
}) {
    const { 
        currentLang, 
        setLanguage, 
        audioState, 
        setAudioState,
        hasActiveSession,
        currentSession,
        setIsTicketModalOpen,
        showToast
    } = useApp();

    const [selectedLang, setSelectedLang] = useState(currentLang || 'vi');
    const [narration, setNarration] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sync selectedLang when currentLang changes
    useEffect(() => {
        if (currentLang) setSelectedLang(currentLang);
    }, [currentLang]);

    // Load narration data whenever species or selectedLang changes
    useEffect(() => {
        if (!isOpen || !species) return;

        let isMounted = true;
        async function fetchNarration() {
            setLoading(true);
            try {
                if (!hasActiveSession || !currentSession?.sessionId) {
                    if (isMounted) {
                        setNarration(null);
                        setLoading(false);
                    }
                    return;
                }
                const res = await ZooApi.getSpeciesNarration(species.id, selectedLang, currentSession.sessionId);
                if (isMounted && res.success) {
                    setNarration(res.data);
                } else if (isMounted) {
                    setNarration(null);
                }
            } catch (err) {
                console.error("Error fetching species narration:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchNarration();
        return () => { isMounted = false; };
    }, [isOpen, species, selectedLang, hasActiveSession, currentSession]);

    if (!isOpen || !species) return null;

    // Check if currently playing this species narration
    const isCurrentlyPlayingThis = 
        audioState.isVisible && 
        audioState.isPlaying && 
        audioState.narration && 
        (audioState.narration.speciesId === species.id || (audioState.animal && audioState.animal.speciesId === species.id));

    // Constituent animals
    const constituentAnimals = MOCK_DB.animals.filter(a => a.speciesId === species.id);

    // Helper for IUCN tag color
    const getIucnColor = (status) => {
        if (!status) return '#64748B';
        const s = status.toUpperCase();
        if (s.includes('CR')) return '#DC2626';
        if (s.includes('EN')) return '#EA580C';
        if (s.includes('VU')) return '#D97706';
        if (s.includes('NT')) return '#65A30D';
        if (s.includes('LC')) return '#16A34A';
        return '#0284C7';
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleLanguageChange = (lang) => {
        setSelectedLang(lang);
        setLanguage(lang);
    };

    const handlePlayClick = () => {
        if (!hasActiveSession) {
            showToast("Vui lòng kích hoạt vé tham quan hợp lệ để sử dụng chức năng thuyết minh.", "error");
            setIsTicketModalOpen(true);
            return;
        }
        if (onPlayAudio) {
            onPlayAudio(species.id, true, selectedLang);
        }
    };

    return (
        <div id="species-narration-modal" className="modal-overlay" role="dialog" aria-modal="true" style={{ zIndex: 1200 }}>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-dialog" style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Header */}
                <div className="modal-header" style={{ alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <img 
                            src={species.imageUrl || "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800"} 
                            alt={species.nameVi}
                            style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #E2E8F0' }}
                        />
                        <div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
                                <span 
                                    className="badge" 
                                    style={{ 
                                        backgroundColor: `${getIucnColor(species.conservationStatus)}18`, 
                                        color: getIucnColor(species.conservationStatus),
                                        fontWeight: '700',
                                        fontSize: '0.72rem'
                                    }}
                                >
                                    {species.conservationStatus || "Ít quan tâm"}
                                </span>
                                {constituentAnimals.length > 0 && (
                                    <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.72rem' }}>
                                        {constituentAnimals.length} cá thể tại sở thú
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-lg" style={{ margin: 0 }}>
                                {species.nameVi}
                            </h3>
                            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.85rem', color: '#64748B' }}>
                                {species.nameEn || species.scientificName}
                            </p>
                        </div>
                    </div>

                    <button 
                        id="btn-close-species-narration" 
                        className="btn btn-icon btn-sm" 
                        aria-label="Đóng"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body" style={{ paddingTop: '12px' }}>
                    {/* Species Description */}
                    <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.5', marginBottom: '14px', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px' }}>
                        {species.description || "Loài động vật đặc sắc đang được bảo tồn và chăm sóc tự nhiên tại sở thú ZooGuide."}
                    </div>

                    {/* Constituent Animals */}
                    {constituentAnimals.length > 0 && (
                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
                                🐾 Các cá thể thuộc loài:
                            </span>
                            {constituentAnimals.map(a => (
                                <span 
                                    key={a.id} 
                                    style={{ 
                                        backgroundColor: '#EFF6FF', 
                                        color: '#1D4ED8', 
                                        padding: '3px 8px', 
                                        borderRadius: '6px', 
                                        fontSize: '0.78rem', 
                                        fontWeight: '600' 
                                    }}
                                >
                                    {a.nameVi} ({a.code})
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Step 2: Language Selector */}
                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1E293B' }}>
                                🌐 Ngôn ngữ thuyết minh (Language):
                            </label>
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Chọn ngôn ngữ để đổi giọng đọc & nội dung</span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                className={`btn btn-sm ${selectedLang === 'vi' ? 'btn-primary' : 'btn-outline'}`}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                onClick={() => handleLanguageChange('vi')}
                            >
                                <span>🇻🇳</span>
                                <strong>Tiếng Việt</strong>
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${selectedLang === 'en' ? 'btn-primary' : 'btn-outline'}`}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                onClick={() => handleLanguageChange('en')}
                            >
                                <span>🇬🇧</span>
                                <strong>English</strong>
                            </button>
                        </div>
                    </div>

                    {/* Step 3 & 4: Narration Content & Audio Player */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748B' }}>
                            Đang tải bài thuyết minh cho loài {species.nameVi}...
                        </div>
                    ) : narration ? (
                        <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                            {/* Narration Title & Narrator */}
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#166534', fontWeight: '700' }}>
                                        {narration.title}
                                    </h4>
                                    <span style={{ fontSize: '0.78rem', color: '#15803D', fontWeight: '600', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' }}>
                                        ⏱ {narration.durationFormatted || '01:30'}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#15803D' }}>
                                    Giọng đọc: <strong>{narration.narrator}</strong>
                                </p>
                            </div>

                            {/* Narration Summary */}
                            <div style={{ fontSize: '0.85rem', color: '#14532D', marginBottom: '14px', lineHeight: '1.45' }}>
                                {narration.summary}
                            </div>

                            {/* Play Button Action */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    style={{ flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem' }}
                                    onClick={handlePlayClick}
                                >
                                    {isCurrentlyPlayingThis ? (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16"></rect>
                                                <rect x="14" y="4" width="4" height="16"></rect>
                                            </svg>
                                            <span>Đang phát • Bấm để nghe lại từ đầu</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                            </svg>
                                            <span>▶ Phát Thuyết Minh ({selectedLang === 'en' ? 'English' : 'Tiếng Việt'})</span>
                                        </>
                                    )}
                                </button>

                                {onNavigateMap && (
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        style={{ padding: '10px 14px' }}
                                        title="Dẫn đường tới khu vực loài này trên bản đồ"
                                        onClick={() => {
                                            onClose();
                                            onNavigateMap(species);
                                        }}
                                    >
                                        🗺 Bản đồ
                                    </button>
                                )}
                            </div>

                            {/* Transcript Preview */}
                            {narration.transcript && narration.transcript.length > 0 && (
                                <div>
                                    <h5 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#166534', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        📜 Lời thoại thuyết minh:
                                    </h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                                        {narration.transcript.map((line, idx) => (
                                            <div 
                                                key={idx} 
                                                style={{ 
                                                    display: 'flex', 
                                                    gap: '10px', 
                                                    fontSize: '0.8rem', 
                                                    color: '#1E293B', 
                                                    backgroundColor: '#FFFFFF', 
                                                    padding: '6px 10px', 
                                                    borderRadius: '6px',
                                                    border: '1px solid #E2E8F0' 
                                                }}
                                            >
                                                <span style={{ fontWeight: '700', color: '#15803D', minWidth: '40px', fontFamily: 'monospace' }}>
                                                    {formatTime(line.time)}
                                                </span>
                                                <span style={{ flex: 1 }}>{line.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : !hasActiveSession ? (
                        <div style={{ textAlign: 'center', padding: '24px 16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', margin: '0 0 6px 0' }}>
                                Tính Năng Thuyết Minh Yêu Cầu Vé Tham Quan
                            </h4>
                            <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0 0 16px 0' }}>
                                Vui lòng kích hoạt vé tham quan hợp lệ để sử dụng chức năng thuyết minh.
                            </p>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                    onClose();
                                    setIsTicketModalOpen(true);
                                }}
                            >
                                🎟️ Kích hoạt vé tham quan
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '16px', color: '#EF4444' }}>
                            Không tìm thấy nội dung thuyết minh cho loài này.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
