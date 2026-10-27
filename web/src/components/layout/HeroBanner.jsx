import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ZooApi } from '../../services/api';
import { ZOO_OPERATIONAL_INFO } from '../../services/operationalData';

const HERO_SLIDES = [
    {
        id: 'tiger',
        speciesName: 'Hổ Bengal',
        scientificName: 'Panthera tigris tigris',
        statusLabel: 'BẢO TỒN ĐỘNG VẬT NGUY CẤP',
        statusLevel: 'EN',
        habitat: 'Khu sinh cảnh rừng mưa tự nhiên',
        imageSrc: '/assets/hero-tiger.jpg',
        alt: 'Hổ Bengal dũng mãnh tại Thảo Cầm Viên Sài Gòn'
    },
    {
        id: 'lion',
        speciesName: 'Sư tử Châu Phi',
        scientificName: 'Panthera leo',
        statusLabel: 'ĐỘNG VẬT SẮP NGUY CẤP',
        statusLevel: 'VU',
        habitat: 'Khu sinh thái đồng cỏ Savanna',
        imageSrc: '/assets/hero-lion.jpg',
        alt: 'Sư tử Châu Phi oai vệ tại Thảo Cầm Viên Sài Gòn'
    },
    {
        id: 'elephant',
        speciesName: 'Voi Châu Á',
        scientificName: 'Elephas maximus',
        statusLabel: 'BẢO TỒN ĐỘNG VẬT NGUY CẤP',
        statusLevel: 'EN',
        habitat: 'Khu bảo tồn thú ăn cỏ nhiệt đới',
        imageSrc: '/assets/hero-elephant.jpg',
        alt: 'Voi Châu Á hiền hòa tại Thảo Cầm Viên Sài Gòn'
    },
    {
        id: 'eagle',
        speciesName: 'Đại Bàng Hoàng Gia',
        scientificName: 'Aquila heliaca',
        statusLabel: 'ĐỘNG VẬT SẮP NGUY CẤP',
        statusLevel: 'VU',
        habitat: 'Khu chuồng chim vòm tự nhiên',
        imageSrc: '/assets/hero-eagle.jpg',
        alt: 'Đại Bàng Hoàng Gia sải cánh tại Thảo Cầm Viên Sài Gòn'
    }
];

const SLIDE_INTERVAL_MS = 6000;

