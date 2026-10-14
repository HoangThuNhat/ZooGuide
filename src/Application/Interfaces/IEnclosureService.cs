using ZooGuide.Application.DTOs;

namespace ZooGuide.Application.Interfaces;

/// <summary>
/// Interface nghiệp vụ quản lý chuồng trại (Enclosures)
/// </summary>
public interface IEnclosureService
{
    Task<IEnumerable<EnclosureResponse>> GetAllAsync(EnclosureFilterRequest? filter = null);
    Task<EnclosureDetailResponse?> GetByIdAsync(int id);
    Task<IEnumerable<EnclosureResponse>?> GetByAreaIdAsync(int areaId);
    Task<EnclosureResponse> CreateAsync(CreateEnclosureRequest request);
    Task<EnclosureResponse?> UpdateAsync(int id, UpdateEnclosureRequest request);

    /// <summary>
    /// Xóa chuồng. Trả về false nếu không tìm thấy; ném InvalidOperationException nếu chuồng còn động vật.
    /// </summary>
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Chuyển động vật sang chuồng khác (hoặc gỡ khỏi chuồng). Ném ArgumentException nếu động vật/chuồng đích không tồn tại.
    /// Trả về thông báo kết quả.
    /// </summary>
    Task<string> MoveAnimalAsync(MoveAnimalRequest request);
}
