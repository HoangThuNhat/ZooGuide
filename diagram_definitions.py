# -*- coding: utf-8 -*-
"""
ZooGuide 16 UML Activity Diagram Specifications (2-SWIMLANE EDITION)
Exactly 2 Swimlanes per diagram:
- Lane 0: Người dùng (User / Administrator / Visitor / Staff)
- Lane 1: Hệ thống (System - aggregate of Frontend, Backend, Services, Database)

Academic UML 2.x Black & White Style.
"""

DIAGRAMS = []

# ==============================================================================
# DIAGRAM 01: Species Management
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_01",
    "name": "01 - Species Management",
    "filename": "01_Species_Management",
    "title": "01. QUẢN LÝ LOÀI ĐỘNG VẬT (SPECIES MANAGEMENT)",
    "subtitle": "Quy trình xem danh sách, thêm mới, cập nhật thông tin và kiểm tra ràng buộc khi xóa loài động vật",
    "lanes": [
        ("Người dùng (Administrator)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d1_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d1_act_open", "type": "action", "lane": 0, "y": 170, "val": "Truy cập chức năng Quản lý loài động vật"},
        {"id": "d1_act_display", "type": "action", "lane": 1, "y": 170, "val": "Tiếp nhận yêu cầu, truy vấn bảng SPECIES và hiển thị danh sách các loài động vật"},
        {"id": "d1_dec_choice", "type": "decision", "lane": 0, "y": 240, "val": "Chọn nghiệp vụ quản lý?"},

        # Branch 1: Add new
        {"id": "d1_act_in_new", "type": "action", "lane": 0, "y": 320, "val": "Chọn 'Thêm loài mới' -> Nhập thông tin: Tên tiếng Việt, Tên khoa học, IUCN, Sinh cảnh, Khẩu phần, Ảnh -> Bấm 'Lưu'"},
        {"id": "d1_act_val_new", "type": "action", "lane": 1, "y": 320, "val": "Kiểm tra tính hợp lệ dữ liệu (Tên loài & Tên khoa học bắt buộc, kiểm tra trùng lặp)"},
        {"id": "d1_dec_val_new", "type": "decision", "lane": 1, "y": 390, "val": "Dữ liệu hợp lệ?"},
        {"id": "d1_act_err_val", "type": "action", "lane": 1, "y": 460, "val": "Thông báo lỗi thiếu trường bắt buộc hoặc trùng tên khoa học"},
        {"id": "d1_act_save_new", "type": "action", "lane": 1, "y": 520, "val": "Lưu bản ghi mới vào bảng SPECIES, hiển thị thông báo thành công và cập nhật bảng danh sách"},

        # Branch 2: Update
        {"id": "d1_act_sel_edit", "type": "action", "lane": 0, "y": 610, "val": "Chọn loài từ danh sách, bấm 'Chỉnh sửa' -> Sửa thông tin -> Bấm 'Lưu thay đổi'"},
        {"id": "d1_act_upd_db", "type": "action", "lane": 1, "y": 610, "val": "Kiểm tra ID tồn tại, cập nhật bản ghi trong bảng SPECIES và thông báo cập nhật thành công"},

        # Branch 3: Delete
        {"id": "d1_act_sel_del", "type": "action", "lane": 0, "y": 700, "val": "Chọn loài cần xóa, bấm 'Xóa' và xác nhận trên hộp thoại"},
        {"id": "d1_act_chk_fk", "type": "action", "lane": 1, "y": 700, "val": "Kiểm tra ràng buộc khóa ngoại: Kiểm tra cá thể động vật trong bảng ANIMALS"},
        {"id": "d1_dec_fk", "type": "decision", "lane": 1, "y": 770, "val": "Đang có động vật thuộc loài này?"},
        {"id": "d1_act_err_fk", "type": "action", "lane": 1, "y": 840, "val": "Từ chối xóa và hiển thị cảnh báo: Không thể xóa loài đang chứa động vật"},
        {"id": "d1_act_del_ok", "type": "action", "lane": 1, "y": 910, "val": "Xóa bản ghi khỏi bảng SPECIES, xóa dòng khỏi danh sách và hiển thị thông báo thành công"},

        {"id": "d1_merge", "type": "decision", "lane": 0, "y": 980, "val": "Hợp nhất"},
        {"id": "d1_end", "type": "end", "lane": 0, "y": 1040, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d1_start", "dst": "d1_act_open"},
        {"src": "d1_act_open", "dst": "d1_act_display"},
        {"src": "d1_act_display", "dst": "d1_dec_choice", "waypoints": [(610, 267), (220, 267)]},

        {"src": "d1_dec_choice", "dst": "d1_act_in_new", "label": "[Thêm mới]"},
        {"src": "d1_act_in_new", "dst": "d1_act_val_new"},
        {"src": "d1_act_val_new", "dst": "d1_dec_val_new"},
        {"src": "d1_dec_val_new", "dst": "d1_act_err_val", "label": "[Không hợp lệ]"},
        {"src": "d1_act_err_val", "dst": "d1_act_in_new", "waypoints": [(465, 485), (350, 485), (350, 345)]},
        {"src": "d1_dec_val_new", "dst": "d1_act_save_new", "label": "[Hợp lệ]"},
        {"src": "d1_act_save_new", "dst": "d1_merge", "waypoints": [(610, 580), (610, 1007), (300, 1007)]},

        {"src": "d1_dec_choice", "dst": "d1_act_sel_edit", "label": "[Cập nhật]", "waypoints": [(140, 267), (60, 267), (60, 635), (95, 635)]},
        {"src": "d1_act_sel_edit", "dst": "d1_act_upd_db"},
        {"src": "d1_act_upd_db", "dst": "d1_merge", "waypoints": [(610, 670), (610, 1007), (300, 1007)]},

        {"src": "d1_dec_choice", "dst": "d1_act_sel_del", "label": "[Xóa loài]", "waypoints": [(140, 267), (45, 267), (45, 725), (95, 725)]},
        {"src": "d1_act_sel_del", "dst": "d1_act_chk_fk"},
        {"src": "d1_act_chk_fk", "dst": "d1_dec_fk"},
        {"src": "d1_dec_fk", "dst": "d1_act_err_fk", "label": "[Có động vật liên kết]"},
        {"src": "d1_act_err_fk", "dst": "d1_merge", "waypoints": [(465, 865), (220, 865)]},
        {"src": "d1_dec_fk", "dst": "d1_act_del_ok", "label": "[Không có liên kết]"},
        {"src": "d1_act_del_ok", "dst": "d1_merge", "waypoints": [(465, 935), (220, 935)]},
        {"src": "d1_merge", "dst": "d1_end"}
    ]
})

# ==============================================================================
# DIAGRAM 02: Animal Management
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_02",
    "name": "02 - Animal Management",
    "filename": "02_Animal_Management",
    "title": "02. QUẢN LÝ ĐỘNG VẬT (ANIMAL MANAGEMENT)",
    "subtitle": "Quy trình xem danh sách hồ sơ, thêm cá thể, phân bổ chuồng, cập nhật sức khỏe và xóa động vật",
    "lanes": [
        ("Người dùng (Administrator / Staff)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d2_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d2_act_open", "type": "action", "lane": 0, "y": 170, "val": "Truy cập phân hệ Quản lý động vật"},
        {"id": "d2_act_display", "type": "action", "lane": 1, "y": 170, "val": "Truy vấn JOIN bảng ANIMALS, SPECIES, ENCLOSURES, AREAS và hiển thị danh sách hồ sơ cá thể động vật"},
        {"id": "d2_dec_action", "type": "decision", "lane": 0, "y": 240, "val": "Chọn nghiệp vụ quản lý?"},

        # Branch 1: Add new
        {"id": "d2_act_in_new", "type": "action", "lane": 0, "y": 320, "val": "Bấm 'Thêm động vật' -> Nhập tên cá thể, giới tính; chọn Loài (SpeciesId), Phân khu (AreaId), Chuồng (EnclosureId) -> Bấm 'Lưu'"},
        {"id": "d2_act_val_new", "type": "action", "lane": 1, "y": 320, "val": "Kiểm tra tính tồn tại của Species, Area, Enclosure trong cơ sở dữ liệu"},
        {"id": "d2_dec_val_new", "type": "decision", "lane": 1, "y": 390, "val": "Khóa ngoại hợp lệ?"},
        {"id": "d2_act_err_val", "type": "action", "lane": 1, "y": 460, "val": "Hiển thị thông báo lỗi: Dữ liệu liên kết loài, khu vực hoặc chuồng không hợp lệ"},
        {"id": "d2_act_save_new", "type": "action", "lane": 1, "y": 520, "val": "Sinh mã cá thể (code), INSERT vào bảng ANIMALS -> Thông báo thêm thành công và nạp lại danh sách"},

        # Branch 2: Update & Move Enclosure
        {"id": "d2_act_sel_upd", "type": "action", "lane": 0, "y": 610, "val": "Chọn cá thể, chỉnh sửa thông tin hoặc chọn chuồng nuôi mới -> Bấm 'Cập nhật'"},
        {"id": "d2_act_save_upd", "type": "action", "lane": 1, "y": 610, "val": "Xác thực dữ liệu, UPDATE bản ghi ANIMALS trong Database và hiển thị thông báo cập nhật thành công"},

        # Branch 3: Health Log Update
        {"id": "d2_act_in_health", "type": "action", "lane": 0, "y": 700, "val": "Thú y ghi nhận kết quả khám: Tình trạng sức khỏe, Cân nặng, Thân nhiệt, Bác sĩ khám -> Bấm 'Lưu hồ sơ'"},
        {"id": "d2_act_save_health", "type": "action", "lane": 1, "y": 700, "val": "Kiểm tra số đo sinh học, UPDATE trường HealthStatus, LastHealthCheckAt vào bảng ANIMALS và thông báo thành công"},

        # Branch 4: Delete animal
        {"id": "d2_act_sel_del", "type": "action", "lane": 0, "y": 790, "val": "Chọn cá thể, bấm 'Xóa' và xác nhận trên hộp thoại"},
        {"id": "d2_act_del_db", "type": "action", "lane": 1, "y": 790, "val": "Kiểm tra ràng buộc lịch sử khám và thuyết minh -> Xóa hoặc chuyển Status = Inactive trong DB -> Thông báo thành công"},

        {"id": "d2_merge", "type": "decision", "lane": 0, "y": 860, "val": "Hợp nhất"},
        {"id": "d2_end", "type": "end", "lane": 0, "y": 920, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d2_start", "dst": "d2_act_open"},
        {"src": "d2_act_open", "dst": "d2_act_display"},
        {"src": "d2_act_display", "dst": "d2_dec_action", "waypoints": [(610, 267), (220, 267)]},

        {"src": "d2_dec_action", "dst": "d2_act_in_new", "label": "[Thêm cá thể]"},
        {"src": "d2_act_in_new", "dst": "d2_act_val_new"},
        {"src": "d2_act_val_new", "dst": "d2_dec_val_new"},
        {"src": "d2_dec_val_new", "dst": "d2_act_err_val", "label": "[Không hợp lệ]"},
        {"src": "d2_act_err_val", "dst": "d2_merge", "waypoints": [(465, 485), (350, 485), (350, 887), (220, 887)]},
        {"src": "d2_dec_val_new", "dst": "d2_act_save_new", "label": "[Hợp lệ]"},
        {"src": "d2_act_save_new", "dst": "d2_merge", "waypoints": [(610, 580), (610, 887), (300, 887)]},

        {"src": "d2_dec_action", "dst": "d2_act_sel_upd", "label": "[Cập nhật/Đổi chuồng]", "waypoints": [(140, 267), (60, 267), (60, 635), (95, 635)]},
        {"src": "d2_act_sel_upd", "dst": "d2_act_save_upd"},
        {"src": "d2_act_save_upd", "dst": "d2_merge", "waypoints": [(610, 670), (610, 887), (300, 887)]},

        {"src": "d2_dec_action", "dst": "d2_act_in_health", "label": "[Hồ sơ thú y]", "waypoints": [(140, 267), (45, 267), (45, 725), (95, 725)]},
        {"src": "d2_act_in_health", "dst": "d2_act_save_health"},
        {"src": "d2_act_save_health", "dst": "d2_merge", "waypoints": [(610, 760), (610, 887), (300, 887)]},

        {"src": "d2_dec_action", "dst": "d2_act_sel_del", "label": "[Xóa cá thể]", "waypoints": [(140, 267), (30, 267), (30, 815), (95, 815)]},
        {"src": "d2_act_sel_del", "dst": "d2_act_del_db"},
        {"src": "d2_act_del_db", "dst": "d2_merge", "waypoints": [(465, 815), (220, 860)]},
        {"src": "d2_merge", "dst": "d2_end"}
    ]
})

