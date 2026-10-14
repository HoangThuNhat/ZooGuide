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
    /// Lấy danh sách chuồng trại (Hỗ trợ lọc theo phân khu AreaId, tìm kiếm và trạng thái)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<EnclosureResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEnclosures([FromQuery] EnclosureFilterDto filter)
    {
        var enclosures = await _enclosureService.GetEnclosuresAsync(filter);
        return Ok(ApiResponse<IEnumerable<EnclosureResponseDto>>.Ok(enclosures));
    }

    /// <summary>
    /// Lấy chi tiết chuồng theo EnclosureId kèm danh sách động vật
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<EnclosureDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EnclosureDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEnclosureById(int id)
    {
        var enclosure = await _enclosureService.GetEnclosureByIdAsync(id);
        if (enclosure == null)
        {
            return NotFound(ApiResponse<EnclosureDetailDto>.Fail($"Không tìm thấy chuồng với mã ID = {id}."));
        }

        return Ok(ApiResponse<EnclosureDetailDto>.Ok(enclosure));
    }

    /// <summary>
    /// Thêm mới chuồng trại
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<EnclosureResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<EnclosureResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateEnclosure([FromBody] CreateEnclosureDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(ApiResponse<EnclosureResponseDto>.Fail(errors));
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(ApiResponse<EnclosureResponseDto>.Fail("Tên chuồng không được để trống."));
        }

        var result = await _enclosureService.CreateEnclosureAsync(dto);
        if (result.ErrorMessage != null)
        {
            return BadRequest(ApiResponse<EnclosureResponseDto>.Fail(result.ErrorMessage));
        }

        return CreatedAtAction(nameof(GetEnclosureById), new { id = result.Data!.EnclosureId }, 
            ApiResponse<EnclosureResponseDto>.Ok(result.Data, "Thêm mới chuồng thành công!"));
    }

    /// <summary>
    /// Cập nhật thông tin chuồng trại
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<EnclosureResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EnclosureResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<EnclosureResponseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateEnclosure(int id, [FromBody] UpdateEnclosureDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(ApiResponse<EnclosureResponseDto>.Fail(errors));
        }

        var result = await _enclosureService.UpdateEnclosureAsync(id, dto);
        if (result.NotFound)
        {
            return NotFound(ApiResponse<EnclosureResponseDto>.Fail($"Không tìm thấy chuồng với mã ID = {id}."));
        }

        if (result.ErrorMessage != null)
        {
            return BadRequest(ApiResponse<EnclosureResponseDto>.Fail(result.ErrorMessage));
        }

        return Ok(ApiResponse<EnclosureResponseDto>.Ok(result.Data!, "Cập nhật thông tin chuồng thành công!"));
    }

    /// <summary>
    /// Xóa chuồng (Kiểm tra ràng buộc cá thể động vật bên trong)
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteEnclosure(int id)
    {
        var result = await _enclosureService.DeleteEnclosureAsync(id);
        if (result.NotFound)
        {
            return NotFound(ApiResponse<object>.Fail(result.Message ?? "Không tìm thấy chuồng."));
        }

        if (result.HasConflict)
        {
            return Conflict(ApiResponse<object>.Fail(result.Message ?? "Chuồng đang có động vật sinh sống, không thể xóa."));
        }

        return Ok(ApiResponse<object>.Ok(new { id }, result.Message ?? "Đã xóa chuồng thành công."));
    }

    /// <summary>
    /// Chuyển cá thể động vật sang chuồng khác hoặc gỡ khỏi chuồng
    /// </summary>
    [HttpPost("move-animal")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MoveAnimal([FromBody] MoveAnimalDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(ApiResponse<object>.Fail(errors));
        }

        var result = await _enclosureService.MoveAnimalAsync(dto);
        if (!result.Success)
        {
            return BadRequest(ApiResponse<object>.Fail(result.Message ?? "Không thể chuyển động vật."));
        }

        return Ok(ApiResponse<object>.Ok(new { dto.AnimalId, dto.TargetEnclosureId }, result.Message ?? "Chuyển chuồng thành công!"));
    }
}
