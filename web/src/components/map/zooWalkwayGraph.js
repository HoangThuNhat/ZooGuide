/**
 * Mạng lưới đường đi bộ thực tế (Walkway Graph Network) trong Thảo Cầm Viên ZooGuide.
 * Bao gồm các điểm nút (Nodes) và cạnh có trọng số (Edges) phục vụ thuật toán Dijkstra.
 */

// 1. Tọa độ các nút giao và trạm dừng trên bản đồ (1000 x 700)
export const WALKWAY_NODES = {
    // Khu vực Cổng vào & Trục chính phía Nam
    n_entrance: { id: 'n_entrance', name: 'Cổng Vào Chính (Main Entrance)', x: 500, y: 650, type: 'entrance' },
    n_gate_avenue: { id: 'n_gate_avenue', name: 'Đại Lộ Cổng Vào', x: 500, y: 585, type: 'junction' },
    n_central_plaza: { id: 'n_central_plaza', name: 'Quảng Trường Trung Tâm', x: 500, y: 520, type: 'plaza' },

    // Nhánh Đông Nam (Dịch vụ & Nghỉ chân)
    n_se_plaza: { id: 'n_se_plaza', name: 'Khu Dịch Vụ Phía Đông', x: 650, y: 520, type: 'junction' },
    n_east_promenade: { id: 'n_east_promenade', name: 'Đại Lộ Vườn Hoa Đông', x: 670, y: 440, type: 'path' },

    // Nhánh Tây Nam
    n_sw_junction: { id: 'n_sw_junction', name: 'Ngã Ba Phía Tây', x: 360, y: 520, type: 'junction' },

    // Vành đai ven Hồ Cảnh Quan
    n_lake_south: { id: 'n_lake_south', name: 'Bến Nam Hồ Cảnh Quan', x: 500, y: 440, type: 'junction' },
    n_lake_sw: { id: 'n_lake_sw', name: 'Đường Ven Hồ Tây Nam', x: 290, y: 440, type: 'path' },
    n_lake_west: { id: 'n_lake_west', name: 'Đường Rợp Bóng Ven Hồ', x: 260, y: 340, type: 'path' },
    n_lake_nw: { id: 'n_lake_nw', name: 'Lối Ven Hồ Tây Bắc', x: 280, y: 250, type: 'path' },
    n_lake_se: { id: 'n_lake_se', name: 'Đường Ven Hồ Đông Nam', x: 540, y: 430, type: 'path' },
    n_lake_east: { id: 'n_lake_east', name: 'Đường Ven Hồ Phía Đông', x: 540, y: 330, type: 'path' },
    n_lake_ne: { id: 'n_lake_ne', name: 'Lối Ven Hồ Đông Bắc', x: 490, y: 240, type: 'path' },
    n_lake_north: { id: 'n_lake_north', name: 'Ngã Tư Bắc Hồ Cảnh Quan', x: 390, y: 230, type: 'junction' },

    // Cầu cảnh quan băng qua hồ
    n_bridge_west: { id: 'n_bridge_west', name: 'Đầu Cầu Cảnh Quan (Tây)', x: 330, y: 340, type: 'bridge' },
    n_bridge_east: { id: 'n_bridge_east', name: 'Đầu Cầu Cảnh Quan (Đông)', x: 470, y: 340, type: 'bridge' },

    // Vòng xoay Bắc Thảo Cầm Viên
    n_north_hub: { id: 'n_north_hub', name: 'Vòng Xoay Bắc Thảo Cầm Viên', x: 470, y: 190, type: 'plaza' },

    // CỔNG CHÍNH CÁC PHÂN KHU (AREA GATEWAYS)
    gate_area_7: { id: 'gate_area_7', name: 'Cổng Khu Động Vật Ăn Thịt', x: 500, y: 170, type: 'gate', areaId: 7 },
    n_carnivore_hub: { id: 'n_carnivore_hub', name: 'Lối Đi Nội Bộ Khu Ăn Thịt', x: 550, y: 160, type: 'path' },

    gate_area_3: { id: 'gate_area_3', name: 'Cổng Khu Động Vật Ăn Cỏ', x: 520, y: 440, type: 'gate', areaId: 3 },
    n_herbivore_loop: { id: 'n_herbivore_loop', name: 'Đường Vành Đai Bãi Thả Voi', x: 480, y: 410, type: 'path' },

    gate_area_4: { id: 'gate_area_4', name: 'Cổng Khu Chim & Lồng Vòm', x: 370, y: 260, type: 'gate', areaId: 4 },
    gate_area_6: { id: 'gate_area_6', name: 'Cổng Khu Thú Nhỏ & Linh Trưởng', x: 240, y: 230, type: 'gate', areaId: 6 },

    // LỐI VÀO CỤ THỂ CÁC CHUỒNG TRẠI (ENCLOSURE ENTRANCES)
    enc_node_2: { id: 'enc_node_2', name: 'Chuồng Hổ Bengal', x: 470, y: 110, type: 'enclosure', enclosureId: 2 },
    enc_node_3: { id: 'enc_node_3', name: 'Chuồng Hổ Siberia', x: 550, y: 140, type: 'enclosure', enclosureId: 3 },
    enc_node_7: { id: 'enc_node_7', name: 'Chuồng Sư Tử Hoàng Gia', x: 630, y: 110, type: 'enclosure', enclosureId: 7 },
    enc_node_4: { id: 'enc_node_4', name: 'Bãi Thả Voi Châu Á', x: 460, y: 380, type: 'enclosure', enclosureId: 4 },
    enc_node_5: { id: 'enc_node_5', name: 'Lồng Vòm Chim Nhiệt Đới', x: 350, y: 240, type: 'enclosure', enclosureId: 5 },
    enc_node_8: { id: 'enc_node_8', name: 'Khuôn Viên Thú Nhỏ Thân Thiện', x: 200, y: 210, type: 'enclosure', enclosureId: 8 }
};