# ==============================================================================
# DIAGRAM 03: Area Management
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_03",
    "name": "03 - Area Management",
    "filename": "03_Area_Management",
    "title": "03. QUẢN LÝ KHU VỰC (AREA MANAGEMENT)",
    "subtitle": "Quy trình xem danh sách phân khu, thêm mới, cấu hình tọa độ GPS/bản đồ và xóa khu vực",
    "lanes": [
        ("Người dùng (Administrator)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d3_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d3_act_open", "type": "action", "lane": 0, "y": 170, "val": "Truy cập màn hình Quản lý khu vực"},
        {"id": "d3_act_display", "type": "action", "lane": 1, "y": 170, "val": "Truy vấn bảng AREAS và ENCLOSURES -> Hiển thị danh sách phân khu, tọa độ GPS và số lượng chuồng"},
        {"id": "d3_dec_action", "type": "decision", "lane": 0, "y": 240, "val": "Chọn thao tác khu vực?"},

        # Branch 1: Add Area
        {"id": "d3_act_in_new", "type": "action", "lane": 0, "y": 320, "val": "Nhập: Mã phân khu (Code: A, B, C...), Tên khu, Mô tả, Tọa độ Lat/Lng, Bán kính, Tọa độ mapX/mapY -> Bấm 'Tạo khu vực'"},
        {"id": "d3_act_val_code", "type": "action", "lane": 1, "y": 320, "val": "Kiểm tra tính hợp lệ dữ liệu và kiểm tra trùng lặp Mã phân khu (Code)"},
        {"id": "d3_dec_code_dup", "type": "decision", "lane": 1, "y": 390, "val": "Mã phân khu đã tồn tại?"},
        {"id": "d3_act_err_code", "type": "action", "lane": 1, "y": 460, "val": "Hiển thị thông báo lỗi: Mã phân khu đã tồn tại trên hệ thống"},
        {"id": "d3_act_save_area", "type": "action", "lane": 1, "y": 520, "val": "INSERT bản ghi mới vào bảng AREAS -> Thông báo thêm thành công và nạp lại danh sách"},

        # Branch 2: Update Area
        {"id": "d3_act_sel_edit", "type": "action", "lane": 0, "y": 610, "val": "Chọn phân khu, điều chỉnh tên, mô tả hoặc tọa độ định vị -> Bấm 'Lưu'"},
        {"id": "d3_act_save_upd", "type": "action", "lane": 1, "y": 610, "val": "Kiểm tra ID tồn tại, UPDATE bản ghi trong bảng AREAS và thông báo cập nhật thành công"},

        # Branch 3: Delete Area
        {"id": "d3_act_sel_del", "type": "action", "lane": 0, "y": 700, "val": "Chọn phân khu, bấm 'Xóa' và xác nhận trên hộp thoại"},
        {"id": "d3_act_chk_enc", "type": "action", "lane": 1, "y": 700, "val": "Kiểm tra ràng buộc chuồng nuôi trong bảng ENCLOSURES"},
        {"id": "d3_dec_has_enc", "type": "decision", "lane": 1, "y": 770, "val": "Phân khu còn chứa chuồng nuôi?"},
        {"id": "d3_act_err_enc", "type": "action", "lane": 1, "y": 840, "val": "Từ chối xóa và hiển thị cảnh báo: Không thể xóa khu vực đang chứa chuồng trại"},
        {"id": "d3_act_del_ok", "type": "action", "lane": 1, "y": 910, "val": "DELETE bản ghi khỏi bảng AREAS -> Thông báo xóa thành công và nạp lại danh sách"},

        {"id": "d3_merge", "type": "decision", "lane": 0, "y": 980, "val": "Hợp nhất"},
        {"id": "d3_end", "type": "end", "lane": 0, "y": 1040, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d3_start", "dst": "d3_act_open"},
        {"src": "d3_act_open", "dst": "d3_act_display"},
        {"src": "d3_act_display", "dst": "d3_dec_action", "waypoints": [(610, 267), (220, 267)]},

        {"src": "d3_dec_action", "dst": "d3_act_in_new", "label": "[Thêm khu vực]"},
        {"src": "d3_act_in_new", "dst": "d3_act_val_code"},
        {"src": "d3_act_val_code", "dst": "d3_dec_code_dup"},
        {"src": "d3_dec_code_dup", "dst": "d3_act_err_code", "label": "[Đã tồn tại]"},
        {"src": "d3_act_err_code", "dst": "d3_act_in_new", "waypoints": [(465, 485), (350, 485), (350, 345)]},
        {"src": "d3_dec_code_dup", "dst": "d3_act_save_area", "label": "[Chưa tồn tại]"},
        {"src": "d3_act_save_area", "dst": "d3_merge", "waypoints": [(610, 580), (610, 1007), (300, 1007)]},

        {"src": "d3_dec_action", "dst": "d3_act_sel_edit", "label": "[Cập nhật]", "waypoints": [(140, 267), (60, 267), (60, 635), (95, 635)]},
        {"src": "d3_act_sel_edit", "dst": "d3_act_save_upd"},
        {"src": "d3_act_save_upd", "dst": "d3_merge", "waypoints": [(610, 670), (610, 1007), (300, 1007)]},

        {"src": "d3_dec_action", "dst": "d3_act_sel_del", "label": "[Xóa khu vực]", "waypoints": [(140, 267), (45, 267), (45, 725), (95, 725)]},
        {"src": "d3_act_sel_del", "dst": "d3_act_chk_enc"},
        {"src": "d3_act_chk_enc", "dst": "d3_dec_has_enc"},
        {"src": "d3_dec_has_enc", "dst": "d3_act_err_enc", "label": "[Còn chuồng nuôi]"},
        {"src": "d3_act_err_enc", "dst": "d3_merge", "waypoints": [(465, 865), (220, 865)]},
        {"src": "d3_dec_has_enc", "dst": "d3_act_del_ok", "label": "[Khu vực trống]"},
        {"src": "d3_act_del_ok", "dst": "d3_merge", "waypoints": [(465, 935), (220, 935)]},
        {"src": "d3_merge", "dst": "d3_end"}
    ]
})

