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

    return (
        <div id="transcript-modal" className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-backdrop" onClick={() => setIsTranscriptModalOpen(false)}></div>
            <div className="modal-dialog">
                <div className="modal-header">
                    <div>
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
                        {narration.transcript && narration.transcript.map((line, idx) => {
                            const isCurrent = audioState.currentTime >= line.time && 
                                (!narration.transcript[idx + 1] || audioState.currentTime < narration.transcript[idx + 1].time);
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
