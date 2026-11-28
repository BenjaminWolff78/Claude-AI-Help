"""blankscan.py video.mp4 [first_frame]  - the v34 render-hygiene scan: every frame decoded small and grey; flags near-uniform
frames outside the caption band (std < 6 of 255) and one-frame brightness spikes (|mean - mean of both neighbours| > 25 while the neighbours agree)."""
import subprocess, sys
import numpy as np
src = sys.argv[1]; f0 = int(sys.argv[2]) if len(sys.argv) > 2 else 0
w, h = 68, 120
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={w}:{h}", "-pix_fmt", "gray", "-f", "rawvideo", "-"], capture_output=True).stdout
X = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
keep = np.r_[0:int(h * 0.55), int(h * 0.76):h]                     # rows outside the caption band (a caption keeps a white frame's std up)
Y = X[:, keep, :].reshape(len(X), -1); m = Y.mean(1); s = Y.std(1)
bad = []
for i in range(len(X)):
    if s[i] < 6: bad.append((i + f0, "near-uniform", round(float(m[i]), 1)))
    elif 0 < i < len(X) - 1 and abs(m[i] - (m[i - 1] + m[i + 1]) / 2) > 25 and abs(m[i - 1] - m[i + 1]) < 10: bad.append((i + f0, "spike", round(float(m[i]), 1)))
print(f"{len(X)} frames scanned, {len(bad)} bad")
for b in bad[:60]: print(" ", b)
