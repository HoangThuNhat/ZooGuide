/**
 * Mạng lưới đường đi bộ thực tế (Walkway Graph Network) trong Thảo Cầm Viên Sài Gòn.
 * Tọa độ WGS84 thực tế (Latitude, Longitude) tại 2 Nguyễn Bỉnh Khiêm, Quận 1, TP.HCM.
 * Phục vụ giải thuật Dijkstra tìm đường đi ngắn nhất giữa các cổng và các chuồng trại.
 */

// 1. Tọa độ GPS WGS84 các nút giao và trạm dừng thực tế trong Thảo Cầm Viên
export const WALKWAY_NODES = {
    // --- CÁC CỔNG VÀO CHÍNH THẢO CẦM VIÊN ---
    gate_a: { id: 'gate_a', name: 'Cổng Chính A (Nguyễn Bỉnh Khiêm & Lê Duẩn)', lat: 10.785800, lng: 106.704600, type: 'entrance' },
    gate_b: { id: 'gate_b', name: 'Cổng B (Số 2B Nguyễn Bỉnh Khiêm)', lat: 10.786400, lng: 106.705800, type: 'entrance' },
    gate_c: { id: 'gate_c', name: 'Cổng C (Số 1 Nguyễn Thị Minh Khai)', lat: 10.788600, lng: 106.703200, type: 'entrance' },
    gate_e: { id: 'gate_e', name: 'Cổng E (Ven Bờ Kênh Nhiêu Lộc)', lat: 10.787600, lng: 106.707800, type: 'entrance' },

    // Backward compatibility alias
    n_entrance: { id: 'n_entrance', name: 'Cổng Chính A (Lê Duẩn)', lat: 10.785800, lng: 106.704600, type: 'entrance' },

    // --- CÁC DI TÍCH & DANH THẮNG LỊCH SỬ ---
    poi_hung: { id: 'poi_hung', name: 'Đền Thờ Vua Hùng Lịch Sử', lat: 10.786500, lng: 106.704500, type: 'landmark' },
    poi_museum: { id: 'poi_museum', name: 'Bảo Tàng Lịch Sử TP.HCM', lat: 10.786000, lng: 106.704200, type: 'landmark' },
    poi_tree: { id: 'poi_tree', name: 'Cây Sọ Khỉ Di Sản Trăm Tuổi', lat: 10.787400, lng: 106.705300, type: 'landmark' },
    poi_lake: { id: 'poi_lake', name: 'Hồ Hoa Sen & Nhà Thủy Tạ', lat: 10.787800, lng: 106.705600, type: 'landmark' },

    // --- CỔNG VÀO PHÂN KHU (AREA GATEWAYS) ---
    gate_area_1: { id: 'gate_area_1', name: 'Khu Bò Sát & Lưỡng Cư', lat: 10.788000, lng: 106.706500, type: 'gate', areaId: 1 },
    gate_area_2: { id: 'gate_area_2', name: 'Khu Vườn Thú Thiếu Nhi & Thân Thiện', lat: 10.786200, lng: 106.707200, type: 'gate', areaId: 2 },
    gate_area_3: { id: 'gate_area_3', name: 'Cổng Khu Động Vật Ăn Cỏ (Voi Châu Á)', lat: 10.788800, lng: 106.706500, type: 'gate', areaId: 3 },
    gate_area_4: { id: 'gate_area_4', name: 'Cổng Khu Chim & Lồng Vòm', lat: 10.786800, lng: 106.704000, type: 'gate', areaId: 4 },
    gate_area_5: { id: 'gate_area_5', name: 'Trục Di Tích & Cây Di Sản', lat: 10.786800, lng: 106.704800, type: 'gate', areaId: 5 },
    gate_area_6: { id: 'gate_area_6', name: 'Khu Đảo Vượn & Linh Trưởng', lat: 10.787100, lng: 106.705800, type: 'gate', areaId: 6 },
    gate_area_7: { id: 'gate_area_7', name: 'Cổng Khu Ăn Thịt (Carnivore Safari)', lat: 10.788300, lng: 106.705700, type: 'gate', areaId: 7 },

    // --- CHUỒNG THÚ LIÊN KẾT DATABASE SUPABASE ---
    // Khu Động vật ăn thịt (Area 7)
    enc_node_2: { id: 'enc_node_2', name: 'Chuồng Hổ Bengal', lat: 10.788500, lng: 106.706100, type: 'enclosure', enclosureId: 2 },
    enc_node_3: { id: 'enc_node_3', name: 'Chuồng Hổ Siberia & Hổ Trắng', lat: 10.788700, lng: 106.706400, type: 'enclosure', enclosureId: 3 },
    enc_node_7: { id: 'enc_node_7', name: 'Chuồng Sư Tử Hoàng Gia', lat: 10.788200, lng: 106.705100, type: 'enclosure', enclosureId: 7 },
    enc_node_9: { id: 'enc_node_9', name: 'Chuồng Nuôi Báo Hoa Mai', lat: 10.788400, lng: 106.705600, type: 'enclosure', enclosureId: 9 },
    enc_node_10: { id: 'enc_node_10', name: 'Chuồng Bảo Tồn Báo Gấm', lat: 10.788600, lng: 106.705400, type: 'enclosure', enclosureId: 10 },
    enc_node_11: { id: 'enc_node_11', name: 'Chuồng Nuôi Dưỡng Báo Lửa', lat: 10.788750, lng: 106.705200, type: 'enclosure', enclosureId: 11 },

    // Khu Động vật ăn cỏ (Area 3)
    enc_node_4: { id: 'enc_node_4', name: 'Bãi Thả Voi Châu Á', lat: 10.789200, lng: 106.706800, type: 'enclosure', enclosureId: 4 },
    enc_node_12: { id: 'enc_node_12', name: 'Bãi Thả Hà Mã', lat: 10.789450, lng: 106.707300, type: 'enclosure', enclosureId: 12 },
    enc_node_13: { id: 'enc_node_13', name: 'Khu Vực Tê Giác Trắng', lat: 10.789600, lng: 106.706500, type: 'enclosure', enclosureId: 13 },
    enc_node_14: { id: 'enc_node_14', name: 'Đồng Cỏ Hươu Cao Cổ', lat: 10.788950, lng: 106.707100, type: 'enclosure', enclosureId: 14 },
    enc_node_15: { id: 'enc_node_15', name: 'Khu Thảo Nguyên Ngựa Vằn', lat: 10.788800, lng: 106.707450, type: 'enclosure', enclosureId: 15 },
    enc_node_16: { id: 'enc_node_16', name: 'Chuồng Bảo Tồn Hươu Vàng', lat: 10.789100, lng: 106.706100, type: 'enclosure', enclosureId: 16 },

    // Khu Vườn Chim (Area 4)
    enc_node_5: { id: 'enc_node_5', name: 'Lồng Vòm Chim Nhiệt Đới', lat: 10.786900, lng: 106.704200, type: 'enclosure', enclosureId: 5 },
    enc_node_17: { id: 'enc_node_17', name: 'Chuồng Chim Niệc Mỏ Vằn', lat: 10.787100, lng: 106.704000, type: 'enclosure', enclosureId: 17 },
    enc_node_18: { id: 'enc_node_18', name: 'Khu Vực Cao Cát Bụng Trắng', lat: 10.787250, lng: 106.704300, type: 'enclosure', enclosureId: 18 },
    enc_node_19: { id: 'enc_node_19', name: 'Hồ Thủy Điểu & Bồ Nông', lat: 10.786700, lng: 106.704500, type: 'enclosure', enclosureId: 19 },
    enc_node_20: { id: 'enc_node_20', name: 'Khu Vực Trĩ Sao Bản Địa', lat: 10.786850, lng: 106.703800, type: 'enclosure', enclosureId: 20 },
    enc_node_21: { id: 'enc_node_21', name: 'Nhà Lưới Vẹt Trắng Mào Vàng', lat: 10.787350, lng: 106.704500, type: 'enclosure', enclosureId: 21 },

    // Khu Đảo Vượn & Linh Trưởng (Area 6)
    enc_node_22: { id: 'enc_node_22', name: 'Ngôi Nhà Đười Ươi Bornean', lat: 10.787300, lng: 106.705900, type: 'enclosure', enclosureId: 22 },
    enc_node_23: { id: 'enc_node_23', name: 'Đảo Vượn Má Vàng', lat: 10.787100, lng: 106.705800, type: 'enclosure', enclosureId: 23 },
    enc_node_24: { id: 'enc_node_24', name: 'Khu Bán Hoang Dã Voọc Chà Vá', lat: 10.786950, lng: 106.706100, type: 'enclosure', enclosureId: 24 },

    // Khu Vườn thú thiếu nhi (Area 2)
    enc_node_8: { id: 'enc_node_8', name: 'Khuôn Viên Thú Nhỏ Thân Thiện (Petting Zoo)', lat: 10.786200, lng: 106.707200, type: 'enclosure', enclosureId: 8 },

    // Khu Bò Sát & Lưỡng Cư (Area 1)
    enc_node_25: { id: 'enc_node_25', name: 'Nhà Trưng Bày Rắn Hổ Chúa & Bò Sát', lat: 10.788000, lng: 106.706500, type: 'enclosure', enclosureId: 25 },

    // --- CÁC NÚT GIAO LỐI ĐI BỘ NỘI BỘ (WALKWAY JUNCTIONS) ---
    j_avenue: { id: 'j_avenue', name: 'Đại Lộ Cổng Chính', lat: 10.786100, lng: 106.704600, type: 'junction' },
    j_central: { id: 'j_central', name: 'Ngã Tư Vườn Hoa Trung Tâm', lat: 10.786800, lng: 106.704800, type: 'junction' },
    j_gate_c: { id: 'j_gate_c', name: 'Lối Vào Cổng C', lat: 10.788000, lng: 106.703800, type: 'path' },
    j_bridge_west: { id: 'j_bridge_west', name: 'Đầu Cầu Tây Hồ Sen', lat: 10.787600, lng: 106.705300, type: 'bridge' },
    j_bridge_east: { id: 'j_bridge_east', name: 'Đầu Cầu Đông Hồ Sen', lat: 10.787700, lng: 106.705900, type: 'bridge' },
    j_lake_north: { id: 'j_lake_north', name: 'Lối Rợp Bóng Bắc Hồ Sen', lat: 10.788000, lng: 106.705500, type: 'junction' },
    j_carnivore_hub: { id: 'j_carnivore_hub', name: 'Lối Đi Nội Bộ Khu Ăn Thịt', lat: 10.788400, lng: 106.705900, type: 'path' },
    j_se_avenue: { id: 'j_se_avenue', name: 'Đại Lộ Đông Nam', lat: 10.786600, lng: 106.706500, type: 'path' },
    j_gate_b: { id: 'j_gate_b', name: 'Lối Đi Cổng B', lat: 10.786500, lng: 106.705800, type: 'path' },
    j_gate_e: { id: 'j_gate_e', name: 'Lối Ven Kênh Cổng E', lat: 10.787400, lng: 106.707400, type: 'path' }
};

