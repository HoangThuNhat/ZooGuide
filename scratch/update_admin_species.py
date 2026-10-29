import re

file_path = "web/src/pages/admin/AdminSpeciesPage.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Search filter
pattern_search = r'// Search filter: Tên tiếng Việt, Tên tiếng Anh / khoa học, Mô tả[\s\S]*?if \(!matchVi && !matchEn && !matchDesc\) \{\s*return false;\s*\}'
replacement_search = """// Search filter: Tên thường gọi (name/nameVi), Tên khoa học (scientificName/nameEn), Mô tả
            if (searchTerm.trim()) {
                const term = searchTerm.trim().toLowerCase();
                const name = (s.name || s.nameVi || '').toLowerCase();
                const sciName = (s.scientificName || s.nameEn || '').toLowerCase();
                const desc = (s.description || '').toLowerCase();
                if (!name.includes(term) && !sciName.includes(term) && !desc.includes(term)) {
                    return false;
                }
            }"""
content, c1 = re.subn(pattern_search, replacement_search, content)
print(f"Sub 1 (search): {c1}")

# 2. Sorting
pattern_sort = r'if \(sortBy === \'name-asc\'\) return \(a\.nameVi \|\| \'\'\)\.localeCompare\(b\.nameVi \|\| \'\'[\s\S]*?if \(sortBy === \'name-desc\'\) return \(b\.nameVi \|\| \'\'\)\.localeCompare\(a\.nameVi \|\| \'\', \'vi\'\);'
replacement_sort = """if (sortBy === 'name-asc') return (a.name || a.nameVi || '').localeCompare(b.name || b.nameVi || '', 'vi');
            if (sortBy === 'name-desc') return (b.name || b.nameVi || '').localeCompare(a.name || a.nameVi || '', 'vi');"""
content, c2 = re.subn(pattern_sort, replacement_sort, content)
print(f"Sub 2 (sort): {c2}")

# 3. handleEdit
pattern_edit = r'const handleEdit = \(s\) => \{[\s\S]*?nameVi: s\.nameVi,[\s\S]*?nameEn: s\.nameEn \|\| \'\','
replacement_edit = """const handleEdit = (s) => {
        setEditMode(true);
        setEditId(s.speciesId || s.id);
        setFormData({
            nameVi: s.name || s.nameVi || '',
            nameEn: s.scientificName || s.nameEn || '',"""
content, c3 = re.subn(pattern_edit, replacement_edit, content)
print(f"Sub 3 (handleEdit): {c3}")

# 4. Table cell render
pattern_render = r'<span className="font-bold text-primary">\{s\.nameVi\}</span>\s*</div>\s*</td>\s*<td className="italic">\{s\.nameEn\}</td>'
replacement_render = """<span className="font-bold text-primary">{s.name || s.nameVi}</span>
                                                </div>
                                            </td>
                                            <td className="italic">{s.scientificName || s.nameEn}</td>"""
content, c4 = re.subn(pattern_render, replacement_render, content)
print(f"Sub 4 (render): {c4}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("AdminSpeciesPage.jsx updated successfully!")
