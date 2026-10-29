using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;

namespace ZooGuide.Infrastructure.Data;

/// <summary>
/// Data Seeder providing realistic initial seed data for ZooGuide development & testing.
/// </summary>
public static class ZooGuideDataSeeder
{
    public static string HashPassword(string password)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password + "_ZooGuideSalt2026"));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static async Task SeedAsync(ZooGuideDbContext context)
    {
        if (await context.Users.AnyAsync())
        {
            return; // Data already seeded
        }

        // 1. Seed USERS
        var adminUser = new User
        {
            Username = "admin",
            Email = "admin@zooguide.vn",
            PasswordHash = HashPassword("Admin@123456"),
            FullName = "Hệ Thống Quản Trị Viên",
            Role = UserRole.Admin,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var staffUser = new User
        {
            Username = "staff_hoang",
            Email = "hoang.nv@zooguide.vn",
            PasswordHash = HashPassword("Staff@123456"),
            FullName = "Nguyễn Văn Hoàng (Cán bộ phụ trách)",
            Role = UserRole.Staff,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var visitorUser = new User
        {
            Username = "visitor_an",
            Email = "an.nguyen@gmail.com",
            PasswordHash = HashPassword("Visitor@123456"),
            FullName = "Nguyễn Văn An",
            Role = UserRole.Visitor,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(adminUser, staffUser, visitorUser);
        await context.SaveChangesAsync();

        // 2. Seed LANGUAGES (12 Supported Languages)
        var langVi = new Language { Code = "vi", Name = "Tiếng Việt", NativeName = "Tiếng Việt", FlagIcon = "🇻🇳", TtsVoice = "vi-VN-HoaiMyNeural", DisplayOrder = 1, IsActive = true };
        var langEn = new Language { Code = "en", Name = "English", NativeName = "English", FlagIcon = "🇬🇧", TtsVoice = "en-US-JennyNeural", DisplayOrder = 2, IsActive = true };
        var langZh = new Language { Code = "zh", Name = "Chinese", NativeName = "简体中文", FlagIcon = "🇨🇳", TtsVoice = "zh-CN-XiaoxiaoNeural", DisplayOrder = 3, IsActive = true };
        var langJa = new Language { Code = "ja", Name = "Japanese", NativeName = "日本語", FlagIcon = "🇯🇵", TtsVoice = "ja-JP-NanamiNeural", DisplayOrder = 4, IsActive = true };
        var langKo = new Language { Code = "ko", Name = "Korean", NativeName = "한국어", FlagIcon = "🇰🇷", TtsVoice = "ko-KR-SunHiNeural", DisplayOrder = 5, IsActive = true };
        var langTh = new Language { Code = "th", Name = "Thai", NativeName = "ภาษาไทย", FlagIcon = "🇹🇭", TtsVoice = "th-TH-NiwatNeural", DisplayOrder = 6, IsActive = true };
        var langFr = new Language { Code = "fr", Name = "French", NativeName = "Français", FlagIcon = "🇫🇷", TtsVoice = "fr-FR-DeniseNeural", DisplayOrder = 7, IsActive = true };
        var langEs = new Language { Code = "es", Name = "Spanish", NativeName = "Español", FlagIcon = "🇪🇸", TtsVoice = "es-ES-ElviraNeural", DisplayOrder = 8, IsActive = true };
        var langDe = new Language { Code = "de", Name = "German", NativeName = "Deutsch", FlagIcon = "🇩🇪", TtsVoice = "de-DE-KatjaNeural", DisplayOrder = 9, IsActive = true };
        var langRu = new Language { Code = "ru", Name = "Russian", NativeName = "Русский", FlagIcon = "🇷🇺", TtsVoice = "ru-RU-SvetlanaNeural", DisplayOrder = 10, IsActive = true };
        var langPt = new Language { Code = "pt", Name = "Portuguese", NativeName = "Português", FlagIcon = "🇵🇹", TtsVoice = "pt-BR-FranciscaNeural", DisplayOrder = 11, IsActive = true };
        var langId = new Language { Code = "id", Name = "Indonesian", NativeName = "Bahasa Indonesia", FlagIcon = "🇮🇩", TtsVoice = "id-ID-GadisNeural", DisplayOrder = 12, IsActive = true };

        context.Languages.AddRange(langVi, langEn, langZh, langJa, langKo, langTh, langFr, langEs, langDe, langRu, langPt, langId);
        await context.SaveChangesAsync();

        // 3. Seed TICKET_TYPES
        var ttAdult = new TicketType
        {
            Name = "Vé Người Lớn (Adult Pass)",
            Description = "Vé tham quan tiêu chuẩn dành cho du khách từ 1m3 trở lên, hỗ trợ thuyết minh và bản đồ GPS",
            Price = 120000m,
            DurationMinutes = 480, // 8 tiếng
            IsActive = true
        };

        var ttChild = new TicketType
        {
            Name = "Vé Trẻ Em (Child Pass)",
            Description = "Dành cho trẻ em cao dưới 1m3. Trẻ em dưới 1 tuổi được miễn phí vé",
            Price = 60000m,
            DurationMinutes = 480,
            IsActive = true
        };

        var ttStudent = new TicketType
        {
            Name = "Vé Sinh Viên / Học Sinh (Student Pass)",
            Description = "Ưu đãi cho học sinh, sinh viên có thẻ học sinh/sinh viên còn hiệu lực",
            Price = 80000m,
            DurationMinutes = 480,
            IsActive = true
        };

        var ttVip = new TicketType
        {
            Name = "Vé VIP Gia Đình (VIP Family Pass)",
            Description = "Vé trọn gói gia đình kèm hướng dẫn viên âm thanh nâng cao và quà lưu niệm",
            Price = 350000m,
            DurationMinutes = 600,
            IsActive = true
        };

        context.TicketTypes.AddRange(ttAdult, ttChild, ttStudent, ttVip);
        await context.SaveChangesAsync();

        // 4. Seed TICKETS
        var tValid = new Ticket
        {
            TicketCode = "ZOO-2026-VAL01",
            TicketTypeId = ttAdult.TicketTypeId,
            IssuedAt = DateTime.UtcNow,
            ValidFrom = DateTime.UtcNow.Date,
            ValidUntil = DateTime.UtcNow.Date.AddDays(1).AddTicks(-1),
            Status = TicketStatus.Valid
        };

        var tUsed = new Ticket
        {
            TicketCode = "ZOO-2026-USD02",
            TicketTypeId = ttStudent.TicketTypeId,
            IssuedAt = DateTime.UtcNow.AddHours(-3),
            ValidFrom = DateTime.UtcNow.Date,
            ValidUntil = DateTime.UtcNow.Date.AddDays(1).AddTicks(-1),
            Status = TicketStatus.Used,
            UsedAt = DateTime.UtcNow.AddHours(-2)
        };

        var tExpired = new Ticket
        {
            TicketCode = "ZOO-2026-EXP03",
            TicketTypeId = ttChild.TicketTypeId,
            IssuedAt = DateTime.UtcNow.AddDays(-3),
            ValidFrom = DateTime.UtcNow.AddDays(-3).Date,
            ValidUntil = DateTime.UtcNow.AddDays(-2).Date,
            Status = TicketStatus.Expired
        };

        var tCancelled = new Ticket
        {
            TicketCode = "ZOO-2026-CAN04",
            TicketTypeId = ttVip.TicketTypeId,
            IssuedAt = DateTime.UtcNow.AddDays(-1),
            ValidFrom = DateTime.UtcNow.Date,
            ValidUntil = DateTime.UtcNow.Date.AddDays(1),
            Status = TicketStatus.Cancelled
        };

        context.Tickets.AddRange(tValid, tUsed, tExpired, tCancelled);
        await context.SaveChangesAsync();

        // 5. Seed TICKET_SESSIONS
        // Session 1: Anonymous visitor using tValid (UserId = null)
        var anonSession = new TicketSession
        {
            SessionId = Guid.NewGuid(),
            TicketId = tValid.TicketId,
            UserId = null,
            StartedAt = DateTime.UtcNow.AddMinutes(-30),
            ExpiredAt = DateTime.UtcNow.AddMinutes(450),
            Status = SessionStatus.Active,
            LastLatitude = 10.787500m,
            LastLongitude = 106.705100m,
            LastLocationAt = DateTime.UtcNow.AddMinutes(-5)
        };

        // Session 2: Logged-in visitor using tUsed (linked to visitorUser)
        var userSession = new TicketSession
        {
            SessionId = Guid.NewGuid(),
            TicketId = tUsed.TicketId,
            UserId = visitorUser.UserId,
            StartedAt = DateTime.UtcNow.AddHours(-2),
            ExpiredAt = DateTime.UtcNow.AddHours(6),
            Status = SessionStatus.Active,
            LastLatitude = 10.789200m,
            LastLongitude = 106.706500m,
            LastLocationAt = DateTime.UtcNow.AddMinutes(-10)
        };

        context.TicketSessions.AddRange(anonSession, userSession);
        await context.SaveChangesAsync();

        // 6. Seed VISIT_HISTORY (only for logged-in visitor)
        var visitHistory = new VisitHistory
        {
            UserId = visitorUser.UserId,
            TicketId = tUsed.TicketId,
            SessionId = userSession.SessionId,
            VisitedAt = DateTime.UtcNow.AddHours(-2)
        };
        context.VisitHistories.Add(visitHistory);

        // 7. Seed LOCATION_LOGS (Sample GPS tracking)
        var log1 = new LocationLog
        {
            SessionId = userSession.SessionId,
            Latitude = 10.787000m,
            Longitude = 106.704800m,
            Accuracy = 4.5m,
            RecordedAt = DateTime.UtcNow.AddHours(-2)
        };
        var log2 = new LocationLog
        {
            SessionId = userSession.SessionId,
            Latitude = 10.788100m,
            Longitude = 106.705500m,
            Accuracy = 3.8m,
            RecordedAt = DateTime.UtcNow.AddHours(-1)
        };
        context.LocationLogs.AddRange(log1, log2);

        // 8. Seed MEMBERSHIP_LEVELS & USER_LOYALTY
        var mlStandard = new MembershipLevel { Name = "Đồng (Bronze)", MinPoints = 0, Description = "Hạng cơ bản khi đăng ký tài khoản" };
        var mlSilver = new MembershipLevel { Name = "Bạc (Silver)", MinPoints = 100, Description = "Tích lũy từ 100 điểm, giảm 5% giá vé" };
        var mlGold = new MembershipLevel { Name = "Vàng (Gold)", MinPoints = 300, Description = "Tích lũy từ 300 điểm, giảm 10% giá vé + ưu tiên sự kiện" };
        var mlDiamond = new MembershipLevel { Name = "Kim Cương (Diamond)", MinPoints = 600, Description = "Thẻ VIP trọn đời, miễn phí thuyết minh cao cấp" };

        context.MembershipLevels.AddRange(mlStandard, mlSilver, mlGold, mlDiamond);
        await context.SaveChangesAsync();

        var userLoyalty = new UserLoyalty
        {
            UserId = visitorUser.UserId,
            Points = 150,
            MembershipLevelId = mlSilver.MembershipLevelId,
            UpdatedAt = DateTime.UtcNow
        };
        context.UserLoyalties.Add(userLoyalty);

        // 9. Seed SPECIES (Dữ liệu 22 loài sinh thái thực tế của Thảo Cầm Viên Sài Gòn)
        var spElephant = new Species
        {
            Name = "Voi Châu Á",
            ScientificName = "Elephas maximus",
            Description = "Loài thú ăn cỏ trên cạn lớn nhất khu vực Châu Á. Đàn voi tại Thảo Cầm Viên Sài Gòn luôn thu hút sự quan tâm đặc biệt của du khách.",
            ConservationStatus = "EN - Nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/z7140293588104-8e47e8df88406e1c32fc5c5b77635903.jpg"
        };

        var spTiger = new Species
        {
            Name = "Hổ Bengal",
            ScientificName = "Panthera tigris tigris",
            Description = "Phân loài hổ lớn phân bố tại Nam Á. Thảo Cầm Viên Sài Gòn đã nhân giống thành công hổ trắng Bengal và bảo tồn nhiều cá thể khỏe mạnh.",
            ConservationStatus = "EN - Nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/cay-va-loai-vat/bao-hoa-mai/z7342043335000-164034e3e1c286c255bec1bddf6cc023.jpg"
        };

        var spLion = new Species
        {
            Name = "Sư Tử Châu Phi",
            ScientificName = "Panthera leo",
            Description = "Loài mèo lớn săn mồi hàng đầu tại các đồng cỏ xavan châu Phi, sống theo bầy đàn có tính xã hội cao.",
            ConservationStatus = "VU - Sắp nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/image-1-1.png"
        };

        var spHippo = new Species
        {
            Name = "Hà Mã",
            ScientificName = "Hippopotamus amphibius",
            Description = "Động vật bán thủy sinh khổng lồ ở châu Phi hạ Sahara, dành phần lớn ban ngày ngâm mình dưới nước hoặc đầm bùn.",
            ConservationStatus = "VU - Sắp nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/z7382686431535-ea0719e14b8c3dc7c0db83b066d73cef.jpg"
        };

        var spRhino = new Species
        {
            Name = "Tê Giác Trắng",
            ScientificName = "Ceratotherium simum",
            Description = "Loài thú móng guốc trên cạn lớn thứ hai thế giới, đặc trưng bởi chiếc miệng rộng thích nghi ăn cỏ trên các đồng bằng xavan.",
            ConservationStatus = "NT - Sắp bị đe dọa",
            ImageUrl = "https://saigonzoo.vn/uploads/z7384023045171-e79b841ad199c4acd5cea4af3be9a33d.jpg"
        };

        var spGiraffe = new Species
        {
            Name = "Hươu Cao Cổ",
            ScientificName = "Giraffa camelopardalis",
            Description = "Động vật có vú cao nhất thế giới với cổ dài đặc trưng thích nghi ăn lá cây keo trên tầng cao thảo nguyên châu Phi.",
            ConservationStatus = "VU - Sắp nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/image-1-4.png"
        };

        var spZebra = new Species
        {
            Name = "Ngựa Vằn",
            ScientificName = "Equus quagga",
            Description = "Loài thú móng guốc có sọc đen trắng đặc trưng sinh sống tại các trảng cỏ và thảo nguyên Đông và Nam Phi.",
            ConservationStatus = "NT - Sắp bị đe dọa",
            ImageUrl = "https://saigonzoo.vn/uploads/sony-ilce-1-5664x3768-000797-dxo-deepprime-xd2s-xd.jpg"
        };

        var spHogDeer = new Species
        {
            Name = "Hươu Vàng",
            ScientificName = "Hyelaphus porcinus",
            Description = "Loài hươu nhỏ quý hiếm của vùng Đông Nam Á, thân thiện và được chăm sóc bảo tồn nguồn gen tại Thảo Cầm Viên.",
            ConservationStatus = "EN - Nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/image-1.png"
        };

        var spLeopard = new Species
        {
            Name = "Báo Hoa Mai",
            ScientificName = "Panthera pardus",
            Description = "Loài thú ăn thịt họ Mèo lớn có khả năng leo trèo điêu luyện và hoa văn đốm hoa mai đặc trưng khắp cơ thể.",
            ConservationStatus = "VU - Sắp nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/cay-va-loai-vat/bao-hoa-mai/z7342043335000-164034e3e1c286c255bec1bddf6cc023.jpg"
        };

        var spCloudedLeopard = new Species
        {
            Name = "Báo Gấm",
            ScientificName = "Neofelis nebulosa",
            Description = "Loài thú ăn thịt kích thước trung bình với hoa văn mai rùa lớn hình đám mây, sở hữu răng nanh dài nhất so với kích thước sọ trong họ Mèo.",
            ConservationStatus = "VU - Sắp nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/cay-va-loai-vat/bao-gam/img-7106.jpg"
        };

        var spGoldenCat = new Species
        {
            Name = "Báo Lửa",
            ScientificName = "Catopuma temminckii",
            Description = "Loài mèo hoang dã bí ẩn với bộ lông màu vàng đỏ hung đặc trưng, sinh sống trong các khu rừng rậm Đông Nam Á.",
            ConservationStatus = "NT - Sắp bị đe dọa",
            ImageUrl = "https://saigonzoo.vn/uploads/z7342043177913-83bd655fa361a73223199848bbac149f.jpg"
        };

        var spOrangutan = new Species
        {
            Name = "Đười Ươi Bornean",
            ScientificName = "Pongo pygmaeus",
            Description = "Loài vượn người lớn đặc hữu đảo Borneo, dành phần lớn cuộc đời trên cây với bộ lông màu nâu đỏ và trí thông minh vượt trội.",
            ConservationStatus = "CR - Cực kỳ nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/anh-khach-gui/quoc-hung/dsc03722.jpg"
        };

        var spGibbon = new Species
        {
            Name = "Vượn Má Vàng",
            ScientificName = "Nomascus gabriellae",
            Description = "Loài linh trưởng đặc hữu bán đảo Đông Dương, tiếng hót vang vọng khắp rừng vào buổi sáng sớm, con đực đen tuyền má vàng, con cái lông vàng kim.",
            ConservationStatus = "EN - Nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/z7310455867226-8bc6124408a5d50657bd4ea33f7daccd.jpg"
        };

        var spGreyShankedDouc = new Species
        {
            Name = "Chà Vá Chân Xám",
            ScientificName = "Pygathrix cinerea",
            Description = "Loài linh trưởng đặc hữu của Việt Nam, được mệnh danh là 'nữ hoàng linh trưởng' với màu sắc bộ lông tuyệt mỹ.",
            ConservationStatus = "CR - Cực kỳ nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/anh-khach-gui/quoc-hung/z7636302149795-c7e2be129ab9ed78c667208bfa210ea5.jpg"
        };

        var spBlackShankedDouc = new Species
        {
            Name = "Chà Vá Chân Đen",
            ScientificName = "Pygathrix nigripes",
            Description = "Loài khỉ ăn lá độc đáo của miền Nam Việt Nam và Campuchia với khuôn mặt xám xanh và đôi chân đen tuyền.",
            ConservationStatus = "CR - Cực kỳ nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/image-1-1.png"
        };

        var spHornbill = new Species
        {
            Name = "Chim Hồng Hoàng",
            ScientificName = "Buceros bicornis",
            Description = "Loài chim mỏ sừng khổng lồ với sải cánh rộng và chiếc mũ sừng màu vàng cam rực rỡ trên đỉnh mỏ.",
            ConservationStatus = "VU - Sắp nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/z7342043177904-72a038f501819d104529a3e36a245be8.jpg"
        };

        var spWreathedHornbill = new Species
        {
            Name = "Niệc Mỏ Vằn",
            ScientificName = "Rhyticeros undulatus",
            Description = "Loài chim mỏ sừng lớn với túi họng màu vàng hoặc xanh dương nổi bật, phát ra âm thanh vỗ cánh vang như tiếng tàu lượn.",
            ConservationStatus = "VU - Sắp nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/tin-tuc/hinh-bai-viet-sach-tcv/z7946874971112-6db2f2eb27acfa473610917b5574dd3c.jpg"
        };

        var spOrientalPiedHornbill = new Species
        {
            Name = "Cao Cát Bụng Trắng",
            ScientificName = "Anthracoceros albirostris",
            Description = "Loài chim mỏ sừng nhỏ hơn với bộ lông đen trắng tương phản và mỏ ngà có chóp sừng nhọn.",
            ConservationStatus = "LC - Ít quan tâm",
            ImageUrl = "https://saigonzoo.vn/uploads/tin-tuc/hinh-bai-viet-sach-tcv/z7948355036160-b343a9673c7ef65a6d097a2fd9d6d283.jpg"
        };

        var spSpotBilledPelican = new Species
        {
            Name = "Bồ Nông Chân Xám",
            ScientificName = "Pelecanus philippensis",
            Description = "Loài chim nước lớn có chiếc túi họng co giãn tuyệt vời chuyên dùng để hớt và bắt cá ngọt.",
            ConservationStatus = "NT - Sắp bị đe dọa",
            ImageUrl = "https://saigonzoo.vn/uploads/cay-va-loai-vat/bo-nong-chan-xam/z7942383153395-17cc1f362491c518de1850c0d0e565c3.jpg"
        };

        var spCrestedArgus = new Species
        {
            Name = "Trĩ Sao",
            ScientificName = "Rheinardia ocellata",
            Description = "Loài chim trĩ quý hiếm với chiếc đuôi dài nhất trong giới tự nhiên, lông điểm vô vàn đốm sao tinh tế.",
            ConservationStatus = "CR - Cực kỳ nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/tcv24.jpg"
        };

        var spWhiteCockatoo = new Species
        {
            Name = "Vẹt Trắng Mào Trắng",
            ScientificName = "Cacatua alba",
            Description = "Loài vẹt có bộ lông trắng muốt với chiếc mào hình quạt bung xòe lộng lẫy và giọng hót huyên náo.",
            ConservationStatus = "EN - Nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/vet-mao-trang/z7556906059204-fbbad9be234fe1d785aa2816d84e7d63.jpg"
        };

        var spKingCobra = new Species
        {
            Name = "Rắn Hổ Chúa",
            ScientificName = "Ophiophagus hannah",
            Description = "Loài rắn độc dài nhất thế giới, có khả năng nâng cao thân mình và bành mang ấn tượng khi cảm thấy bị đe dọa.",
            ConservationStatus = "VU - Sắp nguy cấp",
            ImageUrl = "https://saigonzoo.vn/uploads/z7654932087652-a87e61b1a46dc733497df1b2c14256a7.jpg"
        };

        context.Species.AddRange(
            spElephant, spTiger, spLion, spHippo, spRhino, spGiraffe,
            spZebra, spHogDeer, spLeopard, spCloudedLeopard, spGoldenCat,
            spOrangutan, spGibbon, spGreyShankedDouc, spBlackShankedDouc,
            spHornbill, spWreathedHornbill, spOrientalPiedHornbill,
            spSpotBilledPelican, spCrestedArgus, spWhiteCockatoo, spKingCobra
        );
        await context.SaveChangesAsync();

        // 10. Seed AREAS (7 Phân khu sinh thái chuẩn thực tế Thảo Cầm Viên Sài Gòn)
        var areaReptile = new Area
        {
            Code = "AREA-REPTILE",
            Name = "Khu Bảo Tồn Bò Sát & Lưỡng Cư",
            Description = "Khu nhà kính bảo tồn các loài rắn hổ chúa, trăn gấm, kỳ đà và rùa cạn nhiệt đới.",
            Latitude = 10.788000m,
            Longitude = 106.706500m,
            RadiusMeters = 40.0m,
            MapX = 58.0m,
            MapY = 45.0m,
            ReferenceSource = "Thảo Cầm Viên Sài Gòn - Khu bò sát",
            Status = AreaStatus.Active
        };

        var areaPetting = new Area
        {
            Code = "AREA-PETTING",
            Name = "Khu Vườn Thú Thiếu Nhi & Thân Thiện",
            Description = "Khuôn viên sinh thái dành cho trẻ em tương tác trực tiếp với capybara, dê lùn, cừu và thỏ kiểng.",
            Latitude = 10.786200m,
            Longitude = 106.707200m,
            RadiusMeters = 45.0m,
            MapX = 89.0m,
            MapY = 89.0m,
            ReferenceSource = "Thảo Cầm Viên Sài Gòn - Vườn thú thân thiện cổng B",
            Status = AreaStatus.Active
        };

        var areaHerbivore = new Area
        {
            Code = "AREA-HERBIVORE",
            Name = "Khu Động Vật Ăn Cỏ & Móng Guốc",
            Description = "Thung lũng đồng cỏ bán hoang dã dành cho voi, hà mã, tê giác trắng, hươu cao cổ, ngựa vằn và hươu vàng.",
            Latitude = 10.789200m,
            Longitude = 106.706800m,
            RadiusMeters = 60.0m,
            MapX = 65.0m,
            MapY = 22.0m,
            ReferenceSource = "Thảo Cầm Viên Sài Gòn - Phân khu ăn cỏ Đông Bắc",
            Status = AreaStatus.Active
        };

        var areaAviary = new Area
        {
            Code = "AREA-AVIARY",
            Name = "Khu Vườn Chim & Đầm Nước Nhiệt Đới",
            Description = "Quần xã lồng vòm sinh thái cao 15m nuôi dưỡng chim hồng hoàng, niệc mỏ vằn, cao cát, bồ nông, trĩ sao và vẹt mào.",
            Latitude = 10.786900m,
            Longitude = 106.704200m,
            RadiusMeters = 45.0m,
            MapX = 35.5m,
            MapY = 74.0m,
            ReferenceSource = "Thảo Cầm Viên Sài Gòn - Khu lồng chim vòm Tây Nam",
            Status = AreaStatus.Active
        };

        var areaHeritage = new Area
        {
            Code = "AREA-HERITAGE",
            Name = "Khu Di Tích, Cảnh Quan & Cây Di Sản",
            Description = "Trục cảnh quan văn hóa lịch sử trung tâm quy tụ Đền Thờ Vua Hùng (1926), Bảo Tàng Lịch Sử TP.HCM, Hồ Sen Thủy Tạ và cổ thụ sọ khỉ hơn 130 năm tuổi.",
            Latitude = 10.786800m,
            Longitude = 106.704800m,
            RadiusMeters = 50.0m,
            MapX = 48.0m,
            MapY = 55.0m,
            ReferenceSource = "Thảo Cầm Viên Sài Gòn - Quần thể di tích lịch sử và cây di sản",
            Status = AreaStatus.Active
        };

        var areaPrimate = new Area
        {
            Code = "AREA-PRIMATE",
            Name = "Khu Đảo Vượn & Linh Trưởng Quý Hiếm",
            Description = "Hệ thống cù lao ốc đảo sinh thái giữa hồ nuôi dưỡng đười ươi Bornean, vượn má vàng, voọc chà vá chân xám và voọc chà vá chân đen.",
            Latitude = 10.787100m,
            Longitude = 106.705800m,
            RadiusMeters = 50.0m,
            MapX = 57.0m,
            MapY = 64.0m,
            ReferenceSource = "Thảo Cầm Viên Sài Gòn - Đảo vượn má hung",
            Status = AreaStatus.Active
        };

        var areaCarnivore = new Area
        {
            Code = "AREA-CARNIVORE",
            Name = "Khu Động Vật Ăn Thịt Hoàng Gia",
            Description = "Khu vực bán hoang dã kiên cố bảo tồn các loài thú săn mồi: Hổ Bengal, Hổ Siberia, Sư tử châu Phi, Báo hoa mai, Báo gấm và Báo lửa.",
            Latitude = 10.788500m,
            Longitude = 106.705800m,
            RadiusMeters = 55.0m,
            MapX = 63.0m,
            MapY = 30.0m,
            ReferenceSource = "Thảo Cầm Viên Sài Gòn - Khu thú dữ Tây Bắc",
            Status = AreaStatus.Active
        };

        context.Areas.AddRange(areaReptile, areaPetting, areaHerbivore, areaAviary, areaHeritage, areaPrimate, areaCarnivore);
        await context.SaveChangesAsync();

        // 10.5 Seed ENCLOSURES (Chuồng thú thực tế tại Thảo Cầm Viên Sài Gòn)
        var encTigerBengal = new Enclosure { AreaId = areaCarnivore.AreaId, Code = "ENC-TIG-01", Name = "Chuồng Hổ Bengal", Latitude = 10.788500m, Longitude = 106.706100m, Status = "Active" };
        var encTigerSiberia = new Enclosure { AreaId = areaCarnivore.AreaId, Code = "ENC-TIG-02", Name = "Chuồng Hổ Siberia & Hổ Trắng", Latitude = 10.788700m, Longitude = 106.706400m, Status = "Active" };
        var encLion = new Enclosure { AreaId = areaCarnivore.AreaId, Code = "ENC-LIO-01", Name = "Chuồng Sư Tử Hoàng Gia", Latitude = 10.788200m, Longitude = 106.705100m, Status = "Active" };
        var encLeopard = new Enclosure { AreaId = areaCarnivore.AreaId, Code = "ENC-LEO-01", Name = "Chuồng Nuôi Báo Hoa Mai", Latitude = 10.788400m, Longitude = 106.705600m, Status = "Active" };
        var encCloudedLeopard = new Enclosure { AreaId = areaCarnivore.AreaId, Code = "ENC-CLO-01", Name = "Chuồng Bảo Tồn Báo Gấm", Latitude = 10.788600m, Longitude = 106.705400m, Status = "Active" };
        var encGoldenCat = new Enclosure { AreaId = areaCarnivore.AreaId, Code = "ENC-GCA-01", Name = "Chuồng Nuôi Dưỡng Báo Lửa", Latitude = 10.788750m, Longitude = 106.705200m, Status = "Active" };

        var encElephant = new Enclosure { AreaId = areaHerbivore.AreaId, Code = "ENC-ELE-01", Name = "Bãi Thả Voi Châu Á", Latitude = 10.789200m, Longitude = 106.706800m, Status = "Active" };
        var encHippo = new Enclosure { AreaId = areaHerbivore.AreaId, Code = "ENC-HIP-01", Name = "Bãi Thả Hà Mã", Latitude = 10.789450m, Longitude = 106.707300m, Status = "Active" };
        var encRhino = new Enclosure { AreaId = areaHerbivore.AreaId, Code = "ENC-RHI-01", Name = "Khu Vực Tê Giác Trắng", Latitude = 10.789600m, Longitude = 106.706500m, Status = "Active" };
        var encGiraffe = new Enclosure { AreaId = areaHerbivore.AreaId, Code = "ENC-GIR-01", Name = "Đồng Cỏ Hươu Cao Cổ", Latitude = 10.788950m, Longitude = 106.707100m, Status = "Active" };
        var encZebra = new Enclosure { AreaId = areaHerbivore.AreaId, Code = "ENC-ZEB-01", Name = "Khu Thảo Nguyên Ngựa Vằn", Latitude = 10.788800m, Longitude = 106.707450m, Status = "Active" };
        var encHogDeer = new Enclosure { AreaId = areaHerbivore.AreaId, Code = "ENC-HOG-01", Name = "Chuồng Bảo Tồn Hươu Vàng", Latitude = 10.789100m, Longitude = 106.706100m, Status = "Active" };

        var encAviaryDome = new Enclosure { AreaId = areaAviary.AreaId, Code = "ENC-BIR-01", Name = "Lồng Vòm Chim Nhiệt Đới", Latitude = 10.786900m, Longitude = 106.704200m, Status = "Active" };
        var encWreathedHornbill = new Enclosure { AreaId = areaAviary.AreaId, Code = "ENC-WRE-01", Name = "Chuồng Chim Niệc Mỏ Vằn", Latitude = 10.787100m, Longitude = 106.704000m, Status = "Active" };
        var encPiedHornbill = new Enclosure { AreaId = areaAviary.AreaId, Code = "ENC-HOR-01", Name = "Khu Vực Cao Cát Bụng Trắng", Latitude = 10.787250m, Longitude = 106.704300m, Status = "Active" };
        var encPelican = new Enclosure { AreaId = areaAviary.AreaId, Code = "ENC-PEL-01", Name = "Hồ Thủy Điểu & Bồ Nông", Latitude = 10.786700m, Longitude = 106.704500m, Status = "Active" };
        var encArgus = new Enclosure { AreaId = areaAviary.AreaId, Code = "ENC-ARG-01", Name = "Khu Vực Trĩ Sao Bản Địa", Latitude = 10.786850m, Longitude = 106.703800m, Status = "Active" };
        var encCockatoo = new Enclosure { AreaId = areaAviary.AreaId, Code = "ENC-COC-01", Name = "Nhà Lưới Vẹt Trắng Mào Vàng", Latitude = 10.787350m, Longitude = 106.704500m, Status = "Active" };

        var encOrangutan = new Enclosure { AreaId = areaPrimate.AreaId, Code = "ENC-ORA-01", Name = "Ngôi Nhà Đười Ươi Bornean", Latitude = 10.787300m, Longitude = 106.705900m, Status = "Active" };
        var encGibbon = new Enclosure { AreaId = areaPrimate.AreaId, Code = "ENC-GIB-01", Name = "Đảo Vượn Má Vàng", Latitude = 10.787100m, Longitude = 106.705800m, Status = "Active" };
        var encDouc = new Enclosure { AreaId = areaPrimate.AreaId, Code = "ENC-DOU-01", Name = "Khu Bán Hoang Dã Voọc Chà Vá", Latitude = 10.786950m, Longitude = 106.706100m, Status = "Active" };

        var encPetting = new Enclosure { AreaId = areaPetting.AreaId, Code = "ENC-PET-01", Name = "Khuôn Viên Thú Nhỏ Thân Thiện", Latitude = 10.786200m, Longitude = 106.707200m, Status = "Active" };
        var encReptile = new Enclosure { AreaId = areaReptile.AreaId, Code = "ENC-REP-01", Name = "Nhà Trưng Bày Rắn Hổ Chúa & Bò Sát", Latitude = 10.788000m, Longitude = 106.706500m, Status = "Active" };

        context.Enclosures.AddRange(
            encTigerBengal, encTigerSiberia, encLion, encLeopard, encCloudedLeopard, encGoldenCat,
            encElephant, encHippo, encRhino, encGiraffe, encZebra, encHogDeer,
            encAviaryDome, encWreathedHornbill, encPiedHornbill, encPelican, encArgus, encCockatoo,
            encOrangutan, encGibbon, encDouc, encPetting, encReptile
        );
        await context.SaveChangesAsync();

        // 11. Seed ANIMALS (Cá thể động vật thực tế tại Thảo Cầm Viên Sài Gòn kèm Chuồng)
        var animals = new List<Animal>
        {
            new Animal
            {
                SpeciesId = spLion.SpeciesId,
                AreaId = areaCarnivore.AreaId,
                EnclosureId = encLion.EnclosureId,
                Name = "Sư tử trắng Mimi",
                Description = "Cá thể sư tử trắng cái gắn bó 16 năm tại Thảo Cầm Viên Sài Gòn, đạt tuổi thọ cao kỷ lục 18 tuổi.",
                Gender = AnimalGender.Female,
                DateOfBirth = new DateOnly(2008, 9, 1),
                Origin = "Thảo Cầm Viên Sài Gòn",
                HealthStatus = "Đã qua đời do tuổi già - Lưu trữ hồ sơ bảo tồn",
                ConservationNote = "Cá thể sư tử trắng biểu tượng được du khách và nhân viên yêu mến",
                ImageUrl = "https://saigonzoo.vn/uploads/image-1-1.png",
                Status = AnimalStatus.Active
            },
            new Animal
            {
                SpeciesId = spTiger.SpeciesId,
                AreaId = areaCarnivore.AreaId,
                EnclosureId = encTigerBengal.EnclosureId,
                Name = "Hổ trắng Ngộ Không",
                Description = "Cá thể hổ trắng Bengal sinh ngày 08/07/2015 tại Thảo Cầm Viên Sài Gòn, biểu tượng được hàng triệu du khách yêu mến.",
                Gender = AnimalGender.Male,
                DateOfBirth = new DateOnly(2015, 7, 8),
                Origin = "Thảo Cầm Viên Sài Gòn",
                HealthStatus = "Khỏe mạnh, sung mãn",
                ConservationNote = "Cá thể hổ trắng đầu tiên nhân giống thành công tại Thảo Cầm Viên",
                ImageUrl = "https://saigonzoo.vn/uploads/cay-va-loai-vat/bao-hoa-mai/z7342043335000-164034e3e1c286c255bec1bddf6cc023.jpg",
                Status = AnimalStatus.Active
            },
            new Animal
            {
                SpeciesId = spElephant.SpeciesId,
                AreaId = areaHerbivore.AreaId,
                EnclosureId = encElephant.EnclosureId,
                Name = "Đàn Voi Châu Á",
                Description = "Đàn voi Châu Á sinh sống tại bãi thả rộng lớn với sân vận động và hồ tắm bùn tự nhiên.",
                Gender = AnimalGender.Female,
                DateOfBirth = new DateOnly(2005, 1, 1),
                Origin = "Thảo Cầm Viên Sài Gòn",
                HealthStatus = "Khỏe mạnh, ăn uống tốt",
                ConservationNote = "Được chăm sóc theo quy chuẩn vườn thú quốc tế WAZA",
                ImageUrl = "https://saigonzoo.vn/uploads/z7140293588104-8e47e8df88406e1c32fc5c5b77635903.jpg",
                Status = AnimalStatus.Active
            },
            new Animal
            {
                SpeciesId = spHornbill.SpeciesId,
                AreaId = areaAviary.AreaId,
                EnclosureId = encAviaryDome.EnclosureId,
                Name = "Chim Hồng Hoàng",
                Description = "Cặp chim Hồng Hoàng tại nhà lồng chim vòm mở Thảo Cầm Viên Sài Gòn.",
                Gender = AnimalGender.Male,
                DateOfBirth = new DateOnly(2018, 5, 15),
                Origin = "Thảo Cầm Viên Sài Gòn",
                HealthStatus = "Khỏe mạnh, thị lực hoàn hảo",
                ConservationNote = "Loài chim bảo tồn nghiêm ngặt thuộc Phụ lục I CITES",
                ImageUrl = "https://saigonzoo.vn/uploads/z7342043177904-72a038f501819d104529a3e36a245be8.jpg",
                Status = AnimalStatus.Active
            }
        };

        context.Animals.AddRange(animals);
        await context.SaveChangesAsync();

        // 12. Seed NARRATIONS & AUDIOS (Verified Thảo Cầm Viên audio trên Supabase)
        var mimi = animals[0];
        var ngoKhong = animals[1];
        var voiChauA = animals[2];
        var hongHoang = animals[3];

        var nElephantVi = new Narration
        {
            AnimalId = voiChauA.AnimalId,
            LanguageId = langVi.LanguageId,
            Title = "Voi Châu Á - Elephas maximus",
            Content = "Chào mừng quý khách đến với khu vực Voi Châu Á tại Thảo Cầm Viên Sài Gòn. Voi Châu Á, tên khoa học là Elephas maximus, là loài thú ăn cỏ trên cạn lớn nhất tại khu vực Châu Á. Chúng có đôi tai nhỏ hơn voi Châu Phi và lưng có hình vòm cong đặc trưng. Chiếc vòi linh hoạt với hàng ngàn bó cơ cho phép voi nhặt nhạnh thức ăn, uống nước và giao tiếp.",
            AudioUrl = "https://mqawjvhflseqjjapegfk.supabase.co/storage/v1/object/public/narration-audio/vi/animal_1_vi.mp3",
            DurationSeconds = 34,
            Status = NarrationStatus.Published,
            CreatedBy = adminUser.UserId
        };

        var nElephantEn = new Narration
        {
            AnimalId = voiChauA.AnimalId,
            LanguageId = langEn.LanguageId,
            Title = "Asian Elephant - Elephas maximus",
            Content = "Welcome to the Asian Elephant habitat at Saigon Zoo. The Asian Elephant, Elephas maximus, is the largest land herbivore across Asia. Distinct from African elephants, they feature smaller ears and a curved dorsal spine.",
            AudioUrl = "https://mqawjvhflseqjjapegfk.supabase.co/storage/v1/object/public/narration-audio/en/animal_1_en.mp3",
            DurationSeconds = 38,
            Status = NarrationStatus.Published,
            CreatedBy = adminUser.UserId
        };

        var nTigerVi = new Narration
        {
            AnimalId = ngoKhong.AnimalId,
            LanguageId = langVi.LanguageId,
            Title = "Hổ Bengal Ngộ Không - Panthera tigris tigris",
            Content = "Trước mắt quý khách là hổ trắng Bengal, một biến thể màu sắc quý hiếm của loài Panthera tigris tigris. Tại Thảo Cầm Viên Sài Gòn, chú hổ Ngộ Không chào đời năm 2015 đã trở thành một biểu tượng nhân giống bảo tồn động vật hoang dã quý hiếm.",
            AudioUrl = "https://mqawjvhflseqjjapegfk.supabase.co/storage/v1/object/public/narration-audio/vi/animal_2_vi.mp3",
            DurationSeconds = 29,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        var nTigerEn = new Narration
        {
            AnimalId = ngoKhong.AnimalId,
            LanguageId = langEn.LanguageId,
            Title = "Bengal White Tiger Ngo Khong - Panthera tigris tigris",
            Content = "Before you is the majestic white Bengal tiger, Panthera tigris tigris. Born in July 2015 right here at Saigon Zoo, tiger cub Ngo Khong became an iconic symbol of wildlife preservation and successful captive breeding.",
            AudioUrl = "https://mqawjvhflseqjjapegfk.supabase.co/storage/v1/object/public/narration-audio/en/animal_2_en.mp3",
            DurationSeconds = 34,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        var nLionVi = new Narration
        {
            AnimalId = mimi.AnimalId,
            LanguageId = langVi.LanguageId,
            Title = "Sư Tử Mimi - Panthera leo",
            Content = "Chào mừng quý khách đến với khu vực Sư tử Châu Phi, tên khoa học Panthera leo. Thảo Cầm Viên Sài Gòn từng là ngôi nhà thân thương của sư tử trắng Mimi trong suốt 16 năm với tuổi thọ kỷ lục 18 tuổi.",
            AudioUrl = "https://mqawjvhflseqjjapegfk.supabase.co/storage/v1/object/public/narration-audio/vi/animal_3_vi.mp3",
            DurationSeconds = 29,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        var nLionEn = new Narration
        {
            AnimalId = mimi.AnimalId,
            LanguageId = langEn.LanguageId,
            Title = "African Lion Mimi - Panthera leo",
            Content = "Welcome to the African Lion exhibit featuring Panthera leo. For over 16 years, Saigon Zoo was proud home to Mimi the white lioness, living to an exceptional age of 18 years under attentive veterinary care.",
            AudioUrl = "https://mqawjvhflseqjjapegfk.supabase.co/storage/v1/object/public/narration-audio/en/animal_3_en.mp3",
            DurationSeconds = 31,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        var nBirdVi = new Narration
        {
            AnimalId = hongHoang.AnimalId,
            LanguageId = langVi.LanguageId,
            Title = "Chim Hồng Hoàng - Buceros bicornis",
            Content = "Chào mừng quý khách đến với khu bảo tồn chim quý hiếm. Chim Hồng Hoàng, tên khoa học Buceros bicornis, nổi bật với chiếc mỏ cong lớn màu vàng cam và mũ sừng rực rỡ trên đỉnh đầu.",
            AudioUrl = "https://mqawjvhflseqjjapegfk.supabase.co/storage/v1/object/public/narration-audio/vi/animal_16_vi.mp3",
            DurationSeconds = 31,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        var nBirdEn = new Narration
        {
            AnimalId = hongHoang.AnimalId,
            LanguageId = langEn.LanguageId,
            Title = "Great Hornbill - Buceros bicornis",
            Content = "Welcome to the aviary showcasing the magnificent Great Hornbill, Buceros bicornis. Known for its prominent yellow-and-black casque atop its enormous beak, this magnificent bird plays a vital ecological role as a seed disperser.",
            AudioUrl = "https://mqawjvhflseqjjapegfk.supabase.co/storage/v1/object/public/narration-audio/en/animal_16_en.mp3",
            DurationSeconds = 34,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        context.Narrations.AddRange(nElephantVi, nElephantEn, nTigerVi, nTigerEn, nLionVi, nLionEn, nBirdVi, nBirdEn);
        await context.SaveChangesAsync();

        // 13. Seed AUDIOS
        var audio1 = new Audio
        {
            NarrationId = nElephantVi.NarrationId,
            FileUrl = nElephantVi.AudioUrl!,
            FileName = "animal_1_vi.mp3",
            MimeType = "audio/mpeg",
            DurationSeconds = 34,
            FileSize = 545280,
            VoiceName = "vi-VN-HoaiMyNeural",
            TtsProvider = "EdgeTTS",
            IsVerified = true,
            Status = AudioStatus.Active
        };

        var audio2 = new Audio
        {
            NarrationId = nTigerVi.NarrationId,
            FileUrl = nTigerVi.AudioUrl!,
            FileName = "animal_2_vi.mp3",
            MimeType = "audio/mpeg",
            DurationSeconds = 29,
            FileSize = 465120,
            VoiceName = "vi-VN-HoaiMyNeural",
            TtsProvider = "EdgeTTS",
            IsVerified = true,
            Status = AudioStatus.Active
        };

        var audio3 = new Audio
        {
            NarrationId = nLionVi.NarrationId,
            FileUrl = nLionVi.AudioUrl!,
            FileName = "animal_3_vi.mp3",
            MimeType = "audio/mpeg",
            DurationSeconds = 29,
            FileSize = 465120,
            VoiceName = "vi-VN-HoaiMyNeural",
            TtsProvider = "EdgeTTS",
            IsVerified = true,
            Status = AudioStatus.Active
        };

        context.Audios.AddRange(audio1, audio2, audio3);
        await context.SaveChangesAsync();

        // 14. Seed CHAT_SESSIONS & CHAT_MESSAGES (Sample chatbot for userSession)
        var chatSession = new ChatSession
        {
            ChatSessionId = Guid.NewGuid(),
            SessionId = userSession.SessionId,
            CreatedAt = DateTime.UtcNow.AddMinutes(-20)
        };
        context.ChatSessions.Add(chatSession);
        await context.SaveChangesAsync();

        var msg1 = new ChatMessage
        {
            ChatSessionId = chatSession.ChatSessionId,
            SenderType = ChatSenderType.Visitor,
            Content = "Cho tôi hỏi giờ cho sư tử ăn là mấy giờ?",
            CreatedAt = DateTime.UtcNow.AddMinutes(-20)
        };
        var msg2 = new ChatMessage
        {
            ChatSessionId = chatSession.ChatSessionId,
            SenderType = ChatSenderType.Bot,
            Content = "Khu Sư tử có giờ ăn cố định vào lúc 10:00 sáng và 15:30 chiều hàng ngày. Bạn đang ở gần Khu Sư tử cách khoảng 35m!",
            CreatedAt = DateTime.UtcNow.AddMinutes(-19)
        };
        context.ChatMessages.AddRange(msg1, msg2);

        await context.SaveChangesAsync();
    }
}
