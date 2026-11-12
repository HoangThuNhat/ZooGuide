import React from 'react';
import { useApp } from '../../context/AppContext';

export default function AudioPlayerBar({
    onTogglePlay,
    onSkip,
    onSeek,
    onChangeSpeed,
    onChangeVolume,
    onToggleMute,
    onRetry,
    onStop,
    onClose
}) {
    const { audioState, setIsTranscriptModalOpen, t } = useApp();
    const {
        animal,
        narration,
        isPlaying,
        isLoading,
        error,
        currentTime,
        duration,
        playbackRate,
        volume = 1.0,
        isMuted = false,
        loadDurationMs,
        entityType,
        isVisible
    } = audioState;

    if (!isVisible || !narration) return null;

    const isPoi = entityType === 'POI' || Boolean(narration.poiId);
    const langCode = (narration.languageCode || 'vi').toUpperCase();
    const effectiveVolume = isMuted ? 0 : (typeof volume === 'number' ? volume : 1.0);

    const formatTime = (seconds) => {
        const safeSec = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
        const m = Math.floor(safeSec / 60);
        const s = Math.floor(safeSec % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return (
        <div id="floating-audio-bar" className="floating-audio-bar" role="region" aria-label="Trình phát thuyết minh">
            {/* Scrubber rail */}
            <div className="audio-progress-rail" style={{ position: 'relative' }}>
                <div 
                    id="player-progress-fill" 
                    className="audio-progress-fill" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
                <input 
                    type="range" 
                    id="player-scrubber" 
                    min="0" 
                    max={duration || 100} 
                    value={currentTime} 
                    disabled={!narration.hasAudio || Boolean(error)}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="sr-only" 
                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: (!narration.hasAudio || error) ? 'not-allowed' : 'pointer', top: 0, left: 0 }} 
                    aria-label="Tua thời lượng audio" 
                />
            </div>

            {error && (
                <div style={{
                    background: 'rgba(220, 38, 38, 0.18)',
                    borderBottom: '1px solid rgba(248, 113, 113, 0.35)',
                    padding: '6px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    fontSize: '0.78rem',
                    color: '#FCA5A5'
                }}>
                    <span>⚠️ {error}</span>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            style={{
                                background: '#EF4444',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '3px 10px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Thử lại
                        </button>
                    )}
                </div>
            )}

            <div className="player-inner">
                <div className="player-meta">
                    {animal && animal.imageUrl ? (
                        <img 
                            id="player-track-thumb" 
                            src={animal.imageUrl} 
                            alt="Thumbnail" 
                            className="player-thumb"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <div
                            className="player-thumb"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isPoi ? 'rgba(14, 165, 233, 0.2)' : 'rgba(21, 128, 61, 0.25)',
                                fontSize: '1.25rem',
                                borderRadius: '10px',
                                flexShrink: 0
                            }}
                        >
                            {isPoi ? '📍' : '🐾'}
                        </div>
                    )}
                    <div className="player-track-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: isPoi ? 'rgba(14, 165, 233, 0.25)' : 'rgba(34, 197, 94, 0.25)',
                                color: isPoi ? '#7DD3FC' : '#86EFAC'
                            }}>
                                {isPoi ? '📍 Điểm tham quan' : '🐾 Động vật'}
                            </span>
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.14)',
                                color: '#E2E8F0'
                            }}>
                                🌐 {langCode}
                            </span>
                            <span style={{
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                color: error ? '#FCA5A5' : (isLoading ? '#FDE047' : (isPlaying ? '#4ADE80' : '#94A3B8'))
                            }}>
                                {error
                                    ? '• Lỗi âm thanh'
                                    : (isLoading
                                        ? '• ⏳ Đang tải...'
                                        : (isPlaying
                                            ? `• ▶️ Đang phát${loadDurationMs ? ` (${loadDurationMs}ms)` : ''}`
                                            : '• ⏸️ Tạm dừng'))}
                            </span>
                        </div>
                        <h5 id="player-track-title">{narration.title}</h5>
                        <p id="player-track-subtitle">
                            {animal ? `${animal.name || animal.nameVi} • ` : ''}{narration.narrator}
                        </p>
                    </div>
                </div>

                {/* Player Controls */}
                <div className="player-controls">
                    <button 
                        id="btn-audio-skip-back" 
                        className="btn btn-icon btn-sm" 
                        aria-label="Tua lại 10 giây"
                        disabled={!narration.hasAudio || Boolean(error)}
                        onClick={() => onSkip(-10)}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 4v6h6"></path>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                        </svg>
                    </button>

                    <button 
                        id="btn-audio-toggle-play"
                        className="btn-audio-circle btn-audio-toggle-play" 
                        aria-label="Phát hoặc tạm dừng"
                        title={isLoading ? "Đang tải..." : (isPlaying ? "Tạm dừng" : "Phát tiếp")}
                        disabled={!narration.hasAudio}
                        onClick={onTogglePlay}
                    >
                        {isLoading ? (
                            <span style={{ fontSize: '0.9rem' }}>⏳</span>
                        ) : isPlaying ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                            </svg>
                        ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                        )}
                    </button>

                    {/* NÚT DỪNG (STOP) */}
                    <button 
                        id="btn-audio-stop" 
                        className="btn btn-icon btn-sm" 
                        title="Dừng phát và quay về đầu" 
                        aria-label="Dừng thuyết minh"
                        onClick={onStop}
                        style={{ color: '#EF4444' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="5" y="5" width="14" height="14" rx="2"></rect>
                        </svg>
                    </button>

                    <button 
                        id="btn-audio-skip-fwd" 
                        className="btn btn-icon btn-sm" 
                        aria-label="Tua tới 10 giây"
                        disabled={!narration.hasAudio || Boolean(error)}
                        onClick={() => onSkip(10)}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6"></path>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                    </button>

                    <div className="player-timers">
                        <span id="player-current-time">{formatTime(currentTime)}</span> / <span id="player-total-time">{narration.durationFormatted || formatTime(duration)}</span>
                    </div>
                </div>

                {/* Additional Controls (Volume, Speed, Transcript, Close) */}
                <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                    {/* Điều chỉnh âm lượng */}
                    {onChangeVolume && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '8px' }}>
                            <button
                                type="button"
                                id="btn-audio-mute"
                                onClick={onToggleMute}
                                title={isMuted || effectiveVolume === 0 ? 'Bật âm thanh' : 'Tắt tiếng'}
                                aria-label="Bật hoặc tắt tiếng"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#E2E8F0',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    fontSize: '0.85rem',
                                    lineHeight: 1
                                }}
                            >
                                {isMuted || effectiveVolume === 0 ? '🔇' : (effectiveVolume < 0.5 ? '🔉' : '🔊')}
                            </button>
                            <input
                                type="range"
                                id="audio-volume-slider"
                                min="0"
                                max="1"
                                step="0.05"
                                value={effectiveVolume}
                                onChange={(e) => onChangeVolume(Number(e.target.value))}
                                aria-label="Điều chỉnh âm lượng"
                                title={`Âm lượng: ${Math.round(effectiveVolume * 100)}%`}
                                style={{ width: '58px', cursor: 'pointer', accentColor: '#22C55E' }}
                            />
                        </div>
                    )}

                    <select 
                        id="audio-speed-select" 
                        className="lang-select text-xs" 
                        aria-label="Tốc độ phát"
                        value={playbackRate}
                        onChange={(e) => onChangeSpeed(Number(e.target.value))}
                    >
                        <option value="0.75">0.75x</option>
                        <option value="1.0">1.0x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                    </select>

                    <button 
                        id="btn-open-transcript" 
                        className="btn btn-sm btn-outline" 
                        aria-label="Xem lời thoại karaoke"
                        disabled={!narration.content && (!narration.transcript || narration.transcript.length === 0)}
                        onClick={() => setIsTranscriptModalOpen(true)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>{t?.transcriptBtn || 'Lời thoại'}</span>
                    </button>

                    {/* NÚT ĐÓNG / THU GỌN (CLOSE) */}
                    <button
                        id="btn-close-audio-bar"
                        className="btn btn-icon btn-sm"
                        title="Đóng trình phát thuyết minh"
                        aria-label="Đóng trình phát thuyết minh"
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '6px',
                            cursor: 'pointer',
                            color: '#94A3B8'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
