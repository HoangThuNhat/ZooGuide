import re

file_path = "web/src/pages/admin/AdminAreasPage.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update initialAreaForm: remove default coordinates
pattern_init_area = r'latitude:\s*\'10\.7875\',\s*longitude:\s*\'10\.7852\'|latitude:\s*\'10\.7875\',\s*longitude:\s*\'10\.7052\''
replacement_init_area = "latitude: '',\n        longitude: ''"
content, c1 = re.subn(pattern_init_area, replacement_init_area, content)
print(f"Sub 1 (init area form): {c1}")

# 2. Update handleAreaSubmit: validate coordinates rather than defaulting to 10.7875 / 106.7052
pattern_submit_area = r'latitude:\s*parseFloat\(areaForm\.latitude\)\s*\|\|\s*10\.7875,\s*longitude:\s*parseFloat\(areaForm\.longitude\)\s*\|\|\s*10\.7052,'
replacement_submit_area = """latitude: areaForm.latitude !== '' ? parseFloat(areaForm.latitude) : null,
            longitude: areaForm.longitude !== '' ? parseFloat(areaForm.longitude) : null,"""
content, c2 = re.subn(pattern_submit_area, replacement_submit_area, content)
print(f"Sub 2 (submit area coords): {c2}")

# 3. Update handleEditArea coords
pattern_edit_coords = r'latitude:\s*String\(area\.latitude\s*\|\|\s*\'10\.7875\'\),\s*longitude:\s*String\(area\.longitude\s*\|\|\s*\'10\.7052\'\),'
replacement_edit_coords = """latitude: area.latitude != null ? String(area.latitude) : '',
            longitude: area.longitude != null ? String(area.longitude) : '',"""
content, c3 = re.subn(pattern_edit_coords, replacement_edit_coords, content)
print(f"Sub 3 (edit area coords): {c3}")

# 4. Update initialEnclosureForm to include latitude and longitude
pattern_init_enc = r'status:\s*\'Active\',\s*mapX:\s*450,'
replacement_init_enc = "status: 'Active',\n        latitude: '',\n        longitude: '',\n        mapX: 450,"
content, c4 = re.subn(pattern_init_enc, replacement_init_enc, content)
print(f"Sub 4 (init enc form): {c4}")

# 5. Update handleEnclosureSubmit to pass latitude & longitude
pattern_submit_enc = r'imageUrl:\s*enclosureForm\.imageUrl\.trim\(\),\s*status:\s*enclosureForm\.status,'
replacement_submit_enc = """imageUrl: enclosureForm.imageUrl.trim(),
            status: enclosureForm.status,
            latitude: enclosureForm.latitude !== '' ? parseFloat(enclosureForm.latitude) : null,
            longitude: enclosureForm.longitude !== '' ? parseFloat(enclosureForm.longitude) : null,"""
content, c5 = re.subn(pattern_submit_enc, replacement_submit_enc, content)
print(f"Sub 5 (submit enc coords): {c5}")

# 6. Update handleEditEnclosure to load latitude & longitude
pattern_edit_enc = r'status:\s*enc\.status\s*\|\|\s*\'Active\',\s*mapX:\s*enc\.mapX\s*!='
replacement_edit_enc = """status: enc.status || 'Active',
            latitude: enc.latitude != null ? String(enc.latitude) : '',
            longitude: enc.longitude != null ? String(enc.longitude) : '',
            mapX: enc.mapX !="""
content, c6 = re.subn(pattern_edit_enc, replacement_edit_enc, content)
print(f"Sub 6 (edit enc coords): {c6}")

# 7. Add Enclosure breakdown in Area card
pattern_card_stat = r'(<div className="admin-stat-row">\s*<span>Số lượng cá thể thú:</span>\s*<strong>\{area\.animalCount \?\? 0\} cá thể</strong>\s*</div>)'
replacement_card_stat = r"""\1
                                                {/* Danh sách chuồng trực thuộc và số lượng cá thể trong từng chuồng */}
                                                {enclosures.filter(e => e.areaId === (area.areaId || area.id)).length > 0 && (
                                                    <div style={{ marginTop: '8px', padding: '6px 8px', background: '#F8FAFC', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #E2E8F0' }}>
                                                        <div style={{ fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Các chuồng trực thuộc ({enclosures.filter(e => e.areaId === (area.areaId || area.id)).length}):</div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '120px', overflowY: 'auto' }}>
                                                            {enclosures.filter(e => e.areaId === (area.areaId || area.id)).map(enc => {
                                                                const count = animals.filter(a => a.enclosureId === (enc.enclosureId || enc.id)).length;
                                                                return (
                                                                    <div key={enc.enclosureId || enc.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                                                                        <span>• {enc.name}</span>
                                                                        <span className="font-bold text-primary">{count} cá thể</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}"""
content, c7 = re.subn(pattern_card_stat, replacement_card_stat, content)
print(f"Sub 7 (area card enclosure breakdown): {c7}")

# 8. Add Latitude and Longitude input fields to Enclosure form JSX
pattern_enc_inputs = r'(<div className="form-group">\s*<label className="form-label">Tên chuồng trại</label>[\s\S]*?</div>)'
replacement_enc_inputs = r"""\1

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Vĩ độ GPS thực tế (Latitude)</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            className="form-input"
                                            placeholder="VD: 10.788500"
                                            value={enclosureForm.latitude}
                                            onChange={(e) => setEnclosureForm({ ...enclosureForm, latitude: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Kinh độ GPS thực tế (Longitude)</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            className="form-input"
                                            placeholder="VD: 106.706100"
                                            value={enclosureForm.longitude}
                                            onChange={(e) => setEnclosureForm({ ...enclosureForm, longitude: e.target.value })}
                                        />
                                    </div>
                                </div>"""
content, c8 = re.subn(pattern_enc_inputs, replacement_enc_inputs, content)
print(f"Sub 8 (enc form coords JSX): {c8}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("AdminAreasPage.jsx updated successfully!")
