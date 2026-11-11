import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { 
    WALKWAY_NODES, 
    WALKWAY_EDGES, 
    POPULAR_START_POINTS, 
    planZooRoute 
} from './zooWalkwayGraph';

// Tọa độ địa lý thực tế (WGS84 Lat/Lng) của Thảo Cầm Viên Sài Gòn
// Số 2 Nguyễn Bỉnh Khiêm, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
const SAIGON_ZOO_CENTER = [10.787600, 106.705300];
const SAIGON_ZOO_BOUNDS = [
    [10.783000, 106.700000], // Tây Nam
    [10.792500, 106.711000]  // Đông Bắc
];

// Danh mục các địa điểm thực tế tại Thảo Cầm Viên đã được đối chiếu tọa độ
const REAL_MAP_LANDMARKS = [
    // --- 1. CỔNG RA VÀO CHÍNH THỨC ---
    {
        id: 'gate_a',
        nodeId: 'gate_a',
        type: 'gate',
        code: 'GATE-A',
        name: 'Cổng Chính A (Lê Duẩn & Nguyễn Bỉnh Khiêm)',
        description: 'Cổng vào chính Thảo Cầm Viên đối diện đại lộ Lê Duẩn. Có quầy bán vé trung tâm, bến xe điện tham quan và trung tâm thông tin du khách.',
        lat: 10.785800,
        lng: 106.704600,
        category: 'gate',
        isVerified: true
    },
    {
        id: 'gate_b',
        nodeId: 'gate_b',
        type: 'gate',
        code: 'GATE-B',
        name: 'Cổng B (Số 2B Nguyễn Bỉnh Khiêm)',
        description: 'Cổng phụ trên trục đường Nguyễn Bỉnh Khiêm, thuận tiện cho du khách gửi phương tiện xe máy và ôtô.',
        lat: 10.786400,
        lng: 106.705800,
        category: 'gate',
        isVerified: true
    },
    {
        id: 'gate_c',
        nodeId: 'gate_c',
        type: 'gate',
        code: 'GATE-C',
        name: 'Cổng C (Số 1 Nguyễn Thị Minh Khai)',
        description: 'Cổng Nguyễn Thị Minh Khai gần cầu Thị Nghè, thuận tiện kết nối các tuyến xe buýt đô thị.',
        lat: 10.788600,
        lng: 106.703200,
        category: 'gate',
        isVerified: true
    },
    {
        id: 'gate_e',
        nodeId: 'gate_e',
        type: 'gate',
        code: 'GATE-E',
        name: 'Cổng E (Bờ Kênh Nhiêu Lộc)',
        description: 'Lối tản bộ ven bờ kênh rợp bóng mát cây xanh, ngắm cảnh kênh Nhiêu Lộc và thuyền du lịch sinh thái.',
        lat: 10.787600,
        lng: 106.707800,
        category: 'gate',
        isVerified: true
    },

    // --- 2. DI TÍCH & DANH THẮNG LỊCH SỬ ---
    {
        id: 'poi_hung',
        nodeId: 'poi_hung',
        type: 'landmark',
        code: 'POI-HUNG',
        name: 'Đền Thờ Vua Hùng Lịch Sử',
        description: 'Công trình kiến trúc cung đình truyền thống xây dựng năm 1926 để tưởng nhớ Quốc Tổ Hùng Vương, rợp bóng cổ thụ trăm năm.',
        lat: 10.786500,
        lng: 106.704500,
        category: 'landmark',
        isVerified: true
    },
    {
        id: 'poi_museum',
        nodeId: 'poi_museum',
        type: 'landmark',
        code: 'POI-MUSEUM',
        name: 'Bảo Tàng Lịch Sử TP. Hồ Chí Minh',
        description: 'Bảo tàng lưu giữ hơn 40.000 hiện vật lịch sử văn hóa quý giá của dân tộc Việt Nam.',
        lat: 10.786000,
        lng: 106.704200,
        category: 'landmark',
        isVerified: true
    },
    {
        id: 'poi_tree',
        nodeId: 'poi_tree',
        type: 'landmark',
        code: 'POI-TREE',
        name: 'Cây Sọ Khỉ Di Sản (Hơn 130 năm tuổi)',
        description: 'Một trong những cây cổ thụ lớn và lâu đời nhất Thảo Cầm Viên, chu vi gốc hơn 8 mét với tán lá sum suê tỏa bóng mát rợp cả góc trời.',
        lat: 10.787400,
        lng: 106.705300,
        category: 'landmark',
        isVerified: true
    },
    {
        id: 'poi_lake',
        nodeId: 'poi_lake',
        type: 'landmark',
        code: 'POI-LAKE',
        name: 'Hồ Sen Sinh Thái & Nhà Thủy Tạ',
        description: 'Hồ cảnh quan trung tâm thoáng đãng, cầu gỗ bắc ngang cho du khách dạo mát và ngắm đàn cá bơi lội.',
        lat: 10.787800,
        lng: 106.705600,
        category: 'landmark',
        isVerified: true
    },
];

