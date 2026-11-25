import React, { useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { parseStructuredTranscript } from '../../services/api';

export default function TranscriptModal({ onSeek }) {
    const { isTranscriptModalOpen, setIsTranscriptModalOpen, audioState, t } = useApp();
    const { narration, currentTime = 0, duration = 0, isCompleted = false } = audioState;
    const activeLineRef = useRef(null);

    useEffect(() => {
        if (!isTranscriptModalOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsTranscriptModalOpen(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isTranscriptModalOpen, setIsTranscriptModalOpen]);

    const parsed = useMemo(() => {
        if (!narration) return { segments: [], hasExactTimestamps: false };
        if (Array.isArray(narration.transcript) && narration.transcript.length > 0) {
            return {
                segments: narration.transcript,
                hasExactTimestamps: Boolean(narration.hasExactTimestamps)
            };
        }
        return parseStructuredTranscript(
            narration.transcript || narration.content || '',
            duration || narration.durationSec || 0
        );
    }, [narration, duration]);

    const transcriptLines = parsed.segments;
    const hasExactTimestamps = parsed.hasExactTimestamps;

    const activeIdx = useMemo(() => {
        if (!transcriptLines.length) return -1;
        if (isCompleted) return transcriptLines.length - 1;
        for (let i = 0; i < transcriptLines.length; i++) {
            const cur = transcriptLines[i];
            const next = transcriptLines[i + 1];
            if (currentTime >= cur.time && (!next || currentTime < next.time)) {
                return i;
            }
        }
        return 0;
    }, [transcriptLines, currentTime, isCompleted]);

    useEffect(() => {
        if (isTranscriptModalOpen && activeLineRef.current && typeof activeLineRef.current.scrollIntoView === 'function') {
            activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeIdx, isTranscriptModalOpen]);

    if (!isTranscriptModalOpen || !narration) return null;

    const formatTime = (seconds) => {
        const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
        const m = Math.floor(safe / 60);
        const s = Math.floor(safe % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isPoi = audioState.entityType === 'POI' || Boolean(narration.poiId);
    const langCode = (narration.languageCode || 'vi').toUpperCase();

    return (
        <div id="transcript-modal" className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-backdrop" onClick={() => setIsTranscriptModalOpen(false)}></div>
            <div className="modal-dialog">
                <div className="modal-header">
                    <div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span className="chip text-xs">{isPoi ? (t?.audioTypePoi || '📍 Điểm tham quan') : (t?.audioTypeAnimal || '🐾 Động vật')}</span>
                            <span className="chip text-xs">🌐 {langCode}{narration.isFallbackLanguage ? ` ${t?.audioFallbackTag || '(Dự phòng)'}` : ''}</span>
                            {isCompleted && (
                                <span className="chip text-xs" style={{ background: '#DCFCE7', color: '#166534', fontWeight: 700 }}>
                                    {t?.transcriptCompletedBadge || '✅ Đã phát hết bài thuyết minh'}
                                </span>
                            )}
                        </div>
                        <h3 id="transcript-modal-title" className="font-bold text-base">{narration.title}</h3>
                        <p id="transcript-modal-narrator" className="text-xs text-muted">{t?.narratorLabel || 'Giọng đọc'}: {narration.narrator}</p>
                    </div>
                    <button 
                        id="btn-close-transcript" 
                        className="btn btn-icon btn-sm" 
                        aria-label={t?.closeBtn || 'Đóng'}
                        onClick={() => setIsTranscriptModalOpen(false)}
                    >
                        ✕
                    </button>
                </div>
                <div className="modal-body">
                    <p className="text-xs mb-3" style={{
                        color: hasExactTimestamps ? '#475569' : '#92400E',
                        background: hasExactTimestamps ? 'transparent' : '#FFFBEB',
                        border: hasExactTimestamps ? 'none' : '1px solid #FDE68A',
                        padding: hasExactTimestamps ? 0 : '8px 10px',
                        borderRadius: '8px',
                        lineHeight: 1.5
                    }}>
                        {hasExactTimestamps
                            ? (t?.transcriptHintExact || 'Nhấp vào bất kỳ câu nào để tua chính xác đến mốc thời gian đó.')
                            : (t?.transcriptHintEstimated || 'Mốc thời gian bên dưới được ước tính theo độ dài câu (chưa có dữ liệu đồng bộ từng câu từ phòng thu). Nhấp vào bất kỳ đoạn nào để tua gần đúng.')}
                    </p>
                    <div id="transcript-lines-container" className="transcript-lines">
                        {transcriptLines.length === 0 ? (
                            <p className="text-xs text-muted">{t?.transcriptEmpty || 'Chưa có nội dung văn bản cho ngôn ngữ này.'}</p>
                        ) : transcriptLines.map((line, idx) => {
                            const isCurrent = idx === activeIdx;
                            return (
                                <div 
                                    key={idx}
                                    ref={isCurrent ? activeLineRef : null}
                                    className={`transcript-line ${isCurrent ? 'active' : ''}`}
                                    onClick={() => {
                                        if (onSeek && narration.hasAudio) onSeek(line.time);
                                    }}
                                    style={{ cursor: narration.hasAudio ? 'pointer' : 'default' }}
                                >
                                    <span className="transcript-timestamp">
                                        {hasExactTimestamps ? formatTime(line.time) : `~${formatTime(line.time)}`}
                                    </span>
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
