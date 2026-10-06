import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ZooApi } from '../../services/api';

export default function AnimalsTab({ onPlayAudio, onLocateMap }) {
    const { setSelectedAnimalForDetail, filterZone, setFilterZone } = useApp();
    const [animals, setAnimals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIucn, setSelectedIucn] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchAnimals = async () => {
            setLoading(true);
            const res = await ZooApi.getAnimals({
                search: searchTerm,
                zoneId: filterZone,
                iucnStatus: selectedIucn
            });
            if (isMounted) {
                if (res.success) {
                    setAnimals(res.data);
                }
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchAnimals, searchTerm ? 250 : 0);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [searchTerm, filterZone, selectedIucn]);

    const getIucnBadgeClass = (status) => {
        if (status.includes('Cực kỳ')) return 'badge-danger';
        if (status.includes('Nguy cấp')) return 'badge-warning';
        if (status.includes('Sắp bị')) return 'badge-amber';
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
                            placeholder="Tìm kiếm tên động vật, tên khoa học, xuất xứ..." 
                            aria-label="Tìm kiếm động vật"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select 
                        id="filter-iucn-select" 
                        className="filter-select" 
                        aria-label="Lọc theo tình trạng bảo tồn"
                        value={selectedIucn}
                        onChange={(e) => setSelectedIucn(e.target.value)}
                    >
                        <option value="all">Tất cả tình trạng bảo tồn (IUCN)</option>
                        <option value="Cực kỳ nguy cấp">Cực kỳ nguy cấp (CR)</option>
                        <option value="Nguy cấp">Nguy cấp (EN)</option>
                        <option value="Sắp bị đe dọa">Sắp bị đe dọa (NT)</option>
                        <option value="Ít quan tâm">Ít quan tâm (LC)</option>
                    </select>
                </div>

                {/* Filter Pills */}
                <div className="filter-pills-row" role="tablist">
                    <button 
                        className={`filter-zone-pill ${filterZone === 'all' ? 'active' : ''}`} 
                        onClick={() => setFilterZone('all')}
                    >
                        Tất cả phân khu
                    </button>
                    <button 
                        className={`filter-zone-pill ${filterZone === 'zone-a' ? 'active' : ''}`} 
                        onClick={() => setFilterZone('zone-a')}
                    >
                        Khu A • Linh Trưởng
                    </button>
                    <button 
                        className={`filter-zone-pill ${filterZone === 'zone-b' ? 'active' : ''}`} 
                        onClick={() => setFilterZone('zone-b')}
                    >
                        Khu B • Ăn Thịt
                    </button>
                    <button 
                        className={`filter-zone-pill ${filterZone === 'zone-c' ? 'active' : ''}`} 
                        onClick={() => setFilterZone('zone-c')}
                    >
                        Khu C • Ăn Cỏ
                    </button>
                    <button 
                        className={`filter-zone-pill ${filterZone === 'zone-d' ? 'active' : ''}`} 
                        onClick={() => setFilterZone('zone-d')}
                    >
                        Khu D • Bò Sát & Thủy Cung
                    </button>
                    <button 
                        className={`filter-zone-pill ${filterZone === 'zone-e' ? 'active' : ''}`} 
                        onClick={() => setFilterZone('zone-e')}
                    >
                        Khu E • Chim Nhiệt Đới
                    </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                    <span id="animals-count-badge" className="chip chip-subtle">
                        {loading ? 'Đang tải...' : `${animals.length} loài`}
                    </span>
                    <button 
                        id="btn-reset-filters" 
                        className="text-xs text-primary font-semibold"
                        onClick={handleResetFilters}
                    >
                        Xóa tất cả bộ lọc
                    </button>
                </div>
            </div>

            {/* Animal Cards Grid */}
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
                    <h4 className="font-bold text-base mb-2">Không tìm thấy động vật phù hợp</h4>
                    <p className="text-sm text-muted mb-4">Hãy thử tìm với từ khóa khác hoặc xóa bớt tiêu chí lọc.</p>
                </div>
            ) : (
                <div id="animals-grid" className="animals-grid">
                    {animals.map(animal => {
                        const iucnClass = getIucnBadgeClass(animal.iucnStatus);
                        return (
                            <article 
                                key={animal.id} 
                                className="animal-card" 
                                onClick={() => setSelectedAnimalForDetail(animal)}
                            >
                                <div className="card-media">
                                    <img src={animal.imageUrl} alt={animal.nameVi} loading="lazy" className="card-img"/>
                                    <span className={`badge ${iucnClass}`}>{animal.iucnStatus}</span>
                                    <span className="card-zone-tag">Khu {animal.zoneCode}</span>
                                </div>
                                <div className="card-content">
                                    <div className="card-header-info">
                                        <h3 className="card-title">{animal.nameVi}</h3>
                                        <p className="card-latin"><em>{animal.scientificName}</em></p>
                                    </div>
                                    <p className="card-origin">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="2" y1="12" x2="22" y2="12"></line>
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                        </svg>
                                        <span>{animal.origin}</span>
                                    </p>
                                    <div className="card-meta-chips">
                                        <span className="chip">{animal.species}</span>
                                        <span className="chip chip-subtle">{animal.weight}</span>
                                    </div>
                                    <div className="card-actions">
                                        <button 
                                            className="btn btn-sm btn-primary btn-play-audio" 
                                            aria-label={`Nghe thuyết minh ${animal.nameVi}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onPlayAudio) onPlayAudio(animal.id);
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                            </svg>
                                            <span>Thuyết minh</span>
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline btn-locate-map" 
                                            aria-label="Định vị trên bản đồ"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onLocateMap) onLocateMap(animal);
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                            </svg>
                                            <span>Bản đồ</span>
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-icon btn-detail" 
                                            aria-label="Xem chi tiết"
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
