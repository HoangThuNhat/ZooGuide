# BẢNG ÁNH XẠ SOURCE CODE VÀ 16 SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAMS) - DỰ ÁN ZOOGUIDE

> **Tài liệu phục vụ Báo cáo môn học Phân tích & Thiết kế Hướng đối tượng (OOAD)**  
> **Dự án:** Hệ thống Hướng dẫn Tham quan Số hóa Thảo Cầm Viên Sài Gòn (ZooGuide)  
> **Kiến trúc công nghệ:** ASP.NET Core 8 Web API + Supabase PostgreSQL & Storage + React Vite PWA  

---

## I. TỔNG QUAN HỆ THỐNG VÀ BẢN ĐỒ TÁC NHÂN (ACTORS)

| Tác nhân (Actor) | Vai trò & Trách nhiệm thực tế trong source code | Phân hệ giao diện tương ứng |
| :--- | :--- | :--- |
| **Visitor** | Khách vãng lai chưa có vé; tra cứu thông tin động vật, xem bản đồ số, tạo đơn đặt vé VietQR | `VisitorPortal.jsx`, `AnimalsTab.jsx`, `MapTab.jsx`, `TicketsTab.jsx` |
| **Validated Visitor** | Khách tham quan đã xác thực mã vé hợp lệ (mở khóa `TicketSession`); được quyền nghe thuyết minh âm thanh đa ngôn ngữ, dẫn đường GPS Dijkstra | `SpeciesAudioTab.jsx`, `AudioPlayerBar.jsx`, `ElectronicTicketModal.jsx` |
| **Staff / Thú y** | Nhân viên chăm sóc thú y / Quầy vé; cập nhật hồ sơ sức khỏe thú, phát hành vé tại quầy | `AdminAnimalsPage.jsx` (`PATCH /health`), `AdminTicketsPage.jsx` |
| **Administrator** | Quản trị viên hệ thống; toàn quyền quản lý loài, phân khu, POI di tích, loại vé, giám sát thiết bị và xem Dashboard | Toàn bộ phân hệ `AdminLayout.jsx` (`/admin/*`) |
| **External Payment Gateway** | Cổng thanh toán VietQR / SePay Webhook; tự động bắn webhook thông báo kết quả chuyển khoản | `POST /api/payments/webhook`, kết hợp nút giả lập Sandbox `POST /api/payments/simulate` |

---

## II. CHI TIẾT ÁNH XẠ 16 SƠ ĐỒ HOẠT ĐỘNG VỚI SOURCE CODE

### 01. Quản lý loài động vật (Species Management)
* **Tên file sơ đồ:** `01_Species_Management.drawio` | **Page 1 trong file tổng hợp**
* **Tác nhân tham gia:** `Administrator`
* **Frontend:**
  * Component: `web/src/pages/admin/AdminSpeciesPage.jsx`
  * API Service Client: `web/src/services/api.js` (`getSpecies`, `createSpecies`, `updateSpecies`, `deleteSpecies`)
* **Backend:**
  * Controller: `src/API/Controllers/SpeciesController.cs`
    * `GET /api/species` (Hỗ trợ lọc `search`, `conservationStatus`, `lang`)
    * `GET /api/species/{id}`
    * `POST /api/species`
    * `PUT /api/species/{id}`
    * `DELETE /api/species/{id}`
  * Service Interface & Impl: `src/Application/Interfaces/ISpeciesService.cs`, `src/Infrastructure/Services/SpeciesService.cs`
* **Database (PostgreSQL / Supabase):**
  * Bảng chính: `public.SPECIES` (`species_id`, `name`, `scientific_name`, `conservation_status`, `description`, `habitat`, `diet`, `lifespan`, `image_url`)
  * Bảng kiểm tra ràng buộc: `public.ANIMALS` (Khóa ngoại `species_id`)
* **Quy tắc nghiệp vụ & Rẽ nhánh:**
  * Khi tạo: Kiểm tra bắt buộc `name` và `scientific_name`. Nếu trùng tên khoa học -> Báo lỗi.
  * Khi xóa: Kiểm tra ràng buộc khóa ngoại với bảng `ANIMALS`. Nếu có cá thể thuộc loài này -> Trả về lỗi `400/409 Conflict`, từ chối xóa để đảm bảo toàn vẹn dữ liệu.

---