// 2. Danh sách các cạnh kết nối hai chiều trong Thảo Cầm Viên
export const WALKWAY_EDGES = [
    // Cụm Cổng A và Đền Hùng
    ['gate_a', 'j_avenue'],
    ['n_entrance', 'j_avenue'],
    ['j_avenue', 'poi_hung'],
    ['poi_hung', 'poi_museum'],
    ['j_avenue', 'j_central'],

    // Cổng C và nhánh Tây
    ['gate_c', 'j_gate_c'],
    ['j_gate_c', 'j_central'],

    // Nhánh Vườn Chim (Area 4)
    ['j_central', 'gate_area_4'],
    ['gate_area_4', 'enc_node_5'],
    ['enc_node_5', 'enc_node_17'],
    ['enc_node_17', 'enc_node_18'],
    ['gate_area_4', 'enc_node_19'],
    ['gate_area_4', 'enc_node_20'],
    ['enc_node_18', 'enc_node_21'],

    // Trục Cầu Hồ Sen và Cây Di Sản (Area 5 Heritage)
    ['j_central', 'gate_area_5'],
    ['gate_area_5', 'j_bridge_west'],
    ['j_bridge_west', 'poi_tree'],
    ['j_bridge_west', 'poi_lake'],
    ['poi_lake', 'j_bridge_east'],
    ['poi_tree', 'j_lake_north'],

    // Nhánh Bò Sát & Lưỡng Cư (Area 1)
    ['j_bridge_east', 'gate_area_1'],
    ['gate_area_1', 'enc_node_25'],

    // Nhánh Linh Trưởng (Area 6)
    ['j_bridge_east', 'gate_area_6'],
    ['gate_area_6', 'enc_node_23'],
    ['enc_node_23', 'enc_node_22'],
    ['gate_area_6', 'enc_node_24'],
    ['gate_area_6', 'j_se_avenue'],

    // Nhánh Vườn Thú Thiếu Nhi & Thân Thiện (Area 2)
    ['j_se_avenue', 'gate_area_2'],
    ['gate_area_2', 'enc_node_8'],

    // Cổng B và Cổng E
    ['gate_b', 'j_gate_b'],
    ['j_gate_b', 'gate_area_6'],
    ['j_gate_b', 'gate_area_2'],
    ['j_gate_b', 'j_gate_e'],
    ['gate_e', 'j_gate_e'],
    ['j_gate_e', 'j_central'],

    // Khu Ăn Thịt (Area 7: Sư tử, Hổ Bengal, Hổ Siberia, Báo)
    ['j_lake_north', 'enc_node_7'],
    ['j_lake_north', 'gate_area_7'],
    ['gate_area_7', 'j_carnivore_hub'],
    ['j_carnivore_hub', 'enc_node_2'],
    ['enc_node_2', 'enc_node_3'],
    ['j_carnivore_hub', 'enc_node_9'],
    ['enc_node_9', 'enc_node_10'],
    ['enc_node_10', 'enc_node_11'],

    // Khu Ăn Cỏ & Bãi Thả Voi (Area 3)
    ['j_carnivore_hub', 'gate_area_3'],
    ['gate_area_3', 'enc_node_4'],
    ['enc_node_4', 'enc_node_12'],
    ['enc_node_12', 'enc_node_13'],
    ['gate_area_3', 'enc_node_14'],
    ['enc_node_14', 'enc_node_15'],
    ['gate_area_3', 'enc_node_16'],
    ['gate_area_3', 'gate_area_6']
];

