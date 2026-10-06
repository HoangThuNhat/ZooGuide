import React, { useState } from 'react';
import { MOCK_DB } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function MapTab({ onPlayAudio, onOpenDetail }) {
    const { 
        hasActiveSession, 
        setIsTicketModalOpen, 
        showToast, 
        setFilterZone, 
        switchTab,
        navTargetAnimal,
        setNavTargetAnimal
    } = useApp();

    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
    const [selectedAnimalPin, setSelectedAnimalPin] = useState(null);
    const [activeRoute, setActiveRoute] = useState(null);

    const userLocation = { x: 400, y: 550, name: "Cổng Vào Chính (Main Entrance)" };

    const zones = MOCK_DB.areas;
    const animals = MOCK_DB.animals;

    const zoom = (factor) => {
        setViewBox(prev => {
            const newW = prev.width * factor;
            const newH = prev.height * factor;
            if (newW > 250 && newW < 1200) {
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

    const handleSelectAnimal = (animal) => {
        setSelectedAnimalPin(animal);
    };

    const handleNavigate = (animal) => {
        if (!hasActiveSession) {
            setIsTicketModalOpen(true);
            showToast("Vui lòng kích hoạt vé để sử dụng tính năng Dẫn Đường Thông Minh!", "warning");
            return;
        }

        const start = userLocation;
        const target = { x: animal.mapX, y: animal.mapY };

        let waypoints = [
            `${start.x} ${start.y}`,
            `400 460`,
            `370 280`,
            `${target.x} ${target.y}`
        ];

        if (animal.zoneCode === 'A') {
            waypoints = [`${start.x} ${start.y}`, `400 460`, `370 280`, `220 180`, `${target.x} ${target.y}`];
        } else if (animal.zoneCode === 'B') {
            waypoints = [`${start.x} ${start.y}`, `400 460`, `370 280`, `520 160`, `${target.x} ${target.y}`];
        } else if (animal.zoneCode === 'C') {
            waypoints = [`${start.x} ${start.y}`, `400 460`, `520 410`, `${target.x} ${target.y}`];
        } else if (animal.zoneCode === 'D') {
            waypoints = [`${start.x} ${start.y}`, `400 460`, `230 440`, `${target.x} ${target.y}`];
        }

        const pathD = `M ${waypoints.join(' L ')}`;
        const distanceM = Math.floor(150 + Math.random() * 200);
        const timeMin = Math.ceil(distanceM / 65);

        setActiveRoute({
            animal,
            pathD,
            start,
            distanceM,
            timeMin
        });

        setSelectedAnimalPin(animal);
        showToast(`Đã thiết lập lộ trình đến ${animal.nameVi}`, "info");
    };

    const handleClearRoute = () => {
        setActiveRoute(null);
    };

    const handleZoneLegendClick = (zoneId) => {
        setFilterZone(zoneId);
        switchTab('animals');
    };

    return (
        <section id="tab-pane-map" className="tab-content-pane">
            <div className="map-view-wrapper">
                {/* Map Toolbar */}
                <div className="map-toolbar">
                    <div>
                        <h3 className="text-base font-bold">Bản Đồ Sở Thú Tương Tác</h3>
                        <p className="text-xs text-muted">Nhấn vào từng khu vực hoặc con vật để nghe thuyết minh & nhận chỉ dẫn đường đi</p>
                    </div>

                    <div className="map-zones-legend">
                        <button className="legend-chip" onClick={() => handleZoneLegendClick('zone-a')}>
                            <span className="legend-dot" style={{ background: '#15803D' }}></span>
                            <span>Khu A: Linh Trưởng</span>
                        </button>
                        <button className="legend-chip" onClick={() => handleZoneLegendClick('zone-b')}>
                            <span className="legend-dot" style={{ background: '#B45309' }}></span>
                            <span>Khu B: Ăn Thịt</span>
                        </button>
                        <button className="legend-chip" onClick={() => handleZoneLegendClick('zone-c')}>
                            <span className="legend-dot" style={{ background: '#059669' }}></span>
                            <span>Khu C: Thảo Nguyên</span>
                        </button>
                        <button className="legend-chip" onClick={() => handleZoneLegendClick('zone-d')}>
                            <span className="legend-dot" style={{ background: '#0284C7' }}></span>
                            <span>Khu D: Bò Sát & Thủy Cung</span>
                        </button>
                        <button className="legend-chip" onClick={() => handleZoneLegendClick('zone-e')}>
                            <span className="legend-dot" style={{ background: '#7C3AED' }}></span>
                            <span>Khu E: Chim Nhiệt Đới</span>
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
                                <h4>Đang dẫn đường đến: <strong>{activeRoute.animal.nameVi}</strong></h4>
                                <p className="dir-meta">
                                    Khoảng cách: <strong>{activeRoute.distanceM}m</strong> (~{activeRoute.timeMin} phút đi bộ) • {activeRoute.animal.zoneName}
                                </p>
                            </div>
                            <button className="btn btn-icon btn-sm" id="btn-cancel-route" aria-label="Hủy dẫn đường" onClick={handleClearRoute}>
                                ✕
                            </button>
                        </div>
                        <div className="directions-steps">
                            <div className="step-item">
                                <span className="step-dot"></span>
                                <p>Từ <strong>Cổng Vào</strong>, đi thẳng 90m qua Đại lộ Cây Xanh.</p>
                            </div>
                            <div className="step-item">
                                <span className="step-dot"></span>
                                <p>Rẽ theo hướng biển chỉ dẫn vào <strong>Khu vực {activeRoute.animal.zoneCode}</strong>.</p>
                            </div>
                            <div className="step-item step-item-target">
                                <span className="step-dot"></span>
                                <p>Đích đến: <strong>Chuồng số {activeRoute.animal.id} - {activeRoute.animal.nameVi}</strong> bên tay phải.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vector Map Canvas */}
                <div className="map-canvas-container">
                    <svg 
                        id="zoo-map-svg" 
                        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} 
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* Base Layer */}
                        <g id="map-base-layer">
                            <rect x="0" y="0" width="800" height="600" fill="#EBF4EE" rx="20"/>
                            <path d="M 330 220 C 370 200, 440 220, 460 270 C 470 320, 410 360, 360 350 C 310 340, 290 280, 330 220 Z" 
                                  fill="#CFEAF7" stroke="#A7D5ED" strokeWidth="3" opacity="0.9"/>
                            <text x="385" y="285" fontSize="11" fontWeight="600" fill="#0284C7" textAnchor="middle">Hồ Thiên Nga</text>

                            {/* Main Pathways */}
                            <path d="
                                M 400 550 L 400 460
                                L 400 370
                                M 400 460 L 230 440
                                M 400 460 L 520 410
                                M 400 370 L 370 280
                                M 370 280 L 220 180
                                M 370 280 L 520 160
                                M 220 180 L 330 130 L 520 160
                            " fill="none" stroke="#D1DECF" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>

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

                            {/* Amenities & Restrooms */}
                            <g transform="translate(430, 480)" className="amenity-pin">
                                <circle cx="0" cy="0" r="10" fill="#EA580C" opacity="0.9"/>
                                <text x="0" y="4" fontSize="9" fill="#FFF" textAnchor="middle" fontWeight="bold">☕</text>
                            </g>
                            <g transform="translate(370, 480)" className="amenity-pin">
                                <circle cx="0" cy="0" r="10" fill="#0284C7" opacity="0.9"/>
                                <text x="0" y="4" fontSize="9" fill="#FFF" textAnchor="middle" fontWeight="bold">✚</text>
                            </g>
                        </g>

                        {/* Zones Layer */}
                        <g id="map-zones-layer">
                            {zones.map(z => {
                                const { x, y, radius } = z.mapCoords;
                                return (
                                    <g key={z.id} className="zone-group" style={{ cursor: 'pointer' }} onClick={() => handleZoneLegendClick(z.id)}>
                                        <circle cx={x} cy={y} r={radius} fill={z.color} fillOpacity="0.12" stroke={z.color} strokeWidth="2" strokeDasharray="6,4"/>
                                        <circle cx={x} cy={y} r={radius - 12} fill={z.color} fillOpacity="0.04"/>
                                        <rect x={x - 55} y={y - radius - 14} width="110" height="22" rx="11" fill={z.color} filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>
                                        <text x={x} y={y - radius} fontSize="10" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
                                            KHU {z.code}: {z.nameVi.split(' ')[1] || z.nameVi}
                                        </text>
                                    </g>
                                );
                            })}
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

                        {/* Animal Pins Layer */}
                        <g id="map-pins-layer">
                            {animals.map(a => {
                                const isSelected = selectedAnimalPin && selectedAnimalPin.id === a.id;
                                return (
                                    <g 
                                        key={a.id} 
                                        className={`animal-pin ${isSelected ? 'pin-active' : ''}`}
                                        transform={`translate(${a.mapX}, ${a.mapY})`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectAnimal(a);
                                        }}
                                    >
                                        <circle className="pin-pulse" cx="0" cy="0" r="18" fill="#15803D" opacity="0.2"/>
                                        <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#15803D" strokeWidth="3" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.2))"/>
                                        <circle cx="0" cy="0" r="10" fill="#15803D"/>
                                        <text x="0" y="3.5" fontSize="8" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">{a.id}</text>
                                        
                                        <g className="pin-label-group" transform="translate(0, -22)">
                                            <rect x="-45" y="-12" width="90" height="18" rx="9" fill="#0F172A" opacity="0.85"/>
                                            <text x="0" y="0.5" fontSize="9" fontWeight="600" fill="#FFFFFF" textAnchor="middle">
                                                {a.nameVi.split(' ')[0]} {a.nameVi.split(' ')[1] || ''}
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

                    {/* Map Animal Callout Card */}
                    {selectedAnimalPin && (
                        <div id="map-callout-card" className="map-callout-card">
                            <div className="map-callout-content">
                                <button className="callout-close" id="btn-close-callout" aria-label="Đóng popup" onClick={() => setSelectedAnimalPin(null)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                                <div className="callout-header">
                                    <img src={selectedAnimalPin.imageUrl} alt={selectedAnimalPin.nameVi} className="callout-thumb"/>
                                    <div>
                                        <span className="callout-badge">{selectedAnimalPin.zoneName}</span>
                                        <h4 className="callout-title">{selectedAnimalPin.nameVi}</h4>
                                        <p className="callout-subtitle">{selectedAnimalPin.scientificName}</p>
                                    </div>
                                </div>
                                <div className="callout-actions">
                                    <button className="btn btn-sm btn-primary" id="btn-callout-navigate" onClick={() => handleNavigate(selectedAnimalPin)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                        </svg>
                                        <span>Dẫn đường tới đây</span>
                                    </button>
                                    <button className="btn btn-sm btn-accent" id="btn-callout-audio" onClick={() => {
                                        if (onPlayAudio) onPlayAudio(selectedAnimalPin.id);
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                        <span>Nghe thuyết minh</span>
                                    </button>
                                    <button className="btn btn-sm btn-secondary" id="btn-callout-detail" onClick={() => {
                                        if (onOpenDetail) onOpenDetail(selectedAnimalPin);
                                    }}>
                                        <span>Chi tiết</span>
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
