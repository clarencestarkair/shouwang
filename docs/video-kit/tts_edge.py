"""用 Microsoft 神经语音（edge-tts）为每个场景生成旁白。用法: python gen.py <voice> [scene_id ...]"""
import asyncio, json, subprocess, sys
import edge_tts

VOICE = sys.argv[1]
ONLY = set(sys.argv[2:])
SC = "/tmp/sw-video/script.json"
