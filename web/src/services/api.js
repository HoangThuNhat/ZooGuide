/**
 * ZooGuide - API & Data Access Layer
 * Matches ASP.NET Core API DTOs & Endpoints
 * Supports both Live API and Mock Database with seamless toggle.
 */

export const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    USE_MOCK: true, // Set to false when backend ZooGuide.API is running
    TIMEOUT_MS: 8000
};

// ==========================================
// MOCK DATA STORE (Realistic Zoo Data)
// ==========================================
export const MOCK_DB = {
    tickets: [
        {
            ticketCode: "ZOO-8899-VIP",
            customerName: "Nguyễn Văn An",
            ticketType: "VIP Family Pass",
            validDate: "2026-09-30",
            status: "Active",
            zonesAllowed: ["ALL"],
            hasAudioGuide: true
        },
        {
            ticketCode: "ZOO-1234-STD",
            customerName: "Trần Thị Mai",
            ticketType: "Standard Adult",
            validDate: "2026-09-30",
            status: "Active",
            zonesAllowed: ["A", "B", "C"],
            hasAudioGuide: true
        },
        {
            ticketCode: "ZOO-9999-EXP",
            customerName: "Lê Hoàng Phúc",
            ticketType: "Standard Adult",
            validDate: "2026-09-01",
            status: "Expired",
            zonesAllowed: ["ALL"],
            hasAudioGuide: false
        }
    ],

    areas: [
        {
            id: "zone-a",
            code: "A",
            nameVi: "Khu Linh Trưởng & Rừng Mưa",
            nameEn: "Primate & Rainforest Zone",
            color: "#15803D",
            icon: "tree",
            descriptionVi: "Nơi sinh sống của các loài linh trưởng quý hiếm như Vượn đen má trắng, Voọc chà vá chân nâu trong không gian rừng mưa nhiệt đới.",
            descriptionEn: "Home to rare primates including White-cheeked gibbons and Red-shanked douc langurs.",
            mapCoords: { x: 220, y: 180, radius: 90 },
            animalCount: 8
        },
        {
            id: "zone-b",
            code: "B",
            nameVi: "Khu Động Vật Ăn Thịt Hoàng Gia",
            nameEn: "Royal Carnivore Savannah",
            color: "#B45309",
            icon: "shield",
            descriptionVi: "Khu bảo tồn Hổ Bengal, Sư tử Châu Phi và Báo hoa mai với hệ thống hào bảo vệ tự nhiên hiện đại.",
            descriptionEn: "Sanctuary for Bengal Tigers, African Lions, and Leopards with natural barrier moat systems.",
            mapCoords: { x: 520, y: 160, radius: 100 },
            animalCount: 6
        },
        {
            id: "zone-c",
            code: "C",
            nameVi: "Thảo Nguyên Châu Phi (Ăn Cỏ)",
            nameEn: "African Herbivore Savannah",
            color: "#059669",
            icon: "sun",
            descriptionVi: "Đồng cỏ bán hoang dã rộng lớn với Hươu cao cổ, Ngựa vằn, Tê giác trắng và Đà điểu.",
            descriptionEn: "Vast semi-wild savanna featuring Giraffes, Zebras, White Rhinos, and Ostriches.",
            mapCoords: { x: 480, y: 410, radius: 110 },
            animalCount: 10
        },
        {
            id: "zone-d",
            code: "D",
            nameVi: "Thủy Cung & Bò Sát Khổng Lồ",
            nameEn: "Aquarium & Reptile Haven",
            color: "#0284C7",
            icon: "droplet",
            descriptionVi: "Hệ sinh thái dưới nước cùng khu vực bò sát nhiệt đới: Cá sấu Xiêm, Rùa sao, Rái cá vuốt bé.",
            descriptionEn: "Aquatic ecosystem and tropical reptile house featuring Siamese crocodiles and Asian small-clawed otters.",
            mapCoords: { x: 230, y: 440, radius: 85 },
            animalCount: 7
        },
        {
            id: "zone-e",
            code: "E",
            nameVi: "Vương Quốc Chim Nhiệt Đới",
            nameEn: "Tropical Bird Aviary",
            color: "#7C3AED",
            icon: "feather",
            descriptionVi: "Nhà lồng khổng lồ tự do cho Hồng hạc, Vẹt Macaw, Hồng hoàng mỏ sừng và các loài chim di cư.",
            descriptionEn: "Giant walk-in aviary showcasing Flamingos, Macaws, Great Hornbills and migratory birds.",
            mapCoords: { x: 370, y: 280, radius: 80 },
            animalCount: 9
        }
    ],

    animals: [
        {
            id: 1,
            code: "ANI-001",
            nameVi: "Hổ Bengal Hoàng Gia",
            nameEn: "Royal Bengal Tiger",
            scientificName: "Panthera tigris tigris",
            species: "Họ Mèo lớn (Felidae)",
            zoneId: "zone-b",
            zoneCode: "B",
            zoneName: "Khu Động Vật Ăn Thịt Hoàng Gia",
            mapX: 520,
            mapY: 160,
            imageUrl: "https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=800&q=80",
            origin: "Ấn Độ, Bangladesh",
            diet: "Thịt hươu, nai, lợn rừng (Ăn thịt)",
            lifespan: "15 - 20 năm",
            weight: "180 - 260 kg",
            iucnStatus: "Nguy cấp (EN)",
            healthStatus: "Rất tốt • Đang theo dõi cân nặng định kỳ",
            breedingStatus: "Đang trong mùa ghép đôi sinh sản",
            funFactsVi: [
                "Mỗi cá thể hổ có họa tiết vằn độc nhất vô nhị trên da, giống hệt dấu vân tay người.",
                "Hổ Bengal thích bơi lội dưới nước giải nhiệt — khác với đa số các loài mèo thông thường.",
                "Tiếng gầm của hổ Bengal có thể vang xa tới 3km trong rừng rậm."
            ],
            funFactsEn: [
                "No two Bengal tigers have the same stripes; their coats are as unique as human fingerprints.",
                "Unlike most cats, tigers are excellent swimmers and often soak in water to cool off.",
                "A tiger's roar can be heard from up to 3 kilometers (2 miles) away."
            ]
        },
        {
            id: 2,
            code: "ANI-002",
            nameVi: "Voọc Chà Vá Chân Nâu",
            nameEn: "Red-shanked Douc Langur",
            scientificName: "Pygathrix nemaeus",
            species: "Linh trưởng (Cercopithecidae)",
            zoneId: "zone-a",
            zoneCode: "A",
            zoneName: "Khu Linh Trưởng & Rừng Mưa",
            mapX: 220,
            mapY: 180,
            imageUrl: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=800&q=80",
            origin: "Việt Nam, Lào (Đông Dương)",
            diet: "Lá cây non, quả dại, hoa rừng",
            lifespan: "20 - 25 năm",
            weight: "8 - 11 kg",
            iucnStatus: "Cực kỳ nguy cấp (CR)",
            healthStatus: "Khỏe mạnh • Chế độ ăn hữu cơ 100%",
            breedingStatus: "Đã sinh sản thành công 1 cá thể non vào tháng 4",
            funFactsVi: [
                "Được mệnh danh là 'Nữ hoàng của các loài linh trưởng' nhờ bộ lông rực rỡ 5 màu sắc tự nhiên.",
                "Dạ dày của chúng có cấu tạo nhiều ngăn tương tự như loài bò để tiêu hóa chất xơ từ lá cây.",
                "Loài linh trưởng đặc hữu vô cùng quý hiếm của bán đảo Sơn Trà, Việt Nam."
            ],
            funFactsEn: [
                "Known as the 'Queen of Primates' because of its striking 5-colored fur coat.",
                "They possess complex multi-chambered stomachs similar to cows to digest fibrous leaves.",
                "An iconic and critically endangered primate native to the Son Tra Peninsula, Vietnam."
            ]
        },
        {
            id: 3,
            code: "ANI-003",
            nameVi: "Hươu Cao Cổ Nam Phi",
            nameEn: "South African Giraffe",
            scientificName: "Giraffa camelopardalis giraffa",
            species: "Động vật móng guốc (Giraffidae)",
            zoneId: "zone-c",
            zoneCode: "C",
            zoneName: "Thảo Nguyên Châu Phi (Ăn Cỏ)",
            mapX: 480,
            mapY: 410,
            imageUrl: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80",
            origin: "Nam Phi, Namibia, Botswana",
            diet: "Lá cây keo gai (Acacia), cỏ non",
            lifespan: "25 năm",
            weight: "800 - 1.200 kg",
            iucnStatus: "Sắp bị đe dọa (NT)",
            healthStatus: "Tốt • Vận động tự do tại đồng cỏ",
            breedingStatus: "Đang mang thai tuần thứ 40",
            funFactsVi: [
                "Chiếc lưỡi màu tím sẫm của hươu cao cổ có thể dài tới 45 - 50cm, tránh bị cháy nắng khi vươn hái lá.",
                "Hươu cao cổ chỉ cần ngủ khoảng 30 phút đến 2 tiếng mỗi ngày.",
                "Trái tim của hươu nặng hơn 11kg để đủ áp lực bơm máu lên chiếc cổ dài 2 mét."
            ],
            funFactsEn: [
                "A giraffe's tongue is up to 50 cm long and bluish-black to protect it from sunburn.",
                "Giraffes only need between 30 minutes and 2 hours of sleep per day.",
                "Their heart weighs about 11 kilograms to pump blood up their 2-meter long neck."
            ]
        },
        {
            id: 4,
            code: "ANI-004",
            nameVi: "Cá Sấu Xiêm Nước Ngọt",
            nameEn: "Siamese Freshwater Crocodile",
            scientificName: "Crocodylus siamensis",
            species: "Bộ Cá sấu (Crocodylidae)",
            zoneId: "zone-d",
            zoneCode: "D",
            zoneName: "Thủy Cung & Bò Sát Khổng Lồ",
            mapX: 230,
            mapY: 440,
            imageUrl: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80",
            origin: "Đông Nam Á (Việt Nam, Campuchia)",
            diet: "Cá tươi, tôm cua, lưỡng cư nhỏ",
            lifespan: "60 - 70 năm",
            weight: "70 - 150 kg",
            iucnStatus: "Cực kỳ nguy cấp (CR)",
            healthStatus: "Khỏe mạnh • Hồ bơi duy trì 29°C",
            breedingStatus: "Đang bảo tồn ấp trứng nhân tạo",
            funFactsVi: [
                "Một trong những loài cá sấu hiền lành nhất thế giới, hiếm khi tấn công con người vô cớ.",
                "Được xem là hóa thạch sống thời tiền sử gần như không biến đổi hình thái hàng chục triệu năm qua.",
                "Hiện có chương trình tái thả thành công tại Vườn Quốc Gia Cát Tiên."
            ],
            funFactsEn: [
                "One of the least aggressive crocodilian species toward humans in the wild.",
                "Considered a living fossil that has remained unchanged for millions of years.",
                "Successfully re-introduced in Vietnam's Cat Tien National Park reserve."
            ]
        },
        {
            id: 5,
            code: "ANI-005",
            nameVi: "Hồng Hạc Caribê",
            nameEn: "American Flamingo",
            scientificName: "Phoenicopterus ruber",
            species: "Bộ Hồng hạc (Phoenicopteridae)",
            zoneId: "zone-e",
            zoneCode: "E",
            zoneName: "Vương Quốc Chim Nhiệt Đới",
            mapX: 370,
            mapY: 280,
            imageUrl: "https://images.unsplash.com/photo-1539418561314-565804e349c0?auto=format&fit=crop&w=800&q=80",
            origin: "Quần đảo Caribê, Nam Mỹ",
            diet: "Tảo biển đỏ, ấu trùng giáp xác giàu carotenoid",
            lifespan: "30 - 40 năm",
            weight: "2 - 4 kg",
            iucnStatus: "Ít quan tâm (LC)",
            healthStatus: "Rất tốt • Đàn 14 con hòa đồng",
            breedingStatus: "Mùa làm tổ bùn hình nón",
            funFactsVi: [
                "Màu hồng đỏ rực rỡ của bộ lông bắt nguồn từ chất sắc tố carotenoid có trong tôm và tảo chúng ăn.",
                "Khả năng đứng co 1 chân trong nhiều giờ liên tục giúp chúng tiết kiệm thân nhiệt.",
                "Mỏ của hồng hạc hoạt động như một chiếc máy lọc tự nhiên ngược."
            ],
            funFactsEn: [
                "Their vibrant pink feather color comes directly from beta-carotene in the algae and brine shrimp they consume.",
                "Standing on one leg helps conserve body heat and energy over long periods.",
                "Flamingos feed with their heads upside down to filter water through specialized beaks."
            ]
        },
        {
            id: 6,
            code: "ANI-006",
            nameVi: "Sư Tử Châu Phi",
            nameEn: "African Lion",
            scientificName: "Panthera leo",
            species: "Họ Mèo lớn (Felidae)",
            zoneId: "zone-b",
            zoneCode: "B",
            zoneName: "Khu Động Vật Ăn Thịt Hoàng Gia",
            mapX: 550,
            mapY: 220,
            imageUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80",
            origin: "Châu Phi hạ Sahara",
            diet: "Thịt bò, hươu nai",
            lifespan: "14 - 18 năm",
            weight: "150 - 225 kg",
            iucnStatus: "Sắp nguy cấp (VU)",
            healthStatus: "Tốt • Vận động định kỳ",
            breedingStatus: "Đang chăm sóc đàn gia đình 4 cá thể",
            funFactsVi: [
                "Sư tử là loài mèo lớn duy nhất sống theo bầy đàn gắn kết xã hội.",
                "Con cái đảm nhận 90% nhiệm vụ săn mồi cho toàn bộ bầy.",
                "Bờm của sư tử đực càng sẫm màu chứng tỏ cá thể đó càng khỏe mạnh và nhiều tuổi."
            ],
            funFactsEn: [
                "Lions are the only cats that live in family groups called prides.",
                "Lionesses do about 90% of the hunting for the pride.",
                "A darker mane on a male lion indicates higher testosterone and prime physical condition."
            ]
        }
    ],

    narrations: {
        1: {
            vi: {
                title: "Hổ Bengal Hoàng Gia - Chúa Sơn Lâm Rực Lửa",
                narrator: "Chuyên gia Sinh học ZooGuide",
                durationSec: 120,
                durationFormatted: "02:00",
                summary: "Khám phá cuộc sống bí ẩn của loài hổ Bengal hùng vĩ tại khu bảo tồn hoang dã tự nhiên.",
                audioSrc: "assets/audio/tiger_vi.mp3",
                transcript: [
                    { time: 0, text: "Chào mừng quý khách đến với phân khu Ăn Thịt Hoàng Gia của sở thú thông minh ZooGuide." },
                    { time: 10, text: "Trước mắt quý khách là Hổ Bengal Hoàng Gia, một trong những phân loài hổ dũng mãnh và lớn nhất trên hành tinh." },
                    { time: 28, text: "Bộ lông màu cam rực rỡ xen kẽ những vạch đen sẫm là lớp ngụy trang tuyệt hảo giữa ánh nắng xuyên qua tán rừng nhiệt đới." },
                    { time: 48, text: "Khác với các loài mèo sợ nước, hổ Bengal là những tay bơi cự phách và thường xuyên ngâm mình dưới hồ nước vào những buổi trưa oi bức." },
                    { time: 72, text: "Tại ZooGuide, chúng tôi áp dụng chế độ nuôi dưỡng tự nhiên bán hoang dã với hào nước bảo vệ thay cho lồng sắt giam cầm." },
                    { time: 95, text: "Xin quý khách lưu ý giữ trật tự và không ném thức ăn cho hổ. Chúc quý khách một chuyến tham quan đầy phấn khởi!" }
                ]
            },
            en: {
                title: "Royal Bengal Tiger - Monarch of the Wilderness",
                narrator: "Wildlife Conservation Specialist",
                durationSec: 110,
                durationFormatted: "01:50",
                summary: "Discover the captivating life of the Royal Bengal Tiger in their expansive natural enclosure.",
                audioSrc: "assets/audio/tiger_en.mp3",
                transcript: [
                    { time: 0, text: "Welcome to the Royal Carnivore Sanctuary here at ZooGuide Smart Tour." },
                    { time: 8, text: "In front of you is the Royal Bengal Tiger, one of the most iconic apex predators on our planet." },
                    { time: 24, text: "Their striking reddish-orange coat with dark vertical stripes provides consummate camouflage in dappled sunlight." },
                    { time: 42, text: "Unlike typical domesticated felines, Bengal tigers love water and frequently swim across rivers to stay cool." },
                    { time: 65, text: "Here at ZooGuide, our natural moat enclosures allow them to explore freely without restrictive iron cages." },
                    { time: 88, text: "Please refrain from feeding the animals and enjoy observing these magnificent monarchs in peace." }
                ]
            }
        },
        2: {
            vi: {
                title: "Voọc Chà Vá Chân Nâu - Báu Vật Rừng Xanh Sơn Trà",
                narrator: "Kiểm lâm viên Vườn Quốc Gia",
                durationSec: 135,
                durationFormatted: "02:15",
                summary: "Tìm hiểu loài linh trưởng quý hiếm 5 màu được mệnh danh là nữ hoàng linh trưởng thế giới.",
                audioSrc: "assets/audio/douc_vi.mp3",
                transcript: [
                    { time: 0, text: "Quý khách đang đứng trước khu vực nuôi dưỡng linh trưởng nhiệt đới của vườn thú ZooGuide." },
                    { time: 12, text: "Voọc chà vá chân nâu là loài đặc hữu tuyệt đẹp của bán đảo Đông Dương, đặc biệt tập trung tại Sơn Trà, Đà Nẵng." },
                    { time: 35, text: "Các nhà khoa học quốc tế mệnh danh loài này là 'Nữ hoàng của các loài linh trưởng' bởi sự phối màu tự nhiên rực rỡ và hài hòa." },
                    { time: 60, text: "Chúng sống hoàn toàn trên các tầng tán cây cao, di chuyển nhẹ nhàng bằng những cú nhảy uyển chuyển qua các cành lá." },
                    { time: 85, text: "Thức ăn của Voọc gồm hơn 100 loài lá cây non, chồi hoa và quả dại giàu dinh dưỡng." },
                    { time: 110, text: "Hãy cùng chung tay bảo vệ rừng tự nhiên để bảo tồn loài báu vật quý giá này cho thế hệ tương lai." }
                ]
            },
            en: {
                title: "Red-shanked Douc Langur - Queen of Primates",
                narrator: "Primate Biologist",
                durationSec: 120,
                durationFormatted: "02:00",
                summary: "Explore the habitat and habits of the magnificent 5-color langur endemic to the Indochinese peninsula.",
                audioSrc: "assets/audio/douc_en.mp3",
                transcript: [
                    { time: 0, text: "Welcome to the Primate & Tropical Rainforest sector at ZooGuide." },
                    { time: 10, text: "You are looking at the Red-shanked douc langur, endemic to Vietnam, Laos, and Cambodia." },
                    { time: 30, text: "Often hailed by biologists as the 'Queen of Primates' due to their gorgeous, kaleidoscopic five-color coat." },
                    { time: 55, text: "They are strictly arboreal creatures, spending their entire lives moving gracefully across tree canopies." },
                    { time: 80, text: "Their specialized diet comprises hundreds of tender leaves, seeds, and exotic forest flowers." },
                    { time: 102, text: "Thank you for supporting wildlife conservation with your smart visit today." }
                ]
            }
        },
        3: {
            vi: {
                title: "Hươu Cao Cổ Nam Phi - Những Người Khổng Lồ Hiền Hòa",
                narrator: "Hướng dẫn viên Thảo Nguyên Safari",
                durationSec: 110,
                durationFormatted: "01:50",
                summary: "Tìm hiểu loài động vật trên cạn cao nhất hành tinh với chiếc cổ dài và bước đi tao nhã.",
                audioSrc: "assets/audio/giraffe_vi.mp3",
                transcript: [
                    { time: 0, text: "Chào mừng quý khách đến với Thảo nguyên Châu Phi tại ZooGuide." },
                    { time: 12, text: "Hươu cao cổ là sinh vật có chiều cao ấn tượng nhất trên Trái Đất, có thể đạt tới 5.5 mét." },
                    { time: 32, text: "Mặc dù chiếc cổ rất dài, số lượng đốt sống cổ của chúng chỉ là 7 đốt — hoàn toàn bằng số đốt sống cổ của con người!" },
                    { time: 55, text: "Lưỡi của hươu cao cổ dài gần nửa mét, có lớp sừng dày giúp chúng ăn ngon lành những cành cây keo đầy gai nhọn." },
                    { time: 80, text: "Hãy quan sát những bước đi nhịp nhàng của gia đình hươu cao cổ khi hoàng hôn dần buông xuống thảo nguyên." }
                ]
            },
            en: {
                title: "South African Giraffe - Gentle Giants of the Savanna",
                narrator: "Safari Tour Specialist",
                durationSec: 105,
                durationFormatted: "01:45",
                summary: "Learn about the tallest land mammal on the planet and its remarkable physiological adaptations.",
                audioSrc: "assets/audio/giraffe_en.mp3",
                transcript: [
                    { time: 0, text: "Welcome to the African Savanna biome of ZooGuide." },
                    { time: 10, text: "Giraffes stand as the tallest land mammals on Earth, reaching heights of up to 5.5 meters." },
                    { time: 30, text: "Despite their towering necks, they have only seven neck vertebrae — the exact same number as humans!" },
                    { time: 52, text: "Their prehensile tongue stretches nearly 50 centimeters, allowing them to pluck tender leaves from thorny acacia trees." },
                    { time: 78, text: "Enjoy the serene grace of our giraffe herd as they browse comfortably in their spacious savanna habitat." }
                ]
            }
        }
    },

    healthLogs: [
        {
            id: 101,
            animalCode: "ANI-001",
            animalName: "Hổ Bengal Hoàng Gia",
            date: "2026-09-28",
            veterinarian: "BS. Trần Minh Quân",
            weightKg: 215,
            healthStatus: "Tốt",
            temperatureC: 38.2,
            notes: "Kiểm tra răng và móng, sức ăn 8kg thịt/ngày. Tâm lý vui vẻ.",
            actionRequired: "Tiêm nhắc vắc-xin dại vào tháng 11"
        },
        {
            id: 102,
            animalCode: "ANI-002",
            animalName: "Voọc Chà Vá Chân Nâu",
            date: "2026-09-27",
            veterinarian: "BS. Vũ Thị Lan",
            weightKg: 9.8,
            healthStatus: "Rất tốt",
            temperatureC: 37.5,
            notes: "Bộ lông bóng mượt, bổ sung sung muối khoáng và chồi dâu tằm.",
            actionRequired: "Theo dõi chu kỳ sinh sản tháng 10"
        },
        {
            id: 103,
            animalCode: "ANI-003",
            animalName: "Hươu Cao Cổ Nam Phi",
            date: "2026-09-25",
            veterinarian: "BS. Trần Minh Quân",
            weightKg: 1120,
            healthStatus: "Mang thai tuần 40",
            temperatureC: 38.0,
            notes: "Siêu âm thai nhi phát triển đều, nhịp tim thai ổn định.",
            actionRequired: "Chuẩn bị khu vực đẻ lót rơm mềm dày 30cm"
        }
    ]
};

