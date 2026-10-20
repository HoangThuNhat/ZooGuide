namespace ZooGuide.Application.DTOs.Species;

public class SpeciesDto
{
    public int SpeciesId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? OriginalName { get; set; }
    public string? ScientificName { get; set; }
    public string? Description { get; set; }
    public string? ConservationStatus { get; set; }
    public string? ImageUrl { get; set; }
    public string? Habitat { get; set; }
    public string? Diet { get; set; }
    public string? Lifespan { get; set; }
    public string? ReferenceSource { get; set; }
    public string LanguageCode { get; set; } = "vi";
    public bool HasTranslation { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class SpeciesCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ScientificName { get; set; }
    public string? Description { get; set; }
    public string? ConservationStatus { get; set; }
    public string? ImageUrl { get; set; }
    public string? Habitat { get; set; }
    public string? Diet { get; set; }
    public string? Lifespan { get; set; }
    public string? ReferenceSource { get; set; }
}

public class SpeciesUpdateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ScientificName { get; set; }
    public string? Description { get; set; }
    public string? ConservationStatus { get; set; }
    public string? ImageUrl { get; set; }
    public string? Habitat { get; set; }
    public string? Diet { get; set; }
    public string? Lifespan { get; set; }
    public string? ReferenceSource { get; set; }
}
