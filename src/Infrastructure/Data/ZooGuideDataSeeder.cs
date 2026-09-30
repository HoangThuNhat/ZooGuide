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

        // 2. Seed LANGUAGES
        var langVi = new Language { Code = "vi", Name = "Tiếng Việt", IsActive = true };
        var langEn = new Language { Code = "en", Name = "English", IsActive = true };
        var langZh = new Language { Code = "zh", Name = "中文 (Chinese)", IsActive = true };
        var langJa = new Language { Code = "ja", Name = "日本語 (Japanese)", IsActive = true };

        context.Languages.AddRange(langVi, langEn, langZh, langJa);
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

        // 9. Seed SPECIES
        var spLion = new Species
        {
            Name = "Sư tử Châu Phi",
            ScientificName = "Panthera leo",
            Description = "Loài động vật săn mồi hàng đầu tại các đồng cỏ xavan châu Phi.",
            ConservationStatus = "VU (Sắp nguy cấp)",
            ImageUrl = "https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=800"
        };

        var spTiger = new Species
        {
            Name = "Hổ Bengal",
            ScientificName = "Panthera tigris tigris",
            Description = "Phân loài hổ lớn thứ hai thế giới, sinh sống ở Nam Á và Đông Nam Á.",
            ConservationStatus = "EN (Nguy cấp)",
            ImageUrl = "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800"
        };

        var spElephant = new Species
        {
            Name = "Voi Châu Á",
            ScientificName = "Elephas maximus",
            Description = "Loài thú ăn cỏ trên cạn lớn nhất tại khu vực Châu Á.",
            ConservationStatus = "EN (Nguy cấp)",
            ImageUrl = "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=800"
        };

        var spEagle = new Species
        {
            Name = "Đại bàng Hoàng Gia",
            ScientificName = "Aquila heliaca",
            Description = "Loài chim săn mồi dũng mãnh với sải cánh rộng và tầm nhìn siêu việt.",
            ConservationStatus = "VU (Sắp nguy cấp)",
            ImageUrl = "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=800"
        };

        context.Species.AddRange(spLion, spTiger, spElephant, spEagle);
        await context.SaveChangesAsync();

        // 10. Seed AREAS (Khu Sư tử, Khu Hổ, Khu Voi, Khu Chim)
        var areaLion = new Area
        {
            Name = "Khu Sư Tử (Lion Savannah)",
            Description = "Khuôn viên mô phỏng thảo nguyên xavan mở cho đàn sư tử hoàng gia.",
            Latitude = 10.787520m,
            Longitude = 106.705250m,
            RadiusMeters = 35.0m,
            MapImageUrl = "/assets/maps/zone_lion.png",
            Status = AreaStatus.Active
        };

        var areaTiger = new Area
        {
            Name = "Khu Hổ (Tiger Habitat)",
            Description = "Khu rừng mưa nhiệt đới có hồ tắm dành riêng cho loài hổ bơi lội.",
            Latitude = 10.788640m,
            Longitude = 106.706180m,
            RadiusMeters = 30.0m,
            MapImageUrl = "/assets/maps/zone_tiger.png",
            Status = AreaStatus.Active
        };

        var areaElephant = new Area
        {
            Name = "Khu Voi (Elephant Valley)",
            Description = "Thung lũng đồng cỏ rộng lớn với bãi tắm bùn tự nhiên cho đàn voi.",
            Latitude = 10.789500m,
            Longitude = 106.707300m,
            RadiusMeters = 50.0m,
            MapImageUrl = "/assets/maps/zone_elephant.png",
            Status = AreaStatus.Active
        };

        var areaBird = new Area
        {
            Name = "Khu Chim (Aviary Paradise)",
            Description = "Nhà lồng vòm không gian mở cho các loài chim bay lượn tự do.",
            Latitude = 10.786900m,
            Longitude = 106.704200m,
            RadiusMeters = 40.0m,
            MapImageUrl = "/assets/maps/zone_bird.png",
            Status = AreaStatus.Active
        };

        context.Areas.AddRange(areaLion, areaTiger, areaElephant, areaBird);
        await context.SaveChangesAsync();

        // 11. Seed ANIMALS (8 cá thể thuộc 4 loài và 4 khu)
        var animals = new List<Animal>
        {
            new Animal
            {
                SpeciesId = spLion.SpeciesId,
                AreaId = areaLion.AreaId,
                Name = "Simba",
                Description = "Sư tử đực đầu đàn dũng mãnh, có bờm đen sẫm đặc trưng.",
                Gender = AnimalGender.Male,
                DateOfBirth = new DateOnly(2019, 5, 12),
                Origin = "Vườn quốc gia Serengeti, Tanzania",
                HealthStatus = "Khỏe mạnh, sung mãn",
                ConservationNote = "Tham gia chương trình bảo tồn nhân giống quốc tế",
                ImageUrl = "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800",
                Status = AnimalStatus.Active
            },
            new Animal
            {
                SpeciesId = spLion.SpeciesId,
                AreaId = areaLion.AreaId,
                Name = "Nala",
                Description = "Sư tử cái nhanh nhẹn, là bạn đời của Simba.",
                Gender = AnimalGender.Female,
                DateOfBirth = new DateOnly(2020, 8, 20),
                Origin = "Khu bảo tồn Masai Mara, Kenya",
                HealthStatus = "Khỏe mạnh - Đang nuôi 1 con nhỏ",
                ConservationNote = "Sinh sản thành công lứa đầu tiên tháng 02/2026",
                ImageUrl = "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=800",
                Status = AnimalStatus.Active
            },
            new Animal
            {
                SpeciesId = spTiger.SpeciesId,
                AreaId = areaTiger.AreaId,
                Name = "Lâm Nhi",
                Description = "Hổ cái Bengal rất thích đùa giỡn dưới nước.",
                Gender = AnimalGender.Female,
                DateOfBirth = new DateOnly(2021, 3, 15),
                Origin = "Trung tâm cứu hộ động vật hoang dã Cát Tiên",
                HealthStatus = "Khỏe mạnh, định kỳ kiểm tra móng",
                ConservationNote = "Nằm trong danh mục bảo vệ nghiêm ngặt",
                ImageUrl = "https://images.unsplash.com/photo-1500463959177-e0869687df26?w=800",
                Status = AnimalStatus.Active
            },
            new Animal
            {
                SpeciesId = spTiger.SpeciesId,
                AreaId = areaTiger.AreaId,
                Name = "Cường Đô",
                Description = "Hổ đực Bengal trưởng thành, trọng lượng trên 220kg.",
                Gender = AnimalGender.Male,
                DateOfBirth = new DateOnly(2018, 11, 4),
                Origin = "Vườn thú Singapore (trao đổi giống)",
                HealthStatus = "Khỏe mạnh",
                ConservationNote = "Gen thuần chủng F1",
                ImageUrl = "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800",
                Status = AnimalStatus.Active
            },
            new Animal
            {
                SpeciesId = spElephant.SpeciesId,
                AreaId = areaElephant.AreaId,
                Name = "Bác Tai To",
                Description = "Voi đực đầu đàn thân thiện, rất thích ăn mía và chuối từ du khách.",
                Gender = AnimalGender.Male,
                DateOfBirth = new DateOnly(2010, 7, 1),
                Origin = "Buôn Đôn, Đắk Lắk",
                HealthStatus = "Ổn định - Khám nha khoa định kỳ",
                ConservationNote = "Voi cứu hộ từ khu du lịch cũ",
                ImageUrl = "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=800",
                Status = AnimalStatus.Active
            },
            new Animal
            {
                SpeciesId = spElephant.SpeciesId,
                AreaId = areaElephant.AreaId,
                Name = "Bé Na",
                Description = "Voi cái hiền lành, luôn quấn quýt bên đàn voi trưởng thành.",
                Gender = AnimalGender.Female,
                DateOfBirth = new DateOnly(2022, 12, 10),
                Origin = "Sở thú ZooGuide (sinh sản tự nhiên)",
                HealthStatus = "Rất tốt, tăng cân đều đặn",
                ConservationNote = "Cá thể voi con sinh ra đầu tiên tại vườn thú",
                ImageUrl = "https://images.unsplash.com/photo-1581852017103-68ac65504071?w=800",
                Status = AnimalStatus.Active
            },
            new Animal
            {
                SpeciesId = spEagle.SpeciesId,
                AreaId = areaBird.AreaId,
                Name = "Phong Thần",
                Description = "Đại bàng hoàng gia với sải cánh dài hơn 2 mét.",
                Gender = AnimalGender.Male,
                DateOfBirth = new DateOnly(2021, 6, 25),
                Origin = "Dãy núi Altai, Mông Cổ",
                HealthStatus = "Khỏe mạnh, thị lực hoàn hảo",
                ConservationNote = "Được theo dõi hành vi bay lượn định kỳ",
                ImageUrl = "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=800",
                Status = AnimalStatus.Active
            },
            new Animal
            {
                SpeciesId = spEagle.SpeciesId,
                AreaId = areaBird.AreaId,
                Name = "Kim Ưng",
                Description = "Đại bàng cái kiêu hãnh với bộ lông óng ánh màu nâu vàng.",
                Gender = AnimalGender.Female,
                DateOfBirth = new DateOnly(2022, 4, 18),
                Origin = "Khu bảo tồn Thiên Sơn",
                HealthStatus = "Khỏe mạnh",
                ConservationNote = "Đang trong độ tuổi sinh sản",
                ImageUrl = "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800",
                Status = AnimalStatus.Active
            }
        };

        context.Animals.AddRange(animals);
        await context.SaveChangesAsync();

        // 12. Seed NARRATIONS & AUDIOS (Multi-language per animal)
        var simba = animals[0];
        var lamNhi = animals[2];
        var taiTo = animals[4];
        var phongThan = animals[6];

        // Simba narrations
        var nSimbaVi = new Narration
        {
            AnimalId = simba.AnimalId,
            LanguageId = langVi.LanguageId,
            Title = "Sư Tử Simba - Chúa Tể Thảo Nguyên Xavan",
            Content = "Chào mừng quý khách đến với phân khu Sư tử. Trước mắt quý khách là Simba, chú sư tử đực 7 tuổi với bộ bờm đen dày đặc - dấu hiệu của sức mạnh và thể lực sung mãn. Sư tử là loài duy nhất trong họ Mèo sống theo bầy đàn có tính xã hội cao.",
            AudioUrl = "/assets/audio/simba_vi.mp3",
            DurationSeconds = 120,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        var nSimbaEn = new Narration
        {
            AnimalId = simba.AnimalId,
            LanguageId = langEn.LanguageId,
            Title = "Simba the African Lion - King of the Savannah",
            Content = "Welcome to the African Lion habitat. Meet Simba, our magnificent 7-year-old male lion. Lions are uniquely social among all wild felids, living in structured prides where females hunt cooperatively.",
            AudioUrl = "/assets/audio/simba_en.mp3",
            DurationSeconds = 115,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        var nSimbaZh = new Narration
        {
            AnimalId = simba.AnimalId,
            LanguageId = langZh.LanguageId,
            Title = "非洲狮辛巴 - 草原之王",
            Content = "欢迎来到非洲狮展区。展现在您眼前的是辛巴，一只7岁的成年雄狮。狮子是猫科动物中唯一过着高度群居生活的物种。",
            AudioUrl = "/assets/audio/simba_zh.mp3",
            DurationSeconds = 110,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        // Lâm Nhi (Tiger) narrations
        var nTigerVi = new Narration
        {
            AnimalId = lamNhi.AnimalId,
            LanguageId = langVi.LanguageId,
            Title = "Hổ Bengal Lâm Nhi - Sát Thủ Rừng Rậm",
            Content = "Hổ Bengal là một trong những loài săn mồi uy nghi nhất hành tinh. Không giống như hầu hết các loài mèo sợ nước, hổ Bengal bơi lội cự phách và thường xuyên ngâm mình dưới hồ nước vào những ngày nắng nóng.",
            AudioUrl = "/assets/audio/tiger_vi.mp3",
            DurationSeconds = 95,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        var nTigerEn = new Narration
        {
            AnimalId = lamNhi.AnimalId,
            LanguageId = langEn.LanguageId,
            Title = "Lam Nhi the Bengal Tiger - Majestic Predator",
            Content = "Bengal tigers are among the world's most iconic predators. Unlike many other felines, tigers love swimming and frequently bathe in cool water pools during hot afternoons.",
            AudioUrl = "/assets/audio/tiger_en.mp3",
            DurationSeconds = 90,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        // Bác Tai To (Elephant) narrations
        var nElephantVi = new Narration
        {
            AnimalId = taiTo.AnimalId,
            LanguageId = langVi.LanguageId,
            Title = "Voi Bác Tai To - Người Khổng Lồ Hiền Lành",
            Content = "Voi Châu Á có đôi tai nhỏ hơn voi Châu Phi và lưng có hình vòm cung. Chiếc vòi voi chứa hơn 40.000 bó cơ, giúp chúng cầm nắm vật nhỏ như hạt đậu hoặc nhấc bổng thân cây nặng hàng trăm kilogram.",
            AudioUrl = "/assets/audio/elephant_vi.mp3",
            DurationSeconds = 130,
            Status = NarrationStatus.Published,
            CreatedBy = adminUser.UserId
        };

        var nElephantEn = new Narration
        {
            AnimalId = taiTo.AnimalId,
            LanguageId = langEn.LanguageId,
            Title = "Big Ears the Asian Elephant - Gentle Giant",
            Content = "Asian elephants are characterized by their smaller ears and arched back. An elephant's trunk features more than 40,000 muscles, capable of grasping delicate leaves or lifting massive tree trunks.",
            AudioUrl = "/assets/audio/elephant_en.mp3",
            DurationSeconds = 125,
            Status = NarrationStatus.Published,
            CreatedBy = adminUser.UserId
        };

        // Phong Thần (Eagle) narrations
        var nEagleVi = new Narration
        {
            AnimalId = phongThan.AnimalId,
            LanguageId = langVi.LanguageId,
            Title = "Đại Bàng Phong Thần - Chúa Tể Bầu Trời",
            Content = "Đại bàng hoàng gia sở hữu thị lực gấp 8 lần con người, cho phép chúng phát hiện con mồi nhỏ từ khoảng cách hơn 3 kilomet trên bầu trời.",
            AudioUrl = "/assets/audio/eagle_vi.mp3",
            DurationSeconds = 85,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        var nEagleEn = new Narration
        {
            AnimalId = phongThan.AnimalId,
            LanguageId = langEn.LanguageId,
            Title = "Sky Lord the Imperial Eagle - Ruler of the Skies",
            Content = "The imperial eagle possesses eyesight up to eight times sharper than a human's, allowing it to spot small prey from over three kilometers away in mid-flight.",
            AudioUrl = "/assets/audio/eagle_en.mp3",
            DurationSeconds = 80,
            Status = NarrationStatus.Published,
            CreatedBy = staffUser.UserId
        };

        context.Narrations.AddRange(nSimbaVi, nSimbaEn, nSimbaZh, nTigerVi, nTigerEn, nElephantVi, nElephantEn, nEagleVi, nEagleEn);
        await context.SaveChangesAsync();

        // 13. Seed AUDIOS
        var audio1 = new Audio
        {
            NarrationId = nSimbaVi.NarrationId,
            FileUrl = "/assets/audio/simba_vi_studio.mp3",
            FileName = "simba_vi_studio.mp3",
            MimeType = "audio/mpeg",
            DurationSeconds = 120,
            FileSize = 2450000,
            Status = AudioStatus.Active
        };

        var audio2 = new Audio
        {
            NarrationId = nSimbaEn.NarrationId,
            FileUrl = "/assets/audio/simba_en_studio.mp3",
            FileName = "simba_en_studio.mp3",
            MimeType = "audio/mpeg",
            DurationSeconds = 115,
            FileSize = 2300000,
            Status = AudioStatus.Active
        };

        var audio3 = new Audio
        {
            NarrationId = nTigerVi.NarrationId,
            FileUrl = "/assets/audio/tiger_vi_studio.mp3",
            FileName = "tiger_vi_studio.mp3",
            MimeType = "audio/mpeg",
            DurationSeconds = 95,
            FileSize = 1900000,
            Status = AudioStatus.Active
        };

        context.Audios.AddRange(audio1, audio2, audio3);

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
