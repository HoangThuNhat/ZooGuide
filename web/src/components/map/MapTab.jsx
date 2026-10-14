import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { 
    WALKWAY_NODES, 
    WALKWAY_EDGES, 
    POPULAR_START_POINTS, 
    planZooRoute 
} from './zooWalkwayGraph';

export default function MapTab({ onPlayAudio, onOpenDetail, onOpenSpeciesNarration }) {
    const { 
        hasActiveSession, 
        setIsTicketModalOpen, 
        showToast, 
        navTargetAnimal,
        setNavTargetAnimal
    } = useApp();

    // Core Data States from Live Database
    const [areas, setAreas] = useState([]);
    const [enclosures, setEnclosures] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Navigation & Selection States (Hierarchy: Zoo -> Area -> Enclosure -> Animal)
    const [selectedAreaId, setSelectedAreaId] = useState(null); // null means All Zoo Overview
    const [selectedEnclosureId, setSelectedEnclosureId] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [activeAreaFilter, setActiveAreaFilter] = useState('all');
    const [mobileTab, setMobileTab] = useState('map'); // 'map' | 'details'
    const [hoveredEnclosureId, setHoveredEnclosureId] = useState(null);

    // Walkway Routing & Start Point Selection
    const [selectedStartPointId, setSelectedStartPointId] = useState('n_entrance');
    const [activeRoute, setActiveRoute] = useState(null);
    const [showWaypointsList, setShowWaypointsList] = useState(false);

    // Map Viewport
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 700 });

    // 1. Fetch live data from backend API (Supabase PostgreSQL via ASP.NET Core)
    const loadMapData = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const [resAreas, resEnclosures, resAnimals] = await Promise.all([
                ZooApi.getAreas(),
                ZooApi.getEnclosures(),
                ZooApi.getAnimals()
            ]);

            if (!resAreas.success) {
                throw new Error(resAreas.message || "Không thể tải danh sách khu vực từ máy chủ.");
            }
            if (!resEnclosures.success) {
                throw new Error(resEnclosures.message || "Không thể tải danh sách chuồng trại từ máy chủ.");
            }
            if (!resAnimals.success) {
                throw new Error(resAnimals.message || "Không thể tải danh sách động vật từ máy chủ.");
            }

            setAreas(resAreas.data || []);
            setEnclosures(resEnclosures.data || []);
            setAnimals(resAnimals.data || []);
        } catch (err) {
            console.error("MapTab loadMapData error:", err);
            setLoadError(err.message || "Lỗi kết nối máy chủ cơ sở dữ liệu sở thú.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMapData();
    }, []);

    // 2. Color helper based on Area Code
    const getAreaColor = (code, fallback = '#15803D') => {
        const colorPalette = {
            'A': '#15803D', // Xanh rừng mưa (Linh trưởng & Thú nhỏ)
            'B': '#B45309', // Hổ phách ăn thịt (Carnivore Safari)
            'C': '#059669', // Xanh ngọc thảo nguyên (Ăn cỏ)
            'D': '#0284C7', // Xanh dương thủy cung
            'E': '#7C3AED', // Tím vương quốc chim
            'F': '#D97706',
            'G': '#BE185D'
        };
        const c = String(code || '').toUpperCase().trim();
        return colorPalette[c] || fallback;
    };

    // 3. Normalized Macro Area list (exclusively Active macro areas)
    const enrichedAreas = useMemo(() => {
        return areas
            .filter(area => area.status !== 'Closed' && area.status !== '3' && area.status !== 'Inactive')
            .map(area => {
                const areaId = area.areaId || area.id;
                const areaEnclosures = enclosures.filter(e => e.areaId === areaId);
                const areaAnimals = animals.filter(a => a.areaId === areaId);
                const color = area.color || getAreaColor(area.code);

                const mapX = area.mapX != null ? Number(area.mapX) : 500;
                const mapY = area.mapY != null ? Number(area.mapY) : 350;

                return {
                    ...area,
                    areaId,
                    color,
                    mapX,
                    mapY,
                    enclosures: areaEnclosures,
                    animals: areaAnimals,
                    enclosureCount: areaEnclosures.length,
                    animalCount: areaAnimals.length
                };
            });
    }, [areas, enclosures, animals]);

    // 4. Normalized Enclosure list with resident animals and parent Area
    const enrichedEnclosures = useMemo(() => {
        return enclosures.map(enc => {
            const encId = enc.enclosureId || enc.id;
            const parentArea = enrichedAreas.find(a => a.areaId === enc.areaId);
            const residentAnimals = animals.filter(a => a.enclosureId === encId);

            let mapX = enc.mapX != null ? Number(enc.mapX) : null;
            let mapY = enc.mapY != null ? Number(enc.mapY) : null;

            if (mapX == null || mapY == null) {
                if (parentArea) {
                    mapX = parentArea.mapX + (Math.sin(encId) * 45);
                    mapY = parentArea.mapY + (Math.cos(encId) * 45);
                } else {
                    mapX = 500;
                    mapY = 350;
                }
            }

            return {
                ...enc,
                enclosureId: encId,
                parentArea,
                areaName: parentArea?.nameVi || parentArea?.name || enc.areaName || 'Khu chung',
                areaCode: parentArea?.code || enc.areaCode || 'Z',
                color: parentArea?.color || '#0284C7',
                mapX,
                mapY,
                residentAnimals,
                animalCount: residentAnimals.length
            };
        });
    }, [enclosures, enrichedAreas, animals]);

    // Currently selected Area and Enclosure objects
    const currentSelectedArea = useMemo(() => {
        if (!selectedAreaId) return null;
        return enrichedAreas.find(a => a.areaId === Number(selectedAreaId)) || null;
    }, [selectedAreaId, enrichedAreas]);

    const currentSelectedEnclosure = useMemo(() => {
        if (!selectedEnclosureId) return null;
        return enrichedEnclosures.find(e => e.enclosureId === Number(selectedEnclosureId)) || null;
    }, [selectedEnclosureId, enrichedEnclosures]);

    // Selected Start Point Object
    const currentStartPoint = useMemo(() => {
        return POPULAR_START_POINTS.find(p => p.id === selectedStartPointId) || 
               WALKWAY_NODES[selectedStartPointId] || 
               POPULAR_START_POINTS[0];
    }, [selectedStartPointId]);

    // 5. Dijkstra Route Navigation Engine
    const calculateRoute = (startId, targetType, targetEntity) => {
        const start = POPULAR_START_POINTS.find(p => p.id === startId) || 
                     WALKWAY_NODES[startId] || 
                     POPULAR_START_POINTS[0];

        const routeResult = planZooRoute({
            startPoint: start,
            targetType,
            targetEntity,
            currentNodes: WALKWAY_NODES,
            currentEdges: WALKWAY_EDGES
        });

        if (routeResult) {
            setActiveRoute(routeResult);
        } else {
            setActiveRoute(null);
        }
    };

    // When starting point changes and a route is active, recalculate immediately
    const handleStartPointChange = (newStartId) => {
        setSelectedStartPointId(newStartId);
        if (activeRoute) {
            calculateRoute(newStartId, activeRoute.targetType, activeRoute.targetEntity);
        }
    };

    // 6. External navigation handling (from Animals tab "Định vị bản đồ")
    useEffect(() => {
        if (navTargetAnimal && enrichedEnclosures.length > 0) {
            let targetEnc = null;
            if (navTargetAnimal.enclosureId) {
                targetEnc = enrichedEnclosures.find(e => e.enclosureId === navTargetAnimal.enclosureId);
            }
            if (!targetEnc && navTargetAnimal.areaId) {
                targetEnc = enrichedEnclosures.find(e => e.areaId === navTargetAnimal.areaId);
            }

            if (targetEnc) {
                handleSelectEnclosure(targetEnc);
            } else if (navTargetAnimal.areaId) {
                const targetArea = enrichedAreas.find(a => a.areaId === navTargetAnimal.areaId);
                if (targetArea) handleSelectArea(targetArea);
            }

            setNavTargetAnimal(null);
            showToast(`Đã định vị chuồng cho ${navTargetAnimal.nameVi || navTargetAnimal.name}`, "info");
        }
    }, [navTargetAnimal, enrichedEnclosures, enrichedAreas]);

    // 7. Navigation Actions: Select Area, Select Enclosure, Clear
    const handleSelectArea = (area) => {
        setSelectedAreaId(area.areaId);
        setSelectedEnclosureId(null);
        calculateRoute(selectedStartPointId, 'area', area);
        setMobileTab('details');
    };

    const handleSelectEnclosure = (enclosure) => {
        setSelectedEnclosureId(enclosure.enclosureId);
        if (enclosure.areaId) setSelectedAreaId(enclosure.areaId);
        calculateRoute(selectedStartPointId, 'enclosure', enclosure);
        setMobileTab('details');
    };

    const handleBackToZoo = () => {
        setSelectedAreaId(null);
        setSelectedEnclosureId(null);
        setActiveRoute(null);
        resetView();
    };

    const handleBackToArea = () => {
        setSelectedEnclosureId(null);
        if (currentSelectedArea) {
            calculateRoute(selectedStartPointId, 'area', currentSelectedArea);
        }
    };

    // 8. Zoom & View Controls
    const zoom = (factor) => {
        setViewBox(prev => {
            const newW = prev.width * factor;
            const newH = prev.height * factor;
            if (newW >= 300 && newW <= 1600) {
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
        setViewBox({ x: 0, y: 0, width: 1000, height: 700 });
    };

    // 9. Filter and Search logic
    const filteredAreas = useMemo(() => {
        return enrichedAreas.filter(area => {
            const matchesFilter = activeAreaFilter === 'all' || String(area.areaId) === String(activeAreaFilter);
            const matchesSearch = !searchKeyword.trim() || 
                (area.nameVi && area.nameVi.toLowerCase().includes(searchKeyword.toLowerCase())) ||
                (area.name && area.name.toLowerCase().includes(searchKeyword.toLowerCase())) ||
                (area.code && area.code.toLowerCase().includes(searchKeyword.toLowerCase()));
            return matchesFilter && matchesSearch;
        });
    }, [enrichedAreas, activeAreaFilter, searchKeyword]);

    const filteredEnclosuresList = useMemo(() => {
        return enrichedEnclosures.filter(enc => {
            const matchesArea = !selectedAreaId || enc.areaId === Number(selectedAreaId);
            const matchesFilter = activeAreaFilter === 'all' || String(enc.areaId) === String(activeAreaFilter);
            const matchesSearch = !searchKeyword.trim() || 
                enc.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                (enc.code && enc.code.toLowerCase().includes(searchKeyword.toLowerCase())) ||
                enc.residentAnimals.some(a => 
                    (a.nameVi && a.nameVi.toLowerCase().includes(searchKeyword.toLowerCase())) ||
                    (a.species && a.species.toLowerCase().includes(searchKeyword.toLowerCase()))
                );
            return matchesArea && matchesFilter && matchesSearch;
        });
    }, [enrichedEnclosures, selectedAreaId, activeAreaFilter, searchKeyword]);

    // Icon generator for enclosure types
    const getEnclosureIcon = (name = '', areaCode = '') => {
        const lower = name.toLowerCase();
        if (lower.includes('hổ') || lower.includes('tiger')) return '🐅';
        if (lower.includes('sư tử') || lower.includes('lion')) return '🦁';
        if (lower.includes('báo') || lower.includes('leopard')) return '🐆';
        if (lower.includes('voi') || lower.includes('elephant')) return '🐘';
        if (lower.includes('chim') || lower.includes('vòm') || lower.includes('bird')) return '🦅';
        if (lower.includes('gấu') || lower.includes('bear')) return '🐻';
        if (lower.includes('vượn') || lower.includes('khỉ') || lower.includes('voọc')) return '🐒';
        if (lower.includes('chó') || lower.includes('mèo') || lower.includes('thú cưng')) return '🐾';
        if (lower.includes('cá sấu') || lower.includes('bò sát')) return '🐊';
        if (lower.includes('thủy cung') || lower.includes('cá')) return '🐠';
        if (areaCode === 'A') return '🐒';
        if (areaCode === 'B') return '🦁';
        if (areaCode === 'C') return '🦒';
        if (areaCode === 'D') return '🐊';
        if (areaCode === 'E') return '🦚';
        return '🏠';
    };

    return (
        <section id="tab-pane-map" className="tab-content-pane" style={{ padding: '12px 0' }}>
            {/* Top Toolbar */}
            <div className="map-toolbar" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 18px', marginBottom: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.4rem' }}>🗺️</span>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                                Bản Đồ Tương Tác Sở Thú (ZooGuide Interactive Map)
                            </h3>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                            Khám phá theo cấu trúc: <strong>Sở thú → Phân khu → Chuồng trại → Động vật</strong>.
                        </p>
                    </div>

                    {/* Filter, Start Point & Search Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Starting Point Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', padding: '4px 10px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                            <span style={{ fontSize: '0.85rem' }} title="Điểm xuất phát dẫn đường">📍 Xuất phát:</span>
                            <select
                                className="form-select"
                                style={{ padding: '4px 8px', fontSize: '0.82rem', borderRadius: '8px', border: 'none', background: 'transparent', fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
                                value={selectedStartPointId}
                                onChange={(e) => handleStartPointChange(e.target.value)}
                            >
                                {POPULAR_START_POINTS.map(sp => (
                                    <option key={sp.id} value={sp.id}>
                                        {sp.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Area Selector Dropdown */}
                        <select
                            className="form-select"
                            style={{ padding: '7px 12px', fontSize: '0.85rem', borderRadius: '10px', minWidth: '160px' }}
                            value={activeAreaFilter}
                            onChange={(e) => {
                                setActiveAreaFilter(e.target.value);
                                if (e.target.value !== 'all') {
                                    setSelectedAreaId(Number(e.target.value));
                                    setSelectedEnclosureId(null);
                                } else {
                                    setSelectedAreaId(null);
                                    setSelectedEnclosureId(null);
                                }
                            }}
                        >
                            <option value="all">🌐 Toàn bộ sở thú ({enrichedAreas.length} phân khu)</option>
                            {enrichedAreas.map(a => (
                                <option key={a.areaId} value={a.areaId}>
                                    Khu {a.code} - {a.nameVi || a.name}
                                </option>
                            ))}
                        </select>

                        {/* Search Input */}
                        <div style={{ position: 'relative', minWidth: '200px' }}>
                            <input 
                                type="text"
                                className="form-input"
                                style={{ padding: '7px 12px 7px 32px', fontSize: '0.85rem', borderRadius: '20px' }}
                                placeholder="Tìm khu, chuồng, thú..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.85rem' }}>
                                🔍
                            </span>
                        </div>

                        {/* Refresh Button */}
                        <button
                            className="btn btn-sm btn-outline"
                            title="Tải lại dữ liệu trực tiếp từ máy chủ"
                            onClick={loadMapData}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang tải...' : '🔄 Làm mới'}
                        </button>
                    </div>
                </div>

                {/* Mobile View Switcher */}
                <div className="mobile-only-flex" style={{ display: 'none', gap: '8px', marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                    <button
                        className={`btn btn-sm ${mobileTab === 'map' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1 }}
                        onClick={() => setMobileTab('map')}
                    >
                        🗺️ Xem Bản Đồ
                    </button>
                    <button
                        className={`btn btn-sm ${mobileTab === 'details' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1 }}
                        onClick={() => setMobileTab('details')}
                    >
                        📋 Danh Sách & Chi Tiết
                    </button>
                </div>
            </div>

            {/* ERROR ALERT */}
            {loadError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '14px 18px', borderRadius: '10px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ color: '#B91C1C', fontSize: '0.9rem' }}>
                        <strong>⚠️ Lỗi tải bản đồ:</strong> {loadError}
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={loadMapData}>
                        Thử lại
                    </button>
                </div>
            )}

            {/* MAIN INTERACTIVE MAP LAYOUT */}
            <div className="map-view-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '16px', alignItems: 'start' }}>
                {/* LEFT: MAP CANVAS CONTAINER */}
                <div className={`map-canvas-card ${mobileTab !== 'map' ? 'mobile-hidden' : ''}`} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative' }}>
                    
                    {/* Zoom / Viewport Controls Floating Overlay */}
                    <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255, 255, 255, 0.95)', padding: '6px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                        <button className="btn btn-icon btn-sm" title="Phóng to" onClick={() => zoom(0.85)}>＋</button>
                        <button className="btn btn-icon btn-sm" title="Thu nhỏ" onClick={() => zoom(1.18)}>－</button>
                        <button className="btn btn-icon btn-sm" title="Khôi phục toàn cảnh" onClick={resetView}>⟲</button>
                    </div>

                    {/* Active Dijkstra Route Floating Card */}
                    {activeRoute && (
                        <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 10, background: 'rgba(15, 23, 42, 0.94)', color: '#F8FAFC', padding: '12px 16px', borderRadius: '14px', backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', maxWidth: '380px', border: '1px solid rgba(255,255,255,0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ fontSize: '1.6rem', marginTop: '2px' }}>🚶‍♂️</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Lộ trình Dijkstra thực tế từ <strong>{activeRoute.startNode?.name?.split('(')[0]?.trim()}</strong>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFFFFF', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        ➔ {activeRoute.destinationName}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#38BDF8', marginTop: '4px', display: 'flex', gap: '10px' }}>
                                        <span>Cự ly: <strong>{activeRoute.totalDistanceM} mét</strong></span>
                                        <span>•</span>
                                        <span>Thời gian: <strong>~{activeRoute.timeMin} phút</strong></span>
                                    </div>
                                </div>
                                <button 
                                    className="btn btn-icon btn-sm" 
                                    style={{ color: '#94A3B8', fontSize: '1rem' }}
                                    onClick={() => setActiveRoute(null)}
                                    title="Đóng lộ trình"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Waypoint details toggle */}
                            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                    onClick={() => setShowWaypointsList(!showWaypointsList)}
                                    style={{ background: 'transparent', border: 'none', color: '#FCD34D', fontSize: '0.75rem', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                                >
                                    {showWaypointsList ? '▲ Thu gọn các trạm dừng' : '▼ Xem chi tiết từng chặng đi'}
                                </button>
                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                    {activeRoute.pathNodes.length} điểm mốc
                                </span>
                            </div>

                            {/* Waypoints List Dropdown */}
                            {showWaypointsList && (
                                <div style={{ marginTop: '8px', maxHeight: '140px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px' }}>
                                    <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.75rem', color: '#CBD5E1' }}>
                                        {activeRoute.waypoints.map((step, idx) => (
                                            <li key={idx} style={{ marginBottom: '4px', color: idx === activeRoute.waypoints.length - 1 ? '#38BDF8' : '#CBD5E1', fontWeight: idx === activeRoute.waypoints.length - 1 ? 800 : 400 }}>
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SVG Map Canvas (Responsive, Scalable, Crisp) */}
                    <svg 
                        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                        style={{ width: '100%', height: 'auto', minHeight: '520px', maxHeight: '720px', background: '#F4FBF6', display: 'block', cursor: 'grab' }}
                    >
                        <defs>
                            {/* Gradients */}
                            <linearGradient id="lakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.75" />
                            </linearGradient>
                            <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                                <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.7" />
                            </radialGradient>
                            <radialGradient id="plazaGradient" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.95" />
                                <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.6" />
                            </radialGradient>
                            {/* Bridge wood pattern */}
                            <pattern id="bridgePlank" width="10" height="10" patternUnits="userSpaceOnUse">
                                <rect width="10" height="10" fill="#D97706" />
                                <line x1="0" y1="0" x2="0" y2="10" stroke="#B45309" strokeWidth="1" />
                            </pattern>
                        </defs>

                        {/* 1. TERRAIN BASE LAYER */}
                        <rect x="0" y="0" width="1000" height="700" fill="#F4FBF6" />
                        
                        {/* Decorative Natural Forest Patches */}
                        <circle cx="100" cy="80" r="75" fill="#E2F2E9" opacity="0.7" />
                        <circle cx="890" cy="90" r="95" fill="#E2F2E9" opacity="0.7" />
                        <circle cx="80" cy="580" r="85" fill="#E2F2E9" opacity="0.7" />
                        <circle cx="920" cy="570" r="75" fill="#E2F2E9" opacity="0.7" />

                        {/* Central Scenic Lake (Hồ Cảnh Quan Sinh Thái) */}
                        <path 
                            d="M 330 330 C 370 290, 470 300, 490 350 C 510 400, 450 440, 390 430 C 330 420, 290 370, 330 330 Z" 
                            fill="url(#lakeGradient)" 
                            stroke="#0284C7" 
                            strokeWidth="2.5" 
                            strokeDasharray="4 2"
                        />
                        <text x="400" y="380" fill="#0369A1" fontSize="12" fontWeight="800" textAnchor="middle" opacity="0.85">
                            🌊 Hồ Cảnh Quan (Eco Lake)
                        </text>

                        {/* 2. REALISTIC WALKWAY NETWORK (MẠNG LƯỚI ĐƯỜNG ĐI THỰC TẾ THEO ĐỒ THỊ) */}
                        {/* Outer Road Base (Sub-base foundation) */}
                        <g stroke="#E2E8F0" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none">
                            {WALKWAY_EDGES.map(([u, v], i) => {
                                const nodeU = WALKWAY_NODES[u];
                                const nodeV = WALKWAY_NODES[v];
                                if (!nodeU || !nodeV) return null;
                                return <line key={`base-${i}`} x1={nodeU.x} y1={nodeU.y} x2={nodeV.x} y2={nodeV.y} />;
                            })}
                        </g>

                        {/* Inner Paved Walkway Surface */}
                        <g stroke="#FFFFFF" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none">
                            {WALKWAY_EDGES.map(([u, v], i) => {
                                const nodeU = WALKWAY_NODES[u];
                                const nodeV = WALKWAY_NODES[v];
                                if (!nodeU || !nodeV) return null;
                                return <line key={`pave-${i}`} x1={nodeU.x} y1={nodeU.y} x2={nodeV.x} y2={nodeV.y} />;
                            })}
                        </g>

                        {/* Paved Centerline Guide */}
                        <g stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="6 6" strokeLinecap="round" fill="none">
                            {WALKWAY_EDGES.map(([u, v], i) => {
                                const nodeU = WALKWAY_NODES[u];
                                const nodeV = WALKWAY_NODES[v];
                                if (!nodeU || !nodeV) return null;
                                return <line key={`center-${i}`} x1={nodeU.x} y1={nodeU.y} x2={nodeV.x} y2={nodeV.y} />;
                            })}
                        </g>

                        {/* Scenic Lake Wooden Bridge */}
                        <g>
                            <line 
                                x1={WALKWAY_NODES.n_bridge_west.x} 
                                y1={WALKWAY_NODES.n_bridge_west.y} 
                                x2={WALKWAY_NODES.n_bridge_east.x} 
                                y2={WALKWAY_NODES.n_bridge_east.y} 
                                stroke="#B45309" 
                                strokeWidth="20" 
                                strokeLinecap="butt"
                            />
                            <line 
                                x1={WALKWAY_NODES.n_bridge_west.x} 
                                y1={WALKWAY_NODES.n_bridge_west.y} 
                                x2={WALKWAY_NODES.n_bridge_east.x} 
                                y2={WALKWAY_NODES.n_bridge_east.y} 
                                stroke="#FDE68A" 
                                strokeWidth="14" 
                                strokeLinecap="butt"
                            />
                            <text x="400" y="335" fill="#78350F" fontSize="9" fontWeight="800" textAnchor="middle">
                                🌉 Cầu Gỗ Ven Hồ
                            </text>
                        </g>

                        {/* Major Junction Plazas */}
                        {/* Central Plaza */}
                        <circle cx={WALKWAY_NODES.n_central_plaza.x} cy={WALKWAY_NODES.n_central_plaza.y} r="34" fill="url(#plazaGradient)" stroke="#F59E0B" strokeWidth="2" />
                        <text x={WALKWAY_NODES.n_central_plaza.x} y={WALKWAY_NODES.n_central_plaza.y + 4} fill="#92400E" fontSize="9.5" fontWeight="800" textAnchor="middle">
                            Quảng Trường
                        </text>

                        {/* North Hub Plaza */}
                        <circle cx={WALKWAY_NODES.n_north_hub.x} cy={WALKWAY_NODES.n_north_hub.y} r="26" fill="url(#hubGradient)" stroke="#94A3B8" strokeWidth="1.5" />
                        <text x={WALKWAY_NODES.n_north_hub.x} y={WALKWAY_NODES.n_north_hub.y + 3} fill="#475569" fontSize="8.5" fontWeight="700" textAnchor="middle">
                            Vòng Xoay Bắc
                        </text>

                        {/* East Service Hub */}
                        <circle cx={WALKWAY_NODES.n_se_plaza.x} cy={WALKWAY_NODES.n_se_plaza.y} r="24" fill="url(#hubGradient)" stroke="#94A3B8" strokeWidth="1.5" />
                        <text x={WALKWAY_NODES.n_se_plaza.x} y={WALKWAY_NODES.n_se_plaza.y + 3} fill="#475569" fontSize="8" fontWeight="700" textAnchor="middle">
                            Khu Dịch Vụ
                        </text>

                        {/* 3. ACTIVE DIJKSTRA ROUTE OVERLAY */}
                        {activeRoute && (
                            <g>
                                {/* Shadow/Glow under path */}
                                <path 
                                    d={activeRoute.pathD}
                                    fill="none"
                                    stroke="#EA580C"
                                    strokeWidth="11"
                                    strokeOpacity="0.3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {/* Main animated dash road path */}
                                <path 
                                    d={activeRoute.pathD}
                                    fill="none"
                                    stroke="#EA580C"
                                    strokeWidth="5.5"
                                    strokeDasharray="10 6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <animate attributeName="stroke-dashoffset" values="32;0" dur="1.2s" repeatCount="indefinite" />
                                </path>
                                {/* Waypoint milestone dots along Dijkstra path */}
                                {activeRoute.pathNodes.map((p, idx) => (
                                    <circle 
                                        key={`wp-${idx}`} 
                                        cx={p.x} 
                                        cy={p.y} 
                                        r={idx === 0 || idx === activeRoute.pathNodes.length - 1 ? 6 : 3.5} 
                                        fill={idx === activeRoute.pathNodes.length - 1 ? '#DC2626' : (idx === 0 ? '#16A34A' : '#FFFFFF')} 
                                        stroke="#0F172A" 
                                        strokeWidth="1.5" 
                                    />
                                ))}
                            </g>
                        )}

                        {/* 4. AREA TERRITORIES (LEVEL 1: PHÂN KHU TỔNG THỂ) */}
                        {filteredAreas.map(area => {
                            const isSelected = selectedAreaId === area.areaId;
                            const radius = Math.max(75, Math.min(130, (area.radiusMeters || 60) * 1.4));

                            return (
                                <g 
                                    key={area.areaId} 
                                    onClick={() => handleSelectArea(area)}
                                    style={{ cursor: 'pointer', transition: 'all 200ms ease' }}
                                >
                                    {/* Area Territory Circle */}
                                    <circle 
                                        cx={area.mapX} 
                                        cy={area.mapY} 
                                        r={radius}
                                        fill={area.color}
                                        fillOpacity={isSelected ? 0.22 : 0.12}
                                        stroke={area.color}
                                        strokeWidth={isSelected ? 3 : 1.5}
                                        strokeDasharray={isSelected ? "none" : "6 4"}
                                    />

                                    {/* Selected Area Highlight Pulse */}
                                    {isSelected && (
                                        <circle 
                                            cx={area.mapX} 
                                            cy={area.mapY} 
                                            r={radius + 8}
                                            fill="none"
                                            stroke={area.color}
                                            strokeWidth="2"
                                            opacity="0.6"
                                        >
                                            <animate attributeName="r" values={`${radius};${radius + 14};${radius}`} dur="2.4s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.4s" repeatCount="indefinite" />
                                        </circle>
                                    )}

                                    {/* Area Label Tag (Positioned cleanly above perimeter) */}
                                    <g transform={`translate(${area.mapX}, ${area.mapY - radius - 14})`}>
                                        <rect 
                                            x="-90" 
                                            y="-14" 
                                            width="180" 
                                            height="28" 
                                            rx="14" 
                                            fill="#FFFFFF" 
                                            stroke={area.color} 
                                            strokeWidth="2" 
                                            filter="drop-shadow(0 2px 6px rgba(0,0,0,0.12))"
                                        />
                                        <text 
                                            x="0" 
                                            y="4" 
                                            fill="#0F172A" 
                                            fontSize="11" 
                                            fontWeight="800" 
                                            textAnchor="middle"
                                        >
                                            Khu {area.code} • {(area.nameVi || area.name || '').replace(/^Khu\s+/i, '')}
                                        </text>
                                    </g>
                                </g>
                            );
                        })}

                        {/* 5. ENCLOSURE NODES / PINS (LEVEL 2: CHUỒNG TRẠI CỤ THỂ) */}
                        {filteredEnclosuresList.map((enc, idx) => {
                            const isSelected = selectedEnclosureId === enc.enclosureId;
                            const isParentAreaSelected = selectedAreaId === enc.areaId;
                            const isHovered = hoveredEnclosureId === enc.enclosureId;
                            const icon = getEnclosureIcon(enc.name, enc.areaCode);

                            // Stagger Y offsets: alternating above and below to prevent horizontal label collision
                            const isAbove = (idx % 2 === 0);
                            const offsetY = isAbove ? -26 : 28;

                            // Show label if selected, hovered, or parent area is selected
                            const showLabel = isSelected || isHovered || isParentAreaSelected;

                            return (
                                <g 
                                    key={enc.enclosureId}
                                    transform={`translate(${enc.mapX}, ${enc.mapY})`}
                                    onMouseEnter={() => setHoveredEnclosureId(enc.enclosureId)}
                                    onMouseLeave={() => setHoveredEnclosureId(null)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectEnclosure(enc);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Selection Glow Pulse */}
                                    {isSelected && (
                                        <circle cx="0" cy="0" r="28" fill="#F59E0B" fillOpacity="0.3">
                                            <animate attributeName="r" values="22;32;22" dur="1.8s" repeatCount="indefinite" />
                                        </circle>
                                    )}

                                    {/* Pin Marker Background */}
                                    <circle 
                                        cx="0" 
                                        cy="0" 
                                        r={isSelected ? 20 : 16} 
                                        fill={isSelected ? '#F59E0B' : (isHovered ? '#FEF3C7' : '#FFFFFF')} 
                                        stroke={isSelected ? '#B45309' : (isHovered ? '#D97706' : enc.color)} 
                                        strokeWidth={isSelected ? 3 : 2.5}
                                        filter="drop-shadow(0 3px 6px rgba(0,0,0,0.18))"
                                    />

                                    {/* Enclosure Icon */}
                                    <text 
                                        x="0" 
                                        y={isSelected ? 6 : 5} 
                                        fontSize={isSelected ? "17" : "14"} 
                                        textAnchor="middle"
                                    >
                                        {icon}
                                    </text>

                                    {/* Resident Animal Count Badge */}
                                    <g transform="translate(12, -12)">
                                        <circle cx="0" cy="0" r="9" fill="#15803D" stroke="#FFFFFF" strokeWidth="1.5" />
                                        <text x="0" y="3.5" fill="#FFFFFF" fontSize="9" fontWeight="800" textAnchor="middle">
                                            {enc.animalCount}
                                        </text>
                                    </g>

                                    {/* Non-overlapping Staggered Enclosure Name Badge */}
                                    {showLabel && (
                                        <g transform={`translate(0, ${offsetY})`}>
                                            <rect 
                                                x="-65" 
                                                y="-10" 
                                                width="130" 
                                                height="20" 
                                                rx="6" 
                                                fill={isSelected ? '#0F172A' : (isHovered ? '#1E293B' : '#FFFFFF')} 
                                                stroke={isSelected ? '#F59E0B' : (isHovered ? '#F59E0B' : '#CBD5E1')} 
                                                strokeWidth="1.2"
                                                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                                            />
                                            <text 
                                                x="0" 
                                                y="4" 
                                                fill={isSelected || isHovered ? '#F8FAFC' : '#1E293B'} 
                                                fontSize="9.5" 
                                                fontWeight="700" 
                                                textAnchor="middle"
                                            >
                                                {enc.name}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}

                        {/* 6. CURRENT SELECTED START POINT PIN */}
                        <g transform={`translate(${currentStartPoint.x}, ${currentStartPoint.y})`}>
                            {/* Pulse */}
                            <circle cx="0" cy="0" r="22" fill="#16A34A" fillOpacity="0.2">
                                <animate attributeName="r" values="18;28;18" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="0" cy="0" r="16" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2.5" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.3))" />
                            <text x="0" y="5" fontSize="12" textAnchor="middle">📍</text>
                            <rect x="-65" y="22" width="130" height="20" rx="5" fill="#0F172A" />
                            <text x="0" y="36" fill="#F8FAFC" fontSize="9" fontWeight="700" textAnchor="middle">
                                {currentStartPoint.name.split('(')[0]?.trim()}
                            </text>
                        </g>
                    </svg>

                    {/* Bottom Legend */}
                    <div style={{ padding: '10px 16px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', color: '#64748B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#15803D' }}></span>
                                <strong>Vùng phân khu (Area)</strong>
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFFFFF', border: '2px solid #0284C7' }}></span>
                                <strong>Điểm chuồng trại (Enclosure)</strong>
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#15803D' }}></span>
                                Số cá thể trong chuồng
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#16A34A' }}></span>
                                Điểm xuất phát
                            </span>
                        </div>
                        <div>
                            Dẫn đường Dijkstra theo mạng lưới đường bộ thực tế
                        </div>
                    </div>
                </div>

                {/* RIGHT: HIERARCHICAL DETAIL PANEL (SỞ THÚ -> KHU VỰC -> CHUỒNG -> ĐỘNG VẬT) */}
                <div className={`map-detail-sidebar ${mobileTab !== 'details' ? 'mobile-hidden' : ''}`} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxHeight: '720px', overflowY: 'auto' }}>
                    
                    {/* BREADCRUMB NAVIGATION */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748B', marginBottom: '14px', flexWrap: 'wrap' }}>
                        <span 
                            style={{ cursor: 'pointer', fontWeight: !selectedAreaId ? 800 : 500, color: !selectedAreaId ? '#15803D' : '#64748B' }}
                            onClick={handleBackToZoo}
                        >
                            🌐 Toàn Sở Thú
                        </span>
                        {currentSelectedArea && (
                            <>
                                <span>›</span>
                                <span 
                                    style={{ cursor: 'pointer', fontWeight: selectedAreaId && !selectedEnclosureId ? 800 : 500, color: selectedAreaId && !selectedEnclosureId ? currentSelectedArea.color : '#64748B' }}
                                    onClick={handleBackToArea}
                                >
                                    Khu {currentSelectedArea.code}
                                </span>
                            </>
                        )}
                        {currentSelectedEnclosure && (
                            <>
                                <span>›</span>
                                <span style={{ fontWeight: 800, color: '#F59E0B' }}>
                                    {currentSelectedEnclosure.name}
                                </span>
                            </>
                        )}
                    </nav>

                    {/* VIEW LEVEL 0: TOÀN CẢNH SỞ THÚ (ZOO OVERVIEW) */}
                    {!selectedAreaId && (
                        <div>
                            <div style={{ padding: '14px', borderRadius: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', marginBottom: '16px' }}>
                                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#166534' }}>
                                    Tổng Quan Vườn Thú ZooGuide
                                </h4>
                                <p style={{ margin: '6px 0 10px 0', fontSize: '0.82rem', color: '#15803D' }}>
                                    Hệ sinh thái bảo tồn đa dạng với các phân khu tự nhiên, hệ thống chuồng trại hiện đại và các cá thể quý hiếm.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                                    <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803D' }}>{enrichedAreas.length}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Phân Khu</div>
                                    </div>
                                    <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284C7' }}>{enclosures.length}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Chuồng Trại</div>
                                    </div>
                                    <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#B45309' }}>{animals.length}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Cá Thể Thú</div>
                                    </div>
                                </div>
                            </div>

                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
                                Danh Sách Phân Khu (Bấm để khám phá):
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {enrichedAreas.map(area => (
                                    <div 
                                        key={area.areaId}
                                        onClick={() => handleSelectArea(area)}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            border: '1px solid #E2E8F0',
                                            borderLeft: `5px solid ${area.color}`,
                                            background: '#FFFFFF',
                                            cursor: 'pointer',
                                            transition: 'all 150ms ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span className="chip chip-sm font-bold" style={{ background: `${area.color}15`, color: area.color }}>
                                                    Khu {area.code}
                                                </span>
                                                <strong style={{ marginLeft: '6px', fontSize: '0.95rem' }}>{area.nameVi || area.name}</strong>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>➔</span>
                                        </div>
                                        <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                                            {area.descriptionVi || area.description || "Khu bảo tồn động vật."}
                                        </p>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.75rem', color: '#475569' }}>
                                            <span>🏠 <strong>{area.enclosureCount}</strong> chuồng</span>
                                            <span>🐾 <strong>{area.animalCount}</strong> cá thể thú</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VIEW LEVEL 1: KHU VỰC ĐƯỢC CHỌN (AREA SELECTED -> SHOW ENCLOSURES) */}
                    {currentSelectedArea && !currentSelectedEnclosure && (
                        <div>
                            {/* Area Header Card */}
                            <div style={{ padding: '14px', borderRadius: '12px', background: `${currentSelectedArea.color}10`, border: `1px solid ${currentSelectedArea.color}40`, marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span className="chip chip-sm font-bold" style={{ background: currentSelectedArea.color, color: '#FFFFFF' }}>
                                            Khu Vực {currentSelectedArea.code}
                                        </span>
                                        <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                                            {currentSelectedArea.nameVi || currentSelectedArea.name}
                                        </h3>
                                    </div>
                                    <button 
                                        className="btn btn-sm btn-outline" 
                                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                        onClick={handleBackToZoo}
                                    >
                                        ✕ Toàn cảnh
                                    </button>
                                </div>
                                <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: '#475569' }}>
                                    {currentSelectedArea.descriptionVi || currentSelectedArea.description}
                                </p>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '0.8rem', fontWeight: 600 }}>
                                    <span>🏠 {currentSelectedArea.enclosureCount} Chuồng trại</span>
                                    <span>🐾 {currentSelectedArea.animalCount} Cá thể động vật</span>
                                </div>
                            </div>

                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
                                Các Chuồng Trại Thuộc Khu {currentSelectedArea.code}:
                            </h4>

                            {/* Enclosures List in this Area */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {currentSelectedArea.enclosures.map(enc => {
                                    const residentAnimals = animals.filter(a => a.enclosureId === (enc.enclosureId || enc.id));
                                    const icon = getEnclosureIcon(enc.name, currentSelectedArea.code);

                                    return (
                                        <div 
                                            key={enc.enclosureId || enc.id}
                                            onClick={() => handleSelectEnclosure(enc)}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid #E2E8F0',
                                                background: '#FFFFFF',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                gap: '12px',
                                                alignItems: 'center',
                                                transition: 'all 150ms ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                                        >
                                            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${currentSelectedArea.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                                                {icon}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>{enc.name}</strong>
                                                    <span className="font-mono text-xs text-muted font-bold">{enc.code}</span>
                                                </div>
                                                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {enc.description || "Khuôn viên chăm sóc đạt chuẩn thế giới."}
                                                </p>
                                                <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#15803D', fontWeight: 600 }}>
                                                    🐾 {residentAnimals.length} cá thể động vật sinh sống
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>➔</span>
                                        </div>
                                    );
                                })}

                                {currentSelectedArea.enclosures.length === 0 && (
                                    <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', background: '#F8FAFC', borderRadius: '12px' }}>
                                        Khu vực này hiện chưa thiết lập chuồng trại nào.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* VIEW LEVEL 2: CHUỒNG ĐƯỢC CHỌN (ENCLOSURE SELECTED -> SHOW ANIMALS) */}
                    {currentSelectedEnclosure && (
                        <div>
                            {/* Enclosure Header Card */}
                            <div style={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '16px', background: '#FFFFFF' }}>
                                {currentSelectedEnclosure.imageUrl && (
                                    <img 
                                        src={currentSelectedEnclosure.imageUrl} 
                                        alt={currentSelectedEnclosure.name}
                                        style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                                    />
                                )}
                                <div style={{ padding: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <span className="chip chip-sm font-bold" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                                                {currentSelectedEnclosure.areaName} ({currentSelectedEnclosure.code})
                                            </span>
                                            <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                                                {currentSelectedEnclosure.name}
                                            </h3>
                                        </div>
                                        <button 
                                            className="btn btn-sm btn-outline" 
                                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                            onClick={handleBackToArea}
                                        >
                                            ← Quay lại khu
                                        </button>
                                    </div>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: '#475569' }}>
                                        {currentSelectedEnclosure.description || "Khuôn viên nuôi dưỡng động vật hiện đại đạt chuẩn phúc lợi động vật thế giới."}
                                    </p>
                                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span className="badge badge-success">
                                            {currentSelectedEnclosure.status === 'Active' ? 'Đang hoạt động' : 'Bảo trì'}
                                        </span>
                                        <span className="font-bold text-primary">
                                            {currentSelectedEnclosure.residentAnimals.length} Cá thể đang sinh sống
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Animals Living in this Enclosure */}
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
                                Động Vật Trong Chuồng Này ({currentSelectedEnclosure.residentAnimals.length}):
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {currentSelectedEnclosure.residentAnimals.map(animal => (
                                    <div 
                                        key={animal.id || animal.animalId}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid #E2E8F0',
                                            background: '#FFFFFF',
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <img 
                                            src={animal.imageUrl || "https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=400&q=80"} 
                                            alt={animal.nameVi || animal.name}
                                            style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                                                    {animal.nameVi || animal.name}
                                                </strong>
                                                <span className="font-mono text-xs text-muted font-bold">{animal.code}</span>
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#0369A1', fontWeight: 600 }}>
                                                {animal.species}
                                                {animal.scientificName && <span style={{ color: '#64748B', fontWeight: 400 }}> • <em>{animal.scientificName}</em></span>}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: '#16A34A', marginTop: '2px' }}>
                                                ✓ Sức khỏe: {animal.healthStatus || "Tốt"}
                                            </div>

                                            {/* Action Buttons: Details & Narration */}
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                                <button 
                                                    className="btn btn-sm btn-outline"
                                                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                                    onClick={() => onOpenDetail && onOpenDetail(animal)}
                                                >
                                                    🔍 Xem chi tiết
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-primary"
                                                    style={{ padding: '3px 8px', fontSize: '0.75rem', background: '#D97706', borderColor: '#D97706' }}
                                                    onClick={() => {
                                                        if (onPlayAudio) {
                                                            onPlayAudio(animal.id || animal.animalId);
                                                        } else if (onOpenSpeciesNarration && animal.speciesId) {
                                                            onOpenSpeciesNarration(animal.speciesId);
                                                        }
                                                    }}
                                                >
                                                    🎧 Thuyết minh
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {currentSelectedEnclosure.residentAnimals.length === 0 && (
                                    <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', background: '#F8FAFC', borderRadius: '12px' }}>
                                        Chuồng hiện chưa có cá thể động vật sinh sống.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
