"""chunkcheck.py chunks_dir checks.json  - render hygiene after each chunk (v34 11.5): a blank-frame scan of every frame of each new
chunk and a jump check across each chunk seam (last frame of the previous chunk vs the first of this one: mean abs difference on
a small grey copy, compared with the typical frame-to-frame change inside the chunks). Results go to checks.json; checked
chunks are skipped next time. Prints only new results."""
import glob, json, os, subprocess, sys
import numpy as np
d, cj = sys.argv[1:3]
checks = json.load(open(cj)) if os.path.exists(cj) else []
done = {c["chunk"] for c in checks if c["check"] == "blank"}
def frames(p, sel=None):
    vf = "scale=68:120" if sel is None else f"select={sel},scale=68:120"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-vf", vf, "-vsync", "0", "-pix_fmt", "gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 120, 68).astype(np.float32)
chunks = sorted(c for c in glob.glob(os.path.join(d, "c_*.mp4")) if not c.endswith(".part.mp4"))
prev_last = prev_last2 = None
for c in chunks:
    name = os.path.basename(c); f0 = int(name[2:6])
    if name in done:                                   # already checked: only its last two frames are needed for the next seam
        n = min(80, 1986 - f0); L2 = frames(c, f"gte(n\\,{n - 2})"); prev_last, prev_last2 = L2[-1], L2[-2]; continue
    X = frames(c)
    if True:
        keep = np.r_[0:66, 91:120]; Y = X[:, keep, :].reshape(len(X), -1); m, s = Y.mean(1), Y.std(1)
        bad = [int(i + f0) for i in range(len(X)) if s[i] < 6 or (0 < i < len(X) - 1 and abs(m[i] - (m[i - 1] + m[i + 1]) / 2) > 25 and abs(m[i - 1] - m[i + 1]) < 10)]
        checks.append({"check": "blank", "chunk": name, "range": [f0, f0 + len(X) - 1], "result": "PASS" if not bad else f"FAIL {bad[:10]}"})
        print(name, "blank:", checks[-1]["result"])
        if prev_last is not None:
            seam = float(np.abs(X[0] - prev_last).mean()); after = float(np.abs(X[1] - X[0]).mean())
            before = float(np.abs(prev_last - prev_last2).mean()) if prev_last2 is not None else after
            near = max(before, after)                            # the motion on both sides of the seam: a moving camera is not a jump
            res = "PASS" if seam <= max(6.0, 1.5 * near + 3) else f"FAIL seam {seam:.1f} vs neighbours {before:.1f} / {after:.1f}"
            checks.append({"check": "seam", "chunk": name, "range": [f0 - 1, f0], "result": res}); print(name, "seam:", res)
    prev_last, prev_last2 = X[-1], X[-2]
json.dump(checks, open(cj, "w"), indent=0)
