import React, { useState, useRef, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function Chatbot() {
    const { currentSession, setIsTicketModalOpen } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: 'Xin chào quý khách! Tôi là ZooBot — trợ lý ảo đồng hành tại sở thú ZooGuide. Quý khách muốn hỏi về loài động vật nào, vị trí chuồng trại, hay quy định vé và lịch sinh hoạt?',
            time: 'Vừa xong'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [quota, setQuota] = useState({
        hasValidTicket: false,
        remainingQuestions: 3,
        maxQuestions: 3,
        isLimitReached: false
    });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isTyping, isOpen]);

    // Check quota from backend when chat is opened or session changes
    useEffect(() => {
        let isMounted = true;
        async function fetchStatus() {
            try {
                const res = await ZooApi.getChatbotStatus(currentSession?.sessionId);
                if (isMounted && res.success && res.data) {
                    setQuota({
                        hasValidTicket: !!res.data.hasValidTicket,
                        remainingQuestions: res.data.remainingQuestions,
                        maxQuestions: res.data.maxQuestions || 3,
                        isLimitReached: !!res.data.isLimitReached
                    });
                }
            } catch (err) {
                console.warn("Failed to fetch chatbot quota:", err);
            }
        }

        if (isOpen) {
            fetchStatus();
        }
        return () => { isMounted = false; };
    }, [isOpen, currentSession]);

    const getNowFormatted = () => {
        const d = new Date();
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const handleSendMessage = async (textToSend) => {
        const text = textToSend || inputText;
        if (!text || !text.trim() || isTyping) return;

        // Nếu khách vãng lai đã dùng hết 3 câu
        if (!quota.hasValidTicket && quota.isLimitReached) {
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: "Bạn đã sử dụng hết 3 câu hỏi miễn phí. Vui lòng kích hoạt vé tham quan hợp lệ để tiếp tục sử dụng chatbot.",
                time: getNowFormatted()
            }]);
            return;
        }

        const cleanText = text.trim();
        const userTime = getNowFormatted();

        setMessages(prev => [...prev, {
            sender: 'user',
            text: cleanText,
            time: userTime
        }]);
        setInputText('');
        setIsTyping(true);

        try {
            const res = await ZooApi.sendChatMessage(cleanText, currentSession?.sessionId);
            setIsTyping(false);

            if (res.success && res.data) {
                // Update quota strictly from backend response
                if (typeof res.data.remainingQuestions === 'number') {
                    setQuota({
                        hasValidTicket: !!res.data.hasValidTicket,
                        remainingQuestions: res.data.remainingQuestions,
                        maxQuestions: res.data.maxQuestions || 3,
                        isLimitReached: !!res.data.isLimitReached
                    });
                }

                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: res.data.reply,
                    time: res.data.timestamp || getNowFormatted()
                }]);
            } else {
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: "Xin lỗi quý khách, hệ thống trợ lý ảo tạm thời không nhận diện được dữ liệu. Quý khách vui lòng thử lại hoặc hỏi nhân viên vườn thú.",
                    time: getNowFormatted()
                }]);
            }
        } catch (err) {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: "Hiện không thể kết nối đến máy chủ thông tin vườn thú. Quý khách vui lòng kiểm tra kết nối mạng.",
                time: getNowFormatted()
            }]);
        }
    };

    const formatMarkdown = (text) => {
        if (!text) return null;
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <>
            <button 
                id="btn-chatbot-trigger" 
                className="chatbot-trigger-fab" 
                aria-label="Mở trợ lý ảo ZooBot" 
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
            </button>

            {isOpen && (
                <div id="chatbot-panel" className="chatbot-panel" role="dialog" aria-label="Hộp thoại trợ lý ảo">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="flex items-center gap-2">
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">ZooBot Trợ Lý Vườn Thú</h4>
                                <span className="text-xs opacity-80">Kết nối cơ sở dữ liệu thực tế 24/7</span>
                            </div>
                        </div>
                        <button 
                            id="btn-close-chat" 
                            className="btn btn-icon btn-sm" 
                            style={{ color: '#FFF', border: 'none' }} 
                            aria-label="Đóng chat"
                            onClick={() => setIsOpen(false)}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Quota Indicator Bar */}
                    <div style={{
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                        backgroundColor: quota.hasValidTicket ? '#DCFCE7' : (quota.isLimitReached ? '#FEE2E2' : '#FEF3C7'),
                        color: quota.hasValidTicket ? '#166534' : (quota.isLimitReached ? '#991B1B' : '#92400E')
                    }}>
                        <span>
                            {quota.hasValidTicket 
                                ? '✓ Vé Hợp Lệ • Không giới hạn câu hỏi' 
                                : (quota.isLimitReached 
                                    ? 'Đã dùng hết 3 câu hỏi miễn phí' 
                                    : `Khách chưa kích hoạt vé • Còn ${quota.remainingQuestions}/3 câu hỏi miễn phí`)}
                        </span>
                        {!quota.hasValidTicket && (
                            <button 
                                type="button" 
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#2563EB',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    textDecoration: 'underline'
                                }}
                                onClick={() => setIsTicketModalOpen(true)}
                            >
                                Kích hoạt vé
                            </button>
                        )}
                    </div>

                    {/* Messages Body */}
                    <div id="chat-messages-container" className="chat-messages">
                        {messages.map((m, idx) => {
                            const isBot = m.sender === 'bot';
                            return (
                                <div key={idx} className={`chat-message ${isBot ? 'msg-bot' : 'msg-user'}`}>
                                    {isBot && (
                                        <div className="chat-avatar">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="9"></circle>
                                                <path d="M9 10h.01M15 10h.01"></path>
                                                <path d="M8 15a5 5 0 0 0 8 0"></path>
                                            </svg>
                                        </div>
                                    )}
                                    <div className="msg-bubble">
                                        <p className="msg-text">{formatMarkdown(m.text)}</p>
                                        <span className="msg-time">{m.time}</span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {isTyping && (
                        <div id="chat-typing-indicator" className="chat-typing-indicator">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                    )}

                    {/* Limit Reached Warning Card */}
                    {!quota.hasValidTicket && quota.isLimitReached && (
                        <div style={{
                            margin: '8px 12px',
                            padding: '10px 12px',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FCA5A5',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            color: '#991B1B',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            <div>
                                <strong>Giới hạn câu hỏi:</strong> Bạn đã sử dụng hết 3 câu hỏi miễn phí. Vui lòng kích hoạt vé tham quan hợp lệ để tiếp tục sử dụng chatbot.
                            </div>
                            <button 
                                type="button" 
                                className="btn btn-sm btn-primary"
                                style={{ alignSelf: 'flex-start', padding: '4px 10px', fontSize: '0.78rem' }}
                                onClick={() => setIsTicketModalOpen(true)}
                            >
                                Kích hoạt vé tham quan
                            </button>
                        </div>
                    )}

                    {/* Quick Prompts Chips */}
                    <div className="chat-quick-prompts">
                        <button className="chat-chip-prompt" disabled={!quota.hasValidTicket && quota.isLimitReached} onClick={() => handleSendMessage('Giờ cho thú ăn là khi nào?')}>Lịch ăn thú</button>
                        <button className="chat-chip-prompt" disabled={!quota.hasValidTicket && quota.isLimitReached} onClick={() => handleSendMessage('Hổ Bengal ở khu nào?')}>Hổ Bengal</button>
                        <button className="chat-chip-prompt" disabled={!quota.hasValidTicket && quota.isLimitReached} onClick={() => handleSendMessage('Sư tử Simba')}>Sư tử Simba</button>
                        <button className="chat-chip-prompt" disabled={!quota.hasValidTicket && quota.isLimitReached} onClick={() => handleSendMessage('Giá vé tham quan?')}>Giá vé</button>
                        <button className="chat-chip-prompt" disabled={!quota.hasValidTicket && quota.isLimitReached} onClick={() => handleSendMessage('Giờ mở cửa sở thú?')}>Giờ mở cửa</button>
                    </div>

                    {/* Chat Input Form */}
                    <form 
                        id="chat-form" 
                        className="chat-input-bar"
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    >
                        <input 
                            type="text" 
                            id="chat-input-text" 
                            className="chat-input-field" 
                            placeholder={!quota.hasValidTicket && quota.isLimitReached 
                                ? "Đã dùng hết 3 câu hỏi miễn phí. Kích hoạt vé để tiếp tục..." 
                                : "Nhập câu hỏi tra cứu thông tin..."} 
                            autoComplete="off"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            disabled={isTyping || (!quota.hasValidTicket && quota.isLimitReached)}
                        />
                        <button 
                            type="submit" 
                            className="btn btn-sm btn-primary" 
                            aria-label="Gửi câu hỏi" 
                            disabled={isTyping || !inputText.trim() || (!quota.hasValidTicket && quota.isLimitReached)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
