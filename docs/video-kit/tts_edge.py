"""用 Microsoft 神经语音（edge-tts）为每个场景生成旁白。用法: python gen.py <voice> [scene_id ...]"""
import asyncio, json, subprocess, sys
import edge_tts

VOICE = sys.argv[1]
ONLY = set(sys.argv[2:])
SC = "/tmp/sw-video/script.json"

async def one(s):
    text = s["text"].replace("「", "").replace("」", "")
    mp3 = f"/tmp/sw-video/audio/{s['id']}.mp3"
    for attempt in range(3):
        try:
            c = edge_tts.Communicate(text, VOICE, rate="+4%", proxy="http://127.0.0.1:7890")
            await c.save(mp3)
            break
        except Exception as e:
            if attempt == 2: raise
            await asyncio.sleep(2)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ar", "48000", "-ac", "2", f"/tmp/sw-video/audio/{s['id']}.wav"], check=True)
    s["audio"] = round(float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"/tmp/sw-video/audio/{s['id']}.wav"]).decode()), 2)
    print(s["id"], s["audio"])

async def main():
    sc = json.load(open(SC))
    for s in sc:
        if not ONLY or s["id"] in ONLY:
            await one(s)
    json.dump(sc, open(SC, "w"), ensure_ascii=False, indent=1)
    print(f"总时长约 {sum(x['audio'] + 1.6 for x in sc) / 60:.1f} 分钟")

asyncio.run(main())
