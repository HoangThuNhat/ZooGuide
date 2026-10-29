import asyncio
import edge_tts
from narrations_data import FEATURED_NARRATIONS

text = FEATURED_NARRATIONS[0]["translations"]["vi"]["content"]
voice = "vi-VN-HoaiMyNeural"

print(f"Length of text: {len(text)}")
print(f"Text: {text[:100]}...")

async def test():
    try:
        comm = edge_tts.Communicate(text, voice)
        audio = bytearray()
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio.extend(chunk["data"])
            elif chunk["type"] == "SentenceBoundary":
                print("Boundary chunk:", chunk)
        print(f"Received {len(audio)} bytes!")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

asyncio.run(test())
