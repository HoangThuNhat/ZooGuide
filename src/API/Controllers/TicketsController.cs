using Microsoft.AspNetCore.Mvc;
using ZooGuide.Application.DTOs.Ticket;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.API.Controllers;

[ApiController]
[Route("api/tickets")]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketDto>>> GetAll()
    {
        var tickets = await _ticketService.GetAllAsync();
        return Ok(tickets);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TicketDto>> GetById(int id)
    {
        var ticket = await _ticketService.GetByIdAsync(id);
        if (ticket == null)
            return NotFound(new { message = "Ticket not found" });

        return Ok(ticket);
    }

    [HttpPost]
    public async Task<ActionResult<TicketDto>> Create(TicketCreateRequest request)
    {
        try
        {
            var created = await _ticketService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.TicketId }, created);
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
    public async Task<ActionResult<TicketDto>> Update(int id, TicketUpdateRequest request)
    {
        try
        {
            var updated = await _ticketService.UpdateAsync(id, request);
            if (updated == null)
                return NotFound(new { message = "Ticket not found" });

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
            var success = await _ticketService.DeleteAsync(id);
            if (!success)
                return NotFound(new { message = "Ticket not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("validate")]
    public async Task<ActionResult<ValidateTicketResponse>> Validate(ValidateTicketRequest request)
    {
        var response = await _ticketService.ValidateAsync(request);
        if (!response.Valid)
        {
            return BadRequest(response); // or NotFound based on convention, but returning bad request with payload is often better
        }
        return Ok(response);
    }
}
