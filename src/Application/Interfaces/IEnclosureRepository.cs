using ZooGuide.Domain.Entities;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface thao tác dữ liệu bảng ENCLOSURES
/// </summary>
public interface IEnclosureRepository
{
    /// <summary>Lấy danh sách chuồng (kèm Area, Animals), hỗ trợ lọc theo phân khu, từ khóa và trạng thái.</summary>
    Task<List<Enclosure>> GetAllAsync(int? areaId = null, string? search = null, string? status = null);
    Task<Enclosure?> GetByIdAsync(int enclosureId);
    /// <summary>Lấy chuồng kèm Area và danh sách động vật (kèm Species).</summary>
    Task<Enclosure?> GetByIdWithDetailsAsync(int enclosureId);
    Task<Enclosure?> GetByCodeAsync(string code);
    Task<List<Enclosure>> GetByAreaIdAsync(int areaId);
    Task<Enclosure> CreateAsync(Enclosure enclosure);
    Task UpdateAsync(Enclosure enclosure);
    Task DeleteAsync(Enclosure enclosure);
    Task<bool> HasAnimalsAsync(int enclosureId);
}
