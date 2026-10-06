import React, { useState, useEffect, useMemo } from 'react';
import { ZooApi, MOCK_DB } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function SpeciesAudioTab({ onSelectSpecies, onPlaySpeciesAudio, onLocateMap }) {
    const { setSelectedAnimalForDetail } = useApp();

    const [speciesList, setSpeciesList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIucn, setSelectedIucn] = useState('all');
    const [loading, setLoading] = useState(true);

    // 1. Fetch live species from backend API (Supabase)
    useEffect(() => {
        let isMounted = true;
        async function fetchSpecies() {
            setLoading(true);
            try {
                const res = await ZooApi.getSpecies();
                if (isMounted && res.success && res.data.length > 0) {
                    setSpeciesList(res.data);
                } else if (isMounted) {
                    setSpeciesList(MOCK_DB.species);
                }
            } catch (err) {
                console.error("Error fetching species:", err);
                if (isMounted) setSpeciesList(MOCK_DB.species);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchSpecies();
        return () => { isMounted = false; };
    }, []);

    // 2. Associate species with mock animals and icons
    const speciesWithDetails = useMemo(() => {
        const rawSpecies = speciesList.length > 0 ? speciesList : MOCK_DB.species;
        const allAnimals = MOCK_DB.animals || [];

        // Species icons mapping for popular animals
        const iconMap = {
            'sư tử': '🦁',
            'hổ': '🐅',
            'báo hoa mai': '🐆',
            'báo tuyết': '🐆',
            'voi': '🐘',
            'hươu cao cổ': '🦒',
            'tê giác': '🦏',
            'hà mã': '🦛',
            'tinh tinh': '🐵',
            'khỉ đột': '🦍',
            'đười ươi': '🦧',
            'gấu bắc cực': '🐻‍❄️',
            'gấu trúc': '🐼',
            'gấu nâu': '🐻',
            'đại bàng': '🦅',
            'hồng hạc': '🦩',
            'chim cánh cụt': '🐧',
            'cá sấu': '🐊',
            'rùa': '🐢',
            'kỳ đà': '🦎',
            'ếch': '🐸',
            'kỳ giông': '🦎',
            'cá mập': '🦈',
            'cá đuối': '🐟'
        };

        return rawSpecies.map(sp => {
            const animals = allAnimals.filter(a => 
                a.speciesId === sp.id || 
                (a.scientificName && sp.nameEn && a.scientificName.toLowerCase() === sp.nameEn.toLowerCase()) ||
                (a.species && sp.nameVi && a.species.toLowerCase().includes(sp.nameVi.toLowerCase()))
            );

            // Find matching icon
            let icon = '🐾';
            const nameLower = (sp.nameVi || '').toLowerCase();
            for (const [key, ic] of Object.entries(iconMap)) {
                if (nameLower.includes(key)) {
                    icon = ic;
                    break;
                }
            }

            const img = sp.imageUrl || (animals[0] ? animals[0].imageUrl : "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800");

            return {
                ...sp,
                icon,
                imageUrl: img,
                animals
            };
        });
    }, [speciesList]);

    // 3. Filter species list
    const filteredSpecies = useMemo(() => {
        return speciesWithDetails.filter(sp => {
            const matchesSearch = !searchTerm.trim() ||
                (sp.nameVi && sp.nameVi.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (sp.nameEn && sp.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
                sp.animals.some(a => a.nameVi.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesIucn = selectedIucn === 'all' || 
                (sp.conservationStatus && sp.conservationStatus.toLowerCase().includes(selectedIucn.toLowerCase()));

            return matchesSearch && matchesIucn;
        });
    }, [speciesWithDetails, searchTerm, selectedIucn]);

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

    return (
        <section id="tab-pane-species-audio" className="tab-content-pane">
            <div className="container" style={{ paddingBottom: '80px' }}>
                {/* Header Banner */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '1.8rem' }}>🎧</span>
                        <div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                                Thuyết Minh Các Loài (Species Audio Guide)
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                                Chọn một loài động vật để nghe bài thuyết minh tự động song ngữ, xem thông tin sinh học và các cá thể nuôi dưỡng.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 260px' }}>
                        <input 
                            type="text" 
                            className="form-control"
                            style={{ borderRadius: '24px', padding: '10px 18px', fontSize: '0.9rem' }}
                            placeholder="🔍 Tìm loài (Sư tử, Hổ, Rùa biển, Voi...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button 
                            className={`btn btn-sm ${selectedIucn === 'all' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setSelectedIucn('all')}
                        >
                            Tất cả ({speciesWithDetails.length})
                        </button>
                        <button 
                            className={`btn btn-sm ${selectedIucn === 'CR' ? 'btn-danger' : 'btn-outline'}`}
                            onClick={() => setSelectedIucn(selectedIucn === 'CR' ? 'all' : 'CR')}
                        >
                            CR - Cực kỳ nguy cấp
                        </button>
                        <button 
                            className={`btn btn-sm ${selectedIucn === 'EN' ? 'btn-warning' : 'btn-outline'}`}
                            onClick={() => setSelectedIucn(selectedIucn === 'EN' ? 'all' : 'EN')}
                        >
                            EN - Nguy cấp
                        </button>
                        <button 
                            className={`btn btn-sm ${selectedIucn === 'VU' ? 'btn-warning' : 'btn-outline'}`}
                            onClick={() => setSelectedIucn(selectedIucn === 'VU' ? 'all' : 'VU')}
                        >
                            VU - Sắp nguy cấp
                        </button>
                        <button 
                            className={`btn btn-sm ${selectedIucn === 'LC' ? 'btn-success' : 'btn-outline'}`}
                            onClick={() => setSelectedIucn(selectedIucn === 'LC' ? 'all' : 'LC')}
                        >
                            LC - Ít quan tâm
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                        <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
                        Đang tải danh mục các loài từ hệ thống...
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredSpecies.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                        <p style={{ fontSize: '1rem', color: '#64748B', margin: '0 0 10px 0' }}>
                            Không tìm thấy loài nào khớp với từ khóa "<strong>{searchTerm}</strong>".
                        </p>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSearchTerm(''); setSelectedIucn('all'); }}>
                            Xóa bộ lọc
                        </button>
                    </div>
                )}

                {/* Species Cards Grid */}
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

                            return (
                                <div 
                                    key={sp.id} 
                                    className="card"
                                    style={{ 
                                        borderRadius: '14px', 
                                        overflow: 'hidden', 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'pointer',
                                        border: '1.5px solid #E2E8F0',
                                        backgroundColor: '#FFFFFF'
                                    }}
                                    onClick={() => {
                                        if (onSelectSpecies) onSelectSpecies(sp);
                                    }}
                                >
                                    {/* Top Image Banner */}
                                    <div style={{ position: 'relative', height: '140px', backgroundColor: '#F1F5F9' }}>
                                        <img 
                                            src={sp.imageUrl} 
                                            alt={sp.nameVi}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            loading="lazy"
                                        />
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
                                                {sp.conservationStatus || 'Ít quan tâm'}
                                            </span>
                                        </div>
                                        <div style={{ position: 'absolute', bottom: '8px', left: '10px' }}>
                                            <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>
                                                {sp.icon}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Body */}
                                    <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ marginBottom: '6px' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 2px 0', color: '#0F172A' }}>
                                                {sp.nameVi}
                                            </h3>
                                            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.82rem', color: '#64748B' }}>
                                                {sp.nameEn || sp.scientificName}
                                            </p>
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
                                            {sp.description || "Loài động vật đặc trưng trong hệ sinh thái tự nhiên."}
                                        </p>

                                        {/* Resident Animals Badge */}
                                        <div style={{ marginTop: 'auto', marginBottom: '12px' }}>
                                            {animalCount > 0 ? (
                                                <div style={{ fontSize: '0.76rem', color: '#2563EB', backgroundColor: '#EFF6FF', padding: '4px 8px', borderRadius: '6px' }}>
                                                    🐾 <strong>{animalCount} cá thể:</strong> {sp.animals.map(a => a.nameVi).join(', ')}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.74rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                                    Chưa ghi nhận cá thể cụ thể
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onSelectSpecies) onSelectSpecies(sp);
                                                }}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                </svg>
                                                <span>Nghe thuyết minh</span>
                                            </button>

                                            {onLocateMap && (
                                                <button 
                                                    type="button"
                                                    className="btn btn-outline btn-sm"
                                                    style={{ padding: '8px 10px' }}
                                                    title="Xem vị trí khu vực loài trên bản đồ"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onLocateMap(sp);
                                                    }}
                                                >
                                                    🗺
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
