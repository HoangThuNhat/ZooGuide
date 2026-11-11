# -*- coding: utf-8 -*-
"""
ZooGuide Activity Diagrams Render Engine (2-SWIMLANE EDITION)
Outputs:
1. Multi-page Draw.io XML: ZooGuide_16_Activity_Diagrams.drawio (16 pages, 2 lanes each)
2. 16 Individual Draw.io files: Individual_Diagrams/*.drawio (2 lanes each)
3. 16 Vector SVG files: Preview/SVG/*.svg
4. 16 High-Res PNG files: Preview/PNG/*.png
"""

import os
import sys
import xml.etree.ElementTree as ET
import subprocess
import html
import textwrap

from diagram_definitions import DIAGRAMS

BASE_DIR = "ZooGuide_Activity_Diagrams"
INDIV_DIR = os.path.join(BASE_DIR, "Individual_Diagrams")
PREVIEW_SVG_DIR = os.path.join(BASE_DIR, "Preview", "SVG")
PREVIEW_PNG_DIR = os.path.join(BASE_DIR, "Preview", "PNG")
DOC_DIR = os.path.join(BASE_DIR, "Documentation")

os.makedirs(INDIV_DIR, exist_ok=True)
os.makedirs(PREVIEW_SVG_DIR, exist_ok=True)
os.makedirs(PREVIEW_PNG_DIR, exist_ok=True)
os.makedirs(DOC_DIR, exist_ok=True)


def calculate_layout(diag):
    lanes = diag["lanes"]
    assert len(lanes) == 2, f"Expected exactly 2 swimlanes, got {len(lanes)}"
    
    lane_info = []
    cur_x = 40
    for name, w in lanes:
        lane_info.append({
            "name": name,
            "x": cur_x,
            "w": w,
            "center": cur_x + w / 2
        })
        cur_x += w
    total_w = cur_x - 40
    
    # Calculate nodes position
    node_map = {}
    max_y = 600
    for n in diag["nodes"]:
        lane_idx = n["lane"]
        lane = lane_info[lane_idx]
        ntype = n["type"]
        y = n["y"]
        if y > max_y:
            max_y = y
        
        if ntype in ("start", "end"):
            w, h = 28, 28
            x = lane["center"] - 14
        elif ntype == "decision":
            w = n.get("w", 160 if lane_idx == 0 else 180)
            h = n.get("h", 55)
            x = lane["center"] - w / 2
        elif ntype == "action":
            w = n.get("w", 260 if lane_idx == 0 else 300)
            h = n.get("h", 52)
            x = lane["center"] - w / 2
        elif ntype in ("fork", "join"):
            w = n.get("w", 240)
            h = n.get("h", 6)
            x = lane["center"] - w / 2
        else:
            w, h = 120, 45
            x = lane["center"] - w / 2
            
        node_map[n["id"]] = {
            **n,
            "x": x,
            "y": y,
            "w": w,
            "h": h,
            "center_x": lane["center"],
            "center_y": y + h / 2
        }
        
    lane_h = max_y + 110
    return lane_info, node_map, total_w, lane_h


