# HỆ THỐNG 16 SƠ ĐỒ HOẠT ĐỘNG (UML ACTIVITY DIAGRAMS) - DỰ ÁN ZOOGUIDE
## CHUẨN THIẾT KẾ 2 SWIMLANES: NGƯỜI DÙNG | HỆ THỐNG

> **Sản phẩm phục vụ báo cáo môn học Phân tích & Thiết kế Hướng đối tượng (OOAD)**  
> **Được phân tích, đối soát trực tiếp từ toàn bộ source code dự án ZooGuide và thiết kế theo mô hình 2 Swimlanes**

---

## 1. Cấu trúc thư mục bàn giao

Toàn bộ sản phẩm được tổ chức chuyên nghiệp trong thư mục `ZooGuide_Activity_Diagrams/`:

```text
ZooGuide_Activity_Diagrams/
│
├── ZooGuide_16_Activity_Diagrams.drawio     # FILE TỔNG HỢP DUY NHẤT CHỨA ĐẦY ĐỦ 16 PAGE (2 SWIMLANES/PAGE)
│
├── Individual_Diagrams/                    # 16 FILE DRAW.IO ĐỘC LẬP TƯƠNG ỨNG TỪNG NHÓM CHỨC NĂNG
│   ├── 01_Species_Management.drawio
│   ├── 02_Animal_Management.drawio
│   ├── 03_Area_Management.drawio
│   ├── 04_POI_Management.drawio
│   ├── 05_Ticket_Management.drawio
│   ├── 06_Ticket_Type_Management.drawio
│   ├── 07_Ticket_Session_Management.drawio
│   ├── 08_Audio_Guide_Management.drawio
│   ├── 09_Dashboard_Statistics.drawio
│   ├── 10_Device_Management.drawio
│   ├── 11_Activity_Log_Management.drawio
│   ├── 12_Language_Management.drawio
│   ├── 13_Payment_Processing.drawio
│   ├── 14_Zoo_Information_Lookup.drawio
│   ├── 15_Zoo_Navigation.drawio
│   └── 16_Ticket_Purchase_And_Usage.drawio
│
├── Preview/                                # FILE HÌNH ẢNH XEM TRƯỚC VÀ CHÈN BÁO CÁO WORD/PDF
│   ├── PNG/                                # 16 file ảnh PNG độ nét cao (1600px width rasterized)
│   └── SVG/                                # 16 file vector SVG chuẩn sắc nét tuyệt đối
│
└── Documentation/                          # TÀI LIỆU THUYẾT MINH VÀ ÁNH XẠ SOURCE CODE
    ├── README.md                           # Hướng dẫn tổng quan, quy chuẩn 2 Swimlanes và cách sử dụng
    └── Source_Code_Mapping.md              # Bảng đối soát chi tiết từng Controller, Service, DB tables
```

---

## 2. Nguyên tắc phân chia 2 Swimlanes (2 Cột) chuẩn OOAD

Để đáp ứng chính xác yêu cầu báo cáo OOAD phân tích ca sử dụng (Use Case Analysis), toàn bộ 16 sơ đồ được thiết kế với **đúng 2 Swimlane**:

| Cột (Swimlane) | Phạm vi & Trách nhiệm trong sơ đồ | Ví dụ hành động cụ thể |
| :--- | :--- | :--- |
| **1. Người dùng (User)**<br>*(Administrator / Visitor / Staff)* | Chứa toàn bộ các hành động, quyết định do con người trực tiếp thực hiện trên giao diện. | • Truy cập chức năng / màn hình<br>• Chọn đối tượng từ danh sách<br>• Nhập dữ liệu biểu mẫu (Form input)<br>• Nhấn nút chức năng (Thêm, Sửa, Xóa, Lưu, Hủy)<br>• Quét mã QR, kích hoạt phiên vé<br>• Bật/Tắt phát âm thanh thuyết minh<br>• Chọn cổng vào / điểm đến dẫn đường |
| **2. Hệ thống (System)**<br>*(Gộp UI, API, Service & Database)* | Chứa toàn bộ các xử lý logic, nghiệp vụ tự động của hệ thống.<br>*(Gộp chung Frontend, Backend API, Application Service, Repository, Database PostgreSQL và Supabase Storage)* | • Hiển thị giao diện, biểu mẫu, modal<br>• Kiểm tra tính hợp lệ dữ liệu (Validation)<br>• Rẽ nhánh kiểm tra (Decision Node)<br>• Truy vấn cơ sở dữ liệu (Query)<br>• Lưu trữ / cập nhật trạng thái (Insert/Update)<br>• Xử lý thanh toán VietQR & Webhook<br>• Tính toán đường đi ngắn nhất (Dijkstra)<br>• Trả kết quả và thông báo (Alert/Toast) |

