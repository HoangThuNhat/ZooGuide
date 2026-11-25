import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ZooApi } from '../../services/api';
import { getZooOperationalInfo } from '../../services/operationalData';

const HERO_SLIDES = [
    {
        id: 'tiger',
        speciesNameVi: 'Hổ Bengal',
        speciesNameEn: 'Bengal Tiger',
        scientificName: 'Panthera tigris tigris',
        statusLabelVi: 'BẢO TỒN ĐỘNG VẬT NGUY CẤP',
        statusLabelEn: 'ENDANGERED WILDLIFE CONSERVATION',
        statusLevel: 'EN',
        habitatVi: 'Khu sinh cảnh rừng mưa tự nhiên',
        habitatEn: 'Natural rainforest habitat zone',
        imageSrc: '/assets/hero-tiger.jpg',
        altVi: 'Hổ Bengal dũng mãnh tại Thảo Cầm Viên Sài Gòn',
        altEn: 'Bengal Tiger at Saigon Zoo & Botanical Gardens'
    },
    {
        id: 'lion',
        speciesNameVi: 'Sư tử Châu Phi',
        speciesNameEn: 'African Lion',
        scientificName: 'Panthera leo',
        statusLabelVi: 'ĐỘNG VẬT SẮP NGUY CẤP',
        statusLabelEn: 'VULNERABLE WILDLIFE',
        statusLevel: 'VU',
        habitatVi: 'Khu sinh thái đồng cỏ Savanna',
        habitatEn: 'Savanna grassland ecological zone',
        imageSrc: '/assets/hero-lion.jpg',
        altVi: 'Sư tử Châu Phi oai vệ tại Thảo Cầm Viên Sài Gòn',
        altEn: 'African Lion at Saigon Zoo & Botanical Gardens'
    },
    {
        id: 'elephant',
        speciesNameVi: 'Voi Châu Á',
        speciesNameEn: 'Asian Elephant',
        scientificName: 'Elephas maximus',
        statusLabelVi: 'BẢO TỒN ĐỘNG VẬT NGUY CẤP',
        statusLabelEn: 'ENDANGERED WILDLIFE CONSERVATION',
        statusLevel: 'EN',
        habitatVi: 'Khu bảo tồn thú ăn cỏ nhiệt đới',
        habitatEn: 'Tropical herbivore conservation sanctuary',
        imageSrc: '/assets/hero-elephant.jpg',
        altVi: 'Voi Châu Á hiền hòa tại Thảo Cầm Viên Sài Gòn',
        altEn: 'Asian Elephant at Saigon Zoo & Botanical Gardens'
    },
    {
        id: 'eagle',
        speciesNameVi: 'Đại Bàng Hoàng Gia',
        speciesNameEn: 'Eastern Imperial Eagle',
        scientificName: 'Aquila heliaca',
        statusLabelVi: 'ĐỘNG VẬT SẮP NGUY CẤP',
        statusLabelEn: 'VULNERABLE WILDLIFE',
        statusLevel: 'VU',
        habitatVi: 'Khu chuồng chim vòm tự nhiên',
        habitatEn: 'Natural tropical dome aviary',
        imageSrc: '/assets/hero-eagle.jpg',
        altVi: 'Đại Bàng Hoàng Gia sải cánh tại Thảo Cầm Viên Sài Gòn',
        altEn: 'Eastern Imperial Eagle at Saigon Zoo & Botanical Gardens'
    }
];

const SLIDE_INTERVAL_MS = 6000;

