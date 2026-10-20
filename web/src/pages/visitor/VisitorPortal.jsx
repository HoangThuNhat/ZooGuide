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
import AnimalDetailModal from '../../components/animals/AnimalDetailModal';
import SpeciesNarrationModal from '../../components/species/SpeciesNarrationModal';
import TranscriptModal from '../../components/audio/TranscriptModal';
import AudioPlayerBar from '../../components/audio/AudioPlayerBar';
import Chatbot from '../../components/chat/Chatbot';
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

    const pauseAudioPlayback = useCallback(() => {
        if (audioElementRef.current) {
            audioElementRef.current.pause();
        }
        setAudioState(prev => ({ ...prev, isPlaying: false }));
    }, [setAudioState]);

    const startAudioPlayback = useCallback((narration, rate = 1.0) => {
        if (!narration || !narration.audioSrc) {
            showToast(t?.audioMissingDesc || 'Chưa có file âm thanh cho ngôn ngữ này.', 'error');
            setAudioState(prev => ({ ...prev, isPlaying: false }));
            return;
        }

        try {
            if (!audioElementRef.current) {
                audioElementRef.current = new Audio();
            }
            const audio = audioElementRef.current;
            audio.pause();

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
                setAudioState(prev => ({
                    ...prev,
                    isPlaying: false,
                    currentTime: prev.duration
                }));
            };

            audio.onerror = () => {
                showToast(t?.audioMissingDesc || 'Không thể tải hoặc phát file âm thanh thuyết minh.', 'error');
                pauseAudioPlayback();
            };

            audio.src = narration.audioSrc;
            audio.playbackRate = rate;
            audio.currentTime = 0;
            audio.play().catch(err => {
                console.warn('Audio playback blocked or failed:', err.message);
                setAudioState(prev => ({ ...prev, isPlaying: false }));
            });
        } catch (err) {
            console.warn('Audio setup error:', err);
            pauseAudioPlayback();
        }
    }, [pauseAudioPlayback, setAudioState, showToast, t]);

    const playSpeciesAudio = useCallback(async (speciesId, startAutoplay = true, lang = currentLang) => {
        if (!hasActiveSession || !currentSession?.sessionId) {
            showToast('Vui lòng kích hoạt vé tham quan hợp lệ để sử dụng chức năng thuyết minh.', 'error');
            pauseAudioPlayback();
            setIsTicketModalOpen(true);
            return;
        }

        const res = await ZooApi.getSpeciesNarration(speciesId, lang, currentSession.sessionId);
        if (!res.success) {
            if (res.unauthorized) {
                showToast(res.message || 'Phiên tham quan đã hết hạn hoặc bị thu hồi. Vui lòng kích hoạt lại vé.', 'error');
                clearSession();
                pauseAudioPlayback();
                setIsTicketModalOpen(true);
            } else {
                pauseAudioPlayback();
                showToast(res.message || t?.narrationMissingTitle || 'Chưa có bài thuyết minh cho ngôn ngữ này.', 'error');
            }
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

        setAudioState({
            animal: animalObj,
            narration: res.data,
            isPlaying: canAutoPlay,
            currentTime: 0,
            duration,
            playbackRate: 1.0,
            isVisible: true
        });

        if (startAutoplay) {
            if (res.data.hasAudio && res.data.audioSrc) {
                startAudioPlayback(res.data, 1.0);
            } else {
                showToast(t?.audioMissingDesc || 'Chưa có file âm thanh cho ngôn ngữ này.', 'error');
            }
        }
    }, [
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

    const playAnimalAudio = useCallback(async (animalOrId, startAutoplay = true) => {
        if (animalOrId && typeof animalOrId === 'object' && animalOrId.speciesId) {
            return playSpeciesAudio(animalOrId.speciesId, startAutoplay, currentLang);
        }
        const id = parseInt(animalOrId);
        const animalRes = await ZooApi.getAnimalById(id, currentLang);
        if (animalRes.success && animalRes.data?.speciesId) {
            return playSpeciesAudio(animalRes.data.speciesId, startAutoplay, currentLang);
        }
        return playSpeciesAudio(id, startAutoplay, currentLang);
    }, [currentLang, playSpeciesAudio]);

    // Automatically reload active narration in AudioPlayerBar when language switches
    useEffect(() => {
        if (
            audioState.isVisible &&
            audioState.narration &&
            audioState.narration.speciesId &&
            audioState.narration.languageCode &&
            audioState.narration.languageCode !== currentLang &&
            hasActiveSession &&
            currentSession?.sessionId
        ) {
            playSpeciesAudio(audioState.narration.speciesId, audioState.isPlaying, currentLang);
        }
    }, [currentLang]);

    const resumeAudioPlayback = () => {
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

    useEffect(() => {
        audioElementRef.current = new Audio();
        return () => {
            if (audioElementRef.current) {
                audioElementRef.current.pause();
                audioElementRef.current.src = '';
            }
        };
    }, []);

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
            />

            <MobileBottomNav />
            <Chatbot />

            <TicketModal />
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