// 3. Danh sách các điểm xuất phát tiện lợi cho du khách Thảo Cầm Viên
export const POPULAR_START_POINTS = [
    { id: 'gate_a', name: 'Cổng Chính A (Lê Duẩn & Nguyễn Bỉnh Khiêm)', lat: 10.785800, lng: 106.704600 },
    { id: 'gate_b', name: 'Cổng B (Số 2B Nguyễn Bỉnh Khiêm)', lat: 10.786400, lng: 106.705800 },
    { id: 'gate_c', name: 'Cổng C (Số 1 Nguyễn Thị Minh Khai)', lat: 10.788600, lng: 106.703200 },
    { id: 'gate_e', name: 'Cổng E (Bờ Kênh Nhiêu Lộc)', lat: 10.787600, lng: 106.707800 },
    { id: 'poi_hung', name: 'Đền Thờ Vua Hùng Lịch Sử', lat: 10.786500, lng: 106.704500 }
];

/**
 * Tính khoảng cách trắc địa thực tế giữa 2 tọa độ GPS (Công thức Haversine - mét)
 */
export function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Bán kính Trái Đất (mét)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Xây dựng danh sách kề (Adjacency List) có trọng số thực tế (mét)
 */
function buildAdjacencyList(nodes, edges) {
    const adj = {};
    Object.keys(nodes).forEach(id => {
        adj[id] = [];
    });

    edges.forEach(([u, v]) => {
        const nodeU = nodes[u];
        const nodeV = nodes[v];
        if (nodeU && nodeV) {
            const distM = getHaversineDistance(nodeU.lat, nodeU.lng, nodeV.lat, nodeV.lng);
            adj[u].push({ to: v, weight: distM });
            adj[v].push({ to: u, weight: distM });
        }
    });

    return adj;
}

