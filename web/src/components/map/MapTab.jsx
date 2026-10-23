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

    // --- 3. CÁC CHUỒNG THÚ TƯƠNG ỨNG DATABASE SUPABASE ---
    {
        id: 'enc_2',
        enclosureId: 2,
        areaId: 7,
        code: 'ENC-TIG-01',
        name: 'Chuồng Hổ Bengal',
        description: 'Khu chuồng bán hoang dã dành cho loài hổ Bengal quý hiếm, trang bị suối tắm, vách đá nhân tạo và bãi cỏ tự nhiên.',
        lat: 10.788500,
        lng: 106.706100,
        category: 'carnivore',
        isVerified: true
    },
    {
        id: 'enc_3',
        enclosureId: 3,
        areaId: 7,
        code: 'ENC-TIG-02',
        name: 'Chuồng Hổ Siberia & Hổ Trắng',
        description: 'Khuôn viên nuôi dưỡng và bảo tồn loài hổ trắng kỳ vĩ cùng hổ Siberia to lớn.',
        lat: 10.788700,
        lng: 106.706400,
        category: 'carnivore',
        isVerified: true
    },
    {
        id: 'enc_7',
        enclosureId: 7,
        areaId: 7,
        code: 'ENC-LIO-01',
        name: 'Chuồng Sư Tử Hoàng Gia',
        description: 'Không gian mở rộng dành cho đàn sư tử châu Phi với gò đá cao đón nắng và khu vực nghỉ ngơi mát mẻ.',
        lat: 10.788200,
        lng: 106.705100,
        category: 'carnivore',
        isVerified: true
    },
    {
        id: 'enc_4',
        enclosureId: 4,
        areaId: 3,
        code: 'ENC-ELE-01',
        name: 'Bãi Thả Voi Châu Á',
        description: 'Khu bãi thả đất rộng rãi với hồ tắm bùn tự nhiên, nơi các cá thể voi châu Á sinh hoạt và giao lưu thân thiện cùng du khách.',
        lat: 10.789200,
        lng: 106.706800,
        category: 'herbivore',
        isVerified: true
    },
    {
        id: 'enc_5',
        enclosureId: 5,
        areaId: 4,
        code: 'ENC-BIR-01',
        name: 'Lồng Vòm Chim Nhiệt Đới & Hồ Hồng Hạc',
        description: 'Quần xã lồng vòm cao vút và hồ hồng hạc rực rỡ với hàng trăm loài chim quý hiếm của Việt Nam và thế giới.',
        lat: 10.786900,
        lng: 106.704200,
        category: 'bird',
        isVerified: true
    },
    {
        id: 'enc_8',
        enclosureId: 8,
        areaId: 6,
        code: 'ENC-PET-01',
        name: 'Khuôn Viên Thú Nhỏ Thân Thiện (Petting Zoo)',
        description: 'Khu vực thú thiếu nhi thân thiện, nơi các bé có thể tiếp xúc trực tiếp, vuốt ve và cho dê lùn, cừu, thỏ ăn rau cỏ tươi.',
        lat: 10.786200,
        lng: 106.707200,
        category: 'petting',
        isVerified: true
    },
    {
        id: 'enc_primate',
        enclosureId: 99,
        areaId: 6,
        code: 'ENC-PRI-01',
        name: 'Khu Đảo Vượn & Linh Trưởng Quý Hiếm',
        description: 'Khu vực đảo nổi giữa rặng cây nuôi dưỡng vượn má vàng, voọc chà vá chân nâu và khỉ đuôi dài.',
        lat: 10.787100,
        lng: 106.705800,
        category: 'primate',
        isVerified: true
    },
    {
        id: 'enc_reptile',
        enclosureId: 98,
        areaId: 7,
        code: 'ENC-REP-01',
        name: 'Khu Bảo Tồn Bò Sát & Trăn Rắn',
        description: 'Nhà trưng bày kính điều hòa nhiệt độ nuôi dưỡng cá sấu hoa cà, trăn gấm, kỳ đà và các loài rùa cạn.',
        lat: 10.788000,
        lng: 106.706500,
        category: 'carnivore',
        isVerified: true
    }
];