# ==============================================================================
# DIAGRAM 04: POI Management
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_04",
    "name": "04 - POI Management",
    "filename": "04_POI_Management",
    "title": "04. QUẢN LÝ ĐIỂM THAM QUAN (POI MANAGEMENT)",
    "subtitle": "Quy trình quản lý điểm mốc di tích, kiểm định tọa độ WGS84, gắn bài thuyết minh và cập nhật trạng thái",
    "lanes": [
        ("Người dùng (Administrator)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d4_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d4_act_open", "type": "action", "lane": 0, "y": 170, "val": "Truy cập mục Quản lý điểm tham quan (POI)"},
        {"id": "d4_act_display", "type": "action", "lane": 1, "y": 170, "val": "Truy vấn bảng POINTS_OF_INTEREST và POI_NARRATIONS -> Hiển thị danh sách điểm tham quan, tọa độ Lat/Lng và trạng thái kiểm định"},
        {"id": "d4_dec_action", "type": "decision", "lane": 0, "y": 240, "val": "Chọn nghiệp vụ POI?"},

        # Branch 1: Add POI
        {"id": "d4_act_in_new", "type": "action", "lane": 0, "y": 320, "val": "Nhập Tên POI, Thể loại (gate, landmark...), Mô tả, Tọa độ Lat/Lng, Phân khu -> Bấm 'Tạo POI'"},
        {"id": "d4_act_save_poi", "type": "action", "lane": 1, "y": 320, "val": "Validate tọa độ WGS84, INSERT bản ghi vào bảng POINTS_OF_INTEREST và vẽ Marker trên bản đồ"},

        # Branch 2: Verify Coordinates
        {"id": "d4_act_in_verify", "type": "action", "lane": 0, "y": 410, "val": "Chọn POI đã khảo sát GPS thực địa -> Bấm 'Xác nhận kiểm định tọa độ'"},
        {"id": "d4_act_save_verify", "type": "action", "lane": 1, "y": 410, "val": "UPDATE trường IsVerified = true, lưu nguồn khảo sát vào Database và cập nhật huy hiệu 'Đã kiểm định' trên giao diện"},

        # Branch 3: Manage POI Narration
        {"id": "d4_act_in_nar", "type": "action", "lane": 0, "y": 500, "val": "Nhập kịch bản văn bản, chọn file âm thanh .mp3 thuyết minh POI -> Bấm 'Tải lên'"},
        {"id": "d4_act_save_nar", "type": "action", "lane": 1, "y": 500, "val": "Upload file âm thanh lên Supabase Storage và lưu metadata vào bảng POI_NARRATIONS -> Thông báo thành công"},

        # Branch 4: Toggle Status / Delete
        {"id": "d4_act_sel_status", "type": "action", "lane": 0, "y": 590, "val": "Chọn Bật/Tắt hoạt động (Active/Inactive) hoặc bấm Xóa điểm tham quan"},
        {"id": "d4_act_save_status", "type": "action", "lane": 1, "y": 590, "val": "UPDATE trạng thái IsActive hoặc DELETE bản ghi khỏi POINTS_OF_INTEREST -> Làm mới bảng danh sách"},

        {"id": "d4_merge", "type": "decision", "lane": 0, "y": 670, "val": "Hợp nhất"},
        {"id": "d4_end", "type": "end", "lane": 0, "y": 730, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d4_start", "dst": "d4_act_open"},
        {"src": "d4_act_open", "dst": "d4_act_display"},
        {"src": "d4_act_display", "dst": "d4_dec_action", "waypoints": [(610, 267), (220, 267)]},

        {"src": "d4_dec_action", "dst": "d4_act_in_new", "label": "[Thêm POI]"},
        {"src": "d4_act_in_new", "dst": "d4_act_save_poi"},
        {"src": "d4_act_save_poi", "dst": "d4_merge", "waypoints": [(610, 380), (610, 697), (300, 697)]},

        {"src": "d4_dec_action", "dst": "d4_act_in_verify", "label": "[Kiểm định GPS]", "waypoints": [(140, 267), (60, 267), (60, 435), (95, 435)]},
        {"src": "d4_act_in_verify", "dst": "d4_act_save_verify"},
        {"src": "d4_act_save_verify", "dst": "d4_merge", "waypoints": [(610, 470), (610, 697), (300, 697)]},

        {"src": "d4_dec_action", "dst": "d4_act_in_nar", "label": "[Thuyết minh POI]", "waypoints": [(140, 267), (45, 267), (45, 525), (95, 525)]},
        {"src": "d4_act_in_nar", "dst": "d4_act_save_nar"},
        {"src": "d4_act_save_nar", "dst": "d4_merge", "waypoints": [(610, 560), (610, 697), (300, 697)]},

        {"src": "d4_dec_action", "dst": "d4_act_sel_status", "label": "[Đổi trạng thái/Xóa]", "waypoints": [(140, 267), (30, 267), (30, 615), (95, 615)]},
        {"src": "d4_act_sel_status", "dst": "d4_act_save_status"},
        {"src": "d4_act_save_status", "dst": "d4_merge", "waypoints": [(465, 615), (220, 670)]},
        {"src": "d4_merge", "dst": "d4_end"}
    ]
})

# ==============================================================================
# DIAGRAM 05: Ticket Management
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_05",
    "name": "05 - Ticket Management",
    "filename": "05_Ticket_Management",
    "title": "05. QUẢN LÝ VÉ (TICKET MANAGEMENT)",
    "subtitle": "Quy trình tra cứu vé, phát hành vé thủ công/tại quầy, đổi trạng thái và thu hồi vé",
    "lanes": [
        ("Người dùng (Administrator / Staff)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d5_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d5_act_open", "type": "action", "lane": 0, "y": 170, "val": "Truy cập phân hệ Quản lý vé"},
        {"id": "d5_act_display", "type": "action", "lane": 1, "y": 170, "val": "Truy vấn bảng TICKETS kết hợp TICKET_TYPES -> Hiển thị danh sách vé: Mã vé, Khách hàng, Loại vé, Hạn dùng, Trạng thái"},
        {"id": "d5_dec_action", "type": "decision", "lane": 0, "y": 240, "val": "Chọn nghiệp vụ quản lý vé?"},

        # Branch 1: Manual Issue
        {"id": "d5_act_in_new", "type": "action", "lane": 0, "y": 320, "val": "Chọn Loại vé, nhập Tên khách hàng, SĐT, Số lượng vé, Hạn dùng tùy chỉnh -> Bấm 'Phát hành vé'"},
        {"id": "d5_act_gen_code", "type": "action", "lane": 1, "y": 320, "val": "Kiểm tra loại vé và sinh mã vé ngẫu nhiên bảo mật (TKT-xxxxxxxx)"},
        {"id": "d5_dec_dup", "type": "decision", "lane": 1, "y": 390, "val": "Trùng mã vé trong DB?"},
        {"id": "d5_act_save_tkt", "type": "action", "lane": 1, "y": 460, "val": "INSERT bản ghi vé với Status = Valid vào bảng TICKETS -> Xuất mã QR vé điện tử phục vụ in hoặc gửi khách"},

        # Branch 2: Update Status
        {"id": "d5_act_sel_status", "type": "action", "lane": 0, "y": 550, "val": "Chọn vé, chọn trạng thái mới: Valid, Used, Expired, Cancelled, Locked -> Bấm 'Cập nhật'"},
        {"id": "d5_act_save_status", "type": "action", "lane": 1, "y": 550, "val": "Validate quy tắc chuyển đổi và UPDATE trường Status, UpdatedAt trong bảng TICKETS -> Thông báo thành công"},

        # Branch 3: Delete / Revoke Ticket
        {"id": "d5_act_sel_del", "type": "action", "lane": 0, "y": 640, "val": "Chọn vé, bấm nút 'Xóa vé' và xác nhận"},
        {"id": "d5_act_chk_session", "type": "action", "lane": 1, "y": 640, "val": "Kiểm tra ràng buộc: Kiểm tra phiên tham quan trong bảng TICKET_SESSIONS"},
        {"id": "d5_dec_has_session", "type": "decision", "lane": 1, "y": 710, "val": "Vé đã kích hoạt phiên?"},
        {"id": "d5_act_err_session", "type": "action", "lane": 1, "y": 780, "val": "Từ chối xóa và hiển thị cảnh báo: Không thể xóa vé đã kích hoạt phiên tham quan"},
        {"id": "d5_act_del_ok", "type": "action", "lane": 1, "y": 850, "val": "DELETE bản ghi khỏi bảng TICKETS -> Cập nhật lại danh sách vé và thông báo thành công"},

        {"id": "d5_merge", "type": "decision", "lane": 0, "y": 920, "val": "Hợp nhất"},
        {"id": "d5_end", "type": "end", "lane": 0, "y": 980, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d5_start", "dst": "d5_act_open"},
        {"src": "d5_act_open", "dst": "d5_act_display"},
        {"src": "d5_act_display", "dst": "d5_dec_action", "waypoints": [(610, 267), (220, 267)]},

        {"src": "d5_dec_action", "dst": "d5_act_in_new", "label": "[Phát hành vé]"},
        {"src": "d5_act_in_new", "dst": "d5_act_gen_code"},
        {"src": "d5_act_gen_code", "dst": "d5_dec_dup"},
        {"src": "d5_dec_dup", "dst": "d5_act_gen_code", "label": "[Trùng mã]", "exit_dir": "top", "entry_dir": "bottom"},
        {"src": "d5_dec_dup", "dst": "d5_act_save_tkt", "label": "[Không trùng]"},
        {"src": "d5_act_save_tkt", "dst": "d5_merge", "waypoints": [(610, 520), (610, 947), (300, 947)]},

        {"src": "d5_dec_action", "dst": "d5_act_sel_status", "label": "[Đổi trạng thái]", "waypoints": [(140, 267), (60, 267), (60, 575), (95, 575)]},
        {"src": "d5_act_sel_status", "dst": "d5_act_save_status"},
        {"src": "d5_act_save_status", "dst": "d5_merge", "waypoints": [(610, 610), (610, 947), (300, 947)]},

        {"src": "d5_dec_action", "dst": "d5_act_sel_del", "label": "[Thu hồi/Xóa]", "waypoints": [(140, 267), (45, 267), (45, 665), (95, 665)]},
        {"src": "d5_act_sel_del", "dst": "d5_act_chk_session"},
        {"src": "d5_act_chk_session", "dst": "d5_dec_has_session"},
        {"src": "d5_dec_has_session", "dst": "d5_act_err_session", "label": "[Đã có phiên]"},
        {"src": "d5_act_err_session", "dst": "d5_merge", "waypoints": [(465, 805), (220, 805)]},
        {"src": "d5_dec_has_session", "dst": "d5_act_del_ok", "label": "[Chưa có phiên]"},
        {"src": "d5_act_del_ok", "dst": "d5_merge", "waypoints": [(465, 875), (220, 875)]},
        {"src": "d5_merge", "dst": "d5_end"}
    ]
})