/**
 * Tìm node gần nhất trong đồ thị với một tọa độ GPS (lat, lng) bất kỳ
 */
export function findNearestNode(nodes, targetLat, targetLng, filterFn = null) {
    let nearest = null;
    let minDist = Infinity;

    Object.values(nodes).forEach(node => {
        if (filterFn && !filterFn(node)) return;
        const dist = getHaversineDistance(node.lat, node.lng, targetLat, targetLng);
        if (dist < minDist) {
            minDist = dist;
            nearest = node;
        }
    });

    return nearest;
}

/**
 * Giải thuật Dijkstra tìm đường đi ngắn nhất trên mạng lưới lối đi bộ thực tế Thảo Cầm Viên
 */
export function findShortestPathDijkstra(startNodeId, targetNodeId, customNodes = WALKWAY_NODES, customEdges = WALKWAY_EDGES) {
    if (!customNodes[startNodeId] || !customNodes[targetNodeId]) {
        console.warn(`[Dijkstra] Không tìm thấy node: ${startNodeId} hoặc ${targetNodeId}`);
        return null;
    }

    if (startNodeId === targetNodeId) {
        const node = customNodes[startNodeId];
        return {
            pathNodes: [node],
            latlngs: [[node.lat, node.lng]],
            totalDistanceM: 0,
            timeMin: 0,
            waypoints: [node.name]
        };
    }

    const adj = buildAdjacencyList(customNodes, customEdges);
    const distances = {};
    const previous = {};
    const unvisited = new Set(Object.keys(customNodes));

    Object.keys(customNodes).forEach(id => {
        distances[id] = Infinity;
        previous[id] = null;
    });
    distances[startNodeId] = 0;

    while (unvisited.size > 0) {
        let curr = null;
        let smallestDist = Infinity;
        for (const id of unvisited) {
            if (distances[id] < smallestDist) {
                smallestDist = distances[id];
                curr = id;
            }
        }

        if (curr === null || smallestDist === Infinity) {
            break;
        }

        if (curr === targetNodeId) {
            break;
        }

        unvisited.delete(curr);

        const neighbors = adj[curr] || [];
        for (const edge of neighbors) {
            if (!unvisited.has(edge.to)) continue;
            const newDist = distances[curr] + edge.weight;
            if (newDist < distances[edge.to]) {
                distances[edge.to] = newDist;
                previous[edge.to] = curr;
            }
        }
    }

    if (distances[targetNodeId] === Infinity) {
        console.warn(`[Dijkstra] Không có đường đi từ ${startNodeId} tới ${targetNodeId}`);
        return null;
    }

    const pathNodes = [];
    let curr = targetNodeId;
    while (curr) {
        pathNodes.unshift(customNodes[curr]);
        curr = previous[curr];
    }

    let totalDistM = 0;
    for (let i = 0; i < pathNodes.length - 1; i++) {
        totalDistM += getHaversineDistance(pathNodes[i].lat, pathNodes[i].lng, pathNodes[i+1].lat, pathNodes[i+1].lng);
    }

    const totalDistanceM = Math.max(10, Math.round(totalDistM));
    // Tốc độ đi bộ dạo sở thú ~ 65m/phút (~4km/h)
    const timeMin = Math.max(1, Math.ceil(totalDistanceM / 65));
    const latlngs = pathNodes.map(p => [p.lat, p.lng]);
    const waypoints = pathNodes.map(p => p.name).filter(Boolean);

    return {
        pathNodes,
        latlngs,
        totalDistanceM,
        timeMin,
        waypoints
    };
}

