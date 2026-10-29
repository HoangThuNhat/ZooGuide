import asyncio
import edge_tts

async def run():
    text = "Chào mừng bạn đến với bãi thả Voi Châu Á tại Thảo Cầm Viên Sài Gòn."
    voice = "vi-VN-HoaiMyNeural"
    comm = edge_tts.Communicate(text, voice)
    await comm.save("scratch/test_voi.mp3")
    print("Saved test_voi.mp3 successfully!")

asyncio.run(run())
