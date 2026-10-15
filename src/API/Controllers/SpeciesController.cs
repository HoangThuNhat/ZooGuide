using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs.Species;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpeciesController : ControllerBase
{
    private readonly ISpeciesService _speciesService;

    public SpeciesController(ISpeciesService speciesService)
    {
        _speciesService = speciesService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SpeciesDto>>> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] string? conservationStatus = null)
    {
        var species = await _speciesService.GetAllAsync(search, conservationStatus);
        return Ok(species);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SpeciesDto>> GetById(int id)
    {
        var species = await _speciesService.GetByIdAsync(id);
        if (species == null)
            return NotFound(new { message = "Species not found" });

        return Ok(species);
    }

    [HttpPost]
    public async Task<ActionResult<SpeciesDto>> Create(SpeciesCreateRequest request)
    {
        try
        {
            var created = await _speciesService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.SpeciesId }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SpeciesDto>> Update(int id, SpeciesUpdateRequest request)
    {
        try
        {
            var updated = await _speciesService.UpdateAsync(id, request);
            if (updated == null)
                return NotFound(new { message = "Species not found" });

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            var success = await _speciesService.DeleteAsync(id);
            if (!success)
                return NotFound(new { message = "Species not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}
