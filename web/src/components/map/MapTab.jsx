import React, { useState, useEffect, useMemo } from 'react';
import { ZooApi, MOCK_DB } from '../../services/api';
import { useApp } from '../../context/AppContext';

// Predefined spatial & biome coordinates for each Species Area
const SPECIES_AREA_CONFIG = {
    // Họ Mèo (Felidae) & Động vật ăn thịt
    1: { code: 'ST', zoneId: 'zone-b', zoneCode: 'B', color: '#B45309', icon: '🦁', mapX: 560, mapY: 130 }, // Sư tử
    2: { code: 'HO', zoneId: 'zone-b', zoneCode: 'B', color: '#EA580C', icon: '🐅', mapX: 495, mapY: 115 }, // Hổ
    3: { code: 'BHM', zoneId: 'zone-b', zoneCode: 'B', color: '#D97706', icon: '🐆', mapX: 595, mapY: 180 }, // Báo hoa mai
    4: { code: 'BT', zoneId: 'zone-b', zoneCode: 'B', color: '#475569', icon: '🐆', mapX: 535, mapY: 215 }, // Báo tuyết
    1014: { code: 'GBC', zoneId: 'zone-b', zoneCode: 'B', color: '#0284C7', icon: '🐻‍❄️', mapX: 440, mapY: 95 }, // Gấu Bắc Cực
    1015: { code: 'GN', zoneId: 'zone-b', zoneCode: 'B', color: '#78350F', icon: '🐻', mapX: 640, mapY: 155 }, // Gấu nâu

    // Linh trưởng (Primates) & Rừng mưa
    1011: { code: 'TT', zoneId: 'zone-a', zoneCode: 'A', color: '#15803D', icon: '🐵', mapX: 185, mapY: 135 }, // Tinh tinh
    1012: { code: 'KD', zoneId: 'zone-a', zoneCode: 'A', color: '#166534', icon: '🦍', mapX: 245, mapY: 115 }, // Khỉ đột
    1013: { code: 'DU', zoneId: 'zone-a', zoneCode: 'A', color: '#9A3412', icon: '🦧', mapX: 270, mapY: 175 }, // Đười ươi Bornean
    5: { code: 'GT', zoneId: 'zone-a', zoneCode: 'A', color: '#15803D', icon: '🐼', mapX: 165, mapY: 200 }, // Gấu trúc lớn
    1029: { code: 'GT2', zoneId: 'zone-a', zoneCode: 'A', color: '#15803D', icon: '🐼', mapX: 205, mapY: 245 }, // Gấu trúc TQ

    // Động vật có vú lớn & Thảo nguyên
    1007: { code: 'VCA', zoneId: 'zone-c', zoneCode: 'C', color: '#059669', icon: '🐘', mapX: 460, mapY: 375 }, // Voi châu Á
    1008: { code: 'HCC', zoneId: 'zone-c', zoneCode: 'C', color: '#D97706', icon: '🦒', mapX: 535, mapY: 395 }, // Hươu cao cổ
    1009: { code: 'TGT', zoneId: 'zone-c', zoneCode: 'C', color: '#475569', icon: '🦏', mapX: 595, mapY: 445 }, // Tê giác trắng
    1010: { code: 'HM', zoneId: 'zone-c', zoneCode: 'C', color: '#0284C7', icon: '🦛', mapX: 440, mapY: 315 }, // Hà mã

    // Vương quốc Chim
    1016: { code: 'DB', zoneId: 'zone-e', zoneCode: 'E', color: '#7C3AED', icon: '🦅', mapX: 325, mapY: 220 }, // Đại bàng đầu trắng
    1017: { code: 'HH', zoneId: 'zone-e', zoneCode: 'E', color: '#DB2777', icon: '🦩', mapX: 410, mapY: 240 }, // Hồng hạc
    1018: { code: 'CCQ', zoneId: 'zone-e', zoneCode: 'E', color: '#0284C7', icon: '🐧', mapX: 475, mapY: 235 }, // Chim cánh cụt Hoàng đế

    // Bò sát, Lưỡng cư & Thủy cung
    1019: { code: 'CS', zoneId: 'zone-d', zoneCode: 'D', color: '#047857', icon: '🐊', mapX: 230, mapY: 375 }, // Cá sấu nước mặn
    1020: { code: 'RB', zoneId: 'zone-d', zoneCode: 'D', color: '#0284C7', icon: '🐢', mapX: 155, mapY: 410 }, // Rùa biển xanh
    1021: { code: 'KDK', zoneId: 'zone-d', zoneCode: 'D', color: '#B45309', icon: '🦎', mapX: 275, mapY: 425 }, // Kỳ đà Komodo
    1022: { code: 'EPT', zoneId: 'zone-d', zoneCode: 'D', color: '#16A34A', icon: '🐸', mapX: 300, mapY: 480 }, // Ếch phi tiêu độc
    1023: { code: 'KG', zoneId: 'zone-d', zoneCode: 'D', color: '#EC4899', icon: '🦎', mapX: 230, mapY: 495 }, // Kỳ giông Axolotl
    1024: { code: 'CM', zoneId: 'zone-d', zoneCode: 'D', color: '#0369A1', icon: '🦈', mapX: 125, mapY: 470 }, // Cá mập trắng lớn
    1025: { code: 'CD', zoneId: 'zone-d', zoneCode: 'D', color: '#0284C7', icon: '🐟', mapX: 175, mapY: 525 }  // Cá đuối manta
};

