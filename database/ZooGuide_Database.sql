/*
========================================================================================
 PROJECT: ZooGuide - Smart Multilingual Zoo Audio Tour Platform
 SCRIPT: ZooGuide_Database.sql
 PURPOSE: Official Database Architecture & "Single Source of Truth" Contract
 TARGET RDBMS: Microsoft SQL Server 2019 / 2022 / 2025
 GENERATED & VERIFIED FOR: Entity Framework Core 8.0 Integration
========================================================================================
*/

-- 1. INITIALIZE DATABASE
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ZooGuide')
BEGIN
    CREATE DATABASE [ZooGuide];
    PRINT N'Created database [ZooGuide].';
END
GO

USE [ZooGuide];
GO

-- 2. DROP EXISTING TABLES IN REVERSE DEPENDENCY ORDER (SAFE RESET FOR DEVELOPMENT)
IF OBJECT_ID(N'dbo.CHAT_MESSAGES', N'U') IS NOT NULL DROP TABLE dbo.CHAT_MESSAGES;
IF OBJECT_ID(N'dbo.CHAT_SESSIONS', N'U') IS NOT NULL DROP TABLE dbo.CHAT_SESSIONS;
IF OBJECT_ID(N'dbo.LOCATION_LOGS', N'U') IS NOT NULL DROP TABLE dbo.LOCATION_LOGS;
IF OBJECT_ID(N'dbo.USER_LOYALTY', N'U') IS NOT NULL DROP TABLE dbo.USER_LOYALTY;
IF OBJECT_ID(N'dbo.MEMBERSHIP_LEVELS', N'U') IS NOT NULL DROP TABLE dbo.MEMBERSHIP_LEVELS;
IF OBJECT_ID(N'dbo.VISIT_HISTORY', N'U') IS NOT NULL DROP TABLE dbo.VISIT_HISTORY;
IF OBJECT_ID(N'dbo.AUDIOS', N'U') IS NOT NULL DROP TABLE dbo.AUDIOS;
IF OBJECT_ID(N'dbo.NARRATIONS', N'U') IS NOT NULL DROP TABLE dbo.NARRATIONS;
IF OBJECT_ID(N'dbo.ANIMALS', N'U') IS NOT NULL DROP TABLE dbo.ANIMALS;
IF OBJECT_ID(N'dbo.AREAS', N'U') IS NOT NULL DROP TABLE dbo.AREAS;
IF OBJECT_ID(N'dbo.SPECIES', N'U') IS NOT NULL DROP TABLE dbo.SPECIES;
IF OBJECT_ID(N'dbo.TICKET_SESSIONS', N'U') IS NOT NULL DROP TABLE dbo.TICKET_SESSIONS;
IF OBJECT_ID(N'dbo.TICKETS', N'U') IS NOT NULL DROP TABLE dbo.TICKETS;
IF OBJECT_ID(N'dbo.TICKET_TYPES', N'U') IS NOT NULL DROP TABLE dbo.TICKET_TYPES;
IF OBJECT_ID(N'dbo.LANGUAGES', N'U') IS NOT NULL DROP TABLE dbo.LANGUAGES;
IF OBJECT_ID(N'dbo.USERS', N'U') IS NOT NULL DROP TABLE dbo.USERS;
GO

PRINT N'Existing tables dropped successfully.';
GO

-- ========================================================================================
-- 3. CREATE CORE TABLES
-- ========================================================================================

