import asyncio
import edge_tts

VOICES = [
    ("vi", "vi-VN-HoaiMyNeural", "Xin chào quý khách."),
    ("en", "en-US-JennyNeural", "Welcome to Saigon Zoo."),
    ("zh", "zh-CN-XiaoxiaoNeural", "欢迎来到西贡动植物园。"),
    ("ja", "ja-JP-NanamiNeural", "サイゴン動植物園へようこそ。"),
    ("ko", "ko-KR-SunHiNeural", "사이공 동식물원에 오신 것을 환영합니다."),
    ("th", "th-TH-NiwatNeural", "ยินดีต้อนรับสู่สวนสัตว์ไซ่ง่อน"),
    ("fr", "fr-FR-DeniseNeural", "Bienvenue au Zoo de Saigon."),
    ("es", "es-ES-ElviraNeural", "Bienvenidos al Zoológico de Saigón."),
    ("de", "de-DE-KatjaNeural", "Willkommen im Zoo von Saigon."),
    ("ru", "ru-RU-SvetlanaNeural", "Добро пожаловать в зоопарк Сайгона."),
    ("pt", "pt-BR-FranciscaNeural", "Bem-vindos ao Zoológico de Saigon."),
    ("id", "id-ID-GadisNeural", "Selamat datang di Kebun Binatang Saigon.")
]

async def test_voices():
    print("Testing 12 Edge-TTS voices...")
    for code, voice, text in VOICES:
        try:
            comm = edge_tts.Communicate(text, voice)
            audio = bytearray()
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    audio.extend(chunk["data"])
            print(f"[{code}] {voice} -> SUCCESS ({len(audio)} bytes)")
        except Exception as e:
            print(f"[{code}] {voice} -> FAILED: {e}")

asyncio.run(test_voices())
