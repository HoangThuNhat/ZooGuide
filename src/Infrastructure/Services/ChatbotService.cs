using Microsoft.EntityFrameworkCore;
using ZooGuide.Application.DTOs;
using ZooGuide.Application.Interfaces;
using ZooGuide.Domain.Entities;
using ZooGuide.Domain.Enums;
using ZooGuide.Infrastructure.Data;

namespace ZooGuide.Infrastructure.Services;

public class ChatbotService : IChatbotService
{
    private readonly ZooGuideDbContext _context;

    public ChatbotService(ZooGuideDbContext context)
    {
        _context = context;
    }

    public async Task<ChatbotQueryResponseDto> ProcessMessageAsync(ChatbotQueryRequestDto request)
    {
        var timestamp = DateTime.Now.ToString("HH:mm");

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return new ChatbotQueryResponseDto
            {
                Reply = "Quý khách vui lòng nhập câu hỏi để ZooBot có thể hỗ trợ.",
                Timestamp = timestamp,
                FoundData = false,
                SourceType = "InvalidInput"
            };
        }

        var query = request.Message.Trim().ToLower();

        // 1. Kiểm tra các câu hỏi thường gặp (FAQ) về vận hành sở thú
        if (query.Contains("giờ") || query.Contains("mở cửa") || query.Contains("đóng cửa") || query.Contains("thời gian"))
        {
            var reply = "Sở thú ZooGuide mở cửa đón khách từ **08:00 sáng đến 18:30** hàng ngày (kể cả Thứ Bảy, Chủ Nhật và ngày Lễ). Các buổi biểu diễn thuyết minh đặc biệt diễn ra lúc 10:00 và 15:30.";
            await SaveChatAsync(request.SessionId, request.Message, reply);
            return new ChatbotQueryResponseDto
            {
                Reply = reply,
                Timestamp = timestamp,
                FoundData = true,
                SourceType = "Faq"
            };
        }

        if (query.Contains("cho ăn") || query.Contains("lịch ăn") || query.Contains("feeding"))
        {
            var reply = "🕒 **Lịch cho thú ăn trong ngày:**\n• 09:30 - Khu Linh Trưởng & Rừng Mưa (Khu A)\n• 11:00 & 16:00 - Chuồng Hổ Bengal & Sư tử (Khu B)\n• 14:00 - Thảo nguyên Hươu cao cổ (Khu C)\n• 15:00 - Đảo Hồng hạc & Thủy Cung (Khu D, E)";
            await SaveChatAsync(request.SessionId, request.Message, reply);
            return new ChatbotQueryResponseDto
            {
                Reply = reply,
                Timestamp = timestamp,
                FoundData = true,
                SourceType = "Faq"
            };
        }

        if (query.Contains("vệ sinh") || query.Contains("wc") || query.Contains("toilet") || query.Contains("nước") || query.Contains("ăn uống"))
        {
            var reply = "Hệ thống nhà vệ sinh WC và quầy nước giải khát nằm ngay cạnh **Cổng Vào Chính** và trung tâm giao giữa Khu A và Khu C.";
            await SaveChatAsync(request.SessionId, request.Message, reply);
            return new ChatbotQueryResponseDto
            {
                Reply = reply,
                Timestamp = timestamp,
                FoundData = true,
                SourceType = "Faq"
            };
        }

        if (query.Contains("vé") || query.Contains("giá") || query.Contains("ticket"))
        {
            var ticketTypes = await _context.TicketTypes.Where(t => t.IsActive).ToListAsync();
            string ticketInfo = string.Join("\n", ticketTypes.Select(t => $"• **{t.Name}**: {t.Price:N0} VNĐ ({t.Description})"));
            var reply = $"Bảng giá vé hiện tại của vườn thú ZooGuide:\n{ticketInfo}\n\nQuý khách quét mã vé QR để kích hoạt bản đồ GPS và thuyết minh tự động.";
            await SaveChatAsync(request.SessionId, request.Message, reply);
            return new ChatbotQueryResponseDto
            {
                Reply = reply,
                Timestamp = timestamp,
                FoundData = true,
                SourceType = "Faq",
                RelatedData = ticketTypes
            };
        }

        if (query.Contains("xe đẩy") || query.Contains("trẻ em") || query.Contains("người khuyết tật"))
        {
            var reply = "Sở thú có dịch vụ mượn xe đẩy trẻ em và xe lăn miễn phí tại Quầy Chăm Sóc Khách Hàng (ngay cổng soát vé). Toàn bộ lối đi đều có đường dốc thoải thuận tiện.";
            await SaveChatAsync(request.SessionId, request.Message, reply);
            return new ChatbotQueryResponseDto
            {
                Reply = reply,
                Timestamp = timestamp,
                FoundData = true,
                SourceType = "Faq"
            };
        }

