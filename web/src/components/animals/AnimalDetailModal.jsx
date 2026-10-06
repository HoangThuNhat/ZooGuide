import React from 'react';
import { useApp } from '../../context/AppContext';

export default function AnimalDetailModal({ onPlayAudio, onNavigate }) {
    const { selectedAnimalForDetail, setSelectedAnimalForDetail } = useApp();

    if (!selectedAnimalForDetail) return null;
    const animal = selectedAnimalForDetail;

    return (
        <div id="animal-detail-modal" className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-backdrop" onClick={() => setSelectedAnimalForDetail(null)}></div>
            <div className="modal-dialog" style={{ maxWidth: '640px' }}>
                <div className="card-media" style={{ height: '240px', borderRadius: '16px 16px 0 0' }}>
                    <img id="detail-modal-img" src={animal.imageUrl} alt={animal.nameVi} className="card-img" />
                </div>
                <div className="modal-body">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span id="detail-modal-zone" className="callout-badge">
                                {animal.zoneName} (Khu {animal.zoneCode})
                            </span>
                            <h3 id="detail-modal-title" className="text-xl font-bold mt-1">{animal.nameVi}</h3>
                            <p id="detail-modal-latin" className="text-sm text-muted italic">{animal.scientificName}</p>
                        </div>
                        <button 
                            id="btn-close-animal-modal" 
                            className="btn btn-icon btn-sm" 
                            aria-label="Đóng"
                            onClick={() => setSelectedAnimalForDetail(null)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="ticket-detail-grid mt-4">
                        <div>
                            <span className="ticket-meta-label text-muted">Họ loài</span>
                            <p id="detail-modal-species" className="font-semibold text-sm">{animal.species}</p>
                        </div>
                        <div>
                            <span className="ticket-meta-label text-muted">Phân bố tự nhiên</span>
                            <p id="detail-modal-origin" className="font-semibold text-sm">{animal.origin}</p>
                        </div>
                        <div>
                            <span className="ticket-meta-label text-muted">Thức ăn chính</span>
                            <p id="detail-modal-diet" className="font-semibold text-sm">{animal.diet}</p>
                        </div>
                        <div>
                            <span className="ticket-meta-label text-muted">Cân nặng & Tuổi thọ</span>
                            <p className="font-semibold text-sm">
                                <span id="detail-modal-weight">{animal.weight}</span> • <span id="detail-modal-lifespan">{animal.lifespan}</span>
                            </p>
                        </div>
                        <div>
                            <span className="ticket-meta-label text-muted">Hồ sơ sức khỏe</span>
                            <p id="detail-modal-health" className="font-semibold text-sm text-success">{animal.healthStatus}</p>
                        </div>
                        <div>
                            <span className="ticket-meta-label text-muted">Tình trạng sinh sản</span>
                            <p id="detail-modal-breeding" className="font-semibold text-sm">{animal.breedingStatus}</p>
                        </div>
                    </div>

                    {animal.funFactsVi && animal.funFactsVi.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border">
                            <h4 className="font-bold text-sm mb-2">Sự Thật Thú Vị (Fun Facts)</h4>
                            <ul id="detail-modal-funfacts" className="flex flex-col gap-2">
                                {animal.funFactsVi.map((fact, idx) => (
                                    <li key={idx} className="fun-fact-item">
                                        <span className="fun-fact-bullet">✦</span>
                                        <span>{fact}</span>
                                    </li>
                                ))}
                            </ul>
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                            </svg>
                            <span>Dẫn Đường Tới Chuồng</span>
                        </button>
                        <button 
                            id="detail-modal-btn-play" 
                            className="btn btn-accent"
                            onClick={() => {
                                setSelectedAnimalForDetail(null);
                                if (onPlayAudio) onPlayAudio(animal.id);
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            <span>Nghe Thuyết Minh Tự Động</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