# ==============================================================================
# DIAGRAM 06: Ticket Type Management
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_06",
    "name": "06 - Ticket Type Management",
    "filename": "06_Ticket_Type_Management",
    "title": "06. QUẢN LÝ LOẠI VÉ (TICKET TYPE MANAGEMENT)",
    "subtitle": "Quy trình thiết lập danh mục loại vé, định giá, quy định thời lượng và kích hoạt",
    "lanes": [
        ("Người dùng (Administrator)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d6_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d6_act_open", "type": "action", "lane": 0, "y": 170, "val": "Truy cập danh mục Quản lý loại vé"},
        {"id": "d6_act_display", "type": "action", "lane": 1, "y": 170, "val": "Truy vấn bảng TICKET_TYPES -> Hiển thị bảng danh sách loại vé: Tên, Đơn giá, Thời lượng (phút), Trạng thái"},
        {"id": "d6_dec_action", "type": "decision", "lane": 0, "y": 240, "val": "Chọn thao tác quản lý loại vé?"},

        # Branch 1: Create
        {"id": "d6_act_in_new", "type": "action", "lane": 0, "y": 320, "val": "Nhập Tên loại vé, Giá bán (Price >= 0), Thời lượng (phút), Mô tả -> Bấm 'Lưu loại vé'"},
        {"id": "d6_act_val_form", "type": "action", "lane": 1, "y": 320, "val": "Kiểm tra tính hợp lệ dữ liệu (Tên không rỗng, Giá tiền hợp lệ >= 0)"},
        {"id": "d6_dec_val", "type": "decision", "lane": 1, "y": 390, "val": "Form hợp lệ?"},
        {"id": "d6_act_err_val", "type": "action", "lane": 1, "y": 460, "val": "Hiển thị thông báo lỗi trên form và yêu cầu kiểm tra lại dữ liệu"},
        {"id": "d6_act_save_type", "type": "action", "lane": 1, "y": 520, "val": "INSERT bản ghi mới vào bảng TICKET_TYPES -> Thông báo thành công và nạp lại bảng"},

        # Branch 2: Update
        {"id": "d6_act_sel_edit", "type": "action", "lane": 0, "y": 610, "val": "Chọn loại vé, điều chỉnh giá bán, thời lượng hoặc bật/tắt IsActive -> Bấm 'Lưu'"},
        {"id": "d6_act_save_upd", "type": "action", "lane": 1, "y": 610, "val": "Kiểm tra ID tồn tại, UPDATE bảng TICKET_TYPES và thông báo cập nhật loại vé thành công"},

        # Branch 3: Delete
        {"id": "d6_act_sel_del", "type": "action", "lane": 0, "y": 700, "val": "Chọn loại vé, nhấn 'Xóa' và xác nhận trên hộp thoại"},
        {"id": "d6_act_chk_ref", "type": "action", "lane": 1, "y": 700, "val": "Kiểm tra ràng buộc trong bảng TICKETS & TICKET_ORDERS"},
        {"id": "d6_dec_is_ref", "type": "decision", "lane": 1, "y": 770, "val": "Loại vé đang được sử dụng?"},
        {"id": "d6_act_err_ref", "type": "action", "lane": 1, "y": 840, "val": "Từ chối xóa và hiển thị cảnh báo: Loại vé đang liên kết vé hoặc đơn hàng"},
        {"id": "d6_act_del_ok", "type": "action", "lane": 1, "y": 910, "val": "DELETE bản ghi khỏi bảng TICKET_TYPES -> Cập nhật lại danh mục loại vé và thông báo thành công"},

        {"id": "d6_merge", "type": "decision", "lane": 0, "y": 980, "val": "Hợp nhất"},
        {"id": "d6_end", "type": "end", "lane": 0, "y": 1040, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d6_start", "dst": "d6_act_open"},
        {"src": "d6_act_open", "dst": "d6_act_display"},
        {"src": "d6_act_display", "dst": "d6_dec_action", "waypoints": [(610, 267), (220, 267)]},

        {"src": "d6_dec_action", "dst": "d6_act_in_new", "label": "[Thêm loại vé]"},
        {"src": "d6_act_in_new", "dst": "d6_act_val_form"},
        {"src": "d6_act_val_form", "dst": "d6_dec_val"},
        {"src": "d6_dec_val", "dst": "d6_act_err_val", "label": "[Không hợp lệ]"},
        {"src": "d6_act_err_val", "dst": "d6_act_in_new", "waypoints": [(465, 485), (350, 485), (350, 345)]},
        {"src": "d6_dec_val", "dst": "d6_act_save_type", "label": "[Hợp lệ]"},
        {"src": "d6_act_save_type", "dst": "d6_merge", "waypoints": [(610, 580), (610, 1007), (300, 1007)]},

        {"src": "d6_dec_action", "dst": "d6_act_sel_edit", "label": "[Cập nhật]", "waypoints": [(140, 267), (60, 267), (60, 635), (95, 635)]},
        {"src": "d6_act_sel_edit", "dst": "d6_act_save_upd"},
        {"src": "d6_act_save_upd", "dst": "d6_merge", "waypoints": [(610, 670), (610, 1007), (300, 1007)]},

        {"src": "d6_dec_action", "dst": "d6_act_sel_del", "label": "[Xóa loại vé]", "waypoints": [(140, 267), (45, 267), (45, 725), (95, 725)]},
        {"src": "d6_act_sel_del", "dst": "d6_act_chk_ref"},
        {"src": "d6_act_chk_ref", "dst": "d6_dec_is_ref"},
        {"src": "d6_dec_is_ref", "dst": "d6_act_err_ref", "label": "[Đang sử dụng]"},
        {"src": "d6_act_err_ref", "dst": "d6_merge", "waypoints": [(465, 865), (220, 865)]},
        {"src": "d6_dec_is_ref", "dst": "d6_act_del_ok", "label": "[Chưa sử dụng]"},
        {"src": "d6_act_del_ok", "dst": "d6_merge", "waypoints": [(465, 935), (220, 935)]},
        {"src": "d6_merge", "dst": "d6_end"}
    ]
})

# ==============================================================================
# DIAGRAM 07: Ticket Session Management
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_07",
    "name": "07 - Ticket Session Management",
    "filename": "07_Ticket_Session_Management",
    "title": "07. QUẢN LÝ PHIÊN THAM QUAN (TICKET SESSION MANAGEMENT)",
    "subtitle": "Quy trình xác thực vé, kích hoạt phiên tham quan, duy trì kiểm tra và kết thúc phiên",
    "lanes": [
        ("Người dùng (Visitor / Administrator)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d7_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d7_act_input", "type": "action", "lane": 0, "y": 170, "val": "Khách tham quan nhập mã vé hoặc quét camera QR code"},
        {"id": "d7_act_query", "type": "action", "lane": 1, "y": 170, "val": "Tiếp nhận yêu cầu, truy vấn bảng TICKETS theo mã vé chuẩn hóa"},
        {"id": "d7_dec_found", "type": "decision", "lane": 1, "y": 240, "val": "Tìm thấy vé trong DB?"},
        {"id": "d7_act_err_404", "type": "action", "lane": 1, "y": 310, "val": "Hiển thị thông báo: Vé không tồn tại trên hệ thống (404 TICKET_NOT_FOUND)"},

        {"id": "d7_dec_status", "type": "decision", "lane": 1, "y": 380, "val": "Trạng thái vé là Valid?"},
        {"id": "d7_act_err_status", "type": "action", "lane": 1, "y": 450, "val": "Hiển thị thông báo: Vé đã qua sử dụng, đã hủy hoặc bị khóa (400 Bad Request)"},

        {"id": "d7_dec_time", "type": "decision", "lane": 1, "y": 520, "val": "Thời gian hiện tại <= ValidUntil?"},
        {"id": "d7_act_err_exp", "type": "action", "lane": 1, "y": 590, "val": "Cập nhật Status = Expired trong DB và hiển thị thông báo vé đã quá hạn"},

        {"id": "d7_act_create_session", "type": "action", "lane": 1, "y": 660, "val": "Khởi tạo TICKET_SESSION mới (SessionId GUID, StartedAt, ExpiredAt, Status=Active) -> Lưu DB -> Trả về token phiên"},
        {"id": "d7_act_save_local", "type": "action", "lane": 0, "y": 660, "val": "Lưu SessionId vào localStorage, nâng cấp vai trò thành 'Validated Visitor' và mở khóa tham quan"},
        {"id": "d7_act_periodic_verify", "type": "action", "lane": 1, "y": 740, "val": "Định kỳ tiếp nhận yêu cầu verify để kiểm tra và duy trì phiên hoạt động"},

        {"id": "d7_dec_end_session", "type": "decision", "lane": 0, "y": 810, "val": "Hình thức kết thúc phiên tham quan?"},
        {"id": "d7_act_close_db", "type": "action", "lane": 1, "y": 880, "val": "Cập nhật Status = Revoked/Terminated trong TICKET_SESSIONS -> Khóa lại các quyền truy cập nâng cao"},
        {"id": "d7_end", "type": "end", "lane": 0, "y": 950, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d7_start", "dst": "d7_act_input"},
        {"src": "d7_act_input", "dst": "d7_act_query"},
        {"src": "d7_act_query", "dst": "d7_dec_found"},
        {"src": "d7_dec_found", "dst": "d7_act_err_404", "label": "[Không tìm thấy]"},
        {"src": "d7_act_err_404", "dst": "d7_end", "waypoints": [(465, 335), (60, 335), (60, 964)]},

        {"src": "d7_dec_found", "dst": "d7_dec_status", "label": "[Tìm thấy vé]"},
        {"src": "d7_dec_status", "dst": "d7_act_err_status", "label": "[Không Valid]"},
        {"src": "d7_act_err_status", "dst": "d7_end", "waypoints": [(465, 475), (50, 475), (50, 964)]},

        {"src": "d7_dec_status", "dst": "d7_dec_time", "label": "[Status Valid]"},
        {"src": "d7_dec_time", "dst": "d7_act_err_exp", "label": "[Hết hạn]"},
        {"src": "d7_act_err_exp", "dst": "d7_end", "waypoints": [(465, 615), (40, 615), (40, 964)]},

        {"src": "d7_dec_time", "dst": "d7_act_create_session", "label": "[Còn hạn]"},
        {"src": "d7_act_create_session", "dst": "d7_act_save_local"},
        {"src": "d7_act_save_local", "dst": "d7_act_periodic_verify", "waypoints": [(220, 710), (610, 710)]},
        {"src": "d7_act_periodic_verify", "dst": "d7_dec_end_session", "waypoints": [(610, 785), (220, 785)]},

        {"src": "d7_dec_end_session", "dst": "d7_act_close_db", "label": "[Khách thoát / Admin thu hồi / Hết giờ]"},
        {"src": "d7_act_close_db", "dst": "d7_end", "waypoints": [(610, 964)]}
    ]
})

