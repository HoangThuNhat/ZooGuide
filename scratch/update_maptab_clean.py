import re

file_path = "web/src/components/map/MapTab.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Clean REAL_MAP_LANDMARKS: remove enc_2 through enc_reptile
pattern_landmarks = r'(\s*\{\s*id:\s*\'poi_lake\',[\s\S]*?isVerified:\s*true\s*\},)\s*//\s*---\s*3\.\s*CÁC CHUỒNG THÚ TƯƠNG ỨNG DATABASE SUPABASE[\s\S]*?category:\s*\'carnivore\',\s*isVerified:\s*true\s*\}\s*\];'

replacement_landmarks = r"""\1
];"""

content_new, count1 = re.subn(pattern_landmarks, replacement_landmarks, content)
print(f"Replacement 1 (REAL_MAP_LANDMARKS): {count1} changes made.")

# 2. Update mergedMarkers logic
pattern_merged = r'// 2\. Hợp nhất Marker chuẩn với dữ liệu động từ Supabase[\s\S]*?return markerList;\s*\}, \[areas, enclosures, animals, dbPois\]\);'

replacement_merged = """// 2. Hợp nhất Marker chuẩn với dữ liệu thực tế từ Supabase
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
    }, [areas, enclosures, animals, dbPois]);"""

content_new, count2 = re.subn(pattern_merged, replacement_merged, content_new)
print(f"Replacement 2 (mergedMarkers): {count2} changes made.")

# 3. Update filteredMarkers
pattern_filtered = r'// 3\. Lọc danh sách marker[\s\S]*?return markerList;\s*\}, \[mergedMarkers, activeCategory, searchKeyword\]\);|// 3\. Lọc danh sách marker[\s\S]*?return true;\s*\}\);\s*\}, \[mergedMarkers, activeCategory, searchKeyword\]\);'

replacement_filtered = """// 3. Lọc danh sách marker
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
    }, [mergedMarkers, activeCategory, searchKeyword]);"""

content_new, count3 = re.subn(pattern_filtered, replacement_filtered, content_new)
print(f"Replacement 3 (filteredMarkers): {count3} changes made.")

# 4. Update createCustomDivIcon colors
pattern_colors = r'if \(marker\.category === \'gate\'\) bgColor = \'#0284C7\';[\s\S]*?else if \(marker\.category === \'petting\'\) bgColor = \'#059669\';'

replacement_colors = """if (marker.category === 'gate') bgColor = '#0284C7';
        else if (marker.category === 'landmark' || marker.category === 'botanical' || marker.category === 'attraction') bgColor = '#B45309';
        else if (marker.category === 'carnivore') bgColor = '#DC2626';
        else if (marker.category === 'herbivore') bgColor = '#16A34A';
        else if (marker.category === 'bird') bgColor = '#7C3AED';
        else if (marker.category === 'primate') bgColor = '#EA580C';
        else if (marker.category === 'petting') bgColor = '#059669';
        else if (marker.category === 'reptile') bgColor = '#0D9488';"""

content_new, count4 = re.subn(pattern_colors, replacement_colors, content_new)
print(f"Replacement 4 (createCustomDivIcon): {count4} changes made.")

# 5. Update Category chips in JSX
pattern_chips = r'\{\s*\[\s*\{\s*key:\s*\'all\',[\s\S]*?\{\s*key:\s*\'landmark\',[\s\S]*?\}\s*\]\.map'

replacement_chips = """{[
                        { key: 'all', label: 'Tất cả địa điểm', count: mergedMarkers.length },
                        { key: 'carnivore', label: 'Động vật ăn thịt', count: mergedMarkers.filter(m => m.category === 'carnivore').length },
                        { key: 'herbivore', label: 'Động vật ăn cỏ', count: mergedMarkers.filter(m => m.category === 'herbivore').length },
                        { key: 'bird', label: 'Vườn chim', count: mergedMarkers.filter(m => m.category === 'bird').length },
                        { key: 'primate', label: 'Linh trưởng', count: mergedMarkers.filter(m => m.category === 'primate').length },
                        { key: 'petting', label: 'Thú thân thiện', count: mergedMarkers.filter(m => m.category === 'petting').length },
                        { key: 'reptile', label: 'Bò sát & Lưỡng cư', count: mergedMarkers.filter(m => m.category === 'reptile').length },
                        { key: 'gate', label: 'Cổng ra vào', count: mergedMarkers.filter(m => m.category === 'gate').length },
                        { key: 'landmark', label: 'Di tích & Cảnh quan', count: mergedMarkers.filter(m => ['landmark', 'botanical', 'attraction'].includes(m.category)).length }
                    ].map"""

content_new, count5 = re.subn(pattern_chips, replacement_chips, content_new)
print(f"Replacement 5 (Category chips): {count5} changes made.")

# 6. Update Drawer resident animals trigger
pattern_drawer = r'\{\(selectedMarker\.enclosureId \|\| selectedMarker\.category === \'enclosure\'\) && \('
replacement_drawer = "{(selectedMarker.enclosureId || ['carnivore', 'herbivore', 'bird', 'primate', 'petting', 'reptile', 'enclosure'].includes(selectedMarker.category)) && ("
content_new, count6 = re.subn(pattern_drawer, replacement_drawer, content_new)
print(f"Replacement 6 (Drawer trigger): {count6} changes made.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content_new)

print("MapTab.jsx updated successfully!")
