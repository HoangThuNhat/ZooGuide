import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ZooApi } from '../../services/api';

export default function AnimalsTab({ onPlayAudio, onLocateMap }) {
    const { setSelectedAnimalForDetail, filterZone, setFilterZone, currentLang, t } = useApp();
    const [animals, setAnimals] = useState([]);
    const [areas, setAreas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIucn, setSelectedIucn] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        ZooApi.getAreas(currentLang).then(res => {
            if (isMounted && res.success) {
                setAreas((res.data || []).filter(a => a.status !== 'Closed' && a.status !== '3'));
            }
        });
        return () => { isMounted = false; };
    }, [currentLang]);

    useEffect(() => {
        let isMounted = true;
        const fetchAnimals = async () => {
            setLoading(true);
            const res = await ZooApi.getAnimals({
                search: searchTerm,
                zoneId: filterZone,
                iucnStatus: selectedIucn,
                lang: currentLang
            });
            if (isMounted) {
                if (res.success) {
                    setAnimals(res.data || []);
                } else {
                    setAnimals([]);
                }
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchAnimals, searchTerm ? 220 : 0);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [searchTerm, filterZone, selectedIucn, currentLang]);

    const getIucnBadgeClass = (status) => {
        if (!status) return 'badge-success';
        const s = status.toUpperCase();
        if (s.includes('CR') || s.includes('CỰC KỲ') || s.includes('EX') || s.includes('EW')) return 'badge-danger';
        if (s.includes('EN') || (s.includes('NGUY CẤP') && !s.includes('SẮP'))) return 'badge-warning';
        if (s.includes('VU') || s.includes('NT') || s.includes('SẮP')) return 'badge-amber';
        return 'badge-success';
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterZone('all');
        setSelectedIucn('all');
    };

    return (
        <section id="tab-pane-animals" className="tab-content-pane">
            <div className="catalog-toolbar">
                <div className="catalog-search-row">
                    <div className="search-input-wrapper">
                        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="search"
                            id="animals-search-input"
                            className="search-input"
                            placeholder={t?.searchPlaceholder || 'Tìm kiếm tên động vật, tên khoa học, xuất xứ...'}
                            aria-label="Search animals"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        id="filter-iucn-select"
                        className="filter-select"
                        aria-label="Filter by IUCN status"
                        value={selectedIucn}
                        onChange={(e) => setSelectedIucn(e.target.value)}
                    >
                        <option value="all">IUCN: {t?.filterAll || 'Tất cả'}</option>
                        <option value="CR">CR - Critically Endangered</option>
                        <option value="EN">EN - Endangered</option>
                        <option value="VU">VU - Vulnerable</option>
                        <option value="NT">NT - Near Threatened</option>
                        <option value="LC">LC - Least Concern</option>
                    </select>
                </div>

                {/* Filter Pills from Live Supabase Areas */}
                <div className="filter-pills-row" role="tablist">
                    <button
                        className={`filter-zone-pill ${filterZone === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterZone('all')}
                    >
                        {t?.filterAllZones || 'Tất cả phân khu'}
                    </button>
                    {areas.map(area => {
                        const zoneKey = area.id || `zone-${(area.code || 'a').toLowerCase()}`;
                        return (
                            <button
                                key={zoneKey}
                                className={`filter-zone-pill ${filterZone === zoneKey ? 'active' : ''}`}
                                onClick={() => setFilterZone(zoneKey)}
                            >
                                {area.code} • {area.name || area.nameVi}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between mt-3">
                    <span id="animals-count-badge" className="chip chip-subtle">
                        {loading ? (t?.loadingData || 'Đang tải...') : `${animals.length} ${t?.speciesCountLabel || 'kết quả'}`}
                    </span>
                    <button
                        id="btn-reset-filters"
                        className="text-xs text-primary font-semibold"
                        onClick={handleResetFilters}
                    >
                        {t?.resetFilters || 'Xóa bộ lọc'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div id="animals-grid" className="animals-grid">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="animal-card skeleton-card">
                            <div className="skeleton skeleton-img"></div>
                            <div className="card-body">
                                <div className="skeleton skeleton-tag"></div>
                                <div className="skeleton skeleton-title"></div>
                                <div className="skeleton skeleton-desc"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : animals.length === 0 ? (
                <div id="animals-empty-state" className="empty-state">
                    <div className="empty-state-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <h4 className="font-bold text-base mb-2">{t?.emptyAnimalsTitle || 'Không tìm thấy động vật phù hợp'}</h4>
                    <p className="text-sm text-muted mb-4">{t?.emptyAnimalsDesc || 'Hãy thử tìm với từ khóa khác hoặc xóa bớt tiêu chí lọc.'}</p>
                </div>
            ) : (
                <div id="animals-grid" className="animals-grid">
                    {animals.map(animal => {
                        const iucnClass = getIucnBadgeClass(animal.iucnStatus);
                        const displayName = animal.name || animal.nameVi;
                        return (
                            <article
                                key={animal.id}
                                className="animal-card"
                                onClick={() => setSelectedAnimalForDetail(animal)}
                            >
                                <div className="card-media">
                                    {animal.imageUrl && (
                                        <img src={animal.imageUrl} alt={displayName} loading="lazy" className="card-img" />
                                    )}
                                    <span className={`badge ${iucnClass}`}>{animal.iucnStatus}</span>
                                    <span className="card-zone-tag">{animal.zoneCode}</span>
                                </div>
                                <div className="card-content">
                                    <div className="card-header-info">
                                        <h3 className="card-title">{displayName}</h3>
                                        <p className="card-latin"><em>{animal.scientificName}</em></p>
                                        {!animal.hasTranslation && currentLang !== 'vi' && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.72rem', color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                                </svg>
                                                <span>{t?.translationMissingBadge || 'Chưa có bản dịch cho ngôn ngữ này'}</span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="card-origin">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="2" y1="12" x2="22" y2="12"></line>
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                        </svg>
                                        <span>{animal.origin || animal.zoneName}</span>
                                    </p>
                                    <div className="card-meta-chips">
                                        <span className="chip">{animal.species}</span>
                                        {animal.weight && <span className="chip chip-subtle">{animal.weight}</span>}
                                    </div>
                                    <div className="card-actions">
                                        <button
                                            className="btn btn-sm btn-primary btn-play-audio"
                                            aria-label={`${t?.listenNarration || 'Thuyết minh'} ${displayName}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onPlayAudio) onPlayAudio(animal);
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                            </svg>
                                            <span>{t?.listenNarration || 'Thuyết minh'}</span>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline btn-locate-map"
                                            aria-label={t?.viewOnMap || 'Bản đồ'}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onLocateMap) onLocateMap(animal);
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                            </svg>
                                            <span>{t?.viewOnMap || 'Bản đồ'}</span>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-icon btn-detail"
                                            aria-label={t?.viewDetails || 'Xem chi tiết'}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedAnimalForDetail(animal);
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