### 02. Quản lý động vật (Animal Management)
* **Tên file sơ đồ:** `02_Animal_Management.drawio` | **Page 2 trong file tổng hợp**
* **Tác nhân tham gia:** `Administrator`, `Staff` (Bác sĩ thú y)
* **Frontend:**
  * Component: `web/src/pages/admin/AdminAnimalsPage.jsx`, `web/src/components/animals/AnimalsTab.jsx`
  * API Service Client: `web/src/services/api.js` (`getAnimals`, `createAnimal`, `updateAnimal`, `deleteAnimal`, `updateAnimalHealth`, `moveAnimalEnclosure`)
* **Backend:**
  * Controller: `src/API/Controllers/AnimalsController.cs`, `src/API/Controllers/EnclosuresController.cs`
    * `GET /api/animals` (Lọc theo `search`, `areaId`, `enclosureId`, `speciesId`, `iucnStatus`, `lang`)
    * `POST /api/animals`
    * `PUT /api/animals/{id}`
    * `PATCH /api/animals/{id}/health`
    * `DELETE /api/animals/{id}`
    * `POST /api/enclosures/move-animal`
  * Service & Repo: `src/Application/Services/AnimalService.cs`, `src/Infrastructure/Repositories/AnimalRepository.cs`
* **Database (PostgreSQL / Supabase):**
  * Bảng chính: `public.ANIMALS` (`animal_id`, `code`, `name`, `species_id`, `area_id`, `enclosure_id`, `gender`, `health_status`, `weight_kg`, `temperature_c`, `veterinarian_name`, `last_health_check_at`)
  * Bảng liên kết: `public.SPECIES`, `public.AREAS`, `public.ENCLOSURES`
* **Quy tắc nghiệp vụ & Rẽ nhánh:**
  * Khởi tạo cá thể: Tự động sinh mã định danh theo chuẩn `ANI-xxx`.
  * Ràng buộc bắt buộc: `SpeciesId`, `AreaId` và `EnclosureId` phải tồn tại trong cơ sở dữ liệu.
  * Thú y: Hỗ trợ `PATCH /health` cập nhật cân nặng, thân nhiệt, bác sĩ phụ trách và ghi nhận `last_health_check_at`.

---

### 03. Quản lý khu vực (Area Management)
* **Tên file sơ đồ:** `03_Area_Management.drawio` | **Page 3 trong file tổng hợp**
* **Tác nhân tham gia:** `Administrator`
* **Frontend:**
  * Component: `web/src/pages/admin/AdminAreasPage.jsx`
  * API Service Client: `web/src/services/api.js` (`getAreas`, `createArea`, `updateArea`, `deleteArea`)
* **Backend:**
  * Controller: `src/API/Controllers/AreasController.cs`
    * `GET /api/areas`
    * `POST /api/areas`
    * `PUT /api/areas/{id}`
    * `DELETE /api/areas/{id}`
  * Service & Repo: `src/Application/Services/AreaService.cs`, `src/Infrastructure/Repositories/AreaRepository.cs`
* **Database (PostgreSQL / Supabase):**
  * Bảng chính: `public.AREAS` (`area_id`, `code`, `name`, `description`, `latitude`, `longitude`, `radius_meters`, `map_x`, `map_y`)
  * Bảng liên kết: `public.ENCLOSURES` (Khóa ngoại `area_id`)
* **Quy tắc nghiệp vụ & Rẽ nhánh:**
  * Thêm phân khu: Mã `code` (Zone A, B, C...) phải là duy nhất. Tọa độ GPS tâm phải thuộc khuôn viên Thảo Cầm Viên.
  * Xóa phân khu: Nếu bảng `ENCLOSURES` còn chuồng trại thuộc phân khu này -> Báo lỗi `400 Bad Request`, từ chối xóa.

---

### 04. Quản lý điểm tham quan (POI Management)
* **Tên file sơ đồ:** `04_POI_Management.drawio` | **Page 4 trong file tổng hợp**
* **Tác nhân tham gia:** `Administrator`
* **Frontend:**
  * Component: `web/src/pages/admin/AdminPoisPage.jsx`
  * API Service Client: `web/src/services/api.js` (`getPois`, `createPoi`, `updatePoi`, `verifyPoiCoordinates`, `updatePoiStatus`, `deletePoi`, `uploadPoiNarrationAudio`)