/**
 * Tìm lộ trình đi bộ thực tế tới Khu vực (Area) hoặc Chuồng (Enclosure)
 */
export function planZooRoute({ startPoint, targetType, targetEntity, currentNodes = WALKWAY_NODES, currentEdges = WALKWAY_EDGES }) {
    let startNodeId = typeof startPoint === 'string' ? startPoint : startPoint?.id;
    if (!startNodeId || !currentNodes[startNodeId]) {
        const targetLat = startPoint?.lat ?? 10.7858;
        const targetLng = startPoint?.lng ?? 106.7046;
        const nearestStart = findNearestNode(currentNodes, targetLat, targetLng);
        startNodeId = nearestStart ? nearestStart.id : 'gate_a';
    }

    let targetNodeId = null;

    if (targetType === 'enclosure') {
        const encId = targetEntity.enclosureId || targetEntity.id;
        const staticEncNodeId = `enc_node_${encId}`;
        if (currentNodes[staticEncNodeId]) {
            targetNodeId = staticEncNodeId;
        } else if (targetEntity.areaId && currentNodes[`gate_area_${targetEntity.areaId}`]) {
            targetNodeId = `gate_area_${targetEntity.areaId}`;
        } else if (targetEntity.latitude && targetEntity.longitude) {
            const nearest = findNearestNode(currentNodes, Number(targetEntity.latitude), Number(targetEntity.longitude));
            targetNodeId = nearest?.id;
        }
    } else if (targetType === 'area') {
        const areaId = targetEntity.areaId || targetEntity.id;
        const staticGateNodeId = `gate_area_${areaId}`;
        if (currentNodes[staticGateNodeId]) {
            targetNodeId = staticGateNodeId;
        } else if (targetEntity.latitude && targetEntity.longitude) {
            const nearest = findNearestNode(currentNodes, Number(targetEntity.latitude), Number(targetEntity.longitude));
            targetNodeId = nearest?.id;
        }
    } else if (targetType === 'node') {
        targetNodeId = targetEntity.id;
    }

    if (!targetNodeId) {
        console.warn("[planZooRoute] Không thể xác định điểm đích");
        return null;
    }

    const result = findShortestPathDijkstra(startNodeId, targetNodeId, currentNodes, currentEdges);
    if (!result) return null;

    return {
        ...result,
        startNode: currentNodes[startNodeId],
        targetEntity,
        targetType,
        destinationName: targetType === 'enclosure' 
            ? targetEntity.name 
            : (targetEntity.nameVi || targetEntity.name || 'Điểm đến')
    };
}
