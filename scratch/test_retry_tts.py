import asyncio
import os
import edge_tts
from narrations_data import FEATURED_NARRATIONS

async def generate_speech_with_retry(text, voice, max_retries=3):
    for attempt in range(1, max_retries + 1):
        try:
            comm = edge_tts.Communicate(text, voice)
            audio_data = bytearray()
            max_duration = 0.0
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    audio_data.extend(chunk["data"])
                elif chunk["type"] == "SentenceBoundary":
                    dur = (chunk["offset"] + chunk["duration"]) / 10000000.0
                    if dur > max_duration:
                        max_duration = dur
            duration_sec = round(max_duration)
            if duration_sec <= 0:
                duration_sec = max(10, round(len(text) / 18))
            return bytes(audio_data), duration_sec
        except Exception as e:
            print(f"Attempt {attempt} failed ({type(e).__name__}): {e}")
            if attempt < max_retries:
                await asyncio.sleep(1.5 * attempt)
            else:
                raise

async def test():
    text = FEATURED_NARRATIONS[0]["translations"]["vi"]["content"]
    voice = "vi-VN-HoaiMyNeural"
    b, dur = await generate_speech_with_retry(text, voice)
    print(f"Success! {len(b)} bytes, duration: {dur}s")

asyncio.run(test())