* **Backend:**
  * Controller: `src/API/Controllers/PoisController.cs`
    * `GET /api/pois` (Lọc theo `category`, `isActive`, `isVerified`, `search`, `areaId`)
    * `POST /api/pois`
    * `PUT /api/pois/{id}`
    * `PATCH /api/pois/{id}/verify-coordinates`
    * `PATCH /api/pois/{id}/status`
    * `DELETE /api/pois/{id}`
    * `POST /api/pois/{id}/narrations/{nid}/audio`
  * Service: `src/Application/Interfaces/IPoiService.cs`, `src/Infrastructure/Services/PoiService.cs`
* **Database & Storage:**
  * Bảng: `public.POINTS_OF_INTEREST`, `public.POI_NARRATIONS`
  * Supabase Storage: Bucket lưu trữ audio file cho các di tích lịch sử và danh thắng.
* **Quy tắc nghiệp vụ & Rẽ nhánh:**
  * Phân loại POI: `gate` (cổng vào), `monument` (đền vua Hùng, bảo tàng), `landmark` (cây di sản, hồ sen), `service` (quầy vé, y tế).
  * Nghiệp vụ kiểm định tọa độ: Đánh dấu `is_verified = true` kèm nguồn khảo sát thực tế (WGS84).

---

### 05. Quản lý vé (Ticket Management)
* **Tên file sơ đồ:** `05_Ticket_Management.drawio` | **Page 5 trong file tổng hợp**
* **Tác nhân tham gia:** `Administrator`, `Staff`
* **Frontend:**
  * Component: `web/src/pages/admin/AdminTicketsPage.jsx`
  * API Service Client: `web/src/services/api.js` (`getTickets`, `createTicket`, `updateTicketStatus`, `deleteTicket`)
* **Backend:**
  * Controller: `src/API/Controllers/TicketsController.cs`
    * `GET /api/tickets` (Lọc `search`, `ticketTypeId`, `status`, `page`, `pageSize`)
    * `POST /api/tickets` (Phát hành vé thủ công/tại quầy)
    * `PUT /api/tickets/{id}`
    * `PATCH /api/tickets/{id}/status`
    * `DELETE /api/tickets/{id}`
    * `GET /api/tickets/{ticketCode}/qr` (Xuất ảnh PNG mã QR của vé)
  * Service & Repo: `src/Application/Interfaces/ITicketService.cs`, `src/Infrastructure/Services/TicketService.cs`
* **Database:**
  * Bảng: `public.TICKETS` (`ticket_id`, `ticket_code`, `ticket_type_id`, `order_id`, `customer_name`, `valid_from`, `valid_until`, `status`)
  * Trạng thái vé (`TicketStatus` enum): `Valid` (1), `Used` (2), `Expired` (3), `Cancelled` (4), `Locked` (5).
* **Quy tắc nghiệp vụ:**
  * Thuật toán sinh mã ngẫu nhiên bảo mật tránh đoán mò (`RandomNumberGenerator`).
  * Không cho phép xóa vé nếu vé đó đã phát sinh phiên tham quan trong bảng `TICKET_SESSIONS`.

---

### 06. Quản lý loại vé (Ticket Type Management)
* **Tên file sơ đồ:** `06_Ticket_Type_Management.drawio` | **Page 6 trong file tổng hợp**
* **Tác nhân tham gia:** `Administrator`
* **Frontend:**
  * Component: `web/src/pages/admin/AdminTicketTypesPage.jsx`
  * API Service Client: `web/src/services/api.js` (`getTicketTypes`, `createTicketType`, `updateTicketType`, `deleteTicketType`)
* **Backend:**
  * Controller: `src/API/Controllers/TicketTypesController.cs`
    * `GET /api/ticket-types`
    * `POST /api/ticket-types`
    * `PUT /api/ticket-types/{id}`
    * `DELETE /api/ticket-types/{id}`
  * Service: `src/Application/Interfaces/ITicketTypeService.cs`, `src/Infrastructure/Services/TicketTypeService.cs`
* **Database:**
  * Bảng: `public.TICKET_TYPES` (`ticket_type_id`, `name`, `description`, `price`, `duration_minutes`, `is_active`)
* **Quy tắc nghiệp vụ:**
  * Giá vé (`price`) phải >= 0; thời lượng hiệu lực (`duration_minutes`) quy định thời gian phiên tham quan (thông thường 240 phút hoặc 480 phút).
  * Không được xóa loại vé nếu đang có đơn hàng hoặc vé trong hệ thống tham chiếu đến nó.