# ==============================================================================
# DIAGRAM 08: Audio Guide Management
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_08",
    "name": "08 - Audio Guide Management",
    "filename": "08_Audio_Guide_Management",
    "title": "08. QUẢN LÝ THUYẾT MINH (AUDIO GUIDE MANAGEMENT)",
    "subtitle": "Quy trình phát thuyết minh đa ngôn ngữ, kiểm soát phiên, đồng bộ kịch bản và xử lý fallback",
    "lanes": [
        ("Người dùng (Validated Visitor)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d8_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d8_act_select", "type": "action", "lane": 0, "y": 170, "val": "Chọn loài thú hoặc điểm POI trên bản đồ, chọn ngôn ngữ nghe -> Bấm 'Nghe thuyết minh'"},
        {"id": "d8_act_chk_session", "type": "action", "lane": 1, "y": 170, "val": "Kiểm tra tính hợp lệ của phiên tham quan (RequireTicketSession)"},
        {"id": "d8_dec_session_ok", "type": "decision", "lane": 1, "y": 240, "val": "Phiên hợp lệ và còn hạn?"},
        {"id": "d8_act_err_session", "type": "action", "lane": 1, "y": 310, "val": "Thông báo: Phiên tham quan không hợp lệ hoặc đã hết hạn, yêu cầu quét lại vé"},

        {"id": "d8_act_query_nar", "type": "action", "lane": 1, "y": 370, "val": "Truy vấn bảng NARRATIONS và AUDIOS theo SpeciesId và LanguageCode"},
        {"id": "d8_dec_found", "type": "decision", "lane": 1, "y": 440, "val": "Có bài thuyết minh đúng ngôn ngữ?"},
        {"id": "d8_act_fallback", "type": "action", "lane": 1, "y": 510, "val": "Kích hoạt Fallback sang bài thuyết minh mặc định Tiếng Việt ('vi')"},
        {"id": "d8_dec_has_vi", "type": "decision", "lane": 1, "y": 580, "val": "Có bài thuyết minh tiếng Việt?"},
        {"id": "d8_act_err_404", "type": "action", "lane": 1, "y": 650, "val": "Thông báo: Hiện chưa có dữ liệu âm thanh thuyết minh cho mục này"},

        {"id": "d8_act_play_audio", "type": "action", "lane": 1, "y": 720, "val": "Nạp luồng âm thanh từ Supabase Storage, mở thanh AudioPlayerBar và tự động phát (Auto-play)"},
        {"id": "d8_dec_control", "type": "decision", "lane": 0, "y": 790, "val": "Khách tương tác trình phát?"},
        {"id": "d8_act_control_resp", "type": "action", "lane": 1, "y": 860, "val": "Thực thi: Tạm dừng / Phát tiếp, tua timeline, mở modal xem kịch bản văn bản hoặc dừng và đóng trình phát"},
        {"id": "d8_end", "type": "end", "lane": 0, "y": 930, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d8_start", "dst": "d8_act_select"},
        {"src": "d8_act_select", "dst": "d8_act_chk_session"},
        {"src": "d8_act_chk_session", "dst": "d8_dec_session_ok"},
        {"src": "d8_dec_session_ok", "dst": "d8_act_err_session", "label": "[Không hợp lệ]"},
        {"src": "d8_act_err_session", "dst": "d8_end", "waypoints": [(465, 335), (50, 335), (50, 944)]},

        {"src": "d8_dec_session_ok", "dst": "d8_act_query_nar", "label": "[Hợp lệ]"},
        {"src": "d8_act_query_nar", "dst": "d8_dec_found"},
        {"src": "d8_dec_found", "dst": "d8_act_fallback", "label": "[Chưa dịch]"},
        {"src": "d8_act_fallback", "dst": "d8_dec_has_vi"},
        {"src": "d8_dec_has_vi", "dst": "d8_act_err_404", "label": "[Không có tiếng Việt]"},
        {"src": "d8_act_err_404", "dst": "d8_end", "waypoints": [(465, 675), (40, 675), (40, 944)]},

        {"src": "d8_dec_has_vi", "dst": "d8_act_play_audio", "label": "[Có tiếng Việt]"},
        {"src": "d8_dec_found", "dst": "d8_act_play_audio", "label": "[Có bài thuyết minh]"},
        {"src": "d8_act_play_audio", "dst": "d8_dec_control", "waypoints": [(610, 817), (220, 817)]},

        {"src": "d8_dec_control", "dst": "d8_act_control_resp", "label": "[Tạm dừng/Tua/Xem lời thoại/Đóng]"},
        {"src": "d8_act_control_resp", "dst": "d8_end", "waypoints": [(610, 944)]}
    ]
})

print("Diagrams 01-08 defined for 2-swimlane model.")

# ==============================================================================
# DIAGRAM 09: Dashboard Statistics
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_09",
    "name": "09 - Dashboard Statistics",
    "filename": "09_Dashboard_Statistics",
    "title": "09. THỐNG KÊ DASHBOARD (DASHBOARD STATISTICS)",
    "subtitle": "Quy trình tổng hợp chỉ số vận hành, doanh thu bán vé, phiên tham quan và cảnh báo thú y",
    "lanes": [
        ("Người dùng (Administrator)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d9_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d9_act_open", "type": "action", "lane": 0, "y": 170, "val": "Quản trị viên truy cập màn hình Bảng điều khiển (Dashboard)"},
        {"id": "d9_act_query", "type": "action", "lane": 1, "y": 170, "val": "Tiếp nhận yêu cầu, truy vấn đồng thời: Doanh thu (ORDERS Paid), Tổng vé (TICKETS), Phiên mở (SESSIONS Active), Cảnh báo thú y (ANIMALS) và Thiết bị online (DEVICES)"},
        {"id": "d9_dec_db_err", "type": "decision", "lane": 1, "y": 250, "val": "Truy vấn thành công?"},
        {"id": "d9_act_err_500", "type": "action", "lane": 1, "y": 320, "val": "Hiển thị Banner báo lỗi kết nối cơ sở dữ liệu và cung cấp nút 'Thử lại'"},
        {"id": "d9_act_render", "type": "action", "lane": 1, "y": 390, "val": "Tổng hợp các chỉ số, render thẻ KPI, vẽ biểu đồ xu hướng doanh thu và hiển thị bảng danh sách phiên tham quan"},
        {"id": "d9_act_view", "type": "action", "lane": 0, "y": 460, "val": "Quản trị viên theo dõi báo cáo vận hành hoặc chọn khoảng ngày khác để lọc lại dữ liệu"},
        {"id": "d9_end", "type": "end", "lane": 0, "y": 530, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d9_start", "dst": "d9_act_open"},
        {"src": "d9_act_open", "dst": "d9_act_query"},
        {"src": "d9_act_query", "dst": "d9_dec_db_err"},
        {"src": "d9_dec_db_err", "dst": "d9_act_err_500", "label": "[Lỗi máy chủ/DB]"},
        {"src": "d9_act_err_500", "dst": "d9_act_query", "waypoints": [(465, 345), (350, 345), (350, 195)]},
        {"src": "d9_dec_db_err", "dst": "d9_act_render", "label": "[Thành công]"},
        {"src": "d9_act_render", "dst": "d9_act_view", "waypoints": [(610, 485), (220, 485)]},
        {"src": "d9_act_view", "dst": "d9_end"}
    ]
})

