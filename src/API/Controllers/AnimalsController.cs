using Microsoft.AspNetCore.Mvc;
using ZooGuide.API.Filters;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.DTOs.Common;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnimalsController : ControllerBase
{
    private readonly IAnimalService _animalService;

    public AnimalsController(IAnimalService animalService)
    {
        _animalService = animalService;
    }

    /// <summary>
    /// Lấy danh sách cá thể động vật kèm thông tin giống loài (Hỗ trợ tìm kiếm, lọc theo phân khu, tình trạng bảo tồn)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AnimalResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnimals([FromQuery] AnimalFilterDto filter)
    {
        var animals = await _animalService.GetAnimalsAsync(filter);
        return Ok(new
        {
            success = true,
            count = animals.Count(),
            data = animals
        });
    }

    /// <summary>
    /// Lấy chi tiết một cá thể động vật theo AnimalId kèm hồ sơ giống loài và phân khu
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<AnimalDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AnimalDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAnimalById(int id, [FromQuery] string? lang = null)
    {
        var animal = await _animalService.GetAnimalByIdAsync(id, lang);
        if (animal == null)
        {
            return NotFound(ApiResponse<AnimalDetailDto>.Fail($"Không tìm thấy hồ sơ động vật với mã ID = {id}."));
        }

        return Ok(ApiResponse<AnimalDetailDto>.Ok(animal));
    }

    /// <summary>
    /// Thêm mới cá thể động vật (Kiểm tra giống loài SpeciesId và phân khu AreaId có tồn tại không)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AnimalResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<AnimalResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAnimal([FromBody] CreateAnimalDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(ApiResponse<AnimalResponseDto>.Fail(errors));
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(ApiResponse<AnimalResponseDto>.Fail("Tên động vật không được để trống."));
        }

        var result = await _animalService.CreateAnimalAsync(dto);
        if (result.ErrorMessage != null)
        {
            return BadRequest(ApiResponse<AnimalResponseDto>.Fail(result.ErrorMessage));
        }

        return CreatedAtAction(nameof(GetAnimalById), new { id = result.Data!.AnimalId }, ApiResponse<AnimalResponseDto>.Ok(result.Data, "Thêm mới động vật thành công!"));
    }

    /// <summary>
    /// Cập nhật thông tin cá thể động vật (Kiểm tra giống loài mới nếu có thay đổi)
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<AnimalResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AnimalResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<AnimalResponseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAnimal(int id, [FromBody] UpdateAnimalDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(ApiResponse<AnimalResponseDto>.Fail(errors));
        }

        var result = await _animalService.UpdateAnimalAsync(id, dto);
        if (result.NotFound)
        {
            return NotFound(ApiResponse<AnimalResponseDto>.Fail($"Không tìm thấy hồ sơ động vật với mã ID = {id}."));
        }

        if (result.ErrorMessage != null)
        {
            return BadRequest(ApiResponse<AnimalResponseDto>.Fail(result.ErrorMessage));
        }

        return Ok(ApiResponse<AnimalResponseDto>.Ok(result.Data!, "Cập nhật hồ sơ động vật thành công!"));
    }

    /// <summary>
    /// Xóa hồ sơ động vật (Kiểm tra dữ liệu thuyết minh; xóa an toàn hoặc chuyển trạng thái sang Transferred)
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAnimal(int id)
    {
        var result = await _animalService.DeleteAnimalAsync(id);
        if (result.NotFound)
        {
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy hồ sơ động vật với mã ID = {id}."));
        }

        return Ok(ApiResponse<object>.Ok(new { id }, result.Message ?? "Đã xử lý xóa động vật thành công."));
    }

    /// <summary>
    /// Cập nhật hồ sơ khám sức khỏe thú y thực tế cho cá thể động vật
    /// </summary>
    [HttpPatch("{id:int}/health")]
    [ProducesResponseType(typeof(ApiResponse<AnimalResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AnimalResponseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAnimalHealth(int id, [FromBody] UpdateAnimalHealthDto dto)
    {
        dto.AnimalId = id;
        var updated = await _animalService.UpdateAnimalHealthAsync(id, dto);
        if (updated == null)
        {
            return NotFound(ApiResponse<AnimalResponseDto>.Fail($"Không tìm thấy hồ sơ động vật với mã ID = {id}."));
        }

        return Ok(ApiResponse<AnimalResponseDto>.Ok(updated, "Đã lưu hồ sơ kiểm tra sức khỏe thú y thành công!"));
    }
}
