import React from 'react';
import { useApp } from '../../context/AppContext';

export default function TranscriptModal({ onSeek }) {
    const { isTranscriptModalOpen, setIsTranscriptModalOpen, audioState, t } = useApp();
    const { narration } = audioState;

    if (!isTranscriptModalOpen || !narration) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isPoi = audioState.entityType === 'POI' || Boolean(narration.poiId);
    const langCode = (narration.languageCode || 'vi').toUpperCase();

    const transcriptLines = Array.isArray(narration.transcript)
        ? narration.transcript
        : (typeof narration.transcript === 'string' && narration.transcript.trim()
            ? narration.transcript.split(/\n+/).filter(Boolean).map((text, idx) => ({ time: idx * 10, text }))
            : (narration.content
                ? narration.content.split(/\n+/).filter(Boolean).map((text, idx) => ({ time: idx * 10, text }))
                : []));

    return (
        <div id="transcript-modal" className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-backdrop" onClick={() => setIsTranscriptModalOpen(false)}></div>
            <div className="modal-dialog">
                <div className="modal-header">
                    <div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                            <span className="chip text-xs">{isPoi ? '📍 Điểm tham quan' : '🐾 Động vật'}</span>
                            <span className="chip text-xs">🌐 {langCode}</span>
                        </div>
                        <h3 id="transcript-modal-title" className="font-bold text-base">{narration.title}</h3>
                        <p id="transcript-modal-narrator" className="text-xs text-muted">{t?.narratorLabel || 'Giọng đọc'}: {narration.narrator}</p>
                    </div>
                    <button 
                        id="btn-close-transcript" 
                        className="btn btn-icon btn-sm" 
                        aria-label="Đóng"
                        onClick={() => setIsTranscriptModalOpen(false)}
                    >
                        ✕
                    </button>
                </div>
                <div className="modal-body">
                    <p className="text-xs text-muted mb-3">Nhấp vào bất kỳ câu nào để chuyển nhanh đoạn phát âm thanh đến mốc thời gian đó.</p>
                    <div id="transcript-lines-container" className="transcript-lines">
                        {transcriptLines.length === 0 ? (
                            <p className="text-xs text-muted">Chưa có nội dung văn bản cho ngôn ngữ này.</p>
                        ) : transcriptLines.map((line, idx) => {
                            const isCurrent = audioState.currentTime >= line.time && 
                                (!transcriptLines[idx + 1] || audioState.currentTime < transcriptLines[idx + 1].time);
                            return (
                                <div 
                                    key={idx}
                                    className={`transcript-line ${isCurrent ? 'active' : ''}`}
                                    onClick={() => {
                                        if (onSeek) onSeek(line.time);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="transcript-timestamp">{formatTime(line.time)}</span>
                                    <p className="transcript-text">{line.text}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