// 2. Danh sách các cạnh kết nối hai chiều
export const WALKWAY_EDGES = [
    // Trục chính
    ['n_entrance', 'n_gate_avenue'],
    ['n_gate_avenue', 'n_central_plaza'],
    ['n_central_plaza', 'n_lake_south'],
    ['n_central_plaza', 'n_se_plaza'],
    ['n_central_plaza', 'n_sw_junction'],

    // Phía Đông Nam
    ['n_se_plaza', 'n_east_promenade'],
    ['n_east_promenade', 'n_lake_se'],

    // Ven hồ Nam & Tây
    ['n_sw_junction', 'n_lake_sw'],
    ['n_lake_south', 'n_lake_sw'],
    ['n_lake_south', 'n_lake_se'],
    ['n_lake_sw', 'n_lake_west'],
    ['n_lake_west', 'n_lake_nw'],
    ['n_lake_nw', 'n_lake_north'],

    // Cầu cảnh quan qua hồ
    ['n_lake_west', 'n_bridge_west'],
    ['n_bridge_west', 'n_bridge_east'],
    ['n_bridge_east', 'n_lake_east'],

    // Ven hồ Đông & Bắc
    ['n_lake_se', 'n_lake_east'],
    ['n_lake_east', 'n_lake_ne'],
    ['n_lake_ne', 'n_north_hub'],
    ['n_lake_north', 'n_north_hub'],

    // Khu Động Vật Ăn Thịt (Area 7)
    ['n_north_hub', 'gate_area_7'],
    ['gate_area_7', 'n_carnivore_hub'],
    ['n_carnivore_hub', 'enc_node_2'],
    ['n_carnivore_hub', 'enc_node_3'],
    ['n_carnivore_hub', 'enc_node_7'],
    ['enc_node_2', 'enc_node_3'],
    ['enc_node_3', 'enc_node_7'],

    // Khu Động Vật Ăn Cỏ (Area 3)
    ['n_lake_se', 'gate_area_3'],
    ['gate_area_3', 'n_herbivore_loop'],
    ['n_herbivore_loop', 'enc_node_4'],

    // Khu Chim (Area 4)
    ['n_lake_north', 'gate_area_4'],
    ['gate_area_4', 'enc_node_5'],

    // Khu Thú Nhỏ & Linh Trưởng (Area 6)
    ['n_lake_nw', 'gate_area_6'],
    ['gate_area_6', 'enc_node_8']
];

