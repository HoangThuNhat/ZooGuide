import sys

with open('web/src/components/map/MapTab.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. State addition
old_state = '    const [selectedMarker, setSelectedMarker] = useState(null);'
new_state = '''    const [selectedMarker, setSelectedMarker] = useState(null);

    // Trạng thái tải động vật theo chuồng được chọn
    const [enclosureAnimals, setEnclosureAnimals] = useState([]);
    const [isLoadingEnclosureAnimals, setIsLoadingEnclosureAnimals] = useState(false);
    const [enclosureAnimalsError, setEnclosureAnimalsError] = useState(null);
    const activeEnclosureReqRef = useRef(0);'''

# 2. Effect & retry handler
old_effect_anchor = '    }, [selectedStartPointId]);'
new_effect_block = '''    }, [selectedStartPointId]);

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
    };'''

old_panel = """                            {/* Danh sách các cá thể thú cư ngụ */}
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
                                                    borderRadius: '8px',
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
                            )}"""

new_panel = """                            {/* Phần hiển thị cá thể động vật trong chuồng (có Loading, Lỗi, Rỗng & Dữ liệu thực) */}
                            {(selectedMarker.enclosureId || selectedMarker.category === 'enclosure') && (
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
                            )}"""

text_norm = text.replace('\r\n', '\n')
t1 = text_norm.replace(old_state.replace('\r\n', '\n'), new_state)
print('State replaced:', t1 != text_norm)

t2 = t1.replace(old_effect_anchor.replace('\r\n', '\n'), new_effect_block, 1)
print('Effect replaced:', t2 != t1)

t3 = t2.replace(old_panel.replace('\r\n', '\n'), new_panel)
print('Panel replaced:', t3 != t2)

if t3 != text_norm and t1 != text_norm and t2 != t1 and t3 != t2:
    with open('web/src/components/map/MapTab.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(t3)
    print('MAPTAB UPDATED SUCCESSFULLY!')
else:
    print('SOME REPLACEMENTS FAILED')
    sys.exit(1)