export default function MapTab({ onPlayAudio, onOpenDetail, onOpenSpeciesNarration }) {
    const { 
        showToast, 
        navTargetAnimal,
        setNavTargetAnimal,
        currentLang 
    } = useApp();

    // Dữ liệu từ Supabase API
    const [areas, setAreas] = useState([]);
    const [enclosures, setEnclosures] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Trạng thái tìm kiếm & phân loại
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedMarker, setSelectedMarker] = useState(null);

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

    // 1. Tải dữ liệu thực tế từ Supabase API
    const loadMapData = useCallback(async (lang = currentLang) => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const [resAreas, resEnclosures, resAnimals] = await Promise.all([
                ZooApi.getAreas(lang),
                ZooApi.getEnclosures({ lang }),
                ZooApi.getAnimals({ lang })
            ]);

            if (resAreas && resAreas.success) setAreas(resAreas.data || []);
            if (resEnclosures && resEnclosures.success) setEnclosures(resEnclosures.data || []);
            if (resAnimals && resAnimals.success) setAnimals(resAnimals.data || []);
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

    // 2. Hợp nhất Marker chuẩn với dữ liệu động từ Supabase
    const mergedMarkers = useMemo(() => {
        const markerList = [...REAL_MAP_LANDMARKS];

        // Gắn danh sách động vật thực tế vào các chuồng tương ứng
        markerList.forEach(m => {
            if (m.enclosureId) {
                m.residentAnimals = animals.filter(a => a.enclosureId === m.enclosureId || a.areaId === m.areaId);
                m.animalCount = m.residentAnimals.length;

                const dbEnc = enclosures.find(e => e.enclosureId === m.enclosureId);
                if (dbEnc) {
                    if (dbEnc.name) m.name = dbEnc.name;
                    if (dbEnc.description) m.description = dbEnc.description;
                    if (dbEnc.imageUrl) m.imageUrl = dbEnc.imageUrl;
                    if (dbEnc.latitude && dbEnc.longitude) {
                        m.lat = Number(dbEnc.latitude);
                        m.lng = Number(dbEnc.longitude);
                    }
                }
            } else {
                m.residentAnimals = [];
                m.animalCount = 0;
            }
        });

        // Bổ sung các chuồng mới từ DB chưa có trong danh sách chuẩn (đánh dấu Unverified nếu thiếu tọa độ)
        enclosures.forEach(dbEnc => {
            const exists = markerList.some(m => m.enclosureId === dbEnc.enclosureId);
            if (!exists) {
                const parentArea = areas.find(a => a.areaId === dbEnc.areaId);
                const hasLatLong = Boolean(dbEnc.latitude && dbEnc.longitude);

                markerList.push({
                    id: `db_enc_${dbEnc.enclosureId}`,
                    enclosureId: dbEnc.enclosureId,
                    areaId: dbEnc.areaId,
                    code: dbEnc.code || `ENC-${dbEnc.enclosureId}`,
                    name: dbEnc.name,
                    description: dbEnc.description || 'Chuồng đang được cập nhật thông tin thực địa.',
                    lat: hasLatLong ? Number(dbEnc.latitude) : (parentArea?.latitude ? Number(parentArea.latitude) : 10.7876),
                    lng: hasLatLong ? Number(dbEnc.longitude) : (parentArea?.longitude ? Number(parentArea.longitude) : 106.7053),
                    category: 'enclosure',
                    isVerified: hasLatLong, // Đánh dấu rõ ràng tình trạng xác minh tọa độ
                    residentAnimals: animals.filter(a => a.enclosureId === dbEnc.enclosureId),
                    animalCount: animals.filter(a => a.enclosureId === dbEnc.enclosureId).length
                });
            }
        });

        return markerList;
    }, [areas, enclosures, animals]);

    // 3. Lọc danh sách marker
    const filteredMarkers = useMemo(() => {
        return mergedMarkers.filter(m => {
            if (activeCategory !== 'all') {
                if (activeCategory === 'gate' && m.category !== 'gate') return false;
                if (activeCategory === 'landmark' && m.category !== 'landmark') return false;
                if (activeCategory === 'carnivore' && m.category !== 'carnivore') return false;
                if (activeCategory === 'herbivore' && m.category !== 'herbivore') return false;
                if (activeCategory === 'bird' && m.category !== 'bird') return false;
                if (activeCategory === 'primate' && m.category !== 'primate') return false;
                if (activeCategory === 'petting' && m.category !== 'petting') return false;
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
        else if (marker.category === 'landmark') bgColor = '#B45309';
        else if (marker.category === 'carnivore') bgColor = '#DC2626';
        else if (marker.category === 'bird') bgColor = '#7C3AED';
        else if (marker.category === 'petting') bgColor = '#059669';

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
                    padding: ${isSelected ? '5px 10px' : '4px 8px'};
                    border-radius: 20px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
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
                borderRadius: '20px',
                padding: '16px 20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                marginBottom: '14px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>
                                Bản Đồ Địa Lý Thảo Cầm Viên Sài Gòn
                            </h2>
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#15803D', fontWeight: 600 }}>
                            Nền tảng bản đồ địa lý thực tế (OpenStreetMap) • Tọa độ GPS chính xác 2 Nguyễn Bỉnh Khiêm, Quận 1
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Dropdown cổng xuất phát */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', padding: '6px 12px', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534' }}>Cổng xuất phát:</span>
                            <select
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
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
                                    padding: '8px 14px 8px 32px',
                                    fontSize: '0.85rem',
                                    borderRadius: '20px',
                                    border: '1px solid #CBD5E1',
                                    outline: 'none',
                                    background: '#F8FAFC'
                                }}
                                placeholder="Tìm chuồng, thú, cổng..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.85rem' }}>
                                🔍
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
                            style={{ borderRadius: '12px', fontWeight: 600 }}
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
                        { key: 'gate', label: 'Cổng ra vào', count: mergedMarkers.filter(m => m.category === 'gate').length },
                        { key: 'landmark', label: 'Di tích & Cây cổ thụ', count: mergedMarkers.filter(m => m.category === 'landmark').length }
                    ].map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            style={{
                                padding: '5px 12px',
                                borderRadius: '16px',
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

            {/* Khung chứa Bản Đồ Địa Lý Thực Tế Leaflet */}
            <div style={{
                position: 'relative',
                width: '100%',
                height: '68vh',
                minHeight: '520px',
                borderRadius: '24px',
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
                        borderRadius: '14px',
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
                            style={{ width: '36px', height: '36px', fontSize: '1.1rem', background: '#FFF', color: '#2563EB' }}
                        >
                            🎯
                        </button>
                    </div>
                </div>

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
                        borderRadius: '16px',
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
                    borderRadius: '20px',
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
                                        🟡 Đang cập nhật tọa độ
                                    </span>
                                )}
                            </div>

                            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginBottom: '8px' }}>
                                Mã địa điểm: {selectedMarker.code} • Tọa độ GPS: {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                            </div>

                            <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>
                                {selectedMarker.description}
                            </p>

                            {/* Danh sách các cá thể thú cư ngụ */}
                            {selectedMarker.residentAnimals && selectedMarker.residentAnimals.length > 0 && (
                                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#15803D', marginBottom: '8px' }}>
                                        Động vật cư ngụ tại chuồng này ({selectedMarker.residentAnimals.length} cá thể):
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                                        {selectedMarker.residentAnimals.map(animal => (
                                            <div
                                                key={animal.animalId || animal.id}
                                                style={{
                                                    background: '#F8FAFC',
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '12px',
                                                    padding: '8px 12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '8px'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>
                                                        {animal.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
                                                        {animal.scientificName || animal.species || 'Động vật quý hiếm'}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{
                                                            background: '#15803D',
                                                            color: '#FFF',
                                                            borderRadius: '6px',
                                                            padding: '4px 8px',
                                                            fontSize: '0.72rem',
                                                            fontWeight: 700
                                                        }}
                                                        onClick={() => {
                                                            if (onOpenSpeciesNarration) onOpenSpeciesNarration(animal);
                                                            else if (onPlayAudio) onPlayAudio(animal);
                                                        }}
                                                    >
                                                        Nghe Audio
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        style={{
                                                            borderRadius: '6px',
                                                            padding: '4px 8px',
                                                            fontSize: '0.72rem',
                                                            fontWeight: 700
                                                        }}
                                                        onClick={() => {
                                                            if (onOpenDetail) onOpenDetail(animal);
                                                        }}
                                                    >
                                                        Chi tiết
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Nút hành động */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' }}>
                            <button
                                className="btn btn-primary"
                                style={{
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    background: '#15803D'
                                }}
                                onClick={() => handleSelectMarker(selectedMarker)}
                            >
                                Chỉ đường từ cổng
                            </button>

                            <button
                                className="btn btn-outline"
                                style={{
                                    borderRadius: '10px',
                                    fontWeight: 600,
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