// 3. Danh sách các điểm xuất phát tiện lợi cho du khách
export const POPULAR_START_POINTS = [
    { id: 'n_entrance', name: '🚪 Cổng Vào Chính (Main Entrance)', x: 500, y: 650 },
    { id: 'n_central_plaza', name: '🏛️ Quảng Trường Trung Tâm', x: 500, y: 520 },
    { id: 'n_bridge_east', name: '🌉 Cầu Cảnh Quan Băng Hồ', x: 470, y: 340 },
    { id: 'n_se_plaza', name: '☕ Khu Dịch Vụ & Ăn Uống Phía Đông', x: 650, y: 520 },
    { id: 'n_north_hub', name: '🎪 Vòng Xoay Bắc Thảo Cầm Viên', x: 470, y: 190 }
];

/**
 * Xây dựng danh sách kề (Adjacency List) có trọng số từ danh sách cạnh
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
            const dist = Math.hypot(nodeU.x - nodeV.x, nodeU.y - nodeV.y);
            adj[u].push({ to: v, weight: dist });
            adj[v].push({ to: u, weight: dist });
        }
    });

    return adj;
}

/**
 * Tìm node gần nhất trong đồ thị với một tọa độ (x, y) bất kỳ
 */
export function findNearestNode(nodes, targetX, targetY, filterFn = null) {
    let nearest = null;
    let minDist = Infinity;

    Object.values(nodes).forEach(node => {
        if (filterFn && !filterFn(node)) return;
        const dist = Math.hypot(node.x - targetX, node.y - targetY);
        if (dist < minDist) {
            minDist = dist;
            nearest = node;
        }
    });

    return nearest;
}

/**
 * Giải thuật Dijkstra tìm đường đi ngắn nhất giữa hai node trong đồ thị đường bộ
 * @param {string} startNodeId - Mã node xuất phát
 * @param {string} targetNodeId - Mã node đích
 * @param {Object} customNodes - Danh sách node (mặc định dùng WALKWAY_NODES)
 * @param {Array} customEdges - Danh sách cạnh (mặc định dùng WALKWAY_EDGES)
 * @returns {Object|null} Kết quả lộ trình: { pathNodes, totalDistanceM, timeMin, pathD, waypoints }
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
            totalDistanceM: 0,
            timeMin: 0,
            pathD: `M ${node.x} ${node.y} L ${node.x} ${node.y}`,
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
        // Tìm node chưa thăm có khoảng cách nhỏ nhất
        let curr = null;
        let smallestDist = Infinity;
        for (const id of unvisited) {
            if (distances[id] < smallestDist) {
                smallestDist = distances[id];
                curr = id;
            }
        }

        if (curr === null || smallestDist === Infinity) {
            break; // Các node còn lại không đến được
        }

        if (curr === targetNodeId) {
            break; // Đã đến đích tối ưu
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

    // Tái cấu trúc chuỗi node từ target về start
    const pathNodes = [];
    let curr = targetNodeId;
    while (curr) {
        pathNodes.unshift(customNodes[curr]);
        curr = previous[curr];
    }

    // Tính toán khoảng cách thực tế (Scale: 1 đơn vị SVG ~ 0.5 mét thực tế)
    let totalSvgDist = 0;
    for (let i = 0; i < pathNodes.length - 1; i++) {
        totalSvgDist += Math.hypot(pathNodes[i+1].x - pathNodes[i].x, pathNodes[i+1].y - pathNodes[i].y);
    }

    const totalDistanceM = Math.max(15, Math.round(totalSvgDist * 0.52));
    // Vận tốc đi bộ thong thả ~68m/phút
    const timeMin = Math.max(1, Math.ceil(totalDistanceM / 68));

    // Xây dựng SVG Path d="M x0 y0 L x1 y1 L x2 y2 ..."
    const pathD = pathNodes.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const waypoints = pathNodes.map(p => p.name).filter(Boolean);

    return {
        pathNodes,
        totalDistanceM,
        timeMin,
        pathD,
        waypoints
    };
}

/**
 * Tìm lộ trình thông minh từ bất kỳ điểm xuất phát tới Khu vực (Area) hoặc Chuồng (Enclosure)
 * Tự động tạo kết nối mềm (temporary connector) nếu đối tượng nằm ngoài các node tĩnh.
 */
