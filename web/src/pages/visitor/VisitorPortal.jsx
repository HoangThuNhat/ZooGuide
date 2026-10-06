import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ZooApi, MOCK_DB } from '../../services/api';

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

export default function VisitorPortal() {
    const { 
        currentTab, 
        switchTab,
        currentLang, 
        hasActiveSession, 
        setIsTicketModalOpen, 
        setSelectedAnimalForDetail, 
        showToast,
        audioState, 
        setAudioState,
        validateTicketCode
    } = useApp();

    const [selectedSpeciesForNarration, setSelectedSpeciesForNarration] = useState(null);

    const audioTimerRef = useRef(null);
    const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
    const speechUtteranceRef = useRef(null);
    const audioElementRef = useRef(null);

    // Audio Engine Functions - strictly Species-bound narration
    const playSpeciesAudio = async (speciesId, startAutoplay = true, lang = currentLang) => {
        if (!hasActiveSession) {
            if (typeof validateTicketCode === 'function') {
                await validateTicketCode('ZOO-8899-VIP');
            }
            showToast("Đã kích hoạt vé tham quan trải nghiệm âm thanh!", "info");
        }

        const res = await ZooApi.getSpeciesNarration(speciesId, lang);
        if (!res.success) {
            showToast("Không tìm thấy dữ liệu thuyết minh", "error");
            return;
        }

        const speciesList = await ZooApi.getSpecies();
        const species = speciesList?.data?.find(s => s.id === parseInt(speciesId) || s.id === speciesId);
        const residentAnimals = MOCK_DB.animals.filter(a => a.speciesId === parseInt(speciesId));

        const animalObj = {
            id: speciesId,
            speciesId: parseInt(speciesId),
            nameVi: res.data.title,
            nameEn: res.data.title,
            scientificName: species?.scientificName || res.data.scientificName || "",
            imageUrl: res.data.imageUrl || species?.imageUrl || (residentAnimals[0]?.imageUrl) || "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800",
            residentCount: residentAnimals.length
        };
        const duration = res.data.durationSec || 90;

        setAudioState({
            animal: animalObj,
            narration: res.data,
            isPlaying: startAutoplay,
            currentTime: 0,
            duration,
            playbackRate: 1.0,
            isVisible: true
        });

        if (startAutoplay) {
            startAudioPlayback(res.data, duration, 1.0, lang);
        }
    };

    const playAnimalAudio = async (animalId, startAutoplay = true) => {
        const animal = MOCK_DB.animals.find(a => a.id === parseInt(animalId));
        if (animal && animal.speciesId) {
            // Animals strictly delegate to Species narration
            return playSpeciesAudio(animal.speciesId, startAutoplay, currentLang);
        }
        return playSpeciesAudio(animalId, startAutoplay, currentLang);
    };

    const startAudioPlayback = (narration, duration, rate, lang = currentLang) => {
        // 1. Play real audio track
        if (narration && narration.audioSrc) {
            try {
                if (!audioElementRef.current) {
                    audioElementRef.current = new Audio();
                }
                audioElementRef.current.src = narration.audioSrc;
                audioElementRef.current.playbackRate = rate;
                audioElementRef.current.currentTime = 0;
                audioElementRef.current.play().catch(err => {
                    console.info("Audio track playback note:", err.message);
                });
            } catch (err) {
                console.warn("Audio element setup error:", err);
            }
        }

        // 2. Play Web Speech Synthesis narration
        if (synthRef.current && narration && narration.transcript) {
            try {
                synthRef.current.cancel();
                synthRef.current.resume();

                const fullText = narration.transcript.map(t => t.text).join(' ');
                const utterance = new SpeechSynthesisUtterance(fullText);
                utterance.rate = rate;
                const effectiveLang = lang || narration.language || currentLang;
                utterance.lang = effectiveLang === 'en' ? 'en-US' : 'vi-VN';

                const voices = synthRef.current.getVoices();
                const targetLang = effectiveLang === 'en' ? 'en' : 'vi';
                const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang));
                if (matchedVoice) {
                    utterance.voice = matchedVoice;
                }

                utterance.onend = () => {
                    pauseAudioPlayback();
                };
                utterance.onerror = (e) => {
                    if (e.error !== 'interrupted' && e.error !== 'canceled') {
                        console.warn("SpeechSynthesis notice:", e.error);
                    }
                };

                speechUtteranceRef.current = utterance;
                setTimeout(() => {
                    if (synthRef.current) {
                        synthRef.current.resume();
                        synthRef.current.speak(utterance);
                    }
                }, 40);
            } catch (err) {
                console.warn("SpeechSynthesis error:", err);
            }
        }

        clearInterval(audioTimerRef.current);
        audioTimerRef.current = setInterval(() => {
            // Keep Chrome speech synthesis awake
            if (synthRef.current && synthRef.current.paused) {
                synthRef.current.resume();
            }

            setAudioState(prev => {
                if (prev.currentTime >= prev.duration) {
                    clearInterval(audioTimerRef.current);
                    return { ...prev, isPlaying: false, currentTime: prev.duration };
                }
                return { ...prev, currentTime: prev.currentTime + 1 };
            });
        }, 1000 / rate);
    };

    const pauseAudioPlayback = () => {
        clearInterval(audioTimerRef.current);
        if (audioElementRef.current) {
            audioElementRef.current.pause();
        }
        if (synthRef.current) {
            synthRef.current.pause();
        }
        setAudioState(prev => ({ ...prev, isPlaying: false }));
    };

    const resumeAudioPlayback = () => {
        if (audioElementRef.current) {
            audioElementRef.current.play().catch(() => {});
        }
        if (synthRef.current) {
            synthRef.current.resume();
        }
        startAudioPlayback(audioState.narration, audioState.duration, audioState.playbackRate);
        setAudioState(prev => ({ ...prev, isPlaying: true }));
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
        if (audioState.isPlaying) {
            startAudioPlayback(audioState.narration, audioState.duration, speed);
        }
    };

    useEffect(() => {
        audioElementRef.current = new Audio();
        return () => {
            clearInterval(audioTimerRef.current);
            if (synthRef.current) synthRef.current.cancel();
            if (audioElementRef.current) {
                audioElementRef.current.pause();
                audioElementRef.current.src = "";
            }
        };
    }, []);

    const handleLocateMap = (animal) => {
        switchTab('map');
    };

    return (
        <div className="zooguide-app">
            {/* Header */}
            <Header />

            {/* Main Container */}
            <main className="app-main" role="main">
                {/* Hero Banner */}
                <HeroBanner />

                <div className="container">
                    {/* Map Tab */}
                    {currentTab === 'map' && (
                        <MapTab 
                            onPlayAudio={playAnimalAudio}
                            onOpenSpeciesNarration={(species) => setSelectedSpeciesForNarration(species)}
                            onOpenDetail={(animal) => setSelectedAnimalForDetail(animal)}
                        />
                    )}

                    {/* Species Narration Tab ("Thuyết minh các loài") */}
                    {currentTab === 'species-audio' && (
                        <SpeciesAudioTab 
                            onSelectSpecies={(species) => setSelectedSpeciesForNarration(species)}
                            onPlaySpeciesAudio={(speciesId, startAutoplay, lang) => playSpeciesAudio(speciesId, startAutoplay, lang)}
                            onLocateMap={() => switchTab('map')}
                        />
                    )}

                    {/* Animals Tab */}
                    {currentTab === 'animals' && (
                        <AnimalsTab 
                            onPlayAudio={playAnimalAudio}
                            onLocateMap={handleLocateMap}
                        />
                    )}

                    {/* Tickets Tab */}
                    {currentTab === 'tickets' && (
                        <TicketsTab />
                    )}
                </div>
            </main>

            {/* Floating Persistent Audio Player Bar */}
            <AudioPlayerBar 
                onTogglePlay={handleTogglePlay}
                onSkip={handleSkip}
                onSeek={handleSeek}
                onChangeSpeed={handleChangeSpeed}
            />

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />

            {/* AI Chatbot */}
            <Chatbot />

            {/* Modals */}
            <TicketModal />
            <AnimalDetailModal 
                onPlayAudio={playAnimalAudio}
                onNavigate={(animal) => {
                    switchTab('map');
                }}
            />
            <SpeciesNarrationModal 
                species={selectedSpeciesForNarration}
                isOpen={!!selectedSpeciesForNarration}
                onClose={() => setSelectedSpeciesForNarration(null)}
                onPlayAudio={playSpeciesAudio}
                onNavigateMap={() => {
                    setSelectedSpeciesForNarration(null);
                    switchTab('map');
                }}
            />
            <TranscriptModal onSeek={handleSeek} />
        </div>
    );
}