> [!IMPORTANT]
> **Tuyệt đối không phân tách các Swimlane riêng lẻ** cho Frontend, Backend, Database, Controller hay Repository. Toàn bộ hạ tầng công nghệ được đóng gói nhất quán bên trong cột **Hệ thống (System)** để người đọc báo cáo nắm bắt trọn vẹn tương tác giữa Con người và Hệ thống.

---

## 3. Danh sách 16 Sơ đồ Hoạt động (Activity Diagrams)

| STT | Tên Page & Tên File | Nhóm chức năng nghiệp vụ | Tác nhân Người dùng (Lane 1) | Swimlane Hệ thống (Lane 2) |
| :---: | :--- | :--- | :--- | :--- |
| **01** | `01 - Species Management` | Quản lý loài động vật | `Người dùng (Administrator)` | `Hệ thống (System)` |
| **02** | `02 - Animal Management` | Quản lý động vật & sức khỏe thú y | `Người dùng (Administrator / Staff)` | `Hệ thống (System)` |
| **03** | `03 - Area Management` | Quản lý phân khu & tọa độ bản đồ | `Người dùng (Administrator)` | `Hệ thống (System)` |
| **04** | `04 - POI Management` | Quản lý điểm tham quan, di tích | `Người dùng (Administrator)` | `Hệ thống (System)` |
| **05** | `05 - Ticket Management` | Quản lý vé tham quan & đổi trạng thái | `Người dùng (Administrator / Staff)` | `Hệ thống (System)` |
| **06** | `06 - Ticket Type Management` | Quản lý hạng vé, đơn giá & thời lượng | `Người dùng (Administrator)` | `Hệ thống (System)` |
| **07** | `07 - Ticket Session Management` | Quản lý vòng đời phiên vé & kích hoạt | `Người dùng (Visitor / Administrator)` | `Hệ thống (System)` |
| **08** | `08 - Audio Guide Management` | Quản lý & phát thuyết minh âm thanh | `Người dùng (Validated Visitor)` | `Hệ thống (System)` |
| **09** | `09 - Dashboard Statistics` | Thống kê chỉ số vận hành & báo cáo | `Người dùng (Administrator)` | `Hệ thống (System)` |
| **10** | `10 - Device Management` | Giám sát thiết bị trực tuyến & Heartbeat | `Người dùng (Visitor / Administrator)` | `Hệ thống (System)` |
| **11** | `11 - Activity Log Management` | Nhật ký thao tác & lịch sử kiểm toán | `Người dùng (Administrator)` | `Hệ thống (System)` |
| **12** | `12 - Language Management` | Quản lý & chuyển đổi ngôn ngữ đa quốc gia | `Người dùng (Visitor / User)` | `Hệ thống (System)` |
| **13** | `13 - Payment Processing` | Quy trình thanh toán VietQR & Sandbox | `Người dùng (Visitor)` | `Hệ thống (System)` |
| **14** | `14 - Zoo Information Lookup` | Tra cứu danh mục, bộ lọc IUCN & sinh cảnh | `Người dùng (Visitor)` | `Hệ thống (System)` |
| **15** | `15 - Zoo Navigation` | Dẫn đường đồ thị đường bộ Dijkstra | `Người dùng (Visitor)` | `Hệ thống (System)` |
| **16** | `16 - Ticket Purchase and Usage` | Hành trình khách hàng trọn gói từ mua đến trải nghiệm | `Người dùng (Visitor -> Validated Visitor)` | `Hệ thống (System)` |

