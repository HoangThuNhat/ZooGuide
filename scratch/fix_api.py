with open('web/src/services/api.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('async getPoiPublicNarration')
if idx == -1:
    print('Not found')
    exit(1)

correct_code = """async getPoiPublicNarration(poiId, lang = 'vi', sessionId = null) {
        if (!sessionId) {
            return {
                success: false,
                unauthorized: true,
                message: 'Vui lòng kích hoạt vé tham quan hợp lệ để sử dụng chức năng thuyết minh.'
            };
        }
        try {
            const headers = {
                'Content-Type': 'application/json',
                'X-Session-Id': sessionId
            };
            const pId = encodeURIComponent(poiId);
            const l = encodeURIComponent(lang);
            const s = encodeURIComponent(sessionId);
            const url = API_CONFIG.BASE_URL + '/pois/' + pId + '/public-narration?lang=' + l + '&sessionId=' + s;
            const res = await fetch(url, { headers });
            if (res.status === 401) {
                return {
                    success: false,
                    unauthorized: true,
                    message: 'Phiên tham quan đã hết hạn hoặc không hợp lệ. Vui lòng kích hoạt lại vé.'
                };
            }
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || ('HTTP ' + res.status));
            }
            const data = await res.json();
            const item = data.data || data;
            if (item) {
                item.streamUrl = API_CONFIG.BASE_URL + '/pois/' + pId + '/stream?lang=' + l + '&sessionId=' + s;
            }
            return { success: true, data: item };
        } catch (err) {
            console.error('getPoiPublicNarration error:', err);
            return { success: false, error: err.message, message: err.message };
        }
    }
};
"""

new_text = text[:idx] + correct_code
with open('web/src/services/api.js', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(new_text)

print('FIXED API.JS!')