def build_drawio_diagram_xml(diag, lane_info, node_map, total_w, lane_h):
    lines = []
    lines.append(f'  <diagram id="{diag["id"]}" name="{diag["name"]}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{int(total_w + 120)}" pageHeight="{int(lane_h + 120)}" math="0" shadow="0"><root>')
    lines.append('    <mxCell id="0" />')
    lines.append('    <mxCell id="1" parent="0" />')
    
    # Title box
    title_html = html.escape(f"<div style='font-family: Arial, sans-serif;'><b><font style='font-size: 15px; color: #000000;'>{diag['title']}</font></b><br/><font style='font-size: 11px; color: #333333;'>{diag['subtitle']}</font></div>")
    lines.append(f'    <mxCell id="title_{diag["id"]}" value="{title_html}" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;" vertex="1" parent="1">')
    lines.append(f'      <mxGeometry x="40" y="15" width="{total_w}" height="45" as="geometry" />')
    lines.append('    </mxCell>')
    
    # Exactly 2 Swimlanes
    for i, lane in enumerate(lane_info):
        lane_val = html.escape(lane["name"])
        lines.append(f'    <mxCell id="lane_{diag["id"]}_{i}" value="{lane_val}" style="swimlane;whiteSpace=wrap;html=1;startSize=28;horizontal=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontColor=#000000;fontStyle=1;fontSize=12;fontFamily=Arial;collapsible=0;swimlaneFillColor=#ffffff;" vertex="1" parent="1">')
        lines.append(f'      <mxGeometry x="{lane["x"]}" y="70" width="{lane["w"]}" height="{lane_h}" as="geometry" />')
        lines.append('    </mxCell>')
        
    # Nodes
    for nid, n in node_map.items():
        val = html.escape(n.get("val", ""))
        ntype = n["type"]
        x, y, w, h = n["x"], n["y"], n["w"], n["h"]
        
        if ntype == "start":
            style = "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;fontColor=#ffffff;fontStyle=1;fontSize=10;fontFamily=Arial;"
            val = ""
        elif ntype == "end":
            style = "ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;"
            val = ""
        elif ntype == "action":
            style = "rounded=1;whiteSpace=wrap;html=1;arcSize=20;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontColor=#000000;fontSize=11;fontFamily=Arial;align=center;spacing=4;"
        elif ntype == "decision":
            style = "rhombus;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontColor=#000000;fontSize=10;fontFamily=Arial;align=center;spacing=2;"
        elif ntype in ("fork", "join"):
            style = "shape=line;strokeWidth=4;strokeColor=#000000;fillColor=#000000;"
            val = ""
        else:
            style = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;"
            
        lines.append(f'    <mxCell id="{nid}" value="{val}" style="{style}" vertex="1" parent="1">')
        lines.append(f'      <mxGeometry x="{int(x)}" y="{int(y)}" width="{int(w)}" height="{int(h)}" as="geometry" />')
        lines.append('    </mxCell>')
        
    # Edges
    for idx, e in enumerate(diag["edges"]):
        src_id = e["src"]
        dst_id = e["dst"]
        label = html.escape(e.get("label", ""))
        
        ports = ""
        if "exit_dir" in e:
            edir = e["exit_dir"]
            if edir == "bottom": ports += "exitX=0.5;exitY=1;exitDx=0;exitDy=0;"
            elif edir == "top": ports += "exitX=0.5;exitY=0;exitDx=0;exitDy=0;"
            elif edir == "left": ports += "exitX=0;exitY=0.5;exitDx=0;exitDy=0;"
            elif edir == "right": ports += "exitX=1;exitY=0.5;exitDx=0;exitDy=0;"
            
        if "entry_dir" in e:
            edir = e["entry_dir"]
            if edir == "top": ports += "entryX=0.5;entryY=0;entryDx=0;entryDy=0;"
            elif edir == "bottom": ports += "entryX=0.5;entryY=1;entryDx=0;entryDy=0;"
            elif edir == "left": ports += "entryX=0;entryY=0.5;entryDx=0;entryDy=0;"
            elif edir == "right": ports += "entryX=1;entryY=0.5;entryDx=0;entryDy=0;"
            
        edge_style = f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;endArrow=block;endFill=1;fontSize=10;fontColor=#000000;fontFamily=Arial;{ports}"
        edge_id = f"e_{diag['id']}_{idx}"
        
        lines.append(f'    <mxCell id="{edge_id}" value="{label}" style="{edge_style}" edge="1" parent="1" source="{src_id}" target="{dst_id}">')
        lines.append('      <mxGeometry relative="1" as="geometry">')
        if "waypoints" in e and e["waypoints"]:
            lines.append('        <Array as="points">')
            for wx, wy in e["waypoints"]:
                lines.append(f'          <mxPoint x="{int(wx)}" y="{int(wy)}" />')
            lines.append('        </Array>')
        lines.append('      </mxGeometry>')
        lines.append('    </mxCell>')
        
    lines.append('  </root></mxGraphModel></diagram>')
    return "\n".join(lines)


