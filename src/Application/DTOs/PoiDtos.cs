using System;
using System.Collections.Generic;

namespace ZooGuide.Application.DTOs;

public class PoiDto
{
    public int PoiId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? OriginalName { get; set; }
    public string? Description { get; set; }
    public string Category { get; set; } = "Landmark";
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public decimal RadiusMeters { get; set; }
    public bool IsActive { get; set; }
    public bool IsCoordinateVerified { get; set; }
    public string? VerificationSource { get; set; }
    public string? ImageUrl { get; set; }
    public int? AreaId { get; set; }
    public string? AreaName { get; set; }
    public string LanguageCode { get; set; } = "vi";
    public bool HasTranslation { get; set; } = true;
    public int? CreatedBy { get; set; }
    public string? CreatorName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int NarrationCount { get; set; }
    public bool HasAudio { get; set; }
    public List<PoiNarrationDto> Narrations { get; set; } = new();
}

public class CreatePoiDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "Landmark";
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public decimal RadiusMeters { get; set; } = 50m;
    public bool IsActive { get; set; } = true;
    public bool IsCoordinateVerified { get; set; } = false;
    public string? VerificationSource { get; set; }
    public string? ImageUrl { get; set; }
    public int? AreaId { get; set; }
    public int? CreatedBy { get; set; }
}

public class UpdatePoiDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? RadiusMeters { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsCoordinateVerified { get; set; }
    public string? VerificationSource { get; set; }
    public string? ImageUrl { get; set; }
    public int? AreaId { get; set; }
}

public class PoiFilterDto
{
    public string? Category { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsVerified { get; set; }
    public string? Search { get; set; }
    public int? AreaId { get; set; }
    public string? LanguageCode { get; set; }
}

public class PoiNarrationDto
{
    public int PoiNarrationId { get; set; }
    public int PoiId { get; set; }
    public int LanguageId { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string LanguageName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Transcript { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string Status { get; set; } = "Published";
    public string? ReferenceSource { get; set; }
    public int CreatedBy { get; set; }
    public string? CreatorName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreatePoiNarrationDto
{
    public int LanguageId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Transcript { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string Status { get; set; } = "Published";
    public string? ReferenceSource { get; set; }
    public int? CreatedBy { get; set; }
}

public class UpdatePoiNarrationDto
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Status { get; set; }
    public string? ReferenceSource { get; set; }
}

public class PoiPublicNarrationDto
{
    public int PoiId { get; set; }
    public string PoiName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string LanguageName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Transcript { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public bool HasAudio { get; set; }
    public bool IsFallbackLanguage { get; set; }
    public string? FallbackMessage { get; set; }
}
