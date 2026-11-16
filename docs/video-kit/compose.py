"""合成演示视频：素材按旁白时长自适应变速 + 字幕叠加 + 拼接。用法: python3 -I compose.py <输出mp4>"""
import json, re, subprocess, sys, os
W, H, FPS = 1920, 1080, 30
LEAD, TAIL = 0.6, 1.0
D = "/tmp/sw-video"
sc = json.load(open(f"{D}/script.json"))

def run(cmd):
    subprocess.run(cmd, check=True)

def dur(p):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p]).decode())
