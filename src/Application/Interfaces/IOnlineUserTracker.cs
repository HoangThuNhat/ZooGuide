using System;
using System.Collections.Generic;

namespace ZooGuide.Application.Interfaces;

public interface IOnlineUserTracker
{
    /// <summary>
    /// Ghi nhận kết nối từ một client theo deviceId (installationId) và connectionId (tab/connection).
    /// </summary>
    bool RegisterDeviceConnection(string deviceId, string connectionId, bool isTicketBuyer = false, string? buyerKey = null, string? orderCode = null);

    /// <summary>
    /// Gỡ bỏ kết nối từ thiết bị (khi đóng tab hoặc beacon disconnect).
    /// </summary>
    bool RemoveDeviceConnection(string deviceId, string? connectionId = null);

    /// <summary>
    /// Gia hạn hoạt động (Heartbeat) của thiết bị/phiên.
    /// </summary>
    void RefreshHeartbeat(string deviceId, string? connectionId = null, bool? isTicketBuyer = null, string? buyerKey = null, string? orderCode = null);

    /// <summary>
    /// Nâng cấp thiết bị thành người mua vé sau khi thanh toán thành công.
    /// </summary>
    void MarkDeviceAsTicketBuyer(string deviceId, string buyerKey, string? orderCode = null);

    /// <summary>
    /// Lấy số lượng người mua vé độc lập đang online (chỉ tính người đã mua vé thành công, chưa hết timeout).
    /// </summary>
    int GetActiveTicketBuyersCount();

    /// <summary>
    /// Lấy số lượng thiết bị / phiên trình duyệt đang hoạt động (cả người chưa mua và đã mua vé, chưa hết timeout 45s).
    /// </summary>
    int GetActiveDevicesCount();

    /// <summary>
    /// Lấy tổng số kết nối (tabs/connections) đang hoạt động của người mua vé.
    /// </summary>
    int GetActiveBuyerConnectionsCount();

    /// <summary>
    /// Lấy số lượng người dùng online (mặc định trả về ActiveTicketBuyersCount theo quy tắc thống kê).
    /// </summary>
    int GetOnlineUsersCount();

    /// <summary>
    /// Lấy tổng số kết nối đang hoạt động chung.
    /// </summary>
    int GetActiveConnectionsCount();

    /// <summary>
    /// Tương thích ngược: Ghi nhận kết nối từ một client.
    /// </summary>
    bool RegisterConnection(string identifier, string connectionId, bool isTicketBuyer = false);

    /// <summary>
    /// Tương thích ngược: Gỡ bỏ kết nối khi client ngắt kết nối.
    /// </summary>
    bool RemoveConnection(string identifier, string? connectionId = null);

    /// <summary>
    /// Tương thích ngược: Gia hạn hoạt động (Heartbeat) của người dùng.
    /// </summary>
    void RefreshHeartbeat(string identifier, string? connectionId = null, bool? isTicketBuyer = null);

    /// <summary>
    /// Tương thích ngược: Cập nhật trạng thái người mua vé cho session đã tồn tại.
    /// </summary>
    void MarkAsTicketBuyer(string identifier);

    /// <summary>
    /// Xóa toàn bộ trạng thái (hỗ trợ kiểm thử).
    /// </summary>
    void ClearAll();

    /// <summary>
    /// Sự kiện thông báo khi số lượng người mua vé hoặc số lượng thiết bị thay đổi (bao gồm cả khi timeout).
    /// </summary>
    event Action<int, int>? OnCountsChanged;

    int GetActiveTicketBuyerDevicesCount();

    /// <summary>
    /// Lấy danh sách mã thiết bị đang hoạt động trong khoảng thời gian gần nhất.
    /// Khi requireActivityProof = true, chỉ trả về thiết bị đã gửi heartbeat/tương tác thực sự (không chỉ mở socket).
    /// </summary>
    IReadOnlyCollection<string> GetActiveDeviceIds(int withinMinutes = 5, bool requireActivityProof = false);
}