export default function HeroBanner() {
    const { switchTab, setIsTicketModalOpen, currentSession, hasActiveSession, openElectronicTicketModal, currentLang, t } = useApp();
    const isVi = (currentLang || 'vi').toLowerCase() === 'vi';
    const operationalInfo = getZooOperationalInfo(currentLang);

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [ticketPrices, setTicketPrices] = useState({ adult: 120000, child: 60000 });
    const timerRef = useRef(null);

    // Load authoritative ticket types from database
    useEffect(() => {
        let isMounted = true;
        ZooApi.getTicketTypes().then(res => {
            if (isMounted && res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                const adult = res.data.find(tt => tt.name.toLowerCase().includes('người lớn') || tt.name.toLowerCase().includes('adult'));
                const child = res.data.find(tt => tt.name.toLowerCase().includes('trẻ em') || tt.name.toLowerCase().includes('child'));
                setTicketPrices({
                    adult: adult ? Number(adult.price) : 120000,
                    child: child ? Number(child.price) : 60000
                });
            }
        }).catch(() => {});
        return () => { isMounted = false; };
    }, []);

    const ticketPriceSummary = isVi
        ? `${ticketPrices.adult.toLocaleString('vi-VN')}đ (Người lớn) • ${ticketPrices.child.toLocaleString('vi-VN')}đ (Trẻ em)`
        : `${ticketPrices.adult.toLocaleString('en-US')} VND (Adult) • ${ticketPrices.child.toLocaleString('en-US')} VND (Child)`;

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
                            <span>{t?.heroEyebrow || 'HỆ THỐNG THUYẾT MINH TỰ ĐỘNG THẢO CẦM VIÊN'}</span>
                        </div>

                        <h1 className="hero-headline">
                            <span className="hero-main-title">{t?.heroMainTitle || 'Thảo Cầm Viên Sài Gòn'}</span>
                            <span className="hero-subheadline">{t?.heroSubheadline || 'Khám phá thiên nhiên di sản 160 năm'}</span>
                        </h1>

                        <p className="hero-description">
                            {t?.heroDescription || 'Trải nghiệm hướng dẫn tham quan số với bản đồ địa lý thực tế (OpenStreetMap), thuyết minh âm thanh đa ngôn ngữ cho từng loài động vật quý hiếm và đặt vé trực tuyến VietQR tức thì.'}
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
                                <span>{t?.heroBtnBuyTicket || 'Đặt Vé Tham Quan'}</span>
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
                                <span>{t?.heroBtnMap || 'Bản Đồ Đi Lại'}</span>
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
                                <span>{t?.heroBtnAudio || 'Thuyết Minh Âm Thanh'}</span>
                            </button>
                        </div>

                        {/* Ticket Pass Active / Activation Prompt Banner */}
                        <div className="hero-ticket-prompt">
                            {hasActiveSession ? (
                                <div className="hero-active-session-pill">
                                    <div className="session-status-indicator">
                                        <span className="live-dot"></span>
                                        <span>{t?.heroActiveSession || 'Phiên tham quan đang hoạt động:'}</span>
                                        <strong className="session-code font-mono">{currentSession.ticketCode}</strong>
                                        <span className="session-user">• {currentSession.customerName || (isVi ? 'Khách tham quan' : 'Visitor')}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        className="btn-view-pass"
                                        onClick={() => openElectronicTicketModal()}
                                    >
                                        {t?.heroViewPass || 'Xem Thẻ Điện Tử'}
                                    </button>
                                </div>
                            ) : (
                                <div className="hero-inactive-prompt">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <span>{t?.heroHasPassPrompt || 'Quý khách đã có vé giấy hoặc mã QR vào cổng?'}</span>
                                    <button 
                                        type="button" 
                                        className="btn-link-activate"
                                        onClick={() => setIsTicketModalOpen(true)}
                                    >
                                        {t?.heroActivateNow || 'Kích hoạt vé ngay →'}
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
                            aria-label={isVi ? 'Ảnh động vật tiêu biểu Thảo Cầm Viên' : 'Featured Wildlife at Saigon Zoo'}
                        >
                            {/* Slide Counter / Indicators */}
                            <div className="hero-carousel-nav" role="tablist" aria-label={isVi ? 'Bộ điều khiển chọn slide' : 'Slide indicators'}>
                                {HERO_SLIDES.map((slide, idx) => (
                                    <button
                                        key={slide.id}
                                        type="button"
                                        role="tab"
                                        className={`carousel-dot ${idx === currentSlideIndex ? 'active' : ''}`}
                                        onClick={() => handleManualSelect(idx)}
                                        aria-selected={idx === currentSlideIndex}
                                        aria-label={`${isVi ? slide.speciesNameVi : slide.speciesNameEn} (${idx + 1}/${HERO_SLIDES.length})`}
                                    />
                                ))}
                            </div>

                            {/* Manual Prev / Next Arrow Controls */}
                            <button
                                type="button"
                                className="carousel-arrow prev"
                                onClick={handleManualPrev}
                                aria-label={isVi ? 'Xem loài động vật trước đó' : 'Previous featured species'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <button
                                type="button"
                                className="carousel-arrow next"
                                onClick={handleManualNext}
                                aria-label={isVi ? 'Xem loài động vật tiếp theo' : 'Next featured species'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>

                            {/* Render All Slides for Smooth Crossfade */}
                            {HERO_SLIDES.map((slide, idx) => {
                                const isActive = idx === currentSlideIndex;
                                const slideName = isVi ? slide.speciesNameVi : slide.speciesNameEn;
                                const slideStatus = isVi ? slide.statusLabelVi : slide.statusLabelEn;
                                const slideHabitat = isVi ? slide.habitatVi : slide.habitatEn;
                                const slideAlt = isVi ? slide.altVi : slide.altEn;
                                return (
                                    <div 
                                        key={slide.id}
                                        className={`hero-slide ${isActive ? 'active' : ''}`}
                                        aria-hidden={!isActive}
                                    >
                                        <img 
                                            src={slide.imageSrc} 
                                            alt={slideAlt}
                                            className="hero-slide-image hero-photography-img"
                                            loading={idx === 0 ? "eager" : "lazy"}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=1200&q=80';
                                            }}
                                        />
                                        <div className="hero-photography-overlay">
                                            <div className="photo-badge">{slideStatus} • {slide.statusLevel}</div>
                                            <h3 className="photo-species-title">{slideName} • {slide.scientificName}</h3>
                                            <p className="photo-species-subtitle">{slideHabitat} • {t?.slideAvailableAudio || 'Có sẵn bài thuyết minh âm thanh'}</p>
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
                            <span className="strip-label">{t?.openingHoursLabel || 'Giờ mở cửa hàng ngày'}</span>
                            <span className="strip-val">{operationalInfo.openingHours}</span>
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
                            <span className="strip-label">{t?.addressLabel || 'Địa chỉ sở thú'}</span>
                            <span className="strip-val">{operationalInfo.address}</span>
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
                            <span className="strip-label">{t?.ticketPriceLabel || 'Giá vé vào cổng'}</span>
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
                            <span className="strip-label">{t?.gatesLabel || 'Cổng đón khách'}</span>
                            <span className="strip-val">{operationalInfo.gates}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
