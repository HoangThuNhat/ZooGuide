import os

seeder_path = r"src/Infrastructure/Data/ZooGuideDataSeeder.cs"

with open(seeder_path, "r", encoding="utf-8") as f:
    content = f.read()

# Marker before section 9
start_marker = "        // 9. Seed SPECIES"
# Marker after section 13 (before section 14)
end_marker = "        // 14. Seed CHAT_SESSIONS & CHAT_MESSAGES"

idx_start = content.find(start_marker)
idx_end = content.find(end_marker)

if idx_start == -1 or idx_end == -1:
    print(f"Error: Markers not found. start={idx_start}, end={idx_end}")
    exit(1)

replacement = """        // 9. Seed SPECIES (Dữ liệu 22 loài sinh thái thực tế của Thảo Cầm Viên Sài Gòn)
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
"""

new_content = content[:idx_start] + replacement + "\n" + content[idx_end:]
with open(seeder_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Updated ZooGuideDataSeeder.cs successfully.")
