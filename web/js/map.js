/**
 * ZooGuide - Interactive Vector Map & Wayfinding Engine
 * Features: Biome Zones, Animal Pins, Pan/Zoom, Turn-by-Turn Navigation Routing
 */

const ZooMap = {
    svg: null,
    viewBox: { x: 0, y: 0, width: 800, height: 600 },
    currentZoom: 1,
    isPanning: false,
    startPoint: { x: 0, y: 0 },
    userLocation: { x: 400, y: 550, name: "Cổng Vào Chính (Main Entrance)" },
    activeTargetAnimal: null,
    activeRoute: null,

    init() {
        this.svg = document.getElementById('zoo-map-svg');
        if (!this.svg) return;

        this.renderMapBase();
        this.renderZones();
        this.renderAnimalPins();
        this.bindControls();
    },

    renderMapBase() {
        // SVG paths for pathways, lakes, and entrance
        const baseLayer = document.getElementById('map-base-layer');
        if (!baseLayer) return;

        baseLayer.innerHTML = `
            <!-- Background Landscape Grid -->
            <rect x="0" y="0" width="800" height="600" fill="#EBF4EE" rx="20"/>
            
            <!-- Central Lake / Laguna -->
            <path d="M 330 220 C 370 200, 440 220, 460 270 C 470 320, 410 360, 360 350 C 310 340, 290 280, 330 220 Z" 
                  fill="#CFEAF7" stroke="#A7D5ED" stroke-width="3" opacity="0.9"/>
            <text x="385" y="285" font-size="11" font-weight="600" fill="#0284C7" text-anchor="middle">Hồ Thiên Nga</text>

            <!-- Main Pathways -->
            <path id="path-network" d="
                M 400 550 L 400 460
                L 400 370
                M 400 460 L 230 440
                M 400 460 L 520 410
                M 400 370 L 370 280
                M 370 280 L 220 180
                M 370 280 L 520 160
                M 220 180 L 330 130 L 520 160
            " fill="none" stroke="#D1DECF" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>

            <path d="
                M 400 550 L 400 460
                L 400 370
                M 400 460 L 230 440
                M 400 460 L 520 410
                M 400 370 L 370 280
                M 370 280 L 220 180
                M 370 280 L 520 160
                M 220 180 L 330 130 L 520 160
            " fill="none" stroke="#FAF8F5" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>

            <!-- Entrance Gate -->
            <g transform="translate(400, 550)">
                <circle cx="0" cy="0" r="14" fill="#15803D" stroke="#FFFFFF" stroke-width="3" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"/>
                <circle cx="0" cy="0" r="5" fill="#FFFFFF"/>
                <text x="0" y="24" font-size="11" font-weight="700" fill="#15803D" text-anchor="middle">CỔNG VÀO CHÍNH</text>
            </g>

            <!-- Amenities & Restrooms -->
            <g transform="translate(430, 480)" class="amenity-pin" title="Khu ẩm thực & Nghỉ chân">
                <circle cx="0" cy="0" r="10" fill="#EA580C" opacity="0.9"/>
                <text x="0" y="4" font-size="9" fill="#FFF" text-anchor="middle" font-weight="bold">☕</text>
            </g>
            <g transform="translate(370, 480)" class="amenity-pin" title="Khu Vệ sinh WC & Sơ cấp cứu">
                <circle cx="0" cy="0" r="10" fill="#0284C7" opacity="0.9"/>
                <text x="0" y="4" font-size="9" fill="#FFF" text-anchor="middle" font-weight="bold">✚</text>
            </g>
        `;
    },

    renderZones() {
        const zoneLayer = document.getElementById('map-zones-layer');
        if (!zoneLayer) return;

        const zones = MOCK_DB.areas;
        zoneLayer.innerHTML = zones.map(z => {
            const { x, y, radius } = z.mapCoords;
            return `
                <g class="zone-group" data-zone-id="${z.id}" style="cursor: pointer;">
                    <circle cx="${x}" cy="${y}" r="${radius}" fill="${z.color}" fill-opacity="0.12" stroke="${z.color}" stroke-width="2" stroke-dasharray="6,4"/>
                    <circle cx="${x}" cy="${y}" r="${radius - 12}" fill="${z.color}" fill-opacity="0.04"/>
                    <rect x="${x - 55}" y="${y - radius - 14}" width="110" height="22" rx="11" fill="${z.color}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>
                    <text x="${x}" y="${y - radius}" font-size="10" font-weight="700" fill="#FFFFFF" text-anchor="middle">
                        KHU ${z.code}: ${z.nameVi.split(' ')[1] || z.nameVi}
                    </text>
                </g>
            `;
        }).join('');

        // Zone click to filter
        zoneLayer.querySelectorAll('.zone-group').forEach(group => {
            group.addEventListener('click', () => {
                const zoneId = group.getAttribute('data-zone-id');
                if (window.AnimalsModule) {
                    window.AnimalsModule.filterByZone(zoneId);
                }
            });
        });
    },

    renderAnimalPins() {
        const pinLayer = document.getElementById('map-pins-layer');
        if (!pinLayer) return;

        const animals = MOCK_DB.animals;
        pinLayer.innerHTML = animals.map(a => {
            return `
                <g class="animal-pin" data-id="${a.id}" transform="translate(${a.mapX}, ${a.mapY})" style="cursor: pointer;">
                    <!-- Pulse effect for selected/featured -->
                    <circle class="pin-pulse" cx="0" cy="0" r="18" fill="#15803D" opacity="0.2"/>
                    <!-- Pin Body -->
                    <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#15803D" stroke-width="3" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.2))"/>
                    <!-- Animal Initial / Badge -->
                    <circle cx="0" cy="0" r="10" fill="#15803D"/>
                    <text x="0" y="3.5" font-size="8" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${a.id}</text>
                    
                    <!-- Floating Label -->
                    <g class="pin-label-group" transform="translate(0, -22)">
                        <rect x="-45" y="-12" width="90" height="18" rx="9" fill="#0F172A" opacity="0.85"/>
                        <text x="0" y="0.5" font-size="9" font-weight="600" fill="#FFFFFF" text-anchor="middle">${a.nameVi.split(' ')[0]} ${a.nameVi.split(' ')[1] || ''}</text>
                    </g>
                </g>
            `;
        }).join('');

        // Pin Click
        pinLayer.querySelectorAll('.animal-pin').forEach(pin => {
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                const animalId = parseInt(pin.getAttribute('data-id'));
                this.selectAnimalPin(animalId);
            });
        });
    },

    selectAnimalPin(animalId) {
        const animal = MOCK_DB.animals.find(a => a.id === animalId);
        if (!animal) return;

        this.activeTargetAnimal = animal;

        // Highlight pin in SVG
        document.querySelectorAll('.animal-pin').forEach(p => {
            p.classList.remove('pin-active');
            if (parseInt(p.getAttribute('data-id')) === animalId) {
                p.classList.add('pin-active');
            }
        });

        // Show Map Callout Card
        this.showMapCallout(animal);
    },

    showMapCallout(animal) {
        const callout = document.getElementById('map-callout-card');
        if (!callout) return;

        callout.innerHTML = `
            <div class="map-callout-content">
                <button class="callout-close" id="btn-close-callout" aria-label="Đóng popup">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="callout-header">
                    <img src="${animal.imageUrl}" alt="${animal.nameVi}" class="callout-thumb"/>
                    <div>
                        <span class="callout-badge">${animal.zoneName}</span>
                        <h4 class="callout-title">${animal.nameVi}</h4>
                        <p class="callout-subtitle">${animal.scientificName}</p>
                    </div>
                </div>
                <div class="callout-actions">
                    <button class="btn btn-sm btn-primary" id="btn-callout-navigate" data-id="${animal.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                        </svg>
                        <span>Dẫn đường tới đây</span>
                    </button>
                    <button class="btn btn-sm btn-accent" id="btn-callout-audio" data-id="${animal.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <span>Nghe thuyết minh</span>
                    </button>
                    <button class="btn btn-sm btn-secondary" id="btn-callout-detail" data-id="${animal.id}">
                        <span>Chi tiết</span>
                    </button>
                </div>
            </div>
        `;

        callout.classList.remove('hidden');

        // Bind Callout Buttons
        document.getElementById('btn-close-callout').addEventListener('click', () => {
            callout.classList.add('hidden');
        });

        document.getElementById('btn-callout-navigate').addEventListener('click', () => {
            this.navigate(animal);
        });

        document.getElementById('btn-callout-audio').addEventListener('click', () => {
            if (window.AudioEngine) {
                window.AudioEngine.playAnimalAudio(animal.id);
            }
        });

        document.getElementById('btn-callout-detail').addEventListener('click', () => {
            if (window.AnimalsModule) {
                window.AnimalsModule.openDetailModal(animal.id);
            }
        });
    },

    // WAYFINDING & NAVIGATION ROUTING
    navigate(animal) {
        if (!TicketManager.hasActiveSession()) {
            TicketManager.openModal();
            if (window.ZooApp && window.ZooApp.showToast) {
                window.ZooApp.showToast("Vui lòng kích hoạt vé để sử dụng tính năng Dẫn Đường Thông Minh!", "warning");
            }
            return;
        }

        const routeLayer = document.getElementById('map-route-layer');
        const directionsCard = document.getElementById('map-directions-card');
        if (!routeLayer) return;

        // Waypoints path generation
        const start = this.userLocation;
        const target = { x: animal.mapX, y: animal.mapY };

        // Path routing interpolation via pathway nodes
        let waypoints = [
            `${start.x} ${start.y}`,
            `400 460`,
            `370 280`,
            `${target.x} ${target.y}`
        ];

        // Custom route according to zone
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

        routeLayer.innerHTML = `
            <!-- Shadow line -->
            <path d="${pathD}" fill="none" stroke="rgba(217, 119, 6, 0.3)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- Animated Dotted Dash Route -->
            <path id="active-routing-path" d="${pathD}" fill="none" stroke="#D97706" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 6" class="animated-route-dash"/>
            <!-- User location pulse -->
            <circle cx="${start.x}" cy="${start.y}" r="12" fill="#2563EB" opacity="0.3" class="pulse-beacon"/>
            <circle cx="${start.x}" cy="${start.y}" r="6" fill="#2563EB" stroke="#FFFFFF" stroke-width="2"/>
        `;

        // Calculate approximate distance
        const distanceM = Math.floor(150 + Math.random() * 200);
        const timeMin = Math.ceil(distanceM / 65);

        if (directionsCard) {
            directionsCard.innerHTML = `
                <div class="directions-header">
                    <div class="dir-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5">
                            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                        </svg>
                    </div>
                    <div class="dir-info">
                        <h4>Đang dẫn đường đến: <strong>${animal.nameVi}</strong></h4>
                        <p class="dir-meta">Khoảng cách: <strong>${distanceM}m</strong> (~${timeMin} phút đi bộ) • ${animal.zoneName}</p>
                    </div>
                    <button class="btn btn-icon btn-sm" id="btn-cancel-route" aria-label="Hủy dẫn đường">✕</button>
                </div>
                <div class="directions-steps">
                    <div class="step-item">
                        <span class="step-dot"></span>
                        <p>Từ <strong>Cổng Vào</strong>, đi thẳng 90m qua Đại lộ Cây Xanh.</p>
                    </div>
                    <div class="step-item">
                        <span class="step-dot"></span>
                        <p>Rẽ theo hướng biển chỉ dẫn vào <strong>Khu vực ${animal.zoneCode}</strong>.</p>
                    </div>
                    <div class="step-item step-item-target">
                        <span class="step-dot"></span>
                        <p>Đích đến: <strong>Chuồng số ${animal.id} - ${animal.nameVi}</strong> bên tay phải.</p>
                    </div>
                </div>
            `;
            directionsCard.classList.remove('hidden');

            document.getElementById('btn-cancel-route').addEventListener('click', () => {
                this.clearRoute();
            });
        }

        if (window.ZooApp && window.ZooApp.showToast) {
            window.ZooApp.showToast(`Đã thiết lập lộ trình đến ${animal.nameVi}`, "info");
        }
    },

    clearRoute() {
        const routeLayer = document.getElementById('map-route-layer');
        const directionsCard = document.getElementById('map-directions-card');
        if (routeLayer) routeLayer.innerHTML = '';
        if (directionsCard) directionsCard.classList.add('hidden');
    },

    bindControls() {
        const btnZoomIn = document.getElementById('map-zoom-in');
        const btnZoomOut = document.getElementById('map-zoom-out');
        const btnReset = document.getElementById('map-reset');

        if (btnZoomIn) {
            btnZoomIn.addEventListener('click', () => this.zoom(0.8));
        }
        if (btnZoomOut) {
            btnZoomOut.addEventListener('click', () => this.zoom(1.25));
        }
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetView());
        }
    },

    zoom(factor) {
        if (!this.svg) return;
        const vb = this.viewBox;
        const newW = vb.width * factor;
        const newH = vb.height * factor;

        if (newW > 250 && newW < 1200) {
            vb.x += (vb.width - newW) / 2;
            vb.y += (vb.height - newH) / 2;
            vb.width = newW;
            vb.height = newH;
            this.svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height}`);
        }
    },

    resetView() {
        if (!this.svg) return;
        this.viewBox = { x: 0, y: 0, width: 800, height: 600 };
        this.svg.setAttribute('viewBox', '0 0 800 600');
    }
};

window.ZooMap = ZooMap;