---

## 4. Quy chuẩn Trình bày UML Học thuật (Academic Style)

1. **Tuân thủ chuẩn UML 2.x:**
   - **Initial Node:** Vòng tròn đen đặc (Black Circle, radius 14px) đánh dấu điểm bắt đầu luồng quy trình.
   - **Activity Final Node:** Vòng tròn kép với điểm đen ở tâm (Double Circle with Black Center) đánh dấu điểm kết thúc.
   - **Action Nodes:** Hình chữ nhật bo tròn góc nhẹ (`rounded=1;arcSize=20`), chứa động từ hành động cụ thể, cô đọng.
   - **Decision / Merge Nodes:** Hình thoi (`rhombus`), có nhãn câu hỏi kiểm tra và các nhánh điều kiện rõ ràng: `[Hợp lệ]`, `[Không hợp lệ]`, `[Thành công]`, `[Thất bại]`, `[Chưa hết hạn]`, `[Hết hạn]`...
   - **Fork / Join Nodes:** Thanh ngang đặc đồng bộ các luồng công việc thực thi song song.
   - **Control Flow:** Đường nối trực giao vuông góc (`orthogonalEdgeStyle`) có mũi tên nhọn chỉ hướng luồng xử lý.

2. **Quy chuẩn thẩm mỹ văn bản học thuật (Academic B&W):**
   - **Màu nền:** Trắng tinh khiết (`#FFFFFF`).
   - **Đường viền:** Đen (`#000000`, nét đơn 1.2px - 1.5px).
   - **Màu chữ:** Đen (`#000000`), font chữ Arial / Helvetica dễ đọc, kích thước chữ 11px - 13px đồng nhất.
   - **Không trang trí:** Tuyệt đối không dùng màu sắc sặc sỡ, gradient hay hiệu ứng đổ bóng.
   - **Bố cục dọc (Top-Down):** Tối ưu hóa kích thước trang (chiều rộng ~800px, chiều cao cân đối theo số bước), đảm bảo khi chèn vào trang Word/PDF khổ A4 chữ hiển thị rõ nét, không bị thu nhỏ quá mức.

---

## 5. Hướng dẫn Mở và Chỉnh sửa trên Draw.io (diagrams.net)

### Cách 1: Mở trực tiếp trên trình duyệt Web (Không cần cài đặt phần mềm)
1. Truy cập trang web chính thức: [https://app.diagrams.net](https://app.diagrams.net)
2. Nhấn chọn **Open Existing Diagram** (Mở sơ đồ có sẵn).
3. Chọn file `ZooGuide_Activity_Diagrams/ZooGuide_16_Activity_Diagrams.drawio`.
4. Giao diện diagrams.net sẽ hiển thị thanh 16 Tab (16 Page) ở cạnh dưới màn hình. Bạn có thể nhấn chuyển tab để xem và chỉnh sửa từng Action, Decision, Text hoặc kéo thả đường nối tùy ý.

### Cách 2: Mở từng file riêng lẻ
- Trong thư mục `Individual_Diagrams/`, bạn có thể mở riêng bất kỳ file nào từ `01_Species_Management.drawio` đến `16_Ticket_Purchase_And_Usage.drawio`.

### Cách 3: Chèn trực tiếp vào Báo cáo Word / Báo cáo môn học
- Thư mục `Preview/PNG/` chứa 16 file ảnh PNG rasterized với độ phân giải cao (1600px width), khi kéo thả vào Microsoft Word hoặc Google Docs sẽ hiển thị chữ và đường nét cực kỳ sắc nét.
- Thư mục `Preview/SVG/` chứa 16 file vector SVG phục vụ biên dịch tài liệu LaTeX hoặc phóng to vô hạn mà không suy giảm chất lượng.