// Tính khoảng cách Haversine (đơn vị: mét) giữa 2 tọa độ GPS WGS84
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371000; // Bán kính Trái Đất (mét)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function MapTab({ onPlayAudio, onOpenDetail, onOpenSpeciesNarration, onPlayPoiAudio }) {
    const { 
        showToast, 
        navTargetAnimal,
        setNavTargetAnimal,
        currentLang,
        currentSession,
        hasActiveSession,
        currentSession,
        setIsTicketModalOpen,
        audioState,
        t
    } = useApp();

    // Dữ liệu từ Supabase API
    const [areas, setAreas] = useState([]);
    const [enclosures, setEnclosures] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [dbPois, setDbPois] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Trạng thái tìm kiếm & phân loại
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedMarker, setSelectedMarker] = useState(null);

    // Trạng thái tải động vật theo chuồng được chọn
    const [enclosureAnimals, setEnclosureAnimals] = useState([]);
    const [isLoadingEnclosureAnimals, setIsLoadingEnclosureAnimals] = useState(false);
    const [enclosureAnimalsError, setEnclosureAnimalsError] = useState(null);
    const activeEnclosureReqRef = useRef(0);

    // Điểm xuất phát dẫn đường Dijkstra
    const [selectedStartPointId, setSelectedStartPointId] = useState('gate_a');
    const [activeRoute, setActiveRoute] = useState(null);
    const [showRouteSteps, setShowRouteSteps] = useState(false);

    // Tham chiếu Leaflet Map
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const routeLayerRef = useRef(null);
    const userLocationLayerRef = useRef(null);

    // --- STATE THUYẾT MINH TỰ ĐỘNG THEO GPS (Task E) ---
    const [isAutoNarrationActive, setIsAutoNarrationActive] = useState(false);
    const [autoNarrationStatus, setAutoNarrationStatus] = useState('');
    const [lastTriggeredTarget, setLastTriggeredTarget] = useState(null);
    const [showGpsPermissionModal, setShowGpsPermissionModal] = useState(false);
    const [currentGpsAccuracy, setCurrentGpsAccuracy] = useState(null);

    const watchIdRef = useRef(null);
    const audioCooldownMapRef = useRef(new Map());
    const isPlayingRef = useRef(false);

    useEffect(() => {
        isPlayingRef.current = Boolean(audioState?.isPlaying);
    }, [audioState?.isPlaying]);

    // 1. Tải dữ liệu thực tế từ Supabase API
    const loadMapData = useCallback(async (lang = currentLang) => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const [resAreas, resEnclosures, resAnimals, resPois] = await Promise.all([
                ZooApi.getAreas(lang),
                ZooApi.getEnclosures({ lang }),
                ZooApi.getAnimals({ lang }),
                ZooApi.getPois({ isActive: true })
            ]);

            if (resAreas && resAreas.success) setAreas(resAreas.data || []);
            if (resEnclosures && resEnclosures.success) setEnclosures(resEnclosures.data || []);
            if (resAnimals && resAnimals.success) setAnimals(resAnimals.data || []);
            if (resPois && resPois.success) setDbPois(resPois.data || []);
        } catch (err) {
            console.error("MapTab loadMapData error:", err);
            setLoadError(err.message || "Không thể kết nối đến máy chủ cơ sở dữ liệu.");
        } finally {
            setIsLoading(false);
        }
    }, [currentLang]);

    useEffect(() => {
        loadMapData(currentLang);
    }, [loadMapData, currentLang]);

    // 2. Hợp nhất Marker chuẩn với dữ liệu thực tế từ Supabase
    const mergedMarkers = useMemo(() => {
        const markerList = [...REAL_MAP_LANDMARKS];

        // Tạo marker từ toàn bộ chuồng thú thực tế được API trả về
        enclosures.forEach(dbEnc => {
            const areaId = Number(dbEnc.areaId);
            const code = (dbEnc.code || '').toUpperCase();

            // Phân loại sinh thái chuẩn xác theo phân khu và mã chuồng
            let category = 'enclosure';
            if (areaId === 7 || code.startsWith('ENC-TIG') || code.startsWith('ENC-LIO') || code.startsWith('ENC-LEO') || code.startsWith('ENC-CLO') || code.startsWith('ENC-GCA')) {
                category = 'carnivore';
            } else if (areaId === 3 || code.startsWith('ENC-ELE') || code.startsWith('ENC-HIP') || code.startsWith('ENC-RHI') || code.startsWith('ENC-GIR') || code.startsWith('ENC-ZEB') || code.startsWith('ENC-HOG')) {
                category = 'herbivore';
            } else if (areaId === 4 || code.startsWith('ENC-BIR') || code.startsWith('ENC-WRE') || code.startsWith('ENC-HOR') || code.startsWith('ENC-PEL') || code.startsWith('ENC-ARG') || code.startsWith('ENC-COC')) {
                category = 'bird';
            } else if (areaId === 6 || code.startsWith('ENC-PRI') || code.startsWith('ENC-ORA') || code.startsWith('ENC-GIB') || code.startsWith('ENC-DOU')) {
                category = 'primate';
            } else if (areaId === 2 || code.startsWith('ENC-PET')) {
                category = 'petting';
            } else if (areaId === 1 || code.startsWith('ENC-REP')) {
                category = 'reptile';
            }

            const resident = animals.filter(a => a.enclosureId === dbEnc.enclosureId);
            const hasLatLong = Boolean(dbEnc.latitude && dbEnc.longitude);

            markerList.push({
                id: `enc_${dbEnc.enclosureId}`,
                nodeId: `enc_node_${dbEnc.enclosureId}`,
                enclosureId: dbEnc.enclosureId,
                areaId: dbEnc.areaId,
                code: dbEnc.code || `ENC-${dbEnc.enclosureId}`,
                name: dbEnc.name,
                description: dbEnc.description || '',
                lat: hasLatLong ? Number(dbEnc.latitude) : 10.7876,
                lng: hasLatLong ? Number(dbEnc.longitude) : 106.7053,
                category,
                isVerified: hasLatLong,
                imageUrl: dbEnc.imageUrl,
                residentAnimals: resident,
                animalCount: resident.length
            });
        });

        // Bổ sung các điểm POI thực tế từ cơ sở dữ liệu
        if (dbPois && dbPois.length > 0) {
            dbPois.forEach(poi => {
                const matchIdx = markerList.findIndex(m => 
                    (poi.code && m.code === poi.code) || 
                    (poi.name && m.name && m.name.toLowerCase() === poi.name.toLowerCase())
                );

                if (matchIdx >= 0) {
                    markerList[matchIdx].poiId = poi.poiId;
                    markerList[matchIdx].isVerified = poi.isCoordinateVerified ?? poi.isVerified ?? markerList[matchIdx].isVerified;
                    if (poi.latitude && poi.longitude) {
                        markerList[matchIdx].lat = Number(poi.latitude);
                        markerList[matchIdx].lng = Number(poi.longitude);
                    }
                    if (poi.description && !markerList[matchIdx].description) {
                        markerList[matchIdx].description = poi.description;
                    }
                    // KHÔNG ghi đè category cụ thể của chuồng bằng 'Enclosure' chung chung
                    if (markerList[matchIdx].category === 'gate' || markerList[matchIdx].category === 'landmark') {
                        if (poi.category && poi.category.toLowerCase() !== 'enclosure') {
                            markerList[matchIdx].category = poi.category.toLowerCase();
                        }
                    }
                    markerList[matchIdx].hasAudio = poi.hasAudio;
                } else if ((poi.category || '').toLowerCase() !== 'enclosure') {
                    // Tránh tạo thêm marker trùng lặp nếu là chuồng thú
                    markerList.push({
                        id: `poi_${poi.poiId}`,
                        poiId: poi.poiId,
                        nodeId: `node_poi_${poi.poiId}`,
                        code: poi.code || `POI-${poi.poiId}`,
                        name: poi.name,
                        description: poi.description || 'Điểm tham quan tại Thảo Cầm Viên Sài Gòn.',
                        lat: Number(poi.latitude) || 10.7876,
                        lng: Number(poi.longitude) || 106.7053,
                        category: (poi.category || 'landmark').toLowerCase(),
                        isVerified: Boolean(poi.isCoordinateVerified),
                        hasAudio: Boolean(poi.hasAudio),
                        residentAnimals: [],
                        animalCount: 0
                    });
                }
            });
        }

        return markerList;
    }, [areas, enclosures, animals, dbPois]);

    // 3. Lọc danh sách marker
    const filteredMarkers = useMemo(() => {
        return mergedMarkers.filter(m => {
            if (activeCategory !== 'all') {
                if (activeCategory === 'landmark') {
                    if (!['landmark', 'botanical', 'attraction'].includes(m.category)) return false;
                } else if (m.category !== activeCategory) {
                    return false;
                }
            }

            if (searchKeyword.trim()) {
                const kw = searchKeyword.trim().toLowerCase();
                const matchName = (m.name || '').toLowerCase().includes(kw);
                const matchCode = (m.code || '').toLowerCase().includes(kw);
                const matchDesc = (m.description || '').toLowerCase().includes(kw);
                const matchAnimal = m.residentAnimals && m.residentAnimals.some(a => 
                    (a.name || '').toLowerCase().includes(kw) ||
                    (a.scientificName || '').toLowerCase().includes(kw)
                );
                return matchName || matchCode || matchDesc || matchAnimal;
            }

            return true;
        });
    }, [mergedMarkers, activeCategory, searchKeyword]);

    // 4. Khởi tạo Leaflet Map thực tế
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        // Khởi tạo bản đồ tập trung đúng Thảo Cầm Viên Sài Gòn
        const map = L.map(mapContainerRef.current, {
            center: SAIGON_ZOO_CENTER,
            zoom: 17,
            minZoom: 15,
            maxZoom: 19,
            maxBounds: SAIGON_ZOO_BOUNDS,
            maxBoundsViscosity: 0.85,
            zoomControl: false // Sử dụng controls tùy biến
        });

        // Nền bản đồ CARTO Voyager