        // 2. Tra cứu động vật từ DATABASE THẬT
        var animals = await _context.Animals
            .Include(a => a.Species)
            .Include(a => a.Area)
            .Include(a => a.Narrations)
            .ToListAsync();

        var matchedAnimal = animals.FirstOrDefault(a => 
            (!string.IsNullOrEmpty(a.Name) && (query.Contains(a.Name.ToLower()) || a.Name.ToLower().Contains(query))) ||
            (a.Species != null && !string.IsNullOrEmpty(a.Species.Name) && (query.Contains(a.Species.Name.ToLower()) || a.Species.Name.ToLower().Contains(query))) ||
            (!string.IsNullOrEmpty(a.Origin) && query.Contains(a.Origin.ToLower())));

        if (matchedAnimal != null)
        {
            var narrationVi = matchedAnimal.Narrations
                .FirstOrDefault(n => n.Status == NarrationStatus.Published);

            string areaText = matchedAnimal.Area != null ? $"nằm tại **{matchedAnimal.Area.Name}**" : "trong vườn thú";
            string speciesText = matchedAnimal.Species != null ? $"thuộc loài **{matchedAnimal.Species.Name}** ({matchedAnimal.Species.ScientificName})" : "";
            string healthText = !string.IsNullOrWhiteSpace(matchedAnimal.HealthStatus) ? $"\n• Tình trạng sức khỏe: {matchedAnimal.HealthStatus}" : "";
            string originText = !string.IsNullOrWhiteSpace(matchedAnimal.Origin) ? $"\n• Nguồn gốc: {matchedAnimal.Origin}" : "";
            string descText = !string.IsNullOrWhiteSpace(matchedAnimal.Description) ? $"\n• Đặc điểm: {matchedAnimal.Description}" : "";
            string narrationText = narrationVi != null ? $"\n\n🎧 **Thuyết minh:** {narrationVi.Content}" : "";

            var reply = $"🦁 **{matchedAnimal.Name}** {speciesText} hiện {areaText}.{descText}{healthText}{originText}{narrationText}\n\nBạn có thể đến phân khu này để nghe bài thuyết minh tự động khi đến gần chuồng!";

            await SaveChatAsync(request.SessionId, request.Message, reply);
            return new ChatbotQueryResponseDto
            {
                Reply = reply,
                Timestamp = timestamp,
                FoundData = true,
                SourceType = "Animal",
                RelatedData = new
                {
                    animalId = matchedAnimal.AnimalId,
                    name = matchedAnimal.Name,
                    species = matchedAnimal.Species?.Name,
                    area = matchedAnimal.Area?.Name,
                    imageUrl = matchedAnimal.ImageUrl
                }
            };
        }

        // 3. Tra cứu loài từ DATABASE THẬT
        var allSpecies = await _context.Species
            .Include(s => s.Animals)
            .ToListAsync();

        var matchedSpecies = allSpecies.FirstOrDefault(s =>
            (!string.IsNullOrEmpty(s.Name) && (query.Contains(s.Name.ToLower()) || s.Name.ToLower().Contains(query))) ||
            (!string.IsNullOrEmpty(s.ScientificName) && (query.Contains(s.ScientificName.ToLower()) || s.ScientificName.ToLower().Contains(query))));

        if (matchedSpecies != null)
        {
            string animalNames = matchedSpecies.Animals.Any()
                ? $"\n• Các cá thể trong sở thú: {string.Join(", ", matchedSpecies.Animals.Select(a => a.Name))}"
                : "";

            var reply = $"🐾 **{matchedSpecies.Name}** ({matchedSpecies.ScientificName}):\n• Tình trạng bảo tồn IUCN: **{matchedSpecies.ConservationStatus ?? "Ít quan tâm"}**\n• Mô tả: {matchedSpecies.Description ?? "Chưa có mô tả chi tiết."}{animalNames}";

            await SaveChatAsync(request.SessionId, request.Message, reply);
            return new ChatbotQueryResponseDto
            {
                Reply = reply,
                Timestamp = timestamp,
                FoundData = true,
                SourceType = "Species",
                RelatedData = matchedSpecies
            };
        }

        // 4. Tra cứu khu vực từ DATABASE THẬT
        var allAreas = await _context.Areas
            .Include(a => a.Animals)
            .ToListAsync();

