import xml.etree.ElementTree as ET
from xml.dom import minidom
import os

class DrawioBuilder:
    def __init__(self):
        self.mxfile = ET.Element('mxfile', {
            'host': 'app.diagrams.net',
            'agent': 'ZooGuide Architecture Team',
            'version': '24.7.5',
            'type': 'device'
        })
        self.cell_counter = 2

    def next_id(self):
        self.cell_counter += 1
        return f"cell_{self.cell_counter}"

    def create_page(self, page_id, page_name, width=1600, height=1200):
        diagram = ET.SubElement(self.mxfile, 'diagram', {
            'id': page_id,
            'name': page_name
        })
        model = ET.SubElement(diagram, 'mxGraphModel', {
            'dx': '1422',
            'dy': '794',
            'grid': '1',
            'gridSize': '10',
            'guides': '1',
            'tooltips': '1',
            'connect': '1',
            'arrows': '1',
            'fold': '1',
            'page': '1',
            'pageScale': '1',
            'pageWidth': str(width),
            'pageHeight': str(height),
            'math': '0',
            'shadow': '0'
        })
        root = ET.SubElement(model, 'root')
        ET.SubElement(root, 'mxCell', {'id': '0'})
        ET.SubElement(root, 'mxCell', {'id': '1', 'parent': '0'})
        return root

    def add_swimlane(self, root, title, x, y, w, h, fill_color="#F8FAFC", stroke_color="#64748B"):
        cid = self.next_id()
        style = (f"swimlane;whiteSpace=wrap;html=1;startSize=36;horizontal=1;"
                 f"fillColor={fill_color};strokeColor={stroke_color};strokeWidth=1.5;"
                 f"fontColor=#0F172A;fontStyle=1;fontSize=13;align=center;")
        cell = ET.SubElement(root, 'mxCell', {
            'id': cid,
            'value': title,
            'style': style,
            'vertex': '1',
            'parent': '1'
        })
        ET.SubElement(cell, 'mxGeometry', {
            'x': str(x),
            'y': str(y),
            'width': str(w),
            'height': str(h),
            'as': 'geometry'
        })
        return cid

    def add_start(self, root, x, y, label="Bắt đầu", parent="1"):
        cid = self.next_id()
        style = "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#10B981;strokeColor=#047857;strokeWidth=2;fontColor=#FFFFFF;fontStyle=1;fontSize=11;"
        cell = ET.SubElement(root, 'mxCell', {
            'id': cid,
            'value': label,
            'style': style,
            'vertex': '1',
            'parent': parent
        })
        ET.SubElement(cell, 'mxGeometry', {
            'x': str(x),
            'y': str(y),
            'width': '40',
            'height': '40',
            'as': 'geometry'
        })
        return cid

    def add_end(self, root, x, y, label="Kết thúc", parent="1"):
        cid = self.next_id()
        style = "ellipse;html=1;shape=endState;fillColor=#EF4444;strokeColor=#B91C1C;strokeWidth=2;fontColor=#FFFFFF;fontStyle=1;fontSize=11;"
        cell = ET.SubElement(root, 'mxCell', {
            'id': cid,
            'value': label,
            'style': style,
            'vertex': '1',
            'parent': parent
        })
        ET.SubElement(cell, 'mxGeometry', {
            'x': str(x),
            'y': str(y),
            'width': '40',
            'height': '40',
            'as': 'geometry'
        })
        return cid

    def add_action(self, root, text, x, y, w=190, h=55, fill="#EFF6FF", stroke="#2563EB", parent="1"):
        cid = self.next_id()
        style = (f"rounded=1;whiteSpace=wrap;html=1;arcSize=24;"
                 f"fillColor={fill};strokeColor={stroke};strokeWidth=1.5;"
                 f"fontColor=#1E293B;fontSize=11;fontStyle=1;spacing=4;align=center;")
        cell = ET.SubElement(root, 'mxCell', {
            'id': cid,
            'value': text,
            'style': style,
            'vertex': '1',
            'parent': parent
        })
        ET.SubElement(cell, 'mxGeometry', {
            'x': str(x),
            'y': str(y),
            'width': str(w),
            'height': str(h),
            'as': 'geometry'
        })
        return cid

    def add_decision(self, root, text, x, y, w=160, h=70, fill="#FEF3C7", stroke="#D97706", parent="1"):
        cid = self.next_id()
        style = (f"rhombus;whiteSpace=wrap;html=1;"
                 f"fillColor={fill};strokeColor={stroke};strokeWidth=1.5;"
                 f"fontColor=#1E293B;fontSize=10;fontStyle=1;spacing=2;align=center;")
        cell = ET.SubElement(root, 'mxCell', {
            'id': cid,
            'value': text,
            'style': style,
            'vertex': '1',
            'parent': parent
        })
        ET.SubElement(cell, 'mxGeometry', {
            'x': str(x),
            'y': str(y),
            'width': str(w),
            'height': str(h),
            'as': 'geometry'
        })
        return cid

    def add_edge(self, root, src_id, tgt_id, label="", style_extra="", parent="1"):
        cid = self.next_id()
        base_style = ("edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
                      "strokeColor=#475569;strokeWidth=1.5;endArrow=block;endFill=1;"
                      "fontSize=10;fontColor=#334155;fontStyle=1;")
        if style_extra:
            base_style += style_extra

        cell = ET.SubElement(root, 'mxCell', {
            'id': cid,
            'value': label,
            'style': base_style,
            'edge': '1',
            'source': src_id,
            'target': tgt_id,
            'parent': parent
        })
        ET.SubElement(cell, 'mxGeometry', {
            'relative': '1',
            'as': 'geometry'
        })
        return cid

    def add_title(self, root, title, subtitle, x=40, y=20, w=1000, h=50):
        cid = self.next_id()
        html_val = f"<b><font style='font-size: 16px; color: #0F172A;'>{title}</font></b><br/><font style='font-size: 12px; color: #475569;'>{subtitle}</font>"
        style = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;"
        cell = ET.SubElement(root, 'mxCell', {
            'id': cid,
            'value': html_val,
            'style': style,
            'vertex': '1',
            'parent': '1'
        })
        ET.SubElement(cell, 'mxGeometry', {
            'x': str(x),
            'y': str(y),
            'width': str(w),
            'height': str(h),
            'as': 'geometry'
        })
        return cid

    def save(self, filepath):
        xml_str = ET.tostring(self.mxfile, encoding='utf-8')
        reparsed = minidom.parseString(xml_str)
        pretty_xml = reparsed.toprettyxml(indent="  ")
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(pretty_xml)
        print(f"Exported drawio file to {filepath}")

print("DrawioBuilder class defined successfully")