const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;

if (!cartoApiKey) {
    console.error('Thiếu VITE_CARTO_API_KEY trong cấu hình môi trường.');
}

const tileLayer = L.tileLayer(
    `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoApiKey || '')}`,
    {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }
);

tileLayer.addTo(map);

        // Lớp chứa Marker và Tuyến đường
        const markersLayer = L.layerGroup().addTo(map);
        const routeLayer = L.layerGroup().addTo(map);
        const userLocationLayer = L.layerGroup().addTo(map);

        markersLayerRef.current = markersLayer;
        routeLayerRef.current = routeLayer;
        userLocationLayerRef.current = userLocationLayer;
        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // 5. Cập nhật Marker lên bản đồ Leaflet
    const createCustomDivIcon = useCallback((marker, isSelected) => {
        let bgColor = '#15803D'; // Xanh lá cây tự nhiên mặc định
        let label = marker.name?.split('(')[0]?.trim();

        if (marker.category === 'gate') bgColor = '#0284C7';
        else if (marker.category === 'landmark' || marker.category === 'botanical' || marker.category === 'attraction') bgColor = '#B45309';
        else if (marker.category === 'carnivore') bgColor = '#DC2626';
        else if (marker.category === 'herbivore') bgColor = '#16A34A';
        else if (marker.category === 'bird') bgColor = '#7C3AED';
        else if (marker.category === 'primate') bgColor = '#EA580C';
        else if (marker.category === 'petting') bgColor = '#059669';
        else if (marker.category === 'reptile') bgColor = '#0D9488';

        const verifiedDotColor = marker.isVerified ? '#4ADE80' : '#FCD34D';

        return L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div style="
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: ${isSelected ? '#0F172A' : bgColor};
                    color: #FFFFFF;
                    padding: ${isSelected ? '4px 8px' : '3px 6px'};
                    border-radius: 6px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.18);
                    border: 2px solid ${isSelected ? '#FEF08A' : '#FFFFFF'};
                    font-size: 11px;
                    font-weight: 700;
                    white-space: nowrap;
                    transform: translate(-50%, -100%);
                    cursor: pointer;
                    transition: transform 0.15s ease;
                ">
                    <span style="width: 7px; height: 7px; border-radius: 50%; background: ${verifiedDotColor}; display: inline-block;"></span>
                    <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis;">${label}</span>
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        });
    }, []);

    // 6. Xử lý chọn marker và vẽ tuyến đường
    const handleSelectMarker = useCallback((marker) => {
        setSelectedMarker(marker);

        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([marker.lat, marker.lng], 18, {
                duration: 1.0
            });
        }

        // Tính toán lộ trình Dijkstra từ cổng xuất phát
        let targetEntity = marker;
        let targetType = 'node';

        if (marker.enclosureId) {
            targetType = 'enclosure';
            targetEntity = {
                enclosureId: marker.enclosureId,
                name: marker.name,
                latitude: marker.lat,
                longitude: marker.lng,
                areaId: marker.areaId
            };
        } else if (marker.nodeId) {
            targetType = 'node';
            targetEntity = { id: marker.nodeId, name: marker.name };
        }

        const route = planZooRoute({
            startPoint: selectedStartPointId,
            targetType,
            targetEntity,
            currentNodes: WALKWAY_NODES,
            currentEdges: WALKWAY_EDGES
        });

        if (route) {
            setActiveRoute(route);
            if (routeLayerRef.current) {
                routeLayerRef.current.clearLayers();
                // Vẽ đường đi bộ thực tế dọc lối đi Thảo Cầm Viên
                const polyline = L.polyline(route.latlngs, {
                    color: '#15803D',
                    weight: 5,
                    opacity: 0.9,
                    dashArray: '8, 8'
                });
                polyline.addTo(routeLayerRef.current);
            }
        } else {
            setActiveRoute(null);
            if (routeLayerRef.current) routeLayerRef.current.clearLayers();
        }
    }, [selectedStartPointId]);

    // Tự động tải danh sách động vật thực tế thuộc chuồng được chọn từ API
    useEffect(() => {
        if (!selectedMarker || (!selectedMarker.enclosureId && selectedMarker.category !== 'enclosure')) {
            setEnclosureAnimals([]);
            setIsLoadingEnclosureAnimals(false);
            setEnclosureAnimalsError(null);
            return;
        }

        const encId = selectedMarker.enclosureId;
        if (!encId) {
            setEnclosureAnimals([]);
            setIsLoadingEnclosureAnimals(false);
            setEnclosureAnimalsError(null);
            return;
        }

        const currentReq = ++activeEnclosureReqRef.current;
        setIsLoadingEnclosureAnimals(true);
        setEnclosureAnimalsError(null);
        setEnclosureAnimals([]); // Xóa danh sách chuồng trước để tránh hiển thị nhầm

        ZooApi.getAnimals({ enclosureId: encId, lang: currentLang })
            .then(res => {
                if (activeEnclosureReqRef.current !== currentReq) return;
                if (res.success) {
                    setEnclosureAnimals(res.data || []);
                } else {
                    setEnclosureAnimalsError(res.message || 'Không thể tải danh sách động vật từ máy chủ.');
                }
            })
            .catch(err => {
                if (activeEnclosureReqRef.current !== currentReq) return;
                setEnclosureAnimalsError(err.message || 'Lỗi kết nối khi tải danh sách động vật.');
            })
            .finally(() => {
                if (activeEnclosureReqRef.current === currentReq) {
                    setIsLoadingEnclosureAnimals(false);
                }
            });
    }, [selectedMarker?.enclosureId, currentLang]);

    const handleRetryLoadAnimals = () => {
        if (!selectedMarker?.enclosureId) return;
        const encId = selectedMarker.enclosureId;
        const currentReq = ++activeEnclosureReqRef.current;
        setIsLoadingEnclosureAnimals(true);
        setEnclosureAnimalsError(null);

        ZooApi.getAnimals({ enclosureId: encId, lang: currentLang })
            .then(res => {
                if (activeEnclosureReqRef.current !== currentReq) return;
                if (res.success) {
                    setEnclosureAnimals(res.data || []);
                } else {
                    setEnclosureAnimalsError(res.message || 'Không thể tải danh sách động vật.');
                }
            })
            .catch(err => {
                if (activeEnclosureReqRef.current !== currentReq) return;
                setEnclosureAnimalsError(err.message || 'Lỗi kết nối khi tải danh sách động vật.');
            })
            .finally(() => {
                if (activeEnclosureReqRef.current === currentReq) {
                    setIsLoadingEnclosureAnimals(false);
                }
            });
    };

    // Render lại markers khi danh sách filteredMarkers hoặc selectedMarker thay đổi
    useEffect(() => {
        if (!markersLayerRef.current || !mapInstanceRef.current) return;

        markersLayerRef.current.clearLayers();

        filteredMarkers.forEach(marker => {
            const isSelected = selectedMarker?.id === marker.id;
            const icon = createCustomDivIcon(marker, isSelected);

            const leafletMarker = L.marker([marker.lat, marker.lng], { icon });
            leafletMarker.on('click', () => {
                handleSelectMarker(marker);
            });

            leafletMarker.addTo(markersLayerRef.current);
        });
    }, [filteredMarkers, selectedMarker, createCustomDivIcon, handleSelectMarker]);

    // 7. Nhận điều hướng từ trang Động vật (navTargetAnimal)
    useEffect(() => {
        if (navTargetAnimal && mergedMarkers.length > 0) {
            let targetMarker = null;
            if (navTargetAnimal.enclosureId) {
                targetMarker = mergedMarkers.find(m => m.enclosureId === navTargetAnimal.enclosureId);
            }
            if (!targetMarker && navTargetAnimal.areaId) {
                targetMarker = mergedMarkers.find(m => m.areaId === navTargetAnimal.areaId);
            }

            if (targetMarker) {
                handleSelectMarker(targetMarker);
                showToast(`Đã định vị chuồng nuôi cho ${navTargetAnimal.name || 'động vật'} trên bản đồ thực tế`, "info");
            }
            setNavTargetAnimal(null);
        }
    }, [navTargetAnimal, mergedMarkers, handleSelectMarker, setNavTargetAnimal, showToast]);

    // 8. Định vị du khách thực tế (GPS Geolocation)
    const handleLocateUser = () => {
        if (!navigator.geolocation) {
            showToast("Trình duyệt không hỗ trợ tính năng định vị GPS.", "error");
            return;
        }

        showToast("Đang tìm vị trí GPS của bạn...", "info");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const userLat = pos.coords.latitude;
                const userLng = pos.coords.longitude;
                const accuracy = pos.coords.accuracy;

                if (!mapInstanceRef.current || !userLocationLayerRef.current) return;

                userLocationLayerRef.current.clearLayers();

                // Chấm xanh vị trí người dùng
                const userIcon = L.divIcon({
                    className: 'user-gps-marker',
                    html: `
                        <div style="
                            width: 16px;
                            height: 16px;
                            background: #2563EB;
                            border: 3px solid #FFFFFF;
                            border-radius: 50%;
                            box-shadow: 0 0 10px rgba(37,99,235,0.7);
                        "></div>
                    `,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });

                L.marker([userLat, userLng], { icon: userIcon }).addTo(userLocationLayerRef.current);
                L.circle([userLat, userLng], { radius: Math.min(accuracy, 80), color: '#3B82F6', fillOpacity: 0.15 }).addTo(userLocationLayerRef.current);

                mapInstanceRef.current.flyTo([userLat, userLng], 18, { duration: 1.2 });
                showToast("Đã xác định vị trí hiện tại của bạn.", "success");
            },
            (err) => {
                console.warn("Geolocation error:", err);
                showToast("Không thể lấy vị trí GPS. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.", "error");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
    };

    // --- LOGIC THUYẾT MINH TỰ ĐỘNG THEO GPS (Task E) ---
    const updateUserGpsMarker = useCallback((userLat, userLng, accuracy) => {
        if (!mapInstanceRef.current || !userLocationLayerRef.current) return;
        userLocationLayerRef.current.clearLayers();

        const userIcon = L.divIcon({
            className: 'user-gps-marker',
            html: `
                <div style="
                    width: 18px;
                    height: 18px;
                    background: #15803D;
                    border: 3px solid #FFFFFF;
                    border-radius: 50%;
                    box-shadow: 0 0 12px rgba(21,128,61,0.8);
                "></div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });

        L.marker([userLat, userLng], { icon: userIcon }).addTo(userLocationLayerRef.current);
        L.circle([userLat, userLng], { 
            radius: Math.min(accuracy, 60), 
            color: '#15803D', 
            fillColor: '#86EFAC', 
            fillOpacity: 0.15 
        }).addTo(userLocationLayerRef.current);
    }, []);

    const evaluateAutoNarrationTrigger = useCallback((userLat, userLng, accuracy) => {
        if (!mergedMarkers || mergedMarkers.length === 0) return;

        // Lọc các điểm nằm trong bán kính kích hoạt (sử dụng radiusMeters của POI hoặc mặc định 25m)
        const nearbyTargets = mergedMarkers.filter(m => m.lat && m.lng).map(m => {
            const dist = calculateHaversineDistance(userLat, userLng, m.lat, m.lng);
            const triggerRadius = Number(m.radiusMeters) > 0 ? Math.min(Number(m.radiusMeters), 50) : 25;
            return { ...m, dist, triggerRadius };
        }).filter(m => m.dist <= m.triggerRadius);

        if (nearbyTargets.length === 0) return;

        // Ưu tiên điểm gần du khách nhất
        nearbyTargets.sort((a, b) => a.dist - b.dist);
        const nearest = nearbyTargets[0];
        const now = Date.now();

        // Ghi nhận sự kiện phát hiện vào vùng POI (throttled mỗi 90s cho cùng 1 điểm để tránh spam)
        const proxKey = `prox_${nearest.id}`;
        const lastProxTime = audioCooldownMapRef.current.get(proxKey) || 0;
        if (now - lastProxTime > 90000) {
            audioCooldownMapRef.current.set(proxKey, now);
            ZooApi.recordDashboardTelemetry({
                category: 'GPS',
                eventType: 'PROXIMITY_DETECTED',
                sessionId: currentSession?.sessionId || null,
                languageCode: currentLang,
                targetType: nearest.poiId ? 'POI' : 'Enclosure',
                targetId: nearest.poiId || nearest.enclosureId || null,
                targetCode: nearest.code || String(nearest.id),
                targetName: nearest.name,
                triggerSource: 'GPS_AUTO',
                distanceMeters: Math.round(nearest.dist * 10) / 10,
                accuracyMeters: Math.round((accuracy || 0) * 10) / 10,
                isSuccess: true
            });
        }

        // Lọc các điểm đủ điều kiện có audio hoặc bài thuyết minh
        const eligibleTargets = nearbyTargets.filter(m => {
            const isPoiWithAudio = m.poiId && m.hasAudio;
            const isEnclosureWithAnimals = m.residentAnimals && m.residentAnimals.length > 0;
            return isPoiWithAudio || isEnclosureWithAnimals;
        });

        if (eligibleTargets.length === 0) return;

        const candidate = eligibleTargets.find(t => {
            const lastTime = audioCooldownMapRef.current.get(t.id) || 0;
            return (now - lastTime) > 120000; // Cooldown 120s (2 phút) để tránh lặp âm thanh
        });

        if (!candidate) {
            // Đang trong thời gian chờ Cooldown -> ghi nhận SKIPPED_COOLDOWN tối đa 1 lần / 90s
            const skipKey = `skip_${eligibleTargets[0].id}`;
            const lastSkipTime = audioCooldownMapRef.current.get(skipKey) || 0;
            if (now - lastSkipTime > 90000) {
                audioCooldownMapRef.current.set(skipKey, now);
                ZooApi.recordDashboardTelemetry({
                    category: 'GPS',
                    eventType: 'SKIPPED_COOLDOWN',
                    sessionId: currentSession?.sessionId || null,
                    languageCode: currentLang,
                    targetType: eligibleTargets[0].poiId ? 'POI' : 'Enclosure',
                    targetId: eligibleTargets[0].poiId || eligibleTargets[0].enclosureId || null,
                    targetCode: eligibleTargets[0].code || String(eligibleTargets[0].id),
                    targetName: eligibleTargets[0].name,
                    triggerSource: 'GPS_AUTO',
                    distanceMeters: Math.round(eligibleTargets[0].dist * 10) / 10,
                    isSuccess: true
                });
            }
            return;
        }

        // Kiểm tra quyền nghe thuyết minh (yêu cầu phiên vé)
        if (!hasActiveSession) {
            audioCooldownMapRef.current.set(candidate.id, now);
            showToast(`Bạn đang ở gần "${candidate.name}". Vui lòng mua hoặc kích hoạt vé tham quan để nghe thuyết minh tự động.`, 'info');
            return;
        }

        // Đủ điều kiện kích hoạt và thực hiện kích hoạt thuyết minh tự động
        audioCooldownMapRef.current.set(candidate.id, now);
        setLastTriggeredTarget({ id: candidate.id, name: candidate.name, dist: Math.round(candidate.dist) });

        ZooApi.recordDashboardTelemetry({
            category: 'GPS',
            eventType: 'TRIGGER_ELIGIBLE',
            sessionId: currentSession?.sessionId || null,
            languageCode: currentLang,
            targetType: candidate.poiId ? 'POI' : 'Enclosure',
            targetId: candidate.poiId || candidate.enclosureId || null,
            targetCode: candidate.code || String(candidate.id),
            targetName: candidate.name,
            triggerSource: 'GPS_AUTO',
            distanceMeters: Math.round(candidate.dist * 10) / 10,
            accuracyMeters: Math.round((accuracy || 0) * 10) / 10,
            isSuccess: true
        });

        ZooApi.recordDashboardTelemetry({
            category: 'GPS',
            eventType: 'TRIGGERED',
            sessionId: currentSession?.sessionId || null,
            languageCode: currentLang,
            targetType: candidate.poiId ? 'POI' : 'Enclosure',
            targetId: candidate.poiId || candidate.enclosureId || null,
            targetCode: candidate.code || String(candidate.id),
            targetName: candidate.name,
            triggerSource: 'GPS_AUTO',
            distanceMeters: Math.round(candidate.dist * 10) / 10,
            accuracyMeters: Math.round((accuracy || 0) * 10) / 10,
            isSuccess: true
        });

        if (candidate.poiId && onPlayPoiAudio) {
            onPlayPoiAudio(candidate.poiId, true, 'GPS_AUTO');
            showToast(`Tự động thuyết minh: ${candidate.name} (cách ${Math.round(candidate.dist)}m)`, 'success');
        } else if (candidate.residentAnimals && candidate.residentAnimals.length > 0) {
            if (onOpenSpeciesNarration) {
                onOpenSpeciesNarration(candidate.residentAnimals[0]);
            } else if (onPlayAudio) {
                onPlayAudio(candidate.residentAnimals[0]);
            }
            showToast(`Tự động thuyết minh: ${candidate.name} (cách ${Math.round(candidate.dist)}m)`, 'success');
        }
    }, [mergedMarkers, hasActiveSession, currentSession?.sessionId, currentLang, onPlayPoiAudio, onOpenSpeciesNarration, onPlayAudio, showToast]);

    const startAutoNarrationTracking = useCallback(() => {
        if (!navigator.geolocation) {
            ZooApi.recordDashboardTelemetry({
                category: 'GPS',
                eventType: 'GPS_UNAVAILABLE',
                sessionId: currentSession?.sessionId || null,
                languageCode: currentLang,
                triggerSource: 'GPS_AUTO',
                isSuccess: false,
                errorCode: 'GEOLOCATION_UNSUPPORTED',
                errorMessage: 'Trình duyệt không hỗ trợ định vị GPS'
            });
            showToast("Trình duyệt của bạn không hỗ trợ định vị GPS.", "error");
            return;
        }

        setIsAutoNarrationActive(true);
        setAutoNarrationStatus("Đang định vị GPS...");
        setShowGpsPermissionModal(false);

        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const userLat = pos.coords.latitude;
                const userLng = pos.coords.longitude;
                const accuracy = pos.coords.accuracy;
                setCurrentGpsAccuracy(accuracy);

                updateUserGpsMarker(userLat, userLng, accuracy);

                if (accuracy > 50) {
                    setAutoNarrationStatus(`GPS đang ổn định (±${Math.round(accuracy)}m). Cần độ chính xác <50m để định vị chuồng...`);
                    return;
                }

                setAutoNarrationStatus(`Đang quét thuyết minh tự động (±${Math.round(accuracy)}m)`);
                evaluateAutoNarrationTrigger(userLat, userLng, accuracy);
            },
            (err) => {
                console.warn("watchPosition error:", err);
                ZooApi.recordDashboardTelemetry({
                    category: 'GPS',
                    eventType: 'GPS_UNAVAILABLE',
                    sessionId: currentSession?.sessionId || null,
                    languageCode: currentLang,
                    triggerSource: 'GPS_AUTO',
                    isSuccess: false,
                    errorCode: `GEO_ERR_${err.code}`,
                    errorMessage: err.code === 1 ? 'Khách từ chối cấp quyền vị trí GPS' : 'Mất tín hiệu hoặc hết thời gian chờ GPS'
                });
                if (err.code === 1) {
                    showToast("Quyền truy cập vị trí bị từ chối. Vui lòng cho phép quyền vị trí trong trình duyệt.", "error");
                    stopAutoNarrationTracking();
                } else if (err.code === 2) {
                    setAutoNarrationStatus("Mất tín hiệu GPS. Đang đợi kết nối lại...");
                } else if (err.code === 3) {
                    setAutoNarrationStatus("Đang làm mới tín hiệu GPS...");
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );

        showToast("Đã bật chế độ thuyết minh tự động theo GPS.", "success");
    }, [currentLang, currentSession?.sessionId, evaluateAutoNarrationTrigger, showToast, updateUserGpsMarker]);

    const stopAutoNarrationTracking = useCallback(() => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsAutoNarrationActive(false);
        setAutoNarrationStatus("");
        setCurrentGpsAccuracy(null);
        showToast("Đã tắt chế độ thuyết minh tự động.", "info");
    }, [showToast]);

    useEffect(() => {
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, []);

    // 9. Nút đặt lại toàn cảnh sở thú (Reset View to Zoo Bounds)
    const handleResetZooBounds = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyToBounds(SAIGON_ZOO_BOUNDS, {
                padding: [20, 20],
                duration: 1.0
            });
        }
        setSelectedMarker(null);
        setActiveRoute(null);
        if (routeLayerRef.current) routeLayerRef.current.clearLayers();
    };

    // 10. Điều khiển Zoom
    const handleZoomIn = () => {
        if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
    };

    const handleZoomOut = () => {
        if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
    };

    return (
        <section id="tab-pane-map" className="tab-content-pane" style={{ padding: '8px 0 24px 0' }}>
            {/* Header Toolbar: Tìm kiếm, lọc danh mục, điểm xuất phát */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                padding: '14px 18px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                marginBottom: '14px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                                Bản Đồ Địa Lý Thảo Cầm Viên Sài Gòn
                            </h2>
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: '#15803D', fontWeight: 600 }}>
                            Nền tảng bản đồ địa lý thực tế (OpenStreetMap) • Tọa độ GPS chính xác 2 Nguyễn Bỉnh Khiêm, Quận 1
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Dropdown cổng xuất phát */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', padding: '6px 12px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#166534' }}>Cổng xuất phát:</span>
                            <select
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    color: '#0F172A',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                                value={selectedStartPointId}
                                onChange={(e) => {
                                    setSelectedStartPointId(e.target.value);
                                    if (selectedMarker) handleSelectMarker(selectedMarker);
                                }}
                            >
                                {POPULAR_START_POINTS.map(sp => (
                                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Ô tìm kiếm */}
                        <div style={{ position: 'relative', minWidth: '220px' }}>
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    padding: '7px 12px 7px 32px',
                                    fontSize: '0.84rem',
                                    borderRadius: '6px',
                                    border: '1px solid #CBD5E1',
                                    outline: 'none',
                                    background: '#F8FAFC'
                                }}
                                placeholder="Tìm chuồng, thú, cổng..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex', alignItems: 'center' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </span>
                            {searchKeyword && (
                                <button
                                    onClick={() => setSearchKeyword('')}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        color: '#94A3B8'
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Nút làm mới */}
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={() => loadMapData(currentLang)}
                            disabled={isLoading}
                            style={{ borderRadius: '6px', fontWeight: 600 }}
                        >
                            {isLoading ? 'Đang tải...' : 'Làm mới'}
                        </button>
                    </div>
                </div>

                {/* Filter Chips */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingTop: '12px',
                    marginTop: '10px',
                    borderTop: '1px solid #F1F5F9',
                    scrollbarWidth: 'none'
                }}>
                    {[
                        { key: 'all', label: 'Tất cả địa điểm', count: mergedMarkers.length },
                        { key: 'carnivore', label: 'Động vật ăn thịt', count: mergedMarkers.filter(m => m.category === 'carnivore').length },
                        { key: 'herbivore', label: 'Động vật ăn cỏ', count: mergedMarkers.filter(m => m.category === 'herbivore').length },
                        { key: 'bird', label: 'Vườn chim', count: mergedMarkers.filter(m => m.category === 'bird').length },
                        { key: 'primate', label: 'Linh trưởng', count: mergedMarkers.filter(m => m.category === 'primate').length },
                        { key: 'petting', label: 'Thú thân thiện', count: mergedMarkers.filter(m => m.category === 'petting').length },
                        { key: 'reptile', label: 'Bò sát & Lưỡng cư', count: mergedMarkers.filter(m => m.category === 'reptile').length },
                        { key: 'gate', label: 'Cổng ra vào', count: mergedMarkers.filter(m => m.category === 'gate').length },
                        { key: 'landmark', label: 'Di tích & Cảnh quan', count: mergedMarkers.filter(m => ['landmark', 'botanical', 'attraction'].includes(m.category)).length }
                    ].map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: activeCategory === cat.key ? 700 : 500,
                                background: activeCategory === cat.key ? '#15803D' : '#F8FAFC',
                                color: activeCategory === cat.key ? '#FFFFFF' : '#475569',
                                border: `1px solid ${activeCategory === cat.key ? '#15803D' : '#E2E8F0'}`,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {cat.label} ({cat.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Báo lỗi nếu có */}
            {loadError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 16px', borderRadius: '12px', marginBottom: '12px', fontSize: '0.88rem' }}>
                    Lỗi tải dữ liệu: {loadError}
                </div>
            )}

            {/* Thanh Kích Hoạt Thuyết Minh Tự Động (Task E) */}
            <div style={{
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                borderRadius: '10px',
                background: isAutoNarrationActive ? '#F0FDF4' : '#F8FAFC',
                border: `1.5px solid ${isAutoNarrationActive ? '#86EFAC' : '#E2E8F0'}`,
                flexWrap: 'wrap',
                gap: '10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: isAutoNarrationActive ? '#15803D' : '#94A3B8',
                        display: 'inline-block'
                    }}></span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                            {isAutoNarrationActive ? 'Thuyết minh tự động (GPS) đang bật' : 'Chế độ thuyết minh tự động (GPS)'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {isAutoNarrationActive 
                                ? (autoNarrationStatus || 'Đang theo dõi vị trí thực tế của bạn tại Thảo Cầm Viên...') 
                                : 'Tự động phát audio khi đến gần chuồng thú hoặc điểm tham quan (< 25m)'}
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={isAutoNarrationActive ? stopAutoNarrationTracking : () => setShowGpsPermissionModal(true)}
                    style={{
                        minHeight: '44px',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: 'none',
                        background: isAutoNarrationActive ? '#DC2626' : '#15803D',
                        color: '#FFFFFF',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                >
                    {isAutoNarrationActive ? 'Tắt Thuyết Minh Tự Động' : 'Bật Thuyết Minh Tự Động (GPS)'}
                </button>
            </div>

            {/* Khung chứa Bản Đồ Địa Lý Thực Tế Leaflet */}
            <div style={{
                position: 'relative',
                width: '100%',
                height: '68vh',
                minHeight: '520px',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid #CBD5E1',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                background: '#F1F5F9'
            }}>
                {/* Floating Map Controls (+ / - / Reset / GPS) */}
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '6px',
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                        border: '1px solid rgba(0,0,0,0.06)'
                    }}>
                        <button
                            className="btn btn-icon btn-sm"
                            title="Phóng to"
                            onClick={handleZoomIn}
                            style={{ width: '36px', height: '36px', fontSize: '1.2rem', fontWeight: 800, background: '#FFF' }}
                        >
                            ＋
                        </button>
                        <button
                            className="btn btn-icon btn-sm"
                            title="Thu nhỏ"
                            onClick={handleZoomOut}
                            style={{ width: '36px', height: '36px', fontSize: '1.2rem', fontWeight: 800, background: '#FFF' }}
                        >
                            －
                        </button>
                        <button
                            className="btn btn-icon btn-sm"
                            title="Toàn cảnh Thảo Cầm Viên"
                            onClick={handleResetZooBounds}
                            style={{ width: '36px', height: '36px', fontSize: '0.95rem', fontWeight: 700, background: '#FFF' }}
                        >
                            ⟲
                        </button>
                        <button
                            className="btn btn-icon btn-sm"
                            title="Định vị GPS của bạn"
                            onClick={handleLocateUser}
                            style={{ width: '36px', height: '36px', background: '#FFF', color: '#15803D' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <circle cx="12" cy="12" r="3"></circle>
                                <line x1="12" y1="2" x2="12" y2="6"></line>
                                <line x1="12" y1="18" x2="12" y2="22"></line>
                                <line x1="2" y1="12" x2="6" y2="12"></line>
                                <line x1="18" y1="12" x2="22" y2="12"></line>
                            </svg>
                        </button>

                        {/* Nút Bật/Tắt Thuyết Minh Tự Động GPS */}
                        <button
                            type="button"
                            className="btn btn-icon btn-sm"
                            title={isAutoNarrationActive ? "Tắt thuyết minh tự động" : "Bật thuyết minh tự động (GPS)"}
                            onClick={isAutoNarrationActive ? stopAutoNarrationTracking : () => setShowGpsPermissionModal(true)}
                            style={{
                                width: '36px',
                                height: '36px',
                                background: isAutoNarrationActive ? '#15803D' : '#FFF',
                                color: isAutoNarrationActive ? '#FFF' : '#15803D',
                                border: isAutoNarrationActive ? '1px solid #15803D' : 'none'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="22"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Floating Status Pill khi Thuyết Minh Tự Động Đang Bật */}
                {isAutoNarrationActive && (
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        background: 'rgba(21, 128, 61, 0.95)',
                        color: '#FFFFFF',
                        padding: '8px 18px',
                        borderRadius: '24px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        backdropFilter: 'blur(8px)',
                        maxWidth: '90%'
                    }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#86EFAC' }}></span>
                        <span>{autoNarrationStatus || 'Đang quét điểm tham quan gần bạn (<25m)...'}</span>
                        <button
                            type="button"
                            onClick={stopAutoNarrationTracking}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                color: '#FFF',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                marginLeft: '4px'
                            }}
                            title="Tắt chế độ tự động"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Hộp Thoại Giải Thích & Xin Quyền GPS (Task E) */}
                {showGpsPermissionModal && (
                    <div className="modal-overlay" role="dialog" aria-modal="true" style={{ zIndex: 2000 }}>
                        <div className="modal-backdrop" onClick={() => setShowGpsPermissionModal(false)}></div>
                        <div className="modal-dialog" style={{ maxWidth: '480px', borderRadius: '18px', overflow: 'hidden' }}>
                            <div style={{ background: '#15803D', color: '#FFF', padding: '20px', textAlign: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                                    Thuyết Minh Tự Động (GPS)
                                </h3>
                                <p style={{ margin: '6px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                                    Trải nghiệm hướng dẫn viên số thông minh
                                </p>
                            </div>
                            <div style={{ padding: '20px', background: '#FFF' }}>
                                <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, marginBottom: '16px' }}>
                                    <p style={{ margin: '0 0 10px' }}>
                                        Khi bạn kích hoạt chế độ này, ZooGuide sẽ theo dõi vị trí GPS của bạn trên thực địa tại Thảo Cầm Viên:
                                    </p>
                                    <ul style={{ paddingLeft: '20px', margin: '0 0 12px', fontSize: '0.85rem', color: '#475569' }}>
                                        <li>Tự động kích hoạt bài thuyết minh khi bạn tiến lại gần chuồng nuôi thú hoặc di tích trong phạm vi <strong>25 mét</strong>.</li>
                                        <li>Tránh phát trùng lặp hoặc chồng âm thanh khi bạn đang đứng xem thú.</li>
                                        <li>Chức năng do chính bạn chủ động kích hoạt và có thể tắt bất kỳ lúc nào.</li>
                                        <li>Yêu cầu có phiên vé tham quan hợp lệ để nghe trọn vẹn toàn bộ các bài thuyết minh.</li>
                                    </ul>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        style={{ minHeight: '44px', padding: '10px 16px', borderRadius: '8px' }}
                                        onClick={() => setShowGpsPermissionModal(false)}
                                    >
                                        Để sau
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ minHeight: '44px', padding: '10px 20px', borderRadius: '8px', background: '#15803D', color: '#FFF', fontWeight: 700 }}
                                        onClick={startAutoNarrationTracking}
                                    >
                                        Cho Phép & Bắt Đầu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chú giải trạng thái (Legend) */}
                <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    zIndex: 1000,
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(6px)',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    fontSize: '0.72rem',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }}></span>
                        <strong>Tọa độ đã xác minh</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span>
                        <span>Đang cập nhật</span>
                    </span>
                </div>

                {/* Floating Walking Route Card */}
                {activeRoute && (
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        zIndex: 1000,
                        background: 'rgba(15, 23, 42, 0.95)',
                        color: '#F8FAFC',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                        maxWidth: '360px',
                        border: '1px solid rgba(255,255,255,0.15)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <div>
                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#38BDF8', fontWeight: 800 }}>
                                    LỘ TRÌNH ĐI BỘ THỰC TẾ
                                </span>
                                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                                    ➔ {activeRoute.destinationName}
                                </div>
                                <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '4px', display: 'flex', gap: '8px' }}>
                                    <span>Từ: <strong>{activeRoute.startNode?.name?.split('(')[0]?.trim()}</strong></span>
                                    <span>•</span>
                                    <span>Cự ly: <strong style={{ color: '#38BDF8' }}>{activeRoute.totalDistanceM}m</strong></span>
                                    <span>•</span>
                                    <span>~<strong style={{ color: '#FCD34D' }}>{activeRoute.timeMin} phút</strong></span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setActiveRoute(null);
                                    if (routeLayerRef.current) routeLayerRef.current.clearLayers();
                                }}
                                style={{
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: '#FFF',
                                    borderRadius: '50%',
                                    width: '22px',
                                    height: '22px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Xem chi tiết trạm dừng */}
                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <button
                                onClick={() => setShowRouteSteps(!showRouteSteps)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#FCD34D',
                                    fontSize: '0.74rem',
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontWeight: 700
                                }}
                            >
                                {showRouteSteps ? '▲ Thu gọn các trạm dừng' : `▼ Chi tiết (${activeRoute.waypoints.length} điểm mốc)`}
                            </button>

                            {showRouteSteps && (
                                <ol style={{ margin: '6px 0 0 0', paddingLeft: '16px', fontSize: '0.72rem', color: '#CBD5E1', maxHeight: '100px', overflowY: 'auto' }}>
                                    {activeRoute.waypoints.map((step, idx) => (
                                        <li key={idx} style={{ marginBottom: '2px', color: idx === activeRoute.waypoints.length - 1 ? '#38BDF8' : '#CBD5E1', fontWeight: idx === activeRoute.waypoints.length - 1 ? 800 : 400 }}>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>
                )}

                {/* Container của Leaflet Map */}
                <div
                    ref={mapContainerRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        zIndex: 1
                    }}
                />
            </div>

            {/* Thẻ Thông Tin Chi Tiết Điểm Tham Quan (Location Detail Sheet) */}
            {selectedMarker && (
                <div style={{
                    marginTop: '14px',
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                    padding: '20px 24px',
                    animation: 'fadeIn 0.2s ease-in-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                        <div style={{ flex: 1, minWidth: '280px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                                    {selectedMarker.name}
                                </h3>
                                {selectedMarker.isVerified ? (
                                    <span style={{
                                        background: '#DCFCE7',
                                        color: '#166534',
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        padding: '2px 8px',
                                        borderRadius: '10px'
                                    }}>
                                        ✓ Tọa độ đã xác minh thực tế
                                    </span>
                                ) : (
                                    <span style={{
                                        background: '#FEF3C7',
                                        color: '#92400E',
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        padding: '2px 8px',
                                        borderRadius: '10px'
                                    }}>
                                        Đang cập nhật tọa độ
                                    </span>
                                )}
                            </div>

                            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginBottom: '8px' }}>
                                Mã địa điểm: {selectedMarker.code} • Tọa độ GPS: {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                            </div>

                            <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>
                                {selectedMarker.description}
                            </p>

                            {/* Phần hiển thị cá thể động vật trong chuồng (có Loading, Lỗi, Rỗng & Dữ liệu thực) */}
                            {(selectedMarker.enclosureId || ['carnivore', 'herbivore', 'bird', 'primate', 'petting', 'reptile', 'enclosure'].includes(selectedMarker.category)) && (
                                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#15803D' }}>
                                            Động vật cư ngụ tại chuồng này {!isLoadingEnclosureAnimals && !enclosureAnimalsError && `(${enclosureAnimals.length} cá thể)`}:
                                        </div>
                                        {isLoadingEnclosureAnimals && (
                                            <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Đang kiểm tra...</span>
                                        )}
                                    </div>

                                    {/* Trạng thái Loading */}
                                    {isLoadingEnclosureAnimals && (
                                        <div style={{
                                            padding: '16px',
                                            textAlign: 'center',
                                            background: '#F8FAFC',
                                            borderRadius: '8px',
                                            border: '1px solid #E2E8F0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px'
                                        }}>
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                border: '2px solid #CBD5E1',
                                                borderTopColor: '#15803D',
                                                borderRadius: '50%',
                                                animation: 'spin 0.8s linear infinite'
                                            }}></div>
                                            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                                                Đang truy xuất dữ liệu động vật trong chuồng từ máy chủ...
                                            </span>
                                        </div>
                                    )}

                                    {/* Trạng thái Lỗi */}
                                    {!isLoadingEnclosureAnimals && enclosureAnimalsError && (
                                        <div style={{
                                            padding: '12px 16px',
                                            background: '#FEF2F2',
                                            border: '1px solid #FCA5A5',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '10px'
                                        }}>
                                            <span style={{ fontSize: '0.82rem', color: '#991B1B' }}>
                                                ⚠️ {enclosureAnimalsError}
                                            </span>
                                            <button
                                                className="btn btn-sm"
                                                style={{
                                                    background: '#DC2626',
                                                    color: '#FFF',
                                                    borderRadius: '6px',
                                                    padding: '4px 10px',
                                                    fontSize: '0.74rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                                onClick={handleRetryLoadAnimals}
                                            >
                                                Thử lại
                                            </button>
                                        </div>
                                    )}

                                    {/* Trạng thái Rỗng (Không có động vật) */}
                                    {!isLoadingEnclosureAnimals && !enclosureAnimalsError && enclosureAnimals.length === 0 && (
                                        <div style={{
                                            padding: '16px 20px',
                                            background: '#F8FAFC',
                                            border: '1px dashed #CBD5E1',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>🏡</div>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                                                Chuồng nuôi hiện chưa có cá thể động vật
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: '1.4' }}>
                                                Khu vực này hiện đang trong giai đoạn chăm sóc cảnh quan sinh thái hoặc động vật đang được theo dõi sức khỏe định kỳ.
                                            </div>
                                        </div>
                                    )}

                                    {/* Danh sách động vật thực tế */}
                                    {!isLoadingEnclosureAnimals && !enclosureAnimalsError && enclosureAnimals.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                                            {enclosureAnimals.map(animal => (
                                                <div
                                                    key={animal.animalId || animal.id}
                                                    style={{
                                                        background: '#FFFFFF',
                                                        border: '1px solid #E2E8F0',
                                                        borderRadius: '8px',
                                                        padding: '10px 12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                    }}
                                                >
                                                    {animal.imageUrl ? (
                                                        <img
                                                            src={animal.imageUrl}
                                                            alt={animal.name}
                                                            style={{
                                                                width: '50px',
                                                                height: '50px',
                                                                borderRadius: '8px',
                                                                objectFit: 'cover',
                                                                flexShrink: 0
                                                            }}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            width: '50px',
                                                            height: '50px',
                                                            borderRadius: '8px',
                                                            background: '#F1F5F9',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '1.3rem',
                                                            flexShrink: 0
                                                        }}>
                                                            🐾
                                                        </div>
                                                    )}

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {animal.name || animal.nameVi}
                                                        </div>
                                                        <div style={{ fontSize: '0.74rem', color: '#64748B', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {animal.scientificName || animal.speciesName || 'Động vật bảo tồn'}
                                                        </div>
                                                        {animal.conservationStatus && (
                                                            <div style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: 700 }}>
                                                                {animal.conservationStatus}
                                                            </div>
                                                        )}

                                                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                                            <button
                                                                className="btn btn-sm"
                                                                style={{
                                                                    background: '#15803D',
                                                                    color: '#FFF',
                                                                    borderRadius: '6px',
                                                                    padding: '3px 8px',
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 700,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => {
                                                                    if (onOpenSpeciesNarration) onOpenSpeciesNarration(animal);
                                                                    else if (onPlayAudio) onPlayAudio(animal);
                                                                }}
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                                </svg>
                                                                <span>Nghe Audio</span>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline"
                                                                style={{
                                                                    borderRadius: '6px',
                                                                    padding: '3px 8px',
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => {
                                                                    if (onOpenDetail) onOpenDetail(animal);
                                                                }}
                                                            >
                                                                Chi tiết
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Nút hành động */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '170px' }}>
                            {selectedMarker.poiId && onPlayPoiAudio && (
                                <button
                                    className="btn btn-primary"
                                    style={{
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        backgroundColor: '#15803D',
                                        color: '#FFFFFF',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                    onClick={() => onPlayPoiAudio(selectedMarker.poiId)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                                    </svg>
                                    <span>Thuyết minh điểm này</span>
                                </button>
                            )}

                            <button
                                className="btn btn-outline"
                                style={{
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    fontSize: '0.85rem'
                                }}
                                onClick={() => handleSelectMarker(selectedMarker)}
                            >
                                ➔ Chỉ đường từ cổng
                            </button>

                            <button
                                className="btn btn-outline"
                                style={{
                                    borderRadius: '6px',
                                    fontWeight: 500,
                                    fontSize: '0.82rem'
                                }}
                                onClick={() => setSelectedMarker(null)}
                            >
                                Đóng thông tin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
