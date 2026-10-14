using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EnclosuresController : ControllerBase
{
    private readonly IEnclosureService _enclosureService;

    public EnclosuresController(IEnclosureService enclosureService)
    {
        _enclosureService = enclosureService;
    }

    /// <summary>
    /// Lấy danh sách chuồng trại trong sở thú (hỗ trợ lọc theo phân khu AreaId, từ khóa tìm kiếm và trạng thái)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<EnclosureResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] EnclosureFilterRequest filter)
    {
        var enclosures = await _enclosureService.GetAllAsync(filter);
        return Ok(ApiResponse<IEnumerable<EnclosureResponse>>.Ok(enclosures));
    }

    /// <summary>
    /// Lấy chi tiết chuồng trại theo EnclosureId (kèm thông tin phân khu và danh sách động vật)
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<EnclosureDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EnclosureDetailResponse>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var enclosure = await _enclosureService.GetByIdAsync(id);
        if (enclosure == null)
        {
            return NotFound(ApiResponse<EnclosureDetailResponse>.Fail($"Không tìm thấy chuồng với mã ID = {id}."));
        }

        return Ok(ApiResponse<EnclosureDetailResponse>.Ok(enclosure));
    }

    /// <summary>
    /// Thêm mới chuồng trại (Kiểm tra AreaId có tồn tại trong hệ thống)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<EnclosureResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<EnclosureResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateEnclosureRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(ApiResponse<EnclosureResponse>.Fail(errors));
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(ApiResponse<EnclosureResponse>.Fail("Tên chuồng không được để trống."));
        }

        try
        {
            var created = await _enclosureService.CreateAsync(request);
            return CreatedAtAction(
                nameof(GetById),
                new { id = created.EnclosureId },
                ApiResponse<EnclosureResponse>.Ok(created, "Thêm mới chuồng thành công!"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<EnclosureResponse>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Cập nhật thông tin chuồng trại theo EnclosureId (Kiểm tra EnclosureId và AreaId tồn tại)
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<EnclosureResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EnclosureResponse>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<EnclosureResponse>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEnclosureRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(ApiResponse<EnclosureResponse>.Fail(errors));
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(ApiResponse<EnclosureResponse>.Fail("Tên chuồng không được để trống."));
        }

        try
        {
            var updated = await _enclosureService.UpdateAsync(id, request);
            if (updated == null)
            {
                return NotFound(ApiResponse<EnclosureResponse>.Fail($"Không tìm thấy chuồng với mã ID = {id} để cập nhật."));
            }

            return Ok(ApiResponse<EnclosureResponse>.Ok(updated, "Cập nhật chuồng thành công!"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<EnclosureResponse>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Xóa chuồng trại theo EnclosureId (chặn xóa khi chuồng vẫn còn động vật bên trong)
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var success = await _enclosureService.DeleteAsync(id);
            if (!success)
            {
                return NotFound(ApiResponse<object>.Fail($"Không tìm thấy chuồng với mã ID = {id}."));
            }

            return Ok(ApiResponse<object>.Ok(new { id }, "Đã xóa chuồng thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Chuyển cá thể động vật sang chuồng khác hoặc gỡ khỏi chuồng (TargetEnclosureId rỗng)
    /// </summary>
    [HttpPost("move-animal")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MoveAnimal([FromBody] MoveAnimalRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(ApiResponse<object>.Fail(errors));
        }

        try
        {
            var message = await _enclosureService.MoveAnimalAsync(request);
            return Ok(ApiResponse<object>.Ok(new { request.AnimalId, request.TargetEnclosureId }, message));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Lấy danh sách toàn bộ chuồng trại thuộc một phân khu (AreaId)
    /// </summary>
    [HttpGet("/api/areas/{areaId:int}/enclosures")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<EnclosureResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<EnclosureResponse>>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByAreaId(int areaId)
    {
        var enclosures = await _enclosureService.GetByAreaIdAsync(areaId);
        if (enclosures == null)
        {
            return NotFound(ApiResponse<IEnumerable<EnclosureResponse>>.Fail($"Không tìm thấy khu vực với mã ID = {areaId}."));
        }

        return Ok(ApiResponse<IEnumerable<EnclosureResponse>>.Ok(enclosures));
    }
}