---

### 07. Quản lý phiên tham quan (Ticket Session Management)
* **Tên file sơ đồ:** `07_Ticket_Session_Management.drawio` | **Page 7 trong file tổng hợp**
* **Tác nhân tham gia:** `Visitor`, `Validated Visitor`, `Administrator`
* **Frontend:**
  * Component: `web/src/components/tickets/TicketsTab.jsx`, `web/src/components/tickets/ElectronicTicketModal.jsx`, `web/src/pages/admin/AdminTicketSessionsPage.jsx`
  * API Service Client: `web/src/services/api.js` (`validateTicket`, `verifyTicketSession`, `exitTicketSession`, `revokeTicketSession`, `getTicketSessions`)
* **Backend:**
  * Controller: `src/API/Controllers/TicketsController.cs`
    * `POST /api/tickets/validate`
    * `GET /api/tickets/sessions/verify` (`[RequireTicketSession]`)
    * `GET /api/tickets/sessions` (Giám sát cho Admin)
    * `POST /api/tickets/sessions/{id}/revoke`
    * `POST /api/tickets/sessions/exit`
  * Service: `src/Application/Services/TicketSessionService.cs`, `src/Infrastructure/Repositories/TicketSessionRepository.cs`
* **Database:**
  * Bảng: `public.TICKET_SESSIONS` (`session_id` UUID, `ticket_id`, `device_id`, `started_at`, `expired_at`, `status`)
* **Quy tắc nghiệp vụ 4 bước xác thực vé:**
  1. Kiểm tra tồn tại mã vé trong DB -> Không thấy báo `404 TICKET_NOT_FOUND`.
  2. Kiểm tra trạng thái vé: Bắt buộc phải là `Valid` -> Nếu `Used`, `Expired`, `Locked` báo lỗi `400`.
  3. Kiểm tra thời hạn: `DateTime.UtcNow <= ValidUntil`.
  4. Tạo bản ghi `TicketSession` mới với `ExpiredAt = Now + TicketType.DurationMinutes`, trả về token phiên cho thiết bị.

---

### 08. Quản lý thuyết minh (Audio Guide Management)
* **Tên file sơ đồ:** `08_Audio_Guide_Management.drawio` | **Page 8 trong file tổng hợp**
* **Tác nhân tham gia:** `Validated Visitor`
* **Frontend:**
  * Component: `web/src/components/species/SpeciesAudioTab.jsx`, `web/src/components/audio/AudioPlayerBar.jsx`, `web/src/components/audio/TranscriptModal.jsx`
  * API Service Client: `web/src/services/api.js` (`getSpeciesNarration`, `getPoiPublicNarration`)
* **Backend:**
  * Controller: `src/API/Controllers/NarrationsController.cs`, `src/API/Controllers/PoisController.cs`
    * `GET /api/narrations/species/{speciesId}?lang=...&sessionId=...`
    * `GET /api/narrations/{id}/stream`
    * `GET /api/pois/{id}/public-narration`
  * Filter bảo mật: `src/API/Filters/RequireTicketSessionAttribute.cs`
  * Service: `src/Application/Interfaces/INarrationService.cs`, `src/Infrastructure/Services/NarrationService.cs`
* **Database & Storage:**
  * Bảng: `public.NARRATIONS`, `public.AUDIOS`, `public.CONTENT_TRANSLATIONS`
  * Supabase Storage: Bucket lưu trữ các file audio đa ngôn ngữ.
* **Quy tắc nghiệp vụ & Fallback:**
  * Bắt buộc có `X-Session-Id` hợp lệ mới được lấy stream âm thanh (Bảo vệ nội dung số).
  * Cơ chế Fallback: Nếu không có bản dịch theo ngôn ngữ khách chọn, hệ thống tự động trả về bài thuyết minh Tiếng Việt (`vi`) kèm cờ `isFallbackLanguage = true`.

---

### 09. Thống kê Dashboard (Dashboard Statistics)
* **Tên file sơ đồ:** `09_Dashboard_Statistics.drawio` | **Page 9 trong file tổng hợp**
* **Tác nhân tham gia:** `Administrator`
* **Frontend:**
  * Component: `web/src/pages/admin/AdminDashboardPage.jsx`
  * API Service Client: `web/src/services/api.js` (`getDashboardStats`, `getOnlineUsers`)