// ==========================================
// API CLIENT IMPLEMENTATION
// ==========================================
export const ZooApi = {
    // 1. TICKET & SESSION
    async validateTicket(ticketCode) {
        if (!ticketCode || !ticketCode.trim()) {
            return { success: false, message: "Vui lòng nhập mã vé hợp lệ." };
        }

        const normalizedCode = ticketCode.trim().toUpperCase();

        if (API_CONFIG.USE_MOCK) {
            await this._simulateLatency(350);
            const ticket = MOCK_DB.tickets.find(t => t.ticketCode.toUpperCase() === normalizedCode);
            
            if (!ticket) {
                return { 
                    success: false, 
                    message: "Không tìm thấy vé trong hệ thống! Vui lòng kiểm tra lại mã in trên vé hoặc liên hệ quầy vé ZooGuide." 
                };
            }

            if (ticket.status === "Expired") {
                return { 
                    success: false, 
                    message: `Vé ${ticket.ticketCode} đã hết hạn sử dụng vào ngày ${ticket.validDate}. Vui lòng đổi vé mới.` 
                };
            }

            // Create TicketSession
            const session = {
                sessionId: "SES-" + Date.now().toString(36).toUpperCase(),
                ticketCode: ticket.ticketCode,
                customerName: ticket.customerName,
                ticketType: ticket.ticketType,
                validDate: ticket.validDate,
                zonesAllowed: ticket.zonesAllowed,
                hasAudioGuide: ticket.hasAudioGuide,
                activatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString() // Valid 8 hours
            };

            return {
                success: true,
                message: "Xác thực vé thành công! Phiên tham quan đã được mở khóa.",
                session: session
            };
        }

        // Live API call
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/tickets/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketCode: normalizedCode })
            });
            if (!res.ok) throw new Error("Lỗi kết nối máy chủ");
            return await res.json();
        } catch (err) {
            console.warn("Live API failed, fallback to mock:", err);
            return { success: false, message: "Không thể kết nối đến máy chủ vé." };
        }
    },

    // 2. GET AREAS
    async getAreas() {
        if (API_CONFIG.USE_MOCK) {
            await this._simulateLatency(150);
            return { success: true, data: MOCK_DB.areas };
        }
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/areas`);
            return await res.json();
        } catch (err) {
            return { success: true, data: MOCK_DB.areas };
        }
    },

    // 3. GET ANIMALS (with filters)
    async getAnimals(filters = {}) {
        if (API_CONFIG.USE_MOCK) {
            await this._simulateLatency(200);
            let results = [...MOCK_DB.animals];

            if (filters.search) {
                const q = filters.search.toLowerCase().trim();
                results = results.filter(a => 
                    a.nameVi.toLowerCase().includes(q) || 
                    a.nameEn.toLowerCase().includes(q) || 
                    a.scientificName.toLowerCase().includes(q) ||
                    a.species.toLowerCase().includes(q)
                );
            }

            if (filters.zoneId && filters.zoneId !== 'all') {
                results = results.filter(a => a.zoneId === filters.zoneId);
            }

            if (filters.iucnStatus && filters.iucnStatus !== 'all') {
                results = results.filter(a => a.iucnStatus.includes(filters.iucnStatus));
            }

            return { success: true, count: results.length, data: results };
        }

        try {
            const query = new URLSearchParams(filters).toString();
            const res = await fetch(`${API_CONFIG.BASE_URL}/animals?${query}`);
            return await res.json();
        } catch (err) {
            return { success: true, count: MOCK_DB.animals.length, data: MOCK_DB.animals };
        }
    },

    // 4. GET ANIMAL BY ID
    async getAnimalById(id) {
        if (API_CONFIG.USE_MOCK) {
            await this._simulateLatency(100);
            const animal = MOCK_DB.animals.find(a => a.id === parseInt(id));
            if (!animal) return { success: false, message: "Không tìm thấy động vật." };
            return { success: true, data: animal };
        }
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/animals/${id}`);
            return await res.json();
        } catch (err) {
            return { success: false, message: "Lỗi kết nối máy chủ" };
        }
    },

    // 5. GET NARRATION BY ANIMAL ID & LANG
    async getNarration(animalId, lang = 'vi') {
        const id = parseInt(animalId);
        if (API_CONFIG.USE_MOCK) {
            await this._simulateLatency(120);
            const narrationGroup = MOCK_DB.narrations[id];
            if (narrationGroup && narrationGroup[lang]) {
                return { success: true, data: narrationGroup[lang] };
            }
            // Fallback: create generic narration if not hardcoded
            const animal = MOCK_DB.animals.find(a => a.id === id);
            if (animal) {
                const genericVi = {
                    title: `Thuyết minh: ${animal.nameVi}`,
                    narrator: "Hệ thống AI Hướng Dẫn Viên ZooGuide",
                    durationSec: 90,
                    durationFormatted: "01:30",
                    summary: `Giới thiệu về loài ${animal.nameVi} (${animal.scientificName}), sinh sống tại ${animal.zoneName}.`,
                    transcript: [
                        { time: 0, text: `Chào mừng bạn đến với khu vực nuôi dưỡng ${animal.nameVi}.` },
                        { time: 15, text: `Tên khoa học của loài là ${animal.scientificName}, thuộc ${animal.species}.` },
                        { time: 35, text: `Tình trạng bảo tồn hiện nay: ${animal.iucnStatus}. Nguồn gốc từ ${animal.origin}.` },
                        { time: 60, text: animal.funFactsVi[0] || "Động vật quý hiếm cần được chung tay bảo tồn." },
                        { time: 80, text: "Chúc quý khách có trải nghiệm tham quan vui vẻ và ý nghĩa tại ZooGuide." }
                    ]
                };
                return { success: true, data: genericVi };
            }
            return { success: false, message: "Chưa có bài thuyết minh cho động vật này." };
        }

        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/narrations?animalId=${id}&lang=${lang}`);
            return await res.json();
        } catch (err) {
            return { success: false, message: "Không thể tải thuyết minh" };
        }
    },

    // 6. STAFF: GET HEALTH LOGS
    async getHealthLogs() {
        await this._simulateLatency(200);
        return { success: true, data: MOCK_DB.healthLogs };
    },

    // 7. STAFF: ADD HEALTH RECORD
    async addHealthRecord(record) {
        await this._simulateLatency(300);
        const newRecord = {
            id: Date.now(),
            ...record,
            date: new Date().toISOString().split('T')[0]
        };
        MOCK_DB.healthLogs.unshift(newRecord);
        return { success: true, message: "Đã cập nhật hồ sơ sức khỏe thành công!", data: newRecord };
    },

    // 8. SIMULATE LATENCY FOR UX REALISM
    _simulateLatency(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