-- ----------------------------------------------------------------------------------------
-- TABLE: USERS
-- MỤC ĐÍCH: Lưu trữ tài khoản người dùng có đăng ký (Visitor, Staff, Admin).
-- VÌ SAO TỒN TẠI: Phân quyền quản trị hệ thống, nhân viên cập nhật thông tin chuồng trại/thuyết minh,
--   và hỗ trợ du khách đăng nhập để tích điểm/lưu lịch sử tham quan.
-- QUAN HỆ:
--   - 1 USERS -> N TICKET_SESSIONS (phiên tham quan khi đăng nhập)
--   - 1 USERS -> N VISIT_HISTORY (lịch sử các chuyến tham quan)
--   - 1 USERS -> N NARRATIONS (CreatedBy - nhân viên tạo bài thuyết minh)
--   - 1 USERS -> 1 USER_LOYALTY (thông tin điểm thưởng thành viên)
-- CHỨC NĂNG SỬ DỤNG: Authentication, Authorization, Account Profile, Loyalty, Narration Management.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.USERS (
    UserId INT IDENTITY(1,1) NOT NULL,
    Username NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(256) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (GETUTCDATE()),
    UpdatedAt DATETIME2 NULL,
    LastLoginAt DATETIME2 NULL,

    CONSTRAINT PK_USERS PRIMARY KEY CLUSTERED (UserId),
    CONSTRAINT UQ_Users_Username UNIQUE (Username),
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT CK_Users_Role CHECK (Role IN ('Visitor', 'Staff', 'Admin')),
    CONSTRAINT CK_Users_Status CHECK (Status IN ('Active', 'Locked'))
);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: LANGUAGES
-- MỤC ĐÍCH: Lưu danh mục các ngôn ngữ hỗ trợ thuyết minh (vi, en, zh, ja, ko...).
-- VÌ SAO TỒN TẠI: Đảm bảo khả năng mở rộng đa ngôn ngữ không giới hạn, không duplicate tên ngôn ngữ.
-- QUAN HỆ: 1 LANGUAGES -> N NARRATIONS.
-- CHỨC NĂNG SỬ DỤNG: Đổi ngôn ngữ giao diện & thuyết minh âm thanh theo du khách.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.LANGUAGES (
    LanguageId INT IDENTITY(1,1) NOT NULL,
    Code NVARCHAR(10) NOT NULL,
    Name NVARCHAR(50) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Languages_IsActive DEFAULT (1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Languages_CreatedAt DEFAULT (GETUTCDATE()),
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT PK_LANGUAGES PRIMARY KEY CLUSTERED (LanguageId),
    CONSTRAINT UQ_Languages_Code UNIQUE (Code)
);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: TICKET_TYPES
-- MỤC ĐÍCH: Định nghĩa các loại vé bán tại sở thú (Vé người lớn, trẻ em, sinh viên, VIP...).
-- VÌ SAO TỒN TẠI: Phục vụ quản lý giá vé, thời hạn hiệu lực của vé khi tạo phiên tham quan.
-- QUAN HỆ: 1 TICKET_TYPES -> N TICKETS.
-- CHỨC NĂNG SỬ DỤNG: Bán vé, kiểm soát quyền truy cập và tính toán thời gian hết hạn vé.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.TICKET_TYPES (
    TicketTypeId INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    Price DECIMAL(18,2) NOT NULL,
    DurationMinutes INT NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_TicketTypes_IsActive DEFAULT (1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_TicketTypes_CreatedAt DEFAULT (GETUTCDATE()),
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT PK_TICKET_TYPES PRIMARY KEY CLUSTERED (TicketTypeId),
    CONSTRAINT CK_TicketTypes_Price CHECK (Price >= 0),
    CONSTRAINT CK_TicketTypes_Duration CHECK (DurationMinutes > 0)
);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: TICKETS
-- MỤC ĐÍCH: Lưu trữ vé tham quan được phát hành cho du khách.
-- VÌ SAO TỒN TẠI: TicketCode là chuỗi duy nhất được mã hóa thành mã QR hoặc barcode trên vé giấy/điện tử.
-- ĐẶC BIỆT: Không lưu binary ảnh QR trong database. Ticket không phụ thuộc bắt buộc vào User,
--   cho phép khách vãng lai mua vé trực tiếp tại quầy và tham quan mà không cần lập tài khoản.
-- QUAN HỆ:
--   - N TICKETS -> 1 TICKET_TYPES
--   - 1 TICKETS -> N TICKET_SESSIONS
--   - 1 TICKETS -> N VISIT_HISTORY
-- CHỨC NĂNG SỬ DỤNG: Quét QR mở khóa ứng dụng (QR Ticket Validation).
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.TICKETS (
    TicketId INT IDENTITY(1,1) NOT NULL,
    TicketCode NVARCHAR(50) NOT NULL,
    TicketTypeId INT NOT NULL,
    IssuedAt DATETIME2 NOT NULL CONSTRAINT DF_Tickets_IssuedAt DEFAULT (GETUTCDATE()),
    ValidFrom DATETIME2 NOT NULL,
    ValidUntil DATETIME2 NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    UsedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Tickets_CreatedAt DEFAULT (GETUTCDATE()),
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT PK_TICKETS PRIMARY KEY CLUSTERED (TicketId),
    CONSTRAINT UQ_Tickets_TicketCode UNIQUE (TicketCode),
    CONSTRAINT FK_Tickets_TicketType FOREIGN KEY (TicketTypeId) REFERENCES dbo.TICKET_TYPES (TicketTypeId) ON DELETE NO ACTION,
    CONSTRAINT CK_Tickets_Status CHECK (Status IN ('Valid', 'Used', 'Expired', 'Cancelled', 'Locked')),
    CONSTRAINT CK_Tickets_ValidDate CHECK (ValidUntil >= ValidFrom)
);
GO

CREATE NONCLUSTERED INDEX IX_Tickets_TicketTypeId ON dbo.TICKETS (TicketTypeId);
CREATE NONCLUSTERED INDEX IX_Tickets_Status ON dbo.TICKETS (Status);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: TICKET_SESSIONS
-- MỤC ĐÍCH: Lưu phiên truy cập ZooGuide được sinh ra sau khi vé hợp lệ được quét thành công.
-- VÌ SAO TỒN TẠI:
--   1. Là cầu nối phân quyền runtime: Mở khóa các chức năng (Bản đồ số, Thuyết minh, Chatbot).
--   2. UserId NULL: Dành cho du khách vãng lai không cần tài khoản.
--   3. UserId NOT NULL: Dành cho du khách đã đăng nhập (hệ thống liên kết phiên với User).
--   4. Quản lý trạng thái phiên (Active, Expired, Ended, Revoked) và tọa độ vị trí cuối cùng của du khách.
-- QUAN HỆ:
--   - N TICKET_SESSIONS -> 1 TICKETS
--   - N TICKET_SESSIONS -> 1 USERS (Nullable)
--   - 1 TICKET_SESSIONS -> N LOCATION_LOGS
--   - 1 TICKET_SESSIONS -> N CHAT_SESSIONS
-- CHỨC NĂNG SỬ DỤNG: Quản lý phiên tham quan, bảo mật truy cập theo thời gian thực.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.TICKET_SESSIONS (
    SessionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_TicketSessions_SessionId DEFAULT (NEWID()),
    TicketId INT NOT NULL,
    UserId INT NULL,
    StartedAt DATETIME2 NOT NULL CONSTRAINT DF_TicketSessions_StartedAt DEFAULT (GETUTCDATE()),
    ExpiredAt DATETIME2 NOT NULL,
    EndedAt DATETIME2 NULL,
    Status NVARCHAR(20) NOT NULL,
    LastLatitude DECIMAL(9,6) NULL,
    LastLongitude DECIMAL(9,6) NULL,
    LastLocationAt DATETIME2 NULL,

    CONSTRAINT PK_TICKET_SESSIONS PRIMARY KEY CLUSTERED (SessionId),
    CONSTRAINT FK_TicketSessions_Tickets FOREIGN KEY (TicketId) REFERENCES dbo.TICKETS (TicketId) ON DELETE NO ACTION,
    CONSTRAINT FK_TicketSessions_Users FOREIGN KEY (UserId) REFERENCES dbo.USERS (UserId) ON DELETE SET NULL,
    CONSTRAINT CK_TicketSessions_Status CHECK (Status IN ('Active', 'Expired', 'Ended', 'Revoked')),
    CONSTRAINT CK_TicketSessions_ExpiredAt CHECK (ExpiredAt >= StartedAt)
);
GO

CREATE NONCLUSTERED INDEX IX_TicketSessions_TicketId ON dbo.TICKET_SESSIONS (TicketId);
CREATE NONCLUSTERED INDEX IX_TicketSessions_UserId ON dbo.TICKET_SESSIONS (UserId);
CREATE NONCLUSTERED INDEX IX_TicketSessions_Status ON dbo.TICKET_SESSIONS (Status);
CREATE NONCLUSTERED INDEX IX_TicketSessions_TicketId_Status ON dbo.TICKET_SESSIONS (TicketId, Status);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: SPECIES
-- MỤC ĐÍCH: Lưu danh mục các loài động vật học (Sư tử, Hổ Bengal, Voi Châu Á...).
-- VÌ SAO TỒN TẠI: Tách biệt thông tin khoa học của loài và từng cá thể động vật cụ thể.
-- QUAN HỆ: 1 SPECIES -> N ANIMALS.
-- CHỨC NĂNG SỬ DỤNG: Tra cứu theo loài, phân loại sinh học, tình trạng bảo tồn (IUCN Red List).
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.SPECIES (
    SpeciesId INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    ScientificName NVARCHAR(150) NULL,
    Description NVARCHAR(1000) NULL,
    ConservationStatus NVARCHAR(50) NULL,
    ImageUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Species_CreatedAt DEFAULT (GETUTCDATE()),
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT PK_SPECIES PRIMARY KEY CLUSTERED (SpeciesId),
    CONSTRAINT UQ_Species_Name UNIQUE (Name)
);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: AREAS
-- MỤC ĐÍCH: Lưu trữ vị trí không gian và tọa độ cố định của các phân khu chuồng trại trong sở thú.
-- NGUYÊN TẮC QUAN TRỌNG:
--   - Bảng này CHỈ lưu tọa độ cố định của khu vực (Latitude, Longitude) và bán kính nhận diện (RadiusMeters).
--   - TUYỆT ĐỐI KHÔNG lưu tọa độ GPS của visitor vào đây (tọa độ du khách lưu ở TICKET_SESSIONS/LOCATION_LOGS).
--   - RadiusMeters được ứng dụng dùng để tính khoảng cách (geofencing) khi du khách tiến đến gần.
-- QUAN HỆ: 1 AREAS -> N ANIMALS.
-- CHỨC NĂNG SỬ DỤNG: Bản đồ tương tác sở thú, tính năng tự động kích hoạt thuyết minh khi tới gần chuồng.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.AREAS (
    AreaId INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(1000) NULL,
    Latitude DECIMAL(9,6) NOT NULL,
    Longitude DECIMAL(9,6) NOT NULL,
    RadiusMeters DECIMAL(8,2) NOT NULL,
    MapImageUrl NVARCHAR(500) NULL,
    Status NVARCHAR(20) NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Areas_CreatedAt DEFAULT (GETUTCDATE()),
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT PK_AREAS PRIMARY KEY CLUSTERED (AreaId),
    CONSTRAINT UQ_Areas_Name UNIQUE (Name),
    CONSTRAINT CK_Areas_Radius CHECK (RadiusMeters > 0),
    CONSTRAINT CK_Areas_Status CHECK (Status IN ('Active', 'Maintenance', 'Closed'))
);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: ANIMALS
-- MỤC ĐÍCH: Lưu trữ thông tin từng cá thể động vật trong sở thú.
-- NGUYÊN TẮC:
--   - Không duplicate tên loài hoặc đặc tính khoa học (đã có ở SPECIES).
--   - Không lưu trực tiếp văn bản thuyết minh hoặc file audio (quản lý ở NARRATIONS/AUDIOS).
-- QUAN HỆ:
--   - N ANIMALS -> 1 SPECIES
--   - N ANIMALS -> 1 AREAS
--   - 1 ANIMALS -> N NARRATIONS
-- CHỨC NĂNG SỬ DỤNG: Quản lý động vật, tìm kiếm động vật, hiển thị hồ sơ cá thể cho du khách.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.ANIMALS (
    AnimalId INT IDENTITY(1,1) NOT NULL,
    SpeciesId INT NOT NULL,
    AreaId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(1000) NULL,
    Gender NVARCHAR(10) NOT NULL,
    DateOfBirth DATE NULL,
    Origin NVARCHAR(200) NULL,
    HealthStatus NVARCHAR(200) NULL,
    ConservationNote NVARCHAR(500) NULL,
    ImageUrl NVARCHAR(500) NULL,
    Status NVARCHAR(20) NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Animals_CreatedAt DEFAULT (GETUTCDATE()),
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT PK_ANIMALS PRIMARY KEY CLUSTERED (AnimalId),
    CONSTRAINT FK_Animals_Species FOREIGN KEY (SpeciesId) REFERENCES dbo.SPECIES (SpeciesId) ON DELETE NO ACTION,
    CONSTRAINT FK_Animals_Areas FOREIGN KEY (AreaId) REFERENCES dbo.AREAS (AreaId) ON DELETE NO ACTION,
    CONSTRAINT CK_Animals_Gender CHECK (Gender IN ('Unknown', 'Male', 'Female')),
    CONSTRAINT CK_Animals_Status CHECK (Status IN ('Active', 'UnderTreatment', 'Transferred', 'Deceased'))
);
GO

CREATE NONCLUSTERED INDEX IX_Animals_SpeciesId ON dbo.ANIMALS (SpeciesId);
CREATE NONCLUSTERED INDEX IX_Animals_AreaId ON dbo.ANIMALS (AreaId);
CREATE NONCLUSTERED INDEX IX_Animals_Status ON dbo.ANIMALS (Status);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: NARRATIONS
-- MỤC ĐÍCH: Bảng TRỌNG TÂM của đề tài "Thuyết minh tự động đa ngôn ngữ".
-- VÌ SAO TỒN TẠI: Cho phép mỗi con vật có thể được thuyết minh bằng nhiều ngôn ngữ khác nhau.
-- NGUYÊN TẮC & CONSTRAINTS:
--   - UNIQUE (AnimalId, LanguageId): Một cá thể chỉ có tối đa 1 bài thuyết minh active cho mỗi ngôn ngữ.
--   - CreatedBy tham chiếu USERS để truy vết trách nhiệm biên tập nội dung.
--   - Content & Title sử dụng NVARCHAR để hỗ trợ tiếng Việt có dấu, chữ Hán, chữ Nhật...
-- QUAN HỆ:
--   - N NARRATIONS -> 1 ANIMALS
--   - N NARRATIONS -> 1 LANGUAGES
--   - N NARRATIONS -> 1 USERS (CreatedBy)
--   - 1 NARRATIONS -> N AUDIOS
-- CHỨC NĂNG SỬ DỤNG: Hệ thống thuyết minh tự động, hiển thị lời thoại và phát âm thanh.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.NARRATIONS (
    NarrationId INT IDENTITY(1,1) NOT NULL,
    AnimalId INT NOT NULL,
    LanguageId INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    AudioUrl NVARCHAR(500) NULL,
    DurationSeconds INT NULL,
    Status NVARCHAR(20) NOT NULL,
    CreatedBy INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Narrations_CreatedAt DEFAULT (GETUTCDATE()),
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT PK_NARRATIONS PRIMARY KEY CLUSTERED (NarrationId),
    CONSTRAINT UQ_Narrations_Animal_Language UNIQUE (AnimalId, LanguageId),
    CONSTRAINT FK_Narrations_Animals FOREIGN KEY (AnimalId) REFERENCES dbo.ANIMALS (AnimalId) ON DELETE CASCADE,
    CONSTRAINT FK_Narrations_Languages FOREIGN KEY (LanguageId) REFERENCES dbo.LANGUAGES (LanguageId) ON DELETE NO ACTION,
    CONSTRAINT FK_Narrations_Users FOREIGN KEY (CreatedBy) REFERENCES dbo.USERS (UserId) ON DELETE NO ACTION,
    CONSTRAINT CK_Narrations_Status CHECK (Status IN ('Draft', 'Published', 'Archived'))
);
GO

CREATE NONCLUSTERED INDEX IX_Narrations_LanguageId ON dbo.NARRATIONS (LanguageId);
CREATE NONCLUSTERED INDEX IX_Narrations_CreatedBy ON dbo.NARRATIONS (CreatedBy);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: AUDIOS
-- MỤC ĐÍCH: Quản lý chi tiết các file âm thanh thuyết minh tương ứng với từng bài thuyết minh.
-- NGUYÊN TẮC THIẾT KẾ:
--   - TUYỆT ĐỐI KHÔNG lưu file audio binary trong SQL Server (chỉ lưu URL/path, dung lượng, thời lượng).
--   - Quan hệ 1 NARRATIONS -> N AUDIOS cho phép linh hoạt lưu nhiều chất lượng âm thanh (128kbps, 320kbps),
--     nhiều giọng đọc khác nhau (giọng nam, giọng nữ) hoặc các định dạng khác nhau (mp3, aac, ogg).
-- QUAN HỆ: N AUDIOS -> 1 NARRATIONS (Cascade delete khi xóa bài thuyết minh).
-- CHỨC NĂNG SỬ DỤNG: Audio Player của du khách, phát âm thanh tự động theo định vị hoặc bấm nghe.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.AUDIOS (
    AudioId INT IDENTITY(1,1) NOT NULL,
    NarrationId INT NOT NULL,
    FileUrl NVARCHAR(500) NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    MimeType NVARCHAR(100) NOT NULL CONSTRAINT DF_Audios_MimeType DEFAULT ('audio/mpeg'),
    DurationSeconds INT NULL,
    FileSize BIGINT NULL,
    Status NVARCHAR(20) NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Audios_CreatedAt DEFAULT (GETUTCDATE()),
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT PK_AUDIOS PRIMARY KEY CLUSTERED (AudioId),
    CONSTRAINT FK_Audios_Narrations FOREIGN KEY (NarrationId) REFERENCES dbo.NARRATIONS (NarrationId) ON DELETE CASCADE,
    CONSTRAINT CK_Audios_Status CHECK (Status IN ('Active', 'Inactive', 'Processing'))
);
GO

CREATE NONCLUSTERED INDEX IX_Audios_NarrationId ON dbo.AUDIOS (NarrationId);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: VISIT_HISTORY
-- MỤC ĐÍCH: Lưu trữ lịch sử các lần đến sở thú của khách hàng có tài khoản.
-- NGUYÊN TẮC:
--   - Chỉ tạo VisitHistory khi du khách ĐÃ ĐĂNG NHẬP tài khoản (UserId NOT NULL).
--   - Du khách vãng lai (Anonymous) vẫn tham quan đầy đủ nhưng không ghi nhận vào bảng này.
--   - Phục vụ làm căn cứ tính tổng số lần đi sở thú (TotalVisits) và điểm thưởng thành viên (Loyalty).
-- QUAN HỆ:
--   - N VISIT_HISTORY -> 1 USERS
--   - N VISIT_HISTORY -> 1 TICKETS
--   - N VISIT_HISTORY -> 1 TICKET_SESSIONS
-- CHỨC NĂNG SỬ DỤNG: Xem lịch sử tham quan, báo cáo lượng khách, chương trình thành viên.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.VISIT_HISTORY (
    VisitId INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    TicketId INT NOT NULL,
    SessionId UNIQUEIDENTIFIER NOT NULL,
    VisitedAt DATETIME2 NOT NULL CONSTRAINT DF_VisitHistory_VisitedAt DEFAULT (GETUTCDATE()),

    CONSTRAINT PK_VISIT_HISTORY PRIMARY KEY CLUSTERED (VisitId),
    CONSTRAINT FK_VisitHistory_Users FOREIGN KEY (UserId) REFERENCES dbo.USERS (UserId) ON DELETE NO ACTION,
    CONSTRAINT FK_VisitHistory_Tickets FOREIGN KEY (TicketId) REFERENCES dbo.TICKETS (TicketId) ON DELETE NO ACTION,
    CONSTRAINT FK_VisitHistory_Sessions FOREIGN KEY (SessionId) REFERENCES dbo.TICKET_SESSIONS (SessionId) ON DELETE NO ACTION
);
GO

CREATE NONCLUSTERED INDEX IX_VisitHistory_UserId ON dbo.VISIT_HISTORY (UserId);
CREATE NONCLUSTERED INDEX IX_VisitHistory_TicketId ON dbo.VISIT_HISTORY (TicketId);
CREATE NONCLUSTERED INDEX IX_VisitHistory_SessionId ON dbo.VISIT_HISTORY (SessionId);
GO

-- ========================================================================================
-- 4. CREATE EXTENDED TABLES (MODULES: GPS LOGS, LOYALTY, CHATBOT)
-- ========================================================================================

-- ----------------------------------------------------------------------------------------
-- TABLE: LOCATION_LOGS
-- MỤC ĐÍCH: Lưu trữ vết lộ trình di chuyển (GPS coordinates) theo phiên tham quan (tùy chọn).
-- NGUYÊN TẮC:
--   - Không lưu UserId trực tiếp để bảo vệ quyền riêng tư và tránh dư thừa vì đã có SessionId.
--   - Ở giai đoạn MVP không bắt buộc ping mọi giây, chỉ lưu các mốc tọa độ cần thiết.
-- QUAN HỆ: N LOCATION_LOGS -> 1 TICKET_SESSIONS.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.LOCATION_LOGS (
    LocationLogId BIGINT IDENTITY(1,1) NOT NULL,
    SessionId UNIQUEIDENTIFIER NOT NULL,
    Latitude DECIMAL(9,6) NOT NULL,
    Longitude DECIMAL(9,6) NOT NULL,
    Accuracy DECIMAL(6,2) NULL,
    RecordedAt DATETIME2 NOT NULL CONSTRAINT DF_LocationLogs_RecordedAt DEFAULT (GETUTCDATE()),

    CONSTRAINT PK_LOCATION_LOGS PRIMARY KEY CLUSTERED (LocationLogId),
    CONSTRAINT FK_LocationLogs_Sessions FOREIGN KEY (SessionId) REFERENCES dbo.TICKET_SESSIONS (SessionId) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX IX_LocationLogs_SessionId_RecordedAt ON dbo.LOCATION_LOGS (SessionId, RecordedAt);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: MEMBERSHIP_LEVELS
-- MỤC ĐÍCH: Lưu các hạng thẻ thành viên thân thiết (Đồng, Bạc, Vàng, Kim Cương).
-- QUAN HỆ: 1 MEMBERSHIP_LEVELS -> N USER_LOYALTY.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.MEMBERSHIP_LEVELS (
    MembershipLevelId INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(50) NOT NULL,
    MinPoints INT NOT NULL CONSTRAINT DF_MembershipLevels_MinPoints DEFAULT (0),
    Description NVARCHAR(255) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_MembershipLevels_IsActive DEFAULT (1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_MembershipLevels_CreatedAt DEFAULT (GETUTCDATE()),
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT PK_MEMBERSHIP_LEVELS PRIMARY KEY CLUSTERED (MembershipLevelId),
    CONSTRAINT UQ_MembershipLevels_Name UNIQUE (Name),
    CONSTRAINT CK_MembershipLevels_MinPoints CHECK (MinPoints >= 0)
);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: USER_LOYALTY
-- MỤC ĐÍCH: Lưu điểm thưởng tích lũy và hạng thành viên của từng User.
-- QUAN HỆ: 1-1 với USERS (UserId vừa là PK vừa là FK).
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.USER_LOYALTY (
    UserId INT NOT NULL,
    Points INT NOT NULL CONSTRAINT DF_UserLoyalty_Points DEFAULT (0),
    MembershipLevelId INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_UserLoyalty_UpdatedAt DEFAULT (GETUTCDATE()),

    CONSTRAINT PK_USER_LOYALTY PRIMARY KEY CLUSTERED (UserId),
    CONSTRAINT FK_UserLoyalty_Users FOREIGN KEY (UserId) REFERENCES dbo.USERS (UserId) ON DELETE CASCADE,
    CONSTRAINT FK_UserLoyalty_MembershipLevels FOREIGN KEY (MembershipLevelId) REFERENCES dbo.MEMBERSHIP_LEVELS (MembershipLevelId) ON DELETE NO ACTION,
    CONSTRAINT CK_UserLoyalty_Points CHECK (Points >= 0)
);
GO

CREATE NONCLUSTERED INDEX IX_UserLoyalty_MembershipLevelId ON dbo.USER_LOYALTY (MembershipLevelId);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: CHAT_SESSIONS
-- MỤC ĐÍCH: Lưu phiên hỗ trợ hỏi đáp bằng chatbot giữa du khách và hệ thống.
-- QUAN HỆ: N CHAT_SESSIONS -> 1 TICKET_SESSIONS.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.CHAT_SESSIONS (
    ChatSessionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ChatSessions_Id DEFAULT (NEWID()),
    SessionId UNIQUEIDENTIFIER NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_ChatSessions_CreatedAt DEFAULT (GETUTCDATE()),
    EndedAt DATETIME2 NULL,

    CONSTRAINT PK_CHAT_SESSIONS PRIMARY KEY CLUSTERED (ChatSessionId),
    CONSTRAINT FK_ChatSessions_Sessions FOREIGN KEY (SessionId) REFERENCES dbo.TICKET_SESSIONS (SessionId) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX IX_ChatSessions_SessionId ON dbo.CHAT_SESSIONS (SessionId);
GO

-- ----------------------------------------------------------------------------------------
-- TABLE: CHAT_MESSAGES
-- MỤC ĐÍCH: Lưu chi tiết tin nhắn trong phiên hội thoại chatbot.
-- QUAN HỆ: N CHAT_MESSAGES -> 1 CHAT_SESSIONS.
-- ----------------------------------------------------------------------------------------
CREATE TABLE dbo.CHAT_MESSAGES (
    MessageId BIGINT IDENTITY(1,1) NOT NULL,
    ChatSessionId UNIQUEIDENTIFIER NOT NULL,
    SenderType NVARCHAR(20) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_ChatMessages_CreatedAt DEFAULT (GETUTCDATE()),

    CONSTRAINT PK_CHAT_MESSAGES PRIMARY KEY CLUSTERED (MessageId),
    CONSTRAINT FK_ChatMessages_Sessions FOREIGN KEY (ChatSessionId) REFERENCES dbo.CHAT_SESSIONS (ChatSessionId) ON DELETE CASCADE,
    CONSTRAINT CK_ChatMessages_Sender CHECK (SenderType IN ('Visitor', 'Bot', 'Staff'))
);
GO

CREATE NONCLUSTERED INDEX IX_ChatMessages_ChatSessionId ON dbo.CHAT_MESSAGES (ChatSessionId);
GO

PRINT N'All 16 tables, constraints, and indexes created successfully.';
GO

-- ========================================================================================
-- 5. SEED DATA (MOCK DATA CHO TEST & PHÁT TRIỂN)
-- ========================================================================================

-- 5.1 SEED USERS (Password hashes for: Admin@123456, Staff@123456, Visitor@123456)
SET IDENTITY_INSERT dbo.USERS ON;
INSERT INTO dbo.USERS (UserId, Username, Email, PasswordHash, FullName, Role, Status, CreatedAt)
VALUES
(1, N'admin', N'admin@zooguide.vn', N'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', N'Hệ Thống Quản Trị Viên', N'Admin', N'Active', GETUTCDATE()),
(2, N'staff_hoang', N'hoang.nv@zooguide.vn', N'6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', N'Nguyễn Văn Hoàng (Cán bộ phụ trách)', N'Staff', N'Active', GETUTCDATE()),
(3, N'visitor_an', N'an.nguyen@gmail.com', N'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', N'Nguyễn Văn An', N'Visitor', N'Active', GETUTCDATE());
SET IDENTITY_INSERT dbo.USERS OFF;
GO

-- 5.2 SEED LANGUAGES
SET IDENTITY_INSERT dbo.LANGUAGES ON;
INSERT INTO dbo.LANGUAGES (LanguageId, Code, Name, IsActive, CreatedAt)
VALUES
(1, N'vi', N'Tiếng Việt', 1, GETUTCDATE()),
(2, N'en', N'English', 1, GETUTCDATE()),
(3, N'zh', N'中文 (Chinese)', 1, GETUTCDATE()),
(4, N'ja', N'日本語 (Japanese)', 1, GETUTCDATE());
SET IDENTITY_INSERT dbo.LANGUAGES OFF;
GO

-- 5.3 SEED TICKET_TYPES
SET IDENTITY_INSERT dbo.TICKET_TYPES ON;
INSERT INTO dbo.TICKET_TYPES (TicketTypeId, Name, Description, Price, DurationMinutes, IsActive, CreatedAt)
VALUES
(1, N'Vé Người Lớn (Adult Pass)', N'Vé tham quan tiêu chuẩn dành cho du khách từ 1m3 trở lên, hỗ trợ thuyết minh và bản đồ GPS', 120000.00, 480, 1, GETUTCDATE()),
(2, N'Vé Trẻ Em (Child Pass)', N'Dành cho trẻ em cao dưới 1m3. Trẻ em dưới 1 tuổi được miễn phí vé', 60000.00, 480, 1, GETUTCDATE()),
(3, N'Vé Sinh Viên / Học Sinh (Student Pass)', N'Ưu đãi cho học sinh, sinh viên có thẻ học sinh/sinh viên còn hiệu lực', 80000.00, 480, 1, GETUTCDATE()),
(4, N'Vé VIP Gia Đình (VIP Family Pass)', N'Vé trọn gói gia đình kèm hướng dẫn viên âm thanh nâng cao và quà lưu niệm', 350000.00, 600, 1, GETUTCDATE());
SET IDENTITY_INSERT dbo.TICKET_TYPES OFF;
GO

-- 5.4 SEED TICKETS (Valid, Used, Expired, Cancelled)
SET IDENTITY_INSERT dbo.TICKETS ON;
INSERT INTO dbo.TICKETS (TicketId, TicketCode, TicketTypeId, IssuedAt, ValidFrom, ValidUntil, Status, UsedAt, CreatedAt)
VALUES
(1, N'ZOO-2026-VAL01', 1, GETUTCDATE(), CAST(GETUTCDATE() AS DATE), DATEADD(DAY, 1, CAST(GETUTCDATE() AS DATE)), N'Valid', NULL, GETUTCDATE()),
(2, N'ZOO-2026-USD02', 3, DATEADD(HOUR, -3, GETUTCDATE()), CAST(GETUTCDATE() AS DATE), DATEADD(DAY, 1, CAST(GETUTCDATE() AS DATE)), N'Used', DATEADD(HOUR, -2, GETUTCDATE()), GETUTCDATE()),
(3, N'ZOO-2026-EXP03', 2, DATEADD(DAY, -4, GETUTCDATE()), DATEADD(DAY, -4, CAST(GETUTCDATE() AS DATE)), DATEADD(DAY, -3, CAST(GETUTCDATE() AS DATE)), N'Expired', NULL, GETUTCDATE()),
(4, N'ZOO-2026-CAN04', 4, DATEADD(DAY, -1, GETUTCDATE()), CAST(GETUTCDATE() AS DATE), DATEADD(DAY, 1, CAST(GETUTCDATE() AS DATE)), N'Cancelled', NULL, GETUTCDATE());
SET IDENTITY_INSERT dbo.TICKETS OFF;
GO

-- 5.5 SEED TICKET_SESSIONS (Anonymous session vs Logged-in visitor session)
DECLARE @SessionAnon UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111111';
DECLARE @SessionUser UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222222';

INSERT INTO dbo.TICKET_SESSIONS (SessionId, TicketId, UserId, StartedAt, ExpiredAt, EndedAt, Status, LastLatitude, LastLongitude, LastLocationAt)
VALUES
(@SessionAnon, 1, NULL, DATEADD(MINUTE, -30, GETUTCDATE()), DATEADD(MINUTE, 450, GETUTCDATE()), NULL, N'Active', 10.787500, 106.705100, DATEADD(MINUTE, -5, GETUTCDATE())),
(@SessionUser, 2, 3, DATEADD(HOUR, -2, GETUTCDATE()), DATEADD(HOUR, 6, GETUTCDATE()), NULL, N'Active', 10.789200, 106.706500, DATEADD(MINUTE, -10, GETUTCDATE()));
GO

-- 5.6 SEED VISIT_HISTORY (Logged-in visitor only)
SET IDENTITY_INSERT dbo.VISIT_HISTORY ON;
INSERT INTO dbo.VISIT_HISTORY (VisitId, UserId, TicketId, SessionId, VisitedAt)
VALUES
(1, 3, 2, '22222222-2222-2222-2222-222222222222', DATEADD(HOUR, -2, GETUTCDATE()));
SET IDENTITY_INSERT dbo.VISIT_HISTORY OFF;
GO

-- 5.7 SEED LOCATION_LOGS
SET IDENTITY_INSERT dbo.LOCATION_LOGS ON;
INSERT INTO dbo.LOCATION_LOGS (LocationLogId, SessionId, Latitude, Longitude, Accuracy, RecordedAt)
VALUES
(1, '22222222-2222-2222-2222-222222222222', 10.787000, 106.704800, 4.5, DATEADD(HOUR, -2, GETUTCDATE())),
(2, '22222222-2222-2222-2222-222222222222', 10.788100, 106.705500, 3.8, DATEADD(HOUR, -1, GETUTCDATE()));
SET IDENTITY_INSERT dbo.LOCATION_LOGS OFF;
GO

-- 5.8 SEED MEMBERSHIP_LEVELS & USER_LOYALTY
SET IDENTITY_INSERT dbo.MEMBERSHIP_LEVELS ON;
INSERT INTO dbo.MEMBERSHIP_LEVELS (MembershipLevelId, Name, MinPoints, Description, IsActive, CreatedAt)
VALUES
(1, N'Đồng (Bronze)', 0, N'Hạng cơ bản khi đăng ký tài khoản', 1, GETUTCDATE()),
(2, N'Bạc (Silver)', 100, N'Tích lũy từ 100 điểm, giảm 5% giá vé', 1, GETUTCDATE()),
(3, N'Vàng (Gold)', 300, N'Tích lũy từ 300 điểm, giảm 10% giá vé + ưu tiên sự kiện', 1, GETUTCDATE()),
(4, N'Kim Cương (Diamond)', 600, N'Thẻ VIP trọn đời, miễn phí thuyết minh cao cấp', 1, GETUTCDATE());
SET IDENTITY_INSERT dbo.MEMBERSHIP_LEVELS OFF;
GO

INSERT INTO dbo.USER_LOYALTY (UserId, Points, MembershipLevelId, UpdatedAt)
VALUES
(3, 150, 2, GETUTCDATE());
GO

-- 5.9 SEED SPECIES (Lion, Tiger, Elephant, Eagle)
SET IDENTITY_INSERT dbo.SPECIES ON;
INSERT INTO dbo.SPECIES (SpeciesId, Name, ScientificName, Description, ConservationStatus, ImageUrl, CreatedAt)
VALUES
(1, N'Sư tử Châu Phi', N'Panthera leo', N'Loài động vật săn mồi hàng đầu tại các đồng cỏ xavan châu Phi.', N'VU (Sắp nguy cấp)', N'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=800', GETUTCDATE()),
(2, N'Hổ Bengal', N'Panthera tigris tigris', N'Phân loài hổ lớn thứ hai thế giới, sinh sống ở Nam Á và Đông Nam Á.', N'EN (Nguy cấp)', N'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800', GETUTCDATE()),
(3, N'Voi Châu Á', N'Elephas maximus', N'Loài thú ăn cỏ trên cạn lớn nhất tại khu vực Châu Á.', N'EN (Nguy cấp)', N'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=800', GETUTCDATE()),
(4, N'Đại bàng Hoàng Gia', N'Aquila heliaca', N'Loài chim săn mồi dũng mãnh với sải cánh rộng và tầm nhìn siêu việt.', N'VU (Sắp nguy cấp)', N'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=800', GETUTCDATE());
SET IDENTITY_INSERT dbo.SPECIES OFF;
GO

-- 5.10 SEED AREAS (Khu Sư tử, Khu Hổ, Khu Voi, Khu Chim)
SET IDENTITY_INSERT dbo.AREAS ON;
INSERT INTO dbo.AREAS (AreaId, Name, Description, Latitude, Longitude, RadiusMeters, MapImageUrl, Status, CreatedAt)
VALUES
(1, N'Khu Sư Tử (Lion Savannah)', N'Khuôn viên mô phỏng thảo nguyên xavan mở cho đàn sư tử hoàng gia.', 10.787520, 106.705250, 35.00, N'/assets/maps/zone_lion.png', N'Active', GETUTCDATE()),
(2, N'Khu Hổ (Tiger Habitat)', N'Khu rừng mưa nhiệt đới có hồ tắm dành riêng cho loài hổ bơi lội.', 10.788640, 106.706180, 30.00, N'/assets/maps/zone_tiger.png', N'Active', GETUTCDATE()),
(3, N'Khu Voi (Elephant Valley)', N'Thung lũng đồng cỏ rộng lớn với bãi tắm bùn tự nhiên cho đàn voi.', 10.789500, 106.707300, 50.00, N'/assets/maps/zone_elephant.png', N'Active', GETUTCDATE()),
(4, N'Khu Chim (Aviary Paradise)', N'Nhà lồng vòm không gian mở cho các loài chim bay lượn tự do.', 10.786900, 106.704200, 40.00, N'/assets/maps/zone_bird.png', N'Active', GETUTCDATE());
SET IDENTITY_INSERT dbo.AREAS OFF;
GO

-- 5.11 SEED ANIMALS (8 cá thể phong phú)
SET IDENTITY_INSERT dbo.ANIMALS ON;
INSERT INTO dbo.ANIMALS (AnimalId, SpeciesId, AreaId, Name, Description, Gender, DateOfBirth, Origin, HealthStatus, ConservationNote, ImageUrl, Status, CreatedAt)
VALUES
(1, 1, 1, N'Simba', N'Sư tử đực đầu đàn dũng mãnh, có bờm đen sẫm đặc trưng.', N'Male', '2019-05-12', N'Vườn quốc gia Serengeti, Tanzania', N'Khỏe mạnh, sung mãn', N'Tham gia chương trình bảo tồn nhân giống quốc tế', N'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800', N'Active', GETUTCDATE()),
(2, 1, 1, N'Nala', N'Sư tử cái nhanh nhẹn, là bạn đời của Simba.', N'Female', '2020-08-20', N'Khu bảo tồn Masai Mara, Kenya', N'Khỏe mạnh - Đang nuôi 1 con nhỏ', N'Sinh sản thành công lứa đầu tiên tháng 02/2026', N'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=800', N'Active', GETUTCDATE()),
(3, 2, 2, N'Lâm Nhi', N'Hổ cái Bengal rất thích đùa giỡn dưới nước.', N'Female', '2021-03-15', N'Trung tâm cứu hộ động vật hoang dã Cát Tiên', N'Khỏe mạnh, định kỳ kiểm tra móng', N'Nằm trong danh mục bảo vệ nghiêm ngặt', N'https://images.unsplash.com/photo-1500463959177-e0869687df26?w=800', N'Active', GETUTCDATE()),
(4, 2, 2, N'Cường Đô', N'Hổ đực Bengal trưởng thành, trọng lượng trên 220kg.', N'Male', '2018-11-04', N'Vườn thú Singapore (trao đổi giống)', N'Khỏe mạnh', N'Gen thuần chủng F1', N'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800', N'Active', GETUTCDATE()),
(5, 3, 3, N'Bác Tai To', N'Voi đực đầu đàn thân thiện, rất thích ăn mía và chuối từ du khách.', N'Male', '2010-07-01', N'Buôn Đôn, Đắk Lắk', N'Ổn định - Khám nha khoa định kỳ', N'Voi cứu hộ từ khu du lịch cũ', N'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=800', N'Active', GETUTCDATE()),
(6, 3, 3, N'Bé Na', N'Voi cái hiền lành, luôn quấn quýt bên đàn voi trưởng thành.', N'Female', '2022-12-10', N'Sở thú ZooGuide (sinh sản tự nhiên)', N'Rất tốt, tăng cân đều đặn', N'Cá thể voi con sinh ra đầu tiên tại vườn thú', N'https://images.unsplash.com/photo-1581852017103-68ac65504071?w=800', N'Active', GETUTCDATE()),
(7, 4, 4, N'Phong Thần', N'Đại bàng hoàng gia với sải cánh dài hơn 2 mét.', N'Male', '2021-06-25', N'Dãy núi Altai, Mông Cổ', N'Khỏe mạnh, thị lực hoàn hảo', N'Được theo dõi hành vi bay lượn định kỳ', N'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=800', N'Active', GETUTCDATE()),
(8, 4, 4, N'Kim Ưng', N'Đại bàng cái kiêu hãnh với bộ lông óng ánh màu nâu vàng.', N'Female', '2022-04-18', N'Khu bảo tồn Thiên Sơn', N'Khỏe mạnh', N'Đang trong độ tuổi sinh sản', N'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800', N'Active', GETUTCDATE());
SET IDENTITY_INSERT dbo.ANIMALS OFF;
GO

-- 5.12 SEED NARRATIONS (Đa ngôn ngữ: vi, en, zh)
SET IDENTITY_INSERT dbo.NARRATIONS ON;
INSERT INTO dbo.NARRATIONS (NarrationId, AnimalId, LanguageId, Title, Content, AudioUrl, DurationSeconds, Status, CreatedBy, CreatedAt)
VALUES
(1, 1, 1, N'Sư Tử Simba - Chúa Tể Thảo Nguyên Xavan', N'Chào mừng quý khách đến với phân khu Sư tử. Trước mắt quý khách là Simba, chú sư tử đực 7 tuổi với bộ bờm đen dày đặc - dấu hiệu của sức mạnh và thể lực sung mãn. Sư tử là loài duy nhất trong họ Mèo sống theo bầy đàn có tính xã hội cao.', N'/assets/audio/simba_vi.mp3', 120, N'Published', 2, GETUTCDATE()),
(2, 1, 2, N'Simba the African Lion - King of the Savannah', N'Welcome to the African Lion habitat. Meet Simba, our magnificent 7-year-old male lion. Lions are uniquely social among all wild felids, living in structured prides where females hunt cooperatively.', N'/assets/audio/simba_en.mp3', 115, N'Published', 2, GETUTCDATE()),
(3, 1, 3, N'非洲狮辛巴 - 草原之王', N'欢迎来到非洲狮展区。展现在您眼前的是辛巴，一只7岁的成年雄狮。狮子是猫科动物中唯一过着高度群居生活的物种。', N'/assets/audio/simba_zh.mp3', 110, N'Published', 2, GETUTCDATE()),
(4, 3, 1, N'Hổ Bengal Lâm Nhi - Sát Thủ Rừng Rậm', N'Hổ Bengal là một trong những loài săn mồi uy nghi nhất hành tinh. Không giống như hầu hết các loài mèo sợ nước, hổ Bengal bơi lội cự phách và thường xuyên ngâm mình dưới hồ nước vào những ngày nắng nóng.', N'/assets/audio/tiger_vi.mp3', 95, N'Published', 2, GETUTCDATE()),
(5, 3, 2, N'Lam Nhi the Bengal Tiger - Majestic Predator', N'Bengal tigers are among the world''s most iconic predators. Unlike many other felines, tigers love swimming and frequently bathe in cool water pools during hot afternoons.', N'/assets/audio/tiger_en.mp3', 90, N'Published', 2, GETUTCDATE()),
(6, 5, 1, N'Voi Bác Tai To - Người Khổng Lồ Hiền Lành', N'Voi Châu Á có đôi tai nhỏ hơn voi Châu Phi và lưng có hình vòm cung. Chiếc vòi voi chứa hơn 40.000 bó cơ, giúp chúng cầm nắm vật nhỏ như hạt đậu hoặc nhấc bổng thân cây nặng hàng trăm kilogram.', N'/assets/audio/elephant_vi.mp3', 130, N'Published', 1, GETUTCDATE()),
(7, 5, 2, N'Big Ears the Asian Elephant - Gentle Giant', N'Asian elephants are characterized by their smaller ears and arched back. An elephant''s trunk features more than 40,000 muscles, capable of grasping delicate leaves or lifting massive tree trunks.', N'/assets/audio/elephant_en.mp3', 125, N'Published', 1, GETUTCDATE()),
(8, 7, 1, N'Đại Bàng Phong Thần - Chúa Tể Bầu Trời', N'Đại bàng hoàng gia sở hữu thị lực gấp 8 lần con người, cho phép chúng phát hiện con mồi nhỏ từ khoảng cách hơn 3 kilomet trên bầu trời.', N'/assets/audio/eagle_vi.mp3', 85, N'Published', 2, GETUTCDATE()),
(9, 7, 2, N'Sky Lord the Imperial Eagle - Ruler of the Skies', N'The imperial eagle possesses eyesight up to eight times sharper than a human''s, allowing it to spot small prey from over three kilometers away in mid-flight.', N'/assets/audio/eagle_en.mp3', 80, N'Published', 2, GETUTCDATE());
SET IDENTITY_INSERT dbo.NARRATIONS OFF;
GO

-- 5.13 SEED AUDIOS (Metadata only, NO binary data in DB)
SET IDENTITY_INSERT dbo.AUDIOS ON;
INSERT INTO dbo.AUDIOS (AudioId, NarrationId, FileUrl, FileName, MimeType, DurationSeconds, FileSize, Status, CreatedAt)
VALUES
(1, 1, N'/assets/audio/simba_vi_studio.mp3', N'simba_vi_studio.mp3', N'audio/mpeg', 120, 2450000, N'Active', GETUTCDATE()),
(2, 2, N'/assets/audio/simba_en_studio.mp3', N'simba_en_studio.mp3', N'audio/mpeg', 115, 2300000, N'Active', GETUTCDATE()),
(3, 4, N'/assets/audio/tiger_vi_studio.mp3', N'tiger_vi_studio.mp3', N'audio/mpeg', 95, 1900000, N'Active', GETUTCDATE());
SET IDENTITY_INSERT dbo.AUDIOS OFF;
GO

-- 5.14 SEED CHAT_SESSIONS & CHAT_MESSAGES
DECLARE @ChatSessionId UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333333';
INSERT INTO dbo.CHAT_SESSIONS (ChatSessionId, SessionId, CreatedAt)
VALUES (@ChatSessionId, '22222222-2222-2222-2222-222222222222', DATEADD(MINUTE, -20, GETUTCDATE()));

SET IDENTITY_INSERT dbo.CHAT_MESSAGES ON;
INSERT INTO dbo.CHAT_MESSAGES (MessageId, ChatSessionId, SenderType, Content, CreatedAt)
VALUES
(1, @ChatSessionId, N'Visitor', N'Cho tôi hỏi giờ cho sư tử ăn là mấy giờ?', DATEADD(MINUTE, -20, GETUTCDATE())),
(2, @ChatSessionId, N'Bot', N'Khu Sư tử có giờ ăn cố định vào lúc 10:00 sáng và 15:30 chiều hàng ngày. Bạn đang ở gần Khu Sư tử cách khoảng 35m!', DATEADD(MINUTE, -19, GETUTCDATE()));
SET IDENTITY_INSERT dbo.CHAT_MESSAGES OFF;
GO

PRINT N'Sample seed data inserted successfully.';
GO

-- ========================================================================================
-- 6. VERIFICATION & TEST QUERIES (12 BỘ TEST TRUY VẤN NỀN TẢNG)
-- ========================================================================================

PRINT N'=== 1. Danh sách Animal + Species + Area ===';
SELECT 
    a.AnimalId,
    a.Name AS AnimalName,
    a.Gender,
    s.Name AS SpeciesName,
    s.ScientificName,
    s.ConservationStatus,
    ar.Name AS AreaName,
    ar.RadiusMeters
FROM dbo.ANIMALS a
INNER JOIN dbo.SPECIES s ON a.SpeciesId = s.SpeciesId
INNER JOIN dbo.AREAS ar ON a.AreaId = ar.AreaId
ORDER BY ar.AreaId, a.AnimalId;
GO

PRINT N'=== 2. Animal + Narration + Language ===';
SELECT 
    a.AnimalId,
    a.Name AS AnimalName,
    l.Code AS LangCode,
    l.Name AS LanguageName,
    n.Title AS NarrationTitle,
    n.DurationSeconds,
    n.AudioUrl
FROM dbo.ANIMALS a
INNER JOIN dbo.NARRATIONS n ON a.AnimalId = n.AnimalId
INNER JOIN dbo.LANGUAGES l ON n.LanguageId = l.LanguageId
ORDER BY a.AnimalId, l.LanguageId;
GO

PRINT N'=== 3. Ticket + TicketType ===';
SELECT 
    t.TicketId,
    t.TicketCode,
    tt.Name AS TicketTypeName,
    tt.Price,
    tt.DurationMinutes,
    t.Status AS TicketStatus,
    t.ValidFrom,
    t.ValidUntil
FROM dbo.TICKETS t
INNER JOIN dbo.TICKET_TYPES tt ON t.TicketTypeId = tt.TicketTypeId
ORDER BY t.TicketId;
GO

PRINT N'=== 4. Ticket + TicketSession + User ===';
SELECT 
    ts.SessionId,
    t.TicketCode,
    tt.Name AS TicketType,
    ts.Status AS SessionStatus,
    ISNULL(u.Username, N'(Khách vãng lai - Anonymous)') AS VisitorUsername,
    ISNULL(u.FullName, N'N/A') AS VisitorFullName,
    ts.StartedAt,
    ts.ExpiredAt
FROM dbo.TICKET_SESSIONS ts
INNER JOIN dbo.TICKETS t ON ts.TicketId = t.TicketId
INNER JOIN dbo.TICKET_TYPES tt ON t.TicketTypeId = tt.TicketTypeId
LEFT JOIN dbo.USERS u ON ts.UserId = u.UserId;
GO

PRINT N'=== 5. Visitor Anonymous Session (UserId = NULL) ===';
SELECT 
    ts.SessionId,
    t.TicketCode,
    ts.Status,
    ts.StartedAt,
    ts.ExpiredAt,
    ts.LastLatitude,
    ts.LastLongitude
FROM dbo.TICKET_SESSIONS ts
INNER JOIN dbo.TICKETS t ON ts.TicketId = t.TicketId
WHERE ts.UserId IS NULL;
GO

PRINT N'=== 6. Visitor Logged-in Session (UserId IS NOT NULL) ===';
SELECT 
    ts.SessionId,
    t.TicketCode,
    u.UserId,
    u.Username,
    u.FullName,
    ts.Status,
    ts.LastLatitude,
    ts.LastLongitude
FROM dbo.TICKET_SESSIONS ts
INNER JOIN dbo.TICKETS t ON ts.TicketId = t.TicketId
INNER JOIN dbo.USERS u ON ts.UserId = u.UserId;
GO

PRINT N'=== 7. Danh sách Area có GPS ===';
SELECT 
    AreaId,
    Name AS AreaName,
    Latitude,
    Longitude,
    RadiusMeters,
    Status
FROM dbo.AREAS
WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL;
GO

PRINT N'=== 8. Logic khoảng cách Geofencing (Khoảng cách Haversine tham khảo) ===';
-- Ví dụ: Tính khoảng cách từ vị trí khách (10.787500, 106.705100) tới các khu vực
DECLARE @UserLat FLOAT = 10.787500;
DECLARE @UserLon FLOAT = 10.705100;

SELECT 
    AreaId,
    Name AS AreaName,
    RadiusMeters,
    -- Công thức Haversine tính cự ly tính bằng mét
    ROUND(
        6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(Latitude - @UserLat) / 2), 2) +
            COS(RADIANS(@UserLat)) * COS(RADIANS(Latitude)) *
            POWER(SIN(RADIANS(Longitude - @UserLon) / 2), 2)
        )), 2
    ) AS DistanceToVisitorMeters,
    CASE 
        WHEN 6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(Latitude - @UserLat) / 2), 2) +
            COS(RADIANS(@UserLat)) * COS(RADIANS(Latitude)) *
            POWER(SIN(RADIANS(Longitude - @UserLon) / 2), 2)
        )) <= RadiusMeters THEN N'ĐANG Ở TRONG KHU VỰC'
        ELSE N'NGOÀI KHU VỰC'
    END AS GeofenceStatus
