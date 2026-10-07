using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Services;

/// <summary>
/// Xử lý nghiệp vụ quản lý chuồng trại (Enclosures)
/// </summary>
public class EnclosureService : IEnclosureService
{
    private readonly IEnclosureRepository _enclosureRepository;
    private readonly IAreaRepository _areaRepository;

    public EnclosureService(
        IEnclosureRepository enclosureRepository,
        IAreaRepository areaRepository)
    {
        _enclosureRepository = enclosureRepository;
        _areaRepository = areaRepository;
    }

    public async Task<IEnumerable<EnclosureResponse>> GetAllAsync()
    {
        var enclosures = await _enclosureRepository.GetAllAsync();
        return enclosures.Select(e => MapToResponse(e));
    }

    public async Task<EnclosureResponse?> GetByIdAsync(int id)
    {
        var enclosure = await _enclosureRepository.GetByIdAsync(id);
        return enclosure == null ? null : MapToResponse(enclosure);
    }

    public async Task<IEnumerable<EnclosureResponse>?> GetByAreaIdAsync(int areaId)
    {
        // Kiểm tra khu vực có tồn tại trong hệ thống không
        var area = await _areaRepository.GetByIdAsync(areaId);
        if (area == null)
        {
            return null;
        }

        var enclosures = await _enclosureRepository.GetByAreaIdAsync(areaId);
        return enclosures.Select(e => MapToResponse(e, area.Name));
    }

    public async Task<EnclosureResponse> CreateAsync(CreateEnclosureRequest request)
    {
        // Kiểm tra AreaId có tồn tại trong bảng AREAS không
        var area = await _areaRepository.GetByIdAsync(request.AreaId);
        if (area == null)
        {
            throw new ArgumentException($"Khu vực với AreaId = {request.AreaId} không tồn tại trong hệ thống.");
        }

        var enclosure = new Enclosure
        {
            AreaId = request.AreaId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Active" : request.Status.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var created = await _enclosureRepository.CreateAsync(enclosure);
        return MapToResponse(created, area.Name);
    }

    public async Task<EnclosureResponse?> UpdateAsync(int id, UpdateEnclosureRequest request)
    {
        var enclosure = await _enclosureRepository.GetByIdAsync(id);
        if (enclosure == null)
        {
            return null;
        }

        // Kiểm tra AreaId có tồn tại trong bảng AREAS không
        var area = await _areaRepository.GetByIdAsync(request.AreaId);
        if (area == null)
        {
            throw new ArgumentException($"Khu vực với AreaId = {request.AreaId} không tồn tại trong hệ thống.");
        }

        enclosure.AreaId = request.AreaId;
        enclosure.Name = request.Name.Trim();
        enclosure.Description = request.Description?.Trim();
        enclosure.ImageUrl = request.ImageUrl?.Trim();
        enclosure.Status = string.IsNullOrWhiteSpace(request.Status) ? "Active" : request.Status.Trim();
        enclosure.UpdatedAt = DateTime.UtcNow;
        // CreatedAt được giữ nguyên

        await _enclosureRepository.UpdateAsync(enclosure);
        return MapToResponse(enclosure, area.Name);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var enclosure = await _enclosureRepository.GetByIdAsync(id);
        if (enclosure == null)
        {
            return false;
        }

        await _enclosureRepository.DeleteAsync(enclosure);
        return true;
    }

    private static EnclosureResponse MapToResponse(Enclosure e, string? areaName = null)
    {
        return new EnclosureResponse
        {
            EnclosureId = e.EnclosureId,
            AreaId = e.AreaId,
            AreaName = areaName ?? e.Area?.Name ?? string.Empty,
            Name = e.Name,
            Description = e.Description,
            ImageUrl = e.ImageUrl,
            Status = e.Status,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        };
    }
}
