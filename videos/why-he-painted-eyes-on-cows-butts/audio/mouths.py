"""per-frame talking mouth from the voice loudness (leads the sound by 1 frame); changes every voiced frame"""
import numpy as np, soundfile as sf, json, sys
x, sr = sf.read(sys.argv[1]); x = x.mean(1) if x.ndim > 1 else x
N = int(np.ceil(len(x) / sr * 30)) + 2
rms = np.array([np.sqrt(np.mean(x[int(i * sr / 30):int((i + 1) * sr / 30)] ** 2) + 1e-12) if int(i * sr / 30) < len(x) else 1e-6 for i in range(N)])
db = 20 * np.log10(rms); ref = np.percentile(db[db > -50], 90)
SH = {0: ["dash"], 1: ["o", "smile"], 2: ["smileWide", "teeth", "o"], 3: ["O", "smileWide", "teeth"]}
out, prev = [], None
for i in range(N):
    d = db[min(N - 1, i + 1)] - ref  # lead by one frame
    lv = 0 if d < -26 else 1 if d < -14 else 2 if d < -7 else 3
    opts = [m for m in SH[lv] if m != prev] or SH[lv]
    m = opts[i % len(opts)]; out.append(m); prev = m
json.dump(out, open(sys.argv[2], "w"))
print(N, sum(1 for m in out if m != "dash"))