FROM dbo.AREAS;
GO

PRINT N'=== 9. Danh sách narration theo language (Ví dụ: Tiếng Việt) ===';
SELECT 
    n.NarrationId,
    a.Name AS AnimalName,
    n.Title,
    n.Content,
    n.AudioUrl,
    n.DurationSeconds
FROM dbo.NARRATIONS n
INNER JOIN dbo.ANIMALS a ON n.AnimalId = a.AnimalId
INNER JOIN dbo.LANGUAGES l ON n.LanguageId = l.LanguageId
WHERE l.Code = 'vi';
GO

PRINT N'=== 10. Lịch sử tham quan của Visitor (Visit History) ===';
SELECT 
    vh.VisitId,
    u.Username,
    u.FullName,
    t.TicketCode,
    vh.SessionId,
    vh.VisitedAt
FROM dbo.VISIT_HISTORY vh
INNER JOIN dbo.USERS u ON vh.UserId = u.UserId
INNER JOIN dbo.TICKETS t ON vh.TicketId = t.TicketId
ORDER BY vh.VisitedAt DESC;
GO

PRINT N'=== 11. Loyalty data của User ===';
SELECT 
    u.UserId,
    u.Username,
    u.FullName,
    ul.Points,
    ml.Name AS MembershipLevel,
    ml.MinPoints,
    ml.Description AS LevelPerks
FROM dbo.USER_LOYALTY ul
INNER JOIN dbo.USERS u ON ul.UserId = u.UserId
INNER JOIN dbo.MEMBERSHIP_LEVELS ml ON ul.MembershipLevelId = ml.MembershipLevelId;
GO

PRINT N'=== 12. Chat session & Messages ===';
SELECT 
    cs.ChatSessionId,
    cs.SessionId AS TicketSessionId,
    cm.MessageId,
    cm.SenderType,
    cm.Content,
    cm.CreatedAt
FROM dbo.CHAT_SESSIONS cs
INNER JOIN dbo.CHAT_MESSAGES cm ON cs.ChatSessionId = cm.ChatSessionId
ORDER BY cm.CreatedAt ASC;
GO
