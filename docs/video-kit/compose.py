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

subs_all, html_items = [], []
for s in sc:
    cs = chunks(s["text"]); total = sum(len(c) for c in cs); t = LEAD; items = []
    for i, c in enumerate(cs):
        d = s["audio"] * len(c) / total
        items.append({"text": c, "a": t, "b": t + d, "png": f"{D}/subs/{s['id']}_{i}.png"}); t += d
    s["subs"] = items
    html_items += items
json.dump([{"text": x["text"], "png": x["png"]} for x in html_items], open(f"{D}/subs.json", "w"), ensure_ascii=False)
run(["node", "/tmp/sw-shot/scripts/subs.js"])

# ---------- 每段视频 ----------
def clip_filter(src_label, marks, target):
    a0, end = marks["start"], marks["end"]
    waits = [(max(a, a0), min(b, end)) for a, b in marks["waits"] if b > a0]
    wt = sum(b - a for a, b in waits); normal = (end - a0) - wt
    if wt > 0 and normal < target - 1:
        ws = min(20.0, max(1.0, wt / (target - normal))); overall = 1.0
    else:
        ws = 12.0 if wt > 0 else 1.0
        overall = max(1.0, (normal + wt / ws) / target)
    # 区间序列
    segs, t = [], a0
    for a, b in waits:
        if a > t: segs.append((t, a, overall))
        segs.append((a, b, ws * overall)); t = b
    if end > t: segs.append((t, end, overall))
    f, labels = [], []
    for i, (a, b, sp) in enumerate(segs):
        f.append(f"[{src_label}]trim=start={a:.3f}:end={b:.3f},setpts=(PTS-STARTPTS)/{sp:.4f}[c{i}]"); labels.append(f"[c{i}]")
    split = f"[{src_label}]split={len(segs)}" + "".join(f"[{src_label}{i}]" for i in range(len(segs)))
    f = [split] + [x.replace(f"[{src_label}]", f"[{src_label}{i}]", 1) for i, x in enumerate(f)]
    f.append("".join(labels) + f"concat=n={len(segs)}:v=1:a=0[raw]")
    real = sum((b - a) / sp for a, b, sp in segs)
    return ";".join(f), real, ws, overall
