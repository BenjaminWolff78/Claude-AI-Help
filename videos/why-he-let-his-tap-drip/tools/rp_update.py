"""Read the final-render log + chunk files, update /home/claude/.render-progress.json, and print the bars."""
import json, re, os, glob, datetime, subprocess, sys
T = 1890; N = 80
done = sorted(glob.glob('/home/claude/p13/app/out/chunks/c_*.mp4'))
full = [d for d in done if not d.endswith('.part.mp4')]
fd = len(full) * N
log = open('/home/claude/p13/render.log').read()
m = re.findall(r'(c_\d{4})\.mp4 (\d+) (\d+)s', log)
cur = 0
if m:
    name, n, s = m[-1]
    if not os.path.exists(f'/home/claude/p13/app/out/chunks/{name}.mp4'): cur = int(n)
fd = min(T, fd + cur)
t0 = os.path.getmtime('/home/claude/p13/app/out/chunks/c_0000.mp4') - 898 if os.path.exists('/home/claude/p13/app/out/chunks/c_0000.mp4') else None
el = (datetime.datetime.now().timestamp() - t0) / 60 if t0 else 1
fpm = 6.5   # 2026-11-25 pig set: ~9 s per frame at dpr 1.0, 2k shadows, no lens
eta = (T - fd) / max(fpm, 0.1) + 3
P = "/home/claude/.render-progress.json"
d = json.load(open(P)); now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
d.update({"stage": "rendering" if fd < T else "finishing", "framesDone": fd, "framesPerMin": round(fpm, 2), "capFrames": min(T - 1, (fd // N + 1) * N - 1), "etaMin": round(eta), "updatedAt": now})
json.dump(d, open(P, "w"))
pct = 70 + 25 * fd / T
subprocess.run(["python3", "-I", "/home/claude/p4/tools/render_progress_make.py", f"{pct:.1f}", f"Final render {fd}/{T} frames", f"{eta:.0f}"])