# ==============================================================================
# DIAGRAM 10: Device Management
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_10",
    "name": "10 - Device Management",
    "filename": "10_Device_Management",
    "title": "10. QUẢN LÝ THIẾT BỊ (DEVICE MANAGEMENT)",
    "subtitle": "Quy trình nhận heartbeat định kỳ, giám sát thiết bị trực tuyến và ngắt kết nối an toàn",
    "lanes": [
        ("Người dùng (Visitor / Administrator)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d10_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d10_act_open_app", "type": "action", "lane": 0, "y": 170, "val": "Du khách mở ứng dụng ZooGuide trên trình duyệt thiết bị di động"},
        {"id": "d10_act_heartbeat", "type": "action", "lane": 1, "y": 170, "val": "Khởi tạo mã định danh thiết bị installationId và định kỳ mỗi 30 giây gửi Heartbeat lên máy chủ"},
        {"id": "d10_act_find_dev", "type": "action", "lane": 1, "y": 240, "val": "Tìm kiếm bản ghi thiết bị theo InstallationId trong bảng DEVICE_ACTIVITIES"},
        {"id": "d10_dec_exist", "type": "decision", "lane": 1, "y": 310, "val": "Thiết bị đã tồn tại trong DB?"},
        {"id": "d10_act_ins_dev", "type": "action", "lane": 1, "y": 380, "val": "INSERT bản ghi mới: InstallationId, IP, UserAgent, CreatedAt=Now, LastSeenAt=Now, IsActive=true"},
        {"id": "d10_act_upd_dev", "type": "action", "lane": 1, "y": 450, "val": "UPDATE bản ghi: LastSeenAt = Now, IsActive = true, cập nhật thông tin đơn hàng/email"},

        {"id": "d10_act_admin_mon", "type": "action", "lane": 0, "y": 530, "val": "Quản trị viên truy cập màn hình Giám sát thiết bị để theo dõi vận hành"},
        {"id": "d10_act_scan_active", "type": "action", "lane": 1, "y": 530, "val": "Quét bảng DEVICE_ACTIVITIES lọc thiết bị IsActive=true trong 5 phút qua -> Hiển thị số lượng online theo thời gian thực"},

        {"id": "d10_act_user_leave", "type": "action", "lane": 0, "y": 620, "val": "Du khách đóng tab / chuyển trang (hoặc hết hạn timeout 5 phút không nhận Heartbeat)"},
        {"id": "d10_act_disconnect", "type": "action", "lane": 1, "y": 620, "val": "Tiếp nhận tín hiệu sendBeacon disconnect -> Cập nhật IsActive = false, lưu thời gian ngắt kết nối vào DB và cập nhật số liệu"},
        {"id": "d10_end", "type": "end", "lane": 0, "y": 700, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d10_start", "dst": "d10_act_open_app"},
        {"src": "d10_act_open_app", "dst": "d10_act_heartbeat"},
        {"src": "d10_act_heartbeat", "dst": "d10_act_find_dev"},
        {"src": "d10_act_find_dev", "dst": "d10_dec_exist"},
        {"src": "d10_dec_exist", "dst": "d10_act_ins_dev", "label": "[Chưa tồn tại]"},
        {"src": "d10_dec_exist", "dst": "d10_act_upd_dev", "label": "[Đã tồn tại]"},
        {"src": "d10_act_ins_dev", "dst": "d10_act_admin_mon", "waypoints": [(465, 405), (350, 405), (350, 555), (220, 555)]},
        {"src": "d10_act_upd_dev", "dst": "d10_act_admin_mon", "waypoints": [(465, 475), (350, 475), (350, 555), (220, 555)]},
        {"src": "d10_act_admin_mon", "dst": "d10_act_scan_active"},
        {"src": "d10_act_scan_active", "dst": "d10_act_user_leave", "waypoints": [(610, 580), (220, 580)]},
        {"src": "d10_act_user_leave", "dst": "d10_act_disconnect"},
        {"src": "d10_act_disconnect", "dst": "d10_end", "waypoints": [(610, 714)]}
    ]
})

# ==============================================================================
# DIAGRAM 11: Activity Log Management
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_11",
    "name": "11 - Activity Log Management",
    "filename": "11_Activity_Log_Management",
    "title": "11. QUẢN LÝ NHẬT KÝ (ACTIVITY LOG MANAGEMENT)",
    "subtitle": "Quy trình truy vấn, lọc dữ liệu, hiển thị chi tiết nhật ký thao tác và audit log hệ thống",
    "lanes": [
        ("Người dùng (Administrator)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d11_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d11_act_open", "type": "action", "lane": 0, "y": 170, "val": "Quản trị viên điều hướng đến mục Nhật ký hoạt động hệ thống"},
        {"id": "d11_act_filter", "type": "action", "lane": 0, "y": 240, "val": "Thiết lập bộ lọc số lượng (limit = 50) hoặc nhập từ khóa tìm kiếm"},
        {"id": "d11_act_query", "type": "action", "lane": 1, "y": 240, "val": "Tiếp nhận yêu cầu, truy vấn bảng AuditLogs trong cơ sở dữ liệu sắp xếp Timestamp DESC"},
        {"id": "d11_dec_has_logs", "type": "decision", "lane": 1, "y": 320, "val": "Có dữ liệu nhật ký?"},
        {"id": "d11_act_empty", "type": "action", "lane": 1, "y": 390, "val": "Hiển thị thông báo: 'Chưa có nhật ký hoạt động nào được ghi nhận'"},
        {"id": "d11_act_render", "type": "action", "lane": 1, "y": 460, "val": "Hiển thị bảng nhật ký chi tiết với nhãn màu phân loại hành động (Create, Update, Delete, Revoke)"},
        {"id": "d11_act_click_row", "type": "action", "lane": 0, "y": 540, "val": "Quản trị viên xem bảng nhật ký và bấm vào một dòng log cụ thể để xem chi tiết"},
        {"id": "d11_act_modal", "type": "action", "lane": 1, "y": 540, "val": "Mở modal hiển thị JSON Payload dữ liệu trước và sau khi thay đổi"},
        {"id": "d11_end", "type": "end", "lane": 0, "y": 620, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d11_start", "dst": "d11_act_open"},
        {"src": "d11_act_open", "dst": "d11_act_filter"},
        {"src": "d11_act_filter", "dst": "d11_act_query"},
        {"src": "d11_act_query", "dst": "d11_dec_has_logs"},
        {"src": "d11_dec_has_logs", "dst": "d11_act_empty", "label": "[Không có bản ghi]"},
        {"src": "d11_act_empty", "dst": "d11_end", "waypoints": [(465, 415), (50, 415), (50, 634)]},
        {"src": "d11_dec_has_logs", "dst": "d11_act_render", "label": "[Có dữ liệu]"},
        {"src": "d11_act_render", "dst": "d11_act_click_row", "waypoints": [(610, 510), (220, 510)]},
        {"src": "d11_act_click_row", "dst": "d11_act_modal"},
        {"src": "d11_act_modal", "dst": "d11_end", "waypoints": [(610, 634)]}
    ]
})

# ==============================================================================
# DIAGRAM 12: Language Management
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_12",
    "name": "12 - Language Management",
    "filename": "12_Language_Management",
    "title": "12. QUẢN LÝ NGÔN NGỮ (LANGUAGE MANAGEMENT)",
    "subtitle": "Quy trình chuyển đổi ngôn ngữ, tải từ điển chuỗi giao diện và nạp bản dịch nội dung",
    "lanes": [
        ("Người dùng (Visitor / User)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d12_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d12_act_click", "type": "action", "lane": 0, "y": 170, "val": "Bấm vào menu chọn ngôn ngữ trên thanh Header"},
        {"id": "d12_act_menu", "type": "action", "lane": 1, "y": 170, "val": "Hiển thị danh sách các ngôn ngữ hỗ trợ (vi, en, zh, ja, fr...)"},
        {"id": "d12_act_pick", "type": "action", "lane": 0, "y": 240, "val": "Người dùng chọn ngôn ngữ mong muốn (ví dụ: 'en' - Tiếng Anh)"},
        {"id": "d12_act_load_ui", "type": "action", "lane": 1, "y": 240, "val": "Lưu languageCode = 'en' vào localStorage và truy vấn từ điển chuỗi giao diện tương ứng từ máy chủ"},
        {"id": "d12_act_apply_ui", "type": "action", "lane": 1, "y": 310, "val": "Nạp từ điển mới và cập nhật tức thì toàn bộ nhãn nút, tiêu đề giao diện (Re-render UI)"},
        {"id": "d12_act_reload_content", "type": "action", "lane": 1, "y": 380, "val": "Tự động gửi lại các yêu cầu tải dữ liệu nội dung với tham số ?lang=en (areas, animals, pois, narrations)"},
        {"id": "d12_dec_trans", "type": "decision", "lane": 1, "y": 450, "val": "Có bản dịch tiếng Anh trong DB?"},
        {"id": "d12_act_fallback", "type": "action", "lane": 1, "y": 520, "val": "Fallback: Trả về nội dung gốc Tiếng Việt ('vi') kèm cảnh báo"},
        {"id": "d12_act_translated", "type": "action", "lane": 1, "y": 590, "val": "Trả về nội dung văn bản đã được bản địa hóa chuẩn"},
        {"id": "d12_act_render_all", "type": "action", "lane": 1, "y": 660, "val": "Hiển thị toàn bộ thông tin sở thú theo ngôn ngữ đã chọn một cách đồng bộ"},
        {"id": "d12_end", "type": "end", "lane": 0, "y": 720, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d12_start", "dst": "d12_act_click"},
        {"src": "d12_act_click", "dst": "d12_act_menu"},
        {"src": "d12_act_menu", "dst": "d12_act_pick", "waypoints": [(610, 210), (220, 210)]},
        {"src": "d12_act_pick", "dst": "d12_act_load_ui"},
        {"src": "d12_act_load_ui", "dst": "d12_act_apply_ui"},
        {"src": "d12_act_apply_ui", "dst": "d12_act_reload_content"},
        {"src": "d12_act_reload_content", "dst": "d12_dec_trans"},
        {"src": "d12_dec_trans", "dst": "d12_act_fallback", "label": "[Chưa có bản dịch]"},
        {"src": "d12_dec_trans", "dst": "d12_act_translated", "label": "[Có bản dịch]"},
        {"src": "d12_act_fallback", "dst": "d12_act_render_all"},
        {"src": "d12_act_translated", "dst": "d12_act_render_all"},
        {"src": "d12_act_render_all", "dst": "d12_end", "waypoints": [(610, 734)]}
    ]
})

