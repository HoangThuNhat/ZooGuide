using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

public interface ITranslationService
{
    Task<Dictionary<string, string>> GetUiTranslationsAsync(string languageCode);
    Task<IEnumerable<ContentTranslationDto>> GetTranslationsAsync(string? languageCode = null, string? entityType = null, int? entityId = null);
    Task<ContentTranslationDto> UpsertTranslationAsync(UpsertContentTranslationDto dto);
}

public sealed record EnglishSpeciesContent(
    string Name,
    string Habitat,
    string Diet,
    string Lifespan,
    string ConservationStatus,
    string Description);

public sealed record EnglishAnimalContent(
    string Name,
    string Origin,
    string HealthStatus,
    string Description);

public sealed record EnglishEnclosureContent(
    string Name,
    string Description);

public sealed record EnglishPoiContent(
    string Name,
    string Description);

/// <summary>
/// Centralized localization helper and read-only English reference catalog
/// derived faithfully from the Saigon Zoo & Botanical Gardens dataset.
/// Never overwrites valid non-Vietnamese DB translations and never mutates DB rows.
/// </summary>
public static class LocalizationHelper
{
    public const decimal DefaultEnclosureRadiusMeters = 30m;
    public const decimal DefaultPoiRadiusMeters = 50m;

    /// <summary>
    /// Geometrically calibrated enclosure geofence radii (meters) based on measured
    /// WGS84 Haversine nearest-neighbor spacing at Saigon Zoo & Botanical Gardens:
    /// - Tight clusters (24.5m–27.5m apart): 14m (avoids center overlap)
    /// - Medium clusters (31.2m–43.0m apart): 20m (cleanly separates adjacent exhibits)
    /// - Spacious exhibits (55.2m–70.7m apart): 28m
    /// - Isolated large exhibit (146.3m apart): 35m
    /// </summary>
    private static readonly Dictionary<string, decimal> CalibratedEnclosureRadii =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // Tight clusters (24.5m - 27.5m nearest neighbor)
            ["ENC-HOR-01"] = 14m,
            ["ENC-COC-01"] = 14m,
            ["ENC-ORA-01"] = 14m,
            ["ENC-GIB-01"] = 14m,
            ["ENC-CLO-01"] = 14m,
            ["ENC-GCA-01"] = 14m,
            // Medium clusters (31.2m - 43.0m nearest neighbor)
            ["ENC-BIR-01"] = 20m,
            ["ENC-WRE-01"] = 20m,
            ["ENC-ARG-01"] = 20m,
            ["ENC-PEL-01"] = 20m,
            ["ENC-LEO-01"] = 20m,
            ["ENC-DOU-01"] = 20m,
            ["ENC-TIG-01"] = 20m,
            ["ENC-TIG-02"] = 20m,
            ["ENC-GIR-01"] = 20m,
            ["ENC-ZEB-01"] = 20m,
            ["ENC-ELE-01"] = 20m,
            // Spacious exhibits (55.2m - 70.7m nearest neighbor)
            ["ENC-LIO-01"] = 28m,
            ["ENC-HIP-01"] = 28m,
            ["ENC-RHI-01"] = 28m,
            ["ENC-HOG-01"] = 28m,
            ["ENC-REP-01"] = 28m,
            // Large isolated exhibit (146.3m nearest neighbor)
            ["ENC-PET-01"] = 35m
        };

    public static decimal GetRecommendedEnclosureRadiusMeters(string? code)
    {
        if (!string.IsNullOrWhiteSpace(code) &&
            CalibratedEnclosureRadii.TryGetValue(code.Trim(), out var radius))
        {
            return radius;
        }
        return DefaultEnclosureRadiusMeters;
    }

    /// <summary>
    /// Reads a real WebVTT (.vtt) sidecar file stored alongside a narration MP3 if and only if
    /// the verified .vtt file exists on disk. Returns null when exact timestamps do not exist
    /// (never fabricates timestamps).
    /// </summary>
    public static string? TryReadSidecarVtt(string? audioUrl, string? objectPath, string bucket = "narration-audio")
    {
        var relativeMp3 = !string.IsNullOrWhiteSpace(objectPath) ? objectPath.TrimStart('/') : null;
        if (string.IsNullOrWhiteSpace(relativeMp3) && !string.IsNullOrWhiteSpace(audioUrl))
        {
            var marker = $"/storage/v1/object/public/{bucket}/";
            var idx = audioUrl.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (idx >= 0)
            {
                relativeMp3 = audioUrl[(idx + marker.Length)..].TrimStart('/');
            }
            else if (audioUrl.StartsWith($"/storage/{bucket}/", StringComparison.OrdinalIgnoreCase))
            {
                relativeMp3 = audioUrl[($"/storage/{bucket}/".Length)..].TrimStart('/');
            }
        }

        if (string.IsNullOrWhiteSpace(relativeMp3) || !relativeMp3.EndsWith(".mp3", StringComparison.OrdinalIgnoreCase))
            return null;

        var vttRelative = relativeMp3[..^4] + ".vtt";
        var normalizedRel = vttRelative.Replace('/', Path.DirectorySeparatorChar);
        var current = Directory.GetCurrentDirectory();
        var candidates = new[]
        {
            Path.Combine(current, "wwwroot", "storage", bucket, normalizedRel),
            Path.Combine(current, "src", "API", "wwwroot", "storage", bucket, normalizedRel),
            Path.Combine(AppContext.BaseDirectory, "wwwroot", "storage", bucket, normalizedRel)
        };

        foreach (var path in candidates)
        {
            try
            {
                if (File.Exists(path))
                {
                    var text = File.ReadAllText(path);
                    if (!string.IsNullOrWhiteSpace(text) && text.TrimStart().StartsWith("WEBVTT", StringComparison.OrdinalIgnoreCase))
                    {
                        return text;
                    }
                }
            }
            catch
            {
                // Ignore transient I/O errors; gracefully fall back to plain content
            }
        }

        return null;
    }

    private static readonly char[] VietnameseDistinctChars =
    {
        'ă', 'â', 'đ', 'ê', 'ô', 'ơ', 'ư',
        'Ă', 'Â', 'Đ', 'Ê', 'Ô', 'Ơ', 'Ư',
        'á', 'à', 'ả', 'ã', 'ạ', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ',
        'é', 'è', 'ẻ', 'ẽ', 'ẹ', 'ế', 'ề', 'ể', 'ễ', 'ệ',
        'í', 'ì', 'ỉ', 'ĩ', 'ị',
        'ó', 'ò', 'ỏ', 'õ', 'ọ', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ',
        'ú', 'ù', 'ủ', 'ũ', 'ụ', 'ứ', 'ừ', 'ử', 'ữ', 'ự',
        'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'
    };

    private static readonly string[] VietnamesePhraseMarkers =
    {
        "tên khoa học:", "sinh cảnh:", "thức ăn:", "tình trạng:",
        "nguy cấp", "sắp nguy cấp", "cực kỳ nguy cấp", "sắp bị đe dọa", "ít quan tâm",
        "thảo cầm viên sài gòn", "khỏe mạnh", "theo dõi định kỳ",
        "rừng nhiệt đới", "đồng cỏ", "chuồng ", "bãi thả ", "cổng ", "hồ sen", "đền thờ", "bảo tàng"
    };

    public static string NormalizeLanguageCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return "vi";
        var normalized = code.Trim().ToLowerInvariant();
        if (normalized == "zh-cn" || normalized == "zh_cn" || normalized == "zh-hans")
            return "zh";
        return normalized;
    }

    public static bool ContainsVietnameseText(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return false;

        foreach (var marker in VietnamesePhraseMarkers)
        {
            if (text.Contains(marker, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        int distinctCount = 0;
        foreach (var ch in text)
        {
            if (Array.IndexOf(VietnameseDistinctChars, ch) >= 0)
            {
                distinctCount++;
                if (distinctCount >= 1) return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Detects whether a DB translation row for a non-Vietnamese target language
    /// actually still contains untranslated Vietnamese text.
    /// </summary>
    public static bool IsUntranslatedVietnamese(string? translatedText, string? originalVi, string targetLang)
    {
        var lang = NormalizeLanguageCode(targetLang);
        if (lang == "vi") return false;
        if (string.IsNullOrWhiteSpace(translatedText)) return true;

        var trimmed = translatedText.Trim();

        if (!string.IsNullOrWhiteSpace(originalVi))
        {
            var viTrimmed = originalVi.Trim();
            if (ContainsVietnameseText(viTrimmed) &&
                (trimmed.Equals(viTrimmed, StringComparison.OrdinalIgnoreCase) ||
                 trimmed.StartsWith(viTrimmed + " (", StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }
        }

        return ContainsVietnameseText(trimmed);
    }

    public static bool HasValidDbTranslation(string? translatedTitle, string? originalVi, string targetLang)
    {
        var lang = NormalizeLanguageCode(targetLang);
        if (lang == "vi") return true;
        if (string.IsNullOrWhiteSpace(translatedTitle)) return false;
        return !IsUntranslatedVietnamese(translatedTitle, originalVi, lang);
    }

    public static string? LocalizeConservationStatus(string? rawStatus, string targetLang)
    {
        if (string.IsNullOrWhiteSpace(rawStatus)) return rawStatus;
        var lang = NormalizeLanguageCode(targetLang);
        if (lang != "en") return rawStatus;

        var upper = rawStatus.Trim().ToUpperInvariant();
        if (upper.StartsWith("CR")) return "CR - Critically Endangered";
        if (upper.StartsWith("EN")) return "EN - Endangered";
        if (upper.StartsWith("VU")) return "VU - Vulnerable";
        if (upper.StartsWith("NT")) return "NT - Near Threatened";
        if (upper.StartsWith("LC")) return "LC - Least Concern";
        return rawStatus;
    }

    // Read-only English reference catalog for the 22 Species (keyed by scientific name / VI name)
    private static readonly Dictionary<string, EnglishSpeciesContent> SpeciesByScientific =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Elephas maximus"] = new(
                "Asian Elephant",
                "Tropical and subtropical forests of South and Southeast Asia",
                "Fresh grass, leaves, small branches, bark, bananas, sugarcane",
                "60 - 70 years",
                "EN - Endangered",
                "Scientific name: Elephas maximus. Habitat: Tropical and subtropical forests of South and Southeast Asia. Diet: Fresh grass, leaves, small branches, bark, bananas, and sugarcane. Conservation status: EN - Endangered."),
            ["Panthera tigris tigris"] = new(
                "Bengal Tiger",
                "Tropical rainforests, mangrove forests, and grasslands of South Asia",
                "Deer, sambar, wild boar, gaur",
                "15 - 20 years",
                "EN - Endangered",
                "Scientific name: Panthera tigris tigris. Habitat: Tropical rainforests, mangrove forests, and grasslands of South Asia. Diet: Deer, sambar, wild boar, and gaur. Conservation status: EN - Endangered."),
            ["Panthera leo"] = new(
                "African Lion",
                "African savannas and open grasslands",
                "Antelopes, zebras, African buffalo",
                "14 - 18 years",
                "VU - Vulnerable",
                "Scientific name: Panthera leo. Habitat: African savannas and open grasslands. Diet: Antelopes, zebras, and African buffalo. Conservation status: VU - Vulnerable."),
            ["Hippopotamus amphibius"] = new(
                "Hippopotamus",
                "Rivers, lakes, and wetlands of sub-Saharan Africa",
                "Fresh grass grazed on land at night, riverside vegetation",
                "40 - 50 years",
                "VU - Vulnerable",
                "Scientific name: Hippopotamus amphibius. Habitat: Rivers, lakes, and wetlands of sub-Saharan Africa. Diet: Fresh grass grazed on land at night and riverside vegetation. Conservation status: VU - Vulnerable."),
            ["Ceratotherium simum"] = new(
                "White Rhinoceros",
                "Savannas and open valleys of Southern Africa",
                "Short ground grasses",
                "40 - 50 years",
                "NT - Near Threatened",
                "Scientific name: Ceratotherium simum. Habitat: Savannas and open valleys of Southern Africa. Diet: Short ground grasses. Conservation status: NT - Near Threatened."),
            ["Giraffa camelopardalis"] = new(
                "Giraffe",
                "African savannas and acacia woodlands",
                "High acacia leaves, young shoots, flowers, and fruit",
                "25 - 30 years",
                "VU - Vulnerable",
                "Scientific name: Giraffa camelopardalis. Habitat: African savannas and acacia woodlands. Diet: High acacia leaves, young shoots, flowers, and fruit. Conservation status: VU - Vulnerable."),
            ["Equus quagga"] = new(
                "Plains Zebra",
                "Savanna grasslands of East and Southern Africa",
                "Coarse savanna grasses and young shoots",
                "20 - 25 years",
                "NT - Near Threatened",
                "Scientific name: Equus quagga. Habitat: Savanna grasslands of East and Southern Africa. Diet: Coarse savanna grasses and young shoots. Conservation status: NT - Near Threatened."),
            ["Hyelaphus porcinus"] = new(
                "Indochinese Hog Deer",
                "Floodplain grasslands and river valleys of Southeast Asia",
                "Young grasses, tender leaves, shrub shoots",
                "12 - 15 years",
                "EN - Endangered",
                "Scientific name: Hyelaphus porcinus. Habitat: Floodplain grasslands and river valleys of Southeast Asia. Diet: Young grasses, tender leaves, and shrub shoots. Conservation status: EN - Endangered."),
            ["Panthera pardus"] = new(
                "Leopard",
                "Tropical forests, woodlands, and rocky hills of Asia and Africa",
                "Small antelopes, monkeys, wild boar, birds",
                "12 - 17 years",
                "VU - Vulnerable",
                "Scientific name: Panthera pardus. Habitat: Tropical forests, woodlands, and rocky hills of Asia and Africa. Diet: Small antelopes, monkeys, wild boar, and birds. Conservation status: VU - Vulnerable."),
            ["Neofelis nebulosa"] = new(
                "Clouded Leopard",
                "Tropical evergreen rainforests of Southeast Asia",
                "Monkeys, gibbons, squirrels, birds, young muntjacs",
                "11 - 15 years",
                "VU - Vulnerable",
                "Scientific name: Neofelis nebulosa. Habitat: Tropical evergreen rainforests of Southeast Asia. Diet: Monkeys, gibbons, squirrels, birds, and young muntjacs. Conservation status: VU - Vulnerable."),
            ["Catopuma temminckii"] = new(
                "Asian Golden Cat",
                "Dense tropical forests and bamboo groves of Southeast Asia",
                "Birds, rodents, chevrotains, small muntjacs",
                "12 - 18 years",
                "NT - Near Threatened",
                "Scientific name: Catopuma temminckii. Habitat: Dense tropical forests and bamboo groves of Southeast Asia. Diet: Birds, rodents, chevrotains, and small muntjacs. Conservation status: NT - Near Threatened."),
            ["Pongo pygmaeus"] = new(
                "Bornean Orangutan",
                "Lowland tropical rainforests of Borneo",
                "Wild fruits (figs, durian), young leaves, bark",
                "35 - 45 years",
                "CR - Critically Endangered",
                "Scientific name: Pongo pygmaeus. Habitat: Lowland tropical rainforests of Borneo. Diet: Wild fruits (figs, durian), young leaves, and bark. Conservation status: CR - Critically Endangered."),
            ["Nomascus gabriellae"] = new(
                "Yellow-cheeked Gibbon",
                "Tropical evergreen forests of Southern Vietnam, Laos, and Cambodia",
                "Wild fruits, young leaves, flowers, insects",
                "25 - 30 years",
                "EN - Endangered",
                "Scientific name: Nomascus gabriellae. Habitat: Tropical evergreen forests of Southern Vietnam, Laos, and Cambodia. Diet: Wild fruits, young leaves, flowers, and insects. Conservation status: EN - Endangered."),
            ["Pygathrix cinerea"] = new(
                "Grey-shanked Douc Langur",
                "Tropical evergreen forests of Central Vietnam and the Central Highlands",
                "Young leaves, buds, wild fruits and flowers",
                "20 - 25 years",
                "CR - Critically Endangered",
                "Scientific name: Pygathrix cinerea. Habitat: Tropical evergreen forests of Central Vietnam and the Central Highlands. Diet: Young leaves, buds, wild fruits, and flowers. Conservation status: CR - Critically Endangered."),
            ["Pygathrix nigripes"] = new(
                "Black-shanked Douc Langur",
                "Coastal dry tropical forests and deciduous dipterocarp forests of South Central Vietnam",
                "Leaves (over 70%), seeds, wild forest fruits",
                "18 - 22 years",
                "EN - Endangered",
                "Scientific name: Pygathrix nigripes. Habitat: Coastal dry tropical forests and deciduous dipterocarp forests of South Central Vietnam. Diet: Over 70% leaves, plus seeds and wild fruits. Conservation status: EN - Endangered."),
            ["Buceros bicornis"] = new(
                "Great Hornbill",
                "Tall evergreen tropical rainforests of South and Southeast Asia",
                "Wild forest fruits (especially figs), lizards, small birds",
                "35 - 50 years",
                "VU - Vulnerable",
                "Scientific name: Buceros bicornis. Habitat: Tall evergreen tropical rainforests of South and Southeast Asia. Diet: Wild forest fruits (especially figs), lizards, and small birds. Conservation status: VU - Vulnerable."),
            ["Rhyticeros undulatus"] = new(
                "Wreathed Hornbill",
                "Old-growth evergreen tropical rainforests of Southeast Asia",
                "Juicy forest fruits, insects, small reptiles",
                "30 - 40 years",
                "VU - Vulnerable",
                "Scientific name: Rhyticeros undulatus. Habitat: Old-growth evergreen tropical rainforests of Southeast Asia. Diet: Juicy forest fruits, insects, and small reptiles. Conservation status: VU - Vulnerable."),
            ["Anthracoceros albirostris"] = new(
                "Oriental Pied Hornbill",
                "Open tropical woodlands, forest edges, and broad-canopy gardens",
                "Wild fruits, insects, small frogs",
                "25 - 35 years",
                "LC - Least Concern",
                "Scientific name: Anthracoceros albirostris. Habitat: Open tropical woodlands, forest edges, and broad-canopy gardens. Diet: Wild fruits, insects, and small frogs. Conservation status: LC - Least Concern."),
            ["Pelecanus philippensis"] = new(
                "Spot-billed Pelican",
                "Inland freshwater and brackish wetlands, large lakes, and marshes",
                "Freshwater fish and small amphibians",
                "15 - 25 years",
                "NT - Near Threatened",
                "Scientific name: Pelecanus philippensis. Habitat: Inland freshwater and brackish wetlands, large lakes, and marshes. Diet: Freshwater fish and small amphibians. Conservation status: NT - Near Threatened."),
            ["Rheinardia ocellata"] = new(
                "Vietnamese Crested Argus",
                "Primary tropical rainforests of the Truong Son Mountain Range in Vietnam and Laos",
                "Forest seeds, tender leaves, beetles",
                "15 - 20 years",
                "EN - Endangered",
                "Scientific name: Rheinardia ocellata. Habitat: Primary tropical rainforests of the Truong Son Mountain Range in Vietnam and Laos. Diet: Forest seeds, tender leaves, and beetles. Conservation status: EN - Endangered."),
            ["Cacatua alba"] = new(
                "White Cockatoo",
                "Tropical rainforests of the Maluku Islands, Indonesia",
                "Hard seeds, fruits, berries, young shoots",
                "40 - 60 years",
                "EN - Endangered",
                "Scientific name: Cacatua alba. Habitat: Tropical rainforests of the Maluku Islands, Indonesia. Diet: Hard seeds, fruits, berries, and young shoots. Conservation status: EN - Endangered."),
            ["Ophiophagus hannah"] = new(
                "King Cobra",
                "Dense tropical forests and bamboo thickets near rivers and streams in Southeast Asia",
                "Specializes in hunting other snakes, monitor lizards, and lizards",
                "20 years",
                "VU - Vulnerable",
                "Scientific name: Ophiophagus hannah. Habitat: Dense tropical forests and bamboo thickets near rivers and streams in Southeast Asia. Diet: Specializes in hunting other snakes, monitor lizards, and lizards. Conservation status: VU - Vulnerable.")
        };

    // Read-only English reference catalog for the 22 Animals (keyed by Vietnamese name)
    private static readonly Dictionary<string, EnglishAnimalContent> AnimalsByViName =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Đàn Voi Châu Á"] = new("Asian Elephant Herd", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "The Asian elephant herd lives in a spacious open yard with an exercise arena and a natural mud-bathing pool."),
            ["Hổ trắng Ngộ Không"] = new("Ngo Khong the White Tiger", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A white Bengal tiger born on July 8, 2015 at Saigon Zoo and Botanical Gardens, beloved by millions of visitors."),
            ["Sư tử trắng Mimi"] = new("Mimi the White Lion", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A female white lion who has lived at Saigon Zoo and Botanical Gardens for 16 years, reaching a remarkable age of 18."),
            ["Đàn Hà Mã"] = new("Hippopotamus Pod", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "The hippopotamus pod inhabits a wide, shaded water pool inside the herbivore zone."),
            ["Tê Giác Trắng"] = new("White Rhinoceros", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "The white rhinoceros at Saigon Zoo and Botanical Gardens is cared for under a verified grassland nutrition program."),
            ["Đàn Hươu Cao Cổ"] = new("Giraffe Herd", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "The giraffe herd at Saigon Zoo lives in an airy outdoor habitat shaded by tall green trees."),
            ["Đàn Ngựa Vằn"] = new("Plains Zebra Herd", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "The plains zebra herd roams peacefully alongside other herbivores in the Savanna zone."),
            ["Hươu Vàng"] = new("Indochinese Hog Deer", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "An Indochinese hog deer cared for as part of rare-species genetic conservation at the zoo."),
            ["Báo Hoa Mai"] = new("Leopard", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A leopard in the carnivore zone equipped with natural tree-trunk climbing structures."),
            ["Báo Gấm"] = new("Clouded Leopard", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A clouded leopard housed in an ecological conservation enclosure with high branches supporting its arboreal instincts."),
            ["Báo Lửa"] = new("Asian Golden Cat", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "An Asian golden cat carefully nurtured in the predator section of Saigon Zoo."),
            ["Đười Ươi Bornean"] = new("Bornean Orangutan", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "An intelligent Bornean orangutan enriched with puzzle-solving activities and rope-swinging structures."),
            ["Vượn Má Vàng"] = new("Yellow-cheeked Gibbon", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A yellow-cheeked gibbon family living on a lush, tree-shaded island inside the zoo."),
            ["Chà Vá Chân Xám"] = new("Grey-shanked Douc Langur", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A grey-shanked douc langur strictly protected under the national conservation breeding program."),
            ["Chà Vá Chân Đen"] = new("Black-shanked Douc Langur", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A black-shanked douc langur troop well adapted to swinging across branches in their spacious domed aviary."),
            ["Chim Hồng Hoàng"] = new("Great Hornbill", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A majestic great hornbill whose resonant wingbeats echo across the tropical aviary."),
            ["Niệc Mỏ Vằn"] = new("Wreathed Hornbill", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A wreathed hornbill residing in the rare birds section of Saigon Zoo."),
            ["Cao Cát Bụng Trắng"] = new("Oriental Pied Hornbill", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "An agile pair of Oriental pied hornbills living inside the tropical bird dome."),
            ["Đàn Bồ Nông Chân Xám"] = new("Spot-billed Pelican Flock", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A flock of spot-billed pelicans swimming freely on the central lake of the zoo grounds."),
            ["Trĩ Sao"] = new("Vietnamese Crested Argus", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A Vietnamese crested argus displaying its ornate tail plumage inside a simulated forest sanctuary."),
            ["Vẹt Trắng Mào Trắng"] = new("White Cockatoo", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A friendly white cockatoo known for its rich vocal mimicry and playful intelligence."),
            ["Rắn Hổ Chúa"] = new("King Cobra", "Saigon Zoo and Botanical Gardens", "Healthy - Routine Monitoring", "A king cobra exhibited in an international-standard tempered-glass reptile sanctuary.")
        };

    // Read-only English reference catalog for the 23 Enclosures (keyed by Code)
    private static readonly Dictionary<string, EnglishEnclosureContent> EnclosuresByCode =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["ENC-REP-01"] = new("King Cobra & Reptile House", "Temperature-controlled reptile conservation conservatory behind the lotus lake, housing king cobras, reticulated pythons, and tropical tortoises."),
            ["ENC-PET-01"] = new("Friendly Petting Zoo", "A welcoming children's zoo area near Gate B where visitors and kids can gently interact with and feed capybaras, dwarf goats, sheep, and rabbits."),
            ["ENC-ELE-01"] = new("Asian Elephant Yard", "A spacious earthen habitat with an exercise arena and natural mud-bathing pool for the Asian elephant herd."),
            ["ENC-HIP-01"] = new("Hippopotamus Pool", "A deep water basin and mud bank along Nhieu Loc Canal where the hippopotamus pod swims and relaxes."),
            ["ENC-RHI-01"] = new("White Rhinoceros Sanctuary", "A reinforced outdoor earthen yard featuring a mineral mud bath and hay feeders for the giant African white rhinoceroses."),
            ["ENC-GIR-01"] = new("Giraffe Savanna Lawn", "A tall-fenced savanna yard with elevated feeding platforms where the giraffe herd enjoys fresh foliage."),
            ["ENC-ZEB-01"] = new("Plains Zebra Grassland", "A sun-drenched green pasture where African plains zebras freely trot and graze."),
            ["ENC-HOG-01"] = new("Indochinese Hog Deer Conservation Yard", "A peaceful conservation habitat for native Southeast Asian hog deer with lush lawns and shady trees."),
            ["ENC-BIR-01"] = new("Tropical Bird Dome Aviary", "A 15-meter-high walk-in steel-mesh dome housing great hornbills and numerous rare tropical forest birds."),
            ["ENC-WRE-01"] = new("Wreathed Hornbill Aviary", "A specialized aviary fitted with hollow tree-trunk nesting cavities for rare wreathed hornbills."),
            ["ENC-HOR-01"] = new("Oriental Pied Hornbill Aviary", "An airy enclosure for lively Oriental pied hornbills equipped with sturdy ironwood perches."),
            ["ENC-PEL-01"] = new("Waterfowl & Pelican Lake", "The central lake featuring wooden landing decks and rocky islets dedicated to the spot-billed pelican flock."),
            ["ENC-ARG-01"] = new("Native Crested Argus Habitat", "A densely planted enclosure replicating the Truong Son forest canopy for endemic Vietnamese crested argus displays."),
            ["ENC-COC-01"] = new("White Cockatoo Dome", "A bright dome aviary for intelligent, lively, and visitor-friendly white cockatoos."),
            ["ENC-ORA-01"] = new("Bornean Orangutan House", "An elevated rope-climbing and wooden-platform complex designed for Bornean orangutan exercise and cognitive enrichment."),
            ["ENC-GIB-01"] = new("Yellow-cheeked Gibbon Island", "A lake island opposite the tiger enclosures equipped with wooden poles and swinging lines for morning gibbon songs."),
            ["ENC-DOU-01"] = new("Douc Langur Semi-Wild Sanctuary", "A specialized primate sanctuary caring for both grey-shanked and black-shanked douc langurs under dense forest foliage."),
            ["ENC-TIG-01"] = new("Bengal Tiger Enclosure", "A semi-wild habitat for endangered Bengal tigers with a bathing stream, rock ledges, and natural shade."),
            ["ENC-TIG-02"] = new("Siberian & White Tiger Enclosure", "A conservation habitat for majestic white tigers and Siberian tigers featuring a cool bathing pool and natural turf."),
            ["ENC-LIO-01"] = new("Royal African Lion Enclosure", "An expansive habitat for the African lion pride with sunlit rocky mounds, shade trees, and a safety moat."),
            ["ENC-LEO-01"] = new("Leopard Habitat", "A forest-inspired enclosure with natural climbing branches designed for leopard agility and exploration."),
            ["ENC-CLO-01"] = new("Clouded Leopard Conservation Habitat", "A multi-level wooden-deck and tall-branch enclosure tailored to the elusive, arboreal clouded leopard."),
            ["ENC-GCA-01"] = new("Asian Golden Cat Sanctuary", "A quiet, densely vegetated sanctuary suited to the shy and alert nature of the rare Asian golden cat.")
        };

    // Read-only English reference catalog for the 14 POIs (keyed by Code)
    private static readonly Dictionary<string, EnglishPoiContent> PoisByCode =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["GATE-A"] = new("Main Gate A (Le Duan & Nguyen Binh Khiem)", "Main entrance of Saigon Zoo facing Le Duan Boulevard, with central ticket booths, electric tram stop, and visitor information center."),
            ["GATE-B"] = new("Gate B (2B Nguyen Binh Khiem)", "Side entrance along Nguyen Binh Khiem Street, convenient for visitors parking motorbikes and cars."),
            ["GATE-C"] = new("Gate C (1 Nguyen Thi Minh Khai)", "Nguyen Thi Minh Khai entrance near Thi Nghe Bridge, offering easy connections to city bus routes."),
            ["GATE-E"] = new("Gate E (Nhieu Loc Canal Bank)", "Shaded riverside walkway overlooking Nhieu Loc Canal and eco-tourism boats."),
            ["POI-HUNG"] = new("Historic Hung Kings Temple", "Traditional royal-style temple built in 1926 to honor the Hung Kings, surrounded by century-old heritage trees."),
            ["POI-MUSEUM"] = new("Ho Chi Minh City Museum of History", "Museum preserving more than 40,000 priceless historical and cultural artifacts of Vietnam."),
            ["POI-TREE"] = new("Heritage African Mahogany Tree (Over 130 Years Old)", "One of the oldest and largest ancient trees in Saigon Zoo, with a trunk circumference over 8 meters and a sweeping canopy."),
            ["POI-LAKE"] = new("Ecological Lotus Lake & Water Pavilion", "A breezy central scenic lake crossed by wooden bridges where visitors stroll and watch schools of fish."),
            ["ENC-ELE-01"] = new("Asian Elephant Yard", "A spacious earthen yard with a natural mud-bathing pool where Asian elephants roam and interact gently with visitors."),
            ["ENC-TIG-01"] = new("Bengal Tiger Enclosure", "A semi-wild habitat for endangered Bengal tigers featuring a bathing stream, artificial cliffs, and natural grass."),
            ["ENC-TIG-02"] = new("Siberian & White Tiger Enclosure", "A conservation habitat for majestic white tigers and large Siberian tigers with a bathing pool and natural shade."),
            ["ENC-LIO-01"] = new("Royal Lion Enclosure", "An open-air habitat for the African lion pride with high sunlit rocks and cool shaded resting areas."),
            ["ENC-PET-01"] = new("Friendly Petting Zoo", "A child-friendly zone where young visitors can gently pet and feed dwarf goats, sheep, and rabbits fresh greens."),
            ["ENC-BIR-01"] = new("Tropical Bird Dome & Flamingo Lake", "A soaring walk-in aviary dome and vibrant flamingo lake home to hundreds of rare Vietnamese and international bird species.")
        };

    public static bool TryGetEnglishSpecies(string? scientificName, out EnglishSpeciesContent content)
    {
        if (!string.IsNullOrWhiteSpace(scientificName) &&
            SpeciesByScientific.TryGetValue(scientificName.Trim(), out content!))
        {
            return true;
        }
        content = null!;
        return false;
    }

    public static IEnumerable<string> FindMatchingEnglishSpeciesScientificNames(string searchLower)
    {
        if (string.IsNullOrWhiteSpace(searchLower)) yield break;
        foreach (var kv in SpeciesByScientific)
        {
            if (kv.Value.Name.Contains(searchLower, StringComparison.OrdinalIgnoreCase) ||
                kv.Value.Description.Contains(searchLower, StringComparison.OrdinalIgnoreCase) ||
                kv.Value.Habitat.Contains(searchLower, StringComparison.OrdinalIgnoreCase))
            {
                yield return kv.Key;
            }
        }
    }

    public static bool TryGetEnglishAnimal(string? viName, out EnglishAnimalContent content)
    {
        if (!string.IsNullOrWhiteSpace(viName) &&
            AnimalsByViName.TryGetValue(viName.Trim(), out content!))
        {
            return true;
        }
        content = null!;
        return false;
    }

    public static bool TryGetEnglishEnclosure(string? code, out EnglishEnclosureContent content)
    {
        if (!string.IsNullOrWhiteSpace(code) &&
            EnclosuresByCode.TryGetValue(code.Trim(), out content!))
        {
            return true;
        }
        content = null!;
        return false;
    }

    public static bool TryGetEnglishPoi(string? code, out EnglishPoiContent content)
    {
        if (!string.IsNullOrWhiteSpace(code) &&
            PoisByCode.TryGetValue(code.Trim(), out content!))
        {
            return true;
        }
        content = null!;
        return false;
    }
}