export default function HeroBanner() {
    const { switchTab, setIsTicketModalOpen, currentSession, hasActiveSession, openElectronicTicketModal } = useApp();

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [ticketPriceSummary, setTicketPriceSummary] = useState('120.000đ (Người lớn) • 60.000đ (Trẻ em)');
    const timerRef = useRef(null);

    // Load authoritative ticket types from database
    useEffect(() => {
        let isMounted = true;
        ZooApi.getTicketTypes().then(res => {
            if (isMounted && res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                const adult = res.data.find(t => t.name.toLowerCase().includes('người lớn') || t.name.toLowerCase().includes('adult'));
                const child = res.data.find(t => t.name.toLowerCase().includes('trẻ em') || t.name.toLowerCase().includes('child'));
                const adultPrice = adult ? `${Number(adult.price).toLocaleString('vi-VN')}đ (Người lớn)` : '120.000đ (Người lớn)';
                const childPrice = child ? `${Number(child.price).toLocaleString('vi-VN')}đ (Trẻ em)` : '60.000đ (Trẻ em)';
                setTicketPriceSummary(`${adultPrice} • ${childPrice}`);
            }
        }).catch(() => {});
        return () => { isMounted = false; };
    }, []);

    // Preload all slide images on mount to prevent any delay during transitions
    useEffect(() => {
        HERO_SLIDES.forEach(slide => {
            const img = new Image();
            img.src = slide.imageSrc;
        });
    }, []);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const goToNextSlide = useCallback(() => {
        setCurrentSlideIndex(prev => (prev + 1) % HERO_SLIDES.length);
    }, []);

    const goToPrevSlide = useCallback(() => {
        setCurrentSlideIndex(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    }, []);

    // Automatic smooth crossfade slideshow timer
    useEffect(() => {
        if (isPaused) {
            resetTimer();
            return;
        }

        resetTimer();
        timerRef.current = setInterval(() => {
            goToNextSlide();
        }, SLIDE_INTERVAL_MS);

        return () => resetTimer();
    }, [isPaused, goToNextSlide, resetTimer]);

    const handleManualNext = () => {
        resetTimer();
        goToNextSlide();
    };

    const handleManualPrev = () => {
        resetTimer();
        goToPrevSlide();
    };

    const handleManualSelect = (index) => {
        resetTimer();
        setCurrentSlideIndex(index);
    };

    return (
        <section className="hero-banner hero-banner-master" aria-label="Giới thiệu hệ thống ZooGuide Thảo Cầm Viên Sài Gòn">
            <div className="container hero-inner-container">
                <div className="hero-editorial-grid hero-content-grid">
                    {/* Left: Authority Brand & Value Proposition Column */}
                    <div className="hero-intro-column hero-text-column">
                        <div className="hero-eyebrow hero-tag-badge">
                            <span className="eyebrow-dot badge-pulse-dot" aria-hidden="true"></span>
                            <span>HỆ THỐNG THUYẾT MINH TỰ ĐỘNG THẢO CẦM VIÊN</span>
                        </div>

                        <h1 className="hero-headline">
                            <span className="hero-main-title">Thảo Cầm Viên Sài Gòn</span>
                            <span className="hero-subheadline">Khám phá thiên nhiên di sản 160 năm</span>
                        </h1>

                        <p className="hero-description">
                            Trải nghiệm hướng dẫn tham quan số với bản đồ địa lý thực tế (OpenStreetMap), thuyết minh âm thanh đa ngôn ngữ cho từng loài động vật quý hiếm và đặt vé trực tuyến VietQR tức thì.
                        </p>

                        {/* Primary and Secondary Action Buttons */}
                        <div className="hero-action-buttons">
                            <button
                                type="button"
                                className="btn-hero-primary"
                                onClick={() => switchTab('tickets')}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                                    <circle cx="12" cy="12" r="2"></circle>
                                    <path d="M6 12h.01M18 12h.01"></path>
                                </svg>
                                <span>Đặt Vé Tham Quan</span>
                            </button>

                            <button
                                type="button"
                                className="btn-hero-secondary"
                                onClick={() => switchTab('map')}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                                    <line x1="8" y1="2" x2="8" y2="18"></line>
                                    <line x1="16" y1="6" x2="16" y2="22"></line>
                                </svg>
                                <span>Bản Đồ Đi Lại</span>
                            </button>

                            <button
                                type="button"
                                className="btn-hero-ghost"
                                onClick={() => switchTab('species-audio')}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                                </svg>
                                <span>Thuyết Minh Âm Thanh</span>
                            </button>
                        </div>

                        {/* Ticket Pass Active / Activation Prompt Banner */}
                        <div className="hero-ticket-prompt">
                            {hasActiveSession ? (
                                <div className="hero-active-session-pill">
                                    <div className="session-status-indicator">
                                        <span className="live-dot"></span>
                                        <span>Phiên tham quan đang hoạt động:</span>
                                        <strong className="session-code font-mono">{currentSession.ticketCode}</strong>
                                        <span className="session-user">• {currentSession.customerName || 'Khách tham quan'}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        className="btn-view-pass"
                                        onClick={() => openElectronicTicketModal()}
                                    >
                                        Xem Thẻ Điện Tử
                                    </button>
                                </div>
                            ) : (
                                <div className="hero-inactive-prompt">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <span>Quý khách đã có vé giấy hoặc mã QR vào cổng?</span>
                                    <button 
                                        type="button" 
                                        className="btn-link-activate"
                                        onClick={() => setIsTicketModalOpen(true)}
                                    >
                                        Kích hoạt vé ngay →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Automatic Animal Carousel Focal Point */}
                    <div className="hero-visual-column">
                        <div 
                            className="hero-carousel-container"
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                            onFocus={() => setIsPaused(true)}
                            onBlur={() => setIsPaused(false)}
                            role="region"
                            aria-roledescription="carousel"
                            aria-label="Ảnh động vật tiêu biểu Thảo Cầm Viên"
                        >
                            {/* Slide Counter / Indicators */}
                            <div className="hero-carousel-nav" role="tablist" aria-label="Bộ điều khiển chọn slide">
                                {HERO_SLIDES.map((slide, idx) => (
                                    <button
                                        key={slide.id}
                                        type="button"
                                        role="tab"
                                        className={`carousel-dot ${idx === currentSlideIndex ? 'active' : ''}`}
                                        onClick={() => handleManualSelect(idx)}
                                        aria-selected={idx === currentSlideIndex}
                                        aria-label={`Xem ảnh loài ${slide.speciesName} (${idx + 1}/${HERO_SLIDES.length})`}
                                    />
                                ))}
                            </div>

                            {/* Manual Prev / Next Arrow Controls */}
                            <button
                                type="button"
                                className="carousel-arrow prev"
                                onClick={handleManualPrev}
                                aria-label="Xem loài động vật trước đó"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <button
                                type="button"
                                className="carousel-arrow next"
                                onClick={handleManualNext}
                                aria-label="Xem loài động vật tiếp theo"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>

                            {/* Render All Slides for Smooth Crossfade */}
                            {HERO_SLIDES.map((slide, idx) => {
                                const isActive = idx === currentSlideIndex;
                                return (
                                    <div 
                                        key={slide.id}
                                        className={`hero-slide ${isActive ? 'active' : ''}`}
                                        aria-hidden={!isActive}
                                    >
                                        <img 
                                            src={slide.imageSrc} 
                                            alt={slide.alt}
                                            className="hero-slide-image hero-photography-img"
                                            loading={idx === 0 ? "eager" : "lazy"}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=1200&q=80';
                                            }}
                                        />
                                        <div className="hero-photography-overlay">
                                            <div className="photo-badge">{slide.statusLabel} • {slide.statusLevel}</div>
                                            <h3 className="photo-species-title">{slide.speciesName} • {slide.scientificName}</h3>
                                            <p className="photo-species-subtitle">{slide.habitat} • Có sẵn bài thuyết minh âm thanh</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Essential Visitor Information Strip */}
                <div className="hero-info-strip">
                    <div className="info-strip-item">
                        <div className="strip-icon-box" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div className="strip-content">
                            <span className="strip-label">Giờ mở cửa hàng ngày</span>
                            <span className="strip-val">{ZOO_OPERATIONAL_INFO.openingHours}</span>
                        </div>
                    </div>

                    <div className="info-strip-divider"></div>

                    <div className="info-strip-item">
                        <div className="strip-icon-box" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <div className="strip-content">
                            <span className="strip-label">Địa chỉ sở thú</span>
                            <span className="strip-val">{ZOO_OPERATIONAL_INFO.address}</span>
                        </div>
                    </div>

                    <div className="info-strip-divider"></div>

                    <div className="info-strip-item">
                        <div className="strip-icon-box" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                                <circle cx="12" cy="12" r="2"></circle>
                                <path d="M6 12h.01M18 12h.01"></path>
                            </svg>
                        </div>
                        <div className="strip-content">
                            <span className="strip-label">Giá vé vào cổng</span>
                            <span className="strip-val">{ticketPriceSummary}</span>
                        </div>
                    </div>

                    <div className="info-strip-divider"></div>

                    <div className="info-strip-item">
                        <div className="strip-icon-box" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                                <line x1="8" y1="2" x2="8" y2="18"></line>
                                <line x1="16" y1="6" x2="16" y2="22"></line>
                            </svg>
                        </div>
                        <div className="strip-content">
                            <span className="strip-label">Cổng đón khách</span>
                            <span className="strip-val">{ZOO_OPERATIONAL_INFO.gates}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