# ==============================================================================
# DIAGRAM 13: Payment Processing
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_13",
    "name": "13 - Payment Processing",
    "filename": "13_Payment_Processing",
    "title": "13. THANH TOÁN (PAYMENT PROCESSING)",
    "subtitle": "Quy trình tạo đơn hàng, thanh toán VietQR chuyển khoản / Sandbox giả lập và cấp vé tự động",
    "lanes": [
        ("Người dùng (Visitor)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d13_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d13_act_choose", "type": "action", "lane": 0, "y": 170, "val": "Chọn loại vé, số lượng và nhập thông tin người mua (Họ tên, Email, SĐT) -> Bấm 'Tiến hành đặt vé'"},
        {"id": "d13_act_create_order", "type": "action", "lane": 1, "y": 170, "val": "Validate số lượng (1-50), tính TotalAmount, sinh mã đơn ZG-yyyyMMdd-xxxxxx, mã chuyển khoản ZGxxxxxx và URL ảnh VietQR Napas"},
        {"id": "d13_act_show_qr", "type": "action", "lane": 1, "y": 250, "val": "Lưu bản ghi TICKET_ORDERS (Pending, hạn 15 phút) -> Mở Modal VietQR kèm mã QR chuyển khoản và đồng hồ đếm ngược"},
        {"id": "d13_dec_pay_method", "type": "decision", "lane": 0, "y": 330, "val": "Phương thức thực hiện thanh toán?"},

        # Branch 1: Real VietQR
        {"id": "d13_act_scan_bank", "type": "action", "lane": 0, "y": 410, "val": "Khách quét mã VietQR bằng Mobile Banking chuyển tiền -> Cổng thanh toán gửi Webhook POST /api/payments/webhook"},

        # Branch 2: Sandbox Simulator
        {"id": "d13_act_click_sim", "type": "action", "lane": 0, "y": 480, "val": "Khách hoặc Tester nhấn nút 'Giả lập thanh toán Sandbox' trên giao diện phục vụ kiểm thử"},

        {"id": "d13_act_verify_amount", "type": "action", "lane": 1, "y": 445, "val": "Đối soát số tiền giao dịch nhận được so với tổng tiền đơn hàng"},
        {"id": "d13_dec_pay_ok", "type": "decision", "lane": 1, "y": 525, "val": "Thanh toán thành công và đủ tiền?"},
        {"id": "d13_act_fail", "type": "action", "lane": 1, "y": 595, "val": "Cập nhật PaymentStatus = Failed trong TICKET_ORDERS và thông báo lỗi thanh toán"},
        {"id": "d13_act_paid", "type": "action", "lane": 1, "y": 665, "val": "Cập nhật PaymentStatus = Paid, lưu PaidAt, sinh TransactionReference"},
        {"id": "d13_act_issue_tkts", "type": "action", "lane": 1, "y": 735, "val": "Tự động phát hành vé: Tạo N bản ghi trong bảng TICKETS (mã TKT-xxxx-xxxx, Status=Valid), gửi email xác nhận kèm vé điện tử"},
        {"id": "d13_act_success_ui", "type": "action", "lane": 1, "y": 805, "val": "Hiển thị Modal 'Thanh toán thành công' kèm danh sách vé điện tử có mã QR và nút 'Kích hoạt ngay'"},
        {"id": "d13_act_visitor_done", "type": "action", "lane": 0, "y": 875, "val": "Khách xem vé điện tử hoặc bấm 'Kích hoạt phiên tham quan ngay'"},
        {"id": "d13_end", "type": "end", "lane": 0, "y": 945, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d13_start", "dst": "d13_act_choose"},
        {"src": "d13_act_choose", "dst": "d13_act_create_order"},
        {"src": "d13_act_create_order", "dst": "d13_act_show_qr"},
        {"src": "d13_act_show_qr", "dst": "d13_dec_pay_method", "waypoints": [(610, 305), (220, 305)]},

        {"src": "d13_dec_pay_method", "dst": "d13_act_scan_bank", "label": "[Quét VietQR thật]"},
        {"src": "d13_dec_pay_method", "dst": "d13_act_click_sim", "label": "[Giả lập Sandbox]", "waypoints": [(140, 357), (60, 357), (60, 505), (95, 505)]},

        {"src": "d13_act_scan_bank", "dst": "d13_act_verify_amount"},
        {"src": "d13_act_click_sim", "dst": "d13_act_verify_amount"},
        {"src": "d13_act_verify_amount", "dst": "d13_dec_pay_ok"},

        {"src": "d13_dec_pay_ok", "dst": "d13_act_fail", "label": "[Thất bại]"},
        {"src": "d13_act_fail", "dst": "d13_end", "waypoints": [(465, 620), (50, 620), (50, 959)]},

        {"src": "d13_dec_pay_ok", "dst": "d13_act_paid", "label": "[Thành công]"},
        {"src": "d13_act_paid", "dst": "d13_act_issue_tkts"},
        {"src": "d13_act_issue_tkts", "dst": "d13_act_success_ui"},
        {"src": "d13_act_success_ui", "dst": "d13_act_visitor_done", "waypoints": [(610, 840), (220, 840)]},
        {"src": "d13_act_visitor_done", "dst": "d13_end"}
    ]
})

# ==============================================================================
# DIAGRAM 14: Zoo Information Lookup
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_14",
    "name": "14 - Zoo Information Lookup",
    "filename": "14_Zoo_Information_Lookup",
    "title": "14. TRA CỨU THÔNG TIN SỞ THÚ (ZOO INFORMATION LOOKUP)",
    "subtitle": "Quy trình tìm kiếm, lọc danh mục động vật, xem hồ sơ chi tiết và liên kết bản đồ/thuyết minh",
    "lanes": [
        ("Người dùng (Visitor)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d14_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d14_act_open", "type": "action", "lane": 0, "y": 170, "val": "Khách mở tab 'Động vật & Tra cứu' trên ứng dụng ZooGuide"},
        {"id": "d14_act_filter", "type": "action", "lane": 0, "y": 240, "val": "Nhập từ khóa tìm kiếm (tên tiếng Việt, tên khoa học) hoặc chọn bộ lọc Phân khu, IUCN, Ngôn ngữ"},
        {"id": "d14_act_query", "type": "action", "lane": 1, "y": 240, "val": "Truy vấn kết hợp ANIMALS, SPECIES, AREAS, ENCLOSURES và CONTENT_TRANSLATIONS"},
        {"id": "d14_dec_has_animals", "type": "decision", "lane": 1, "y": 320, "val": "Có dữ liệu động vật khớp tiêu chí?"},
        {"id": "d14_act_empty", "type": "action", "lane": 1, "y": 390, "val": "Hiển thị giao diện 'Không tìm thấy động vật phù hợp' kèm gợi ý từ khóa"},
        {"id": "d14_act_render_grid", "type": "action", "lane": 1, "y": 460, "val": "Render danh sách động vật dạng lưới thẻ (Card Grid): Hình ảnh, Tên, Tên khoa học, Phân khu, Huy hiệu IUCN"},
        {"id": "d14_act_click_card", "type": "action", "lane": 0, "y": 540, "val": "Khách nhấn chọn một thẻ động vật cụ thể để xem chi tiết"},
        {"id": "d14_act_modal", "type": "action", "lane": 1, "y": 540, "val": "Mở Modal AnimalDetailModal: Sinh cảnh, Khẩu phần ăn, Tuổi thọ, Trạng thái bảo tồn, Vị trí chuồng nuôi"},
        {"id": "d14_dec_action_link", "type": "decision", "lane": 0, "y": 620, "val": "Khách chọn hành động liên kết tiếp theo?"},
        {"id": "d14_act_handle_action", "type": "action", "lane": 1, "y": 690, "val": "Thực thi: Chuyển sang Bản đồ số định vị chuồng thú, hoặc kích hoạt Thuyết minh âm thanh, hoặc đóng modal"},
        {"id": "d14_end", "type": "end", "lane": 0, "y": 760, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d14_start", "dst": "d14_act_open"},
        {"src": "d14_act_open", "dst": "d14_act_filter"},
        {"src": "d14_act_filter", "dst": "d14_act_query"},
        {"src": "d14_act_query", "dst": "d14_dec_has_animals"},
        {"src": "d14_dec_has_animals", "dst": "d14_act_empty", "label": "[Không tìm thấy]"},
        {"src": "d14_act_empty", "dst": "d14_end", "waypoints": [(465, 415), (50, 415), (50, 774)]},
        {"src": "d14_dec_has_animals", "dst": "d14_act_render_grid", "label": "[Tìm thấy kết quả]"},
        {"src": "d14_act_render_grid", "dst": "d14_act_click_card", "waypoints": [(610, 510), (220, 510)]},
        {"src": "d14_act_click_card", "dst": "d14_act_modal"},
        {"src": "d14_act_modal", "dst": "d14_dec_action_link", "waypoints": [(610, 590), (220, 590)]},
        {"src": "d14_dec_action_link", "dst": "d14_act_handle_action", "label": "[Xem bản đồ / Nghe audio / Đóng]"},
        {"src": "d14_act_handle_action", "dst": "d14_end", "waypoints": [(610, 774)]}
    ]
})

