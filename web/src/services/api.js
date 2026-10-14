/**
 * ZooGuide - API & Data Access Layer
 * Matches ASP.NET Core API DTOs & Endpoints
 * Supports both Live API and Mock Database with seamless toggle.
 */

export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5142/api',
    USE_MOCK: import.meta.env.VITE_USE_MOCK !== undefined
        ? import.meta.env.VITE_USE_MOCK === 'true'
        : false,
    TIMEOUT_MS: 8000
};

// ==========================================
// MOCK DATA STORE (Realistic Zoo Data)
// ==========================================
export const MOCK_DB = {
    species: [
        { id: 1, nameVi: "Họ Mèo lớn", nameEn: "Big Cats (Felidae)", scientificOrder: "Carnivora", description: "Các loài thú ăn thịt đầu bảng với sức mạnh và móng vuốt sắc nhọn." },
        { id: 2, nameVi: "Linh trưởng Cựu Thế Giới", nameEn: "Old World Monkeys", scientificOrder: "Primates", description: "Các loài khỉ, vượn và voọc sinh sống tại châu Á và châu Phi." },
        { id: 3, nameVi: "Động vật móng guốc chẵn", nameEn: "Even-toed Ungulates", scientificOrder: "Artiodactyla", description: "Hươu, nai, hươu cao cổ, ngựa vằn sinh sống trên thảo nguyên." },
        { id: 4, nameVi: "Bộ Cá sấu", nameEn: "Crocodilians", scientificOrder: "Crocodilia", description: "Bò sát thủy sinh cỡ lớn ăn thịt từ thời tiền sử." },
        { id: 5, nameVi: "Bộ Hồng hạc", nameEn: "Flamingos", scientificOrder: "Phoenicopteriformes", description: "Các loài chim lội nước chân dài với bộ lông màu hồng rực rỡ." }
    ],

    ticketTypes: [
        { id: 1, code: "VIP-FAM", name: "VIP Family Pass", price: 350000, description: "Vé trọn gói gia đình 4 người, gồm quyền Audio Guide và xe điện toàn khu." },
        { id: 2, code: "STD-ADULT", name: "Standard Adult", price: 120000, description: "Vé tiêu chuẩn người lớn tham quan 5 phân khu." },
        { id: 3, code: "STD-CHILD", name: "Standard Child", price: 60000, description: "Vé trẻ em dưới 1m3 tham quan và trải nghiệm giáo dục." },
        { id: 4, code: "AUDIO-ADD", name: "Audio Tour Add-on", price: 40000, description: "Gói nâng cấp thuyết minh song ngữ tự động theo vị trí." }
    ],

    ticketSessions: [
        { sessionId: "SES-V810A1", ticketCode: "ZOO-8899-VIP", customerName: "Nguyễn Văn An", ticketType: "VIP Family Pass", activatedAt: "2026-09-30 08:30", status: "Active", device: "Mobile Safari (iOS)" },
        { sessionId: "SES-V810B2", ticketCode: "ZOO-1234-STD", customerName: "Trần Thị Mai", ticketType: "Standard Adult", activatedAt: "2026-09-30 09:15", status: "Active", device: "Chrome Mobile (Android)" }
    ],

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
        // --- Họ Mèo (Felidae) ---
        {
            id: 1,
            code: "ANI-001",
            nameVi: "Sư tử Simba",
            nameEn: "African Lion Simba",
            scientificName: "Panthera leo",
            species: "Sư tử Châu Phi",
            speciesId: 1,
            zoneId: "zone-b",
            zoneCode: "B",
            zoneName: "Khu Động Vật Ăn Thịt Hoàng Gia",
            mapX: 550,
            mapY: 220,
            imageUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80",
            origin: "Vườn quốc gia Serengeti, Tanzania",
            diet: "Thịt bò tươi, thịt cừu (Ăn thịt)",
            lifespan: "14 - 18 năm",
            weight: "190 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Khỏe mạnh, sung mãn",
            breedingStatus: "Đầu đàn, đang bảo vệ đàn gia đình",
            funFactsVi: [
                "Simba có bộ bờm nâu đen sẫm đặc trưng, dấu hiệu của sức mạnh và thể lực sung mãn.",
                "Sư tử là loài mèo lớn duy nhất sống theo bầy đàn gắn kết xã hội chặt chẽ.",
                "Tiếng gầm uy lực của Simba có thể truyền xa tới 8km trên thảo nguyên rộng lớn."
            ],
            funFactsEn: [
                "Simba has a distinctive dark mane indicating maturity and strength.",
                "Lions are the only felids that live in highly social prides.",
                "A lion's roar can be heard from up to 8 kilometers away."
            ]
        },
        {
            id: 2,
            code: "ANI-002",
            nameVi: "Sư tử Nala",
            nameEn: "African Lion Nala",
            scientificName: "Panthera leo",
            species: "Sư tử Châu Phi",
            speciesId: 1,
            zoneId: "zone-b",
            zoneCode: "B",
            zoneName: "Khu Động Vật Ăn Thịt Hoàng Gia",
            mapX: 560,
            mapY: 230,
            imageUrl: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=800&q=80",
            origin: "Khu bảo tồn Masai Mara, Kenya",
            diet: "Thịt bò, hươu nai",
            lifespan: "15 - 18 năm",
            weight: "135 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Rất tốt • Đang nuôi con",
            breedingStatus: "Đã sinh sản thành công lứa con khỏe mạnh",
            funFactsVi: [
                "Sư tử cái là những thợ săn chính chịu trách nhiệm cung cấp 90% thức ăn cho cả bầy.",
                "Nala có thị lực ban đêm nhạy bén gấp 6 lần con người.",
                "Chúng giao tiếp với nhau bằng nhiều âm điệu gầm, hú và cọ đầu tình cảm."
            ],
            funFactsEn: [
                "Lionesses do about 90% of the hunting for the pride.",
                "Nala has night vision roughly 6 times more acute than humans.",
                "Lions greet each other with head rubbing and gentle chuffs."
            ]
        },
        {
            id: 3,
            code: "ANI-003",
            nameVi: "Hổ Bengal Cường Đô",
            nameEn: "Bengal Tiger Cuong Do",
            scientificName: "Panthera tigris tigris",
            species: "Hổ Bengal",
            speciesId: 2,
            zoneId: "zone-b",
            zoneCode: "B",
            zoneName: "Khu Động Vật Ăn Thịt Hoàng Gia",
            mapX: 520,
            mapY: 160,
            imageUrl: "https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=800&q=80",
            origin: "Vườn thú Singapore (trao đổi giống quốc tế)",
            diet: "Thịt bò nạc, thỏ nguyên con",
            lifespan: "16 - 20 năm",
            weight: "220 kg",
            iucnStatus: "EN - Nguy cấp",
            healthStatus: "Rất tốt • Thể lực hoàn hảo",
            breedingStatus: "Đực giống thuần chủng gen F1",
            funFactsVi: [
                "Họa tiết vằn vện trên da của Cường Đô là độc nhất vô nhị, tương tự như vân tay người.",
                "Cường Đô cực kỳ yêu thích bơi lội và có thể ngâm mình hàng giờ dưới hồ nước.",
                "Móng vuốt của hổ có thể thụt thò linh hoạt, dài tới 10cm."
            ],
            funFactsEn: [
                "Each tiger's stripe pattern is completely unique.",
                "Cuong Do loves swimming and frequently relaxes in cool water pools.",
                "Tigers have retractable claws up to 10 cm in length."
            ]
        },
        {
            id: 4,
            code: "ANI-004",
            nameVi: "Hổ Bengal Lâm Nhi",
            nameEn: "Bengal Tiger Lam Nhi",
            scientificName: "Panthera tigris tigris",
            species: "Hổ Bengal",
            speciesId: 2,
            zoneId: "zone-b",
            zoneCode: "B",
            zoneName: "Khu Động Vật Ăn Thịt Hoàng Gia",
            mapX: 510,
            mapY: 170,
            imageUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=800&q=80",
            origin: "Trung tâm cứu hộ động vật hoang dã Cát Tiên",
            diet: "Thịt bò, ức gà hữu cơ",
            lifespan: "15 - 18 năm",
            weight: "160 kg",
            iucnStatus: "EN - Nguy cấp",
            healthStatus: "Khỏe mạnh • Định kỳ kiểm tra móng",
            breedingStatus: "Đang trong mùa ghép đôi sinh sản",
            funFactsVi: [
                "Lâm Nhi rất tinh nghịch, thích leo lên các mỏm đá cao để quan sát xung quanh.",
                "Tiếng gầm trầm ấm của hổ cái là tín hiệu liên lạc lãnh thổ đặc biệt.",
                "Chế độ ăn của hổ tại vườn thú được bổ sung khoáng chất và canxi định kỳ."
            ],
            funFactsEn: [
                "Lam Nhi loves perching atop rock formations to survey her habitat.",
                "Female tigers communicate through deep, resonant chuffs and roars.",
                "Her diet is supplemented with essential vitamins and calcium."
            ]
        },
        {
            id: 5,
            code: "ANI-005",
            nameVi: "Báo hoa mai Bagheera",
            nameEn: "Leopard Bagheera",
            scientificName: "Panthera pardus",
            species: "Báo hoa mai",
            speciesId: 1005,
            zoneId: "zone-b",
            zoneCode: "B",
            zoneName: "Khu Động Vật Ăn Thịt Hoàng Gia",
            mapX: 535,
            mapY: 195,
            imageUrl: "https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=800&q=80",
            origin: "Khu bảo tồn Kruger, Nam Phi",
            diet: "Thịt dê, thịt gia cầm (Ăn thịt)",
            lifespan: "12 - 17 năm",
            weight: "75 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Nhanh nhẹn, phản xạ tuyệt vời",
            breedingStatus: "Độc thân trưởng thành",
            funFactsVi: [
                "Báo hoa mai là bậc thầy leo trèo, có thể tha con mồi nặng gấp đôi trọng lượng lên cành cây cao.",
                "Hoa văn đốm hình hoa mai giúp chúng ngụy trang gần như vô hình dưới bóng râm.",
                "Khả năng nhảy cao tới 3 mét và phóng xa tới 6 mét."
            ],
            funFactsEn: [
                "Leopards can haul prey twice their body weight into tree branches.",
                "Their rosette pattern provides consummate natural camouflage.",
                "They can leap up to 3 meters vertically and 6 meters horizontally."
            ]
        },
        {
            id: 6,
            code: "ANI-006",
            nameVi: "Báo tuyết Arya",
            nameEn: "Snow Leopard Arya",
            scientificName: "Panthera uncia",
            species: "Báo tuyết",
            speciesId: 1006,
            zoneId: "zone-b",
            zoneCode: "B",
            zoneName: "Khu Động Vật Ăn Thịt Hoàng Gia",
            mapX: 540,
            mapY: 180,
            imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80",
            origin: "Dãy Himalaya, Nepal",
            diet: "Thịt nạc, dê núi, thỏ tuyết",
            lifespan: "15 - 18 năm",
            weight: "45 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Khỏe mạnh • Chuồng duy trì nhiệt độ mát",
            breedingStatus: "Chương trình nhân giống bảo tồn",
            funFactsVi: [
                "Báo tuyết được mệnh danh là 'Bóng ma dãy núi' bởi khả năng ẩn mình kỳ diệu giữa các vách tuyết trắng.",
                "Chiếc đuôi dài và dày xù giúp giữ thăng bằng trên vách đá và giữ ấm mũi khi cuộn mình ngủ.",
                "Bàn chân rộng có lớp đệm lông dày hoạt động như chiếc giày tuyết tự nhiên."
            ],
            funFactsEn: [
                "Known as the 'Ghost of the Mountains' for their incredible camouflage.",
                "Their thick tail aids balance and wraps around the face for warmth.",
                "Wide paws covered in fur act as natural snowshoes."
            ]
        },

        // --- Động vật có vú lớn (Megaherbivores) ---
        {
            id: 7,
            code: "ANI-007",
            nameVi: "Voi Châu Á Bác Tai To",
            nameEn: "Asian Elephant Big Ears",
            scientificName: "Elephas maximus",
            species: "Voi Châu Á",
            speciesId: 3,
            zoneId: "zone-c",
            zoneCode: "C",
            zoneName: "Thảo Nguyên Châu Phi (Ăn Cỏ)",
            mapX: 470,
            mapY: 390,
            imageUrl: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80",
            origin: "Buôn Đôn, Đắk Lắk",
            diet: "Cỏ voi, mía, chuối cây, dưa hấu",
            lifespan: "60 - 70 năm",
            weight: "3.800 kg",
            iucnStatus: "EN - Nguy cấp",
            healthStatus: "Ổn định • Khám nha khoa định kỳ",
            breedingStatus: "Cá thể đực đầu đàn",
            funFactsVi: [
                "Vòi voi chứa hơn 40.000 bó cơ, vừa có thể nhặt một hạt đậu nhỏ vừa nhấc bổng thân cây gỗ lớn.",
                "Bác Tai To rất thân thiện và có trí nhớ phi thường nhận biết giọng nói người chăm sóc.",
                "Mỗi ngày một chú voi trưởng thành có thể tiêu thụ từ 150 - 200kg thức ăn thô."
            ],
            funFactsEn: [
                "An elephant's trunk contains over 40,000 muscles.",
                "Big Ears possesses remarkable memory and recognizes keeper voices.",
                "Adult elephants consume up to 200 kg of forage daily."
            ]
        },
        {
            id: 8,
            code: "ANI-008",
            nameVi: "Voi Châu Á Bé Na",
            nameEn: "Asian Elephant Little Na",
            scientificName: "Elephas maximus",
            species: "Voi Châu Á",
            speciesId: 3,
            zoneId: "zone-c",
            zoneCode: "C",
            zoneName: "Thảo Nguyên Châu Phi (Ăn Cỏ)",
            mapX: 480,
            mapY: 400,
            imageUrl: "https://images.unsplash.com/photo-1581852017103-68ac65504071?auto=format&fit=crop&w=800&q=80",
            origin: "Sở thú ZooGuide (sinh sản tự nhiên)",
            diet: "Sữa dinh dưỡng, chuối chín, cỏ non",
            lifespan: "60 - 70 năm",
            weight: "450 kg",
            iucnStatus: "EN - Nguy cấp",
            healthStatus: "Rất tốt • Tăng trưởng đều",
            breedingStatus: "Cá thể con non sinh năm 2024",
            funFactsVi: [
                "Bé Na là cá thể voi con đầu tiên được sinh ra tại vườn thú trong 10 năm qua.",
                "Voi con sơ sinh đã nặng khoảng 90 - 100kg và có thể tự đứng sau 20 phút.",
                "Bé Na thích tắm bùn cùng mẹ để bảo vệ da khỏi côn trùng và ánh nắng mặt trời."
            ],
            funFactsEn: [
                "Little Na is the first elephant calf born at the zoo in a decade.",
                "Newborn calves weigh around 100 kg and can stand within 20 minutes.",
                "Mud baths protect young elephants from insects and sunlight."
            ]
        },
        {
            id: 9,
            code: "ANI-009",
            nameVi: "Voi châu Phi Jumbo",
            nameEn: "African Bush Elephant Jumbo",
            scientificName: "Loxodonta africana",
            species: "Voi châu Phi",
            speciesId: 1007,
            zoneId: "zone-c",
            zoneCode: "C",
            zoneName: "Thảo Nguyên Châu Phi (Ăn Cỏ)",
            mapX: 490,
            mapY: 420,
            imageUrl: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80",
            origin: "Vườn quốc gia Chobe, Botswana",
            diet: "Cỏ khô, cành cây keo, rễ cây",
            lifespan: "60 - 70 năm",
            weight: "5.200 kg",
            iucnStatus: "EN - Nguy cấp",
            healthStatus: "Khỏe mạnh, sung mãn",
            breedingStatus: "Đang thích nghi môi trường bảo tồn",
            funFactsVi: [
                "Voi châu Phi có đôi tai lớn hình dáng gần như y hệt lục địa châu Phi, giúp làm mát cơ thể hiệu quả.",
                "Động vật trên cạn nặng nhất hành tinh, có cả ngà ở cá thể đực lẫn cá thể cái.",
                "Giao tiếp qua sóng hạ âm truyền qua mặt đất tới khoảng cách hơn 10km."
            ],
            funFactsEn: [
                "African elephant ears are shaped like the African continent.",
                "Both males and females possess prominent ivory tusks.",
                "They communicate via infrasound that travels kilometers through the soil."
            ]
        },
        {
            id: 10,
            code: "ANI-010",
            nameVi: "Hươu cao cổ Twiga",
            nameEn: "Giraffe Twiga",
            scientificName: "Giraffa camelopardalis",
            species: "Hươu cao cổ",
            speciesId: 1008,
            zoneId: "zone-c",
            zoneCode: "C",
            zoneName: "Thảo Nguyên Châu Phi (Ăn Cỏ)",
            mapX: 500,
            mapY: 430,
            imageUrl: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80",
            origin: "Nam Phi, thảo nguyên Kalahari",
            diet: "Lá cây keo gai, chồi non, cỏ ngọt",
            lifespan: "25 - 28 năm",
            weight: "1.150 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Tốt • Vận động tự do tại đồng cỏ",
            breedingStatus: "Đực đầu đàn",
            funFactsVi: [
                "Twiga cao 5,2 mét, sở hữu chiếc lưỡi dài gần 50cm màu đen tím tránh cháy nắng.",
                "Mặc dù cổ rất dài, số đốt sống cổ của hươu chỉ là 7 - hoàn toàn bằng với con người.",
                "Trái tim nặng hơn 11kg với áp lực cực lớn bơm máu lên não bộ."
            ],
            funFactsEn: [
                "Twiga stands 5.2 meters tall with a prehensile 50 cm tongue.",
                "Giraffes have only 7 cervical vertebrae, the same as humans.",
                "Their massive heart weighs 11 kg to pump blood up their neck."
            ]
        },
        {
            id: 11,
            code: "ANI-011",
            nameVi: "Hươu cao cổ Zara",
            nameEn: "Giraffe Zara",
            scientificName: "Giraffa camelopardalis",
            species: "Hươu cao cổ",
            speciesId: 1008,
            zoneId: "zone-c",
            zoneCode: "C",
            zoneName: "Thảo Nguyên Châu Phi (Ăn Cỏ)",
            mapX: 510,
            mapY: 440,
            imageUrl: "https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=800&q=80",
            origin: "Kenya, Đông Phi",
            diet: "Lá keo gai, củ quả tươi",
            lifespan: "25 năm",
            weight: "850 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Khỏe mạnh • Theo dõi thai kỳ",
            breedingStatus: "Đang mang thai tuần thứ 40",
            funFactsVi: [
                "Hươu cao cổ chỉ cần ngủ khoảng 30 phút đến 2 tiếng mỗi ngày trong tư thế đứng.",
                "Mỗi bước sải chân của Zara có thể dài tới 4,5 mét khi chạy trên đồng cỏ.",
                "Họa tiết đốm trên thân Zara sẫm màu dần theo độ tuổi."
            ],
            funFactsEn: [
                "Giraffes sleep only 30 minutes to 2 hours per day, often while standing.",
                "A single stride can cover 4.5 meters at full gallop.",
                "Coat patches darken as the giraffe ages."
            ]
        },
        {
            id: 12,
            code: "ANI-012",
            nameVi: "Tê giác trắng Tanker",
            nameEn: "White Rhino Tanker",
            scientificName: "Ceratotherium simum",
            species: "Tê giác trắng",
            speciesId: 1009,
            zoneId: "zone-c",
            zoneCode: "C",
            zoneName: "Thảo Nguyên Châu Phi (Ăn Cỏ)",
            mapX: 460,
            mapY: 450,
            imageUrl: "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=800&q=80",
            origin: "Vườn quốc gia Hluhluwe-iMfolozi, Nam Phi",
            diet: "Cỏ đồng thảo nguyên, rơm khô",
            lifespan: "40 - 50 năm",
            weight: "2.300 kg",
            iucnStatus: "NT - Sắp bị đe dọa",
            healthStatus: "Khỏe mạnh, sừng nguyên vẹn",
            breedingStatus: "Chương trình bảo vệ nghiêm ngặt",
            funFactsVi: [
                "Tê giác trắng không thực sự màu trắng; tên gọi bắt nguồn từ chữ 'wijd' tiếng Hà Lan nghĩa là chiếc miệng rộng.",
                "Sừng của tê giác cấu tạo hoàn toàn từ chất keratin giống như tóc và móng tay người.",
                "Khứu giác và thính giác cực nhạy bù đắp cho thị lực tương đối kém."
            ],
            funFactsEn: [
                "The name comes from Afrikaans 'wyd' (wide), describing its broad grazing lip.",
                "Rhino horns are composed purely of keratin, like human fingernails.",
                "Exceptional hearing and smell compensate for poor eyesight."
            ]
        },
        {
            id: 13,
            code: "ANI-013",
            nameVi: "Hà mã Gloria",
            nameEn: "Hippopotamus Gloria",
            scientificName: "Hippopotamus amphibius",
            species: "Hà mã",
            speciesId: 1010,
            zoneId: "zone-d",
            zoneCode: "D",
            zoneName: "Thủy Cung & Bò Sát Khổng Lồ",
            mapX: 250,
            mapY: 460,
            imageUrl: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=800&q=80",
            origin: "Lưu vực sông Zambezi, Zambia",
            diet: "Cỏ mềm, rau củ quả ngâm nước",
            lifespan: "40 - 50 năm",
            weight: "1.500 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Tốt • Hồ tắm duy trì nước sạch",
            breedingStatus: "Cá thể cái trưởng thành",
            funFactsVi: [
                "Hà mã tiết ra chất lỏng màu đỏ hồng hoạt động như kem chống nắng và chất sát trùng tự nhiên.",
                "Mặc dù thân hình đồ sộ, hà mã có thể chạy nhanh tới 30 km/h trên đất liền.",
                "Hà mã không thực sự bơi mà chúng đi bộ và đẩy nhẹ mình dọc đáy sông hồ."
            ],
            funFactsEn: [
                "Hippos secrete a reddish 'blood sweat' that acts as sunscreen and moisturizer.",
                "Despite their bulk, hippos can run up to 30 km/h on land.",
                "They don't swim, but rather walk gracefully along river bottoms."
            ]
        },

        // --- Linh trưởng (Primates) ---
        {
            id: 14,
            code: "ANI-014",
            nameVi: "Tinh tinh Caesar",
            nameEn: "Chimpanzee Caesar",
            scientificName: "Pan troglodytes",
            species: "Tinh tinh",
            speciesId: 1011,
            zoneId: "zone-a",
            zoneCode: "A",
            zoneName: "Khu Linh Trưởng & Rừng Mưa",
            mapX: 210,
            mapY: 170,
            imageUrl: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=800&q=80",
            origin: "Vườn quốc gia Gombe Stream, Tanzania",
            diet: "Trái cây, hạt, lá non, mật ong",
            lifespan: "40 - 50 năm",
            weight: "55 kg",
            iucnStatus: "EN - Nguy cấp",
            healthStatus: "Thông minh, hoạt bát",
            breedingStatus: "Con đực đầu đàn nhóm xã hội",
            funFactsVi: [
                "Tinh tinh chia sẻ tới 98,7% bộ mã gen di truyền DNA với con người.",
                "Caesar có khả năng giải đố hóc búa và dùng cành cây khéo léo để lấy mật ong.",
                "Sống theo bầy đàn phức tạp với ngôn ngữ cử chỉ và tiếng kêu đa dạng."
            ],
            funFactsEn: [
                "Chimpanzees share roughly 98.7% of their genetic DNA with humans.",
                "Caesar uses tools to solve enrichment puzzles and extract honey.",
                "They maintain sophisticated social structures and distinct vocal dialects."
            ]
        },
        {
            id: 15,
            code: "ANI-015",
            nameVi: "Khỉ đột Bongo",
            nameEn: "Western Gorilla Bongo",
            scientificName: "Gorilla gorilla",
            species: "Khỉ đột",
            speciesId: 1012,
            zoneId: "zone-a",
            zoneCode: "A",
            zoneName: "Khu Linh Trưởng & Rừng Mưa",
            mapX: 230,
            mapY: 190,
            imageUrl: "https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=800&q=80",
            origin: "Cộng hòa Congo, Tây Phi",
            diet: "Thân cây mọng nước, lá tre, trái rừng",
            lifespan: "35 - 40 năm",
            weight: "185 kg",
            iucnStatus: "CR - Cực kỳ nguy cấp",
            healthStatus: "Khỏe mạnh, điềm tĩnh",
            breedingStatus: "Lưng bạc (Silverback) bảo vệ đàn",
            funFactsVi: [
                "Bongo là con đực lưng bạc dũng mãnh, luôn hiền hòa và bảo bọc đàn con non.",
                "Khỉ đột là động vật ăn thực vật gần như hoàn toàn mặc dù sở hữu cơ bắp phi thường.",
                "Mỗi cá thể có hình dáng nếp nhăn mũi độc nhất giống như vân tay người."
            ],
            funFactsEn: [
                "Bongo is a gentle giant silverback leading his family group.",
                "Gorillas are predominantly herbivorous despite incredible muscular strength.",
                "Every gorilla has a unique nose print used for individual identification."
            ]
        },
        {
            id: 16,
            code: "ANI-016",
            nameVi: "Đười ươi Bornean Rocky",
            nameEn: "Bornean Orangutan Rocky",
            scientificName: "Pongo pygmaeus",
            species: "Đười ươi Bornean",
            speciesId: 1013,
            zoneId: "zone-a",
            zoneCode: "A",
            zoneName: "Khu Linh Trưởng & Rừng Mưa",
            mapX: 240,
            mapY: 160,
            imageUrl: "https://images.unsplash.com/photo-1579888944880-d9834124570c?auto=format&fit=crop&w=800&q=80",
            origin: "Khu bảo tồn hoang dã Tanjung Puting, Kalimantan",
            diet: "Quả sầu riêng dại, sung rừng, hoa phong lan",
            lifespan: "35 - 45 năm",
            weight: "80 kg",
            iucnStatus: "CR - Cực kỳ nguy cấp",
            healthStatus: "Rất tốt • Thích đu dây vận động",
            breedingStatus: "Đang tham gia dự án bảo tồn gen",
            funFactsVi: [
                "Sải tay của Rocky dài tới hơn 2 mét, dài hơn nhiều so với chiều cao cơ thể.",
                "Đười ươi được mệnh danh là 'Người của rừng' (tiếng Mã Lai: Orang-hutan).",
                "Mỗi buổi chiều Rocky đều tự đan cho mình một chiếc tổ bằng lá cây để ngủ."
            ],
            funFactsEn: [
                "Rocky's arm span exceeds 2 meters, far longer than his body height.",
                "Orangutan means 'person of the forest' in Malay.",
                "They build fresh tree nests every evening from branches and leaves."
            ]
        },

        // --- Họ Gấu (Ursidae) ---
        {
            id: 17,
            code: "ANI-017",
            nameVi: "Gấu Bắc Cực Nanook",
            nameEn: "Polar Bear Nanook",
            scientificName: "Ursus maritimus",
            species: "Gấu Bắc Cực",
            speciesId: 1014,
            zoneId: "zone-b",
            zoneCode: "B",
            zoneName: "Khu Động Vật Ăn Thịt Hoàng Gia",
            mapX: 560,
            mapY: 150,
            imageUrl: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=800&q=80",
            origin: "Vùng Svalbard, Na Uy",
            diet: "Cá hồi tươi, mỡ cá biển, thịt bò lạnh",
            lifespan: "25 - 30 năm",
            weight: "480 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Khỏe mạnh • Bể bơi lạnh kiểm soát",
            breedingStatus: "Cá thể đực trưởng thành",
            funFactsVi: [
                "Lông của gấu Bắc Cực thực chất không có màu trắng mà rỗng và trong suốt, khúc xạ ánh sáng tạo cảm giác trắng muốt.",
                "Dưới lớp lông là làn da màu đen tuyền giúp hấp thu tối đa nhiệt lượng mặt trời.",
                "Nanook có thể bơi liên tục hàng chục dặm trên biển lạnh mà không cần nghỉ."
            ],
            funFactsEn: [
                "Polar bear fur is translucent and hollow, reflecting light to appear white.",
                "Beneath their fur lies jet-black skin that absorbs solar heat.",
                "They can swim continuously for dozens of miles in freezing waters."
            ]
        },
        {
            id: 18,
            code: "ANI-018",
            nameVi: "Gấu trúc Bảo Bảo",
            nameEn: "Giant Panda Bao Bao",
            scientificName: "Ailuropoda melanoleuca",
            species: "Gấu Trúc Khổng Lồ",
            speciesId: 5,
            zoneId: "zone-a",
            zoneCode: "A",
            zoneName: "Khu Linh Trưởng & Rừng Mưa",
            mapX: 200,
            mapY: 200,
            imageUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef6?auto=format&fit=crop&w=800&q=80",
            origin: "Trung tâm bảo tồn gấu trúc Thành Đô, Tứ Xuyên",
            diet: "Tre nứa hữu cơ, măng tươi, bánh ngũ cốc",
            lifespan: "20 - 25 năm",
            weight: "110 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Rất tốt • Thích ăn măng và leo cây",
            breedingStatus: "Cá thể đực ghép đôi",
            funFactsVi: [
                "Gấu trúc dành tới 12 - 14 tiếng mỗi ngày chỉ để nhai tre và tiêu hóa chất xơ.",
                "Chúng có một chiếc 'ngón tay cái giả' đặc biệt thực chất là xương cổ tay biến đổi để cầm cành tre.",
                "Bảo Bảo là đại sứ hữu nghị được yêu mến nhất tại vườn thú."
            ],
            funFactsEn: [
                "Pandas spend 12 to 14 hours each day munching on bamboo shoots.",
                "They possess a pseudo-thumb formed by an enlarged wrist bone.",
                "Bao Bao is a beloved ambassador for global conservation."
            ]
        },
        {
            id: 19,
            code: "ANI-019",
            nameVi: "Gấu trúc Mai Mai",
            nameEn: "Giant Panda Mai Mai",
            scientificName: "Ailuropoda melanoleuca",
            species: "Gấu Trúc Khổng Lồ",
            speciesId: 5,
            zoneId: "zone-a",
            zoneCode: "A",
            zoneName: "Khu Linh Trưởng & Rừng Mưa",
            mapX: 215,
            mapY: 210,
            imageUrl: "https://images.unsplash.com/photo-1527118732049-c88155f2107c?auto=format&fit=crop&w=800&q=80",
            origin: "Khu bảo tồn Ngọa Long, Tứ Xuyên",
            diet: "Măng non, lá trúc, táo ngọt",
            lifespan: "20 - 25 năm",
            weight: "95 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Khỏe mạnh, vui tươi",
            breedingStatus: "Cá thể cái trong mùa sinh sản",
            funFactsVi: [
                "Mai Mai rất thích lăn lộn trên các thảm cỏ và nhào lộn vào buổi sáng.",
                "Gấu trúc con sơ sinh chỉ nhỏ bằng kích thước của một thỏi bơ, nặng khoảng 100g.",
                "Chế độ dinh dưỡng của Mai Mai được các chuyên gia theo dõi bằng máy quét vi lượng."
            ],
            funFactsEn: [
                "Mai Mai loves somersaulting on grassy slopes during early mornings.",
                "Newborn panda cubs are tiny, weighing barely 100 grams.",
                "Her diet is meticulously monitored by international wildlife nutritionists."
            ]
        },
        {
            id: 20,
            code: "ANI-020",
            nameVi: "Gấu nâu Misha",
            nameEn: "Eurasian Brown Bear Misha",
            scientificName: "Ursus arctos",
            species: "Gấu nâu",
            speciesId: 1015,
            zoneId: "zone-b",
            zoneCode: "B",
            zoneName: "Khu Động Vật Ăn Thịt Hoàng Gia",
            mapX: 570,
            mapY: 175,
            imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80",
            origin: "Vùng rừng Taiga Siberia",
            diet: "Cá hồi, mật ong, quả mọng dại, rễ cây",
            lifespan: "25 - 35 năm",
            weight: "350 kg",
            iucnStatus: "LC - Ít quan tâm",
            healthStatus: "Khỏe mạnh, thể lực dồi dào",
            breedingStatus: "Trưởng thành độc lập",
            funFactsVi: [
                "Gấu nâu có khứu giác tinh nhạy gấp 7 lần chó săn giống tốt nhất.",
                "Misha có khối cơ bắp vai cực lớn giúp đào bới đất đá và bắt cá vượt thác.",
                "Vào mùa thu, gấu có thể tích lũy thêm tới 30% trọng lượng cơ thể để chuẩn bị ngủ đông."
            ],
            funFactsEn: [
                "Brown bears have a sense of smell 7 times keener than a bloodhound's.",
                "Misha has a pronounced shoulder hump powering strong digging forelimbs.",
                "They gain up to 30% body weight in autumn prior to winter torpor."
            ]
        },

        // --- Chim (Aves) ---
        {
            id: 21,
            code: "ANI-021",
            nameVi: "Đại bàng Phong Thần",
            nameEn: "Eastern Imperial Eagle",
            scientificName: "Aquila heliaca",
            species: "Đại bàng Hoàng Gia",
            speciesId: 4,
            zoneId: "zone-e",
            zoneCode: "E",
            zoneName: "Vương Quốc Chim Nhiệt Đới",
            mapX: 380,
            mapY: 270,
            imageUrl: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?auto=format&fit=crop&w=800&q=80",
            origin: "Dãy núi Altai, Trung Á",
            diet: "Thỏ hoang, cá tươi, chim nhỏ",
            lifespan: "25 - 30 năm",
            weight: "3,8 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Thị lực hoàn hảo, sải cánh 2,1m",
            breedingStatus: "Cặp đôi sinh sản bền vững",
            funFactsVi: [
                "Thị lực của đại bàng hoàng gia tinh tường gấp 8 lần con người, thấy con mồi từ cự ly 3km.",
                "Tốc độ bổ nhào lao xuống con mồi có thể vượt qua 160 km/h.",
                "Biểu tượng của quyền uy và sự tự do dũng mãnh qua nhiều nền văn minh."
            ],
            funFactsEn: [
                "Imperial eagle eyesight is 8 times sharper than humans, spotting prey 3 km away.",
                "Diving speeds can exceed 160 km/h during hunting swoops.",
                "Regarded as a historic symbol of power and majestic freedom."
            ]
        },
        {
            id: 22,
            code: "ANI-022",
            nameVi: "Đại bàng Freedom",
            nameEn: "Bald Eagle Freedom",
            scientificName: "Haliaeetus leucocephalus",
            species: "Đại bàng đầu trắng",
            speciesId: 1016,
            zoneId: "zone-e",
            zoneCode: "E",
            zoneName: "Vương Quốc Chim Nhiệt Đới",
            mapX: 390,
            mapY: 260,
            imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80",
            origin: "Alaska, Hoa Kỳ",
            diet: "Cá hồi, chim nước",
            lifespan: "20 - 30 năm",
            weight: "4,5 kg",
            iucnStatus: "LC - Ít quan tâm",
            healthStatus: "Rất tốt • Bay lượn tự do trong lồng vòm",
            breedingStatus: "Đang xây tổ ghép đôi",
            funFactsVi: [
                "Đại bàng đầu trắng xây những chiếc tổ trên cây khổng lồ có thể nặng tới hơn 1 tấn.",
                "Bộ lông đầu trắng muốt chỉ xuất hiện khi đại bàng đạt từ 4 đến 5 năm tuổi.",
                "Móng vuốt cong sắc nhọn có lực siết mạnh gấp 10 lần lực bóp bàn tay người."
            ],
            funFactsEn: [
                "Bald eagle nests can weigh over a ton and measure 3 meters across.",
                "Iconic white head plumage develops fully only at 4 to 5 years of age.",
                "Talons possess grip strength 10 times stronger than a human hand."
            ]
        },
        {
            id: 23,
            code: "ANI-023",
            nameVi: "Hồng hạc Rosa",
            nameEn: "Greater Flamingo Rosa",
            scientificName: "Phoenicopterus roseus",
            species: "Hồng hạc",
            speciesId: 1017,
            zoneId: "zone-e",
            zoneCode: "E",
            zoneName: "Vương Quốc Chim Nhiệt Đới",
            mapX: 370,
            mapY: 280,
            imageUrl: "https://images.unsplash.com/photo-1539418561314-565804e349c0?auto=format&fit=crop&w=800&q=80",
            origin: "Vùng đầm lầy Camargue, miền Nam nước Pháp",
            diet: "Tảo biển đỏ, ấu trùng giáp xác giàu carotenoid",
            lifespan: "30 - 40 năm",
            weight: "3,2 kg",
            iucnStatus: "LC - Ít quan tâm",
            healthStatus: "Rất tốt • Đàn 18 con hòa đồng",
            breedingStatus: "Mùa làm tổ bùn hình nón",
            funFactsVi: [
                "Sắc tố carotenoid trong thức ăn tôm và tảo là nguyên nhân tạo nên sắc lông hồng đỏ rực rỡ.",
                "Khả năng đứng co một chân trong nhiều giờ liên tục giúp tiết kiệm năng lượng và nhiệt lượng thân thể.",
                "Mỏ của hồng hạc chúc ngược xuống nước để lọc bùn giữ lại sinh vật dinh dưỡng."
            ],
            funFactsEn: [
                "Vibrant pink plumage comes from beta-carotene pigments in their diet.",
                "Standing on one leg helps thermoregulate and conserve bodily energy.",
                "They feed with their beaks upside down to filter nutritious organisms."
            ]
        },
        {
            id: 24,
            code: "ANI-024",
            nameVi: "Chim cánh cụt Pingu",
            nameEn: "Emperor Penguin Pingu",
            scientificName: "Aptenodytes forsteri",
            species: "Chim cánh cụt Hoàng đế",
            speciesId: 1018,
            zoneId: "zone-d",
            zoneCode: "D",
            zoneName: "Thủy Cung & Bò Sát Khổng Lồ",
            mapX: 220,
            mapY: 420,
            imageUrl: "https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&w=800&q=80",
            origin: "Bán đảo Nam Cực",
            diet: "Cá băng, mực nang, nhuyễn thể krill",
            lifespan: "15 - 20 năm",
            weight: "32 kg",
            iucnStatus: "NT - Sắp bị đe dọa",
            healthStatus: "Khỏe mạnh • Phòng lạnh duy trì -5°C",
            breedingStatus: "Mùa ấp trứng trên bàn chân",
            funFactsVi: [
                "Chim cánh cụt Hoàng đế là loài cánh cụt lớn nhất, có thể lặn sâu tới hơn 500 mét dưới biển băng.",
                "Con bố ấp quả trứng duy nhất trên mu bàn chân ấm áp dưới lớp da bụng suốt mùa đông lạnh giá -40°C.",
                "Lớp lông vũ dày đặc với mật độ cao nhất trong tất cả các loài chim giữ ấm tuyệt đối."
            ],
            funFactsEn: [
                "Emperor penguins can dive over 500 meters deep beneath ocean ice.",
                "Fathers incubate a single egg on their feet throughout harsh Antarctic winters.",
                "Dense feathers provide the highest feather density of any bird on Earth."
            ]
        },

        // --- Bò sát (Reptilia) ---
        {
            id: 25,
            code: "ANI-025",
            nameVi: "Cá sấu Sobek",
            nameEn: "Saltwater Crocodile Sobek",
            scientificName: "Crocodylus porosus",
            species: "Cá sấu nước mặn",
            speciesId: 1019,
            zoneId: "zone-d",
            zoneCode: "D",
            zoneName: "Thủy Cung & Bò Sát Khổng Lồ",
            mapX: 240,
            mapY: 440,
            imageUrl: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80",
            origin: "Miền Bắc nước Úc",
            diet: "Cá lớn, thịt heo, thịt gà tươi",
            lifespan: "65 - 75 năm",
            weight: "650 kg",
            iucnStatus: "LC - Ít quan tâm",
            healthStatus: "Khỏe mạnh • Lực cắn đo đạc cực mạnh",
            breedingStatus: "Cá thể đực trưởng thành",
            funFactsVi: [
                "Loài bò sát lớn nhất hành tinh, có lực cắn mạnh nhất thế giới tự nhiên lên tới hơn 16.000 Newton.",
                "Có khả năng định hướng tuyệt vời và bơi vượt hàng trăm dặm trên biển mở.",
                "Hóa thạch sống gần như không biến đổi hình thái từ kỷ nguyên khủng long."
            ],
            funFactsEn: [
                "Largest living reptile on Earth with a record bite force exceeding 16,000 N.",
                "Capable of navigating vast oceanic journeys across island chains.",
                "A true living fossil that survived unchanged since the dinosaur era."
            ]
        },
        {
            id: 26,
            code: "ANI-026",
            nameVi: "Rùa biển Shelly",
            nameEn: "Green Sea Turtle Shelly",
            scientificName: "Chelonia mydas",
            species: "Rùa biển xanh",
            speciesId: 1020,
            zoneId: "zone-d",
            zoneCode: "D",
            zoneName: "Thủy Cung & Bò Sát Khổng Lồ",
            mapX: 260,
            mapY: 430,
            imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
            origin: "Vườn quốc gia Côn Đảo, Việt Nam",
            diet: "Cỏ biển, rong mơ, sứa biển",
            lifespan: "70 - 80 năm",
            weight: "140 kg",
            iucnStatus: "EN - Nguy cấp",
            healthStatus: "Tốt • Bể kính đại dương 1000m3",
            breedingStatus: "Cá thể cái trưởng thành",
            funFactsVi: [
                "Rùa biển xanh có khả năng định vị từ trường Trái Đất để quay về chính bãi cát nơi mình sinh ra đẻ trứng.",
                "Màu xanh trong tên bắt nguồn từ lớp mỡ dưới mai có màu xanh lá cây do ăn nhiều cỏ biển.",
                "Có thể nín thở dưới nước tới 5 tiếng khi đang nghỉ ngơi dưới đáy biển."
            ],
            funFactsEn: [
                "Green turtles navigate using Earth's geomagnetic field to return to natal beaches.",
                "Their common name stems from green subdermal fat colored by seagrass diet.",
                "They can hold their breath underwater for up to 5 hours while resting."
            ]
        },
        {
            id: 27,
            code: "ANI-027",
            nameVi: "Kỳ đà Komodo Draco",
            nameEn: "Komodo Dragon Draco",
            scientificName: "Varanus komodoensis",
            species: "Kỳ đà Komodo",
            speciesId: 1021,
            zoneId: "zone-d",
            zoneCode: "D",
            zoneName: "Thủy Cung & Bò Sát Khổng Lồ",
            mapX: 270,
            mapY: 450,
            imageUrl: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80",
            origin: "Đảo Komodo, Indonesia",
            diet: "Thịt hươu, dê, gia cầm (Ăn thịt)",
            lifespan: "30 năm",
            weight: "85 kg",
            iucnStatus: "EN - Nguy cấp",
            healthStatus: "Khỏe mạnh, nọc độc kiểm soát an toàn",
            breedingStatus: "Cá thể đực trưởng thành",
            funFactsVi: [
                "Loài thằn lằn lớn nhất thế giới, tuyến nọc độc ở hàm dưới tiết chất ức chế đông máu làm con mồi kiệt sức.",
                "Lưỡi chẻ đôi màu vàng giúp 'nếm' mùi phân tử trong không khí cách xa tới 9km.",
                "Có thể nuốt chửng con mồi bằng 80% trọng lượng cơ thể mình trong một bữa ăn."
            ],
            funFactsEn: [
                "The world's largest lizard species, possessing venom glands preventing blood clotting.",
                "Their yellow forked tongue samples airborne scent particles up to 9 km away.",
                "Can consume meals up to 80% of their own body mass in a single feeding."
            ]
        },

        // --- Lưỡng cư (Amphibia) ---
        {
            id: 28,
            code: "ANI-028",
            nameVi: "Ếch phi tiêu Kiwi",
            nameEn: "Poison Dart Frog Kiwi",
            scientificName: "Dendrobatidae",
            species: "Ếch phi tiêu độc",
            speciesId: 1022,
            zoneId: "zone-a",
            zoneCode: "A",
            zoneName: "Khu Linh Trưởng & Rừng Mưa",
            mapX: 215,
            mapY: 175,
            imageUrl: "https://images.unsplash.com/photo-1563810022204-c36b48baec57?auto=format&fit=crop&w=800&q=80",
            origin: "Rừng mưa nhiệt đới Amazon, Brasil",
            diet: "Ruồi giấm, mối non, rệp cánh",
            lifespan: "10 - 15 năm",
            weight: "15 g",
            iucnStatus: "LC - Ít quan tâm",
            healthStatus: "Khỏe mạnh • Độ ẩm terrarium 85%",
            breedingStatus: "Sinh sản ấu trùng nòng nọc",
            funFactsVi: [
                "Màu da vàng xanh rực rỡ là cơ chế cảnh báo kẻ săn mồi (Aposematism) rằng cơ thể chứa độc tố cực mạnh.",
                "Trong tự nhiên, chất độc alkaloid của loài ếch này được các bộ lạc thổ dân tẩm vào đầu mũi tên săn mồi.",
                "Tại sở thú, do không ăn kiến rừng chứa độc nên chất nhờn trên da Kiwi hoàn toàn lành tính."
            ],
            funFactsEn: [
                "Brilliant skin coloration warns predators of potent batrachotoxin defense.",
                "Indigenous tribes traditionally used their secretions to poison hunting blowdarts.",
                "In captivity, lack of toxic prey insects renders their skin secretions harmless."
            ]
        },
        {
            id: 29,
            code: "ANI-029",
            nameVi: "Kỳ giông Axolotl Lottie",
            nameEn: "Mexican Axolotl Lottie",
            scientificName: "Ambystoma mexicanum",
            species: "Kỳ giông Axolotl",
            speciesId: 1023,
            zoneId: "zone-d",
            zoneCode: "D",
            zoneName: "Thủy Cung & Bò Sát Khổng Lồ",
            mapX: 235,
            mapY: 425,
            imageUrl: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80",
            origin: "Hồ Xochimilco, Mexico",
            diet: "Trùn quế, tôm nhỏ, ấu trùng muỗi",
            lifespan: "10 - 15 năm",
            weight: "200 g",
            iucnStatus: "CR - Cực kỳ nguy cấp",
            healthStatus: "Tuyệt hảo • Nước hồ duy trì 18°C",
            breedingStatus: "Nhân giống bảo tồn thủy sinh",
            funFactsVi: [
                "Kỳ giông Axolotl giữ lại hình thái ấu trùng suốt đời (hiện tượng neoteny) với những chùm mang ngoài xòe rộng như cánh hoa.",
                "Khả năng tái sinh bộ phận phi thường: có thể mọc lại toàn bộ chi bị mất, đuôi, tim và thậm chí một phần não.",
                "Được người Aztec cổ đại tôn kính như hóa thân của vị thần Xolotl biến hình."
            ],
            funFactsEn: [
                "Undergoes neoteny, keeping juvenile external gills throughout its entire lifespan.",
                "Famous for extraordinary regenerative capability across limbs, organs, and spinal cord.",
                "Revered in Aztec mythology as an earthly avatar of god Xolotl."
            ]
        },

        // --- Cá & Động vật biển (Fish & Elasmobranchii) ---
        {
            id: 30,
            code: "ANI-030",
            nameVi: "Cá mập trắng Bruce",
            nameEn: "Great White Shark Bruce",
            scientificName: "Carcharodon carcharias",
            species: "Cá mập trắng lớn",
            speciesId: 1024,
            zoneId: "zone-d",
            zoneCode: "D",
            zoneName: "Thủy Cung & Bò Sát Khổng Lồ",
            mapX: 250,
            mapY: 410,
            imageUrl: "https://images.unsplash.com/photo-1560275619-4662e36fa65c?auto=format&fit=crop&w=800&q=80",
            origin: "Vùng biển Nam Phi, Vịnh Gansbaai",
            diet: "Cá ngừ, hải cẩu nhân tạo, cá thu",
            lifespan: "60 - 70 năm",
            weight: "1.100 kg",
            iucnStatus: "VU - Sắp nguy cấp",
            healthStatus: "Tuyệt vời • Bơi liên tục trong bể lớn",
            breedingStatus: "Đang theo dõi thói quen hành vi",
            funFactsVi: [
                "Cơ quan cảm ứng Ampullae of Lorenzini cho phép Bruce cảm nhận xung điện từ nhịp tim của con mồi trong nước.",
                "Sở hữu hơn 300 chiếc răng cưa sắc nhọn xếp thành nhiều hàng, liên tục mọc mới suốt cuộc đời.",
                "Có thể bơi bứt tốc lên tới 56 km/h khi lao lên khỏi mặt nước săn mồi."
            ],
            funFactsEn: [
                "Ampullae of Lorenzini detect microscopic electromagnetic fields produced by heartbeats.",
                "Possesses over 300 serrated triangular teeth arrayed in continuously replacing rows.",
                "Can reach burst speeds of 56 km/h when breaching during predatory attacks."
            ]
        },
        {
            id: 31,
            code: "ANI-031",
            nameVi: "Cá đuối Ray",
            nameEn: "Giant Oceanic Manta Ray Ray",
            scientificName: "Mobula birostris",
            species: "Cá đuối manta",
            speciesId: 1025,
            zoneId: "zone-d",
            zoneCode: "D",
            zoneName: "Thủy Cung & Bò Sát Khổng Lồ",
            mapX: 245,
            mapY: 435,
            imageUrl: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=800&q=80",
            origin: "Vùng biển rạn san hô Raja Ampat, Indonesia",
            diet: "Sinh vật phù du, giáp xác nhỏ, ấu trùng cá",
            lifespan: "40 - 50 năm",
            weight: "1.400 kg",
            iucnStatus: "EN - Nguy cấp",
            healthStatus: "Khỏe mạnh, bơi lượn tao nhã",
            breedingStatus: "Thích nghi hoàn hảo môi trường bể vòm",
            funFactsVi: [
                "Cá đuối Manta sở hữu tỷ lệ khối lượng não so với cơ thể lớn nhất trong tất cả các loài cá đại dương.",
                "Sải vây của Ray rộng tới hơn 5,5 mét, lướt êm ái như một cánh chim khổng lồ dưới lòng biển.",
                "Không có gai độc ở đuôi như các loài cá đuối gai độc khác, tính tình cực kỳ hiền hòa với thợ lặn."
            ],
            funFactsEn: [
                "Manta rays possess the largest brain-to-body weight ratio among all marine fishes.",
                "Ray's pectoral wingspan spans over 5.5 meters in graceful underwater gliding flight.",
                "Completely harmless to humans lacking venomous stingers on their tails."
            ]
        }
    ],

    narrations: {
        // 1: Loài Sư tử (Panthera leo)
        1: {
            vi: {
                title: "Sư tử Châu Phi - Chúa Tể Sơn Lâm Thảo Nguyên",
                narrator: "Chuyên gia Sinh học ZooGuide",
                durationSec: 120,
                durationFormatted: "02:00",
                summary: "Khám phá cấu trúc xã hội theo bầy đàn độc đáo và sức mạnh vượt trội của loài sư tử tại thảo nguyên châu Phi.",
                audioSrc: "/assets/audio/tiger_vi.mp3",
                transcript: [
                    { time: 0, text: "Chào mừng quý khách đến với khu bảo tồn loài Sư tử Châu Phi tại sở thú thông minh ZooGuide." },
                    { time: 10, text: "Sư tử là loài mèo lớn duy nhất trên hành tinh có tập tính sinh sống và săn mồi theo đàn gắn kết." },
                    { time: 28, text: "Chiếc bờm rực rỡ và dày rậm của con đực không chỉ để thu hút con cái mà còn bảo vệ phần cổ trước các đòn tấn công." },
                    { time: 48, text: "Tiếng gầm uy lực của sư tử có thể vang xa tới 8 kilômét trên thảo nguyên mênh mông." },
                    { time: 72, text: "Tại ZooGuide, các cá thể sư tử được chăm sóc theo quy chuẩn bán hoang dã với không gian vận động rộng lớn." },
                    { time: 95, text: "Xin quý khách giữ khoảng cách an toàn và thưởng thức khoảnh khắc dũng mãnh của chúa sơn lâm." }
                ]
            },
            en: {
                title: "African Lion - Monarch of the African Savanna",
                narrator: "Wildlife Conservation Specialist",
                durationSec: 110,
                durationFormatted: "01:50",
                summary: "Discover the unique social pride hierarchy and extraordinary power of African lions.",
                audioSrc: "/assets/audio/tiger_en.mp3",
                transcript: [
                    { time: 0, text: "Welcome to the African Lion conservation habitat here at ZooGuide Smart Tour." },
                    { time: 8, text: "Lions stand unique among all feline species for their cooperative, pride-based social structure." },
                    { time: 24, text: "The male's imposing dark mane signals vigor and shields his vital neck area during rival confrontations." },
                    { time: 42, text: "A mature lion's thunderous roar can echo across eight full kilometers of open savanna." },
                    { time: 65, text: "Here at ZooGuide, our pride thrives within expansive natural enclosures designed for enrichment." },
                    { time: 88, text: "Thank you for observing these magnificent apex predators with admiration and respect." }
                ]
            }
        },
        // 2: Loài Hổ (Panthera tigris)
        2: {
            vi: {
                title: "Hổ Bengal Hoàng Gia - Mãnh Thú Rừng Nhiệt Đới",
                narrator: "Chuyên gia Sinh học ZooGuide",
                durationSec: 120,
                durationFormatted: "02:00",
                summary: "Khám phá cuộc sống bí ẩn của loài hổ Bengal hùng vĩ tại khu bảo tồn hoang dã tự nhiên.",
                audioSrc: "/assets/audio/tiger_vi.mp3",
                transcript: [
                    { time: 0, text: "Chào mừng quý khách đến với phân khu Hổ Hoàng Gia của sở thú thông minh ZooGuide." },
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
                audioSrc: "/assets/audio/tiger_en.mp3",
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
        // 1008: Loài Hươu cao cổ (Giraffa camelopardalis)
        1008: {
            vi: {
                title: "Hươu Cao Cổ Nam Phi - Những Người Khổng Lồ Hiền Hòa",
                narrator: "Hướng dẫn viên Thảo Nguyên Safari",
                durationSec: 110,
                durationFormatted: "01:50",
                summary: "Tìm hiểu loài động vật trên cạn cao nhất hành tinh với chiếc cổ dài và bước đi tao nhã.",
                audioSrc: "/assets/audio/giraffe_vi.mp3",
                transcript: [
                    { time: 0, text: "Chào mừng quý khách đến với phân khu Hươu Cao Cổ tại ZooGuide." },
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
                audioSrc: "/assets/audio/giraffe_en.mp3",
                transcript: [
                    { time: 0, text: "Welcome to the African Savanna biome of ZooGuide." },
                    { time: 10, text: "Giraffes stand as the tallest land mammals on Earth, reaching heights of up to 5.5 meters." },
                    { time: 30, text: "Despite their towering necks, they have only seven neck vertebrae — the exact same number as humans!" },
                    { time: 52, text: "Their prehensile tongue stretches nearly 50 centimeters, allowing them to pluck tender leaves from thorny acacia trees." },
                    { time: 78, text: "Enjoy the serene grace of our giraffe herd as they browse comfortably in their spacious savanna habitat." }
                ]
            }
        },
        // 1020: Loài Rùa biển xanh (Chelonia mydas)
        1020: {
            vi: {
                title: "Rùa Biển Xanh - Sứ Giả Đại Dương Nhiệt Đới",
                narrator: "Nhà Sinh học Hải dương",
                durationSec: 100,
                durationFormatted: "01:40",
                summary: "Hành trình bơi vượt vạn dặm đại dương và vai trò duy trì thảm cỏ biển nhiệt đới của loài rùa xanh quý hiếm.",
                audioSrc: "/assets/audio/generic_vi.mp3",
                transcript: [
                    { time: 0, text: "Chào mừng quý khách đến với khu Thủy Cung nuôi dưỡng Rùa Biển Xanh của ZooGuide." },
                    { time: 12, text: "Rùa biển xanh là một trong những loài bò sát cổ xưa nhất hành tinh, đã bơi qua các đại dương suốt hàng triệu năm." },
                    { time: 32, text: "Tên gọi 'rùa xanh' bắt nguồn từ lớp mỡ màu xanh lục dưới mai do chế độ ăn chủ yếu gồm cỏ biển và tảo xanh." },
                    { time: 55, text: "Loài này có khả năng định vị bằng từ trường trái đất tuyệt diệu để quay về chính bãi biển nơi mình sinh ra sau hàng chục năm." },
                    { time: 80, text: "Hãy cùng ZooGuide nâng cao ý thức giảm thiểu rác thải nhựa để bảo vệ mái nhà đại dương cho các loài rùa biển." }
                ]
            },
            en: {
                title: "Green Sea Turtle - Ancient Navigators of the Tropics",
                narrator: "Marine Biologist",
                durationSec: 95,
                durationFormatted: "01:35",
                summary: "The epic transatlantic migrations and vital ecological role of the endangered Green Sea Turtle.",
                audioSrc: "/assets/audio/generic_en.mp3",
                transcript: [
                    { time: 0, text: "Welcome to the Marine Aquarium exhibit featuring the endangered Green Sea Turtle." },
                    { time: 10, text: "Green turtles are ancient marine reptiles that have inhabited global oceans for over one hundred million years." },
                    { time: 30, text: "Their moniker derives from the distinct greenish hue of their subdermal fat layer, shaped by a herbivorous diet of sea grass." },
                    { time: 52, text: "Remarkably, nesting females use the Earth's magnetic fields to navigate back to the precise beaches where they hatched." },
                    { time: 75, text: "Thank you for joining our campaign to eliminate ocean plastics and protect delicate marine ecosystems." }
                ]
            }
        },
        // 1007: Loài Voi châu Á (Elephas maximus)
        1007: {
            vi: {
                title: "Voi Châu Á - Vị Thần Khổng Lồ Rừng Già",
                narrator: "Chuyên gia Bảo tồn Động vật Hoang dã",
                durationSec: 115,
                durationFormatted: "01:55",
                summary: "Tìm hiểu loài thú ăn cỏ khổng lồ có trí thông minh và tình cảm bầy đàn sâu sắc bậc nhất thế giới.",
                audioSrc: "/assets/audio/generic_vi.mp3",
                transcript: [
                    { time: 0, text: "Quý khách đang có mặt tại khu bảo tồn Voi Châu Á của vườn thú sinh thái ZooGuide." },
                    { time: 12, text: "Voi châu Á là loài động vật có vú trên cạn lớn nhất tại châu lục, đóng vai trò kỹ sư sinh thái tạo lối đi cho muông thú." },
                    { time: 35, text: "Chiếc vòi voi chứa hơn bốn mươi nghìn bó cơ riêng biệt, vừa có thể nhổ bật gốc cây lớn vừa nhặt được một hạt đậu nhỏ." },
                    { time: 60, text: "Loài voi sở hữu trí nhớ phi thường và mối liên kết gia đình mẫu hệ đầy cảm xúc và tình thương." },
                    { time: 85, text: "Tại ZooGuide, các cá thể voi được chăm sóc với hào cát tắm tự nhiên và chế độ dinh dưỡng giàu chất xơ phong phú." }
                ]
            },
            en: {
                title: "Asian Elephant - Gentle Giants of the Rainforest",
                narrator: "Asian Elephant Conservationist",
                durationSec: 110,
                durationFormatted: "01:50",
                summary: "Learn about the immense ecological impact and intricate emotional intelligence of the Asian Elephant.",
                audioSrc: "/assets/audio/generic_en.mp3",
                transcript: [
                    { time: 0, text: "Welcome to the Asian Elephant Conservation Sanctuary at ZooGuide." },
                    { time: 10, text: "The Asian Elephant represents the largest terrestrial mammal across the Asian continent." },
                    { time: 32, text: "An elephant's remarkable trunk contains over forty thousand muscles, combining monumental strength with delicate precision." },
                    { time: 55, text: "They maintain matriarchal family structures characterized by profound empathy, lifelong memories, and vocal communication." },
                    { time: 80, text: "Thank you for supporting sustainable rainforest habitat protection with ZooGuide." }
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
    // 0. HEALTH CHECK
    async checkHealth() {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/health`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Health check error:", err);
            return { status: "Unhealthy", error: err.message };
        }
    },

    // 1. TICKET & SESSION
    async validateTicket(ticketCode) {
        if (!ticketCode || !ticketCode.trim()) {
            return { success: false, message: "Vui lòng nhập mã vé hợp lệ." };
        }

        const normalizedCode = ticketCode.trim().toUpperCase();

        // Live API call
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/tickets/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketCode: normalizedCode })
            });

            if (!res.ok) {
                try {
                    const errorData = await res.json();
                    if (errorData && errorData.message) {
                        return { success: false, message: errorData.message };
                    }
                } catch (e) {
                    // Fallback to throw if JSON parsing fails
                }
                throw new Error("Lỗi kết nối máy chủ");
            }
            
            const data = await res.json();
            
            if (data.valid) {
                const session = {
                    sessionId: data.sessionId || "SES-LIVE",
                    ticketCode: data.ticketCode || normalizedCode,
                    customerName: "Khách hàng",
                    ticketType: "Vé điện tử",
                    validDate: data.validUntil ? data.validUntil.split('T')[0] : new Date().toISOString().split('T')[0],
                    zonesAllowed: ["ALL"],
                    hasAudioGuide: true,
                    activatedAt: new Date().toISOString(),
                    expiresAt: data.validUntil || new Date(Date.now() + 8 * 3600 * 1000).toISOString()
                };
                return {
                    success: true,
                    message: data.message || "Xác thực vé thành công! Phiên tham quan đã được mở khóa.",
                    session: session
                };
            } else {
                return { success: false, message: data.message || "Vé không hợp lệ." };
            }
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

    // 3. GET ANIMALS (with filters) - Always uses frontend MOCK_DB.animals as /api/animals is not connected yet
    async getAnimals(filters = {}) {
        await this._simulateLatency(150);
        let results = [...MOCK_DB.animals];

        if (filters.search) {
            const q = filters.search.toLowerCase().trim();
            results = results.filter(a => 
                (a.nameVi && a.nameVi.toLowerCase().includes(q)) || 
                (a.nameEn && a.nameEn.toLowerCase().includes(q)) || 
                (a.scientificName && a.scientificName.toLowerCase().includes(q)) ||
                (a.species && a.species.toLowerCase().includes(q)) ||
                (a.origin && a.origin.toLowerCase().includes(q))
            );
        }


        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/animals`);
            if (!res.ok) throw new Error("Lỗi kết nối /animals");
            const animalsData = await res.json();
            const rawList = Array.isArray(animalsData) ? animalsData : (animalsData.data || []);

            let results = rawList.map((a) => ({
                id: a.animalId || a.id,
                code: a.code || `ANI-${String(a.animalId || a.id).padStart(3, '0')}`,
                nameVi: a.nameVi || a.name,
                nameEn: a.name || a.nameVi,
                scientificName: a.scientificName || a.speciesName || "Chưa có tên khoa học",
                speciesId: a.speciesId || 1,
                species: a.speciesName || "Chưa phân loại",
                zoneId: a.zoneId || (a.areaId ? `zone-${String.fromCharCode(96 + a.areaId)}` : "zone-a"),
                zoneCode: a.zoneCode || (a.areaId ? String.fromCharCode(64 + a.areaId) : "A"),
                zoneName: a.areaName || "Khu vực chung",
                areaId: a.areaId || 1,
                mapX: 300,
                mapY: 300,
                imageUrl: a.imageUrl || "https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=800&q=80",
                origin: a.origin || "Tự nhiên",
                diet: "Tự nhiên",
                lifespan: "Không rõ",
                weight: "Không rõ",
                iucnStatus: a.conservationStatus || "Ít quan tâm",
                healthStatus: a.healthStatus || "Tốt",
                breedingStatus: "Bình thường",
                funFactsVi: [a.description || "Chưa có thông tin mô tả chi tiết."],
                funFactsEn: [a.description || "No information yet."]
            }));

            if (filters.search) {
                const q = filters.search.toLowerCase().trim();
                results = results.filter(a => 
                    (a.nameVi && a.nameVi.toLowerCase().includes(q)) || 
                    (a.scientificName && a.scientificName.toLowerCase().includes(q))
                );
            }

            if (filters.zoneId && filters.zoneId !== 'all') {
                results = results.filter(a => a.zoneId === filters.zoneId);
            }

            if (filters.iucnStatus && filters.iucnStatus !== 'all') {
                results = results.filter(a => a.iucnStatus && a.iucnStatus.includes(filters.iucnStatus));
            }

            return { success: true, count: results.length, data: results };
        } catch (err) {
            console.warn("Live API /animals failed, fallback to mock:", err);
            return { success: true, count: MOCK_DB.animals.length, data: MOCK_DB.animals };

        }

        return { success: true, count: results.length, data: results };
    },

    // 4. GET ANIMAL BY ID - Always uses frontend MOCK_DB.animals
    async getAnimalById(id) {
        await this._simulateLatency(100);
        const animal = MOCK_DB.animals.find(a => a.id === parseInt(id));
        if (!animal) return { success: false, message: "Không tìm thấy động vật." };
        return { success: true, data: animal };
    },

    // 5. GET SPECIES NARRATION BY SPECIES ID & LANG (Thuyết minh gắn với Loài / Species)
    async getSpeciesNarration(speciesId, lang = 'vi') {
        const sId = parseInt(speciesId);
        await this._simulateLatency(40);
        const isEn = (lang === 'en');

        // Check if there is tailored narration in MOCK_DB.narrations[sId]
        const tailored = MOCK_DB.narrations[sId];
        if (tailored) {
            const entry = isEn && tailored.en ? tailored.en : (tailored.vi || tailored.en);
            if (entry) {
                // Attach constituent animals if available
                const constituentAnimals = MOCK_DB.animals.filter(a => a.speciesId === sId);
                return { 
                    success: true, 
                    data: {
                        ...entry,
                        speciesId: sId,
                        constituentAnimals
                    }
                };
            }
        }

        // Fetch or find species metadata
        let sp = MOCK_DB.species.find(s => s.id === sId);
        try {
            const allSpecies = await this.getSpecies();
            if (allSpecies.success) {
                const found = allSpecies.data.find(s => s.id === sId);
                if (found) sp = found;
            }
        } catch (e) {}

        const constituentAnimals = MOCK_DB.animals.filter(a => a.speciesId === sId);
        const animalNames = constituentAnimals.map(a => a.nameVi).join(', ');

        const speciesNameVi = sp ? sp.nameVi : `Loài mã số ${sId}`;
        const speciesNameEn = sp ? sp.nameEn : (sp ? sp.nameVi : `Species #${sId}`);
        const scientificName = sp ? (sp.scientificName || sp.nameEn) : "Đang cập nhật";
        const status = sp ? sp.conservationStatus : "Ít quan tâm";
        const desc = sp ? sp.description : "Loài động vật quý hiếm đang được chăm sóc và bảo tồn tại ZooGuide.";
        const imageUrl = (sp && sp.imageUrl) || (constituentAnimals[0] && constituentAnimals[0].imageUrl) || "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800";

        const narrationData = {
            speciesId: sId,
            speciesName: isEn ? speciesNameEn : speciesNameVi,
            scientificName: scientificName,
            conservationStatus: status,
            imageUrl: imageUrl,
            title: isEn ? `Audio Tour: ${speciesNameEn} (${scientificName})` : `Thuyết minh: ${speciesNameVi} (${scientificName})`,
            narrator: isEn ? "ZooGuide Wildlife Conservation Specialist" : "Chuyên gia Sinh học ZooGuide",
            durationSec: 90,
            durationFormatted: "01:30",
            audioSrc: isEn ? "/assets/audio/generic_en.mp3" : "/assets/audio/generic_vi.mp3",
            summary: isEn 
                ? `Explore the behavioral ecology, natural habitat, and global conservation status of ${speciesNameEn} (${scientificName}).`
                : `Giới thiệu chi tiết về đời sống, tập tính tự nhiên và hiện trạng bảo tồn của ${speciesNameVi} (${scientificName}).`,
            constituentAnimals: constituentAnimals,
            transcript: isEn ? [
                { time: 0, text: `Welcome to the conservation sanctuary of ${speciesNameEn}.` },
                { time: 15, text: `Classified scientifically as ${scientificName}. ${desc}` },
                { time: 35, text: `Current IUCN Red List conservation status: ${status}.` },
                { time: 60, text: animalNames ? `Our zoo currently houses resident individuals: ${animalNames}, living under specialized veterinary care.` : `Animals in this habitat enjoy spacious naturalistic enrichment and optimal nutritional diets.` },
                { time: 80, text: "Thank you for supporting wildlife conservation and education at ZooGuide!" }
            ] : [
                { time: 0, text: `Chào mừng quý khách đến với khu bảo tồn loài ${speciesNameVi}.` },
                { time: 15, text: `Tên khoa học được quốc tế công nhận là ${scientificName}. ${desc}` },
                { time: 35, text: `Tình trạng bảo tồn hiện nay theo Sách đỏ IUCN: ${status}.` },
                { time: 60, text: animalNames ? `Tại vườn thú ZooGuide, khu vực này hiện đang nuôi dưỡng các cá thể: ${animalNames}.` : `Các cá thể thuộc loài này được nuôi dưỡng trong môi trường mô phỏng bán hoang dã hiện đại.` },
                { time: 80, text: "Chúc quý khách có trải nghiệm tham quan tuyệt vời và thêm yêu thế giới động vật hoang dã!" }
            ]
        };

        return { success: true, data: narrationData };
    },

    // 5b. GET NARRATION BY TARGET ID (Hỗ trợ cả Animal ID và Species ID - TẤT CẢ ĐỀU LẤY NARRATION THEO SPECIES)
    async getNarration(targetId, lang = 'vi') {
        const id = parseInt(targetId);
        // Nếu targetId là của một cá thể Animal (ví dụ: Simba id=1, Leo id=2) -> lấy speciesId của cá thể đó
        const animal = MOCK_DB.animals.find(a => a.id === id);
        if (animal && animal.speciesId) {
            // Simba và Leo đều dùng chung bài thuyết minh của loài Sư tử (speciesId)
            return this.getSpeciesNarration(animal.speciesId, lang);
        }

        // Nếu targetId truyền vào trực tiếp là speciesId hoặc không tìm thấy animal
        return this.getSpeciesNarration(id, lang);
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

    // 8. ADMIN: SPECIES CRUD
    async getSpecies() {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/species`);
            if (!res.ok) throw new Error("API lỗi");
            const data = await res.json();
            const mapped = data.map(s => ({
                id: s.speciesId,
                nameVi: s.name,
                nameEn: s.scientificName || s.name,
                conservationStatus: s.conservationStatus || "N/A",
                description: s.description || "",
                imageUrl: s.imageUrl || ""
            }));
            return { success: true, data: mapped };
        } catch (err) {
            console.error(err);
            return { success: false, data: MOCK_DB.species, error: err.message };
        }
    },
    async createSpecies(data) {
        try {
            const reqData = {
                name: data.nameVi,
                scientificName: data.nameEn,
                description: data.description,
                conservationStatus: data.conservationStatus,
                imageUrl: data.imageUrl || ""
            };
            const res = await fetch(`${API_CONFIG.BASE_URL}/species`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Lỗi tạo species");
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
                name: data.nameVi,
                scientificName: data.nameEn,
                description: data.description,
                conservationStatus: data.conservationStatus,
                imageUrl: data.imageUrl || ""
            };
            const res = await fetch(`${API_CONFIG.BASE_URL}/species/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Lỗi cập nhật species");
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
            const res = await fetch(`${API_CONFIG.BASE_URL}/species/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Lỗi xóa species");
            }
            return { success: true };
        } catch(err) {
            console.error(err);
            return { success: false, error: err.message };
        }
    },

    // 9. ADMIN: ANIMALS CRUD
    async createAnimal(data) {
        if (API_CONFIG.USE_MOCK) {
            await this._simulateLatency(200);
            const newId = MOCK_DB.animals.length ? Math.max(...MOCK_DB.animals.map(a => a.id)) + 1 : 1;
            const newItem = {
                id: newId,
                code: `ANI-${String(newId).padStart(3, '0')}`,
                ...data
            };
            MOCK_DB.animals.push(newItem);
            return { success: true, data: newItem };
        }

        try {
            const reqData = {
                name: data.nameVi || data.name,
                nameVi: data.nameVi || data.name,
                speciesId: parseInt(data.speciesId) || 1,
                areaId: parseInt(data.areaId) || (data.zoneId ? (parseInt(data.zoneId.replace('zone-', '')) || 1) : 1),
                zoneId: data.zoneId,
                zoneCode: data.zoneCode,
                gender: data.gender || "Unknown",
                status: data.status || "Active",
                description: data.description || (data.diet ? `Chế độ ăn: ${data.diet}` : ""),
                healthStatus: data.healthStatus || "Khỏe mạnh",
                origin: data.origin || "",
                imageUrl: data.imageUrl || ""
            };
            const res = await fetch(`${API_CONFIG.BASE_URL}/animals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || "Lỗi tạo động vật trên máy chủ");
            }
            const created = await res.json();
            return { success: true, data: created.data || created };
        } catch (err) {
            console.error("createAnimal API error:", err);
            return { success: false, error: err.message };
        }
    },
    async updateAnimal(id, data) {
        if (API_CONFIG.USE_MOCK) {
            await this._simulateLatency(200);
            const idx = MOCK_DB.animals.findIndex(a => a.id === id);
            if (idx !== -1) {
                MOCK_DB.animals[idx] = { ...MOCK_DB.animals[idx], ...data };
                return { success: true, data: MOCK_DB.animals[idx] };
            }
            return { success: false, message: "Không tìm thấy động vật" };
        }

        try {
            const reqData = {
                name: data.nameVi || data.name,
                nameVi: data.nameVi || data.name,
                speciesId: parseInt(data.speciesId) || 1,
                areaId: parseInt(data.areaId) || (data.zoneId ? (parseInt(data.zoneId.replace('zone-', '')) || 1) : 1),
                zoneId: data.zoneId,
                zoneCode: data.zoneCode,
                gender: data.gender || "Unknown",
                status: data.status || "Active",
                description: data.description || (data.diet ? `Chế độ ăn: ${data.diet}` : ""),
                healthStatus: data.healthStatus || "Khỏe mạnh",
                origin: data.origin || "",
                imageUrl: data.imageUrl || ""
            };
            const res = await fetch(`${API_CONFIG.BASE_URL}/animals/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || "Lỗi cập nhật động vật trên máy chủ");
            }
            const updated = await res.json();
            return { success: true, data: updated.data || updated };
        } catch (err) {
            console.error("updateAnimal API error:", err);
            return { success: false, error: err.message };
        }
    },
    async deleteAnimal(id) {
        if (API_CONFIG.USE_MOCK) {
            await this._simulateLatency(200);
            MOCK_DB.animals = MOCK_DB.animals.filter(a => a.id !== id);
            return { success: true };
        }

        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/animals/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Lỗi xóa động vật trên máy chủ");
            return { success: true };
        } catch (err) {
            console.error("deleteAnimal API error:", err);
            return { success: false, error: err.message };
        }
    },

    // 10. ADMIN: AREAS CRUD
    async createArea(data) {
        if (API_CONFIG.USE_MOCK) {
            await this._simulateLatency(200);
            const newId = `zone-${data.code.toLowerCase()}`;
            const newItem = {
                id: newId,
                animalCount: 0,
                mapCoords: { x: 300, y: 300, radius: 90 },
                ...data
            };
            MOCK_DB.areas.push(newItem);
            return { success: true, data: newItem };
        }

        try {
            const reqData = {
                name: data.nameVi || data.name,
                description: data.description || "",
                latitude: parseFloat(data.latitude) || 10.7875,
                longitude: parseFloat(data.longitude) || 106.7052,
                radiusMeters: parseFloat(data.radiusMeters) || 50,
                mapImageUrl: data.mapImageUrl || ""
            };
            const res = await fetch(`${API_CONFIG.BASE_URL}/areas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || "Lỗi tạo khu vực trên máy chủ");
            }
            const created = await res.json();
            return { success: true, data: created.data || created };
        } catch (err) {
            console.error("createArea API error:", err);
            return { success: false, error: err.message };
        }
    },
    async updateArea(id, data) {
        if (API_CONFIG.USE_MOCK) {
            await this._simulateLatency(200);
            const idx = MOCK_DB.areas.findIndex(a => a.id === id);
            if (idx !== -1) {
                MOCK_DB.areas[idx] = { ...MOCK_DB.areas[idx], ...data };
                return { success: true, data: MOCK_DB.areas[idx] };
            }
            return { success: false, message: "Không tìm thấy khu vực" };
        }

        try {
            const numId = typeof id === 'number' ? id : (parseInt(String(id).replace('zone-', '')) || 1);
            const reqData = {
                name: data.nameVi || data.name,
                description: data.description || "",
                latitude: parseFloat(data.latitude) || 10.7875,
                longitude: parseFloat(data.longitude) || 106.7052,
                radiusMeters: parseFloat(data.radiusMeters) || 50,
                mapImageUrl: data.mapImageUrl || ""
            };
            const res = await fetch(`${API_CONFIG.BASE_URL}/areas/${numId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || "Lỗi cập nhật khu vực");
            }
            const updated = await res.json();
            return { success: true, data: updated.data || updated };
        } catch (err) {
            console.error("updateArea API error:", err);
            return { success: false, error: err.message };
        }
    },
    async deleteArea(id) {
        if (API_CONFIG.USE_MOCK) {
            await this._simulateLatency(200);
            MOCK_DB.areas = MOCK_DB.areas.filter(a => a.id !== id);
            return { success: true };
        }

        try {
            const numId = typeof id === 'number' ? id : (parseInt(String(id).replace('zone-', '')) || 1);
            const res = await fetch(`${API_CONFIG.BASE_URL}/areas/${numId}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.message || "Lỗi xóa phân khu");
            }
            return { success: true };
        } catch (err) {
            console.error("deleteArea API error:", err);
            return { success: false, error: err.message };
        }
    },

    // 11. ADMIN: TICKETS CRUD
    async getTickets() {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/tickets`);
            if (!res.ok) throw new Error("Lỗi kết nối");
            const data = await res.json();
            const mapped = data.map(t => {
                let statusStr = 'Active';
                if (t.status === 2) statusStr = 'Used';
                if (t.status === 3) statusStr = 'Expired';
                return {
                    id: t.ticketId,
                    ticketId: t.ticketId,
                    ticketCode: t.ticketCode,
                    customerName: "Khách hàng",
                    ticketType: t.ticketTypeName || "Standard",
                    validFromDate: t.validFrom ? new Date(t.validFrom).toLocaleString('vi-VN') : '',
                    validUntilDate: t.validUntil ? new Date(t.validUntil).toLocaleString('vi-VN') : '',
                    status: statusStr,
                    zonesAllowed: ["ALL"]
                };
            });
            return { success: true, data: mapped };
        } catch (err) {
            console.error(err);
            return { success: false, data: MOCK_DB.tickets, error: err.message };
        }
    },
    async createTicket(data) {
        try {
            const reqData = {
                ticketTypeId: parseInt(data.ticketTypeId),
                ticketCode: "",
                validFrom: new Date(data.validFrom).toISOString(),
                validUntil: new Date(data.validUntil).toISOString(),
                status: 1
            };
            const res = await fetch(`${API_CONFIG.BASE_URL}/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Lỗi tạo vé");
            }
            const created = await res.json();
            return { success: true, data: {
                id: created.ticketId,
                ticketId: created.ticketId,
                ticketCode: created.ticketCode,
                status: 'Active',
                validFromDate: created.validFrom ? new Date(created.validFrom).toLocaleString('vi-VN') : '',
                validUntilDate: created.validUntil ? new Date(created.validUntil).toLocaleString('vi-VN') : '',
                customerName: data.customerName || "Khách hàng",
                ticketType: created.ticketTypeName || "Standard",
                zonesAllowed: ["ALL"]
            }};
        } catch (err) {
            console.error(err);
            return { success: false, error: err.message };
        }
    },
    async updateTicketStatus(code, status) {
        try {
            const allRes = await fetch(`${API_CONFIG.BASE_URL}/tickets`);
            const allData = await allRes.json();
            const ticket = allData.find(t => t.ticketCode === code);
            if (!ticket) throw new Error("Không tìm thấy vé");

            let statusCode = 1;
            if (status === 'Used') statusCode = 2;
            if (status === 'Expired') statusCode = 3;

            const updateReq = {
                ticketTypeId: ticket.ticketTypeId,
                ticketCode: ticket.ticketCode,
                validFrom: ticket.validFrom,
                validUntil: ticket.validUntil,
                status: statusCode
            };

            const res = await fetch(`${API_CONFIG.BASE_URL}/tickets/${ticket.ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateReq)
            });
            if (!res.ok) throw new Error("Lỗi cập nhật");
            return { success: true, data: { ticketCode: code, status: status } };
        } catch (err) {
            return { success: false, message: err.message || "Lỗi cập nhật trạng thái vé" };
        }
    },
    async deleteTicket(id) {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/tickets/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.message || "Không thể xóa vé này vì đã có phiên tham quan hoặc liên kết.");
            }
            return { success: true, message: "Đã xóa vé thành công" };
        } catch (err) {
            console.error("deleteTicket error:", err);
            return { success: false, error: err.message };
        }
    },

    // 12. ADMIN: TICKET TYPES CRUD
    async getTicketTypes() {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/ticket-types`);
            if (!res.ok) throw new Error("Lỗi kết nối");
            const data = await res.json();
            const mapped = data.map(t => ({
                id: t.ticketTypeId,
                code: "TYPE-" + t.ticketTypeId,
                name: t.name,
                price: t.price,
                description: t.description || '',
                isActive: t.isActive
            }));
            return { success: true, data: mapped };
        } catch (err) {
            console.error(err);
            return { success: false, data: MOCK_DB.ticketTypes, error: err.message };
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
            const res = await fetch(`${API_CONFIG.BASE_URL}/ticket-types`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) throw new Error("Lỗi tạo");
            const created = await res.json();
            return { success: true, data: {
                id: created.ticketTypeId,
                code: data.code || 'TYPE-' + created.ticketTypeId,
                name: created.name,
                price: created.price,
                description: created.description,
                isActive: created.isActive
            }};
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
            const res = await fetch(`${API_CONFIG.BASE_URL}/ticket-types/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Lỗi cập nhật loại vé");
            }
            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false, error: err.message };
        }
    },
    async deleteTicketType(id) {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/ticket-types/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Lỗi xóa loại vé");
            }
            return { success: true, message: "Đã xóa loại vé thành công" };
        } catch(err) {
            console.error(err);
            return { success: false, error: err.message };
        }
    },

    // 13. ADMIN: TICKET SESSIONS (Live API with mock fallback)
    async getTicketSessions() {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/tickets/sessions`);
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data || []);
                    return { success: true, data: list };
                }
            } catch (err) {
                console.warn("Live API /tickets/sessions failed, fallback to mock:", err);
            }
        }
        await this._simulateLatency(150);
        return { success: true, data: MOCK_DB.ticketSessions };
    },

    async revokeTicketSession(sessionId) {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/tickets/sessions/${sessionId}/revoke`, {
                    method: 'POST'
                });
                if (res.ok) {
                    const data = await res.json();
                    return { success: true, message: data.message || "Đã đóng phiên thành công" };
                }
                const errData = await res.json().catch(() => null);
                return { success: false, message: errData?.message || "Không thể thu hồi phiên" };
            } catch (err) {
                console.warn("Live API revoke session failed:", err);
            }
        }
        MOCK_DB.ticketSessions = MOCK_DB.ticketSessions.filter(s => s.sessionId !== sessionId);
        return { success: true, message: "Đã đóng phiên tham quan (Mock)" };
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
            console.warn("verifyTicketSession failed:", err);
            return { valid: true }; // Tránh ngắt quãng nếu offline
        }
    },

    // 14. ADMIN: DASHBOARD REAL-TIME STATS
    async getDashboardStats() {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/dashboard/stats`);
                if (res.ok) {
                    const data = await res.json();
                    return { success: true, data: data.data || data };
                }
            } catch (err) {
                console.warn("Live API /dashboard/stats failed, fallback to calculated:", err);
            }
        }
        await this._simulateLatency(100);
        const now = new Date();
        const activeT = MOCK_DB.tickets.filter(t => t.status === 'Active').length;
        return {
            success: true,
            data: {
                totalTickets: MOCK_DB.tickets.length,
                activeTickets: activeT,
                expiredTickets: MOCK_DB.tickets.length - activeT,
                totalAnimals: MOCK_DB.animals.length,
                totalSpecies: MOCK_DB.species.length,
                totalAreas: MOCK_DB.areas.length,
                totalNarrations: Object.keys(MOCK_DB.narrations || {}).length * 2,
                totalAudios: Object.keys(MOCK_DB.narrations || {}).length * 2,
                activeSessions: MOCK_DB.ticketSessions.length,
                recentHealthLogs: [
                    {
                        id: 1,
                        animalCode: "ANI-001",
                        animalName: "Sư tử Simba",
                        date: now.toISOString().slice(0, 10),
                        veterinarian: "BS. Trần Minh Quân",
                        healthStatus: "Rất tốt",
                        weightKg: 215.5,
                        temperatureC: 38.2,
                        notes: "Thể lực sung mãn, bờm phát triển tốt.",
                        actionRequired: ""
                    }
                ],
                recentActivities: []
            }
        };
    },

    // 15. ADMIN: AUDIT LOGS
    async getAdminLogs(limit = 50) {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/admin/logs?limit=${limit}`);
                if (res.ok) {
                    const data = await res.json();
                    return { success: true, data: data.data || data };
                }
            } catch (err) {
                console.warn("Live API /admin/logs failed:", err);
            }
        }
        return { success: true, data: [] };
    },

    // 16. NARRATIONS & AUDIOS
    async getNarrations(filter = {}) {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const params = new URLSearchParams();
                if (filter.animalId) params.append('animalId', filter.animalId);
                if (filter.languageCode) params.append('languageCode', filter.languageCode);
                if (filter.status) params.append('status', filter.status);
                if (filter.search) params.append('search', filter.search);

                const res = await fetch(`${API_CONFIG.BASE_URL}/narrations?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data || []);
                    return { success: true, data: list };
                }
            } catch (err) {
                console.warn("Live API /narrations failed:", err);
            }
        }
        // Fallback to MOCK_DB.narrations
        const items = [];
        for (const [id, narr] of Object.entries(MOCK_DB.narrations || {})) {
            const animal = MOCK_DB.animals.find(a => a.id === parseInt(id));
            if (narr.vi) items.push({ narrationId: parseInt(id) * 2 - 1, animalId: parseInt(id), animalName: animal ? animal.nameVi : '', languageCode: 'vi', languageName: 'Tiếng Việt', title: narr.vi.title, content: narr.vi.summary || narr.vi.title, audioUrl: narr.vi.audioUrl || '/assets/audio/simba_vi_studio.mp3', durationSeconds: narr.vi.durationSec || 120, status: 'Published', creatorName: narr.vi.narrator || 'Cán bộ ZooGuide' });
            if (narr.en) items.push({ narrationId: parseInt(id) * 2, animalId: parseInt(id), animalName: animal ? animal.nameVi : '', languageCode: 'en', languageName: 'English', title: narr.en.title, content: narr.en.summary || narr.en.title, audioUrl: narr.en.audioUrl || '/assets/audio/simba_en_studio.mp3', durationSeconds: narr.en.durationSec || 115, status: 'Published', creatorName: narr.en.narrator || 'Cán bộ ZooGuide' });
        }
        return { success: true, data: items };
    },

    async createNarration(payload) {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/narrations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || "Lỗi tạo bài thuyết minh");
                }
                return { success: true, data: data.data || data };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }
        return { success: true, data: payload };
    },

    async updateNarration(id, payload) {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/narrations/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || "Lỗi cập nhật bài thuyết minh");
                }
                return { success: true, data: data.data || data };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }
        return { success: true, data: payload };
    },

    async updateNarrationStatus(id, status) {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/narrations/${id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || "Lỗi cập nhật trạng thái thuyết minh");
                }
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }
        return { success: true };
    },

    async deleteNarration(id) {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/narrations/${id}`, {
                    method: 'DELETE'
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(data?.message || "Lỗi xóa bài thuyết minh");
                }
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }
        return { success: true };
    },

    async addNarrationAudio(id, audioData) {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/narrations/${id}/audio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(audioData)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Lỗi thêm file audio");
                return { success: true, data: data.data || data };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }
        return { success: true, data: audioData };
    },

    async uploadNarrationAudio(id, file) {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch(`${API_CONFIG.BASE_URL}/narrations/${id}/upload-audio`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Lỗi upload file âm thanh");
                return { success: true, data: data.data || data };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }
        return {
            success: true,
            data: {
                fileUrl: URL.createObjectURL(file),
                fileName: file.name,
                fileSize: file.size
            }
        };
    },

    async getLanguages() {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/languages`);
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data || []);
                    return { success: true, data: list };
                }
            } catch (err) {
                console.warn("Live API /languages failed:", err);
            }
        }
        return {
            success: true,
            data: [
                { languageId: 1, code: 'vi', name: 'Tiếng Việt', isActive: true },
                { languageId: 2, code: 'en', name: 'English', isActive: true },
                { languageId: 3, code: 'zh', name: '中文 (Chinese)', isActive: true },
                { languageId: 4, code: 'ja', name: '日本語 (Japanese)', isActive: true }
            ]
        };
    },

    // 17. CHATBOT LIVE INTERACTION
    async sendChatMessage(message, sessionId = null) {
        if (!API_CONFIG.USE_MOCK) {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/chatbot/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, sessionId })
                });
                if (res.ok) {
                    const data = await res.json();
                    return { success: true, data: data.data || data };
                }
            } catch (err) {
                console.warn("Live API /chatbot/message failed:", err);
            }
        }
        // Fallback local query
        await this._simulateLatency(300);
        return {
            success: true,
            data: {
                reply: `ZooBot đã nhận câu hỏi: "${message}". Hiện tại hệ thống đang kết nối chế độ ngoại tuyến.`,
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                foundData: false
            }
        };
    },

    // 18. SIMULATE LATENCY FOR UX REALISM
    _simulateLatency(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
