file_path = "web/src/pages/admin/AdminAreasPage.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("latitude: '10.7875',\n        longitude: '106.7052',", "latitude: '',\n        longitude: '',")
text = text.replace("latitude: '10.7875',\r\n        longitude: '106.7052',", "latitude: '',\r\n        longitude: '',")

text = text.replace("latitude: parseFloat(areaForm.latitude) || 10.7875,\n            longitude: parseFloat(areaForm.longitude) || 106.7052,", "latitude: areaForm.latitude !== '' ? parseFloat(areaForm.latitude) : null,\n            longitude: areaForm.longitude !== '' ? parseFloat(areaForm.longitude) : null,")
text = text.replace("latitude: parseFloat(areaForm.latitude) || 10.7875,\r\n            longitude: parseFloat(areaForm.longitude) || 106.7052,", "latitude: areaForm.latitude !== '' ? parseFloat(areaForm.latitude) : null,\r\n            longitude: areaForm.longitude !== '' ? parseFloat(areaForm.longitude) : null,")

text = text.replace("latitude: String(area.latitude || '10.7875'),\n            longitude: String(area.longitude || '106.7052'),", "latitude: area.latitude != null ? String(area.latitude) : '',\n            longitude: area.longitude != null ? String(area.longitude) : '',")
text = text.replace("latitude: String(area.latitude || '10.7875'),\r\n            longitude: String(area.longitude || '106.7052'),", "latitude: area.latitude != null ? String(area.latitude) : '',\r\n            longitude: area.longitude != null ? String(area.longitude) : '',")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Area coordinates fixed successfully!")