def build_svg(diag, lane_info, node_map, total_w, lane_h):
    svg_w = int(total_w + 80)
    svg_h = int(lane_h + 100)
    
    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{svg_w}" height="{svg_h}" viewBox="0 0 {svg_w} {svg_h}">')
    svg.append('  <defs>')
    svg.append('    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">')
    svg.append('      <path d="M 0 1 L 10 5 L 0 9 z" fill="#000000" />')
    svg.append('    </marker>')
    svg.append('  </defs>')
    svg.append('  <rect width="100%" height="100%" fill="#ffffff" />')
    
    # Title
    svg.append(f'  <text x="40" y="32" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="bold" fill="#000000">{html.escape(diag["title"])}</text>')
    svg.append(f'  <text x="40" y="52" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#333333">{html.escape(diag["subtitle"])}</text>')
    
    # Swimlanes
    for lane in lane_info:
        svg.append(f'  <rect x="{lane["x"]}" y="70" width="{lane["w"]}" height="{lane_h}" fill="#ffffff" stroke="#000000" stroke-width="1.2" />')
        svg.append(f'  <rect x="{lane["x"]}" y="70" width="{lane["w"]}" height="28" fill="#f8fafc" stroke="#000000" stroke-width="1.2" />')
        svg.append(f'  <text x="{lane["center"]}" y="89" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="#000000" text-anchor="middle">{html.escape(lane["name"])}</text>')
        
    # Edges
    for idx, e in enumerate(diag["edges"]):
        src = node_map[e["src"]]
        dst = node_map[e["dst"]]
        label = e.get("label", "")
        
        sx, sy = src["center_x"], src["y"] + src["h"]
        dx, dy = dst["center_x"], dst["y"]
        
        if e.get("exit_dir") == "right": sx, sy = src["x"] + src["w"], src["center_y"]
        elif e.get("exit_dir") == "left": sx, sy = src["x"], src["center_y"]
        elif e.get("exit_dir") == "top": sx, sy = src["center_x"], src["y"]
        
        if e.get("entry_dir") == "left": dx, dy = dst["x"], dst["center_y"]
        elif e.get("entry_dir") == "right": dx, dy = dst["x"] + dst["w"], dst["center_y"]
        elif e.get("entry_dir") == "bottom": dx, dy = dst["center_x"], dst["y"] + dst["h"]
        
        points = [(sx, sy)]
        if "waypoints" in e and e["waypoints"]:
            points.extend(e["waypoints"])
        points.append((dx, dy))
        
        d_path = f"M {points[0][0]} {points[0][1]}"
        for pt in points[1:]:
            d_path += f" L {pt[0]} {pt[1]}"
            
        svg.append(f'  <path d="{d_path}" fill="none" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)" />')
        
        if label:
            mid_x = (points[0][0] + points[1][0]) / 2 + 5
            mid_y = (points[0][1] + points[1][1]) / 2 - 5
            svg.append(f'  <rect x="{mid_x - 3}" y="{mid_y - 12}" width="{len(label)*6 + 6}" height="14" fill="#ffffff" stroke="none" />')
            svg.append(f'  <text x="{mid_x}" y="{mid_y}" font-family="Arial, Helvetica, sans-serif" font-size="10" font-weight="bold" fill="#000000">{html.escape(label)}</text>')

    # Nodes
    for nid, n in node_map.items():
        ntype = n["type"]
        lane_idx = n["lane"]
        x, y, w, h = n["x"], n["y"], n["w"], n["h"]
        val = n.get("val", "")
        
        if ntype == "start":
            svg.append(f'  <circle cx="{n["center_x"]}" cy="{n["center_y"]}" r="14" fill="#000000" stroke="#000000" />')
        elif ntype == "end":
            svg.append(f'  <circle cx="{n["center_x"]}" cy="{n["center_y"]}" r="14" fill="#ffffff" stroke="#000000" stroke-width="1.5" />')
            svg.append(f'  <circle cx="{n["center_x"]}" cy="{n["center_y"]}" r="8" fill="#000000" stroke="#000000" />')
        elif ntype == "action":
            svg.append(f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" ry="10" fill="#ffffff" stroke="#000000" stroke-width="1.2" />')
            wrap_w = 34 if lane_idx == 0 else 40
            lines = textwrap.wrap(val, width=wrap_w)
            start_y = n["center_y"] - (len(lines) - 1) * 6
            for li, line in enumerate(lines):
                svg.append(f'  <text x="{n["center_x"]}" y="{start_y + li*12}" font-family="Arial, Helvetica, sans-serif" font-size="10.5" fill="#000000" text-anchor="middle">{html.escape(line)}</text>')
        elif ntype == "decision":
            cx, cy = n["center_x"], n["center_y"]
            pts = f"{cx},{y} {x+w},{cy} {cx},{y+h} {x},{cy}"
            svg.append(f'  <polygon points="{pts}" fill="#ffffff" stroke="#000000" stroke-width="1.2" />')
            wrap_w = 20 if lane_idx == 0 else 24
            lines = textwrap.wrap(val, width=wrap_w)
            start_y = cy - (len(lines) - 1) * 6
            for li, line in enumerate(lines):
                svg.append(f'  <text x="{cx}" y="{start_y + li*11}" font-family="Arial, Helvetica, sans-serif" font-size="9.5" fill="#000000" text-anchor="middle">{html.escape(line)}</text>')
        elif ntype in ("fork", "join"):
            svg.append(f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#000000" stroke="#000000" />')

    svg.append('</svg>')
    return "\n".join(svg)


def main():
    print("=== STARTING ZOOGUIDE 16 ACTIVITY DIAGRAM GENERATION (2-SWIMLANE EDITION) ===")
    
    multi_diagrams_xml = []
    
    for idx, diag in enumerate(DIAGRAMS):
        lane_info, node_map, total_w, lane_h = calculate_layout(diag)
        
        # Verify 2 swimlanes
        assert len(lane_info) == 2, f"Diagram {diag['name']} must have exactly 2 swimlanes!"
        
        # 1. Build Diagram XML chunk
        diag_xml = build_drawio_diagram_xml(diag, lane_info, node_map, total_w, lane_h)
        multi_diagrams_xml.append(diag_xml)
        
        # 2. Build and save individual Draw.io file
        indiv_content = f'<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" agent="ZooGuide OOAD Academic Report" version="24.7.5" type="device">\n{diag_xml}\n</mxfile>'
        indiv_path = os.path.join(INDIV_DIR, f"{diag['filename']}.drawio")
        with open(indiv_path, "w", encoding="utf-8") as f:
            f.write(indiv_content)
            
        # Verify XML syntax
        try:
            ET.fromstring(indiv_content)
            print(f"[{idx+1:02d}/16] Generated 2-Lane Individual: {diag['filename']}.drawio (Valid XML)")
        except Exception as err:
            print(f"Error validating {diag['filename']}.drawio: {err}")
            sys.exit(1)
            
        # 3. Build and save SVG file
        svg_content = build_svg(diag, lane_info, node_map, total_w, lane_h)
        svg_path = os.path.join(PREVIEW_SVG_DIR, f"{diag['filename']}.svg")
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
            
        # 4. Render PNG via qlmanage on macOS
        png_out_dir = PREVIEW_PNG_DIR
        cmd = ["qlmanage", "-t", "-s", "1600", "-o", png_out_dir, svg_path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        generated_png = os.path.join(png_out_dir, f"{diag['filename']}.svg.png")
        target_png = os.path.join(png_out_dir, f"{diag['filename']}.png")
        if os.path.exists(generated_png):
            if os.path.exists(target_png):
                os.remove(target_png)
            os.rename(generated_png, target_png)
            print(f"       Generated SVG & PNG Previews: {diag['filename']}.svg & .png")
        else:
            print(f"       Warning: qlmanage did not produce {generated_png}")

    # 5. Build and save Master Combined Draw.io file
    master_content = '<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" agent="ZooGuide OOAD Academic Report" version="24.7.5" type="device">\n' + "\n".join(multi_diagrams_xml) + "\n</mxfile>"
    master_path = os.path.join(BASE_DIR, "ZooGuide_16_Activity_Diagrams.drawio")
    with open(master_path, "w", encoding="utf-8") as f:
        f.write(master_content)
        
    try:
        tree = ET.fromstring(master_content)
        d_count = len(tree.findall("diagram"))
        print(f"\n Master File Generated: {master_path}")
        print(f" Master File Pages: {d_count} pages verified.")
    except Exception as err:
        print(f"Error validating master file: {err}")
        sys.exit(1)

    print("\nAll 16 Activity Diagrams successfully re-generated with EXACTLY 2 SWIMLANES and verified!")

if __name__ == "__main__":
    main()
