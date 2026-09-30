/**
 * ZooGuide - AI Smart Zoo Assistant Chatbot
 * Provides instant answers regarding animals, feeding schedules, map waypoints and safety guidelines.
 */

const ZooChatbot = {
    isOpen: false,
    messages: [
        {
            sender: 'bot',
            text: 'Xin chào quý khách! Tôi là ZooBot — trợ lý ảo đồng hành tại sở thú ZooGuide. Quý khách muốn hỏi về loài động vật nào, lịch cho thú ăn hay cần tìm đường trong vườn thú?',
            time: 'Vừa xong'
        }
    ],

    knowledgeBase: [
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
    ],

    init() {
        this.bindEvents();
        this.renderMessages();
    },

    toggleChat() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('chatbot-panel');
        const trigger = document.getElementById('btn-chatbot-trigger');

        if (panel) {
            panel.classList.toggle('hidden', !this.isOpen);
        }
        if (trigger) {
            trigger.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');
        }

        if (this.isOpen) {
            const input = document.getElementById('chat-input-text');
            if (input) input.focus();
            this.scrollToBottom();
        }
    },

    async sendMessage(text) {
        if (!text || !text.trim()) return;

        const cleanText = text.trim();
        this.messages.push({
            sender: 'user',
            text: cleanText,
            time: this.getNowFormatted()
        });

        this.renderMessages();
        this.showTypingIndicator(true);

        const input = document.getElementById('chat-input-text');
        if (input) input.value = '';

        // Simulate intelligent response delay
        setTimeout(() => {
            const reply = this.findAnswer(cleanText);
            this.showTypingIndicator(false);
            this.messages.push({
                sender: 'bot',
                text: reply,
                time: this.getNowFormatted()
            });
            this.renderMessages();
        }, 650);
    },

    findAnswer(query) {
        const q = query.toLowerCase();

        for (const item of this.knowledgeBase) {
            if (item.keywords.some(k => q.includes(k))) {
                return item.response;
            }
        }

        // Generic friendly fallback
        return `Cảm ơn quý khách đã hỏi! Về "${query}", quý khách có thể liên hệ trực tiếp nhân viên sở thú tại các trạm thông tin hoặc gọi hotline hỗ trợ khẩn cấp: 1900 8888. Quý khách cũng có thể tra cứu thông tin chi tiết các loài vật trong mục **Khám Phá** nhé!`;
    },

    renderMessages() {
        const container = document.getElementById('chat-messages-container');
        if (!container) return;

        container.innerHTML = this.messages.map(m => {
            const isBot = m.sender === 'bot';
            return `
                <div class="chat-message ${isBot ? 'msg-bot' : 'msg-user'}">
                    ${isBot ? `
                        <div class="chat-avatar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="9"></circle>
                                <path d="M9 10h.01M15 10h.01"></path>
                                <path d="M8 15a5 5 0 0 0 8 0"></path>
                            </svg>
                        </div>
                    ` : ''}
                    <div class="msg-bubble">
                        <p class="msg-text">${this.formatMarkdown(m.text)}</p>
                        <span class="msg-time">${m.time}</span>
                    </div>
                </div>
            `;
        }).join('');

        this.scrollToBottom();
    },

    formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');
    },

    showTypingIndicator(show) {
        const ind = document.getElementById('chat-typing-indicator');
        if (ind) ind.classList.toggle('hidden', !show);
        if (show) this.scrollToBottom();
    },

    scrollToBottom() {
        const container = document.getElementById('chat-messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    },

    getNowFormatted() {
        const d = new Date();
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    },

    bindEvents() {
        const trigger = document.getElementById('btn-chatbot-trigger');
        if (trigger) {
            trigger.addEventListener('click', () => this.toggleChat());
        }

        const closeBtn = document.getElementById('btn-close-chat');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggleChat());
        }

        const form = document.getElementById('chat-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('chat-input-text');
                if (input) this.sendMessage(input.value);
            });
        }

        // Quick prompt chips
        document.querySelectorAll('.chat-chip-prompt').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.getAttribute('data-prompt');
                this.sendMessage(prompt);
            });
        });
    }
};

window.ZooChatbot = ZooChatbot;