export default function MapTab({ onPlayAudio, onOpenDetail, onOpenSpeciesNarration }) {
    const { 
        hasActiveSession, 
        setIsTicketModalOpen, 
        showToast, 
        navTargetAnimal,
        setNavTargetAnimal
    } = useApp();

    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
    const [speciesList, setSpeciesList] = useState([]);
    const [selectedSpeciesArea, setSelectedSpeciesArea] = useState(null);
    const [activeRoute, setActiveRoute] = useState(null);
    const [activeBiomeFilter, setActiveBiomeFilter] = useState('all');
    const [searchKeyword, setSearchKeyword] = useState('');

    const userLocation = { x: 400, y: 550, name: "Cổng Vào Chính (Main Entrance)" };

    // 1. Fetch live species and merge with MOCK_DB.animals
    useEffect(() => {
        let isMounted = true;
        async function loadSpeciesData() {
            try {
                const res = await ZooApi.getSpecies();
                if (isMounted && res.success && res.data.length > 0) {
                    setSpeciesList(res.data);
                } else if (isMounted) {
                    setSpeciesList(MOCK_DB.species);
                }
            } catch (err) {
                if (isMounted) setSpeciesList(MOCK_DB.species);
            }
        }
        loadSpeciesData();
        return () => { isMounted = false; };
    }, []);

    // 2. Build Species Areas mapping (MỖI SPECIES = MỘT AREA RIÊNG)
    const speciesAreas = useMemo(() => {
        const rawSpecies = speciesList.length > 0 ? speciesList : MOCK_DB.species;
        const allAnimals = MOCK_DB.animals || [];

        return rawSpecies.map((sp, idx) => {
            const config = SPECIES_AREA_CONFIG[sp.id] || {
                code: `SP-${sp.id}`,
                zoneId: 'zone-c',
                zoneCode: 'C',
                color: '#059669',
                icon: '🐾',
                mapX: Math.round(380 + 180 * Math.cos(idx * 0.5)),
                mapY: Math.round(300 + 150 * Math.sin(idx * 0.5))
            };

            // Associate constituent mock animals to this Species Area
            const animalsInArea = allAnimals.filter(a => 
                a.speciesId === sp.id || 
                (a.scientificName && sp.nameEn && a.scientificName.toLowerCase() === sp.nameEn.toLowerCase()) ||
                (a.species && sp.nameVi && a.species.toLowerCase().includes(sp.nameVi.toLowerCase()))
            );

            const displayImage = sp.imageUrl || (animalsInArea[0] ? animalsInArea[0].imageUrl : "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800");

            return {
                speciesId: sp.id,
                nameVi: sp.nameVi,
                nameEn: sp.nameEn,
                scientificName: sp.nameEn || sp.nameVi,
                areaName: `Khu ${sp.nameVi}`,
                description: sp.description || "Khu vực bảo tồn và chăm sóc tự nhiên của loài.",
                conservationStatus: sp.conservationStatus || "Ít quan tâm",
                imageUrl: displayImage,
                zoneId: config.zoneId,
                zoneCode: config.zoneCode,
                color: config.color,
                icon: config.icon,
                mapX: config.mapX,
                mapY: config.mapY,
                animals: animalsInArea
            };
        });
    }, [speciesList]);

    // 3. Handle external navigation target (e.g. from Animals Tab "Định vị bản đồ")
    useEffect(() => {
        if (navTargetAnimal && speciesAreas.length > 0) {
            const targetArea = speciesAreas.find(area => 
                area.speciesId === navTargetAnimal.speciesId ||
                area.animals.some(a => a.id === navTargetAnimal.id)
            );
            if (targetArea) {
                setSelectedSpeciesArea(targetArea);
                handleNavigate(targetArea);
                setNavTargetAnimal(null);
            }
        }
    }, [navTargetAnimal, speciesAreas]);

    // Zoom controls
    const zoom = (factor) => {
        setViewBox(prev => {
            const newW = prev.width * factor;
            const newH = prev.height * factor;
            if (newW > 240 && newW < 1200) {
                return {
                    x: prev.x + (prev.width - newW) / 2,
                    y: prev.y + (prev.height - newH) / 2,
                    width: newW,
                    height: newH
                };
            }
            return prev;
        });
    };

    const resetView = () => {
        setViewBox({ x: 0, y: 0, width: 800, height: 600 });
    };

    // Navigate to a Species Area
    const handleNavigate = (area) => {
        const start = userLocation;
        const target = { x: area.mapX, y: area.mapY };

        let waypoints = [`${start.x} ${start.y}`, `400 460`, `370 280`, `${target.x} ${target.y}`];

        if (area.zoneCode === 'A') {
            waypoints = [`${start.x} ${start.y}`, `400 460`, `370 280`, `220 180`, `${target.x} ${target.y}`];
        } else if (area.zoneCode === 'B') {
            waypoints = [`${start.x} ${start.y}`, `400 460`, `370 280`, `520 160`, `${target.x} ${target.y}`];
        } else if (area.zoneCode === 'C') {
            waypoints = [`${start.x} ${start.y}`, `400 460`, `520 410`, `${target.x} ${target.y}`];
        } else if (area.zoneCode === 'D') {
            waypoints = [`${start.x} ${start.y}`, `400 460`, `230 440`, `${target.x} ${target.y}`];
        } else if (area.zoneCode === 'E') {
            waypoints = [`${start.x} ${start.y}`, `400 460`, `370 280`, `${target.x} ${target.y}`];
        }

        const pathD = `M ${waypoints.join(' L ')}`;
        const distanceM = Math.floor(120 + Math.hypot(target.x - start.x, target.y - start.y) * 0.45);
        const timeMin = Math.max(1, Math.ceil(distanceM / 65));

        setActiveRoute({
            area,
            pathD,
            start,
            distanceM,
            timeMin
        });

        setSelectedSpeciesArea(area);
        showToast(`Đã thiết lập lộ trình đi bộ đến ${area.areaName}`, "info");
    };

    const handleClearRoute = () => {
        setActiveRoute(null);
    };

    // Filter species areas
    const filteredSpeciesAreas = useMemo(() => {
        return speciesAreas.filter(area => {
            const matchesBiome = activeBiomeFilter === 'all' || area.zoneId === activeBiomeFilter;
            const matchesSearch = !searchKeyword.trim() || 
                area.nameVi.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                area.scientificName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                area.animals.some(a => a.nameVi.toLowerCase().includes(searchKeyword.toLowerCase()));
            return matchesBiome && matchesSearch;
        });
    }, [speciesAreas, activeBiomeFilter, searchKeyword]);

    // IUCN color helper
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
        <section id="tab-pane-map" className="tab-content-pane">
            <div className="map-view-wrapper">
                {/* Map Toolbar */}
                <div className="map-toolbar">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
                        <div>
                            <h3 className="text-base font-bold">Bản Đồ Phân Khu Loài (Species Zones)</h3>
                            <p className="text-xs text-muted">
                                Mỗi điểm đại diện cho một <strong>Khu Vực Loài (Species Area)</strong> riêng biệt và quản lý các cá thể tương ứng.
                            </p>
                        </div>
                        {/* Quick Search */}
                        <div style={{ minWidth: '220px' }}>
                            <input 
                                type="text"
                                className="form-control"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px' }}
                                placeholder="🔍 Tìm khu loài (Sư tử, Hổ, Voi...)"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Biome Filter Legend */}
                    <div className="map-zones-legend">
                        <button 
                            className={`legend-chip ${activeBiomeFilter === 'all' ? 'font-bold' : ''}`} 
                            style={{ borderColor: activeBiomeFilter === 'all' ? '#15803D' : undefined }}
                            onClick={() => setActiveBiomeFilter('all')}
                        >
                            <span>Tất cả ({speciesAreas.length} Khu Loài)</span>
                        </button>
                        <button 
                            className="legend-chip" 
                            style={{ borderColor: activeBiomeFilter === 'zone-b' ? '#B45309' : undefined }}
                            onClick={() => setActiveBiomeFilter(activeBiomeFilter === 'zone-b' ? 'all' : 'zone-b')}
                        >
                            <span className="legend-dot" style={{ background: '#B45309' }}></span>
                            <span>Khu Ăn Thịt & Gấu</span>
                        </button>
                        <button 
                            className="legend-chip" 
                            style={{ borderColor: activeBiomeFilter === 'zone-a' ? '#15803D' : undefined }}
                            onClick={() => setActiveBiomeFilter(activeBiomeFilter === 'zone-a' ? 'all' : 'zone-a')}
                        >
                            <span className="legend-dot" style={{ background: '#15803D' }}></span>
                            <span>Khu Linh Trưởng & Rừng Mưa</span>
                        </button>
                        <button 
                            className="legend-chip" 
                            style={{ borderColor: activeBiomeFilter === 'zone-c' ? '#059669' : undefined }}
                            onClick={() => setActiveBiomeFilter(activeBiomeFilter === 'zone-c' ? 'all' : 'zone-c')}
                        >
                            <span className="legend-dot" style={{ background: '#059669' }}></span>
                            <span>Khu Thảo Nguyên & Động Vật Lớn</span>
                        </button>
                        <button 
                            className="legend-chip" 
                            style={{ borderColor: activeBiomeFilter === 'zone-e' ? '#7C3AED' : undefined }}
                            onClick={() => setActiveBiomeFilter(activeBiomeFilter === 'zone-e' ? 'all' : 'zone-e')}
                        >
                            <span className="legend-dot" style={{ background: '#7C3AED' }}></span>
                            <span>Vương Quốc Chim</span>
                        </button>
                        <button 
                            className="legend-chip" 
                            style={{ borderColor: activeBiomeFilter === 'zone-d' ? '#0284C7' : undefined }}
                            onClick={() => setActiveBiomeFilter(activeBiomeFilter === 'zone-d' ? 'all' : 'zone-d')}
                        >
                            <span className="legend-dot" style={{ background: '#0284C7' }}></span>
                            <span>Thủy Cung & Bò Sát</span>
                        </button>
                    </div>
                </div>

                {/* Turn-by-Turn Routing Box */}
                {activeRoute && (
                    <div id="map-directions-card" className="map-directions-card">
                        <div className="directions-header">
                            <div className="dir-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5">
                                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                </svg>
                            </div>
                            <div className="dir-info">
                                <h4>Đang dẫn đường đến: <strong>{activeRoute.area.areaName}</strong></h4>
                                <p className="dir-meta">
                                    Khoảng cách: <strong>{activeRoute.distanceM}m</strong> (~{activeRoute.timeMin} phút đi bộ) • Phân khu {activeRoute.area.zoneCode}
                                </p>
                            </div>
                            <button className="btn btn-icon btn-sm" id="btn-cancel-route" aria-label="Hủy dẫn đường" onClick={handleClearRoute}>
                                ✕
                            </button>
                        </div>
                        <div className="directions-steps">
                            <div className="step-item">
                                <span className="step-dot"></span>
                                <p>Từ <strong>Cổng Vào Chính</strong>, đi thẳng 90m theo Đại Lộ Xanh.</p>
                            </div>
                            <div className="step-item">
                                <span className="step-dot"></span>
                                <p>Đi theo biển chỉ dẫn rẽ vào <strong>Phân khu {activeRoute.area.zoneCode}</strong>.</p>
                            </div>
                            <div className="step-item step-item-target">
                                <span className="step-dot"></span>
                                <p>Đích đến: <strong>{activeRoute.area.areaName}</strong> ({activeRoute.area.scientificName}) ngay trước mắt.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vector Map Canvas */}
                <div className="map-canvas-container" style={{ position: 'relative' }}>
                    <svg 
                        id="zoo-map-svg" 
                        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} 
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* Base Park Landscape Layer */}
                        <g id="map-base-layer">
                            <rect x="0" y="0" width="800" height="600" fill="#EBF4EE" rx="20"/>

                            {/* Center Lake: Hồ Thiên Nga */}
                            <path 
                                d="M 330 220 C 370 190, 440 210, 460 260 C 475 310, 420 355, 360 345 C 310 335, 290 280, 330 220 Z" 
                                fill="#CFEAF7" 
                                stroke="#A7D5ED" 
                                strokeWidth="3" 
                                opacity="0.95"
                            />
                            <text x="385" y="285" fontSize="11" fontWeight="600" fill="#0284C7" textAnchor="middle">Hồ Thiên Nga</text>

                            {/* Main Walkways */}
                            <path d="
                                M 400 550 L 400 460
                                L 400 370
                                M 400 460 L 230 440
                                M 400 460 L 520 410
                                M 400 370 L 370 280
                                M 370 280 L 220 180
                                M 370 280 L 520 160
                                M 220 180 L 330 130 L 520 160
                            " fill="none" stroke="#D1DECF" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>

                            <path d="
                                M 400 550 L 400 460
                                L 400 370
                                M 400 460 L 230 440
                                M 400 460 L 520 410
                                M 400 370 L 370 280
                                M 370 280 L 220 180
                                M 370 280 L 520 160
                                M 220 180 L 330 130 L 520 160
                            " fill="none" stroke="#FAF8F5" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>

                            {/* Entrance Gate */}
                            <g transform="translate(400, 550)">
                                <circle cx="0" cy="0" r="14" fill="#15803D" stroke="#FFFFFF" strokeWidth="3" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"/>
                                <circle cx="0" cy="0" r="5" fill="#FFFFFF"/>
                                <text x="0" y="24" fontSize="11" fontWeight="700" fill="#15803D" textAnchor="middle">CỔNG VÀO CHÍNH</text>
                            </g>

                            {/* Service Amenities */}
                            <g transform="translate(435, 480)" className="amenity-pin">
                                <circle cx="0" cy="0" r="9" fill="#EA580C" opacity="0.9"/>
                                <text x="0" y="3.5" fontSize="8" fill="#FFF" textAnchor="middle" fontWeight="bold">☕</text>
                            </g>
                            <g transform="translate(365, 480)" className="amenity-pin">
                                <circle cx="0" cy="0" r="9" fill="#0284C7" opacity="0.9"/>
                                <text x="0" y="3.5" fontSize="8" fill="#FFF" textAnchor="middle" fontWeight="bold">✚</text>
                            </g>
                        </g>

                        {/* Route Layer */}
                        {activeRoute && (
                            <g id="map-route-layer">
                                <path d={activeRoute.pathD} fill="none" stroke="rgba(217, 119, 6, 0.3)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d={activeRoute.pathD} fill="none" stroke="#D97706" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 6" className="animated-route-dash"/>
                                <circle cx={activeRoute.start.x} cy={activeRoute.start.y} r="12" fill="#2563EB" opacity="0.3" className="pulse-beacon"/>
                                <circle cx={activeRoute.start.x} cy={activeRoute.start.y} r="6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2"/>
                            </g>
                        )}

                        {/* SPECIES AREAS LAYER (MỖI SPECIES = MỘT AREA / MARKER RIÊNG) */}
                        <g id="map-species-areas-layer">
                            {filteredSpeciesAreas.map(area => {
                                const isSelected = selectedSpeciesArea && selectedSpeciesArea.speciesId === area.speciesId;
                                const animalCount = area.animals.length;

                                return (
                                    <g 
                                        key={`species-area-${area.speciesId}`} 
                                        className={`species-area-marker ${isSelected ? 'pin-active' : ''}`}
                                        transform={`translate(${area.mapX}, ${area.mapY})`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedSpeciesArea(area);
                                        }}
                                    >
                                        {/* Area boundary zone footprint circle */}
                                        <circle 
                                            cx="0" 
                                            cy="0" 
                                            r={isSelected ? 32 : 24} 
                                            fill={area.color} 
                                            fillOpacity={isSelected ? 0.28 : 0.14} 
                                            stroke={area.color} 
                                            strokeWidth={isSelected ? 2.5 : 1.5} 
                                            strokeDasharray={isSelected ? 'none' : '4,3'}
                                        />

                                        {/* Pulsing indicator if selected */}
                                        {isSelected && (
                                            <circle cx="0" cy="0" r="38" fill={area.color} opacity="0.2" className="pin-pulse" />
                                        )}

                                        {/* Center icon pin */}
                                        <circle 
                                            cx="0" 
                                            cy="0" 
                                            r="14" 
                                            fill="#FFFFFF" 
                                            stroke={isSelected ? '#F59E0B' : area.color} 
                                            strokeWidth={isSelected ? 3 : 2} 
                                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.18))"
                                        />
                                        <text x="0" y="4.5" fontSize="11" textAnchor="middle">
                                            {area.icon || '🐾'}
                                        </text>

                                        {/* Animal count indicator tag if animals belong to this species */}
                                        {animalCount > 0 && (
                                            <g transform="translate(11, -11)">
                                                <circle cx="0" cy="0" r="6.5" fill="#DC2626" />
                                                <text x="0" y="2.5" fontSize="7" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
                                                    {animalCount}
                                                </text>
                                            </g>
                                        )}

                                        {/* Area Label Tag */}
                                        <g className="pin-label-group" transform="translate(0, -22)">
                                            <rect 
                                                x={-Math.max(45, (area.nameVi.length * 4.2) + 12)} 
                                                y="-10" 
                                                width={Math.max(90, (area.nameVi.length * 8.4) + 24)} 
                                                height="18" 
                                                rx="9" 
                                                fill={isSelected ? '#D97706' : '#0F172A'} 
                                                opacity={isSelected ? 0.95 : 0.85}
                                            />
                                            <text x="0" y="2.5" fontSize="8.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
                                                Khu {area.nameVi}
                                            </text>
                                        </g>
                                    </g>
                                );
                            })}
                        </g>
                    </svg>

                    {/* Floating Zoom Controls */}
                    <div className="map-controls-floating">
                        <button id="map-zoom-in" className="map-ctrl-btn" aria-label="Phóng to bản đồ" onClick={() => zoom(0.8)}>+</button>
                        <button id="map-zoom-out" className="map-ctrl-btn" aria-label="Thu nhỏ bản đồ" onClick={() => zoom(1.25)}>−</button>
                        <button id="map-reset" className="map-ctrl-btn" aria-label="Đặt lại góc nhìn" onClick={resetView}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                            </svg>
                        </button>
                    </div>

                    {/* SPECIES AREA CALLOUT CARD (HIỂN THỊ THÔNG TIN SPECIES & DANH SÁCH ANIMALS) */}
                    {selectedSpeciesArea && (
                        <div id="map-callout-card" className="map-callout-card" style={{ maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="map-callout-content">
                                <button 
                                    className="callout-close" 
                                    id="btn-close-callout" 
                                    aria-label="Đóng thông tin khu loài" 
                                    onClick={() => setSelectedSpeciesArea(null)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>

                                {/* Species Area Header */}
                                <div className="callout-header" style={{ alignItems: 'flex-start' }}>
                                    <img 
                                        src={selectedSpeciesArea.imageUrl} 
                                        alt={selectedSpeciesArea.nameVi} 
                                        className="callout-thumb"
                                        style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                                            <span 
                                                className="badge" 
                                                style={{ 
                                                    backgroundColor: `${selectedSpeciesArea.color}22`, 
                                                    color: selectedSpeciesArea.color,
                                                    fontWeight: '700',
                                                    fontSize: '0.7rem'
                                                }}
                                            >
                                                Phân khu {selectedSpeciesArea.zoneCode}
                                            </span>
                                            <span 
                                                className="badge" 
                                                style={{ 
                                                    backgroundColor: `${getIucnColor(selectedSpeciesArea.conservationStatus)}18`, 
                                                    color: getIucnColor(selectedSpeciesArea.conservationStatus),
                                                    fontWeight: '700',
                                                    fontSize: '0.7rem'
                                                }}
                                            >
                                                {selectedSpeciesArea.conservationStatus}
                                            </span>
                                        </div>

                                        <h4 className="callout-title" style={{ fontSize: '1.1rem', margin: '0 0 2px 0' }}>
                                            {selectedSpeciesArea.areaName.toUpperCase()}
                                        </h4>
                                        <p className="callout-subtitle" style={{ margin: 0, fontStyle: 'italic', fontSize: '0.8rem', color: '#64748B' }}>
                                            {selectedSpeciesArea.scientificName}
                                        </p>
                                    </div>
                                </div>

                                {/* Species Description */}
                                <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '10px', lineHeight: '1.4' }}>
                                    {selectedSpeciesArea.description}
                                </div>

                                {/* Constituent Animals List (CÁ THỂ THUỘC LOÀI) */}
                                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '8px', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1E293B' }}>
                                            Cá thể sinh sống tại khu ({selectedSpeciesArea.animals.length} con):
                                        </span>
                                    </div>

                                    {selectedSpeciesArea.animals.length === 0 ? (
                                        <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0, fontStyle: 'italic' }}>
                                            Chưa ghi nhận cá thể nuôi dưỡng cụ thể trong dữ liệu hiện tại.
                                        </p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {selectedSpeciesArea.animals.map(animal => (
                                                <div 
                                                    key={animal.id} 
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'space-between',
                                                        backgroundColor: '#F8FAFC',
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #E2E8F0'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '1rem' }}>{selectedSpeciesArea.icon || '🐾'}</span>
                                                        <div>
                                                            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0F172A' }}>
                                                                {animal.nameVi} <span style={{ fontSize: '0.7rem', color: '#64748B' }}>({animal.code})</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                                                {animal.breedingStatus || animal.healthStatus || animal.origin || 'Nuôi dưỡng tự nhiên'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button 
                                                        className="btn btn-sm btn-outline" 
                                                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onOpenDetail) onOpenDetail(animal);
                                                        }}
                                                    >
                                                        Xem cá thể
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Callout Actions */}
                                <div className="callout-actions">
                                    <button 
                                        className="btn btn-sm btn-primary" 
                                        id="btn-callout-navigate" 
                                        onClick={() => handleNavigate(selectedSpeciesArea)}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                        </svg>
                                        <span>Dẫn đường tới khu này</span>
                                    </button>

                                    <button 
                                        className="btn btn-sm btn-accent" 
                                        id="btn-callout-audio" 
                                        onClick={() => {
                                            if (onOpenSpeciesNarration) {
                                                onOpenSpeciesNarration({
                                                    id: selectedSpeciesArea.speciesId,
                                                    nameVi: selectedSpeciesArea.nameVi,
                                                    nameEn: selectedSpeciesArea.nameEn,
                                                    scientificName: selectedSpeciesArea.scientificName,
                                                    conservationStatus: selectedSpeciesArea.conservationStatus,
                                                    description: selectedSpeciesArea.description,
                                                    imageUrl: selectedSpeciesArea.imageUrl,
                                                    icon: selectedSpeciesArea.icon
                                                });
                                            } else if (onPlayAudio) {
                                                const targetId = selectedSpeciesArea.speciesId;
                                                onPlayAudio(targetId);
                                            }
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                        <span>Nghe thuyết minh</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
