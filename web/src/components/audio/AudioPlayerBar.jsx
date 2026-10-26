import React from 'react';
import { useApp } from '../../context/AppContext';

export default function AudioPlayerBar({ onTogglePlay, onSkip, onSeek, onChangeSpeed, onStop, onClose }) {
    const { audioState, setIsTranscriptModalOpen } = useApp();
    const { animal, narration, isPlaying, currentTime, duration, playbackRate, isVisible } = audioState;

    if (!isVisible || !narration) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

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
                    max={duration} 
                    value={currentTime} 
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="sr-only" 
                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', top: 0, left: 0 }} 
                    aria-label="Tua thời lượng audio" 
                />
            </div>

            <div className="player-inner">
                <div className="player-meta">
                    <img 
                        id="player-track-thumb" 
                        src={animal ? animal.imageUrl : ''} 
                        alt="Thumbnail" 
                        className="player-thumb" 
                    />
                    <div className="player-track-info">
                        <h5 id="player-track-title">{narration.title}</h5>
                        <p id="player-track-subtitle">
                            {animal ? `${animal.nameVi} • ` : ''}{narration.narrator}
                        </p>
                    </div>
                </div>

                {/* Player Controls */}
                <div className="player-controls">
                    <button 
                        id="btn-audio-skip-back" 
                        className="btn btn-icon btn-sm" 
                        aria-label="Tua lại 10 giây"
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
                        title={isPlaying ? "Tạm dừng" : "Phát tiếp"}
                        onClick={onTogglePlay}
                    >
                        {isPlaying ? (
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

                {/* Additional Controls */}
                <div className="flex items-center gap-2">
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
                        onClick={() => setIsTranscriptModalOpen(true)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>Lời thoại</span>
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
