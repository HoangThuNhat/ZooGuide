import React, { useState } from 'react';

const KNOWLEDGE_BASE = [
    {
        keywords: ['giờ', 'mở cửa', 'đóng cửa', 'thời gian'],
        response: 'Sở thú ZooGuide mở cửa đón khách từ 08:00 sáng đến 18:30 hàng ngày (kể cả Thứ Bảy, Chủ Nhật và ngày Lễ). Các buổi biểu diễn thuyết minh đặc biệt diễn ra lúc 10:00 và 15:30.'
    },
    {
        keywords: ['cho ăn', 'lịch ăn', 'giờ ăn', 'feeding'],
        response: '🕒 Lịch cho thú ăn trong ngày:\n• 09:30 - Khu Linh Trưởng (Khu A)\n• 11:00 & 16:00 - Chuồng Hổ Bengal & Sư tử (Khu B)\n• 14:00 - Thảo nguyên Hươu cao cổ (Khu C)\n• 15:00 - Đảo Hồng hạc (Khu E)'
    },
    {
        keywords: ['hổ', 'tiger', 'bengal'],
        response: 'Hổ Bengal Hoàng Gia nằm tại **Khu B (Khu Động Vật Ăn Thịt)**. Bạn có thể nhấn vào thẻ Hổ trên bản đồ để được dẫn đường tự động và nghe thuyết minh chi tiết!'
    },
    {
        keywords: ['voọc', 'linh trưởng', 'khỉ', 'douc'],
        response: 'Voọc chà vá chân nâu nằm tại **Khu A (Rừng Mưa & Linh Trưởng)**. Đây là loài báu vật cực kỳ nguy cấp với bộ lông 5 màu lộng lẫy.'
    },
    {
        keywords: ['hươu', 'cao cổ', 'ngựa vằn', 'giraffe', 'zebra'],
        response: 'Hươu cao cổ và Ngựa vằn sinh sống tự do tại **Khu C (Thảo Nguyên Châu Phi)** rộng 15.000m². Bạn có thể mua thức ăn rau xanh tại quầy để trực tiếp trải nghiệm cho hươu ăn!'
    },
    {
        keywords: ['wc', 'vệ sinh', 'toilet', 'ăn uống', 'nước'],
        response: 'Hệ thống nhà vệ sinh WC và quầy nước giải khát nằm ngay cạnh **Cổng Vào Chính** và trung tâm giao giữa Khu A và Khu C.'
    },
    {
        keywords: ['vé', 'mã vé', 'ticket', 'vip', 'giá'],
        response: 'Mã vé của bạn được dùng để mở khóa Thuyết Minh Tự Động và Bản Đồ Dẫn Đường. Nếu bạn chưa có vé, hãy nhập thử mã mẫu **ZOO-8899-VIP** tại mục Vé Tham Quan để trải nghiệm ngay!'
    },
    {
        keywords: ['trẻ em', 'xe đẩy', 'em bé'],
        response: 'Sở thú có dịch vụ mượn xe đẩy trẻ em miễn phí tại Quầy Chăm Sóc Khách Hàng (ngay cổng soát vé). Toàn bộ lối đi đều có đường dốc thoải thuận tiện cho xe lăn và xe đẩy.'
    }
];

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: 'Xin chào quý khách! Tôi là ZooBot — trợ lý ảo đồng hành tại sở thú ZooGuide. Quý khách muốn hỏi về loài động vật nào, lịch cho thú ăn hay cần tìm đường trong vườn thú?',
            time: 'Vừa xong'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const getNowFormatted = () => {
        const d = new Date();
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const findAnswer = (query) => {
        const q = query.toLowerCase();
        for (const item of KNOWLEDGE_BASE) {
            if (item.keywords.some(k => q.includes(k))) {
                return item.response;
            }
        }
        return `Cảm ơn quý khách đã hỏi! Về "${query}", quý khách có thể liên hệ trực tiếp nhân viên sở thú tại các trạm thông tin hoặc gọi hotline hỗ trợ khẩn cấp: 1900 8888. Quý khách cũng có thể tra cứu thông tin chi tiết các loài vật trong mục **Khám Phá** nhé!`;
    };

    const handleSendMessage = (textToSend) => {
        const text = textToSend || inputText;
        if (!text || !text.trim()) return;

        const cleanText = text.trim();
        setMessages(prev => [...prev, {
            sender: 'user',
            text: cleanText,
            time: getNowFormatted()
        }]);
        setInputText('');
        setIsTyping(true);

        setTimeout(() => {
            const reply = findAnswer(cleanText);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: reply,
                time: getNowFormatted()
            }]);
        }, 650);
    };

    const formatMarkdown = (text) => {
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
                    <div className="chatbot-header">
                        <div className="flex items-center gap-2">
                            <span style={{ fontSize: '1.1rem' }}>🦁</span>
                            <div>
                                <h4 className="font-bold text-sm">ZooBot Trợ Lý Vườn Thú</h4>
                                <span className="text-xs opacity-80">Trực tuyến 24/7</span>
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
                    </div>

                    {isTyping && (
                        <div id="chat-typing-indicator" className="chat-typing-indicator">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                    )}

                    {/* Quick Prompts Chips */}
                    <div className="chat-quick-prompts">
                        <button className="chat-chip-prompt" onClick={() => handleSendMessage('Giờ cho thú ăn là khi nào?')}>Giờ cho thú ăn?</button>
                        <button className="chat-chip-prompt" onClick={() => handleSendMessage('Hổ Bengal ở khu nào?')}>Hổ ở khu nào?</button>
                        <button className="chat-chip-prompt" onClick={() => handleSendMessage('Có xe đẩy cho em bé không?')}>Xe đẩy em bé?</button>
                        <button className="chat-chip-prompt" onClick={() => handleSendMessage('Quy định vé và giờ mở cửa?')}>Giờ mở cửa?</button>
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
                            placeholder="Nhập câu hỏi của bạn..." 
                            autoComplete="off"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button type="submit" className="btn btn-sm btn-primary" aria-label="Gửi câu hỏi">
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
