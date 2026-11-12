/**
 * ZooGuide - Live Supabase API & Data Access Layer
 * Connects exclusively to ASP.NET Core API backed by Supabase PostgreSQL & Storage.
 * Strictly zero mock data, zero hardcoded fallback datasets, and zero fake audio/translations.
 */

export const API_CONFIG = {
    BASE_URL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api',
    TIMEOUT_MS: 12000
};

export const OFFLINE_CACHE_CONFIG = {
    PREFIX: 'zg_offline_tour_v1:',
    VERSION: '1.2.0',
    TTL_MS: 24 * 60 * 60 * 1000, // 24 hours TTL for public read-only tour data
    MAX_ENTRY_CHARS: 400000
};

function notifyApiStatus(reachable, extra = {}) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    try {
        window.dispatchEvent(new CustomEvent('zooguide:api-status', {
            detail: { reachable: Boolean(reachable), timestamp: Date.now(), ...extra }
        }));
    } catch {
        // Ignore event dispatch errors in non-DOM test environments
    }
}

function saveOfflineTourCache(cacheKey, data) {
    if (typeof window === 'undefined' || !window.localStorage || !cacheKey) return false;
    try {
        const payload = JSON.stringify({
            version: OFFLINE_CACHE_CONFIG.VERSION,
            cachedAt: Date.now(),
            data
        });
        if (payload.length > OFFLINE_CACHE_CONFIG.MAX_ENTRY_CHARS) {
            return false;
        }
        window.localStorage.setItem(`${OFFLINE_CACHE_CONFIG.PREFIX}${cacheKey}`, payload);
        return true;
    } catch {
        return false;
    }
}

function readOfflineTourCache(cacheKey) {
    if (typeof window === 'undefined' || !window.localStorage || !cacheKey) return null;
    const storageKey = `${OFFLINE_CACHE_CONFIG.PREFIX}${cacheKey}`;
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (
            !parsed ||
            parsed.version !== OFFLINE_CACHE_CONFIG.VERSION ||
            typeof parsed.cachedAt !== 'number' ||
            Date.now() - parsed.cachedAt > OFFLINE_CACHE_CONFIG.TTL_MS
        ) {
            window.localStorage.removeItem(storageKey);
            return null;
        }
        if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('zooguide:offline-data-used', {
                detail: { key: cacheKey, cachedAt: parsed.cachedAt }
            }));
        }
        return { data: parsed.data, cachedAt: parsed.cachedAt };
    } catch {
        return null;
    }
}

export function pruneOfflineTourCache() {
    if (typeof window === 'undefined' || !window.localStorage) return 0;
    let removed = 0;
    try {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (!k || !k.startsWith(OFFLINE_CACHE_CONFIG.PREFIX)) continue;
            try {
                const parsed = JSON.parse(window.localStorage.getItem(k) || 'null');
                if (
                    !parsed ||
                    parsed.version !== OFFLINE_CACHE_CONFIG.VERSION ||
                    typeof parsed.cachedAt !== 'number' ||
                    Date.now() - parsed.cachedAt > OFFLINE_CACHE_CONFIG.TTL_MS
                ) {
                    keysToRemove.push(k);
                }
            } catch {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach((k) => {
            window.localStorage.removeItem(k);
            removed++;
        });
    } catch {
        // Ignore storage access errors
    }
    return removed;
}

export function getOfflineTourCacheSummary() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return { entries: [], totalEntries: 0, totalBytes: 0, version: OFFLINE_CACHE_CONFIG.VERSION };
    }
    const entries = [];
    let totalBytes = 0;
    try {
        for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (!k || !k.startsWith(OFFLINE_CACHE_CONFIG.PREFIX)) continue;
            const raw = window.localStorage.getItem(k) || '';
            totalBytes += raw.length;
            try {
                const parsed = JSON.parse(raw);
                entries.push({
                    key: k.slice(OFFLINE_CACHE_CONFIG.PREFIX.length),
                    version: parsed?.version || 'unknown',
                    cachedAt: parsed?.cachedAt || null,
                    itemCount: Array.isArray(parsed?.data) ? parsed.data.length : (parsed?.data ? 1 : 0),
                    sizeBytes: raw.length
                });
            } catch {
                // Ignore malformed entry
            }
        }
    } catch {
        // Ignore storage access errors
    }
    return {
        entries,
        totalEntries: entries.length,
        totalBytes,
        version: OFFLINE_CACHE_CONFIG.VERSION,
        ttlHours: OFFLINE_CACHE_CONFIG.TTL_MS / 3600000
    };
}

export function clearOfflineTourCache() {
    if (typeof window === 'undefined' || !window.localStorage) return 0;
    let cleared = 0;
    try {
        const keys = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && k.startsWith(OFFLINE_CACHE_CONFIG.PREFIX)) {
                keys.push(k);
            }
        }
        keys.forEach((k) => {
            window.localStorage.removeItem(k);
            cleared++;
        });
    } catch {
        // Ignore storage errors
    }
    return cleared;
}

// Automatically prune stale or outdated offline tour cache entries on module load
pruneOfflineTourCache();

export const AUTH_STORAGE_KEY = 'zooguide_admin_auth_token';
export const AUTH_USER_KEY = 'zooguide_admin_user_profile';
export const AUTH_SESSION_META_KEY = 'zooguide_admin_session_meta';
export const AUTH_BROADCAST_CHANNEL = 'zooguide_admin_auth_channel';

export const ADMIN_INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 phút không thao tác
export const ADMIN_ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 giờ tối đa kể từ lúc đăng nhập
const ACTIVITY_WRITE_THROTTLE_MS = 1000;

let authBroadcastChannel = null;
function getAuthBroadcastChannel() {
    if (typeof window === 'undefined' || typeof window.BroadcastChannel !== 'function') {
        return null;
    }
    if (!authBroadcastChannel) {
        try {
            authBroadcastChannel = new window.BroadcastChannel(AUTH_BROADCAST_CHANNEL);
        } catch {
            authBroadcastChannel = null;
        }
    }
    return authBroadcastChannel;
}

export function broadcastAdminAuthEvent(payload) {
    const channel = getAuthBroadcastChannel();
    if (!channel) return;
    try {
        channel.postMessage({ ...payload, timestamp: Date.now() });
    } catch {
        // Ignore broadcast errors
    }
}

export function decodeJwtPayload(token) {
    if (!token || typeof token !== 'string') return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const jsonStr = typeof atob === 'function'
            ? decodeURIComponent(
                Array.prototype.map
                    .call(atob(padded), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            )
            : '';
        return jsonStr ? JSON.parse(jsonStr) : null;
    } catch {
        return null;
    }
}

export function getAdminSessionMeta() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
        const raw = window.localStorage.getItem(AUTH_SESSION_META_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (
            !parsed ||
            typeof parsed.loginAt !== 'number' ||
            typeof parsed.absoluteExpiresAt !== 'number' ||
            typeof parsed.lastActivityAt !== 'number' ||
            !Number.isFinite(parsed.loginAt) ||
            !Number.isFinite(parsed.absoluteExpiresAt) ||
            !Number.isFinite(parsed.lastActivityAt)
        ) {
            return null;
        }
        // Không bao giờ cho phép absoluteExpiresAt vượt quá 8 giờ kể từ loginAt
        const maxAllowedAbsolute = parsed.loginAt + ADMIN_ABSOLUTE_TIMEOUT_MS;
        const clampedAbsoluteExpiresAt = Math.min(parsed.absoluteExpiresAt, maxAllowedAbsolute);
        return {
            loginAt: parsed.loginAt,
            absoluteExpiresAt: clampedAbsoluteExpiresAt,
            lastActivityAt: parsed.lastActivityAt
        };
    } catch {
        return null;
    }
}

export function checkAdminSessionValidity(now = Date.now()) {
    if (typeof window === 'undefined' || !window.localStorage) {
        return { valid: false, reason: 'no_storage' };
    }
    try {
        const rawToken = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (!rawToken) {
            return { valid: false, reason: 'no_token' };
        }

        const payload = decodeJwtPayload(rawToken);
        if (!payload) {
            return { valid: false, reason: 'invalid_token' };
        }

        // Kiểm tra hạn JWT chuẩn (exp) và hạn tuyệt đối từ claim (abs_exp)
        if (typeof payload.exp === 'number' && now >= payload.exp * 1000) {
            return { valid: false, reason: 'absolute_timeout' };
        }
        if (typeof payload.abs_exp === 'number' && now >= payload.abs_exp * 1000) {
            return { valid: false, reason: 'absolute_timeout' };
        }
        if (typeof payload.iat === 'number' && now - payload.iat * 1000 >= ADMIN_ABSOLUTE_TIMEOUT_MS) {
            return { valid: false, reason: 'absolute_timeout' };
        }

        let meta = getAdminSessionMeta();
        if (!meta) {
            return { valid: false, reason: 'session_expired' };
        }

        // Giữ nguyên mốc loginAt của phiên nhưng không cho phép vượt quá hạn JWT hoặc giới hạn tuyệt đối 8 giờ
        const jwtExpMs = typeof payload.exp === 'number' ? payload.exp * 1000 : meta.absoluteExpiresAt;
        const effectiveLoginAt = meta.loginAt;
        const effectiveAbsoluteExpiresAt = Math.min(
            meta.absoluteExpiresAt,
            effectiveLoginAt + ADMIN_ABSOLUTE_TIMEOUT_MS,
            jwtExpMs
        );

        // Điều kiện B: Absolute Session Timeout (8 giờ) - kiểm tra độc lập
        if (now >= effectiveAbsoluteExpiresAt || now - effectiveLoginAt >= ADMIN_ABSOLUTE_TIMEOUT_MS) {
            return { valid: false, reason: 'absolute_timeout' };
        }

        // Điều kiện A: Inactivity Timeout (15 phút) - kiểm tra độc lập
        if (now - meta.lastActivityAt >= ADMIN_INACTIVITY_TIMEOUT_MS) {
            return { valid: false, reason: 'inactivity_timeout' };
        }

        return {
            valid: true,
            reason: null,
            meta: {
                loginAt: effectiveLoginAt,
                absoluteExpiresAt: effectiveAbsoluteExpiresAt,
                lastActivityAt: meta.lastActivityAt
            },
            remainingInactivityMs: Math.max(0, ADMIN_INACTIVITY_TIMEOUT_MS - (now - meta.lastActivityAt)),
            remainingAbsoluteMs: Math.max(0, effectiveAbsoluteExpiresAt - now)
        };
    } catch {
        return { valid: false, reason: 'session_expired' };
    }
}

