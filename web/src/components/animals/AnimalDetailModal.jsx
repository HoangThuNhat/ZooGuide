import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ZooApi } from '../../services/api';

export default function AnimalDetailModal({ onPlayAudio, onNavigate }) {
    const { selectedAnimalForDetail, setSelectedAnimalForDetail, currentLang, t } = useApp();
    const [localizedAnimal, setLocalizedAnimal] = useState(null);

    useEffect(() => {
        if (!selectedAnimalForDetail) {
            setLocalizedAnimal(null);
            return;
        }
        let isMounted = true;
        ZooApi.getAnimalById(selectedAnimalForDetail.id || selectedAnimalForDetail.animalId, currentLang).then(res => {
            if (isMounted && res.success && res.data) {
                setLocalizedAnimal(res.data);
            } else if (isMounted) {
                setLocalizedAnimal(selectedAnimalForDetail);
            }
        });
        return () => { isMounted = false; };
    }, [selectedAnimalForDetail, currentLang]);

    if (!selectedAnimalForDetail) return null;
    const animal = localizedAnimal || selectedAnimalForDetail;
    const displayName = animal.name || animal.nameVi;

    return (
        <div id="animal-detail-modal" className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-backdrop" onClick={() => setSelectedAnimalForDetail(null)}></div>
            <div className="modal-dialog" style={{ maxWidth: '640px' }}>
                {animal.imageUrl && (
                    <div className="card-media" style={{ height: '240px', borderRadius: '16px 16px 0 0' }}>
                        <img id="detail-modal-img" src={animal.imageUrl} alt={displayName} className="card-img" />
                    </div>
                )}
                <div className="modal-body">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span id="detail-modal-zone" className="callout-badge">
                                {animal.zoneName} ({animal.zoneCode})
                            </span>
                            <h3 id="detail-modal-title" className="text-xl font-bold mt-1">{displayName}</h3>
                            <p id="detail-modal-latin" className="text-sm text-muted italic">{animal.scientificName}</p>
                            {!animal.hasTranslation && currentLang !== 'vi' && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.72rem', color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                    <span>{t?.translationMissingBadge || 'Chưa có bản dịch cho ngôn ngữ này'}</span>
                                </span>
                            )}
                        </div>
                        <button
                            id="btn-close-animal-modal"
                            className="btn btn-icon btn-sm"
                            aria-label="Close"
                            onClick={() => setSelectedAnimalForDetail(null)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="ticket-detail-grid mt-4">
                        <div>
                            <span className="ticket-meta-label text-muted">{t?.animalFamilyLabel || 'Loài'}</span>
                            <p id="detail-modal-species" className="font-semibold text-sm">{animal.species || '—'}</p>
                        </div>
                        <div>
                            <span className="ticket-meta-label text-muted">{t?.animalOriginLabel || 'Phân bố tự nhiên'}</span>
                            <p id="detail-modal-origin" className="font-semibold text-sm">{animal.origin || '—'}</p>
                        </div>
                        <div>
                            <span className="ticket-meta-label text-muted">{t?.animalDietLabel || 'Thức ăn chính'}</span>
                            <p id="detail-modal-diet" className="font-semibold text-sm">{animal.diet || '—'}</p>
                        </div>
                        <div>
                            <span className="ticket-meta-label text-muted">{t?.animalWeightLifespanLabel || 'Cân nặng & Tuổi thọ'}</span>
                            <p className="font-semibold text-sm">
                                <span id="detail-modal-weight">{animal.weight || '—'}</span> • <span id="detail-modal-lifespan">{animal.lifespan || '—'}</span>
                            </p>
                        </div>
                        <div>
                            <span className="ticket-meta-label text-muted">{t?.animalHealthLabel || 'Hồ sơ sức khỏe'}</span>
                            <p id="detail-modal-health" className="font-semibold text-sm text-success">{animal.healthStatus || '—'}</p>
                        </div>
                        <div>
                            <span className="ticket-meta-label text-muted">IUCN</span>
                            <p id="detail-modal-breeding" className="font-semibold text-sm">{animal.iucnStatus || '—'}</p>
                        </div>
                    </div>

                    {animal.description && (
                        <div className="mt-4 pt-3 border-t border-border">
                            <p className="text-sm" style={{ lineHeight: 1.55, color: '#334155' }}>
                                {animal.description}
                            </p>
                        </div>
                    )}

                    {animal.referenceSource && (
                        <div className="mt-3 text-xs text-muted flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                            <span><strong>{t?.animalReferenceLabel || 'Nguồn tham khảo'}:</strong> {animal.referenceSource}</span>
                        </div>
                    )}

                    <div className="modal-footer mt-4">
                        <button
                            id="detail-modal-btn-navigate"
                            className="btn btn-outline"
                            onClick={() => {
                                setSelectedAnimalForDetail(null);
                                if (onNavigate) onNavigate(animal);
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                            </svg>
                            <span>{t?.animalNavigateBtn || 'Dẫn Đường Tới Chuồng'}</span>
                        </button>
                        <button
                            id="detail-modal-btn-play"
                            className="btn btn-accent"
                            onClick={() => {
                                setSelectedAnimalForDetail(null);
                                if (onPlayAudio) onPlayAudio(animal);
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            <span>{t?.animalListenBtn || 'Nghe Thuyết Minh Tự Động'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
