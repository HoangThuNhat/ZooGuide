import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
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
        supportedLanguages,
        audioState,
        hasActiveSession,
        currentSession,
        setIsTicketModalOpen,
        switchTab,
        showToast,
        t
    } = useApp();

    const [selectedLang, setSelectedLang] = useState(currentLang || 'vi');
    const [narration, setNarration] = useState(null);
    const [narrationError, setNarrationError] = useState('');
    const [constituentAnimals, setConstituentAnimals] = useState([]);
    const [localizedSpecies, setLocalizedSpecies] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentLang) setSelectedLang(currentLang);
    }, [currentLang]);

    useEffect(() => {
        if (!isOpen || !species) return;

        let isMounted = true;
        async function fetchSpeciesDetailsAndNarration() {
            setLoading(true);
            setNarrationError('');
            try {
                // Fetch localized species & resident animals from Supabase
                const [spRes, animRes] = await Promise.all([
                    ZooApi.getSpecies({ lang: selectedLang }),
                    ZooApi.getAnimals({ speciesId: species.id, lang: selectedLang })
                ]);

                if (isMounted) {
                    if (spRes.success && Array.isArray(spRes.data)) {
                        const foundSp = spRes.data.find(s => Number(s.id) === Number(species.id));
                        if (foundSp) setLocalizedSpecies(foundSp);
                        else setLocalizedSpecies(species);
                    } else {
                        setLocalizedSpecies(species);
                    }
                    if (animRes.success) {
                        setConstituentAnimals(animRes.data || []);
                    }
                }

                if (!hasActiveSession || !currentSession?.sessionId) {
                    if (isMounted) {
                        setNarration(null);
                        setLoading(false);
                    }
                    return;
                }

                const res = await ZooApi.getSpeciesNarration(species.id, selectedLang, currentSession.sessionId);
                if (isMounted) {
                    if (res.success && res.data) {
                        const actualLang = (res.data.languageCode || '').toLowerCase();
                        const reqLang = (selectedLang || '').toLowerCase();
                        if (res.data.isFallbackLanguage || (actualLang && reqLang && actualLang !== reqLang)) {
                            setNarration(null);
                            setNarrationError(
                                t?.narrationMissingDesc ||
                                `Chưa có bản thu âm và nội dung thuyết minh cho ngôn ngữ "${selectedLang.toUpperCase()}".`
                            );
                        } else {
                            setNarration(res.data);
                            setNarrationError('');
                        }
                    } else {
                        setNarration(null);
                        setNarrationError(res.message || t?.narrationMissingDesc || 'Chưa có bài thuyết minh cho ngôn ngữ này.');
                    }
                }
            } catch (err) {
                console.error('Error fetching species narration:', err);
                if (isMounted) {
                    setNarration(null);
                    setNarrationError('Lỗi kết nối khi tải bài thuyết minh.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchSpeciesDetailsAndNarration();
        return () => { isMounted = false; };
    }, [isOpen, species, selectedLang, hasActiveSession, currentSession, t]);

    if (!isOpen || !species) return null;

    const spDisplay = localizedSpecies || species;
    const isCurrentlyPlayingThis =
        audioState.isVisible &&
        audioState.isPlaying &&
        audioState.narration &&
        Number(audioState.narration.speciesId) === Number(species.id) &&
        audioState.narration.languageCode === selectedLang;

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
            showToast(t?.ticketRequiredNarration || 'Vui lòng kích hoạt vé tham quan hợp lệ để sử dụng chức năng thuyết minh.', 'error');
            setIsTicketModalOpen(true);
            return;
        }
        if (onPlayAudio) {
            onPlayAudio(species.id, true, narration?.languageCode || selectedLang);
        }
    };

    const activeLangObj = supportedLanguages.find(l => l.code === selectedLang);

    return (
        <div id="species-narration-modal" className="modal-overlay" role="dialog" aria-modal="true" style={{ zIndex: 1200 }}>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-dialog" style={{ maxWidth: '680px', width: '94%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header" style={{ alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {spDisplay.imageUrl && (
                            <img
                                src={spDisplay.imageUrl}
                                alt={spDisplay.name || spDisplay.nameVi}
                                style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #E2E8F0' }}
                            />
                        )}
                        <div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px', flexWrap: 'wrap' }}>
                                <span
                                    className="badge"
                                    style={{
                                        backgroundColor: `${getIucnColor(spDisplay.conservationStatus)}18`,
                                        color: getIucnColor(spDisplay.conservationStatus),
                                        fontWeight: '700',
                                        fontSize: '0.72rem'
                                    }}
                                >
                                    {spDisplay.conservationStatus || 'IUCN'}
                                </span>
                                {constituentAnimals.length > 0 && (
                                    <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.72rem' }}>
                                        {constituentAnimals.length} {t?.individualsCount || 'cá thể'}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-lg" style={{ margin: 0 }}>
                                {spDisplay.name || spDisplay.nameVi}
                            </h3>
                            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.85rem', color: '#64748B' }}>
                                {spDisplay.scientificName}
                            </p>
                        </div>
                    </div>

                    <button
                        id="btn-close-species-narration"
                        className="btn btn-icon btn-sm"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body" style={{ paddingTop: '12px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.5', marginBottom: '12px', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px' }}>
                        {spDisplay.description}
                        {spDisplay.referenceSource && (
                            <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#64748B' }}>
                                <strong>{t?.animalReferenceLabel || 'Nguồn tham khảo'}:</strong> {spDisplay.referenceSource}
                            </div>
                        )}
                    </div>

                    {constituentAnimals.length > 0 && (
                        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
                                {t?.individualsCount || 'Cá thể'}:
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
                                    {a.name || a.nameVi} ({a.code})
                                </span>
                            ))}
                        </div>
                    )}

                    {/* 12-Language Selector Grid */}
                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1E293B' }}>
                                {t?.languageLabel || 'Ngôn ngữ thuyết minh'} ({supportedLanguages.length}):
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '6px' }}>
                            {supportedLanguages.map(lang => (
                                <button
                                    key={lang.code}
                                    type="button"
                                    className={`btn btn-sm ${selectedLang === lang.code ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', padding: '6px 10px', fontSize: '0.78rem' }}
                                    onClick={() => handleLanguageChange(lang.code)}
                                >
                                    <span>{lang.flagIcon || '🌐'}</span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <strong>{lang.nativeName || lang.name}</strong>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Narration Content & Audio Player */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748B' }}>
                            {t?.loadingData || 'Đang tải bài thuyết minh...'}
                        </div>
                    ) : !hasActiveSession ? (
                        <div style={{ textAlign: 'center', padding: '24px 16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: '#64748B' }}>
         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
             <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
             <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
         </svg>
     </div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', margin: '0 0 6px 0' }}>
                                {t?.ticketLockedTitle || 'Tính Năng Thuyết Minh Yêu Cầu Vé Tham Quan'}
                            </h4>
                            <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0 0 16px 0' }}>
                                {t?.ticketLockedDesc || 'Vui lòng mua vé hoặc kích hoạt vé tham quan hợp lệ để sử dụng chức năng thuyết minh.'}
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ padding: '8px 18px', fontWeight: 600 }}
                                    onClick={() => {
                                        onClose();
                                        switchTab('tickets');
                                    }}
                                >
                                    {t?.btnPurchaseTicket || 'Mua vé tham quan'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ padding: '8px 18px', fontWeight: 600 }}
                                    onClick={() => {
                                        onClose();
                                        setIsTicketModalOpen(true);
                                    }}
                                >
                                    {t?.btnActivateTicket || 'Kích hoạt vé'}
                                </button>
                            </div>
                        </div>
                    ) : narration ? (
                        <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#166534', fontWeight: '700' }}>
                                        {narration.title}
                                    </h4>
                                    <span style={{ fontSize: '0.78rem', color: '#15803D', fontWeight: '600', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                                        {narration.durationFormatted || '--:--'}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#15803D' }}>
                                    {t?.narratorLabel || 'Giọng đọc'}: <strong>{narration.narrator}</strong>
                                    {narration.languageCode && (
                                        <span style={{ marginLeft: '8px', opacity: 0.85 }}>
                                            • [{narration.languageCode.toUpperCase()}]
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div style={{ fontSize: '0.86rem', color: '#14532D', marginBottom: '14px', lineHeight: '1.55', whiteSpace: 'pre-line' }}>
                                {narration.content || narration.summary}
                            </div>

                            {narration.referenceSource && (
                                <div style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '12px', opacity: 0.9 }}>
                                    {narration.referenceSource}
                                </div>
                            )}

                            {narration.isFallbackLanguage && (
                                <div style={{ padding: '8px 12px', backgroundColor: '#EFF6FF', color: '#1E40AF', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '12px', border: '1px solid #BFDBFE' }}>
                                    {narration.fallbackMessage || ('Chưa có file âm thanh tiếng ' + selectedLang.toUpperCase() + '. Hệ thống chuyển sang phát âm thanh ' + (narration.languageName || narration.languageCode.toUpperCase()) + '.')}
                                </div>
                            )}

                            {/* Play Button or Missing Audio Warning */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                                {narration.hasAudio && narration.audioSrc ? (
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
                                                <span>{t?.playingRestartBtn || 'Đang phát • Bấm để nghe lại từ đầu'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                </svg>
                                                <span>{t?.playNarrationBtn || 'Phát Thuyết Minh'} ({narration.isFallbackLanguage ? (narration.languageName || narration.languageCode?.toUpperCase()) : (activeLangObj?.nativeName || selectedLang.toUpperCase())})</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div style={{ flex: 1, padding: '10px 14px', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                                        {t?.audioMissingDesc || 'Chưa có file âm thanh cho ngôn ngữ này.'}
                                    </div>
                                )}

                                {onNavigateMap && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ padding: '10px 14px' }}
                                        onClick={() => {
                                            onClose();
                                            onNavigateMap(constituentAnimals[0] || spDisplay);
                                        }}
                                    >
                                        {t?.viewOnMap || 'Bản đồ'}
                                    </button>
                                )}
                            </div>

                            {narration.transcript && narration.transcript.length > 0 && (
                                <div>
                                    <h5 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#166534', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        {t?.transcriptBtn || 'Lời thoại thuyết minh'}:
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
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px 16px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', color: '#92400E' }}>
                            
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700 }}>
                                {t?.narrationMissingTitle || 'Chưa có bản dịch / thuyết minh cho ngôn ngữ này'}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.84rem' }}>
                                {narrationError || t?.narrationMissingDesc}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
