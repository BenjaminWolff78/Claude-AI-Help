"""Second pass: per-line DTW (10 ms hop) between the placeholder line audio and the real audio span found by
align_dtw.py. Refines word boundaries. Reads audio2/words.json (pass 1) and writes audio2/words2.json + costs."""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft
SR = 24000; HOP = 240; NFFT = 1024
d = Path("audio2")
def hz2mel(h): return 2595 * np.log10(1 + h / 700)
def mel2hz(m): return 700 * (10 ** (m / 2595) - 1)
pts = mel2hz(np.linspace(hz2mel(60), hz2mel(7600), 42)); bins = np.floor((NFFT + 1) * pts / SR).astype(int)
FB = np.zeros((40, NFFT // 2 + 1))
for m in range(1, 41):
    l, c, r = bins[m - 1], bins[m], bins[m + 1]
    for k in range(l, c): FB[m - 1, k] = (k - l) / max(1, c - l)
    for k in range(c, r): FB[m - 1, k] = (r - k) / max(1, r - c)
def feats(path):
    sr, a = wavfile.read(path); a = a.astype(np.float32) / 32768
    a = a / (abs(a).max() + 1e-9)
    f, t, Z = stft(a, SR, nperseg=NFFT, noverlap=NFFT - HOP, boundary=None, padded=False)
    M = np.log(FB @ (np.abs(Z) ** 2) + 1e-8).T
    M = (M - M.mean(0)) / (M.std(0) + 1e-6)
    return (M / (np.linalg.norm(M, axis=1, keepdims=True) + 1e-9)).astype(np.float32), a
FA, ra = feats("audio/voice.wav"); FBn, na = feats(str(d / "voice.wav"))
old = json.load(open("audio/words.json"))["lines"]
new = json.load(open(d / "words.json"))["lines"]
fr = lambda t: int(round(t * SR / HOP))
out = []
costs = []
for lo_, ln in zip(old, new):
    a0, a1 = fr(lo_["start"]), fr(lo_["end"]) + 1
    b0, b1 = fr(ln["start"]), fr(ln["end"]) + 1
    A = np.ascontiguousarray(FA[a0:a1]); B = np.ascontiguousarray(FBn[b0:b1])
    A.tofile(d / "la.bin"); B.tofile(d / "lb.bin")
    nA, nB = len(A), len(B)
    subprocess.run(["tools/dtw", str(d / "la.bin"), str(d / "lb.bin"), str(nA), str(nB), "40", str(max(nA, nB)), str(d / "lm.bin")], check=True, stdout=subprocess.DEVNULL)
    m = np.fromfile(d / "lm.bin", dtype=np.int32); lo, hi = m[:nA], m[nA:]
    # path cost along the diagonal-ish match
    bad = (lo > 1e6) | (hi < 0)
    if bad.any(): print("BAD", ln["id"], nA, nB, int(bad.sum()), lo_["start"], lo_["end"], ln["start"], ln["end"])
    lo = np.where(bad, np.maximum.accumulate(np.where(bad, 0, lo)), lo); hi = np.where(bad, np.maximum.accumulate(np.where(bad, 0, hi)), hi)
    cost = float(np.mean([1 - FA[a0 + i] @ FBn[b0 + int((lo[i] + hi[i]) // 2)] for i in range(nA)]))
    costs.append((ln["id"], round(cost, 3)))
    def map_t(t, side):
        i = min(nA - 1, max(0, fr(t) - a0)); j = lo[i] if side == "lo" else hi[i]
        return (b0 + j) * HOP / SR
    ws = []
    for w in lo_["words"]:
        ws.append([map_t(w["start"], "lo"), map_t(w["end"], "hi")])
    ws[0][0] = ln["start"]; ws[-1][1] = ln["end"]
    for k in range(1, len(ws)):
        mid = (ws[k - 1][1] + ws[k][0]) / 2
        ws[k - 1][1] = ws[k][0] = max(ws[k - 1][0] + 0.04, mid)
    out.append({**ln, "words": [{"w": w["w"], "start": round(a, 3), "end": round(b, 3)} for w, (a, b) in zip(lo_["words"], ws)]})
json.dump({"duration": json.load(open(d / "words.json"))["duration"], "lines": out}, open(d / "words2.json", "w"), indent=1)
print(sorted(costs, key=lambda x: -x[1])[:14])
print("median cost", np.median([c for _, c in costs]))