# ==============================================================================
# DIAGRAM 15: Zoo Navigation
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_15",
    "name": "15 - Zoo Navigation",
    "filename": "15_Zoo_Navigation",
    "title": "15. ĐIỀU HƯỚNG THAM QUAN (ZOO NAVIGATION)",
    "subtitle": "Quy trình định vị GPS, chọn điểm xuất phát, tính toán tuyến đường ngắn nhất Dijkstra và dẫn đường",
    "lanes": [
        ("Người dùng (Visitor)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d15_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d15_act_open", "type": "action", "lane": 0, "y": 170, "val": "Khách mở tab 'Bản đồ số' trên ứng dụng"},
        {"id": "d15_act_render_base", "type": "action", "lane": 1, "y": 170, "val": "Tải dữ liệu phân khu, chuồng thú, điểm di tích từ DB và hiển thị bản đồ Leaflet toàn cảnh Thảo Cầm Viên"},
        {"id": "d15_dec_start_method", "type": "decision", "lane": 0, "y": 240, "val": "Hình thức xác định điểm xuất phát?"},

        # Branch 1: GPS
        {"id": "d15_act_click_gps", "type": "action", "lane": 0, "y": 320, "val": "Bấm nút 'Vị trí của tôi (GPS)' -> Trình duyệt yêu cầu quyền truy cập định vị"},
        {"id": "d15_dec_gps_grant", "type": "decision", "lane": 1, "y": 320, "val": "Được cấp quyền GPS?"},
        {"id": "d15_act_gps_err", "type": "action", "lane": 1, "y": 390, "val": "Hiển thị cảnh báo lỗi GPS và yêu cầu chọn cổng vào thủ công"},
        {"id": "d15_act_gps_draw", "type": "action", "lane": 1, "y": 460, "val": "Nhận tọa độ GPS thực tế, vẽ chấm xanh vị trí du khách và tìm nút giao gần nhất trong WALKWAY_NODES"},

        # Branch 2: Gate
        {"id": "d15_act_pick_gate", "type": "action", "lane": 0, "y": 425, "val": "Chọn một trong các Cổng vào chính: Cổng A (Lê Duẩn), Cổng B, Cổng C, Cổng E"},

        {"id": "d15_act_pick_dest", "type": "action", "lane": 0, "y": 540, "val": "Khách chọn điểm đến mong muốn (Chuồng thú, Di tích lịch sử, Cổng phân khu)"},
        {"id": "d15_act_run_dijkstra", "type": "action", "lane": 1, "y": 540, "val": "Chạy thuật toán Dijkstra (planZooRoute) tìm kiếm đường đi ngắn nhất qua mạng lưới đường bộ"},
        {"id": "d15_dec_route_ok", "type": "decision", "lane": 1, "y": 610, "val": "Tìm thấy đường đi khả dụng?"},
        {"id": "d15_act_no_route", "type": "action", "lane": 1, "y": 680, "val": "Hiển thị thông báo: Không có tuyến đường đi bộ kết nối giữa hai địa điểm"},
        {"id": "d15_act_show_nav", "type": "action", "lane": 1, "y": 750, "val": "Tính tổng quãng đường (m), thời gian dự kiến (phút), vẽ Polyline màu xanh và hiển thị bảng chỉ đường"},
        {"id": "d15_act_auto_nar", "type": "action", "lane": 1, "y": 820, "val": "Giám sát vị trí qua watchPosition: Khi khoảng cách đến chuồng thú < 50m -> Tự động phát thuyết minh âm thanh"},
        {"id": "d15_end", "type": "end", "lane": 0, "y": 880, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d15_start", "dst": "d15_act_open"},
        {"src": "d15_act_open", "dst": "d15_act_render_base"},
        {"src": "d15_act_render_base", "dst": "d15_dec_start_method", "waypoints": [(610, 267), (220, 267)]},

        {"src": "d15_dec_start_method", "dst": "d15_act_click_gps", "label": "[GPS tự động]"},
        {"src": "d15_act_click_gps", "dst": "d15_dec_gps_grant"},
        {"src": "d15_dec_gps_grant", "dst": "d15_act_gps_err", "label": "[Bị từ chối/Lỗi]"},
        {"src": "d15_act_gps_err", "dst": "d15_act_pick_gate", "waypoints": [(465, 415), (350, 415), (350, 450), (220, 450)]},
        {"src": "d15_dec_gps_grant", "dst": "d15_act_gps_draw", "label": "[Thành công]"},
        {"src": "d15_act_gps_draw", "dst": "d15_act_pick_dest", "waypoints": [(610, 515), (220, 515)]},

        {"src": "d15_dec_start_method", "dst": "d15_act_pick_gate", "label": "[Chọn cổng vào]", "waypoints": [(140, 267), (60, 267), (60, 450), (95, 450)]},
        {"src": "d15_act_pick_gate", "dst": "d15_act_pick_dest"},

        {"src": "d15_act_pick_dest", "dst": "d15_act_run_dijkstra"},
        {"src": "d15_act_run_dijkstra", "dst": "d15_dec_route_ok"},
        {"src": "d15_dec_route_ok", "dst": "d15_act_no_route", "label": "[Không tìm thấy]"},
        {"src": "d15_act_no_route", "dst": "d15_end", "waypoints": [(465, 705), (50, 705), (50, 894)]},
        {"src": "d15_dec_route_ok", "dst": "d15_act_show_nav", "label": "[Tìm thấy tuyến đường]"},
        {"src": "d15_act_show_nav", "dst": "d15_act_auto_nar"},
        {"src": "d15_act_auto_nar", "dst": "d15_end", "waypoints": [(610, 894)]}
    ]
})

# ==============================================================================
# DIAGRAM 16: Ticket Purchase and Usage
# ==============================================================================
DIAGRAMS.append({
    "id": "diag_16",
    "name": "16 - Ticket Purchase and Usage",
    "filename": "16_Ticket_Purchase_And_Usage",
    "title": "16. MUA VÀ SỬ DỤNG VÉ (TICKET PURCHASE AND USAGE)",
    "subtitle": "Hành trình tổng thể của khách hàng từ đặt vé, thanh toán, kích hoạt phiên đến trải nghiệm sở thú",
    "lanes": [
        ("Người dùng (Visitor -> Validated Visitor)", 360),
        ("Hệ thống (System)", 420)
    ],
    "nodes": [
        {"id": "d16_start", "type": "start", "lane": 0, "y": 120, "val": "Bắt đầu"},
        {"id": "d16_act_select", "type": "action", "lane": 0, "y": 170, "val": "Giai đoạn 1: Khách duyệt các hạng vé, chọn số lượng, điền thông tin người mua và gửi yêu cầu đặt vé"},
        {"id": "d16_act_order_qr", "type": "action", "lane": 1, "y": 170, "val": "Tạo đơn hàng TICKET_ORDERS (Pending), tính tiền, sinh VietQR Napas và đồng hồ đếm ngược 15 phút"},
        {"id": "d16_act_pay", "type": "action", "lane": 0, "y": 250, "val": "Giai đoạn 2: Khách quét VietQR chuyển khoản (hoặc nhấn nút Giả lập Sandbox trên màn hình)"},
        {"id": "d16_act_confirm", "type": "action", "lane": 1, "y": 250, "val": "Xác nhận thanh toán -> Cập nhật đơn hàng Paid -> Tự động phát hành mã vé tham quan (TKT-xxxx-xxxx) và gửi email"},
        {"id": "d16_act_activate", "type": "action", "lane": 0, "y": 330, "val": "Giai đoạn 3: Khách nhận vé điện tử, bấm 'Kích hoạt phiên ngay' (hoặc quét mã QR tại cổng kiểm soát)"},
        {"id": "d16_act_validate", "type": "action", "lane": 1, "y": 330, "val": "Xác thực mã vé hợp lệ và còn hạn -> Khởi tạo TICKET_SESSION lưu vào Database -> Nâng cấp quyền người dùng"},
        {"id": "d16_act_experience", "type": "action", "lane": 0, "y": 420, "val": "Giai đoạn 4: Trở thành 'Validated Visitor' và trải nghiệm: Nghe thuyết minh âm thanh 12 ngôn ngữ, Bản đồ dẫn đường Dijkstra và Tra cứu động vật"},
        {"id": "d16_act_end_tour", "type": "action", "lane": 0, "y": 510, "val": "Giai đoạn 5: Kết thúc chuyến tham quan (Bấm 'Thoát phiên' trên thẻ điện tử hoặc hết thời hạn hiệu lực của vé)"},
        {"id": "d16_act_close_session", "type": "action", "lane": 1, "y": 510, "val": "Cập nhật TICKET_SESSIONS sang Status = Revoked/Expired -> Khóa lại các quyền truy cập nâng cao trên thiết bị"},
        {"id": "d16_end", "type": "end", "lane": 0, "y": 580, "val": "Kết thúc"}
    ],
    "edges": [
        {"src": "d16_start", "dst": "d16_act_select"},
        {"src": "d16_act_select", "dst": "d16_act_order_qr"},
        {"src": "d16_act_order_qr", "dst": "d16_act_pay", "waypoints": [(610, 220), (220, 220)]},
        {"src": "d16_act_pay", "dst": "d16_act_confirm"},
        {"src": "d16_act_confirm", "dst": "d16_act_activate", "waypoints": [(610, 300), (220, 300)]},
        {"src": "d16_act_activate", "dst": "d16_act_validate"},
        {"src": "d16_act_validate", "dst": "d16_act_experience", "waypoints": [(610, 385), (220, 385)]},
        {"src": "d16_act_experience", "dst": "d16_act_end_tour"},
        {"src": "d16_act_end_tour", "dst": "d16_act_close_session"},
        {"src": "d16_act_close_session", "dst": "d16_end", "waypoints": [(610, 594)]}
    ]
})

print(f"Total defined diagrams: {len(DIAGRAMS)} (ALL 2-SWIMLANE)")
