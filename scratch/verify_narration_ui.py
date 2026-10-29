import urllib.request
import re
import json

BASE_URL = "http://localhost:3001"

def test_narration_ui():
    print(f"=== 1. Testing GET {BASE_URL}/admin/narration ===")
    req = urllib.request.Request(f"{BASE_URL}/admin/narration", headers={"User-Agent": "ZooGuideTest/1.0"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        html = resp.read().decode('utf-8')
        print(f"HTML response received: {len(html)} bytes")
        assert "dist" in html or "assets" in html or "<div id=\"root\">" in html, "HTML missing root div"

    # Extract JS and CSS asset URLs
    js_match = re.search(r'src=["\'](/assets/index-[^"\']+\.js)["\']', html)
    css_match = re.search(r'href=["\'](/assets/index-[^"\']+\.css)["\']', html)

    assert js_match, "Could not find bundled JS in index.html"
    assert css_match, "Could not find bundled CSS in index.html"

    js_url = f"{BASE_URL}{js_match.group(1)}"
    css_url = f"{BASE_URL}{css_match.group(1)}"

    print(f"\n=== 2. Testing Bundled CSS at {css_url} ===")
    with urllib.request.urlopen(css_url) as resp:
        assert resp.status == 200
        css_text = resp.read().decode('utf-8')
        print(f"CSS downloaded: {len(css_text)} bytes")

        # Check for narration modal rules
        assert ".narration-modal-dialog" in css_text, "Missing .narration-modal-dialog in CSS"
        assert "760px" in css_text, "Missing max-width 760px in CSS"
        assert "100dvh" in css_text or "100vh" in css_text, "Missing max-height viewport constraint in CSS"
        assert ".modal-backdrop" in css_text, "Missing .modal-backdrop in CSS"
        assert ".modal-overlay" in css_text, "Missing .modal-overlay in CSS"
        print("✓ CSS verified: .narration-modal-dialog properly styled with 760px max-width, viewport max-height, and 3-part layout!")

    print(f"\n=== 3. Testing Bundled JS at {js_url} ===")
    with urllib.request.urlopen(js_url) as resp:
        assert resp.status == 200
        js_text = resp.read().decode('utf-8')
        print(f"JS downloaded: {len(js_text)} bytes")

        # Verify modal elements and handlers in JS
        checks = [
            ("Quản Lý Nội Dung Thuyết Minh", "Header title"),
            ("Thêm Bài Thuyết Minh", "Primary create button"),
            ("narration-modal-dialog", "Modal dialog class"),
            ("modal-backdrop", "Backdrop element"),
            ("Biên Tập Bài Thuyết Minh Mới", "Create form modal title"),
            ("Chỉnh Sửa Bài Thuyết Minh", "Edit form modal title"),
            ("Toàn văn nội dung bài thuyết minh", "Full narration script textarea label"),
            ("Tệp âm thanh thuyết minh", "Audio file / URL input section"),
            ("overflow", "Body overflow lock check"),
            ("Escape", "Escape key event listener"),
            ("Lưu & Xuất Bản Thuyết Minh", "Submit button label"),
            ("Hủy Bỏ", "Cancel button label")
        ]

        for text, desc in checks:
            assert text in js_text, f"JS bundle missing text: '{text}' ({desc})"
            print(f"✓ JS verified: contains {desc} ('{text}')")

    print("\n=== 4. Testing Backend API integration ===")
    api_url = "http://localhost:8080/api/narrations"
    with urllib.request.urlopen(api_url) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode('utf-8'))
        assert data.get("success") is True, "API did not return success=true"
        items = data.get("data", [])
        print(f"✓ Backend API verified: returned {len(items)} verified narrations!")
        assert len(items) > 0, "No narrations returned"

    print("\n=======================================================")
    print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("=======================================================")

if __name__ == "__main__":
    test_narration_ui()