* **Backend:**
  * Controller: `src/API/Controllers/DashboardController.cs`
    * `GET /api/dashboard/stats?fromDate=...&toDate=...`
    * `GET /api/dashboard/online-users`
  * Service: `src/Application/Interfaces/IDashboardService.cs`, `src/Infrastructure/Services/DashboardService.cs`
* **Database:**
  * Bảng: `public.TICKET_ORDERS`, `public.TICKETS`, `public.TICKET_SESSIONS`, `public.ANIMALS`, `public.DEVICE_ACTIVITIES`
* **Quy tắc nghiệp vụ:**
  * Tính tổng doanh thu từ đơn hàng `Paid`, đếm phân loại trạng thái vé, đếm phiên tham quan đang mở, và truy vấn cảnh báo sức khỏe thú y cần can thiệp.

---

### 10. Quản lý thiết bị (Device Management)
* **Tên file sơ đồ:** `10_Device_Management.drawio` | **Page 10 trong file tổng hợp**
* **Tác nhân tham gia:** `Visitor Device (Client)`, `Administrator`
* **Frontend:**
  * Service Module: `web/src/services/deviceTracker.js`, `web/src/services/api.js` (`sendDeviceHeartbeat`, `sendDeviceDisconnect`, `getActiveDevicesSummary`)
* **Backend:**
  * Controller: `src/API/Controllers/DevicesController.cs`
    * `POST /api/devices/heartbeat`
    * `POST /api/devices/disconnect`
    * `GET /api/devices/active-count`
  * Service & Real-time: `src/Application/Interfaces/IDeviceTrackingService.cs`, `src/Infrastructure/Services/DeviceTrackingService.cs`, `src/API/Hubs/OnlineTrackerHub.cs`
* **Database:**
  * Bảng: `public.DEVICE_ACTIVITIES` (`device_activity_id`, `installation_id`, `order_code`, `buyer_email`, `ip_address`, `user_agent`, `last_seen_at`, `is_active`)
* **Quy tắc nghiệp vụ:**
  * Heartbeat mỗi 30 giây; khi du khách đóng tab -> Gửi `navigator.sendBeacon` đến `/devices/disconnect`. Thiết bị không gửi tín hiệu quá 5 phút được tính là Offline.

---

### 11. Quản lý nhật ký (Activity Log Management)
* **Tên file sơ đồ:** `11_Activity_Log_Management.drawio` | **Page 11 trong file tổng hợp**
* **Tác nhân tham gia:** `Administrator`
* **Frontend:**
  * Component: `web/src/pages/admin/AdminDashboardPage.jsx`
  * API Service Client: `web/src/services/api.js` (`getAdminLogs`)
* **Backend:**
  * Controller: `src/API/Controllers/AdminLogsController.cs`
    * `GET /api/admin/logs?limit=50`
  * Service: `src/Application/Interfaces/IAuditLogService.cs`, `src/Infrastructure/Services/AuditLogService.cs`
* **Database:**
  * Bảng: Lịch sử audit log hệ thống (`AuditLogs`), `public.LOCATION_LOGS`, `public.VISIT_HISTORY`
* **Quy tắc nghiệp vụ:**
  * Truy vấn danh sách lịch sử thao tác theo thứ tự `Timestamp DESC`, hiển thị chi tiết payload thay đổi và địa chỉ IP.

---

### 12. Quản lý ngôn ngữ (Language Management)
* **Tên file sơ đồ:** `12_Language_Management.drawio` | **Page 12 trong file tổng hợp**
* **Tác nhân tham gia:** `Visitor`, `User`
* **Frontend:**
  * Context & Layout: `web/src/context/AppContext.jsx`, `web/src/components/layout/Header.jsx`
  * API Service Client: `web/src/services/api.js` (`getLanguages`, `getUiTranslations`, `getContentTranslations`)
* **Backend:**
  * Controller: `src/API/Controllers/LanguagesController.cs`
    * `GET /api/languages`
    * `GET /api/languages/{code}/ui`
    * `GET /api/languages/translations`
    * `POST /api/languages/translations`
  * Service: `src/Application/Interfaces/ITranslationService.cs`, `src/Infrastructure/Services/TranslationService.cs`
* **Database:**
  * Bảng: `public.LANGUAGES`, `public.CONTENT_TRANSLATIONS` (`entity_type`, `entity_id`, `field_name`, `language_code`, `translated_text`)