export function clearAuthSession(options = {}) {
    const { broadcast = false, reason = 'manual_logout' } = options;
    try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(AUTH_SESSION_META_KEY);
    } catch (e) {
        console.warn('Cannot clear auth session:', e);
    }
    if (broadcast) {
        broadcastAdminAuthEvent({ type: 'ADMIN_SESSION_ENDED', reason });
    }
}

export function expireAdminSession(reason = 'session_expired') {
    let rawToken = null;
    try {
        rawToken = localStorage.getItem(AUTH_STORAGE_KEY);
    } catch {
        rawToken = null;
    }

    clearAuthSession({ broadcast: true, reason });

    // Thu hồi phiên trên Backend nếu vẫn còn giữ token trước khi xóa
    if (rawToken && typeof fetch === 'function') {
        fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${rawToken}` }
        }).catch(() => {});
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('zooguide:unauthorized', { detail: { reason } }));
    }
}

export function recordAdminActivity(force = false) {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const now = Date.now();
    const validity = checkAdminSessionValidity(now);
    if (!validity.valid) {
        if (validity.reason && validity.reason !== 'no_token' && validity.reason !== 'no_storage') {
            expireAdminSession(validity.reason);
        }
        return false;
    }

    const currentMeta = validity.meta;
    if (!force && now - currentMeta.lastActivityAt < ACTIVITY_WRITE_THROTTLE_MS) {
        return true;
    }

    // Chỉ cập nhật lastActivityAt, tuyệt đối KHÔNG thay đổi loginAt và absoluteExpiresAt
    const updatedMeta = {
        loginAt: currentMeta.loginAt,
        absoluteExpiresAt: currentMeta.absoluteExpiresAt,
        lastActivityAt: now
    };

    try {
        window.localStorage.setItem(AUTH_SESSION_META_KEY, JSON.stringify(updatedMeta));
        broadcastAdminAuthEvent({
            type: 'ADMIN_ACTIVITY',
            lastActivityAt: now,
            loginAt: updatedMeta.loginAt,
            absoluteExpiresAt: updatedMeta.absoluteExpiresAt
        });
        return true;
    } catch {
        return false;
    }
}

export function getAuthToken() {
    try {
        const rawToken = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!rawToken) return null;

        const validity = checkAdminSessionValidity();
        if (!validity.valid) {
            expireAdminSession(validity.reason || 'session_expired');
            return null;
        }
        return rawToken;
    } catch {
        return null;
    }
}

export function setAuthSession(token, user, options = {}) {
    const { isNewLogin = false, expiresAt = null } = options;
    try {
        if (token) {
            localStorage.setItem(AUTH_STORAGE_KEY, token);
            const existingMeta = getAdminSessionMeta();
            const now = Date.now();
            const payload = decodeJwtPayload(token);
            const jwtIatMs = typeof payload?.iat === 'number' ? payload.iat * 1000 : now;
            const jwtExpMs = typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
            const serverExpMs = expiresAt ? new Date(expiresAt).getTime() : null;

            if (isNewLogin || !existingMeta) {
                const loginAt = isNewLogin ? now : jwtIatMs;
                let absoluteExpiresAt = loginAt + ADMIN_ABSOLUTE_TIMEOUT_MS;
                if (jwtExpMs && Number.isFinite(jwtExpMs)) {
                    absoluteExpiresAt = Math.min(absoluteExpiresAt, jwtExpMs);
                }
                if (serverExpMs && Number.isFinite(serverExpMs)) {
                    absoluteExpiresAt = Math.min(absoluteExpiresAt, serverExpMs);
                }
                const newMeta = {
                    loginAt,
                    absoluteExpiresAt,
                    lastActivityAt: isNewLogin ? now : (existingMeta?.lastActivityAt || now)
                };
                localStorage.setItem(AUTH_SESSION_META_KEY, JSON.stringify(newMeta));
                if (isNewLogin) {
                    broadcastAdminAuthEvent({
                        type: 'ADMIN_LOGIN',
                        meta: newMeta
                    });
                }
            }
        }
        if (user) {
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        }
    } catch (e) {
        console.warn('Cannot write auth session to localStorage:', e);
    }
}

export function getStoredUser() {
    try {
        if (!getAuthToken()) return null;
        const raw = localStorage.getItem(AUTH_USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function getAuthHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function authFetch(url, options = {}) {
    // Kiểm tra tính hợp lệ của phiên trước khi gửi request
    const validity = checkAdminSessionValidity();
    if (!validity.valid) {
        const reason = validity.reason && validity.reason !== 'no_token' ? validity.reason : 'session_expired';
        expireAdminSession(reason);
        return new Response(
            JSON.stringify({
                success: false,
                message: 'Phiên làm việc quản trị đã hết hạn. Vui lòng đăng nhập lại.'
            }),
            {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    const headers = getAuthHeaders(options.headers || {});
    const res = await fetch(url, { ...options, headers });
    // Chỉ thu hồi phiên khi 401 Unauthorized; với 403 Forbidden (ví dụ Staff gọi API chỉ dành cho Admin) giữ nguyên phiên
    if (res.status === 401) {
        expireAdminSession('session_expired');
    }
    return res;
}

const AREA_COLORS = {
    'A': '#15803D',
    'B': '#B45309',
    'C': '#059669',
    'D': '#0284C7',
    'E': '#7C3AED'
};

function mapAnimalDto(a) {
    const id = a.animalId || a.id;
    const displayName = a.name || a.nameVi || '';
    const originalName = a.nameVi || a.name || '';
    const desc = a.description || a.conservationNote || '';
    const weightStr = a.weight || (a.weightKg != null ? `${a.weightKg} kg` : '');
    return {
        id,
        animalId: id,
        code: a.code || `ANI-${String(id).padStart(3, '0')}`,
        name: displayName,
        nameVi: originalName,
        nameEn: displayName,
        scientificName: a.scientificName || a.species?.scientificName || a.speciesName || '',
        speciesId: a.speciesId || a.species?.speciesId || null,
        species: a.speciesName || a.species?.name || a.species || '',
        speciesName: a.speciesName || a.species?.name || a.species || '',
        areaId: a.areaId,
        zoneId: a.zoneId || (a.areaId ? `zone-${String.fromCharCode(96 + a.areaId)}` : 'zone-a'),
        zoneCode: a.zoneCode || (a.areaId ? String.fromCharCode(64 + a.areaId) : 'A'),
        zoneName: a.areaName || a.area?.name || '',
        enclosureId: a.enclosureId,
        enclosureName: a.enclosureName || a.enclosure?.name || '',
        enclosureCode: a.enclosureCode || a.enclosure?.code || '',
        imageUrl: a.imageUrl || a.species?.imageUrl || '',
        origin: a.origin || a.habitat || '',
        habitat: a.habitat || a.origin || '',
        diet: a.diet || '',
        lifespan: a.lifespan || '',
        weight: weightStr,
        weightKg: a.weightKg != null ? Number(a.weightKg) : null,
        temperatureC: a.temperatureC != null ? Number(a.temperatureC) : null,
        veterinarianName: a.veterinarianName || '',
        healthActionRequired: a.healthActionRequired || '',
        lastHealthCheckAt: a.lastHealthCheckAt || null,
        iucnStatus: a.conservationStatus || a.species?.conservationStatus || '',
        conservationStatus: a.conservationStatus || a.species?.conservationStatus || '',
        healthStatus: a.healthStatus || '',
        breedingStatus: a.breedingStatus || '',
        gender: a.gender || 'Unknown',
        status: a.status || 'Active',
        description: desc,
        conservationNote: a.conservationNote || '',
        referenceSource: a.referenceSource || a.species?.referenceSource || '',
        languageCode: a.languageCode || 'vi',
        hasTranslation: a.hasTranslation !== false,
        funFacts: desc ? [desc] : [],
        funFactsVi: desc ? [desc] : [],
        funFactsEn: desc ? [desc] : [],
        area: a.area || null,
        enclosure: a.enclosure || null,
        speciesObj: a.species || null
    };
}

export const ZooApi = {
    // AUTHENTICATION & ADMIN ROLES
    async login(username, password) {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.success) {
                return {
                    success: false,
                    status: res.status,
                    message: json?.message || (res.status === 401 ? 'Tên đăng nhập hoặc mật khẩu không chính xác.' : 'Đăng nhập không thành công.')
                };
            }
            if (json.data?.token) {
                setAuthSession(json.data.token, json.data.user, {
                    isNewLogin: true,
                    expiresAt: json.data.expiresAt
                });
            }
            return {
                success: true,
                data: json.data,
                user: json.data?.user,
                token: json.data?.token,
                message: json.message
            };
        } catch (err) {
            console.error('ZooApi.login error:', err);
            return { success: false, message: 'Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra lại mạng.' };
        }
    },

    async getCurrentUser() {
        try {
            const token = getAuthToken();
            if (!token) return { success: false, status: 401, message: 'Chưa đăng nhập hoặc phiên đã hết hạn' };

            const res = await authFetch(`${API_CONFIG.BASE_URL}/auth/me`);
            if (!res.ok) {
                if (res.status === 401 || res.status === 404) {
                    clearAuthSession({ broadcast: true, reason: 'session_expired' });
                }
                return { success: false, status: res.status };
            }
            const json = await res.json();
            if (json.data) {
                setAuthSession(token, json.data, { isNewLogin: false });
            }
            return { success: true, data: json.data, user: json.data };
        } catch (err) {
            console.error('ZooApi.getCurrentUser error:', err);
            return { success: false, message: err.message };
        }
    },

    async logout(options = {}) {
        const reason = options.reason || 'manual_logout';
        try {
            let rawToken = null;
            try {
                rawToken = localStorage.getItem(AUTH_STORAGE_KEY);
            } catch {
                rawToken = null;
            }
            if (rawToken) {
                await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${rawToken}` }
                }).catch(() => {});
            }
        } finally {
            clearAuthSession({ broadcast: true, reason });
        }
        return { success: true };
    },

    isAuthenticated() {
        return checkAdminSessionValidity().valid;
    },

    getStoredUser() {
        return getStoredUser();
    },

    checkAdminSessionValidity,
    recordAdminActivity,
    getAdminSessionMeta,
    expireAdminSession,

    // 0. HEALTH CHECK
    async checkHealth() {
        try {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 5000) : null;
            const res = await fetch(`${API_CONFIG.BASE_URL}/health`, controller ? { signal: controller.signal } : undefined);
            if (timeoutId) clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            notifyApiStatus(true, { status: data?.status || 'Healthy' });
            return data;
        } catch (err) {
            notifyApiStatus(false, { error: err.message });
            return { status: 'Unhealthy', databaseConnected: false, error: err.message };
        }
    },
    getOfflineTourCacheSummary,
    clearOfflineTourCache,
    pruneOfflineTourCache,

    // 1. TICKET & SESSION
    async validateTicket(ticketCode) {
        if (!ticketCode || !ticketCode.trim()) {
            return { success: false, message: 'Vui lòng nhập mã vé hợp lệ.' };
        }

        const normalizedCode = ticketCode.trim().toUpperCase();

        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/tickets/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketCode: normalizedCode })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                return {
                    success: false,
                    message: errorData?.message || `Không thể xác thực vé (HTTP ${res.status}).`
                };
            }

            const data = await res.json();
            if (data.valid) {
                const session = {
                    sessionId: data.sessionId,
                    ticketCode: data.ticketCode || normalizedCode,
                    customerName: data.customerName || 'Khách tham quan',
                    ticketType: data.ticketTypeName || 'Vé điện tử',
                    validDate: data.validUntil ? data.validUntil.split('T')[0] : new Date().toISOString().split('T')[0],
                    zonesAllowed: ['ALL'],
                    hasAudioGuide: true,
                    activatedAt: new Date().toISOString(),
                    expiresAt: data.validUntil || new Date(Date.now() + 8 * 3600 * 1000).toISOString()
                };
                return {
                    success: true,
                    message: data.message || 'Xác thực vé thành công! Phiên tham quan đã được mở khóa.',
                    session
                };
            }
            return { success: false, message: data.message || 'Vé không hợp lệ.' };
        } catch (err) {
            console.error('validateTicket API error:', err);
            return { success: false, message: 'Không thể kết nối đến máy chủ vé. Vui lòng thử lại sau.' };
        }
    },

    // 2. GET AREAS
    async getAreas(lang = 'vi') {
        const cacheKey = `areas:${lang || 'vi'}`;
        try {
            const qs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
            const res = await fetch(`${API_CONFIG.BASE_URL}/areas${qs}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const rawList = Array.isArray(json) ? json : (json.data || []);

            const mapped = rawList.map(a => {
                const code = a.code || (a.areaId ? String.fromCharCode(64 + a.areaId) : 'A');
                return {
                    id: a.id || `zone-${code.toLowerCase()}`,
                    areaId: a.areaId,
                    code,
                    name: a.name,
                    nameVi: a.nameVi || a.name,
                    nameEn: a.name,
                    description: a.description || '',
                    descriptionVi: a.descriptionVi || a.description || '',
                    descriptionEn: a.description || '',
                    latitude: a.latitude,
                    longitude: a.longitude,
                    radiusMeters: a.radiusMeters,
                    mapX: a.mapX != null ? Number(a.mapX) : null,
                    mapY: a.mapY != null ? Number(a.mapY) : null,
                    mapCoords: {
                        x: a.mapX != null ? Number(a.mapX) : 400,
                        y: a.mapY != null ? Number(a.mapY) : 300,
                        radius: a.radiusMeters || 90
                    },
                    color: AREA_COLORS[code] || '#475569',
                    status: a.status || 'Active',
                    referenceSource: a.referenceSource || '',
                    languageCode: a.languageCode || lang,
                    hasTranslation: a.hasTranslation !== false,
                    enclosureCount: a.enclosureCount != null ? a.enclosureCount : (a.enclosures ? a.enclosures.length : 0),
                    animalCount: a.animalCount || 0,
                    enclosures: (a.enclosures || []).map(e => ({
                        id: e.enclosureId || e.id,
                        enclosureId: e.enclosureId || e.id,
                        areaId: e.areaId,
                        code: e.code,
                        name: e.name,
                        nameVi: e.nameVi || e.name,
                        description: e.description || '',
                        imageUrl: e.imageUrl || '',
                        status: e.status || 'Active',
                        referenceSource: e.referenceSource || '',
                        languageCode: e.languageCode || lang,
                        hasTranslation: e.hasTranslation !== false,
                        mapX: e.mapX != null ? Number(e.mapX) : null,
                        mapY: e.mapY != null ? Number(e.mapY) : null,
                        animalCount: e.animalCount || (e.animals ? e.animals.length : 0),
                        animals: (e.animals || []).map(mapAnimalDto)
                    }))
                };
            });

            saveOfflineTourCache(cacheKey, mapped);
            notifyApiStatus(true);
            return { success: true, count: mapped.length, data: mapped, fromOfflineCache: false };
        } catch (err) {
            console.error('ZooApi.getAreas error:', err);
            notifyApiStatus(false, { error: err.message });
            const cached = readOfflineTourCache(cacheKey) || readOfflineTourCache('areas:vi');
            if (cached && Array.isArray(cached.data)) {
                return {
                    success: true,
                    count: cached.data.length,
                    data: cached.data,
                    fromOfflineCache: true,
                    cachedAt: cached.cachedAt
                };
            }
            return { success: false, data: [], message: 'Không thể tải danh sách khu vực từ cơ sở dữ liệu.' };
        }
    },

    // 2.1 GET ENCLOSURES (Chuồng Trại)
    async getEnclosures(filters = {}) {
        const lang = filters.lang || 'vi';
        const cacheKey = `enclosures:${filters.areaId || 'all'}:${filters.status || 'all'}:${lang}`;
        try {
            const params = new URLSearchParams();
            if (filters.areaId) params.append('areaId', filters.areaId);
            if (filters.search) params.append('search', filters.search);
            if (filters.status) params.append('status', filters.status);
            if (filters.lang) params.append('lang', filters.lang);
            const qs = params.toString() ? `?${params.toString()}` : '';

            const res = await fetch(`${API_CONFIG.BASE_URL}/enclosures${qs}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const rawList = Array.isArray(json) ? json : (json.data || []);

            const mapped = rawList.map(e => ({
                id: e.enclosureId || e.id,
                enclosureId: e.enclosureId || e.id,
                areaId: e.areaId,
                areaName: e.areaName || '',
                areaCode: e.areaCode || '',
                code: e.code || '',
                name: e.name || '',
                nameVi: e.nameVi || e.name || '',
                description: e.description || '',
                imageUrl: e.imageUrl || '',
                status: e.status || 'Active',
                referenceSource: e.referenceSource || '',
                languageCode: e.languageCode || filters.lang || 'vi',
                hasTranslation: e.hasTranslation !== false,
                mapX: e.mapX != null ? Number(e.mapX) : null,
                mapY: e.mapY != null ? Number(e.mapY) : null,
                animalCount: e.animalCount || (e.animals ? e.animals.length : 0),
                animals: (e.animals || []).map(mapAnimalDto)
            }));

            if (!filters.search) {
                saveOfflineTourCache(cacheKey, mapped);
            }
            notifyApiStatus(true);
            return { success: true, count: mapped.length, data: mapped, fromOfflineCache: false };
        } catch (err) {
            console.error('ZooApi.getEnclosures error:', err);
            notifyApiStatus(false, { error: err.message });
            const cached = readOfflineTourCache(cacheKey) || readOfflineTourCache(`enclosures:all:all:${lang}`) || readOfflineTourCache('enclosures:all:all:vi');
            if (cached && Array.isArray(cached.data)) {
                let list = cached.data;
                if (filters.areaId) list = list.filter(item => Number(item.areaId) === Number(filters.areaId));
                if (filters.status) list = list.filter(item => item.status === filters.status);
                if (filters.search) {
                    const q = String(filters.search).toLowerCase();
                    list = list.filter(item =>
                        (item.name || '').toLowerCase().includes(q) ||
                        (item.code || '').toLowerCase().includes(q)
                    );
                }
                return {
                    success: true,
                    count: list.length,
                    data: list,
                    fromOfflineCache: true,
                    cachedAt: cached.cachedAt
                };
            }
            return { success: false, data: [], message: 'Không thể tải danh sách chuồng nuôi từ máy chủ.' };
        }
    },

    async getEnclosureById(id, lang = 'vi') {
        try {
            const qs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
            const res = await fetch(`${API_CONFIG.BASE_URL}/enclosures/${id}${qs}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const e = json.data || json;
            return {
                success: true,
                data: {
                    ...e,
                    id: e.enclosureId || e.id,
                    enclosureId: e.enclosureId || e.id,
                    animals: (e.animals || []).map(mapAnimalDto)
                }
            };
        } catch (err) {
            console.error('ZooApi.getEnclosureById error:', err);
            return { success: false, message: 'Không thể tải chi tiết chuồng nuôi.' };
        }
    },

    async createEnclosure(data) {
        try {
            const reqData = {
                areaId: parseInt(data.areaId),
                code: data.code?.trim() || null,
                name: data.name?.trim(),
                description: data.description?.trim() || '',
                imageUrl: data.imageUrl?.trim() || '',
                status: data.status || 'Active',
                mapX: data.mapX ? parseFloat(data.mapX) : null,
                mapY: data.mapY ? parseFloat(data.mapY) : null
            };
            const res = await authFetch(`${API_CONFIG.BASE_URL}/enclosures`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || 'Lỗi tạo chuồng trại');
            }
            const created = await res.json();
            return { success: true, data: created.data || created };
        } catch (err) {
            console.error('createEnclosure error:', err);
            return { success: false, error: err.message, message: err.message };
        }
    },

    async updateEnclosure(id, data) {
        try {
            const reqData = {
                areaId: parseInt(data.areaId),
                code: data.code?.trim() || null,
                name: data.name?.trim(),
                description: data.description?.trim() || '',
                imageUrl: data.imageUrl?.trim() || '',
                status: data.status || 'Active',
                mapX: data.mapX ? parseFloat(data.mapX) : null,
                mapY: data.mapY ? parseFloat(data.mapY) : null
            };
            const res = await authFetch(`${API_CONFIG.BASE_URL}/enclosures/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || 'Lỗi cập nhật chuồng');
            }
            const updated = await res.json();
            return { success: true, data: updated.data || updated };
        } catch (err) {
            console.error('updateEnclosure error:', err);
            return { success: false, error: err.message, message: err.message };
        }
    },

    async deleteEnclosure(id) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/enclosures/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || 'Lỗi xóa chuồng');
            }
            return { success: true };
        } catch (err) {
            console.error('deleteEnclosure error:', err);
            return { success: false, error: err.message, message: err.message };
        }
    },

    async moveAnimalEnclosure(animalId, targetEnclosureId) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/enclosures/move-animal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    animalId: parseInt(animalId),
                    targetEnclosureId: targetEnclosureId ? parseInt(targetEnclosureId) : null
                })
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || 'Lỗi chuyển chuồng cho động vật');
            }
            const result = await res.json();
            return { success: true, message: result.message };
        } catch (err) {
            console.error('moveAnimalEnclosure error:', err);
            return { success: false, error: err.message, message: err.message };
        }
    },

    // 3. GET ANIMALS (with filters)
    async getAnimals(filters = {}) {
        const lang = filters.lang || 'vi';
        const cacheKey = `animals:${filters.areaId || 'all'}:${filters.enclosureId || 'all'}:${filters.zoneId || 'all'}:${filters.speciesId || 'all'}:${filters.iucnStatus || 'all'}:${lang}`;
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.areaId) params.append('areaId', filters.areaId);
            if (filters.enclosureId) params.append('enclosureId', filters.enclosureId);
            if (filters.zoneId && filters.zoneId !== 'all') params.append('zoneId', filters.zoneId);
            if (filters.speciesId) params.append('speciesId', filters.speciesId);
            if (filters.iucnStatus && filters.iucnStatus !== 'all') params.append('iucnStatus', filters.iucnStatus);
            if (filters.lang) params.append('lang', filters.lang);
            const qs = params.toString() ? `?${params.toString()}` : '';

            const res = await fetch(`${API_CONFIG.BASE_URL}/animals${qs}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const animalsData = await res.json();
            const rawList = Array.isArray(animalsData) ? animalsData : (animalsData.data || []);

            const results = rawList.map(mapAnimalDto);
            if (!filters.search) {
                saveOfflineTourCache(cacheKey, results);
            }
            notifyApiStatus(true);
            return { success: true, count: results.length, data: results, fromOfflineCache: false };
        } catch (err) {
            console.error('Live API /animals error:', err);
            notifyApiStatus(false, { error: err.message });
            const cached =
                readOfflineTourCache(cacheKey) ||
                readOfflineTourCache(`animals:all:all:all:all:all:${lang}`) ||
                readOfflineTourCache('animals:all:all:all:all:all:vi');
            if (cached && Array.isArray(cached.data)) {
                let list = cached.data;
                if (filters.areaId) list = list.filter(a => Number(a.areaId) === Number(filters.areaId));
                if (filters.enclosureId) list = list.filter(a => Number(a.enclosureId) === Number(filters.enclosureId));
                if (filters.zoneId && filters.zoneId !== 'all') list = list.filter(a => a.zoneId === filters.zoneId);
                if (filters.speciesId) list = list.filter(a => Number(a.speciesId) === Number(filters.speciesId));
                if (filters.iucnStatus && filters.iucnStatus !== 'all') list = list.filter(a => a.iucnStatus === filters.iucnStatus);
                if (filters.search) {
                    const q = String(filters.search).toLowerCase();
                    list = list.filter(a =>
                        (a.name || '').toLowerCase().includes(q) ||
                        (a.scientificName || '').toLowerCase().includes(q) ||
                        (a.species || '').toLowerCase().includes(q)
                    );
                }
                return {
                    success: true,
                    count: list.length,
                    data: list,
                    fromOfflineCache: true,
                    cachedAt: cached.cachedAt
                };
            }
            return { success: false, data: [], message: 'Không thể kết nối đến máy chủ danh sách động vật.' };
        }
    },

    // 4. GET ANIMAL BY ID
    async getAnimalById(id, lang = 'vi') {
        try {
            const qs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
            const res = await fetch(`${API_CONFIG.BASE_URL}/animals/${id}${qs}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const a = json.data || json;
            notifyApiStatus(true);
            return { success: true, data: mapAnimalDto(a), fromOfflineCache: false };
        } catch (err) {
            console.error('ZooApi.getAnimalById error:', err);
            notifyApiStatus(false, { error: err.message });
            const cached = readOfflineTourCache(`animals:all:all:all:all:all:${lang || 'vi'}`) || readOfflineTourCache('animals:all:all:all:all:all:vi');
            if (cached && Array.isArray(cached.data)) {
                const found = cached.data.find(item => Number(item.id) === Number(id) || Number(item.animalId) === Number(id));
                if (found) {
                    return { success: true, data: found, fromOfflineCache: true, cachedAt: cached.cachedAt };
                }
            }
            return { success: false, message: 'Không tìm thấy hồ sơ động vật.' };
        }
    },

    // 5. GET SPECIES NARRATION BY SPECIES ID & LANG
    async getSpeciesNarration(speciesId, lang = 'vi', sessionId = null) {
        const sId = parseInt(speciesId);

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
            const res = await fetch(
                `${API_CONFIG.BASE_URL}/narrations/species/${sId}?lang=${encodeURIComponent(lang)}&sessionId=${encodeURIComponent(sessionId)}`,
                { headers }
            );

            if (res.status === 401) {
                return {
                    success: false,
                    unauthorized: true,
                    message: 'Phiên tham quan đã hết hạn hoặc bị thu hồi. Vui lòng kích hoạt lại vé tham quan.'
                };
            }

            if (res.status === 404) {
                const errJson = await res.json().catch(() => null);
                return {
                    success: false,
                    notFound: true,
                    languageCode: lang,
                    message: errJson?.message || `Hiện chưa có bài thuyết minh xuất bản cho loài #${sId} bằng ngôn ngữ '${lang}'.`
                };
            }

            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || `HTTP ${res.status}`);
            }

            const json = await res.json();
            const n = json.data || json;
            if (!n) {
                return {
                    success: false,
                    notFound: true,
                    languageCode: lang,
                    message: `Chưa có bài thuyết minh cho loài #${sId} ở ngôn ngữ '${lang}'.`
                };
            }

            const primaryAudio = n.audios && n.audios.length > 0 ? n.audios[0] : null;
            const publicAudioUrl = primaryAudio?.publicUrl || n.publicUrl || (primaryAudio?.fileUrl && primaryAudio.fileUrl.startsWith('http') ? primaryAudio.fileUrl : null) || (n.audioUrl && n.audioUrl.startsWith('http') ? n.audioUrl : null);
            const hasRealAudio = Boolean(n.hasAudio || n.audioUrl || publicAudioUrl);
            const streamUrl = hasRealAudio
                ? `${API_CONFIG.BASE_URL}/narrations/${n.narrationId}/stream?sessionId=${encodeURIComponent(sessionId)}`
                : null;
            const durationSec = n.durationSeconds || 0;
            const paragraphs = (n.content || '')
                .split(/\n+/)
                .map(p => p.trim())
                .filter(Boolean);
            const stepSec = paragraphs.length > 0 && durationSec > 0
                ? Math.max(5, Math.floor(durationSec / paragraphs.length))
                : 10;

            return {
                success: true,
                data: {
                    narrationId: n.narrationId,
                    animalId: n.animalId,
                    speciesId: n.speciesId || sId,
                    speciesName: n.speciesName || n.animalName || '',
                    animalName: n.animalName || '',
                    scientificName: n.scientificName || '',
                    conservationStatus: n.conservationStatus || '',
                    languageCode: n.languageCode || lang,
                    languageName: n.languageName || lang,
                    title: n.title,
                    narrator: n.voiceName || n.creatorName || 'ZooGuide Audio',
                    voiceName: n.voiceName || '',
                    ttsProvider: n.ttsProvider || '',
                    summary: n.content,
                    content: n.content,
                    durationSec,
                    durationFormatted: durationSec > 0
                        ? `${Math.floor(durationSec / 60).toString().padStart(2, '0')}:${(durationSec % 60).toString().padStart(2, '0')}`
                        : '--:--',
                    hasAudio: hasRealAudio,
                    audioSrc: publicAudioUrl || streamUrl,
                    audioUrl: publicAudioUrl || n.audioUrl || null,
                    publicUrl: publicAudioUrl || n.publicUrl || null,
                    storageBucket: n.storageBucket || null,
                    objectPath: n.objectPath || null,
                    referenceSource: n.referenceSource || '',
                    imageUrl: n.animalImageUrl || '',
                    transcript: paragraphs.length > 0
                        ? paragraphs.map((text, idx) => ({ time: idx * stepSec, text }))
                        : [{ time: 0, text: n.content || n.title }],
                    isFallbackLanguage: Boolean(n.isFallbackLanguage),
                    originalRequestedLanguage: n.originalRequestedLanguage || null,
                    fallbackMessage: n.fallbackMessage || null,
                }
            };
        } catch (err) {
            console.error('getSpeciesNarration error:', err);
            return {
                success: false,
                message: err.message || 'Không thể tải dữ liệu thuyết minh từ máy chủ.'
            };
        }
    },

    // 5b. GET NARRATION BY TARGET ID (Species ID or Animal's Species ID)
    async getNarration(targetId, lang = 'vi', sessionId = null) {
        const id = parseInt(targetId);
        return this.getSpeciesNarration(id, lang, sessionId);
    },

    // 5c. GET NARRATION BY ANIMAL ID DIRECTLY
    async getAnimalNarration(animalId, lang = 'vi', sessionId = null) {
        try {
            const aId = parseInt(animalId);
            if (!sessionId) {
                try {
                    const raw = localStorage.getItem('zooguide_session_v1') || sessionStorage.getItem('zooguide_session_v1');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed?.sessionId && new Date(parsed.expiresAt) > new Date()) {
                            sessionId = parsed.sessionId;
                        }
                    }
                } catch (e) {}
            }
            if (!sessionId) {
                return {
                    success: false,
                    unauthorized: true,
                    message: 'Bạn cần có vé tham quan hợp lệ để nghe thuyết minh.'
                };
            }
            const headers = { 'X-Session-Id': sessionId };
            const res = await fetch(
                `${API_CONFIG.BASE_URL}/narrations/animal/${aId}?lang=${encodeURIComponent(lang)}&sessionId=${encodeURIComponent(sessionId)}`,
                { headers }
            );
            if (!res.ok) {
                return this.getSpeciesNarration(aId, lang, sessionId);
            }
            const json = await res.json();
            const n = json.data || json;
            if (!n) return this.getSpeciesNarration(aId, lang, sessionId);
            const primaryAudio = n.audios && n.audios.length > 0 ? n.audios[0] : null;
            const publicAudioUrl = primaryAudio?.publicUrl || n.publicUrl || (primaryAudio?.fileUrl && primaryAudio.fileUrl.startsWith('http') ? primaryAudio.fileUrl : null) || (n.audioUrl && n.audioUrl.startsWith('http') ? n.audioUrl : null);
            const hasRealAudio = Boolean(n.hasAudio || n.audioUrl || publicAudioUrl);
            const streamUrl = hasRealAudio
                ? `${API_CONFIG.BASE_URL}/narrations/${n.narrationId}/stream?sessionId=${encodeURIComponent(sessionId)}`
                : null;
            const durationSec = n.durationSeconds || 0;
            const paragraphs = (n.content || '')
                .split(/\n+/)
                .map(p => p.trim())
                .filter(Boolean);
            const stepSec = paragraphs.length > 0 && durationSec > 0
                ? Math.max(5, Math.floor(durationSec / paragraphs.length))
                : 10;

            return {
                success: true,
                data: {
                    narrationId: n.narrationId,
                    animalId: n.animalId,
                    speciesId: n.speciesId || aId,
                    speciesName: n.speciesName || n.animalName || '',
                    animalName: n.animalName || '',
                    scientificName: n.scientificName || '',
                    conservationStatus: n.conservationStatus || '',
                    languageCode: n.languageCode || lang,
                    languageName: n.languageName || lang,
                    title: n.title,
                    narrator: n.voiceName || n.creatorName || 'ZooGuide Audio',
                    voiceName: n.voiceName || '',
                    ttsProvider: n.ttsProvider || '',
                    summary: n.content,
                    content: n.content,
                    durationSec,
                    durationFormatted: durationSec > 0
                        ? `${Math.floor(durationSec / 60).toString().padStart(2, '0')}:${(durationSec % 60).toString().padStart(2, '0')}`
                        : '--:--',
                    hasAudio: hasRealAudio,
                    audioSrc: publicAudioUrl || streamUrl,
                    audioUrl: publicAudioUrl || n.audioUrl || null,
                    publicUrl: publicAudioUrl || n.publicUrl || null,
                    storageBucket: n.storageBucket || null,
                    objectPath: n.objectPath || null,
                    referenceSource: n.referenceSource || '',
                    imageUrl: n.animalImageUrl || '',
                    transcript: paragraphs.length > 0
                        ? paragraphs.map((text, idx) => ({ time: idx * stepSec, text }))
                        : [{ time: 0, text: n.content || n.title }],
                    isFallbackLanguage: Boolean(n.isFallbackLanguage),
                    originalRequestedLanguage: n.originalRequestedLanguage || null,
                    fallbackMessage: n.fallbackMessage || null,
                }
            };
        } catch (err) {
            return this.getSpeciesNarration(animalId, lang, sessionId);
        }
    },

    // 6. STAFF: GET HEALTH LOGS (via real Dashboard stats from Supabase)
    async getHealthLogs() {
        const statsRes = await this.getDashboardStats();
        if (!statsRes.success) {
            return { success: false, data: [], message: statsRes.message };
        }
        return { success: true, data: statsRes.data?.recentHealthLogs || [] };
    },

    // 7. STAFF: ADD HEALTH RECORD (Persisted to Supabase ANIMALS table)
    async addHealthRecord(record) {
        try {
            const payload = {
                animalId: record.animalId ? parseInt(record.animalId) : null,
                animalCode: record.animalCode || null,
                healthStatus: record.healthStatus || '',
                notes: record.notes || '',
                veterinarian: record.veterinarian || '',
                weightKg: record.weightKg != null && record.weightKg !== '' ? parseFloat(record.weightKg) : null,
                temperatureC: record.temperatureC != null && record.temperatureC !== '' ? parseFloat(record.temperatureC) : null,
                actionRequired: record.actionRequired || ''
            };

            const res = await authFetch(`${API_CONFIG.BASE_URL}/dashboard/health-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(json?.message || 'Lỗi lưu hồ sơ sức khỏe lên cơ sở dữ liệu');
            }
            return {
                success: true,
                message: json?.message || 'Đã cập nhật hồ sơ sức khỏe thành công!',
                data: json?.data || json
            };
        } catch (err) {
            console.error('addHealthRecord API error:', err);
            return { success: false, message: err.message };
        }
    },

    async updateAnimalHealth(animalId, record) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/animals/${animalId}/health`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    healthStatus: record.healthStatus,
                    conservationNote: record.notes || record.conservationNote || null,
                    weightKg: record.weightKg != null && record.weightKg !== '' ? parseFloat(record.weightKg) : null,
                    temperatureC: record.temperatureC != null && record.temperatureC !== '' ? parseFloat(record.temperatureC) : null,
                    veterinarianName: record.veterinarian || record.veterinarianName || null,
                    healthActionRequired: record.actionRequired || record.healthActionRequired || null
                })
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(json?.message || 'Không thể lưu trạng thái sức khỏe động vật.');
            }
            return {
                success: true,
                message: json?.message || 'Đã cập nhật trạng thái sức khỏe vào cơ sở dữ liệu.',
                data: json?.data ? mapAnimalDto(json.data) : null
            };
        } catch (err) {
            console.error('updateAnimalHealth error:', err);
            return { success: false, message: err.message };
        }
    },

    // 8. ADMIN: SPECIES CRUD
    async getSpecies(filters = {}) {
        const lang = filters.lang || 'vi';
        const cacheKey = `species:${filters.conservationStatus || 'all'}:${lang}`;
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.conservationStatus && filters.conservationStatus !== 'all') {
                params.append('conservationStatus', filters.conservationStatus);
            }
            if (filters.lang) params.append('lang', filters.lang);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await fetch(`${API_CONFIG.BASE_URL}/species${qs}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const rawList = Array.isArray(data) ? data : (data.data || []);
            const mapped = rawList.map(s => ({
                id: s.speciesId,
                speciesId: s.speciesId,
                name: s.name,
                nameVi: s.nameVi || s.name,
                nameEn: s.scientificName || s.name,
                scientificName: s.scientificName || '',
                conservationStatus: s.conservationStatus || 'N/A',
                description: s.description || '',
                habitat: s.habitat || '',
                diet: s.diet || '',
                lifespan: s.lifespan || '',
                referenceSource: s.referenceSource || '',
                imageUrl: s.imageUrl || '',
                languageCode: s.languageCode || filters.lang || 'vi',
                hasTranslation: s.hasTranslation !== false
            }));
            if (!filters.search) {
                saveOfflineTourCache(cacheKey, mapped);
            }
            notifyApiStatus(true);
            return { success: true, data: mapped, fromOfflineCache: false };
        } catch (err) {
            console.error('getSpecies API error:', err);
            notifyApiStatus(false, { error: err.message });
            const cached = readOfflineTourCache(cacheKey) || readOfflineTourCache(`species:all:${lang}`) || readOfflineTourCache('species:all:vi');
            if (cached && Array.isArray(cached.data)) {
                let list = cached.data;
                if (filters.conservationStatus && filters.conservationStatus !== 'all') {
                    list = list.filter(s => s.conservationStatus === filters.conservationStatus);
                }
                if (filters.search) {
                    const q = String(filters.search).toLowerCase();
                    list = list.filter(s =>
                        (s.name || '').toLowerCase().includes(q) ||
                        (s.scientificName || '').toLowerCase().includes(q)
                    );
                }
                return { success: true, data: list, fromOfflineCache: true, cachedAt: cached.cachedAt };
            }
            return { success: false, data: [], error: err.message, message: 'Không thể tải danh sách loài từ máy chủ.' };
        }
    },

    async createSpecies(data) {
        try {
            const reqData = {
                name: data.nameVi || data.name,
                scientificName: data.scientificName || data.nameEn,
                description: data.description || '',
                conservationStatus: data.conservationStatus || '',
                habitat: data.habitat || '',
                diet: data.diet || '',
                lifespan: data.lifespan || '',
                referenceSource: data.referenceSource || '',
                imageUrl: data.imageUrl || ''
            };
            const res = await authFetch(`${API_CONFIG.BASE_URL}/species`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Lỗi tạo species');
            }
            const created = await res.json();
            return { success: true, data: created };
        } catch (err) {
            console.error(err);
            return { success: false, error: err.message };
        }
    },

    async updateSpecies(id, data) {
        try {
            const reqData = {
                name: data.nameVi || data.name,
                scientificName: data.scientificName || data.nameEn,
                description: data.description || '',
                conservationStatus: data.conservationStatus || '',
                habitat: data.habitat || '',
                diet: data.diet || '',
                lifespan: data.lifespan || '',
                referenceSource: data.referenceSource || '',
                imageUrl: data.imageUrl || ''
            };
            const res = await authFetch(`${API_CONFIG.BASE_URL}/species/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Lỗi cập nhật species');
            }
            const updated = await res.json();
            return { success: true, data: updated };
        } catch (err) {
            console.error(err);
            return { success: false, error: err.message };
        }
    },

    async deleteSpecies(id) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/species/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Lỗi xóa species');
            }
            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false, error: err.message };
        }
    },

    // 9. ADMIN: ANIMALS CRUD
    async createAnimal(data) {
        try {
            const reqData = {
                name: data.nameVi || data.name,
                nameVi: data.nameVi || data.name,
                speciesId: parseInt(data.speciesId) || 1,
                areaId: parseInt(data.areaId) || (data.zoneId ? (parseInt(String(data.zoneId).replace('zone-', '')) || 1) : 1),
                enclosureId: data.enclosureId ? parseInt(data.enclosureId) : null,
                zoneId: data.zoneId,
                zoneCode: data.zoneCode,
                gender: data.gender || 'Unknown',
                status: data.status || 'Active',
                description: data.description || (data.diet ? `Chế độ ăn: ${data.diet}` : ''),
                healthStatus: data.healthStatus || 'Khỏe mạnh',
                origin: data.origin || '',
                imageUrl: data.imageUrl || '',
                weightKg: data.weightKg != null && data.weightKg !== '' ? parseFloat(data.weightKg) : null,
                temperatureC: data.temperatureC != null && data.temperatureC !== '' ? parseFloat(data.temperatureC) : null,
                veterinarianName: data.veterinarianName || null,
                healthActionRequired: data.healthActionRequired || null,
                referenceSource: data.referenceSource || null
            };
            const res = await authFetch(`${API_CONFIG.BASE_URL}/animals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || 'Lỗi tạo động vật trên máy chủ');
            }
            const created = await res.json();
            return { success: true, data: created.data || created };
        } catch (err) {
            console.error('createAnimal API error:', err);
            return { success: false, error: err.message };
        }
    },

    async updateAnimal(id, data) {
        try {
            const reqData = {
                name: data.nameVi || data.name,
                nameVi: data.nameVi || data.name,
                speciesId: parseInt(data.speciesId) || 1,
                areaId: parseInt(data.areaId) || (data.zoneId ? (parseInt(String(data.zoneId).replace('zone-', '')) || 1) : 1),
                enclosureId: data.enclosureId ? parseInt(data.enclosureId) : null,
                zoneId: data.zoneId,
                zoneCode: data.zoneCode,
                gender: data.gender || 'Unknown',
                status: data.status || 'Active',
                description: data.description || (data.diet ? `Chế độ ăn: ${data.diet}` : ''),
                healthStatus: data.healthStatus || 'Khỏe mạnh',
                origin: data.origin || '',
                imageUrl: data.imageUrl || '',
                weightKg: data.weightKg != null && data.weightKg !== '' ? parseFloat(data.weightKg) : null,
                temperatureC: data.temperatureC != null && data.temperatureC !== '' ? parseFloat(data.temperatureC) : null,
                veterinarianName: data.veterinarianName || null,
                healthActionRequired: data.healthActionRequired || null,
                referenceSource: data.referenceSource || null
            };
            const res = await authFetch(`${API_CONFIG.BASE_URL}/animals/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || 'Lỗi cập nhật động vật trên máy chủ');
            }
            const updated = await res.json();
            return { success: true, data: updated.data || updated };
        } catch (err) {
            console.error('updateAnimal API error:', err);
            return { success: false, error: err.message };
        }
    },

    async deleteAnimal(id) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/animals/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Lỗi xóa động vật trên máy chủ');
            return { success: true };
        } catch (err) {
            console.error('deleteAnimal API error:', err);
            return { success: false, error: err.message };
        }
    },

    // 10. ADMIN: AREAS CRUD
    async createArea(data) {
        try {
            const reqData = {
                code: data.code?.trim() || null,
                name: data.nameVi || data.name,
                description: data.descriptionVi || data.description || '',
                latitude: parseFloat(data.latitude) || 10.7875,
                longitude: parseFloat(data.longitude) || 106.7052,
                radiusMeters: parseFloat(data.radiusMeters) || 50,
                mapImageUrl: data.mapImageUrl || '',
                mapX: data.mapX != null && data.mapX !== '' ? parseFloat(data.mapX) : null,
                mapY: data.mapY != null && data.mapY !== '' ? parseFloat(data.mapY) : null
            };
            const res = await authFetch(`${API_CONFIG.BASE_URL}/areas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || 'Lỗi tạo khu vực trên máy chủ');
            }
            const created = await res.json();
            return { success: true, data: created.data || created };
        } catch (err) {
            console.error('createArea API error:', err);
            return { success: false, error: err.message };
        }
    },

    async updateArea(id, data) {
        try {
            const numId = typeof id === 'number' ? id : (parseInt(String(id).replace('zone-', '')) || 1);
            const reqData = {
                code: data.code?.trim() || null,
                name: data.nameVi || data.name,
                description: data.descriptionVi || data.description || '',
                latitude: parseFloat(data.latitude) || 10.7875,
                longitude: parseFloat(data.longitude) || 106.7052,
                radiusMeters: parseFloat(data.radiusMeters) || 50,
                mapImageUrl: data.mapImageUrl || '',
                mapX: data.mapX != null && data.mapX !== '' ? parseFloat(data.mapX) : null,
                mapY: data.mapY != null && data.mapY !== '' ? parseFloat(data.mapY) : null
            };
            const res = await authFetch(`${API_CONFIG.BASE_URL}/areas/${numId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || 'Lỗi cập nhật khu vực');
            }
            const updated = await res.json();
            return { success: true, data: updated.data || updated };
        } catch (err) {
            console.error('updateArea API error:', err);
            return { success: false, error: err.message };
        }
    },

    async deleteArea(id) {
        try {
            const numId = typeof id === 'number' ? id : (parseInt(String(id).replace('zone-', '')) || 1);
            const res = await authFetch(`${API_CONFIG.BASE_URL}/areas/${numId}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.message || 'Lỗi xóa phân khu');
            }
            return { success: true };
        } catch (err) {
            console.error('deleteArea API error:', err);
            return { success: false, error: err.message };
        }
    },

    // 11. ADMIN: TICKETS CRUD
    async getTickets() {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/tickets`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const rawList = Array.isArray(data) ? data : (data.data || []);
            const mapped = rawList.map(t => {
                let statusStr = 'Active';
                if (t.status === 2 || t.status === 'Used') statusStr = 'Used';
                if (t.status === 3 || t.status === 'Expired') statusStr = 'Expired';
                if (t.status === 4 || t.status === 'Cancelled') statusStr = 'Cancelled';
                if (t.status === 5 || t.status === 'Locked') statusStr = 'Locked';
                return {
                    id: t.ticketId,
                    ticketId: t.ticketId,
                    ticketCode: t.ticketCode,
                    ticketTypeId: t.ticketTypeId,
                    customerName: t.customerName || 'Khách hàng',
                    ticketType: t.ticketTypeName || 'Standard',
                    ticketTypeName: t.ticketTypeName || 'Standard',
                    validFrom: t.validFrom,
                    validUntil: t.validUntil,
                    validFromDate: t.validFrom ? new Date(t.validFrom).toLocaleString('vi-VN') : '',
                    validUntilDate: t.validUntil ? new Date(t.validUntil).toLocaleString('vi-VN') : '',
                    status: statusStr,
                    zonesAllowed: ['ALL']
                };
            });
            return { success: true, data: mapped };
        } catch (err) {
            console.error('getTickets API error:', err);
            return { success: false, data: [], error: err.message };
        }
    },

    // 11. ORDERS & REAL VIETQR PAYMENTS
    async createOrder(data) {
        try {
            const primaryItem = (data.items && data.items.length > 0) ? data.items[0] : null;
            const ticketTypeId = parseInt(data.ticketTypeId || (primaryItem ? primaryItem.ticketTypeId : 1));
            const quantity = parseInt(data.quantity || (primaryItem ? primaryItem.quantity : 1));
            const reqData = {
                ticketTypeId,
                quantity,
                items: (data.items && data.items.length > 0)
                    ? data.items.map(it => ({ ticketTypeId: parseInt(it.ticketTypeId), quantity: parseInt(it.quantity) }))
                    : [{ ticketTypeId, quantity }],
                customerName: data.customerName || 'Khách Tham Quan',
                customerEmail: data.customerEmail || 'visitor@zooguide.vn',
                customerPhone: data.customerPhone || '0900000000'
            };
            const res = await fetch(`${API_CONFIG.BASE_URL}/orders/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.message || `Lỗi tạo đơn hàng (HTTP ${res.status})`);
            }
            return { success: true, data: json.data, message: json.message };
        } catch (err) {
            console.error('createOrder error:', err);
            return { success: false, message: err.message };
        }
    },

    async resendOrderEmail(orderCode, email = null) {
        try {
            const body = email ? JSON.stringify({ email }) : JSON.stringify({});
            const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${encodeURIComponent(orderCode)}/resend-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });
            const json = await res.json();
            return {
                success: res.ok && json.success,
                data: json.data,
                message: json.message || (res.ok ? 'Đã gửi lại email xác nhận vé.' : 'Không thể gửi lại email.')
            };
        } catch (err) {
            console.error('resendOrderEmail error:', err);
            return { success: false, message: err.message };
        }
    },

    async getOrderByCode(orderCode) {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${encodeURIComponent(orderCode)}`);
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.message || `Không thể tra cứu đơn hàng (HTTP ${res.status})`);
            }
            return { success: true, data: json.data };
        } catch (err) {
            console.error('getOrderByCode error:', err);
            return { success: false, message: err.message };
        }
    },

    async getOrders({ search, status } = {}) {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (status && status !== 'all') params.append('status', status);

            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await authFetch(`${API_CONFIG.BASE_URL}/orders${qs}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
            return { success: true, data: json.data || [] };
        } catch (err) {
            console.error('getOrders error:', err);
            return { success: false, data: [], message: err.message };
        }
    },

    async simulateSandboxPayment(payload) {
        try {
            const bodyData = typeof payload === 'string'
                ? { orderCode: payload }
                : {
                    orderCode: payload?.orderCode,
                    amount: payload?.amount,
                    failSimulation: payload?.failSimulation
                };

            if (!bodyData.orderCode) {
                return {
                    success: false,
                    message: 'Mã đơn hàng không hợp lệ để thực hiện thanh toán sandbox.'
                };
            }

            const res = await fetch(`${API_CONFIG.BASE_URL}/payments/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                return {
                    success: false,
                    message: json.message || `Lỗi xử lý thanh toán sandbox (HTTP ${res.status})`
                };
            }
            return { success: true, data: json.data, message: json.message };
        } catch (err) {
            console.error('simulateSandboxPayment error:', err);
            return {
                success: false,
                message: err.message || 'Không thể kết nối đến máy chủ thanh toán. Vui lòng kiểm tra lại mạng.'
            };
        }
    },

    async createTicket(data) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) {
                return {
                    success: false,
                    message: result.message || 'Không thể phát hành vé thủ công.'
                };
            }
            return {
                success: true,
                data: result.data || result,
                message: result.message || 'Phát hành vé thành công.'
            };
        } catch (err) {
            console.error('createTicket error:', err);
            return {
                success: false,
                message: err.message || 'Lỗi mạng khi phát hành vé.'
            };
        }
    },

    async updateTicketStatus(idOrCode, status) {
        try {
            let ticketId = typeof idOrCode === 'number' ? idOrCode : null;
            if (!ticketId) {
                const allRes = await fetch(`${API_CONFIG.BASE_URL}/tickets`);
                const allData = await allRes.json();
                const ticket = allData.find(t => t.ticketCode === idOrCode || t.ticketId === Number(idOrCode));
                if (!ticket) throw new Error('Không tìm thấy vé cần cập nhật');
                ticketId = ticket.ticketId;
            }

            let targetStatus = 1; // Valid
            if (status === 'Used' || status === 2) targetStatus = 2;
            if (status === 'Expired' || status === 3) targetStatus = 3;
            if (status === 'Cancelled' || status === 4) targetStatus = 4;
            if (status === 'Locked' || status === 5) targetStatus = 5;

            const res = await authFetch(`${API_CONFIG.BASE_URL}/tickets/${ticketId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(targetStatus)
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Lỗi cập nhật trạng thái');
            return { success: true, data: json.data, message: json.message };
        } catch (err) {
            console.error('updateTicketStatus error:', err);
            return { success: false, message: err.message || 'Lỗi cập nhật trạng thái vé' };
        }
    },

    async deleteTicket(id) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/tickets/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.message || 'Không thể xóa vé này vì đã có phiên tham quan hoặc liên kết.');
            }
            return { success: true, message: 'Đã xóa vé thành công' };
        } catch (err) {
            console.error('deleteTicket error:', err);
            return { success: false, error: err.message };
        }
    },

    // 12. ADMIN & VISITOR: TICKET TYPES CRUD
    async getTicketTypes(lang = 'vi') {
        try {
            const qs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
            const res = await fetch(`${API_CONFIG.BASE_URL}/ticket-types${qs}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const rawList = Array.isArray(data) ? data : (data.data || []);
            const mapped = rawList.map(t => ({
                id: t.ticketTypeId,
                ticketTypeId: t.ticketTypeId,
                code: 'TYPE-' + t.ticketTypeId,
                name: t.name,
                nameVi: t.nameVi || t.name,
                price: t.price,
                durationMinutes: t.durationMinutes || 240,
                description: t.description || '',
                isActive: t.isActive,
                languageCode: t.languageCode || lang,
                hasTranslation: t.hasTranslation !== false
            }));
            return { success: true, data: mapped };
        } catch (err) {
            console.error('getTicketTypes API error:', err);
            return { success: false, data: [], error: err.message };
        }
    },

    async createTicketType(data) {
        try {
            const reqData = {
                name: data.name,
                description: data.description,
                price: Number(data.price) || 0,
                durationMinutes: 240,
                isActive: true
            };
            const res = await authFetch(`${API_CONFIG.BASE_URL}/ticket-types`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) throw new Error('Lỗi tạo loại vé');
            const created = await res.json();
            return {
                success: true,
                data: {
                    id: created.ticketTypeId,
                    code: data.code || 'TYPE-' + created.ticketTypeId,
                    name: created.name,
                    price: created.price,
                    description: created.description,
                    isActive: created.isActive
                }
            };
        } catch (err) {
            console.error(err);
            return { success: false, error: err.message };
        }
    },

    async updateTicketType(id, data) {
        try {
            const reqData = {
                name: data.name,
                description: data.description,
                price: Number(data.price) || 0,
                durationMinutes: 240,
                isActive: data.isActive !== false
            };
            const res = await authFetch(`${API_CONFIG.BASE_URL}/ticket-types/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Lỗi cập nhật loại vé');
            }
            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false, error: err.message };
        }
    },

    async deleteTicketType(id) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/ticket-types/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Lỗi xóa loại vé');
            }
            return { success: true, message: 'Đã xóa loại vé thành công' };
        } catch (err) {
            console.error(err);
            return { success: false, error: err.message };
        }
    },

    // 13. ADMIN: TICKET SESSIONS
    async getTicketSessions() {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/tickets/sessions`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.data || []);
            return { success: true, data: list };
        } catch (err) {
            console.error('getTicketSessions error:', err);
            return { success: false, data: [], error: err.message };
        }
    },

    async revokeTicketSession(sessionId) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/tickets/sessions/${sessionId}/revoke`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                return { success: true, message: data.message || 'Đã đóng phiên thành công' };
            }
            const errData = await res.json().catch(() => null);
            return { success: false, message: errData?.message || 'Không thể thu hồi phiên' };
        } catch (err) {
            console.error('revokeTicketSession error:', err);
            return { success: false, message: 'Không thể kết nối đến máy chủ.' };
        }
    },

    async exitTicketSession(sessionId) {
        if (!sessionId) return { success: false, message: 'Mã phiên tham quan không hợp lệ.' };
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/tickets/sessions/exit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Session-Id': String(sessionId) },
                body: JSON.stringify({ sessionId: String(sessionId) })
            });
            const data = await res.json().catch(() => null);
            if (res.ok) {
                return { success: true, message: data?.message || 'Đã thoát phiên tham quan thành công.' };
            }
            if (res.status === 404) {
                const fallbackRes = await this.revokeTicketSession(sessionId);
                if (fallbackRes.success) return fallbackRes;
            }
            return { success: false, message: data?.message || 'Không thể kết thúc phiên tham quan từ máy chủ.' };
        } catch (err) {
            console.error('exitTicketSession error:', err);
            return { success: false, message: 'Lỗi kết nối đến máy chủ khi thoát phiên tham quan.' };
        }
    },

    async verifyTicketSession(sessionId) {
        if (!sessionId) return { valid: false };
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/tickets/sessions/verify`, {
                method: 'GET',
                headers: {
                    'X-Session-Id': sessionId
                }
            });
            if (res.ok) {
                const data = await res.json();
                return { valid: true, data: data.data || data };
            }
            return { valid: false };
        } catch (err) {
            console.warn('verifyTicketSession failed:', err);
            return { valid: false, networkError: true };
        }
    },

    // 14. ADMIN: DASHBOARD REAL-TIME STATS
    async getDashboardStats(filter = {}) {
        try {
            const params = new URLSearchParams();
            if (filter.fromDate) params.append('fromDate', filter.fromDate);
            if (filter.toDate) params.append('toDate', filter.toDate);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await authFetch(`${API_CONFIG.BASE_URL}/dashboard/stats${qs}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('getDashboardStats error:', err);
            return { success: false, data: null, message: 'Không thể tải dữ liệu thống kê từ cơ sở dữ liệu.' };
        }
    },

    async getOnlineUsers() {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/dashboard/online-users`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('getOnlineUsers error:', err);
            return { success: false, data: null, message: err.message };
        }
    },

    async recordDashboardTelemetry(payload = {}) {
        try {
            let installationId = payload.installationId;
            if (!installationId && typeof window !== 'undefined' && window.localStorage) {
                installationId = window.localStorage.getItem('zooguide_device_installation_id')
                    || window.localStorage.getItem('zooguide_device_installation_id_v1')
                    || null;
            }
            const body = {
                category: payload.category || 'AUDIO',
                eventType: payload.eventType || 'PLAY_REQUESTED',
                installationId: installationId || null,
                sessionId: payload.sessionId || null,
                languageCode: payload.languageCode || null,
                targetType: payload.targetType || null,
                targetId: payload.targetId != null ? Number(payload.targetId) : null,
                targetCode: payload.targetCode || null,
                targetName: payload.targetName || null,
                triggerSource: payload.triggerSource || 'MANUAL_MAP',
                listenDurationSeconds: payload.listenDurationSeconds != null ? Math.round(Number(payload.listenDurationSeconds)) : null,
                totalDurationSeconds: payload.totalDurationSeconds != null ? Math.round(Number(payload.totalDurationSeconds)) : null,
                distanceMeters: payload.distanceMeters != null ? Number(payload.distanceMeters) : null,
                accuracyMeters: payload.accuracyMeters != null ? Number(payload.accuracyMeters) : null,
                isSuccess: payload.isSuccess !== false,
                errorCode: payload.errorCode || null,
                errorMessage: payload.errorMessage || null
            };
            const res = await fetch(`${API_CONFIG.BASE_URL}/dashboard/telemetry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) return { success: false };
            const data = await res.json();
            return { success: true, data: data.data || data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async verifyDashboardAudioStorage(forceRefresh = true) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/dashboard/verify-audio?forceRefresh=${Boolean(forceRefresh)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('verifyDashboardAudioStorage error:', err);
            return { success: false, error: err.message };
        }
    },

    async updateDashboardAlertStatus(alertKey, status, note = '') {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/dashboard/alerts/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alertKey, status, note })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('updateDashboardAlertStatus error:', err);
            return { success: false, error: err.message };
        }
    },

    // 15. ADMIN: AUDIT LOGS
    async getAdminLogs(limit = 50) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/admin/logs?limit=${limit}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('getAdminLogs error:', err);
            return { success: false, data: [] };
        }
    },

    // 16. NARRATIONS & AUDIOS
    async getNarrations(filter = {}) {
        try {
            const params = new URLSearchParams();
            if (filter.animalId) params.append('animalId', filter.animalId);
            if (filter.languageCode) params.append('languageCode', filter.languageCode);
            if (filter.status) params.append('status', filter.status);
            if (filter.search) params.append('search', filter.search);

            const res = await fetch(`${API_CONFIG.BASE_URL}/narrations?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.data || []);
            return { success: true, data: list };
        } catch (err) {
            console.error('getNarrations error:', err);
            return { success: false, data: [], error: err.message };
        }
    },

    async createNarration(payload) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/narrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Lỗi tạo bài thuyết minh');
            }
            return { success: true, data: data.data || data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async updateNarration(id, payload) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/narrations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Lỗi cập nhật bài thuyết minh');
            }
            return { success: true, data: data.data || data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async updateNarrationStatus(id, status) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/narrations/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Lỗi cập nhật trạng thái thuyết minh');
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async deleteNarration(id) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/narrations/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || 'Lỗi xóa bài thuyết minh');
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async addNarrationAudio(id, audioData) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/narrations/${id}/audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(audioData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi thêm file audio');
            return { success: true, data: data.data || data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async uploadNarrationAudio(id, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await authFetch(`${API_CONFIG.BASE_URL}/narrations/${id}/upload-audio`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi upload file âm thanh');
            return { success: true, data: data.data || data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    // 17. LANGUAGES & TRANSLATIONS
    async getLanguages() {
        const cacheKey = 'languages:all';
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/languages`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.data || []);
            saveOfflineTourCache(cacheKey, list);
            notifyApiStatus(true);
            return { success: true, data: list, fromOfflineCache: false };
        } catch (err) {
            console.error('getLanguages error:', err);
            notifyApiStatus(false, { error: err.message });
            const cached = readOfflineTourCache(cacheKey);
            if (cached && Array.isArray(cached.data)) {
                return { success: true, data: cached.data, fromOfflineCache: true, cachedAt: cached.cachedAt };
            }
            return { success: false, data: [], error: err.message };
        }
    },

    async getUiTranslations(code) {
        const cacheKey = `ui_translations:${code || 'vi'}`;
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/languages/${encodeURIComponent(code)}/ui`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const payload = data.data || data || {};
            saveOfflineTourCache(cacheKey, payload);
            notifyApiStatus(true);
            return { success: true, data: payload, fromOfflineCache: false };
        } catch (err) {
            console.error('getUiTranslations error:', err);
            notifyApiStatus(false, { error: err.message });
            const cached = readOfflineTourCache(cacheKey);
            if (cached && cached.data) {
                return { success: true, data: cached.data, fromOfflineCache: true, cachedAt: cached.cachedAt };
            }
            return { success: false, data: {}, error: err.message };
        }
    },

    async getContentTranslations(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.lang) params.append('lang', filters.lang);
            if (filters.entityType) params.append('entityType', filters.entityType);
            if (filters.entityId != null) params.append('entityId', filters.entityId);
            const res = await fetch(`${API_CONFIG.BASE_URL}/languages/translations?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return { success: true, data: data.data || data || [] };
        } catch (err) {
            console.error('getContentTranslations error:', err);
            return { success: false, data: [], error: err.message };
        }
    },

    async upsertContentTranslation(dto) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/languages/translations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi lưu bản dịch');
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('upsertContentTranslation error:', err);
            return { success: false, error: err.message };
        }
    },


    // 19. DEVICE HEARTBEAT & MONITORING
    async sendDeviceHeartbeat(installationId, buyerInfo = null) {
        try {
            const payload = {
                installationId,
                orderCode: buyerInfo?.orderCode || null,
                buyerEmail: buyerInfo?.email || null
            };
            const res = await fetch(`${API_CONFIG.BASE_URL}/devices/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) return { success: false };
            const data = await res.json();
            return { success: true, data: data.data || data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    sendDeviceDisconnect(installationId, buyerInfo = null) {
        if (!installationId) return;
        try {
            const payload = JSON.stringify({
                installationId,
                orderCode: buyerInfo?.orderCode || null,
                buyerEmail: buyerInfo?.email || null
            });
            if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                const blob = new Blob([payload], { type: 'application/json' });
                navigator.sendBeacon(`${API_CONFIG.BASE_URL}/devices/disconnect`, blob);
            } else if (typeof fetch !== 'undefined') {
                fetch(`${API_CONFIG.BASE_URL}/devices/disconnect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true
                }).catch(() => {});
            }
        } catch (e) {
            // Ignore unload errors
        }
    },

    async getActiveDevicesSummary() {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/devices/active-count`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('getActiveDevicesSummary error:', err);
            return { success: false, error: err.message };
        }
    },

    // 20. POINTS OF INTEREST (POI) & NARRATIONS
    async getPois(filter = {}) {
        const cacheKey = `pois:${filter.category || 'all'}:${filter.isActive ?? 'all'}:${filter.areaId || 'all'}`;
        try {
            const params = new URLSearchParams();
            if (filter.category && filter.category !== 'all') params.append('category', filter.category);
            if (filter.isActive !== undefined && filter.isActive !== null && filter.isActive !== '') params.append('isActive', filter.isActive);
            if (filter.isVerified !== undefined && filter.isVerified !== null && filter.isVerified !== '') params.append('isVerified', filter.isVerified);
            if (filter.search) params.append('search', filter.search);
            if (filter.areaId) params.append('areaId', filter.areaId);

            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await fetch(`${API_CONFIG.BASE_URL}/pois${qs}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const list = data.data || data || [];
            if (!filter.search) {
                saveOfflineTourCache(cacheKey, list);
            }
            notifyApiStatus(true);
            return { success: true, data: list, fromOfflineCache: false };
        } catch (err) {
            console.error('getPois error:', err);
            notifyApiStatus(false, { error: err.message });
            const cached = readOfflineTourCache(cacheKey) || readOfflineTourCache('pois:all:true:all') || readOfflineTourCache('pois:all:all:all');
            if (cached && Array.isArray(cached.data)) {
                let list = cached.data;
                if (filter.category && filter.category !== 'all') {
                    list = list.filter(p => p.category === filter.category);
                }
                if (filter.isActive !== undefined && filter.isActive !== null && filter.isActive !== '') {
                    list = list.filter(p => Boolean(p.isActive) === Boolean(filter.isActive));
                }
                if (filter.areaId) {
                    list = list.filter(p => Number(p.areaId) === Number(filter.areaId));
                }
                if (filter.search) {
                    const q = String(filter.search).toLowerCase();
                    list = list.filter(p =>
                        (p.name || '').toLowerCase().includes(q) ||
                        (p.code || '').toLowerCase().includes(q)
                    );
                }
                return { success: true, data: list, fromOfflineCache: true, cachedAt: cached.cachedAt };
            }
            return { success: false, data: [], error: err.message };
        }
    },

    async getPoiById(id) {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/pois/${id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            notifyApiStatus(true);
            return { success: true, data: data.data || data, fromOfflineCache: false };
        } catch (err) {
            console.error('getPoiById error:', err);
            notifyApiStatus(false, { error: err.message });
            const cached = readOfflineTourCache('pois:all:true:all') || readOfflineTourCache('pois:all:all:all');
            if (cached && Array.isArray(cached.data)) {
                const found = cached.data.find(p => Number(p.poiId || p.id) === Number(id));
                if (found) {
                    return { success: true, data: found, fromOfflineCache: true, cachedAt: cached.cachedAt };
                }
            }
            return { success: false, error: err.message };
        }
    },

    async createPoi(dto) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/pois`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi khi tạo điểm tham quan');
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('createPoi error:', err);
            return { success: false, error: err.message };
        }
    },

    async updatePoi(id, dto) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/pois/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi khi cập nhật điểm tham quan');
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('updatePoi error:', err);
            return { success: false, error: err.message };
        }
    },

    async updatePoiStatus(id, isActive) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/pois/${id}/status?isActive=${Boolean(isActive)}`, {
                method: 'PATCH'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi khi cập nhật trạng thái POI');
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('updatePoiStatus error:', err);
            return { success: false, error: err.message };
        }
    },

    async verifyPoiCoordinates(id, isVerified, verificationSource = '') {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/pois/${id}/verify-coordinates`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVerified, verificationSource })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi khi kiểm định tọa độ POI');
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('verifyPoiCoordinates error:', err);
            return { success: false, error: err.message };
        }
    },

    async deletePoi(id) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/pois/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi khi xóa điểm tham quan');
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('deletePoi error:', err);
            return { success: false, error: err.message };
        }
    },

    async getPoiNarrations(poiId) {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/pois/${poiId}/narrations`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return { success: true, data: data.data || data || [] };
        } catch (err) {
            console.error('getPoiNarrations error:', err);
            return { success: false, data: [], error: err.message };
        }
    },

    async addPoiNarration(poiId, dto) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/pois/${poiId}/narrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi thêm thuyết minh POI');
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('addPoiNarration error:', err);
            return { success: false, error: err.message };
        }
    },

    async updatePoiNarration(poiId, narrationId, dto) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/pois/${poiId}/narrations/${narrationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật thuyết minh POI');
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('updatePoiNarration error:', err);
            return { success: false, error: err.message };
        }
    },

    async deletePoiNarration(poiId, narrationId) {
        try {
            const res = await authFetch(`${API_CONFIG.BASE_URL}/pois/${poiId}/narrations/${narrationId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi xóa thuyết minh POI');
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('deletePoiNarration error:', err);
            return { success: false, error: err.message };
        }
    },

    async uploadPoiNarrationAudio(poiId, narrationId, file) {
        try {
            const formData = new FormData();
            formData.append('audioFile', file);
            const res = await authFetch(`${API_CONFIG.BASE_URL}/pois/${poiId}/narrations/${narrationId}/audio`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi tải lên file âm thanh');
            return { success: true, data: data.data || data };
        } catch (err) {
            console.error('uploadPoiNarrationAudio error:', err);
            return { success: false, error: err.message };
        }
    },

    async getPoiPublicNarration(poiId, lang = 'vi', sessionId = null) {
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

export default ZooApi;
