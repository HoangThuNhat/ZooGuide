import os

seeder_path = "src/Infrastructure/Data/ZooGuideDataSeeder.cs"
with open(seeder_path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace section 10 and 11 with complete canonical Areas, Enclosures, and Animal assignments
old_section = """        // 10. Seed AREAS (Khu Sư tử, Khu Hổ, Khu Voi, Khu Chim)
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

        // 11. Seed ANIMALS (Cá thể động vật thực tế tại Thảo Cầm Viên Sài Gòn)
        var animals = new List<Animal>
        {
            new Animal
            {
                SpeciesId = spLion.SpeciesId,
                AreaId = areaLion.AreaId,
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
                AreaId = areaTiger.AreaId,
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
                AreaId = areaElephant.AreaId,
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
                AreaId = areaBird.AreaId,
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
        await context.SaveChangesAsync();"""

new_section = """        // 10. Seed AREAS (7 Phân khu sinh thái chuẩn thực tế Thảo Cầm Viên Sài Gòn)
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
        await context.SaveChangesAsync();"""

old_norm = old_section.replace("\r\n", "\n")
text_norm = text.replace("\r\n", "\n")

if old_norm in text_norm:
    text_norm = text_norm.replace(old_norm, new_section)
    with open(seeder_path, "w", encoding="utf-8") as f:
        f.write(text_norm)
    print("ZooGuideDataSeeder.cs successfully updated with real Areas and Enclosures!")
else:
    print("Could not find exact old_section in ZooGuideDataSeeder.cs")
