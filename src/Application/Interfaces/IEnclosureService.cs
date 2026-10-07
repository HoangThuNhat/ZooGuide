using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface nghiệp vụ quản lý chuồng trại (Enclosures)
/// </summary>
public interface IEnclosureService
{
    Task<IEnumerable<EnclosureResponse>> GetAllAsync();
    Task<EnclosureResponse?> GetByIdAsync(int id);
    Task<IEnumerable<EnclosureResponse>?> GetByAreaIdAsync(int areaId);
    Task<EnclosureResponse> CreateAsync(CreateEnclosureRequest request);
    Task<EnclosureResponse?> UpdateAsync(int id, UpdateEnclosureRequest request);
    Task<bool> DeleteAsync(int id);
}
