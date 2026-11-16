"""用 Microsoft 神经语音（edge-tts）为每个场景生成旁白。用法: python gen.py <voice> [scene_id ...]"""
import asyncio, json, subprocess, sys
import edge_tts

VOICE = sys.argv[1]
ONLY = set(sys.argv[2:])
SC = "/tmp/sw-video/script.json"

async def main():
    sc = json.load(open(SC))
    for s in sc:
        if not ONLY or s["id"] in ONLY:
            await one(s)
    json.dump(sc, open(SC, "w"), ensure_ascii=False, indent=1)
    print(f"总时长约 {sum(x['audio'] + 1.6 for x in sc) / 60:.1f} 分钟")