export function planZooRoute({ startPoint, targetType, targetEntity, currentNodes = WALKWAY_NODES, currentEdges = WALKWAY_EDGES }) {
    // 1. Xác định start node id
    let startNodeId = typeof startPoint === 'string' ? startPoint : startPoint?.id;
    if (!startNodeId || !currentNodes[startNodeId]) {
        // Tìm node gần nhất với tọa độ startPoint
        const nearestStart = findNearestNode(currentNodes, startPoint.x, startPoint.y);
        startNodeId = nearestStart ? nearestStart.id : 'n_entrance';
    }

    // 2. Xác định target node id
    let targetNodeId = null;

    if (targetType === 'enclosure') {
        const encId = targetEntity.enclosureId || targetEntity.id;
        // Kiểm tra xem đã có node tĩnh cho chuồng này chưa
        const staticEncNodeId = `enc_node_${encId}`;
        if (currentNodes[staticEncNodeId]) {
            targetNodeId = staticEncNodeId;
        } else {
            // Nếu là chuồng mới tạo động bởi Admin, tìm cổng Area trực thuộc hoặc đường đi bộ gần nhất
            if (targetEntity.areaId && currentNodes[`gate_area_${targetEntity.areaId}`]) {
                targetNodeId = `gate_area_${targetEntity.areaId}`;
            } else {
                const nearest = findNearestNode(currentNodes, Number(targetEntity.mapX || 500), Number(targetEntity.mapY || 350));
                targetNodeId = nearest?.id;
            }
        }
    } else if (targetType === 'area') {
        const areaId = targetEntity.areaId || targetEntity.id;
        const staticGateNodeId = `gate_area_${areaId}`;
        if (currentNodes[staticGateNodeId]) {
            targetNodeId = staticGateNodeId;
        } else {
            // Tìm node gần nhất với tâm khu vực
            const nearest = findNearestNode(currentNodes, Number(targetEntity.mapX || 500), Number(targetEntity.mapY || 350));
            targetNodeId = nearest?.id;
        }
    } else if (targetType === 'node') {
        targetNodeId = targetEntity.id;
    }

    if (!targetNodeId) {
        console.warn("[planZooRoute] Không thể xác định điểm đích");
        return null;
    }

    // Chạy Dijkstra
    const result = findShortestPathDijkstra(startNodeId, targetNodeId, currentNodes, currentEdges);
    if (!result) return null;

    // Nếu targetEntity là Enclosure và điểm cuối chưa khớp chính xác tọa độ chuồng, bổ sung chặng nối cuối
    if (targetType === 'enclosure' && targetEntity.mapX != null && targetEntity.mapY != null) {
        const lastNode = result.pathNodes[result.pathNodes.length - 1];
        const distToEnc = Math.hypot(Number(targetEntity.mapX) - lastNode.x, Number(targetEntity.mapY) - lastNode.y);
        if (distToEnc > 5) {
            result.pathNodes.push({
                id: `dynamic_enc_${targetEntity.enclosureId || targetEntity.id}`,
                name: targetEntity.name,
                x: Number(targetEntity.mapX),
                y: Number(targetEntity.mapY),
                type: 'enclosure'
            });
            result.pathD += ` L ${targetEntity.mapX} ${targetEntity.mapY}`;
            result.totalDistanceM += Math.round(distToEnc * 0.52);
            result.timeMin = Math.max(1, Math.ceil(result.totalDistanceM / 68));
        }
    }

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