* **Quy tắc nghiệp vụ:**
  * Hỗ trợ đa ngôn ngữ linh hoạt (`vi`, `en`, `zh`, `ja`, `fr`...). Giao diện tải từ điển UI độc lập; dữ liệu nội dung nạp tự động theo `?lang=...` với fallback tiếng Việt.

---

### 13. Thanh toán (Payment Processing)
* **Tên file sơ đồ:** `13_Payment_Processing.drawio` | **Page 13 trong file tổng hợp**
* **Tác nhân tham gia:** `Visitor`, `External Payment (VietQR / SePay / Simulator)`
* **Frontend:**
  * Component: `web/src/components/tickets/TicketsTab.jsx`, `web/src/components/tickets/TicketModal.jsx`
  * API Service Client: `web/src/services/api.js` (`createOrder`, `simulateSandboxPayment`, `getOrderByCode`)
* **Backend:**
  * Controller: `src/API/Controllers/OrdersController.cs`, `src/API/Controllers/PaymentsController.cs`
    * `POST /api/orders/checkout`
    * `POST /api/payments/webhook` (Xác thực chữ ký `Authorization / X-Webhook-Secret`)
    * `POST /api/payments/simulate` (Bộ giả lập Sandbox)
    * `GET /api/orders/{orderCode}`
  * Service: `src/Application/Interfaces/IOrderService.cs`, `src/Infrastructure/Services/OrderService.cs`, `src/Infrastructure/Services/SmtpEmailService.cs`
* **Database:**
  * Bảng: `public.TICKET_ORDERS` (`order_id`, `order_code`, `payment_status`, `payment_description`, `qr_code_url`, `total_amount`, `paid_at`), `public.TICKETS`
* **Xác minh cơ chế thanh toán thực tế:**
  * Hệ thống hỗ trợ 2 cơ chế song song:
    1. **Thanh toán VietQR Napas thật:** Sinh mã chuyển khoản `ZGxxxxxx` và QR ảnh từ Napas VietQR. Cổng thanh toán gọi Webhook đối soát số tiền.
    2. **Thanh toán Sandbox giả lập:** Nhấn nút giả lập trên giao diện gửi `POST /api/payments/simulate` phục vụ kiểm thử không cần nạp tiền thật.
  * Tự động phát hành vé: Khi đơn đổi sang `Paid`, hệ thống tự động sinh các mã vé `TKT-xxxx-xxxx` trong bảng `TICKETS` và kích hoạt dịch vụ gửi email xác nhận.

---

### 14. Tra cứu thông tin sở thú (Zoo Information Lookup)
* **Tên file sơ đồ:** `14_Zoo_Information_Lookup.drawio` | **Page 14 trong file tổng hợp**
* **Tác nhân tham gia:** `Visitor`
* **Frontend:**
  * Component: `web/src/pages/visitor/VisitorPortal.jsx`, `web/src/components/animals/AnimalsTab.jsx`, `web/src/components/animals/AnimalDetailModal.jsx`
* **Backend:**
  * Controller: `src/API/Controllers/AnimalsController.cs`, `src/API/Controllers/SpeciesController.cs`, `src/API/Controllers/AreasController.cs`
* **Database:**
  * Bảng: `public.ANIMALS`, `public.SPECIES`, `public.AREAS`, `public.ENCLOSURES`, `public.CONTENT_TRANSLATIONS`
* **Quy tắc nghiệp vụ:**
  * Tìm kiếm tức thì theo từ khóa; lọc kết hợp nhiều điều kiện (Phân khu, Tình trạng sách đỏ IUCN CR/EN/VU).
  * Hiển thị modal hồ sơ sinh học và cung cấp các nút điều hướng chuyển tiếp nhanh sang Bản đồ số và Thuyết minh âm thanh.

---

### 15. Điều hướng tham quan (Zoo Navigation)
* **Tên file sơ đồ:** `15_Zoo_Navigation.drawio` | **Page 15 trong file tổng hợp**
* **Tác nhân tham gia:** `Visitor`, `Browser Geolocation API`
* **Frontend:**
  * Component & Engine: `web/src/components/map/MapTab.jsx`, `web/src/components/map/zooWalkwayGraph.js`
  * Giải thuật tìm đường: Dijkstra Algorithm `planZooRoute(startNode, targetNode, WALKWAY_NODES, WALKWAY_EDGES)`
