import React, { useState, useEffect, useMemo } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function SpeciesAudioTab({ onSelectSpecies, onPlaySpeciesAudio, onLocateMap }) {
    const { currentLang, t } = useApp();

    const [speciesList, setSpeciesList] = useState([]);
    const [animalsList, setAnimalsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIucn, setSelectedIucn] = useState('all');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        let isMounted = true;
        async function fetchSpeciesAndAnimals() {
            setLoading(true);
            setLoadError('');
            try {
                const [spRes, animRes] = await Promise.all([
                    ZooApi.getSpecies({ lang: currentLang }),
                    ZooApi.getAnimals({ lang: currentLang })
                ]);
                if (!isMounted) return;
                if (spRes.success) {
                    setSpeciesList(spRes.data || []);
                } else {
                    setSpeciesList([]);
                    setLoadError(spRes.message || 'Không thể tải danh sách loài.');
                }
                if (animRes.success) {
                    setAnimalsList(animRes.data || []);
                } else {
                    setAnimalsList([]);
                }
            } catch (err) {
                console.error('Error fetching species:', err);
                if (isMounted) {
                    setSpeciesList([]);
                    setLoadError('Lỗi kết nối tới máy chủ cơ sở dữ liệu.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchSpeciesAndAnimals();
        return () => { isMounted = false; };
    }, [currentLang]);

    const speciesWithDetails = useMemo(() => {
        const iconMap = {
            'panthera leo': '🦁',
            'panthera tigris': '🐅',
            'panthera pardus': '🐆',
            'panthera uncia': '🐆',
            'elephas': '🐘',
            'loxodonta': '🐘',
            'giraffa': '🦒',
            'pavo': '🦚',
            'pygathrix': '🐒',
            'ursus': '🐻'
        };

        return speciesList.map(sp => {
            const animals = animalsList.filter(a => Number(a.speciesId) === Number(sp.id));
            let icon = '🐾';
            const sciLower = (sp.scientificName || '').toLowerCase();
            for (const [key, ic] of Object.entries(iconMap)) {
                if (sciLower.includes(key)) {
                    icon = ic;
                    break;
                }
            }
            const img = sp.imageUrl || (animals[0] ? animals[0].imageUrl : '');
            return {
                ...sp,
                icon,
                imageUrl: img,
                animals
            };
        });
    }, [speciesList, animalsList]);

    const filteredSpecies = useMemo(() => {
        return speciesWithDetails.filter(sp => {
            const q = searchTerm.toLowerCase().trim();
            const matchesSearch = !q ||
                (sp.name && sp.name.toLowerCase().includes(q)) ||
                (sp.nameVi && sp.nameVi.toLowerCase().includes(q)) ||
                (sp.scientificName && sp.scientificName.toLowerCase().includes(q)) ||
                (sp.description && sp.description.toLowerCase().includes(q)) ||
                sp.animals.some(a =>
                    (a.name && a.name.toLowerCase().includes(q)) ||
                    (a.nameVi && a.nameVi.toLowerCase().includes(q))
                );

            const matchesIucn = selectedIucn === 'all' ||
                (sp.conservationStatus && sp.conservationStatus.toUpperCase().includes(selectedIucn.toUpperCase()));

            return matchesSearch && matchesIucn;
        });
    }, [speciesWithDetails, searchTerm, selectedIucn]);

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

    return (
        <section id="tab-pane-species-audio" className="tab-content-pane">
            <div className="container" style={{ paddingBottom: '80px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', flexShrink: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#0F172A' }}>
                                {t?.speciesTitle || 'Thuyết Minh Các Loài (Species Audio Guide)'}
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B' }}>
                                {t?.speciesSubtitle || 'Chọn một loài động vật để nghe bài thuyết minh tự động đa ngôn ngữ, xem thông tin sinh học và các cá thể nuôi dưỡng.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 260px', position: 'relative' }}>
                        <input
                            type="text"
                            className="form-control"
                            style={{ borderRadius: '6px', padding: '8px 14px 8px 34px', fontSize: '0.875rem', width: '100%', border: '1px solid #CBD5E1' }}
                            placeholder={t?.speciesSearchPlaceholder?.replace('🔍 ', '') || 'Tìm loài hoặc tên khoa học...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            className={`btn btn-sm ${selectedIucn === 'all' ? 'btn-primary' : 'btn-outline'}`}
                            style={{ borderRadius: '6px' }}
                            onClick={() => setSelectedIucn('all')}
                        >
                            {t?.filterAll || 'Tất cả'} ({speciesWithDetails.length})
                        </button>
                        <button
                            className={`btn btn-sm ${selectedIucn === 'CR' ? 'btn-danger' : 'btn-outline'}`}
                            style={{ borderRadius: '6px' }}
                            onClick={() => setSelectedIucn(selectedIucn === 'CR' ? 'all' : 'CR')}
                        >
                            CR
                        </button>
                        <button
                            className={`btn btn-sm ${selectedIucn === 'EN' ? 'btn-warning' : 'btn-outline'}`}
                            style={{ borderRadius: '6px' }}
                            onClick={() => setSelectedIucn(selectedIucn === 'EN' ? 'all' : 'EN')}
                        >
                            EN
                        </button>
                        <button
                            className={`btn btn-sm ${selectedIucn === 'VU' ? 'btn-warning' : 'btn-outline'}`}
                            style={{ borderRadius: '6px' }}
                            onClick={() => setSelectedIucn(selectedIucn === 'VU' ? 'all' : 'VU')}
                        >
                            VU
                        </button>
                        <button
                            className={`btn btn-sm ${selectedIucn === 'LC' ? 'btn-success' : 'btn-outline'}`}
                            style={{ borderRadius: '6px' }}
                            onClick={() => setSelectedIucn(selectedIucn === 'LC' ? 'all' : 'LC')}
                        >
                            LC
                        </button>
                    </div>
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                        <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
                        {t?.loadingData || 'Đang tải danh mục các loài từ hệ thống...'}
                    </div>
                )}

                {!loading && loadError && (
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                        ⚠️ {loadError}
                    </div>
                )}

                {!loading && !loadError && filteredSpecies.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                        <p style={{ fontSize: '1rem', color: '#64748B', margin: '0 0 10px 0' }}>
                            {t?.emptyAnimalsTitle || 'Không tìm thấy loài phù hợp'} {searchTerm ? `("${searchTerm}")` : ''}.
                        </p>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSearchTerm(''); setSelectedIucn('all'); }}>
                            {t?.resetFilters || 'Xóa bộ lọc'}
                        </button>
                    </div>
                )}

                {!loading && filteredSpecies.length > 0 && (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '16px'
                        }}
                    >
                        {filteredSpecies.map(sp => {
                            const animalCount = sp.animals.length;
                            const displayName = sp.name || sp.nameVi;

                            return (
                                <div
                                    key={sp.id}
                                    className="card"
                                    style={{
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'pointer',
                                        border: '1px solid #E2E8F0',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }}
                                    onClick={() => {
                                        if (onSelectSpecies) onSelectSpecies(sp);
                                    }}
                                >
                                    <div style={{ position: 'relative', height: '140px', backgroundColor: '#F1F5F9' }}>
                                        {sp.imageUrl && (
                                            <img
                                                src={sp.imageUrl}
                                                alt={displayName}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                loading="lazy"
                                            />
                                        )}
                                        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                            <span
                                                className="badge"
                                                style={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                    color: getIucnColor(sp.conservationStatus),
                                                    fontWeight: '700',
                                                    fontSize: '0.72rem',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                {sp.conservationStatus || 'IUCN'}
                                            </span>
                                        </div>
                                        <div style={{ position: 'absolute', bottom: '8px', left: '10px' }}>
                                            <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>
                                                {sp.icon}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ marginBottom: '6px' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 2px 0', color: '#0F172A' }}>
                                                {displayName}
                                            </h3>
                                            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.82rem', color: '#64748B' }}>
                                                {sp.scientificName}
                                            </p>
                                            {!sp.hasTranslation && currentLang !== 'vi' && (
                                                <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.7rem', color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
                                                    ⚠️ {t?.translationMissingBadge || 'Chưa có bản dịch cho ngôn ngữ này'}
                                                </span>
                                            )}
                                        </div>

                                        <p style={{
                                            fontSize: '0.8rem',
                                            color: '#475569',
                                            margin: '0 0 10px 0',
                                            lineHeight: '1.4',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {sp.description || '—'}
                                        </p>

                                        <div style={{ marginTop: 'auto', marginBottom: '12px' }}>
                                            {animalCount > 0 ? (
                                                <div style={{ fontSize: '0.76rem', color: '#15803D', backgroundColor: '#F0FDF4', padding: '4px 8px', borderRadius: '6px', border: '1px solid #DCFCE7' }}>
                                                    <strong>{animalCount} {t?.individualsCount || 'cá thể'}:</strong> {sp.animals.map(a => a.name || a.nameVi).join(', ')}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.74rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                                    0 {t?.individualsCount || 'cá thể'}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onSelectSpecies) onSelectSpecies(sp);
                                                }}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                </svg>
                                                <span>{t?.listenNarration || 'Nghe thuyết minh'}</span>
                                            </button>

                                            {onLocateMap && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline btn-sm"
                                                    style={{ padding: '8px 10px', borderRadius: '6px' }}
                                                    title={t?.viewOnMap || 'Bản đồ'}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onLocateMap(sp.animals[0] || sp);
                                                    }}
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                                                        <line x1="8" y1="2" x2="8" y2="18"></line>
                                                        <line x1="16" y1="6" x2="16" y2="22"></line>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
