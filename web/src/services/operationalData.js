/**
 * ZooGuide - Centralized Authoritative Operational Information
 * Single Source of Truth for operating hours, location and operational gates.
 */

export const ZOO_OPERATIONAL_INFO = {
    openingHours: '07:00 – 18:30 (Kể cả Lễ, Tết)',
    address: 'Số 2 Nguyễn Bỉnh Khiêm, P. Bến Nghé, Q.1, TP. Hồ Chí Minh',
    gates: '4 Cổng đón khách: Cổng A (Lê Duẩn), Cổng B, Cổng C, Cổng E',
    contactPhone: '028 3829 1425',
    website: 'https://saigonzoo.net'
};

export const ZOO_OPERATIONAL_INFO_EN = {
    openingHours: '07:00 – 18:30 (Open daily including holidays)',
    address: '2 Nguyen Binh Khiem St., Ben Nghe Ward, District 1, Ho Chi Minh City',
    gates: '4 Visitor Gates: Gate A (Le Duan), Gate B, Gate C, Gate E',
    contactPhone: '028 3829 1425',
    website: 'https://saigonzoo.net'
};

export function getZooOperationalInfo(lang = 'vi') {
    return (lang || 'vi').toLowerCase() === 'vi' ? ZOO_OPERATIONAL_INFO : ZOO_OPERATIONAL_INFO_EN;
}
