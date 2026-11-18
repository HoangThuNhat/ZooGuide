import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ZooApi } from '../../services/api';

// Layout & Global Components
import Header from '../../components/layout/Header';
import HeroBanner from '../../components/layout/HeroBanner';
import MobileBottomNav from '../../components/layout/MobileBottomNav';

// Tab Views for Visitor
import MapTab from '../../components/map/MapTab';
import SpeciesAudioTab from '../../components/species/SpeciesAudioTab';
import AnimalsTab from '../../components/animals/AnimalsTab';
import TicketsTab from '../../components/tickets/TicketsTab';

// Modals & Floating Features
import TicketModal from '../../components/tickets/TicketModal';
import ElectronicTicketModal from '../../components/tickets/ElectronicTicketModal';
import AnimalDetailModal from '../../components/animals/AnimalDetailModal';
import SpeciesNarrationModal from '../../components/species/SpeciesNarrationModal';
import TranscriptModal from '../../components/audio/TranscriptModal';
import AudioPlayerBar from '../../components/audio/AudioPlayerBar';
import ErrorBoundary from '../../components/common/ErrorBoundary';

export default function VisitorPortal() {
    const {
        currentTab,
        switchTab,
        currentLang,
        hasActiveSession,
        currentSession,
        clearSession,
        setIsTicketModalOpen,
        setSelectedAnimalForDetail,
        setNavTargetAnimal,
        showToast,
        audioState,
        setAudioState,
        t
    } = useApp();

    const [selectedSpeciesForNarration, setSelectedSpeciesForNarration] = useState(null);
    const audioElementRef = useRef(null);
    const playRequestIdRef = useRef(0);
    const narrationCacheRef = useRef(new Map());
    const audioLoadStartRef = useRef(0);

    const pauseAudioPlayback = useCallback(() => {
        if (audioElementRef.current) {
            audioElementRef.current.pause();
        }
        setAudioState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
    }, [setAudioState]);

    // Theo dõi trạng thái kết nối mạng (xử lý mất mạng / mạng yếu khi phát âm thanh)
    useEffect(() => {
        const handleOffline = () => {
            setAudioState(prev => {
                if (!prev.isVisible) return prev;
                return {
                    ...prev,
                    isLoading: false,
                    error: 'Mất kết nối mạng Internet. Âm thanh có thể bị gián đoạn.'
                };
            });
            showToast('Kết nối mạng bị gián đoạn. Vui lòng kiểm tra đường truyền Internet.', 'error');
        };
        const handleOnline = () => {
            setAudioState(prev => {
                if (!prev.isVisible || !prev.error) return prev;
                return { ...prev, error: null };
            });
        };
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [setAudioState, showToast]);

    const startAudioPlayback = useCallback((narration, rate = 1.0, triggerSource = 'MANUAL_LIST') => {
        const isPoi = Boolean(narration?.poiId);
        const targetType = isPoi ? 'POI' : 'Animal';
        const targetId = narration?.poiId || narration?.speciesId || narration?.animalId || null;
        const targetName = narration?.poiName || narration?.speciesName || narration?.animalName || narration?.title || 'Thuyết minh';
        const langCode = narration?.languageCode || currentLang || 'vi';

        if (!narration || !narration.audioSrc) {
            ZooApi.recordDashboardTelemetry({
                category: 'AUDIO',
                eventType: 'ERROR_LOAD_FILE',
                sessionId: currentSession?.sessionId || null,
                languageCode: langCode,
                targetType,
                targetId,
                targetName,
                triggerSource,
                isSuccess: false,
                errorCode: 'MISSING_AUDIO_SRC',
                errorMessage: 'Bài thuyết minh chưa có đường dẫn file âm thanh'
            });
            const missingMsg = t?.audioMissingDesc || 'Chưa có file âm thanh cho ngôn ngữ này.';
            showToast(missingMsg, 'error');
            setAudioState(prev => ({ ...prev, isPlaying: false, isLoading: false, error: missingMsg }));
            return;
        }

        try {
            if (!audioElementRef.current) {
                audioElementRef.current = new Audio();
                audioElementRef.current.preload = 'metadata';
            }
            const audio = audioElementRef.current;
            // Dừng ngay lập tức bất kỳ file âm thanh nào đang phát để tránh chồng âm thanh
            audio.pause();

            audioLoadStartRef.current = performance.now();
            setAudioState(prev => ({
                ...prev,
                isLoading: true,
                error: null
            }));

            audio.onloadstart = () => {
                setAudioState(prev => ({ ...prev, isLoading: true, error: null }));
            };

            audio.onwaiting = () => {
                setAudioState(prev => ({ ...prev, isLoading: true }));
            };

            audio.oncanplay = () => {
                const loadMs = audioLoadStartRef.current > 0
                    ? Math.max(1, Math.round(performance.now() - audioLoadStartRef.current))
                    : null;
                setAudioState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: null,
                    loadDurationMs: loadMs ?? prev.loadDurationMs
                }));
            };

            audio.onplaying = () => {
                const loadMs = audioLoadStartRef.current > 0
                    ? Math.max(1, Math.round(performance.now() - audioLoadStartRef.current))
                    : null;
                setAudioState(prev => ({
                    ...prev,
                    isLoading: false,
                    isPlaying: true,
                    error: null,
                    loadDurationMs: loadMs ?? prev.loadDurationMs
                }));
            };

            audio.onpause = () => {
                if (!audio.ended) {
                    setAudioState(prev => ({ ...prev, isPlaying: false }));
                }
            };

            audio.onloadedmetadata = () => {
                if (audio.duration && Number.isFinite(audio.duration)) {
                    const realSec = Math.round(audio.duration);
                    setAudioState(prev => ({
                        ...prev,
                        duration: realSec > 0 ? realSec : prev.duration
                    }));
                }
            };

            audio.ontimeupdate = () => {
                setAudioState(prev => ({
                    ...prev,
                    currentTime: Math.floor(audio.currentTime || 0)
                }));
            };

            audio.onended = () => {
                const listenedSec = Math.round(audio.duration || narration.durationSec || 30);
                ZooApi.recordDashboardTelemetry({
                    category: 'AUDIO',
                    eventType: 'PLAY_COMPLETED',
                    sessionId: currentSession?.sessionId || null,
                    languageCode: langCode,
                    targetType,
                    targetId,
                    targetName,
                    triggerSource,
                    listenDurationSeconds: listenedSec,
                    totalDurationSeconds: listenedSec,
                    isSuccess: true
                });
                if (triggerSource === 'GPS_AUTO') {
                    ZooApi.recordDashboardTelemetry({
                        category: 'GPS',
                        eventType: 'TRIGGER_PLAY_SUCCESS',
                        sessionId: currentSession?.sessionId || null,
                        languageCode: langCode,
                        targetType,
                        targetId,
                        targetName,
                        triggerSource: 'GPS_AUTO',
                        listenDurationSeconds: listenedSec,
                        isSuccess: true
                    });
                }
                setAudioState(prev => ({
                    ...prev,
                    isPlaying: false,
                    isLoading: false,
                    currentTime: prev.duration
                }));
            };

            audio.onerror = () => {
                console.warn('Audio playback error for stream:', audio.src);
                const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
                const errMsg = isOffline
                    ? 'Mất kết nối mạng khi tải file âm thanh từ Supabase Storage.'
                    : (t?.audioMissingDesc || 'Không thể tải hoặc phát file âm thanh thuyết minh. Vui lòng kiểm tra kết nối mạng.');
                ZooApi.recordDashboardTelemetry({
                    category: 'AUDIO',
                    eventType: 'ERROR_LOAD_FILE',
                    sessionId: currentSession?.sessionId || null,
                    languageCode: langCode,
                    targetType,
                    targetId,
                    targetName,
                    triggerSource,
                    isSuccess: false,
                    errorCode: isOffline ? 'NETWORK_OFFLINE' : 'AUDIO_STREAM_ERROR',
                    errorMessage: errMsg
                });
                showToast(errMsg, 'error');
                setAudioState(prev => ({
                    ...prev,
                    isPlaying: false,
                    isLoading: false,
                    error: errMsg
                }));
            };

            // Hạn chế tải lại file không cần thiết nếu cùng một URL âm thanh đã được nạp sẵn
            if (audio.src !== narration.audioSrc) {
                audio.src = narration.audioSrc;
            }
            audio.playbackRate = rate;
            audio.volume = typeof audioState?.volume === 'number' ? audioState.volume : 1.0;
            audio.muted = Boolean(audioState?.isMuted);
            try {
                audio.currentTime = 0;
            } catch (e) {}

            audio.play().then(() => {
                ZooApi.recordDashboardTelemetry({
                    category: 'AUDIO',
                    eventType: 'PLAY_STARTED',
                    sessionId: currentSession?.sessionId || null,
                    languageCode: langCode,
                    targetType,
                    targetId,
                    targetName,
                    triggerSource,
                    totalDurationSeconds: narration.durationSec || 30,
                    isSuccess: true
                });
            }).catch(err => {
                console.warn('Audio playback blocked or failed:', err.message);
                ZooApi.recordDashboardTelemetry({
                    category: 'AUDIO',
                    eventType: 'ERROR_PLAYBACK',
                    sessionId: currentSession?.sessionId || null,
                    languageCode: langCode,
                    targetType,
                    targetId,
                    targetName,
                    triggerSource,
                    isSuccess: false,
                    errorCode: 'PLAYBACK_BLOCKED',
                    errorMessage: err.message
                });
                setAudioState(prev => ({
                    ...prev,
                    isPlaying: false,
                    isLoading: false,
                    error: 'Trình duyệt tạm chặn tự động phát hoặc luồng âm thanh gặp sự cố. Nhấn Phát để tiếp tục.'
                }));
            });
        } catch (err) {
            console.warn('Audio setup error:', err);
            pauseAudioPlayback();
        }
    }, [audioState?.isMuted, audioState?.volume, currentLang, currentSession?.sessionId, pauseAudioPlayback, setAudioState, showToast, t]);

    const playSpeciesAudio = useCallback(async (speciesId, startAutoplay = true, lang = currentLang, triggerSource = 'MANUAL_LIST') => {
        if (!hasActiveSession || !currentSession?.sessionId) {
            showToast(t?.ticketRequiredNarration || 'Vui lòng kích hoạt vé tham quan hợp lệ để sử dụng chức năng thuyết minh.', 'error');
            pauseAudioPlayback();
            setIsTicketModalOpen(true);
            return;
        }

        if (new Date(currentSession.expiresAt) <= new Date()) {
            showToast(t?.ticketExpiredNarration || 'Phiên tham quan của bạn đã hết hạn. Vui lòng mua vé mới để tiếp tục nghe thuyết minh.', 'error');
            clearSession();
            pauseAudioPlayback();
            setIsTicketModalOpen(true);
            return;
        }

        const targetLang = (lang || currentLang || 'vi').trim().toLowerCase();

        // Nếu đang mở đúng loài và đúng ngôn ngữ có sẵn file âm thanh hợp lệ, chỉ cần phát/tạm dừng, không tải lại
        if (
            audioState.isVisible &&
            audioState.entityType === 'ANIMAL' &&
            Number(audioState.narration?.speciesId) === Number(speciesId) &&
            (audioState.narration?.languageCode || '').toLowerCase() === targetLang &&
            audioState.narration?.audioSrc &&
            !audioState.error &&
            startAutoplay
        ) {
            if (!audioState.isPlaying) {
                startAudioPlayback(audioState.narration, audioState.playbackRate || 1.0, triggerSource);
            }
            return;
        }

        const reqId = ++playRequestIdRef.current;
        if (audioElementRef.current) {
            audioElementRef.current.pause();
        }

        setAudioState(prev => ({
            ...prev,
            isLoading: true,
            isPlaying: false,
            error: null,
            entityType: 'ANIMAL',
            isVisible: true
        }));

        ZooApi.recordDashboardTelemetry({
            category: 'AUDIO',
            eventType: 'PLAY_REQUESTED',
            sessionId: currentSession.sessionId,
            languageCode: targetLang,
            targetType: 'Animal',
            targetId: parseInt(speciesId),
            targetName: `Loài #${speciesId}`,
            triggerSource,
            isSuccess: true
        });

        const cacheKey = `ANIMAL:${speciesId}:${targetLang}`;
        let res = narrationCacheRef.current.get(cacheKey);
        if (!res) {
            res = await ZooApi.getSpeciesNarration(speciesId, targetLang, currentSession.sessionId);
            if (res.success && res.data) {
                narrationCacheRef.current.set(cacheKey, res);
            }
        }

        // Bỏ qua nếu người dùng đã bấm chọn mục khác trong lúc đang tải API
        if (reqId !== playRequestIdRef.current) return;

        if (!res.success || !res.data) {
            ZooApi.recordDashboardTelemetry({
                category: 'AUDIO',
                eventType: 'ERROR_API',
                sessionId: currentSession.sessionId,
                languageCode: targetLang,
                targetType: 'Animal',
                targetId: parseInt(speciesId),
                targetName: `Loài #${speciesId}`,
                triggerSource,
                isSuccess: false,
                errorCode: res.unauthorized ? 'UNAUTHORIZED_SESSION' : 'NARRATION_API_ERROR',
                errorMessage: res.message || 'Lỗi truy vấn API thuyết minh'
            });
            if (res.unauthorized) {
                showToast(res.message || 'Phiên tham quan đã hết hạn hoặc bị thu hồi. Vui lòng kích hoạt lại vé.', 'error');
                clearSession();
                pauseAudioPlayback();
                setIsTicketModalOpen(true);
            } else {
                const errText = res.message || t?.narrationMissingTitle || `Chưa có bài thuyết minh cho loài #${speciesId} bằng ngôn ngữ ${targetLang.toUpperCase()}.`;
                pauseAudioPlayback();
                setAudioState(prev => ({
                    ...prev,
                    isLoading: false,
                    isPlaying: false,
                    error: errText
                }));
                showToast(errText, 'error');
            }
            return;
        }

        // Hỗ trợ cơ chế ngôn ngữ dự phòng (Graceful Language Fallback - PRD 6.2 & UC03 A1):
        // Nếu ngôn ngữ yêu cầu chưa có bản ghi âm xuất bản nhưng hệ thống có bản dự phòng hợp lệ (VI/EN),
        // hiển thị thông báo minh bạch cho du khách và phát bản dự phòng.
        const returnedLang = (res.data.languageCode || '').trim().toLowerCase();
        if (res.data.isFallbackLanguage) {
            const fallbackNotice = res.data.fallbackMessage || `Chưa có bản ghi âm tiếng ${targetLang.toUpperCase()}. Hệ thống đang phát bản dự phòng (${returnedLang.toUpperCase()}).`;
            showToast(fallbackNotice, 'info');
        } else if (returnedLang && returnedLang !== targetLang && !res.data.hasAudio) {
            const missingLangMsg = `Loài "${res.data.speciesName || res.data.animalName || `#${speciesId}`}" hiện chưa có bản ghi âm và nội dung thuyết minh cho ngôn ngữ ${targetLang.toUpperCase()}.`;
            ZooApi.recordDashboardTelemetry({
                category: 'AUDIO',
                eventType: 'ERROR_LOAD_FILE',
                sessionId: currentSession.sessionId,
                languageCode: targetLang,
                targetType: 'Animal',
                targetId: parseInt(speciesId),
                targetName: res.data.speciesName || `Loài #${speciesId}`,
                triggerSource,
                isSuccess: false,
                errorCode: 'MISSING_LANGUAGE_AUDIO',
                errorMessage: missingLangMsg
            });
            pauseAudioPlayback();
            setAudioState(prev => ({
                ...prev,
                animal: {
                    id: speciesId,
                    speciesId: parseInt(speciesId),
                    name: res.data.speciesName || res.data.animalName || `Loài #${speciesId}`,
                    scientificName: res.data.scientificName || '',
                    imageUrl: res.data.imageUrl || ''
                },
                narration: {
                    speciesId: parseInt(speciesId),
                    languageCode: targetLang,
                    title: `${res.data.speciesName || res.data.animalName} (${targetLang.toUpperCase()})`,
                    narrator: 'Chưa có bản thu âm',
                    content: '',
                    transcript: [],
                    hasAudio: false,
                    audioSrc: null
                },
                entityType: 'ANIMAL',
                isLoading: false,
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                error: missingLangMsg,
                isVisible: true
            }));
            showToast(missingLangMsg, 'error');
            return;
        }

        const animalObj = {
            id: speciesId,
            speciesId: parseInt(speciesId),
            name: res.data.speciesName || res.data.animalName || res.data.title,
            nameVi: res.data.speciesName || res.data.animalName || res.data.title,
            nameEn: res.data.speciesName || res.data.title,
            scientificName: res.data.scientificName || '',
            imageUrl: res.data.imageUrl || ''
        };
        const duration = res.data.durationSec || 60;
        const canAutoPlay = Boolean(startAutoplay && res.data.hasAudio && res.data.audioSrc);

        setAudioState(prev => ({
            ...prev,
            animal: animalObj,
            narration: { ...res.data, entityType: 'ANIMAL' },
            entityType: 'ANIMAL',
            isPlaying: canAutoPlay,
            isLoading: canAutoPlay,
            error: (!res.data.hasAudio || !res.data.audioSrc) ? (t?.audioMissingDesc || 'Chưa có file âm thanh cho ngôn ngữ này.') : null,
            currentTime: 0,
            duration,
            playbackRate: prev.playbackRate || 1.0,
            isVisible: true
        }));

        if (startAutoplay) {
            if (res.data.hasAudio && res.data.audioSrc) {
                startAudioPlayback(res.data, audioState.playbackRate || 1.0, triggerSource);
            } else {
                showToast(t?.audioMissingDesc || 'Chưa có file âm thanh cho ngôn ngữ này.', 'error');
            }
        }
    }, [
        audioState.entityType,
        audioState.error,
        audioState.isPlaying,
        audioState.isVisible,
        audioState.narration,
        audioState.playbackRate,
        clearSession,
        currentLang,
        currentSession,
        hasActiveSession,
        pauseAudioPlayback,
        setAudioState,
        setIsTicketModalOpen,
        showToast,
        startAudioPlayback,
        t
    ]);

    const playAnimalAudio = useCallback(async (animalOrId, startAutoplay = true, triggerSource = 'MANUAL_LIST') => {
        if (animalOrId && typeof animalOrId === 'object') {
            if (animalOrId.speciesId) {
                return playSpeciesAudio(animalOrId.speciesId, startAutoplay, currentLang, triggerSource);
            }
            if (animalOrId.id || animalOrId.animalId) {
                const animalId = animalOrId.id || animalOrId.animalId;
                const animalRes = await ZooApi.getAnimalById(animalId, currentLang);
                if (animalRes.success && animalRes.data?.speciesId) {
                    return playSpeciesAudio(animalRes.data.speciesId, startAutoplay, currentLang, triggerSource);
                }
                return playSpeciesAudio(animalId, startAutoplay, currentLang, triggerSource);
            }
        }
        const id = parseInt(animalOrId);
        const animalRes = await ZooApi.getAnimalById(id, currentLang);
        if (animalRes.success && animalRes.data?.speciesId) {
            return playSpeciesAudio(animalRes.data.speciesId, startAutoplay, currentLang, triggerSource);
        }
        return playSpeciesAudio(id, startAutoplay, currentLang, triggerSource);
    }, [currentLang, playSpeciesAudio]);

    const handleStopAudio = useCallback(() => {
        if (audioElementRef.current) {
            try {
                const curSec = Math.round(audioElementRef.current.currentTime || 0);
                const durSec = Math.round(audioElementRef.current.duration || audioState?.duration || 0);
                if (curSec > 0 && (durSec === 0 || curSec < durSec - 1)) {
                    ZooApi.recordDashboardTelemetry({
                        category: 'AUDIO',
                        eventType: 'PLAY_STOPPED_EARLY',
                        sessionId: currentSession?.sessionId || null,
                        languageCode: audioState?.narration?.languageCode || currentLang,
                        targetType: 'Animal',
                        targetId: audioState?.narration?.speciesId || audioState?.animal?.id || null,
                        targetName: audioState?.animal?.name || audioState?.narration?.title || 'Thuyết minh',
                        triggerSource: 'MANUAL_STOP',
                        listenDurationSeconds: curSec,
                        totalDurationSeconds: durSec || null,
                        isSuccess: true
                    });
                }
                audioElementRef.current.pause();
                audioElementRef.current.currentTime = 0;
            } catch (e) {
                console.warn('Error stopping audio:', e);
            }
        }
        setAudioState(prev => ({
            ...prev,
            isPlaying: false,
            currentTime: 0
        }));
    }, [audioState, currentLang, currentSession?.sessionId, setAudioState]);

    const handleCloseAudio = useCallback(() => {
        if (audioElementRef.current) {
            try {
                const curSec = Math.round(audioElementRef.current.currentTime || 0);
                const durSec = Math.round(audioElementRef.current.duration || audioState?.duration || 0);
                if (!audioElementRef.current.paused && curSec > 0 && (durSec === 0 || curSec < durSec - 1)) {
                    ZooApi.recordDashboardTelemetry({
                        category: 'AUDIO',
                        eventType: 'PLAY_STOPPED_EARLY',
                        sessionId: currentSession?.sessionId || null,
                        languageCode: audioState?.narration?.languageCode || currentLang,
                        targetType: 'Animal',
                        targetId: audioState?.narration?.speciesId || audioState?.animal?.id || null,
                        targetName: audioState?.animal?.name || audioState?.narration?.title || 'Thuyết minh',
                        triggerSource: 'MANUAL_CLOSE',
                        listenDurationSeconds: curSec,
                        totalDurationSeconds: durSec || null,
                        isSuccess: true
                    });
                }
                audioElementRef.current.pause();
                audioElementRef.current.currentTime = 0;
                audioElementRef.current.src = '';
            } catch (e) {
                console.warn('Error closing audio:', e);
            }
        }
        setAudioState(prev => ({
            ...prev,
            isPlaying: false,
            currentTime: 0,
            isVisible: false
        }));
    }, [audioState, currentLang, currentSession?.sessionId, setAudioState]);

    // Tự động dừng âm thanh khi mất phiên vé hoặc phiên vé hết hạn
    useEffect(() => {
        if (!hasActiveSession && audioState.isPlaying) {
            handleStopAudio();
        }
    }, [hasActiveSession, audioState.isPlaying, handleStopAudio]);

    // Kiểm tra định kỳ hạn vé trong lúc người dùng đang nghe
    useEffect(() => {
        if (!hasActiveSession || !currentSession?.expiresAt) return;
        const interval = setInterval(() => {
            const now = new Date();
            const exp = new Date(currentSession.expiresAt);
            if (now >= exp) {
                clearSession();
                handleCloseAudio();
                showToast('Phiên vé của bạn đã hết hạn. Đã dừng thuyết minh.', 'error');
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [hasActiveSession, currentSession, clearSession, handleCloseAudio, showToast]);

    const resumeAudioPlayback = () => {
        if (!hasActiveSession || !currentSession?.sessionId) {
            showToast('Vui lòng kích hoạt vé tham quan hợp lệ để nghe thuyết minh.', 'error');
            pauseAudioPlayback();
            setIsTicketModalOpen(true);
            return;
        }
        if (!audioState.narration?.audioSrc) {
            showToast(t?.audioMissingDesc || 'Chưa có file âm thanh cho ngôn ngữ này.', 'error');
            return;
        }
        if (audioElementRef.current && audioElementRef.current.src) {
            audioElementRef.current.play().then(() => {
                setAudioState(prev => ({ ...prev, isPlaying: true }));
            }).catch(() => {
                startAudioPlayback(audioState.narration, audioState.playbackRate);
            });
        } else {
            startAudioPlayback(audioState.narration, audioState.playbackRate);
            setAudioState(prev => ({ ...prev, isPlaying: true }));
        }
    };

    const handleTogglePlay = () => {
        if (audioState.isPlaying) {
            pauseAudioPlayback();
        } else {
            resumeAudioPlayback();
        }
    };

    const handleSkip = (seconds) => {
        setAudioState(prev => {
            const nextTime = Math.max(0, Math.min(prev.duration, prev.currentTime + seconds));
            if (audioElementRef.current) {
                try { audioElementRef.current.currentTime = nextTime; } catch (e) {}
            }
            return { ...prev, currentTime: nextTime };
        });
    };

    const handleSeek = (time) => {
        if (audioElementRef.current) {
            try { audioElementRef.current.currentTime = time; } catch (e) {}
        }
        setAudioState(prev => ({ ...prev, currentTime: time }));
    };

    const handleChangeSpeed = (speed) => {
        setAudioState(prev => ({ ...prev, playbackRate: speed }));
        if (audioElementRef.current) {
            audioElementRef.current.playbackRate = speed;
        }
    };

    const handleChangeVolume = (newVolume) => {
        const clamped = Math.max(0, Math.min(1, Number(newVolume)));
        setAudioState(prev => ({
            ...prev,
            volume: clamped,
            isMuted: clamped === 0
        }));
        if (audioElementRef.current) {
            audioElementRef.current.volume = clamped;
            audioElementRef.current.muted = clamped === 0;
        }
    };

    const handleToggleMute = () => {
        setAudioState(prev => {
            const nextMuted = !prev.isMuted;
            if (audioElementRef.current) {
                audioElementRef.current.muted = nextMuted;
                if (!nextMuted && (prev.volume || 0) === 0) {
                    audioElementRef.current.volume = 0.8;
                }
            }
            return {
                ...prev,
                isMuted: nextMuted,
                volume: !nextMuted && (prev.volume || 0) === 0 ? 0.8 : prev.volume
            };
        });
    };

    useEffect(() => {
        audioElementRef.current = new Audio();
        audioElementRef.current.preload = 'metadata';
        return () => {
            if (audioElementRef.current) {
                audioElementRef.current.pause();
                audioElementRef.current.src = '';
            }
        };
    }, []);

    const playPoiAudio = useCallback(async (poiId, startAutoplay = true, triggerSource = 'MANUAL_MAP', langOverride = null) => {
        if (!hasActiveSession || !currentSession?.sessionId) {
            showToast(t?.ticketRequiredNarration || 'Vui lòng kích hoạt vé tham quan hợp lệ để sử dụng chức năng thuyết minh.', 'error');
            pauseAudioPlayback();
            setIsTicketModalOpen(true);
            return;
        }

        if (new Date(currentSession.expiresAt) <= new Date()) {
            showToast(t?.ticketExpiredNarration || 'Phiên tham quan của bạn đã hết hạn. Vui lòng mua vé mới để tiếp tục nghe thuyết minh.', 'error');
            clearSession();
            pauseAudioPlayback();
            setIsTicketModalOpen(true);
            return;
        }

        const targetLang = (langOverride || currentLang || 'vi').trim().toLowerCase();

        // Nếu đang mở đúng POI và đúng ngôn ngữ có sẵn file âm thanh hợp lệ, chỉ cần phát tiếp, không tải lại
        if (
            audioState.isVisible &&
            audioState.entityType === 'POI' &&
            Number(audioState.narration?.poiId) === Number(poiId) &&
            (audioState.narration?.languageCode || '').toLowerCase() === targetLang &&
            audioState.narration?.audioSrc &&
            !audioState.error &&
            startAutoplay
        ) {
            if (!audioState.isPlaying) {
                startAudioPlayback(audioState.narration, audioState.playbackRate || 1.0, triggerSource);
            }
            return;
        }

        const reqId = ++playRequestIdRef.current;
        if (audioElementRef.current) {
            audioElementRef.current.pause();
        }

        setAudioState(prev => ({
            ...prev,
            isLoading: true,
            isPlaying: false,
            error: null,
            entityType: 'POI',
            isVisible: true
        }));

        ZooApi.recordDashboardTelemetry({
            category: 'AUDIO',
            eventType: 'PLAY_REQUESTED',
            sessionId: currentSession.sessionId,
            languageCode: targetLang,
            targetType: 'POI',
            targetId: parseInt(poiId),
            targetName: `POI #${poiId}`,
            triggerSource,
            isSuccess: true
        });

        try {
            const cacheKey = `POI:${poiId}:${targetLang}`;
            let res = narrationCacheRef.current.get(cacheKey);
            if (!res) {
                res = await ZooApi.getPoiPublicNarration(poiId, targetLang, currentSession.sessionId);
                if (res.success && res.data) {
                    narrationCacheRef.current.set(cacheKey, res);
                }
            }

            if (reqId !== playRequestIdRef.current) return;

            if (!res.success || !res.data) {
                ZooApi.recordDashboardTelemetry({
                    category: 'AUDIO',
                    eventType: 'ERROR_API',
                    sessionId: currentSession.sessionId,
                    languageCode: targetLang,
                    targetType: 'POI',
                    targetId: parseInt(poiId),
                    targetName: `POI #${poiId}`,
                    triggerSource,
                    isSuccess: false,
                    errorCode: res.unauthorized ? 'UNAUTHORIZED_SESSION' : 'POI_API_ERROR',
                    errorMessage: res.message || 'Chưa có bài thuyết minh cho điểm tham quan này'
                });
                if (res.unauthorized) {
                    showToast(res.message || 'Phiên tham quan đã hết hạn hoặc không hợp lệ. Vui lòng kích hoạt lại vé.', 'error');
                    clearSession();
                    pauseAudioPlayback();
                    setIsTicketModalOpen(true);
                } else {
                    const errText = res.message || 'Chưa có bài thuyết minh cho điểm tham quan này.';
                    setAudioState(prev => ({
                        ...prev,
                        isLoading: false,
                        isPlaying: false,
                        error: errText
                    }));
                    showToast(errText, 'error');
                }
                return;
            }
            const data = res.data;
            const poiObj = {
                id: 'poi_' + data.poiId,
                poiId: data.poiId,
                name: data.poiName,
                nameVi: data.poiName,
                imageUrl: data.imageUrl || '',
                scientificName: 'Điểm tham quan (' + (data.category || 'POI') + ')'
            };

            // Hỗ trợ cơ chế ngôn ngữ dự phòng (Graceful Language Fallback - PRD 6.2 & UC03 A1):
            const returnedLang = (data.languageCode || '').trim().toLowerCase();
            if (data.isFallbackLanguage) {
                const fallbackNotice = data.fallbackMessage || `Điểm tham quan "${data.poiName}" chưa có bản thu âm tiếng ${targetLang.toUpperCase()}. Đang phát bản dự phòng (${returnedLang.toUpperCase()}).`;
                showToast(fallbackNotice, 'info');
            } else if (returnedLang && returnedLang !== targetLang && !data.hasAudio) {
                const missingLangMsg = `Điểm tham quan "${data.poiName}" hiện chưa có bản ghi âm và nội dung thuyết minh cho ngôn ngữ ${targetLang.toUpperCase()}.`;
                ZooApi.recordDashboardTelemetry({
                    category: 'AUDIO',
                    eventType: 'ERROR_LOAD_FILE',
                    sessionId: currentSession.sessionId,
                    languageCode: targetLang,
                    targetType: 'POI',
                    targetId: parseInt(poiId),
                    targetName: data.poiName || `POI #${poiId}`,
                    triggerSource,
                    isSuccess: false,
                    errorCode: 'MISSING_LANGUAGE_AUDIO',
                    errorMessage: missingLangMsg
                });
                pauseAudioPlayback();
                setAudioState(prev => ({
                    ...prev,
                    animal: poiObj,
                    narration: {
                        poiId: data.poiId,
                        poiName: data.poiName,
                        entityType: 'POI',
                        languageCode: targetLang,
                        title: `${data.poiName} (${targetLang.toUpperCase()})`,
                        narrator: 'Chưa có bản thu âm',
                        content: '',
                        transcript: [],
                        durationFormatted: '--:--',
                        durationSec: 0,
                        hasAudio: false,
                        audioSrc: null
                    },
                    entityType: 'POI',
                    isPlaying: false,
                    isLoading: false,
                    currentTime: 0,
                    duration: 0,
                    error: missingLangMsg,
                    isVisible: true
                }));
                showToast(missingLangMsg, 'error');
                return;
            }

            const duration = data.durationSeconds || 60;
            const audioSource = (data.hasAudio ? data.streamUrl : null) || data.audioUrl;
            const mins = Math.floor(duration / 60).toString().padStart(2, '0');
            const secs = (duration % 60).toString().padStart(2, '0');
            const paragraphs = (data.content || '')
                .split(/\n+/)
                .map(p => p.trim())
                .filter(Boolean);
            const stepSec = paragraphs.length > 0 && duration > 0
                ? Math.max(5, Math.floor(duration / paragraphs.length))
                : 10;
            const structuredTranscript = paragraphs.length > 0
                ? paragraphs.map((text, idx) => ({ time: idx * stepSec, text }))
                : [{ time: 0, text: data.content || data.title || data.poiName }];

            const narrationData = {
                poiId: data.poiId,
                poiName: data.poiName,
                entityType: 'POI',
                languageCode: data.languageCode || targetLang,
                title: data.title || data.poiName,
                narrator: 'ZooGuide Audio (POI)',
                audioSrc: audioSource,
                publicUrl: data.audioUrl,
                streamUrl: data.streamUrl,
                content: data.content,
                transcript: structuredTranscript,
                durationFormatted: mins + ':' + secs,
                durationSec: duration,
                hasAudio: Boolean(audioSource),
                isFallbackLanguage: Boolean(data.isFallbackLanguage),
                fallbackMessage: data.fallbackMessage || null
            };
            setAudioState(prev => ({
                ...prev,
                animal: poiObj,
                narration: narrationData,
                entityType: 'POI',
                isPlaying: Boolean(audioSource && startAutoplay),
                isLoading: Boolean(audioSource && startAutoplay),
                error: !audioSource ? 'Điểm tham quan này hiện chưa có file âm thanh thuyết minh.' : null,
                currentTime: 0,
                duration,
                playbackRate: prev.playbackRate || 1.0,
                isVisible: true
            }));
            if (startAutoplay && audioSource) {
                startAudioPlayback(narrationData, audioState.playbackRate || 1.0, triggerSource);
            } else if (!audioSource) {
                showToast('Điểm tham quan này hiện chưa có file âm thanh thuyết minh.', 'info');
            }
        } catch (err) {
            setAudioState(prev => ({
                ...prev,
                isLoading: false,
                isPlaying: false,
                error: 'Không thể tải thuyết minh: ' + err.message
            }));
            showToast('Không thể phát thuyết minh: ' + err.message, 'error');
        }
    }, [
        audioState.entityType,
        audioState.error,
        audioState.isPlaying,
        audioState.isVisible,
        audioState.narration,
        audioState.playbackRate,
        clearSession,
        currentLang,
        currentSession,
        hasActiveSession,
        pauseAudioPlayback,
        setAudioState,
        setIsTicketModalOpen,
        showToast,
        startAudioPlayback,
        t
    ]);

    const handleRetryAudio = useCallback(() => {
        if (!audioState.narration) return;
        if (audioState.narration.poiId) {
            narrationCacheRef.current.delete(`POI:${audioState.narration.poiId}:${currentLang}`);
            playPoiAudio(audioState.narration.poiId, true, 'MANUAL_RETRY', currentLang);
        } else if (audioState.narration.speciesId) {
            narrationCacheRef.current.delete(`ANIMAL:${audioState.narration.speciesId}:${currentLang}`);
            playSpeciesAudio(audioState.narration.speciesId, true, currentLang, 'MANUAL_RETRY');
        }
    }, [audioState.narration, currentLang, playPoiAudio, playSpeciesAudio]);

    // Tự động tải lại thuyết minh đúng ngôn ngữ khi khách đổi ngôn ngữ trên Header
    useEffect(() => {
        if (
            audioState.isVisible &&
            audioState.narration &&
            audioState.narration.languageCode &&
            audioState.narration.languageCode.toLowerCase() !== currentLang.toLowerCase() &&
            hasActiveSession &&
            currentSession?.sessionId
        ) {
            if (audioState.narration.poiId) {
                playPoiAudio(audioState.narration.poiId, audioState.isPlaying, 'LANGUAGE_SWITCH', currentLang);
            } else if (audioState.narration.speciesId) {
                playSpeciesAudio(audioState.narration.speciesId, audioState.isPlaying, currentLang, 'LANGUAGE_SWITCH');
            }
        }
    }, [currentLang]);


    const handleLocateMap = (entity) => {
        if (entity) {
            setNavTargetAnimal(entity);
        }
        switchTab('map');
    };

    return (
        <div className="zooguide-app">
            <Header />

            <main className="app-main" role="main">
                <HeroBanner />

                <div className="container">
                    <ErrorBoundary title="Lỗi hiển thị nội dung phân hệ du khách">
                        {currentTab === 'map' && (
                            <MapTab
                                onPlayAudio={playAnimalAudio}
                                onOpenSpeciesNarration={(species) => setSelectedSpeciesForNarration(species)}
                                onOpenDetail={(animal) => setSelectedAnimalForDetail(animal)}
                                onPlayPoiAudio={playPoiAudio}
                            />
                        )}

                        {currentTab === 'species-audio' && (
                            <SpeciesAudioTab
                                onSelectSpecies={(species) => setSelectedSpeciesForNarration(species)}
                                onPlaySpeciesAudio={(speciesId, startAutoplay, lang) => playSpeciesAudio(speciesId, startAutoplay, lang)}
                                onLocateMap={(sp) => handleLocateMap(sp)}
                            />
                        )}

                        {currentTab === 'animals' && (
                            <AnimalsTab
                                onPlayAudio={playAnimalAudio}
                                onLocateMap={handleLocateMap}
                            />
                        )}

                        {currentTab === 'tickets' && (
                            <TicketsTab />
                        )}
                    </ErrorBoundary>
                </div>
            </main>

            <AudioPlayerBar
                onTogglePlay={handleTogglePlay}
                onSkip={handleSkip}
                onSeek={handleSeek}
                onChangeSpeed={handleChangeSpeed}
                onChangeVolume={handleChangeVolume}
                onToggleMute={handleToggleMute}
                onRetry={handleRetryAudio}
                onStop={handleStopAudio}
                onClose={handleCloseAudio}
            />

            <MobileBottomNav />

            <TicketModal />
            <ElectronicTicketModal />
            <AnimalDetailModal
                onPlayAudio={playAnimalAudio}
                onNavigate={(animal) => handleLocateMap(animal)}
            />
            <SpeciesNarrationModal
                species={selectedSpeciesForNarration}
                isOpen={Boolean(selectedSpeciesForNarration)}
                onClose={() => setSelectedSpeciesForNarration(null)}
                onPlayAudio={playSpeciesAudio}
                onNavigateMap={(sp) => {
                    setSelectedSpeciesForNarration(null);
                    handleLocateMap(sp);
                }}
            />
            <TranscriptModal onSeek={handleSeek} />
        </div>
    );
}
