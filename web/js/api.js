/**
 * ZooGuide - API & Data Access Layer
 * Matches ASP.NET Core API DTOs & Endpoints
 * Supports both Live API and Mock Database with seamless toggle.
 */

const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    USE_MOCK: true, // Set to false when backend ZooGuide.API is running
    TIMEOUT_MS: 8000
};

// ==========================================
// MOCK DATA STORE (Realistic Zoo Data)
// ==========================================
const MOCK_DB = {
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
            iucnStatus: "Nguy cấp (EN)",
            origin: "Ấn Độ, Bangladesh, Đông Nam Á",
            diet: "Động vật ăn cỏ cỡ lớn (Nai, lợn rừng)",
            weight: "180 - 260 kg",
            lifespan: "15 - 20 năm",
            imageUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=800&q=80",
            mapX: 530,
            mapY: 150,
            featured: true,
            healthStatus: "Khỏe mạnh - Cân nặng tối ưu",
            breedingStatus: "Đang chăm con (2 hổ con sinh tháng 05/2026)",
            funFactsVi: [
                "Mỗi chú hổ có hoa văn vằn độc nhất vô nhị trên da, giống hệt dấu vân tay người.",
                "Hổ Bengal là loài thích bơi lội và có thể bơi qua sông rộng hơn 7km.",
                "Tiếng gầm của hổ có thể nghe thấy từ khoảng cách hơn 3km."
            ],
            funFactsEn: [
                "No two tigers have the exact same stripe pattern; stripes are unique like human fingerprints.",
                "Unlike most cats, tigers love water and are powerful swimmers.",
                "A tiger's roar can be heard from over 3 kilometers away."
            ]
        },
        {
            id: 2,
            code: "ANI-002",
            nameVi: "Voọc Chà Vá Chân Nâu",
            nameEn: "Red-shanked Douc Langur",
            scientificName: "Pygathrix nemaeus",
            species: "Khỉ Cựu Thế giới (Cercopithecidae)",
            zoneId: "zone-a",
            zoneCode: "A",
            zoneName: "Khu Linh Trưởng & Rừng Mưa",
            iucnStatus: "Cực kỳ nguy cấp (CR)",
            origin: "Bán đảo Sơn Trà & Miền Trung Việt Nam",
            diet: "Lá non, quả hạch, hoa rừng",
            weight: "8 - 11 kg",
            lifespan: "20 - 25 năm",
            imageUrl: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=800&q=80",
            mapX: 210,
            mapY: 170,
            featured: true,
            healthStatus: "Rất tốt - Khẩu phần giàu chất xơ",
            breedingStatus: "Chu kỳ sinh sản mùa thu",
            funFactsVi: [
                "Được mệnh danh là 'Nữ hoàng của các loài linh trưởng' nhờ bộ lông rực rỡ 5 màu.",
                "Dạ dày của loài này có nhiều ngăn lên men tương tự loài bò để tiêu hóa lá cây xơ cứng.",
                "Chúng di chuyển chủ yếu trên ngọn cây cao và hiếm khi chạm đất."
            ],
            funFactsEn: [
                "Known as the 'Queen of Primates' due to its spectacular 5-colored fur.",
                "They possess complex multi-chambered stomachs capable of digesting fibrous leaves.",
                "They are almost purely arboreal and rarely descend to the forest floor."
            ]
        },
        {
            id: 3,
            code: "ANI-003",
            nameVi: "Hươu Cao Cổ Nam Phi",
            nameEn: "South African Giraffe",
            scientificName: "Giraffa camelopardalis giraffa",
            species: "Họ Hươu cao cổ (Giraffidae)",
            zoneId: "zone-c",
            zoneCode: "C",
            zoneName: "Thảo Nguyên Châu Phi (Ăn Cỏ)",
            iucnStatus: "Sắp bị đe dọa (NT)",
            origin: "Thảo nguyên Nam Phi",
            diet: "Lá cây keo gai (Acacia), cỏ thảo nguyên",
            weight: "800 - 1,400 kg",
            lifespan: "25 năm",
            imageUrl: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80",
            mapX: 470,
            mapY: 400,
            featured: true,
            healthStatus: "Khỏe mạnh - Khám khớp định kỳ",
            breedingStatus: "Đang mang thai tuần thứ 40",
            funFactsVi: [
                "Chiếc lưỡi màu tím đen dài tới 45-50cm giúp chúng tránh bị cháy nắng khi vươn ăn lá trên cao.",
                "Trái tim hươu cao cổ nặng tới 11kg và tạo huyết áp gấp đôi người để bơm máu lên đầu.",
                "Mỗi ngày chúng chỉ cần ngủ ngắt quãng tổng cộng khoảng 30 phút."
            ],
            funFactsEn: [
                "Their 45cm bluish-black tongue is pigmented to prevent sunburn while feeding.",
                "A giraffe's heart weighs around 11kg to pump blood up a 2-meter long neck.",
                "Giraffes only need about 30 minutes of sleep per day, taken in short naps."
            ]
        },
        {
            id: 4,
            code: "ANI-004",
            nameVi: "Hồng Hạc Vùng Caribe",
            nameEn: "American Flamingo",
            scientificName: "Phoenicopterus ruber",
            species: "Họ Hồng hạc (Phoenicopteridae)",
            zoneId: "zone-e",
            zoneCode: "E",
            zoneName: "Vương Quốc Chim Nhiệt Đới",
            iucnStatus: "Ít quan tâm (LC)",
            origin: "Vùng biển Caribe & Quần đảo Galápagos",
            diet: "Tảo Spirulina, tôm ngâm nhỏ, giáp xác",
            weight: "2.2 - 2.8 kg",
            lifespan: "40 - 50 năm",
            imageUrl: "https://images.unsplash.com/photo-1539418561314-565804e349c0?auto=format&fit=crop&w=800&q=80",
            mapX: 380,
            mapY: 270,
            featured: false,
            healthStatus: "Sức khỏe ổn định",
            breedingStatus: "Mùa làm tổ trên gò bùn",
            funFactsVi: [
                "Sắc hồng rực rỡ của lông bắt nguồn từ chất sắc tố carotenoid có trong tôm và tảo chúng ăn.",
                "Chúng thường đứng một chân để tiết kiệm nhiệt lượng cơ thể.",
                "Hồng hạc có thể uống được cả nước sôi ở suối nước nóng và nước mặn gấp nhiều lần nước biển."
            ],
            funFactsEn: [
                "Their bright pink color comes directly from beta-carotene in their diet of shrimp and algae.",
                "Standing on one leg helps them conserve body warmth in chilly lagoon waters.",
                "Flamingos can drink near-boiling water from geysers and highly saline salt lakes."
            ]
        },
        {
            id: 5,
            code: "ANI-005",
            nameVi: "Cá Sấu Xiêm Nước Ngọt",
            nameEn: "Siamese Crocodile",
            scientificName: "Crocodylus siamensis",
            species: "Họ Cá sấu thực sự (Crocodylidae)",
            zoneId: "zone-d",
            zoneCode: "D",
            zoneName: "Thủy Cung & Bò Sát Khổng Lồ",
            iucnStatus: "Cực kỳ nguy cấp (CR)",
            origin: "Việt Nam, Campuchia, Thái Lan",
            diet: "Cá sông, ếch nhái, động vật nhỏ",
            weight: "120 - 180 kg",
            lifespan: "60 - 70 năm",
            imageUrl: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80",
            mapX: 240,
            mapY: 450,
            featured: false,
            healthStatus: "Đang tắm nắng tiêu hóa",
            breedingStatus: "Ấp trứng nhân tạo bảo tồn",
            funFactsVi: [
                "Là loài cá sấu bản địa quý hiếm của Việt Nam, từng tưởng như tuyệt chủng trong tự nhiên.",
                "Nhiệt độ của tổ ấp quyết định giới tính: 31.5°C sinh con đực, nhiệt độ cao hơn hoặc thấp hơn sinh con cái.",
                "Lực cắn của chúng có thể nghiền nát mai rùa cứng một cách nhẹ nhàng."
            ],
            funFactsEn: [
                "A critically endangered freshwater crocodile indigenous to Southeast Asia.",
                "Incubation temperature determines the hatchling's sex (31.5°C yields males).",
                "Their bite force can easily crush thick turtle shells."
            ]
        },
        {
            id: 6,
            code: "ANI-006",
            nameVi: "Ngựa Vằn Đồng Cỏ Burchell",
            nameEn: "Burchell's Zebra",
            scientificName: "Equus quagga burchellii",
            species: "Họ Ngựa (Equidae)",
            zoneId: "zone-c",
            zoneCode: "C",
            zoneName: "Thảo Nguyên Châu Phi (Ăn Cỏ)",
            iucnStatus: "Ít quan tâm (LC)",
            origin: "Đông và Nam Phi",
            diet: "Cỏ đuôi voi, lá bụi khô",
            weight: "220 - 320 kg",
            lifespan: "20 - 25 năm",
            imageUrl: "https://images.unsplash.com/photo-1501705388883-4ed8a543392c?auto=format&fit=crop&w=800&q=80",
            mapX: 520,
            mapY: 420,
            featured: false,
            healthStatus: "Khỏe mạnh",
            breedingStatus: "Bình thường",
            funFactsVi: [
                "Các sọc đen trắng hoạt động như một hệ thống điều hòa nhiệt độ và làm rối mắt ruồi xê-xê.",
                "Ngựa vằn luôn ngủ đứng khi ở trong bầy để sẵn sàng chạy trốn thú săn mồi.",
                "Mỗi cá thể ngựa vằn nhận ra mẹ mình thông qua mùi hương và âm thanh hí riêng biệt."
            ],
            funFactsEn: [
                "Stripes confuse predatory flies and act as a natural convection cooling system.",
                "Zebras typically sleep standing up so they can sprint away from danger immediately.",
                "Foals recognize their mothers by voice, scent, and unique stripe orientation."
            ]
        }
    ],

    narrations: {
        1: {
            animalId: 1,
            vi: {
                title: "Hổ Bengal - Chúa Tể Sơn Lâm Vùng Nam Á",
                narrator: "Thạc sĩ Lê Thanh Hải (Chuyên gia Động vật học)",
                durationSec: 125,
                durationFormatted: "02:05",
                summary: "Chào mừng quý khách đến với Chuồng Hổ Bengal Hoàng Gia. Trước mắt quý khách là một trong những loài dã thú oai vệ nhất hành tinh.",
                audioSrc: "assets/audio/tiger_vi.mp3",
                transcript: [
                    { time: 0, text: "Chào mừng quý khách đến với khu bảo tồn Hổ Bengal Hoàng Gia của sở thú ZooGuide." },
                    { time: 10, text: "Trước mắt quý khách là chú hổ Bengal dũng mãnh, sở hữu bộ lông vằn cam đen nổi bật." },
                    { time: 24, text: "Đặc biệt, mỗi chú hổ có hoa văn sọc độc nhất vô nhị, giống như dấu vân tay của con người." },
                    { time: 42, text: "Không giống như đa số loài mèo nhà sợ nước, hổ Bengal cực kỳ thích ngâm mình dưới hồ nước mát và bơi lội cự phách." },
                    { time: 65, text: "Tại ZooGuide, các cá thể hổ được cung cấp khẩu phần thịt bò tươi giàu dinh dưỡng và không gian vận động tiêu chuẩn quốc tế." },
                    { time: 92, text: "Hiện nay ngoài tự nhiên, hổ Bengal đang đối mặt với nguy cơ tuyệt chủng do mất môi trường sống. Hãy cùng chung tay bảo vệ loài sinh vật kỳ diệu này!" }
                ]
            },
            en: {
                title: "Royal Bengal Tiger - Sovereign of the Jungle",
                narrator: "Dr. Arthur Pendelton (Wildlife Biologist)",
                durationSec: 118,
                durationFormatted: "01:58",
                summary: "Welcome to the Royal Bengal Tiger Sanctuary. Before you is one of the most majestic apex predators on Earth.",
                audioSrc: "assets/audio/tiger_en.mp3",
                transcript: [
                    { time: 0, text: "Welcome to the Royal Bengal Tiger Habitat at ZooGuide." },
                    { time: 9, text: "Witness the magnificent striped predator basking near the natural waterfall." },
                    { time: 22, text: "Remarkably, no two tigers share the same pattern of stripes — each pattern is as distinctive as human fingerprints." },
                    { time: 45, text: "Unlike typical felines, tigers adore water and frequently swim across deep rivers in pursuit of prey or cool comfort." },
                    { time: 70, text: "Here at ZooGuide, they receive specialized veterinary care and an enrichment-filled habitat." },
                    { time: 95, text: "Bengal tigers are endangered in the wild. Thank you for supporting global conservation through your visit." }
                ]
            }
        },
        2: {
            animalId: 2,
            vi: {
                title: "Voọc Chà Vá Chân Nâu - Báu Vật Rừng Xanh Việt Nam",
                narrator: "Chuyên gia Cứu hộ Động vật Linh trưởng",
                durationSec: 130,
                durationFormatted: "02:10",
                summary: "Khám phá Nữ hoàng linh trưởng thế giới với bộ y phục lộng lẫy 5 màu đặc hữu tại dãy Trường Sơn và bán đảo Sơn Trà.",
                audioSrc: "assets/audio/douc_vi.mp3",
                transcript: [
                    { time: 0, text: "Quý khách đang chiêm ngưỡng Voọc chà vá chân nâu — báu vật linh trưởng độc đáo của Việt Nam." },
                    { time: 14, text: "Các nhà khoa học quốc tế mệnh danh loài này là 'Nữ hoàng của các loài linh trưởng' bởi vẻ đẹp quý phái hiếm thấy." },
                    { time: 35, text: "Bộ lông của chúng hài hòa 5 gam màu: xám bạc trên lưng, chân cam hạt dẻ, ngực trắng và đuôi dài thướt tha." },
                    { time: 60, text: "Thức ăn của voọc là chồi cây non và lá rừng. Dạ dày chia ngăn của chúng có khả năng giải độc và hấp thu chất xơ." },
                    { time: 88, text: "Loài này nằm trong Sách Đỏ ở mức cực kỳ nguy cấp. Quý du khách vui lòng giữ trật tự và không ném thức ăn vào chuồng." }
                ]
            },
            en: {
                title: "Red-shanked Douc Langur - Vietnam's Primate Treasure",
                narrator: "Primate Conservation Specialist",
                durationSec: 120,
                durationFormatted: "02:00",
                summary: "Discover the world's most colorful primate, native to the lush canopy of Central Vietnam.",
                audioSrc: "assets/audio/douc_en.mp3",
                transcript: [
                    { time: 0, text: "You are looking at the Red-shanked Douc Langur, celebrated internationally as the Queen of Primates." },
                    { time: 16, text: "Its splendid coat showcases five distinct hues, from chestnut legs to golden facial whiskers." },
                    { time: 38, text: "They dwell high in the forest canopies, gracefully leaping between treetops using their long tails for balance." },
                    { time: 66, text: "Their specialized sacculated stomachs ferment difficult cellulose leaves without requiring water on the ground." },
                    { time: 95, text: "Critically endangered in nature, your visit aids their breeding and reintroduction program." }
                ]
            }
        },
        3: {
            animalId: 3,
            vi: {
                title: "Hươu Cao Cổ Nam Phi - Những Người Khổng Lồ Hiền Hòa",
                narrator: "Nguyễn Thị Phương (Hướng dẫn viên)",
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
const ZooApi = {
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

window.ZooApi = ZooApi;
window.MOCK_DB = MOCK_DB;
