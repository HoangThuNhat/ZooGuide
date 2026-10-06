import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ZooApi, MOCK_DB } from '../../services/api';

// Layout & Global Components
import Header from '../../components/layout/Header';
import HeroBanner from '../../components/layout/HeroBanner';
import MobileBottomNav from '../../components/layout/MobileBottomNav';

// Tab Views for Visitor
import MapTab from '../../components/map/MapTab';
import AnimalsTab from '../../components/animals/AnimalsTab';
import TicketsTab from '../../components/tickets/TicketsTab';

// Modals & Floating Features
import TicketModal from '../../components/tickets/TicketModal';
import AnimalDetailModal from '../../components/animals/AnimalDetailModal';
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
        setAudioState
    } = useApp();

    const audioTimerRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const speechUtteranceRef = useRef(null);

    // Audio Engine Functions
    const playAnimalAudio = async (animalId, startAutoplay = true) => {
        if (!hasActiveSession) {
            setIsTicketModalOpen(true);
            showToast("Vui lòng quét hoặc nhập mã vé để nghe thuyết minh!", "warning");
            return;
        }

        const res = await ZooApi.getNarration(animalId, currentLang);
        if (!res.success) {
            showToast("Không tìm thấy dữ liệu thuyết minh", "error");
            return;
        }

        const animal = MOCK_DB.animals.find(a => a.id === parseInt(animalId));
        const duration = res.data.durationSec || 120;

        setAudioState({
            animal,
            narration: res.data,
            isPlaying: startAutoplay,
            currentTime: 0,
            duration,
            playbackRate: 1.0,
            isVisible: true
        });

        if (startAutoplay) {
            startAudioPlayback(res.data, duration, 1.0);
        }
    };

    const startAudioPlayback = (narration, duration, rate) => {
        if (synthRef.current && narration && narration.transcript) {
            synthRef.current.cancel();
            const fullText = narration.transcript.map(t => t.text).join(' ');
            const utterance = new SpeechSynthesisUtterance(fullText);
            utterance.rate = rate;
            utterance.lang = currentLang === 'en' ? 'en-US' : 'vi-VN';
            utterance.onend = () => {
                pauseAudioPlayback();
            };
            speechUtteranceRef.current = utterance;
            synthRef.current.speak(utterance);
        }

        clearInterval(audioTimerRef.current);
        audioTimerRef.current = setInterval(() => {
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
        if (synthRef.current) {
            synthRef.current.pause();
        }
        setAudioState(prev => ({ ...prev, isPlaying: false }));
    };

    const resumeAudioPlayback = () => {
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
            return { ...prev, currentTime: nextTime };
        });
    };

    const handleSeek = (time) => {
        setAudioState(prev => ({ ...prev, currentTime: time }));
    };

    const handleChangeSpeed = (speed) => {
        setAudioState(prev => ({ ...prev, playbackRate: speed }));
        if (audioState.isPlaying) {
            startAudioPlayback(audioState.narration, audioState.duration, speed);
        }
    };

    useEffect(() => {
        return () => {
            clearInterval(audioTimerRef.current);
            if (synthRef.current) synthRef.current.cancel();
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
                            onOpenDetail={(animal) => setSelectedAnimalForDetail(animal)}
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
            <TranscriptModal onSeek={handleSeek} />
        </div>
    );
}
