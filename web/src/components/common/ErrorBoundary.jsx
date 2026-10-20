import React from 'react';

/**
 * Global & Section Error Boundary for ZooGuide
 * Catches JavaScript errors anywhere in child component tree,
 * logs the error, and displays a recovery fallback UI instead of crashing the whole page.
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ZooGuide ErrorBoundary] Caught render error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div 
                    role="alert"
                    style={{
                        padding: '24px 20px',
                        margin: '16px auto',
                        maxWidth: '960px',
                        background: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '14px',
                        boxShadow: '0 4px 12px rgba(185, 28, 28, 0.08)',
                        color: '#1E293B',
                        fontFamily: 'inherit'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.8rem' }} aria-hidden="true">⚠️</span>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#B91C1C', fontWeight: 800 }}>
                                {this.props.title || 'Đã xảy ra lỗi khi hiển thị giao diện này'}
                            </h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#7F1D1D' }}>
                                Hệ thống đã bắt lỗi và bảo toàn trạng thái ứng dụng. Bạn có thể thử khôi phục lại khu vực này.
                            </p>
                        </div>
                    </div>

                    {this.state.error && (
                        <div style={{
                            padding: '10px 14px',
                            background: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #FECACA',
                            marginBottom: '14px',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '0.8rem',
                            color: '#991B1B',
                            wordBreak: 'break-word'
                        }}>
                            <strong>Chi tiết kỹ thuật:</strong> {this.state.error.message || String(this.state.error)}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={this.handleReset}
                            className="btn btn-sm btn-primary"
                            style={{ background: '#15803D', borderColor: '#15803D' }}
                        >
                            🔄 Thử tải lại thành phần
                        </button>
                        <button
                            type="button"
                            onClick={this.handleReload}
                            className="btn btn-sm btn-outline"
                        >
                            Tải lại trang web
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
