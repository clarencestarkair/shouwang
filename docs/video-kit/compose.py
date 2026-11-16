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

# ---------- 字幕切分 ----------
def chunks(text):
    parts = [p for p in re.split(r"(?<=[，。；：！？])", text.replace("「","").replace("」","")) if p.strip()]
    out, buf = [], ""
    for p in parts:
        if len(buf) + len(p) <= 22: buf += p
        else:
            if buf: out.append(buf)
            buf = p
            while len(buf) > 26:  # 超长句硬切
                out.append(buf[:22]); buf = buf[22:]
    if buf: out.append(buf)
    return [re.sub(r"[，。；：]$", "", c) for c in out]