* **Backend:**
  * Controller: `src/API/Controllers/AreasController.cs`, `src/API/Controllers/PoisController.cs`, `src/API/Controllers/EnclosuresController.cs`
* **Database:**
  * Bảng: `public.AREAS`, `public.ENCLOSURES`, `public.POINTS_OF_INTEREST`
* **Quy tắc nghiệp vụ thực tế:**
  * Mạng lưới đường đi bộ thực tế tại 2 Nguyễn Bỉnh Khiêm (4 cổng vào A, B, C, E, các điểm di tích và chuồng thú).
  * Khách chọn GPS tự động (`navigator.geolocation`) hoặc chọn cổng vào thủ công.
  * Tính năng Geofencing: Tự động kích hoạt thuyết minh khi du khách di chuyển vào bán kính < 50m quanh chuồng thú (`watchPosition`).

---

### 16. Mua và sử dụng vé (Ticket Purchase and Usage)
* **Tên file sơ đồ:** `16_Ticket_Purchase_And_Usage.drawio` | **Page 16 trong file tổng hợp**
* **Tác nhân tham gia:** `Visitor` (Chưa có vé) -> chuyển đổi thành `Validated Visitor` (Đã xác thực vé)
* **Tổng quan hành trình khách hàng (End-to-End Customer Journey):**
  * Giai đoạn 1: Khách chọn hạng vé, điền thông tin, tạo đơn hàng VietQR Napas (15 phút đếm ngược).
  * Giai đoạn 2: Khách quét QR chuyển khoản hoặc bấm Giả lập Sandbox -> Backend xác nhận, sinh mã vé `TKT-xxxx-xxxx` và gửi email.
  * Giai đoạn 3: Khách nhận vé điện tử, bấm "Kích hoạt phiên ngay" -> Backend xác thực tính hợp lệ -> Mở phiên `TicketSession`.
  * Giai đoạn 4: Khách trở thành `Validated Visitor`, mở khóa toàn bộ tính năng Thuyết minh âm thanh, Bản đồ Dijkstra và Định vị GPS.
  * Giai đoạn 5: Kết thúc phiên khi khách bấm "Thoát phiên" hoặc hết thời hạn hiệu lực của loại vé.
* **Backend & Database liên quan:**
  * Controllers: `OrdersController`, `PaymentsController`, `TicketsController`, `NarrationsController`
  * Bảng: `TICKET_ORDERS`, `TICKETS`, `TICKET_SESSIONS`, `NARRATIONS`

---

## III. TỔNG HỢP KIỂM ĐỊNH CHẤT LƯỢNG

1. **Chuẩn UML 2.x:**
   - 100% sơ đồ có **Initial Node** (vòng tròn đen) và **Activity Final Node** (vòng tròn đôi có tâm đen).
   - Các hành động (**Action**) được đặt tên theo động từ rõ ràng.
   - Các điểm quyết định (**Decision Node**) có nhãn điều kiện rẽ nhánh cụ thể (`[Hợp lệ]`, `[Không hợp lệ]`, `[Thành công]`, `[Thất bại]`, `[Chưa tồn tại]`...).
   - Sử dụng **Fork Node** và **Join Node** tại các quy trình song song (Dashboard Statistics, Quyền lợi Validated Visitor).
2. **Quy chuẩn đồ họa học thuật & 2 Swimlanes:**
   - **Đúng 2 Swimlanes:** Phân chia rành mạch giữa Người dùng (User / Administrator / Visitor / Staff) và Hệ thống (System). Tuyệt đối không tách rời Frontend, Backend, Database nhằm đảm bảo đúng phương pháp phân tích nghiệp vụ ca sử dụng OOAD.
   - **Tối ưu hiển thị:** Nền trắng, viền đen, chữ đen (`#000000` / `#FFFFFF`). Không sử dụng màu trang trí lòe loẹt hay hiệu ứng đổ bóng.
   - **Bố cục Top-down:** Luồng chạy tự nhiên từ trên xuống dưới, căn chỉnh cân đối giúp chèn vào Word/PDF không bị co chữ hay tràn lề.
3. **Tính khả dụng của file Draw.io:**
   - File tổng hợp `ZooGuide_16_Activity_Diagrams.drawio` chứa đầy đủ 16 page độc lập, mở và chỉnh sửa trực tiếp trên diagrams.net.
   - 16 file riêng lẻ trong thư mục `Individual_Diagrams/` phục vụ báo cáo chuyên biệt.
