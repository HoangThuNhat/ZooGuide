using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs.TicketType;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/ticket-types")]
public class TicketTypesController : ControllerBase
{
    private readonly ITicketTypeService _ticketTypeService;

    public TicketTypesController(ITicketTypeService ticketTypeService)
    {
        _ticketTypeService = ticketTypeService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketTypeDto>>> GetAll([FromQuery] string? lang = null)
    {
        var ticketTypes = await _ticketTypeService.GetAllAsync(lang);
        return Ok(ticketTypes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TicketTypeDto>> GetById(int id, [FromQuery] string? lang = null)
    {
        var ticketType = await _ticketTypeService.GetByIdAsync(id, lang);
        if (ticketType == null)
            return NotFound(new { message = "Ticket type not found" });

        return Ok(ticketType);
    }

    [HttpPost]
    public async Task<ActionResult<TicketTypeDto>> Create(TicketTypeCreateRequest request)
    {
        try
        {
            var created = await _ticketTypeService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.TicketTypeId }, created);
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
    public async Task<ActionResult<TicketTypeDto>> Update(int id, TicketTypeUpdateRequest request)
    {
        try
        {
            var updated = await _ticketTypeService.UpdateAsync(id, request);
            if (updated == null)
                return NotFound(new { message = "Ticket type not found" });

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
            var success = await _ticketTypeService.DeleteAsync(id);
            if (!success)
                return NotFound(new { message = "Ticket type not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}