        var matchedArea = allAreas.FirstOrDefault(a =>
            (!string.IsNullOrEmpty(a.Name) && (query.Contains(a.Name.ToLower()) || a.Name.ToLower().Contains(query))) ||
            (!string.IsNullOrEmpty(a.Description) && query.Contains(a.Description.ToLower())));

        if (matchedArea != null)
        {
            string animalList = matchedArea.Animals.Any()
                ? $"\n• Các cá thể đang cư trú: {string.Join(", ", matchedArea.Animals.Select(a => a.Name))}"
                : "\n• Hiện chưa có cá thể động vật chuyển về khu vực này.";

            var reply = $"📍 **{matchedArea.Name}**:\n• Mô tả: {matchedArea.Description ?? "Khu vực sinh thái vườn thú."}\n• Tọa độ: {matchedArea.Latitude}, {matchedArea.Longitude} (Bán kính cảm biến: {matchedArea.RadiusMeters}m){animalList}";

            await SaveChatAsync(request.SessionId, request.Message, reply);
            return new ChatbotQueryResponseDto
            {
                Reply = reply,
                Timestamp = timestamp,
                FoundData = true,
                SourceType = "Area",
                RelatedData = matchedArea
            };
        }

        // 5. Tra cứu bài thuyết minh từ DATABASE THẬT
        var allNarrations = await _context.Narrations
            .Include(n => n.Animal)
            .Where(n => n.Status == NarrationStatus.Published)
            .ToListAsync();

        var matchedNarration = allNarrations.FirstOrDefault(n =>
            (!string.IsNullOrEmpty(n.Title) && (query.Contains(n.Title.ToLower()) || n.Title.ToLower().Contains(query))) ||
            (!string.IsNullOrEmpty(n.Content) && (query.Contains(n.Content.ToLower()) || n.Content.ToLower().Contains(query))));

        if (matchedNarration != null)
        {
            var reply = $"🎙️ **{matchedNarration.Title}** (Bài thuyết minh về {matchedNarration.Animal.Name}):\n{matchedNarration.Content}\n\nThời lượng: {matchedNarration.DurationSeconds ?? 60} giây.";

            await SaveChatAsync(request.SessionId, request.Message, reply);
            return new ChatbotQueryResponseDto
            {
                Reply = reply,
                Timestamp = timestamp,
                FoundData = true,
                SourceType = "Narration",
                RelatedData = matchedNarration
            };
        }

        // 6. KHÔNG TỰ BỊA THÔNG TIN nếu dữ liệu không tồn tại trong hệ thống
        var notFoundReply = $"Xin lỗi quý khách, ZooBot chưa tìm thấy thông tin nào về \"{request.Message.Trim()}\" trong cơ sở dữ liệu hiện tại của vườn thú ZooGuide.\n\nQuý khách có thể xem danh sách tại mục **Khám Phá** hoặc liên hệ nhân viên hướng dẫn tại quầy thông tin để được hỗ trợ trực tiếp nhé!";

        await SaveChatAsync(request.SessionId, request.Message, notFoundReply);
        return new ChatbotQueryResponseDto
        {
            Reply = notFoundReply,
            Timestamp = timestamp,
            FoundData = false,
            SourceType = "NotFound"
        };
    }

    private async Task SaveChatAsync(string? sessionIdStr, string userMessage, string botReply)
    {
        if (string.IsNullOrWhiteSpace(sessionIdStr) || !Guid.TryParse(sessionIdStr, out var sessionId))
        {
            return;
        }

        try
        {
            // Kiểm tra session có tồn tại không
            var ticketSession = await _context.TicketSessions.FindAsync(sessionId);
            if (ticketSession == null) return;

            // Tìm hoặc tạo ChatSession
            var chatSession = await _context.ChatSessions
                .FirstOrDefaultAsync(cs => cs.SessionId == sessionId);

            if (chatSession == null)
            {
                chatSession = new ChatSession
                {
                    ChatSessionId = Guid.NewGuid(),
                    SessionId = sessionId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ChatSessions.Add(chatSession);
                await _context.SaveChangesAsync();
            }

            var msgUser = new ChatMessage
            {
                ChatSessionId = chatSession.ChatSessionId,
                SenderType = ChatSenderType.Visitor,
                Content = userMessage,
                CreatedAt = DateTime.UtcNow
            };

            var msgBot = new ChatMessage
            {
                ChatSessionId = chatSession.ChatSessionId,
                SenderType = ChatSenderType.Bot,
                Content = botReply,
                CreatedAt = DateTime.UtcNow.AddSeconds(1)
            };

            _context.ChatMessages.AddRange(msgUser, msgBot);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Không làm ngắt quãng phản hồi chatbot nếu việc lưu chat history gặp trục trặc
        }
    }
}
