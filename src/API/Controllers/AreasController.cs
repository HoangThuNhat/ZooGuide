using Microsoft.AspNetCore.Mvc;
using ZooGuide.API.Filters;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AreasController : ControllerBase
{
    private readonly IAreaService _areaService;

    public AreasController(IAreaService areaService)
    {
        _areaService = areaService;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ khu vực trong sở thú
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AreaResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAreas()
    {
        var areas = await _areaService.GetAllAreasAsync();
        return Ok(ApiResponse<IEnumerable<AreaResponseDto>>.Ok(areas));
    }

    /// <summary>
    /// Lấy chi tiết một khu vực theo AreaId
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<AreaResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AreaResponseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAreaById(int id)
    {
        var area = await _areaService.GetAreaByIdAsync(id);
        if (area == null)
        {
            return NotFound(ApiResponse<AreaResponseDto>.Fail($"Không tìm thấy khu vực với mã ID = {id}."));
        }

        return Ok(ApiResponse<AreaResponseDto>.Ok(area));
    }

    /// <summary>
    /// Thêm mới khu vực sở thú (Validate vĩ độ [-90, 90], kinh độ [-180, 180], bán kính > 0, tên không rỗng)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AreaResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<AreaResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateArea([FromBody] CreateAreaDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(ApiResponse<AreaResponseDto>.Fail(errors));
        }

        // Validate bổ sung
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(ApiResponse<AreaResponseDto>.Fail("Tên khu vực không được để trống."));
        }

        if (dto.Latitude < -90m || dto.Latitude > 90m)
        {
            return BadRequest(ApiResponse<AreaResponseDto>.Fail("Vĩ độ (Latitude) phải nằm trong khoảng [-90, 90]."));
        }

        if (dto.Longitude < -180m || dto.Longitude > 180m)
        {
            return BadRequest(ApiResponse<AreaResponseDto>.Fail("Kinh độ (Longitude) phải nằm trong khoảng [-180, 180]."));
        }

        if (dto.RadiusMeters <= 0m)
        {
            return BadRequest(ApiResponse<AreaResponseDto>.Fail("Bán kính phát hiện (RadiusMeters) phải lớn hơn 0."));
        }

        var created = await _areaService.CreateAreaAsync(dto);
        return CreatedAtAction(nameof(GetAreaById), new { id = created.AreaId }, ApiResponse<AreaResponseDto>.Ok(created, "Thêm mới khu vực thành công!"));
    }

    /// <summary>
    /// Cập nhật thông tin khu vực theo AreaId
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<AreaResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AreaResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<AreaResponseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateArea(int id, [FromBody] UpdateAreaDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(ApiResponse<AreaResponseDto>.Fail(errors));
        }

        if (dto.Latitude < -90m || dto.Latitude > 90m)
        {
            return BadRequest(ApiResponse<AreaResponseDto>.Fail("Vĩ độ (Latitude) phải nằm trong khoảng [-90, 90]."));
        }

        if (dto.Longitude < -180m || dto.Longitude > 180m)
        {
            return BadRequest(ApiResponse<AreaResponseDto>.Fail("Kinh độ (Longitude) phải nằm trong khoảng [-180, 180]."));
        }

        if (dto.RadiusMeters <= 0m)
        {
            return BadRequest(ApiResponse<AreaResponseDto>.Fail("Bán kính phát hiện (RadiusMeters) phải lớn hơn 0."));
        }

        var updated = await _areaService.UpdateAreaAsync(id, dto);
        if (updated == null)
        {
            return NotFound(ApiResponse<AreaResponseDto>.Fail($"Không tìm thấy khu vực với mã ID = {id} để cập nhật."));
        }

        return Ok(ApiResponse<AreaResponseDto>.Ok(updated, "Cập nhật khu vực thành công!"));
    }

    /// <summary>
    /// Xóa khu vực (Kiểm tra ràng buộc động vật; chặn xóa hoặc đổi status sang Closed)
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteArea(int id)
    {
        var result = await _areaService.DeleteAreaAsync(id);
        if (!result.Success)
        {
            return NotFound(ApiResponse<object>.Fail(result.Message ?? "Không tìm thấy khu vực."));
        }

        if (result.HasConflict)
        {
            // Trả về 409 Conflict kèm thông báo lý do bảo toàn dữ liệu
            return Conflict(ApiResponse<object>.Fail(result.Message ?? "Khu vực đang có động vật sinh sống, không thể xóa trực tiếp."));
        }

        return Ok(ApiResponse<object>.Ok(new { id }, result.Message ?? "Đã xóa khu vực thành công."));
    }

    /// <summary>
    /// Tính khoảng cách Haversine và hướng di chuyển (bearing) từ vị trí GPS hiện tại đến phân khu đích
    /// </summary>
    [HttpGet("{id:int}/navigation")]
    [ProducesResponseType(typeof(ApiResponse<AreaNavigationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AreaNavigationDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<AreaNavigationDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetNavigation(int id, [FromQuery] decimal lat, [FromQuery] decimal lng)
    {
        if (lat < -90m || lat > 90m || lng < -180m || lng > 180m)
        {
            return BadRequest(ApiResponse<AreaNavigationDto>.Fail("Tọa độ vị trí hiện tại không hợp lệ."));
        }

        var nav = await _areaService.GetNavigationToAreaAsync(id, lat, lng);
        if (nav == null)
        {
            return NotFound(ApiResponse<AreaNavigationDto>.Fail($"Không tìm thấy phân khu đích với mã ID = {id}."));
        }

        return Ok(ApiResponse<AreaNavigationDto>.Ok(nav, "Tính toán điều hướng thành công!"));
    }
}
