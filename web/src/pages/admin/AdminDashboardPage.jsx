import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { ZooApi, API_CONFIG } from '../../services/api';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [toastMsg, setToastMsg] = useState(null);

    // Thanh điều hướng phụ (6 phân khu)
    const [activeSectionTab, setActiveSectionTab] = useState('sec-overview');

    // Bộ lọc thời gian đồng nhất cho toàn Dashboard
    const [periodFilter, setPeriodFilter] = useState('all'); // today | last7days | last30days | thisMonth | custom | all
    const [customFromDate, setCustomFromDate] = useState('');
    const [customToDate, setCustomToDate] = useState('');
    const [dateFilterError, setDateFilterError] = useState('');

    // Trạng thái kết nối SignalR Realtime
    const [signalRConnected, setSignalRConnected] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const hubConnectionRef = useRef(null);

    // Bộ lọc & trạng thái tương tác tại các phân khu
    const [poiFilterMode, setPoiFilterMode] = useState('all'); // all | unready | missingLang | ready
    const [poiSearch, setPoiSearch] = useState('');
    const [issueFilterType, setIssueFilterType] = useState('all'); // all | POI | Animal | AudioError
    const [selectedLangForMissingModal, setSelectedLangForMissingModal] = useState(null);
    const [selectedPoiForDetailModal, setSelectedPoiForDetailModal] = useState(null);
    const [isVerifyingAudio, setIsVerifyingAudio] = useState(false);

    // Bộ lọc Nhật ký hoạt động & Cảnh báo (Task 9)
    const [logCategoryFilter, setLogCategoryFilter] = useState('all'); // all | AUDIO | GPS | LANGUAGE | ADMIN | CONTENT
    const [logResultFilter, setLogResultFilter] = useState('all'); // all | Success | Failed | Skipped
    const [logSearch, setLogSearch] = useState('');
    const [logPage, setLogPage] = useState(1);
    const LOGS_PER_PAGE = 10;

    const [alertSeverityFilter, setAlertSeverityFilter] = useState('all'); // all | Critical | Warning | Information
    const [alertStatusFilter, setAlertStatusFilter] = useState('all'); // all | Unresolved | InProgress | Resolved
    const [alertTypeFilter, setAlertTypeFilter] = useState('all');
    const [updatingAlertKey, setUpdatingAlertKey] = useState(null);

    const notify = useCallback((msg, type = 'success') => {
        setToastMsg({ msg, type });
        setTimeout(() => setToastMsg(null), 4000);
    }, []);

    // Tính khoảng thời gian từ bộ lọc
    const getFilterDates = useCallback((period, cFrom, cTo) => {
        const now = new Date();
        if (period === 'today') {
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            return { fromDate: start.toISOString(), toDate: end.toISOString() };
        }
        if (period === 'last7days') {
            const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return { fromDate: start.toISOString(), toDate: now.toISOString() };
        }
        if (period === 'last30days') {
            const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return { fromDate: start.toISOString(), toDate: now.toISOString() };
        }
        if (period === 'thisMonth') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            return { fromDate: start.toISOString(), toDate: now.toISOString() };
        }
        if (period === 'custom') {
            if (cFrom && cTo && new Date(cFrom) > new Date(cTo)) {
                return { error: 'Ngày bắt đầu không được lớn hơn ngày kết thúc.' };
            }
            return {
                fromDate: cFrom ? new Date(cFrom + 'T00:00:00').toISOString() : undefined,
                toDate: cTo ? new Date(cTo + 'T23:59:59').toISOString() : undefined
            };
        }
        return {};
    }, []);

    const fetchDashboardData = useCallback(async (period = periodFilter, cFrom = customFromDate, cTo = customToDate, silent = false) => {
        const filterParams = getFilterDates(period, cFrom, cTo);
        if (filterParams.error) {
            setDateFilterError(filterParams.error);
            return;
        }
        setDateFilterError('');
        if (!silent) {
            setIsLoading(true);
            setLoadError(null);
        }

        try {
            const statsRes = await ZooApi.getDashboardStats(filterParams);
            if (statsRes.success && statsRes.data) {
                setStats(statsRes.data);
                setLastSyncTime(new Date());
            } else {
                if (!silent) setLoadError(statsRes.message || 'Không thể tải dữ liệu giám sát thuyết minh từ máy chủ.');
            }
        } catch (err) {
            if (!silent) setLoadError('Lỗi kết nối tới Backend API: ' + (err.message || 'Unknown error'));
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [periodFilter, customFromDate, customToDate, getFilterDates]);

    useEffect(() => {
        if (periodFilter !== 'custom') {
            fetchDashboardData(periodFilter, customFromDate, customToDate);
        }
    }, [periodFilter]);

    // Kết nối SignalR Realtime Hub
    useEffect(() => {
        let isMounted = true;
        const hubUrl = `${API_CONFIG.BASE_URL}/hubs/online?role=Admin&userId=admin_dashboard_${Date.now()}`;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl)
            .withAutomaticReconnect([0, 2000, 5000, 10000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        const handleRealtimeRefresh = () => {
            if (!isMounted) return;
            fetchDashboardData(periodFilter, customFromDate, customToDate, true);
        };

        connection.on('ActiveBuyersUpdated', handleRealtimeRefresh);
        connection.on('ActiveDevicesUpdated', handleRealtimeRefresh);
        connection.on('DashboardTelemetryUpdated', () => {
            if (!isMounted) return;
            fetchDashboardData(periodFilter, customFromDate, customToDate, true);
        });

        connection.onreconnected(() => {
            if (isMounted) {
                setSignalRConnected(true);
                handleRealtimeRefresh();
            }
        });

        connection.onclose(() => {
            if (isMounted) setSignalRConnected(false);
        });

        connection.start()
            .then(() => {
                if (isMounted) setSignalRConnected(true);
            })
            .catch(() => {
                if (isMounted) setSignalRConnected(false);
            });

        hubConnectionRef.current = connection;

        const pollTimer = setInterval(() => {
            if (isMounted) {
                fetchDashboardData(periodFilter, customFromDate, customToDate, true);
            }
        }, 20000);

        return () => {
            isMounted = false;
            clearInterval(pollTimer);
            if (hubConnectionRef.current) {
                hubConnectionRef.current.stop().catch(() => {});
            }
        };
    }, [periodFilter, customFromDate, customToDate, fetchDashboardData]);

    const handleApplyCustomFilter = (e) => {
        e.preventDefault();
        fetchDashboardData('custom', customFromDate, customToDate);
    };

    const handleVerifyAudioFiles = async () => {
        setIsVerifyingAudio(true);
        try {
            const res = await ZooApi.verifyDashboardAudioStorage(true);
            if (res.success && res.data) {
                notify(`Đã kiểm tra ${res.data.totalChecked} bản ghi âm thanh: ${res.data.stage4FilePlayableCount}/${res.data.totalChecked} file hợp lệ.`, 'success');
                await fetchDashboardData(periodFilter, customFromDate, customToDate, true);
            } else {
                notify('Không thể thực hiện kiểm tra file âm thanh: ' + (res.error || ''), 'error');
            }
        } catch (err) {
            notify('Lỗi khi kiểm tra Storage: ' + err.message, 'error');
        } finally {
            setIsVerifyingAudio(false);
        }
    };

    const handleUpdateAlertStatus = async (alertKey, newStatus) => {
        setUpdatingAlertKey(alertKey);
        try {
            const res = await ZooApi.updateDashboardAlertStatus(alertKey, newStatus);
            if (res.success) {
                const label = newStatus === 'Resolved' ? 'Đã khắc phục' : (newStatus === 'InProgress' ? 'Đang xử lý' : 'Chưa xử lý');
                notify(`Đã cập nhật trạng thái cảnh báo sang "${label}".`, 'success');
                await fetchDashboardData(periodFilter, customFromDate, customToDate, true);
            } else {
                notify('Không thể cập nhật trạng thái cảnh báo.', 'error');
            }
        } finally {
            setUpdatingAlertKey(null);
        }
    };

    const handleSelectSection = (secId) => {
        setActiveSectionTab(secId);
        const el = document.getElementById(secId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Dữ liệu phân khu đã trích xuất an toàn
    const kpis = stats?.overviewKpis || {};
    const poiMon = stats?.poiMonitoring || {};
    const contentMon = stats?.contentAudioMonitoring || {};
    const languageStats = stats?.languageStats || [];
    const narrActivity = stats?.narrationActivity || {};
    const gpsTrigger = stats?.gpsAutoTrigger || {};
    const langUsage = stats?.languageUsage || {};
    const poiRanking = stats?.poiRanking || [];
    const svcMon = stats?.serviceMonitoring || {};
    const activityLogs = stats?.activityLogs || [];
    const systemAlerts = stats?.systemAlerts || [];

    // Lọc danh sách POI (Task 3)
    const filteredPoiItems = useMemo(() => {
        const list = poiMon.poiItems || [];
        return list.filter(item => {
            if (poiFilterMode === 'unready' && item.isReadyForAutoTrigger) return false;
            if (poiFilterMode === 'missingLang' && item.isFullyMultilingual) return false;
            if (poiFilterMode === 'ready' && !item.isReadyForAutoTrigger) return false;
            if (poiSearch.trim()) {
                const q = poiSearch.trim().toLowerCase();
                return (
                    (item.name || '').toLowerCase().includes(q) ||
                    (item.code || '').toLowerCase().includes(q) ||
                    (item.category || '').toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [poiMon.poiItems, poiFilterMode, poiSearch]);

    // Lọc danh sách vấn đề nội dung & âm thanh (Task 4)
    const filteredContentIssues = useMemo(() => {
        const list = contentMon.contentIssues || [];
        return list.filter(issue => {
            if (issueFilterType === 'POI' && issue.entityType !== 'POI') return false;
            if (issueFilterType === 'Animal' && issue.entityType !== 'Animal') return false;
            if (issueFilterType === 'AudioError' && issue.issueType === 'MissingTranslation') return false;
            return true;
        });
    }, [contentMon.contentIssues, issueFilterType]);

    // Lọc & phân trang Nhật ký hoạt động (Task 9B)
    const filteredLogs = useMemo(() => {
        return activityLogs.filter(log => {
            if (logCategoryFilter !== 'all' && log.category !== logCategoryFilter) return false;
            if (logResultFilter !== 'all' && log.resultStatus !== logResultFilter) return false;
            if (logSearch.trim()) {
                const q = logSearch.trim().toLowerCase();
                return (
                    (log.eventLabel || '').toLowerCase().includes(q) ||
                    (log.targetName || '').toLowerCase().includes(q) ||
                    (log.details || '').toLowerCase().includes(q) ||
                    (log.actorOrSession || '').toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [activityLogs, logCategoryFilter, logResultFilter, logSearch]);

    const totalLogPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE));
    const pagedLogs = filteredLogs.slice((logPage - 1) * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE);

    // Lọc Cảnh báo hệ thống (Task 9C)
    const filteredAlerts = useMemo(() => {
        return systemAlerts.filter(a => {
            if (alertSeverityFilter !== 'all' && a.severity !== alertSeverityFilter) return false;
            if (alertStatusFilter !== 'all' && a.status !== alertStatusFilter) return false;
            if (alertTypeFilter !== 'all' && a.alertType !== alertTypeFilter) return false;
            return true;
        });
    }, [systemAlerts, alertSeverityFilter, alertStatusFilter, alertTypeFilter]);

    const periodLabel = useMemo(() => {
        switch (periodFilter) {
            case 'today': return 'Hôm nay';
            case 'last7days': return '7 ngày';
            case 'last30days': return '30 ngày';
            case 'thisMonth': return 'Tháng này';
            case 'custom': return `Tùy chỉnh (${customFromDate || '...'} → ${customToDate || '...'})`;
            default: return 'Toàn bộ';
        }
    }, [periodFilter, customFromDate, customToDate]);

    const renderSeverityIndicator = (severity) => {
        if (severity === 'Critical') {
            return (
                <span className="saas-status-dot-badge" style={{ color: '#B91C1C' }}>
                    <span className="saas-dot danger" />
                    Nghiêm trọng
                </span>
            );
        }
        if (severity === 'Warning') {
            return (
                <span className="saas-status-dot-badge" style={{ color: '#B45309' }}>
                    <span className="saas-dot warning" />
                    Cảnh báo
                </span>
            );
        }
        return (
            <span className="saas-status-dot-badge" style={{ color: '#64748B' }}>
                <span className="saas-dot neutral" />
                Thông tin
            </span>
        );
    };

    const renderServiceStatus = (status) => {
        const isHealthy = status === 'Healthy';
        const isDegraded = status === 'Degraded';
        return (
            <span className="saas-status-dot-badge" style={{ color: isHealthy ? '#15803D' : (isDegraded ? '#B45309' : '#DC2626') }}>
                <span className={`saas-dot ${isHealthy ? 'success' : (isDegraded ? 'warning' : 'danger')}`} />
                {isHealthy ? 'Hoạt động' : (isDegraded ? 'Giảm hiệu năng' : 'Ngừng hoạt động')}
            </span>
        );
    };

    const sectionTabs = [
        { id: 'sec-overview', label: 'A. Tổng quan vận hành' },
        { id: 'sec-activity', label: 'B. Hoạt động thuyết minh & Ngôn ngữ' },
        { id: 'sec-gps', label: 'C. Kích hoạt tự động GPS' },
        { id: 'sec-content-poi', label: 'D. Tình trạng POI, Nội dung & Audio' },
        { id: 'sec-services', label: 'E. Giám sát dịch vụ' },
        { id: 'sec-logs-alerts', label: 'F. Nhật ký & Cảnh báo' }
    ];

    const timeFilterOptions = [
        { id: 'today', label: 'Hôm nay' },
        { id: 'last7days', label: '7 ngày' },
        { id: 'last30days', label: '30 ngày' },
        { id: 'thisMonth', label: 'Tháng này' },
        { id: 'all', label: 'Toàn bộ' },
        { id: 'custom', label: 'Tùy chỉnh' }
    ];

    return (
        <div className="saas-dashboard">
            {toastMsg && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    background: toastMsg.type === 'error' ? '#991B1B' : '#0F172A',
                    color: '#FFFFFF',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                    fontSize: '0.825rem',
                    fontWeight: 500
                }}>
                    {toastMsg.msg}
                </div>
            )}

            {/* TIÊU ĐỀ TRANG & HÀNH ĐỘNG CHÍNH */}
            <div className="saas-page-header">
                <div>
                    <h1 className="saas-page-title">Tổng quan vận hành thuyết minh</h1>
                    <p className="saas-page-subtitle">
                        Giám sát hoạt động thuyết minh tự động đa ngôn ngữ, tín hiệu GPS, lưu trữ âm thanh và trạng thái dịch vụ.
                    </p>
                </div>

                <div className="saas-header-actions">
                    <span className="saas-sync-meta">
                        <span className={`saas-dot ${signalRConnected ? 'success' : 'neutral'}`} />
                        <span>{signalRConnected ? 'SignalR trực tuyến' : 'Đồng bộ định kỳ'}</span>
                        {lastSyncTime && (
                            <span>• {lastSyncTime.toLocaleTimeString('vi-VN')}</span>
                        )}
                    </span>
                    <button
                        type="button"
                        className="saas-btn"
                        onClick={handleVerifyAudioFiles}
                        disabled={isVerifyingAudio}
                    >
                        {isVerifyingAudio ? 'Đang kiểm tra...' : 'Kiểm tra Audio'}
                    </button>
                    <button
                        type="button"
                        className="saas-btn"
                        onClick={() => fetchDashboardData(periodFilter, customFromDate, customToDate)}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>
            </div>

            {/* KHU VỰC ĐIỀU KHIỂN DASHBOARD: SUB-NAV TABS & SEGMENTED TIME FILTER */}
            <div className="saas-control-bar">
                <div className="saas-nav-tabs" role="tablist" aria-label="Điều hướng phân khu Dashboard">
                    {sectionTabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeSectionTab === tab.id}
                            className={`saas-nav-tab ${activeSectionTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleSelectSection(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="saas-segmented-group" role="group" aria-label="Bộ lọc thời gian">
                    {timeFilterOptions.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            className={`saas-segmented-btn ${periodFilter === item.id ? 'active' : ''}`}
                            onClick={() => setPeriodFilter(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {periodFilter === 'custom' && (
                    <form
                        onSubmit={handleApplyCustomFilter}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flexWrap: 'wrap',
                            paddingTop: '10px',
                            borderTop: '1px solid #F1F5F9'
                        }}
                    >
                        <label style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
                            Từ ngày:{' '}
                            <input
                                type="date"
                                value={customFromDate}
                                onChange={(e) => setCustomFromDate(e.target.value)}
                                style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', color: '#0F172A', marginLeft: '4px' }}
                            />
                        </label>
                        <label style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
                            Đến ngày:{' '}
                            <input
                                type="date"
                                value={customToDate}
                                onChange={(e) => setCustomToDate(e.target.value)}
                                style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', color: '#0F172A', marginLeft: '4px' }}
                            />
                        </label>
                        <button type="submit" className="saas-btn saas-btn-primary">Áp dụng</button>
                    </form>
                )}

                {dateFilterError && (
                    <div style={{ width: '100%', color: '#DC2626', fontSize: '0.8rem', fontWeight: 500 }}>
                        {dateFilterError}
                    </div>
                )}
            </div>

            {/* TRẠNG THÁI ERROR HOẶC LOADING */}
            {loadError && (
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #FECACA',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    color: '#991B1B',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div>
                        <strong style={{ display: 'block', fontSize: '0.875rem', marginBottom: '2px' }}>Không thể tải dữ liệu Dashboard</strong>
                        <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>{loadError}</span>
                    </div>
                    <button
                        type="button"
                        className="saas-btn"
                        onClick={() => fetchDashboardData(periodFilter, customFromDate, customToDate)}
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {isLoading && !stats ? (
                <div className="saas-section" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748B' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                        Đang tải dữ liệu vận hành...
                    </div>
                    <div style={{ fontSize: '0.825rem' }}>
                        Đang đồng bộ số liệu từ PostgreSQL, Supabase Storage và SignalR Hub.
                    </div>
                </div>
            ) : (
                <>
                    {/* ================================================================
                        A. TỔNG QUAN VẬN HÀNH — 8 THẺ THỐNG KÊ ĐỒNG NHẤT
                       ================================================================ */}
                    <div id="sec-overview">
                        <div className="saas-kpi-grid">
                            {/* 1. Khách đang dùng thuyết minh */}
                            <div className="saas-kpi-card">
                                <div>
                                    <div className="saas-kpi-top">
                                        <span className="saas-kpi-title">Khách đang dùng thuyết minh</span>
                                    </div>
                                    <div className="saas-kpi-value-row">
                                        <span className="saas-kpi-value">{kpis.activeNarrationUsersCount ?? 0}</span>
                                        <span className="saas-kpi-unit">khách</span>
                                    </div>
                                </div>
                                <div className="saas-kpi-meta">
                                    Tương tác 15p: <strong>{kpis.activeTelemetryUsers15Min ?? 0}</strong> • Thiết bị: <strong>{kpis.activeDevices5Min ?? 0}</strong> • Phiên vé: <strong>{kpis.activeTicketSessionsCount ?? 0}</strong>
                                </div>
                            </div>

                            {/* 2. Tổng lượt phát âm thanh */}
                            <div className="saas-kpi-card">
                                <div>
                                    <div className="saas-kpi-top">
                                        <span className="saas-kpi-title">Tổng lượt phát âm thanh</span>
                                    </div>
                                    <div className="saas-kpi-value-row">
                                        <span className="saas-kpi-value">{kpis.totalAudioPlayRequests ?? 0}</span>
                                        <span className="saas-kpi-unit">lượt</span>
                                    </div>
                                </div>
                                <div className="saas-kpi-meta">
                                    {(kpis.totalAudioPlayRequests ?? 0) === 0 ? (
                                        <span>Chưa phát sinh yêu cầu phát trong kỳ ({periodLabel})</span>
                                    ) : (
                                        <span>
                                            Bắt đầu: <strong>{kpis.totalAudioPlayStarted ?? 0}</strong> • Hoàn tất: <strong>{kpis.totalAudioPlayCompleted ?? 0}</strong> • Dừng sớm: <strong>{kpis.totalAudioPlayStoppedEarly ?? 0}</strong>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 3. Ngôn ngữ thuyết minh khả dụng */}
                            <div className="saas-kpi-card">
                                <div>
                                    <div className="saas-kpi-top">
                                        <span className="saas-kpi-title">Ngôn ngữ thuyết minh khả dụng</span>
                                    </div>
                                    <div className="saas-kpi-value-row">
                                        <span className="saas-kpi-value">{kpis.availableLanguagesCount ?? 0} / {kpis.totalSupportedLanguagesCount ?? 12}</span>
                                        <span className="saas-kpi-unit">ngôn ngữ</span>
                                    </div>
                                </div>
                                <div className="saas-kpi-meta">
                                    Động vật: <strong>{kpis.availableLanguagesCount ?? 0}/12</strong> • POI: <strong>{kpis.languagesWithPoiNarrationCount ?? 0}/12</strong> (VI, EN)
                                </div>
                            </div>

                            {/* 4. POI đủ điều kiện kích hoạt */}
                            <div className="saas-kpi-card">
                                <div>
                                    <div className="saas-kpi-top">
                                        <span className="saas-kpi-title">POI đủ điều kiện kích hoạt</span>
                                        <Link to="/admin/pois" className="saas-kpi-link">Quản lý →</Link>
                                    </div>
                                    <div className="saas-kpi-value-row">
                                        <span className="saas-kpi-value">{kpis.readyPoisCount ?? 0} / {kpis.totalPoisCount ?? 0}</span>
                                        <span className="saas-kpi-unit">POI</span>
                                    </div>
                                </div>
                                <div className="saas-kpi-meta">
                                    Sẵn sàng VI/EN: <strong>{kpis.readyPoisCount ?? 0}/{kpis.totalPoisCount ?? 0}</strong> • Đủ 12 ngôn ngữ: <strong>{kpis.fullyMultilingualPoisCount ?? 0}/{kpis.totalPoisCount ?? 0}</strong>
                                </div>
                            </div>

                            {/* 5. Tỷ lệ phát âm thanh thành công */}
                            <div className="saas-kpi-card">
                                <div>
                                    <div className="saas-kpi-top">
                                        <span className="saas-kpi-title">Tỷ lệ phát âm thanh thành công</span>
                                    </div>
                                    {kpis.hasPlayRateData && kpis.audioPlaySuccessRatePercent != null ? (
                                        <div className="saas-kpi-value-row">
                                            <span className="saas-kpi-value">{kpis.audioPlaySuccessRatePercent.toFixed(1)}</span>
                                            <span className="saas-kpi-unit">%</span>
                                        </div>
                                    ) : (
                                        <div className="saas-kpi-empty">Chưa đủ dữ liệu thống kê</div>
                                    )}
                                </div>
                                <div className="saas-kpi-meta">
                                    {kpis.hasPlayRateData ? (
                                        <span>Thành công: <strong>{kpis.successfulPlayOutcomesCount}</strong> / <strong>{kpis.validPlayOutcomesCount}</strong> lượt có kết quả</span>
                                    ) : (
                                        <span>Chưa có lượt phát kết thúc trong kỳ ({periodLabel})</span>
                                    )}
                                </div>
                            </div>

                            {/* 6. Số lượt phát âm thanh thất bại */}
                            <div className="saas-kpi-card">
                                <div>
                                    <div className="saas-kpi-top">
                                        <span className="saas-kpi-title">Số lượt phát âm thanh thất bại</span>
                                    </div>
                                    <div className="saas-kpi-value-row">
                                        <span
                                            className="saas-kpi-value"
                                            style={{ color: (kpis.failedAudioPlaysCount ?? 0) > 0 ? '#DC2626' : '#0F172A' }}
                                        >
                                            {kpis.failedAudioPlaysCount ?? 0}
                                        </span>
                                        <span className="saas-kpi-unit">lỗi</span>
                                    </div>
                                </div>
                                <div className="saas-kpi-meta">
                                    Tải file: <strong>{kpis.fileLoadErrorCount ?? 0}</strong> • API: <strong>{kpis.apiErrorCount ?? 0}</strong> • Giải mã: <strong>{kpis.playbackErrorCount ?? 0}</strong>
                                </div>
                            </div>

                            {/* 7. Bài thuyết minh đã xuất bản */}
                            <div className="saas-kpi-card">
                                <div>
                                    <div className="saas-kpi-top">
                                        <span className="saas-kpi-title">Bài thuyết minh đã xuất bản</span>
                                        <Link to="/admin/narration" className="saas-kpi-link">Kho bài →</Link>
                                    </div>
                                    <div className="saas-kpi-value-row">
                                        <span className="saas-kpi-value">{kpis.publishedNarrationsCount ?? 0}</span>
                                        <span className="saas-kpi-unit">/ {kpis.expectedTotalNarrationsCount ?? 432} bài</span>
                                    </div>
                                </div>
                                <div className="saas-kpi-meta">
                                    Động vật: <strong>{kpis.publishedAnimalNarrationsCount ?? 0}</strong> • POI: <strong>{kpis.publishedPoiNarrationsCount ?? 0}</strong> • Nháp: <strong>{kpis.unpublishedNarrationsCount ?? 0}</strong>
                                </div>
                            </div>

                            {/* 8. Tỷ lệ phiên có GPS khả dụng */}
                            <div className="saas-kpi-card">
                                <div>
                                    <div className="saas-kpi-top">
                                        <span className="saas-kpi-title">Tỷ lệ phiên có GPS khả dụng</span>
                                        <Link to="/admin/ticket-sessions" className="saas-kpi-link">Phiên →</Link>
                                    </div>
                                    {kpis.hasGpsSessionData && kpis.gpsAvailableSessionRatePercent != null ? (
                                        <div className="saas-kpi-value-row">
                                            <span className="saas-kpi-value">{kpis.gpsAvailableSessionRatePercent.toFixed(1)}</span>
                                            <span className="saas-kpi-unit">%</span>
                                        </div>
                                    ) : (
                                        <div className="saas-kpi-empty">Chưa có dữ liệu phiên</div>
                                    )}
                                </div>
                                <div className="saas-kpi-meta">
                                    Hợp lệ: <strong>{kpis.sessionsWithValidGpsCount ?? 0}/{kpis.totalEvaluatedSessionsCount ?? 0}</strong> phiên • Lỗi GPS: <strong>{kpis.gpsUnavailableEventsCount ?? 0}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ================================================================
                        B. HOẠT ĐỘNG THUYẾT MINH & NGÔN NGỮ / POI
                       ================================================================ */}
                    <section id="sec-activity" className="saas-section">
                        <div className="saas-section-header">
                            <div>
                                <h2 className="saas-section-title">B. Hoạt động thuyết minh & Ngôn ngữ</h2>
                                <p className="saas-section-desc">
                                    Thống kê vòng đời phát âm thanh, ngôn ngữ khách tham quan chọn thực tế và mức độ sử dụng tại các điểm POI ({periodLabel}).
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748B' }}>
                                <span>Cao điểm: <strong style={{ color: '#0F172A' }}>{narrActivity.peakUsagePeriod || 'Chưa có dữ liệu'}</strong></span>
                                <span>Nghe trung bình: <strong style={{ color: '#0F172A' }}>{narrActivity.averageListenDurationSeconds > 0 ? `${narrActivity.averageListenDurationSeconds}s` : 'Chưa có dữ liệu'}</strong></span>
                            </div>
                        </div>

                        {/* 5 chỉ số vòng đời phát âm thanh đồng nhất */}
                        <div className="saas-stat-strip">
                            {[
                                { label: 'Yêu cầu phát', val: narrActivity.totalPlayRequests ?? 0 },
                                { label: 'Bắt đầu phát', val: narrActivity.totalPlayStarted ?? 0 },
                                { label: 'Phát hoàn tất', val: narrActivity.totalPlayCompleted ?? 0 },
                                { label: 'Khách dừng sớm', val: narrActivity.totalPlayStoppedEarly ?? 0 },
                                { label: 'Phát thất bại', val: narrActivity.totalPlayFailed ?? 0, isError: (narrActivity.totalPlayFailed ?? 0) > 0 }
                            ].map((st, idx) => (
                                <div key={idx} className="saas-stat-box">
                                    <span className="saas-stat-label">{st.label}</span>
                                    <div>
                                        <span className="saas-stat-num" style={{ color: st.isError ? '#DC2626' : '#0F172A' }}>{st.val}</span>{' '}
                                        <span className="saas-stat-sub">lượt</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Biểu đồ chuỗi thời gian tối giản */}
                        <div style={{
                            background: '#F8FAFC',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            padding: '16px 18px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                                        Lượt yêu cầu và kết quả phát âm thanh theo thời gian
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                        Đơn vị: Lượt sự kiện ({periodLabel})
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#475569' }} /> Yêu cầu phát
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#15803D' }} /> Phát thành công
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#DC2626' }} /> Lỗi phát
                                    </span>
                                </div>
                            </div>

                            {(() => {
                                const series = narrActivity.timeSeries || [];
                                const maxVal = Math.max(5, ...series.map(s => Math.max(s.playRequests || 0, (s.playCompleted || 0) + (s.playStoppedEarly || 0), s.playFailed || 0)));
                                return (
                                    <div style={{ width: '100%', overflowX: 'auto' }}>
                                        <svg viewBox={`0 0 ${Math.max(680, series.length * 76)} 195`} style={{ width: '100%', minWidth: '560px', height: '195px', display: 'block' }}>
                                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                                                const y = 155 - ratio * 125;
                                                const labelVal = Math.round(maxVal * ratio);
                                                return (
                                                    <g key={i}>
                                                        <line x1="38" y1={y} x2="98%" y2={y} stroke="#E2E8F0" strokeDasharray="3,3" />
                                                        <text x="32" y={y + 4} textAnchor="end" fontSize="10" fill="#64748B">{labelVal}</text>
                                                    </g>
                                                );
                                            })}
                                            {series.map((slot, idx) => {
                                                const groupX = 52 + idx * 68;
                                                const reqH = Math.round(((slot.playRequests || 0) / maxVal) * 125);
                                                const succCount = (slot.playCompleted || 0) + (slot.playStoppedEarly || 0);
                                                const succH = Math.round((succCount / maxVal) * 125);
                                                const failH = Math.round(((slot.playFailed || 0) / maxVal) * 125);
                                                return (
                                                    <g key={idx}>
                                                        <rect x={groupX} y={155 - reqH} width="13" height={Math.max(2, reqH)} rx="2" fill="#475569" />
                                                        <rect x={groupX + 15} y={155 - succH} width="13" height={Math.max(2, succH)} rx="2" fill="#15803D" />
                                                        <rect x={groupX + 30} y={155 - failH} width="13" height={Math.max(2, failH)} rx="2" fill="#DC2626" />
                                                        {(slot.playRequests > 0 || succCount > 0 || slot.playFailed > 0) && (
                                                            <text x={groupX + 21} y={Math.min(150, 150 - Math.max(reqH, succH, failH))} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#0F172A">
                                                                {slot.playRequests}/{succCount}/{slot.playFailed}
                                                            </text>
                                                        )}
                                                        <text x={groupX + 21} y="176" textAnchor="middle" fontSize="10" fontWeight="500" fill="#64748B">
                                                            {slot.label}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Hai cột: Ngôn ngữ khách dùng & Xếp hạng POI */}
                        <div className="saas-two-col">
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>
                                            Ngôn ngữ khách tham quan sử dụng
                                        </h3>
                                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                            Thống kê theo lựa chọn và lượt phát thực tế của khách
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                                        Nhiều nhất: <strong style={{ color: '#0F172A' }}>{langUsage.mostUsedLanguageName || 'Chưa có'}</strong>
                                    </span>
                                </div>

                                {!langUsage.hasUsageData ? (
                                    <div style={{ padding: '24px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#64748B', fontSize: '0.8125rem' }}>
                                        Chưa có dữ liệu lựa chọn ngôn ngữ của khách tham quan trong kỳ này ({periodLabel}).
                                    </div>
                                ) : (
                                    <div className="saas-table-wrap">
                                        <table className="saas-table">
                                            <thead>
                                                <tr>
                                                    <th>Ngôn ngữ</th>
                                                    <th style={{ textAlign: 'right' }}>Lượt chọn</th>
                                                    <th style={{ textAlign: 'right' }}>Lượt nghe</th>
                                                    <th style={{ textAlign: 'right' }}>Tổng</th>
                                                    <th style={{ width: '125px' }}>Tỷ trọng</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(langUsage.items || []).filter(i => i.totalUsageCount > 0).map(item => (
                                                    <tr key={item.languageCode}>
                                                        <td style={{ fontWeight: 500 }}>
                                                            {item.flagIcon} {item.languageName} <span style={{ color: '#64748B', fontSize: '0.74rem' }}>({item.languageCode.toUpperCase()})</span>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>{item.selectionEventsCount}</td>
                                                        <td style={{ textAlign: 'right' }}>{item.audioPlayRequestsCount + item.historicalVisitsCount}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.totalUsageCount}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${Math.min(100, item.sharePercent)}%`, height: '100%', background: '#15803D' }} />
                                                                </div>
                                                                <span style={{ fontWeight: 600, fontSize: '0.76rem', minWidth: '36px', textAlign: 'right' }}>{item.sharePercent}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>
                                            Xếp hạng điểm POI theo mức độ tương tác
                                        </h3>
                                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                            Xếp hạng theo số lượt kích hoạt GPS và yêu cầu phát thuyết minh
                                        </div>
                                    </div>
                                    <Link to="/admin/pois" className="saas-kpi-link">Tất cả POI →</Link>
                                </div>

                                <div className="saas-table-wrap" style={{ maxHeight: '290px', overflowY: 'auto' }}>
                                    <table className="saas-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Điểm POI</th>
                                                <th style={{ textAlign: 'right' }}>GPS</th>
                                                <th style={{ textAlign: 'right' }}>Yêu cầu</th>
                                                <th style={{ textAlign: 'right' }}>Thành công</th>
                                                <th style={{ textAlign: 'right' }}>Tỷ lệ</th>
                                                <th style={{ textAlign: 'center' }}>Chi tiết</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {poiRanking.slice(0, 8).map(poi => (
                                                <tr key={poi.poiId}>
                                                    <td style={{ color: '#64748B', fontWeight: 600 }}>#{poi.rank}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 500, color: '#0F172A' }}>{poi.name}</div>
                                                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{poi.code}</div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>{poi.gpsTriggersCount}</td>
                                                    <td style={{ textAlign: 'right' }}>{poi.playRequestsCount}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{poi.playSuccessCount}</td>
                                                    <td style={{ textAlign: 'right', color: '#64748B' }}>
                                                        {poi.successRatePercent != null ? `${poi.successRatePercent}%` : '-'}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            className="saas-btn"
                                                            style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                                                            onClick={() => setSelectedPoiForDetailModal(poi)}
                                                        >
                                                            Xem
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ================================================================
                        C. KÍCH HOẠT TỰ ĐỘNG GPS
                       ================================================================ */}
                    <section id="sec-gps" className="saas-section">
                        <div className="saas-section-header">
                            <div>
                                <h2 className="saas-section-title">C. Hiệu quả kích hoạt tự động bằng GPS</h2>
                                <p className="saas-section-desc">
                                    Phễu chuyển đổi 4 bước: Phát hiện vào vùng POI → Đủ điều kiện → Gửi lệnh kích hoạt → Phát thành công.
                                </p>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                {gpsTrigger.hasGpsTriggerData
                                    ? <>Chuyển đổi toàn phễu: <strong style={{ color: '#0F172A' }}>{gpsTrigger.overallConversionRatePercent ?? 0}%</strong></>
                                    : 'Chưa có sự kiện kích hoạt GPS trong kỳ'}
                            </span>
                        </div>

                        {/* Phễu 4 bước đồng nhất */}
                        <div className="saas-stat-strip" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                            {[
                                {
                                    step: '1. Phát hiện vào vùng POI',
                                    val: gpsTrigger.proximityDetectedCount ?? 0,
                                    sub: 'Khoảng cách trong bán kính POI'
                                },
                                {
                                    step: '2. Đủ điều kiện kích hoạt',
                                    val: gpsTrigger.eligibleForTriggerCount ?? 0,
                                    sub: gpsTrigger.proximityToEligibleRatePercent != null ? `Tỷ lệ đủ điều kiện: ${gpsTrigger.proximityToEligibleRatePercent}%` : 'Có phiên vé & ngoài Cooldown'
                                },
                                {
                                    step: '3. Đã gửi lệnh kích hoạt',
                                    val: gpsTrigger.triggeredCount ?? 0,
                                    sub: gpsTrigger.eligibleToTriggeredRatePercent != null ? `Tỷ lệ kích hoạt: ${gpsTrigger.eligibleToTriggeredRatePercent}%` : 'Kích hoạt trình phát tự động'
                                },
                                {
                                    step: '4. Phát âm thanh thành công',
                                    val: gpsTrigger.playSuccessAfterTriggerCount ?? 0,
                                    sub: gpsTrigger.triggeredToSuccessRatePercent != null ? `Tỷ lệ phát thành công: ${gpsTrigger.triggeredToSuccessRatePercent}%` : 'Khách nghe thành công'
                                }
                            ].map((f, i) => (
                                <div key={i} className="saas-stat-box">
                                    <span className="saas-stat-label">{f.step}</span>
                                    <div>
                                        <span className="saas-stat-num">{f.val}</span>{' '}
                                        <span className="saas-stat-sub">lần</span>
                                    </div>
                                    <span className="saas-stat-sub">{f.sub}</span>
                                </div>
                            ))}
                        </div>

                        {/* 4 chỉ số kiểm soát chống lặp & ngoại lệ GPS */}
                        <div className="saas-stat-strip" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            <div className="saas-stat-box">
                                <span className="saas-stat-label">Bỏ qua do Cooldown</span>
                                <span className="saas-stat-num" style={{ fontSize: '1.15rem' }}>{gpsTrigger.skippedCooldownCount ?? 0} <span className="saas-stat-sub">lần</span></span>
                            </div>
                            <div className="saas-stat-box">
                                <span className="saas-stat-label">Chặn kích hoạt trùng lặp</span>
                                <span className="saas-stat-num" style={{ fontSize: '1.15rem' }}>{gpsTrigger.duplicatePreventedCount ?? 0} <span className="saas-stat-sub">lần</span></span>
                            </div>
                            <div className="saas-stat-box">
                                <span className="saas-stat-label">GPS không khả dụng / Từ chối</span>
                                <span className="saas-stat-num" style={{ fontSize: '1.15rem', color: (gpsTrigger.gpsUnavailableCount ?? 0) > 0 ? '#B45309' : '#0F172A' }}>
                                    {gpsTrigger.gpsUnavailableCount ?? 0} <span className="saas-stat-sub">lần</span>
                                </span>
                            </div>
                            <div className="saas-stat-box">
                                <span className="saas-stat-label">Kích hoạt GPS thất bại</span>
                                <span className="saas-stat-num" style={{ fontSize: '1.15rem', color: (gpsTrigger.triggerFailedCount ?? 0) > 0 ? '#DC2626' : '#0F172A' }}>
                                    {gpsTrigger.triggerFailedCount ?? 0} <span className="saas-stat-sub">lần</span>
                                </span>
                            </div>
                        </div>

                        <div className="saas-table-wrap">
                            <table className="saas-table">
                                <thead>
                                    <tr>
                                        <th>Mã POI</th>
                                        <th>Tên điểm thuyết minh</th>
                                        <th style={{ textAlign: 'right' }}>Bán kính</th>
                                        <th style={{ textAlign: 'right' }}>Vào vùng</th>
                                        <th style={{ textAlign: 'right' }}>Đủ điều kiện</th>
                                        <th style={{ textAlign: 'right' }}>Đã kích hoạt</th>
                                        <th style={{ textAlign: 'right' }}>Phát thành công</th>
                                        <th style={{ textAlign: 'right' }}>Cooldown</th>
                                        <th style={{ textAlign: 'right' }}>Chuyển đổi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(gpsTrigger.poiTriggerStats || []).slice(0, 10).map(row => (
                                        <tr key={row.poiId}>
                                            <td style={{ fontWeight: 600, color: '#64748B' }}>{row.code}</td>
                                            <td style={{ fontWeight: 500 }}>{row.name}</td>
                                            <td style={{ textAlign: 'right', color: '#64748B' }}>{row.radiusMeters}m</td>
                                            <td style={{ textAlign: 'right' }}>{row.proximityCount}</td>
                                            <td style={{ textAlign: 'right' }}>{row.eligibleCount}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.triggeredCount}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.successCount}</td>
                                            <td style={{ textAlign: 'right', color: '#64748B' }}>{row.skippedCooldownCount}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {row.conversionRatePercent != null ? `${row.conversionRatePercent}%` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ================================================================
                        D. TÌNH TRẠNG POI, NỘI DUNG & AUDIO
                       ================================================================ */}
                    <section id="sec-content-poi" className="saas-section">
                        <div className="saas-section-header">
                            <div>
                                <h2 className="saas-section-title">D. Tình trạng POI, Nội dung & Audio</h2>
                                <p className="saas-section-desc">
                                    Kiểm tra tọa độ thực địa, bán kính kích hoạt, độ phủ 12 ngôn ngữ và kiểm định 4 tầng file âm thanh trên Supabase Storage.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <Link to="/admin/pois" className="saas-btn">Quản lý POI</Link>
                                <Link to="/admin/narration" className="saas-btn">Kho thuyết minh</Link>
                            </div>
                        </div>

                        {/* D1. Giám sát điều kiện hoạt động POI */}
                        <div style={{ marginBottom: '26px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A' }}>
                                    D1. Điều kiện hoạt động của điểm thuyết minh POI
                                </h3>
                                <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                                    Phạm vi tọa độ Thảo Cầm Viên: Lat 10.780..10.795, Lng 106.698..106.715
                                </span>
                            </div>

                            <div className="saas-stat-strip" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))' }}>
                                {[
                                    { label: 'Tổng số POI', val: poiMon.totalPois ?? 0 },
                                    { label: 'Tọa độ hợp lệ', val: poiMon.validCoordinatePois ?? 0 },
                                    { label: 'Thiếu / sai tọa độ', val: poiMon.invalidOrMissingCoordinatePois ?? 0, isErr: (poiMon.invalidOrMissingCoordinatePois ?? 0) > 0 },
                                    { label: 'Có bán kính', val: poiMon.configuredRadiusPois ?? 0 },
                                    { label: 'Thiếu bán kính', val: poiMon.missingRadiusPois ?? 0, isErr: (poiMon.missingRadiusPois ?? 0) > 0 },
                                    { label: 'Có bài thuyết minh', val: poiMon.poisWithNarration ?? 0 },
                                    { label: 'Thiếu thuyết minh', val: poiMon.poisMissingNarration ?? 0, isErr: (poiMon.poisMissingNarration ?? 0) > 0 },
                                    { label: 'Có audio hợp lệ', val: poiMon.poisWithValidAudio ?? 0 },
                                    { label: 'Thiếu audio hợp lệ', val: poiMon.poisMissingValidAudio ?? 0, isErr: (poiMon.poisMissingValidAudio ?? 0) > 0 }
                                ].map((m, idx) => (
                                    <div key={idx} className="saas-stat-box">
                                        <span className="saas-stat-label">{m.label}</span>
                                        <span className="saas-stat-num" style={{ fontSize: '1.25rem', color: m.isErr ? '#DC2626' : '#0F172A' }}>{m.val}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                                <div className="saas-segmented-group">
                                    {[
                                        { id: 'all', label: `Tất cả (${(poiMon.poiItems || []).length})` },
                                        { id: 'unready', label: `Chưa đủ điều kiện (${poiMon.notReadyForAutoTriggerCount ?? 0})` },
                                        { id: 'missingLang', label: `Thiếu ngôn ngữ phụ (${poiMon.poisMissingMultilingualCount ?? 0})` },
                                        { id: 'ready', label: `Đủ điều kiện (${poiMon.readyForAutoTriggerCount ?? 0})` }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            className={`saas-segmented-btn ${poiFilterMode === tab.id ? 'active' : ''}`}
                                            onClick={() => setPoiFilterMode(tab.id)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Tìm mã hoặc tên POI..."
                                    value={poiSearch}
                                    onChange={(e) => setPoiSearch(e.target.value)}
                                    style={{ padding: '6px 11px', borderRadius: '7px', border: '1px solid #E2E8F0', fontSize: '0.8rem', minWidth: '210px', color: '#0F172A' }}
                                />
                            </div>

                            <div className="saas-table-wrap" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                <table className="saas-table">
                                    <thead>
                                        <tr>
                                            <th>Mã & Tên POI</th>
                                            <th>Tọa độ (Lat, Lng)</th>
                                            <th style={{ textAlign: 'right' }}>Bán kính</th>
                                            <th style={{ textAlign: 'center' }}>Ngôn ngữ & Audio</th>
                                            <th>Trạng thái & Lý do</th>
                                            <th style={{ textAlign: 'center' }}>Điều hướng</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPoiItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>
                                                    Không có điểm POI nào khớp với bộ lọc hiện tại.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPoiItems.map(p => (
                                                <tr key={p.poiId}>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.73rem', color: '#64748B' }}>{p.code} • {p.category}</div>
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#334155' }}>
                                                        {Number(p.latitude).toFixed(5)}, {Number(p.longitude).toFixed(5)}
                                                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'sans-serif' }}>
                                                            {p.hasValidCoordinates ? 'Tọa độ hợp lệ' : 'Chưa xác thực tọa độ'}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{p.radiusMeters}m</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 500 }}>
                                                        {p.publishedLanguagesCount}/{p.totalSupportedLanguagesCount} ngôn ngữ ({p.validAudioCount} audio)
                                                    </td>
                                                    <td>
                                                        <div className="saas-status-dot-badge" style={{ marginBottom: '2px' }}>
                                                            <span className={`saas-dot ${p.isReadyForAutoTrigger ? 'success' : 'danger'}`} />
                                                            <span>{p.readinessStatus}</span>
                                                        </div>
                                                        {(p.issuesAndReasons || []).map((reason, idx) => (
                                                            <div key={idx} style={{ fontSize: '0.73rem', color: '#64748B' }}>• {reason}</div>
                                                        ))}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <Link to="/admin/pois" className="saas-kpi-link">Chỉnh sửa →</Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* D2. Giám sát nội dung & kiểm định 4 tầng file âm thanh */}
                        <div style={{ marginBottom: '26px', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A' }}>
                                        D2. Kiểm định 4 tầng file âm thanh & Nội dung thuyết minh
                                    </h3>
                                    <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                                        Bucket: <strong>{contentMon.storageBucket || 'narration-audio'}</strong> • Mirror cục bộ: <strong>{contentMon.localMirrorFilesCount ?? 0} file MP3</strong>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="saas-btn"
                                    onClick={handleVerifyAudioFiles}
                                    disabled={isVerifyingAudio}
                                >
                                    {isVerifyingAudio ? 'Đang quét Storage...' : 'Kiểm tra trực tiếp toàn bộ File Audio'}
                                </button>
                            </div>

                            <div className="saas-stat-strip" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))' }}>
                                <div className="saas-stat-box">
                                    <span className="saas-stat-label">Thuyết minh Động vật</span>
                                    <span className="saas-stat-num" style={{ fontSize: '1.2rem' }}>{contentMon.totalAnimalNarrations ?? 0} <span className="saas-stat-sub">/ {contentMon.expectedAnimalNarrations ?? 264}</span></span>
                                    <span className="saas-stat-sub">Thiếu {contentMon.missingAnimalTranslationsCount ?? 0} bản dịch</span>
                                </div>
                                <div className="saas-stat-box">
                                    <span className="saas-stat-label">Thuyết minh POI</span>
                                    <span className="saas-stat-num" style={{ fontSize: '1.2rem' }}>{contentMon.totalPoiNarrations ?? 0} <span className="saas-stat-sub">/ {contentMon.expectedPoiNarrations ?? 168}</span></span>
                                    <span className="saas-stat-sub">Thiếu {contentMon.missingPoiTranslationsCount ?? 0} bản dịch</span>
                                </div>
                                <div className="saas-stat-box">
                                    <span className="saas-stat-label">Tầng 1: Có URL hợp lệ</span>
                                    <span className="saas-stat-num" style={{ fontSize: '1.2rem' }}>{contentMon.stage1HasValidUrlCount ?? 0} / {contentMon.totalAudioEntriesChecked ?? 0}</span>
                                    <span className="saas-stat-sub">URL lỗi: {contentMon.invalidAudioUrlCount ?? 0}</span>
                                </div>
                                <div className="saas-stat-box">
                                    <span className="saas-stat-label">Tầng 2: File tồn tại</span>
                                    <span className="saas-stat-num" style={{ fontSize: '1.2rem' }}>{contentMon.stage2FileExistsCount ?? 0} / {contentMon.totalAudioEntriesChecked ?? 0}</span>
                                    <span className="saas-stat-sub">Không tồn tại: {contentMon.missingAudioFileCount ?? 0}</span>
                                </div>
                                <div className="saas-stat-box">
                                    <span className="saas-stat-label">Tầng 3: File tải được</span>
                                    <span className="saas-stat-num" style={{ fontSize: '1.2rem' }}>{contentMon.stage3FileDownloadableCount ?? 0} / {contentMon.totalAudioEntriesChecked ?? 0}</span>
                                    <span className="saas-stat-sub">Lỗi truy cập: {contentMon.inaccessibleAudioFileCount ?? 0}</span>
                                </div>
                                <div className="saas-stat-box">
                                    <span className="saas-stat-label">Tầng 4: Giải mã & Phát được</span>
                                    <span className="saas-stat-num" style={{ fontSize: '1.2rem' }}>{contentMon.stage4FilePlayableCount ?? 0} / {contentMon.totalAudioEntriesChecked ?? 0}</span>
                                    <span className="saas-stat-sub">Lỗi giải mã: {contentMon.unplayableAudioFileCount ?? 0}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>
                                    Danh sách nội dung cần bổ sung bản dịch / kiểm tra âm thanh ({filteredContentIssues.length} mục)
                                </span>
                                <div className="saas-segmented-group">
                                    {[
                                        { id: 'all', label: 'Tất cả' },
                                        { id: 'POI', label: 'Thiếu POI' },
                                        { id: 'Animal', label: 'Thiếu Động vật' },
                                        { id: 'AudioError', label: 'Lỗi Audio' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            className={`saas-segmented-btn ${issueFilterType === f.id ? 'active' : ''}`}
                                            onClick={() => setIssueFilterType(f.id)}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="saas-table-wrap" style={{ maxHeight: '230px', overflowY: 'auto' }}>
                                <table className="saas-table">
                                    <thead>
                                        <tr>
                                            <th>Mức độ</th>
                                            <th>Phân loại</th>
                                            <th>Đối tượng</th>
                                            <th>Ngôn ngữ</th>
                                            <th>Chi tiết vấn đề</th>
                                            <th style={{ textAlign: 'center' }}>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredContentIssues.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#64748B' }}>
                                                    Không phát hiện mục thiếu hoặc lỗi trong nhóm đang lọc.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredContentIssues.map(issue => (
                                                <tr key={issue.issueId}>
                                                    <td>{renderSeverityIndicator(issue.severity)}</td>
                                                    <td style={{ color: '#64748B' }}>{issue.entityType}</td>
                                                    <td style={{ fontWeight: 500 }}>{issue.entityName}</td>
                                                    <td style={{ textTransform: 'uppercase', fontWeight: 600, color: '#475569' }}>{issue.languageCode}</td>
                                                    <td style={{ color: '#64748B' }}>{issue.description}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <Link to={issue.manageUrl || '/admin/narration'} className="saas-kpi-link">Khắc phục →</Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* D3. Bảng thống kê độ phủ 12 ngôn ngữ */}
                        <div style={{ paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A' }}>
                                        D3. Độ phủ nội dung và âm thanh theo 12 ngôn ngữ
                                    </h3>
                                    <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                                        Mẫu số chuẩn: 36 mục thuyết minh (22 Động vật + 14 POI) trên mỗi ngôn ngữ
                                    </div>
                                </div>
                                <Link to="/admin/species" className="saas-kpi-link">Quản lý bản dịch loài →</Link>
                            </div>

                            <div className="saas-table-wrap">
                                <table className="saas-table">
                                    <thead>
                                        <tr>
                                            <th>Ngôn ngữ</th>
                                            <th style={{ textAlign: 'center' }}>Động vật (/22)</th>
                                            <th style={{ textAlign: 'center' }}>POI (/14)</th>
                                            <th style={{ textAlign: 'center' }}>Hoàn chỉnh (/36)</th>
                                            <th style={{ textAlign: 'center' }}>Còn thiếu</th>
                                            <th style={{ textAlign: 'center' }}>File Audio</th>
                                            <th style={{ width: '160px' }}>Tỷ lệ hoàn thiện</th>
                                            <th>Trạng thái</th>
                                            <th style={{ textAlign: 'center' }}>Chi tiết thiếu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {languageStats.map(lang => (
                                            <tr key={lang.languageCode}>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{lang.flagIcon} {lang.languageName}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{lang.nativeName} ({lang.languageCode.toUpperCase()})</div>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {lang.animalNarrationsCount} / {lang.totalActiveAnimals || 22}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {lang.poiNarrationsCount} / {lang.totalActivePois || 14}
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                                    {lang.completeNarrationsCount ?? (lang.animalNarrationsCount + lang.poiNarrationsCount)} / {lang.expectedNarrationsCount || 36}
                                                </td>
                                                <td style={{ textAlign: 'center', color: '#64748B' }}>
                                                    {lang.missingNarrationsCount ?? 0} mục
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {lang.validAudioFilesCount ?? lang.audioFilesCount} file
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${Math.min(100, lang.completionRatePercent || 0)}%`,
                                                                height: '100%',
                                                                background: '#15803D'
                                                            }} />
                                                        </div>
                                                        <span style={{ fontWeight: 600, fontSize: '0.76rem', minWidth: '40px', textAlign: 'right' }}>
                                                            {lang.completionRatePercent ?? 0}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="saas-status-dot-badge">
                                                        <span className={`saas-dot ${lang.poiNarrationsCount > 0 ? 'success' : 'warning'}`} />
                                                        <span>{lang.availabilityStatus}</span>
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        className="saas-btn"
                                                        style={{ padding: '4px 9px', fontSize: '0.74rem' }}
                                                        onClick={() => setSelectedLangForMissingModal(lang)}
                                                    >
                                                        Xem ({lang.missingNarrationsCount ?? 0})
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* ================================================================
                        E. GIÁM SÁT DỊCH VỤ
                       ================================================================ */}
                    <section id="sec-services" className="saas-section">
                        <div className="saas-section-header">
                            <div>
                                <h2 className="saas-section-title">E. Giám sát trạng thái dịch vụ</h2>
                                <p className="saas-section-desc">
                                    Kiểm tra kết nối thực tế và độ trễ phản hồi (ms) của 4 dịch vụ nền tảng.
                                </p>
                            </div>
                            {renderServiceStatus(svcMon.overallStatus || 'Healthy')}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                            {(svcMon.services || []).map(svc => (
                                <div key={svc.serviceKey} className="saas-stat-box" style={{ background: '#FFFFFF', padding: '16px 18px', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>{svc.category}</div>
                                            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>{svc.serviceName}</div>
                                        </div>
                                        {renderServiceStatus(svc.status)}
                                    </div>

                                    <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                                        {svc.details}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        paddingTop: '8px',
                                        borderTop: '1px solid #F1F5F9',
                                        fontSize: '0.75rem',
                                        color: '#64748B'
                                    }}>
                                        <span>Độ trễ: <strong style={{ color: '#0F172A' }}>{svc.responseTimeMs} ms</strong></span>
                                        <span>Kiểm tra: <strong style={{ color: '#0F172A' }}>{svc.lastCheckedAtUtc ? new Date(svc.lastCheckedAtUtc).toLocaleTimeString('vi-VN') : '-'}</strong></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ================================================================
                        F. NHẬT KÝ & CẢNH BÁO
                       ================================================================ */}
                    <section id="sec-logs-alerts" className="saas-section">
                        <div className="saas-section-header">
                            <div>
                                <h2 className="saas-section-title">F. Nhật ký hoạt động & Cảnh báo</h2>
                                <p className="saas-section-desc">
                                    Theo dõi cảnh báo vận hành cần xử lý và nhật ký sự kiện thuyết minh chi tiết.
                                </p>
                            </div>
                        </div>

                        {/* F1. Cảnh báo hệ thống */}
                        <div style={{ marginBottom: '26px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A' }}>
                                    F1. Cảnh báo hệ thống ({filteredAlerts.length})
                                </h3>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <select
                                        value={alertSeverityFilter}
                                        onChange={(e) => setAlertSeverityFilter(e.target.value)}
                                        style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A' }}
                                    >
                                        <option value="all">Mọi mức độ</option>
                                        <option value="Critical">Nghiêm trọng (Critical)</option>
                                        <option value="Warning">Cảnh báo (Warning)</option>
                                        <option value="Information">Thông tin (Information)</option>
                                    </select>
                                    <select
                                        value={alertStatusFilter}
                                        onChange={(e) => setAlertStatusFilter(e.target.value)}
                                        style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A' }}
                                    >
                                        <option value="all">Mọi trạng thái</option>
                                        <option value="Unresolved">Chưa xử lý</option>
                                        <option value="InProgress">Đang xử lý</option>
                                        <option value="Resolved">Đã khắc phục</option>
                                    </select>
                                    <select
                                        value={alertTypeFilter}
                                        onChange={(e) => setAlertTypeFilter(e.target.value)}
                                        style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A' }}
                                    >
                                        <option value="all">Mọi phân loại</option>
                                        <option value="MissingTranslation">Thiếu bản dịch</option>
                                        <option value="InaccessibleAudio">Lỗi File Audio</option>
                                        <option value="PoiCoordinate">Điều kiện POI</option>
                                        <option value="GpsUnavailable">Tín hiệu GPS</option>
                                        <option value="ServiceHealth">Dịch vụ</option>
                                    </select>
                                </div>
                            </div>

                            <div className="saas-table-wrap">
                                <table className="saas-table">
                                    <thead>
                                        <tr>
                                            <th>Mức độ</th>
                                            <th>Nội dung cảnh báo</th>
                                            <th>Đối tượng</th>
                                            <th>Thời gian</th>
                                            <th>Trạng thái xử lý</th>
                                            <th style={{ textAlign: 'center' }}>Điều hướng</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAlerts.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '18px', textAlign: 'center', color: '#64748B' }}>
                                                    Không có cảnh báo nào khớp với bộ lọc hiện tại.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAlerts.map(alert => (
                                                <tr key={alert.alertKey}>
                                                    <td>{renderSeverityIndicator(alert.severity)}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{alert.title}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>{alert.description}</div>
                                                    </td>
                                                    <td style={{ color: '#475569' }}>{alert.targetEntity}</td>
                                                    <td style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                        {alert.detectedAtUtc ? new Date(alert.detectedAtUtc).toLocaleString('vi-VN') : '-'}
                                                    </td>
                                                    <td>
                                                        <select
                                                            value={alert.status}
                                                            disabled={updatingAlertKey === alert.alertKey}
                                                            onChange={(e) => handleUpdateAlertStatus(alert.alertKey, e.target.value)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                fontSize: '0.76rem',
                                                                fontWeight: 500,
                                                                border: '1px solid #E2E8F0',
                                                                background: '#FFFFFF',
                                                                color: '#0F172A',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <option value="Unresolved">Chưa xử lý</option>
                                                            <option value="InProgress">Đang xử lý</option>
                                                            <option value="Resolved">Đã khắc phục</option>
                                                        </select>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <Link to={alert.targetUrl || '/admin'} className="saas-kpi-link">Mở trang →</Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* F2. Nhật ký hoạt động */}
                        <div style={{ paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A' }}>
                                    F2. Nhật ký hoạt động ({filteredLogs.length} bản ghi)
                                </h3>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <select
                                        value={logCategoryFilter}
                                        onChange={(e) => { setLogCategoryFilter(e.target.value); setLogPage(1); }}
                                        style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A' }}
                                    >
                                        <option value="all">Tất cả phân nhóm</option>
                                        <option value="AUDIO">Phát âm thanh (AUDIO)</option>
                                        <option value="GPS">Kích hoạt GPS (GPS)</option>
                                        <option value="LANGUAGE">Đổi ngôn ngữ (LANGUAGE)</option>
                                        <option value="CONTENT">Nội dung thuyết minh (CONTENT)</option>
                                        <option value="ADMIN">Thao tác Admin (ADMIN)</option>
                                    </select>
                                    <select
                                        value={logResultFilter}
                                        onChange={(e) => { setLogResultFilter(e.target.value); setLogPage(1); }}
                                        style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A' }}
                                    >
                                        <option value="all">Mọi kết quả</option>
                                        <option value="Success">Thành công</option>
                                        <option value="Failed">Thất bại / Lỗi</option>
                                        <option value="Skipped">Bỏ qua / Dừng sớm</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Tìm sự kiện, POI, phiên..."
                                        value={logSearch}
                                        onChange={(e) => { setLogSearch(e.target.value); setLogPage(1); }}
                                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.78rem', minWidth: '190px', color: '#0F172A' }}
                                    />
                                </div>
                            </div>

                            <div className="saas-table-wrap">
                                <table className="saas-table">
                                    <thead>
                                        <tr>
                                            <th>Thời gian</th>
                                            <th>Loại sự kiện</th>
                                            <th>Người thực hiện / Phiên</th>
                                            <th>Đối tượng</th>
                                            <th>Kết quả</th>
                                            <th>Chi tiết</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '18px', textAlign: 'center', color: '#64748B' }}>
                                                    Chưa có bản ghi nhật ký hoạt động khớp với điều kiện lọc.
                                                </td>
                                            </tr>
                                        ) : (
                                            pagedLogs.map(log => (
                                                <tr key={log.logId}>
                                                    <td style={{ whiteSpace: 'nowrap', color: '#64748B', fontSize: '0.76rem' }}>
                                                        {log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : '-'}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 500, color: '#0F172A' }}>{log.eventLabel}</div>
                                                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{log.category} • {log.eventType}</div>
                                                    </td>
                                                    <td style={{ color: '#475569' }}>{log.actorOrSession}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 500 }}>{log.targetName}</div>
                                                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{log.targetEntity} #{log.targetId}</div>
                                                    </td>
                                                    <td>
                                                        <span className="saas-status-dot-badge">
                                                            <span className={`saas-dot ${log.resultStatus === 'Success' ? 'success' : (log.resultStatus === 'Failed' ? 'danger' : 'warning')}`} />
                                                            <span>{log.resultStatus === 'Success' ? 'Thành công' : (log.resultStatus === 'Failed' ? 'Thất bại' : 'Dừng / Bỏ qua')}</span>
                                                        </span>
                                                    </td>
                                                    <td style={{ color: '#64748B' }}>
                                                        <div>{log.details}</div>
                                                        {log.errorMessage && (
                                                            <div style={{ color: '#DC2626', fontSize: '0.74rem' }}>Lỗi: {log.errorMessage}</div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {totalLogPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#64748B' }}>
                                        Trang {logPage} / {totalLogPages} ({filteredLogs.length} bản ghi)
                                    </span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            type="button"
                                            className="saas-btn"
                                            disabled={logPage <= 1}
                                            onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                        >
                                            ← Trước
                                        </button>
                                        <button
                                            type="button"
                                            className="saas-btn"
                                            disabled={logPage >= totalLogPages}
                                            onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))}
                                        >
                                            Tiếp →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}

            {/* MODAL CHI TIẾT NỘI DUNG THIẾU THEO NGÔN NGỮ */}
            {selectedLangForMissingModal && (
                <div
                    onClick={() => setSelectedLangForMissingModal(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.45)',
                        zIndex: 9990,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            maxWidth: '640px',
                            width: '100%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            padding: '22px 24px',
                            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 600, color: '#0F172A' }}>
                                {selectedLangForMissingModal.flagIcon} Nội dung còn thiếu — {selectedLangForMissingModal.languageName} ({selectedLangForMissingModal.languageCode.toUpperCase()})
                            </h3>
                            <button
                                type="button"
                                className="saas-btn"
                                style={{ padding: '4px 10px' }}
                                onClick={() => setSelectedLangForMissingModal(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <p style={{ fontSize: '0.825rem', color: '#64748B', marginTop: 0 }}>
                            Độ phủ hiện tại: <strong style={{ color: '#0F172A' }}>{selectedLangForMissingModal.completeNarrationsCount}/{selectedLangForMissingModal.expectedNarrationsCount} mục ({selectedLangForMissingModal.completionRatePercent}%)</strong>.
                            Còn thiếu <strong style={{ color: '#0F172A' }}>{(selectedLangForMissingModal.missingPoiNames || []).length} POI</strong> và <strong style={{ color: '#0F172A' }}>{(selectedLangForMissingModal.missingAnimalNames || []).length} loài động vật</strong>.
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>
                                    1. Điểm POI chưa có thuyết minh ({(selectedLangForMissingModal.missingPoiNames || []).length})
                                </strong>
                                <Link to="/admin/pois" className="saas-kpi-link">Quản lý POI →</Link>
                            </div>
                            {(selectedLangForMissingModal.missingPoiNames || []).length === 0 ? (
                                <div style={{ fontSize: '0.8rem', color: '#15803D' }}>Đã hoàn thiện 100% các điểm POI cho ngôn ngữ này.</div>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {selectedLangForMissingModal.missingPoiNames.map((name, i) => (
                                        <span key={i} style={{ fontSize: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', padding: '4px 9px', borderRadius: '6px' }}>
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>
                                    2. Động vật / Loài chưa có bài thuyết minh ({(selectedLangForMissingModal.missingAnimalNames || []).length})
                                </strong>
                                <Link to="/admin/narration" className="saas-kpi-link">Kho thuyết minh →</Link>
                            </div>
                            {(selectedLangForMissingModal.missingAnimalNames || []).length === 0 ? (
                                <div style={{ fontSize: '0.8rem', color: '#15803D' }}>Đã hoàn thiện 100% động vật cho ngôn ngữ này.</div>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {selectedLangForMissingModal.missingAnimalNames.map((name, i) => (
                                        <span key={i} style={{ fontSize: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', padding: '4px 9px', borderRadius: '6px' }}>
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT THỐNG KÊ POI */}
            {selectedPoiForDetailModal && (
                <div
                    onClick={() => setSelectedPoiForDetailModal(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.45)',
                        zIndex: 9990,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            maxWidth: '480px',
                            width: '100%',
                            padding: '22px 24px',
                            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 600, color: '#0F172A' }}>
                                Chi tiết POI: {selectedPoiForDetailModal.name}
                            </h3>
                            <button
                                type="button"
                                className="saas-btn"
                                style={{ padding: '4px 10px' }}
                                onClick={() => setSelectedPoiForDetailModal(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{ fontSize: '0.825rem', color: '#64748B', lineHeight: 1.75 }}>
                            <div>Mã POI: <strong style={{ color: '#0F172A' }}>{selectedPoiForDetailModal.code}</strong> ({selectedPoiForDetailModal.category})</div>
                            <div>Thứ hạng tương tác: <strong style={{ color: '#0F172A' }}>#{selectedPoiForDetailModal.rank}</strong></div>
                            <div>Lượt kích hoạt tự động GPS: <strong style={{ color: '#0F172A' }}>{selectedPoiForDetailModal.gpsTriggersCount} lần</strong></div>
                            <div>Lượt yêu cầu phát thuyết minh: <strong style={{ color: '#0F172A' }}>{selectedPoiForDetailModal.playRequestsCount} lượt</strong></div>
                            <div>Lượt phát thành công: <strong style={{ color: '#0F172A' }}>{selectedPoiForDetailModal.playSuccessCount} lượt</strong></div>
                            <div>Lượt phát lỗi: <strong style={{ color: '#0F172A' }}>{selectedPoiForDetailModal.playFailedCount} lượt</strong></div>
                            <div>Tỷ lệ phát thành công: <strong style={{ color: '#0F172A' }}>{selectedPoiForDetailModal.successRatePercent != null ? `${selectedPoiForDetailModal.successRatePercent}%` : 'Chưa có dữ liệu'}</strong></div>
                            <div>Thời lượng nghe trung bình: <strong style={{ color: '#0F172A' }}>{selectedPoiForDetailModal.averageListenDurationSeconds > 0 ? `${selectedPoiForDetailModal.averageListenDurationSeconds} giây` : 'Chưa có dữ liệu'}</strong></div>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <Link to="/admin/pois" className="saas-btn saas-btn-primary">Quản lý POI →</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
