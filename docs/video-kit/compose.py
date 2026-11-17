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

os.makedirs(f"{D}/seg", exist_ok=True)
srt, clock, seg_files = [], 0.0, []
for s in sc:
    T = round(s["audio"] + LEAD + TAIL, 2)
    out = f"{D}/seg/{s['id']}.mp4"
    inputs, fc = [], []
    if s["kind"] == "slide":
        inputs = ["-loop", "1", "-t", str(T), "-i", f"{D}/slides/{s['id']}.png"]
        fc.append(f"[0:v]scale={W}:{H},fps={FPS},trim=duration={T}[raw]")
        info = "slide"
    else:
        if s["kind"] == "split":
            me = json.load(open(f"{D}/clips/s05-elder.json")); mf = json.load(open(f"{D}/clips/s05-family.json"))
            inputs = ["-i", f"{D}/clips/s05-elder.webm", "-i", f"{D}/clips/s05-family.webm"]
            off = me["start"] - mf["start"]
            fc.append(f"[1:v]trim=start={max(0,-off):.3f},setpts=PTS-STARTPTS[fam];[0:v]trim=start={max(0,off):.3f},setpts=PTS-STARTPTS[eld];[eld][fam]hstack=2,fps={FPS}[src]")
            base = max(0, off)
            marks = {"start": me["start"] - base, "end": me["end"] - base, "waits": [[a - base, b - base] for a, b in me["waits"]]}
        else:
            marks = json.load(open(f"{D}/clips/{s['id']}.json"))
            inputs = ["-i", f"{D}/clips/{s['id']}.webm"]
            fc.append(f"[0:v]fps={FPS}[src]")
        f2, real, ws, ov = clip_filter("src", marks, T)
        fc.append(f2)
        tail = s.get("tail_slide")
        if tail and real < T - 2:
            # 素材不足时接一张说明图，而不是定格
            inputs += ["-loop", "1", "-t", f"{T-real+0.5:.2f}", "-i", f"{D}/slides/{tail}.png"]
            ti = len([x for x in inputs if x == "-i"]) - 1
            fc.append(f"[raw]scale={W}:{H},setsar=1[rs];[{ti}:v]scale={W}:{H},fps={FPS},setsar=1,fade=t=in:st=0:d=0.4[ts];[rs][ts]concat=n=2:v=1:a=0[rawp]"); last = "rawp"
        elif real < T: fc.append(f"[raw]tpad=stop_mode=clone:stop_duration={T-real+0.5:.2f}[rawp]"); last = "rawp"
        else: last = "raw"
        fc.append(f"[{last}]scale={W}:{H},trim=duration={T},setpts=PTS-STARTPTS[raw2]")
        fc[-1] = fc[-1]  # noqa
        info = f"clip 等待加速 {ws:.1f}x 整体 {ov:.2f}x 素材 {real:.1f}s"
    # 统一出口标签
    vlabel = "raw" if s["kind"] == "slide" else "raw2"
    fc.append(f"[{vlabel}]fade=t=in:st=0:d=0.35,fade=t=out:st={T-0.35:.2f}:d=0.35,format=yuv420p[v0]")
    # 字幕叠加
    cur = "v0"; n_in = len([x for x in inputs if x == "-i"])
    for i, it in enumerate(s["subs"]):
        inputs += ["-i", it["png"]]
        nxt = f"v{i+1}"
        fc.append(f"[{cur}][{n_in + i}:v]overlay=0:{H-170}:enable='between(t,{it['a']:.2f},{it['b']:.2f})'[{nxt}]"); cur = nxt
        srt.append((clock + it["a"], clock + it["b"], it["text"]))
    inputs += ["-i", f"{D}/audio/{s['id']}.wav"]
    ai = len([x for x in inputs if x == "-i"]) - 1
    fc.append(f"[{ai}:a]adelay={int(LEAD*1000)}|{int(LEAD*1000)},apad,atrim=0:{T}[a]")
    run(["ffmpeg","-y","-loglevel","error", *inputs, "-filter_complex", ";".join(fc), "-map", f"[{cur}]", "-map", "[a]",
         "-c:v","libx264","-preset","medium","-crf","20","-r",str(FPS),"-c:a","aac","-b:a","192k","-ar","48000","-t",str(T), out])
    print(f"{s['id']} {s['title']:<14} {T:6.1f}s  {info}")
    seg_files.append(out); clock += T

with open(f"{D}/concat.txt", "w") as f:
    for p in seg_files: f.write(f"file '{p}'\n")
final = sys.argv[1]
run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",f"{D}/concat.txt","-c","copy","-movflags","+faststart",final])
def ts(x): h=int(x//3600); m=int(x%3600//60); s=x%60; return f"{h:02d}:{m:02d}:{int(s):02d},{int((s%1)*1000):03d}"
with open(final.replace(".mp4", ".srt"), "w") as f:
    for i, (a, b, t) in enumerate(srt, 1): f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{t}\n\n")
print(f"成片 {dur(final):.1f}s → {final}")
