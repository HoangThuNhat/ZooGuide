import os

# 1. Update style.css
css_path = r"C:\Users\admin\Desktop\Study\Công nghệ phần mềm\ZooGuide\web\css\style.css"
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

narration_css = """
/* Audio Narration Modal Dialog */
.narration-modal-dialog {
    max-width: 760px;
    width: 95%;
    max-height: calc(100vh - 32px);
    max-height: calc(100dvh - 32px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    border-radius: var(--radius-xl, 16px);
    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
    background-color: var(--color-surface, #ffffff);
}

.narration-modal-dialog .modal-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid var(--color-border, #E2E8F0);
    background-color: var(--color-surface, #ffffff);
}

.narration-modal-dialog .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    background-color: var(--color-surface, #ffffff);
}

.narration-modal-dialog .modal-footer {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 14px 24px;
    border-top: 1px solid var(--color-border, #E2E8F0);
    background-color: var(--color-bg-secondary, #F8FAFC);
}
"""

if ".narration-modal-dialog" not in css_content:
    target = ".narration-item-header {"
    if target in css_content:
        # insert before health-log-card
        insert_marker = "/* Health Log Cards */"
        if insert_marker in css_content:
            css_content = css_content.replace(insert_marker, narration_css + "\n" + insert_marker)
            with open(css_path, "w", encoding="utf-8") as f:
                f.write(css_content)
            print("Successfully updated web/css/style.css with .narration-modal-dialog")
        else:
            print("Could not find insert_marker in style.css")
    else:
        print("Could not find target in style.css")
else:
    print(".narration-modal-dialog already exists in style.css")
