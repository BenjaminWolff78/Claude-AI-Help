"""Align the real voice (ElevenLabs mp3) to the script by DTW against the placeholder voice, whose word
timings are known (audio/words.json). Then snap line edges to the real speech onsets/offsets and word
boundaries to energy dips. Writes audio2/voice.wav (24 kHz, 0.1 s lead) and audio2/words.json.

Usage: python3 align_dtw.py new_voice.wav old_words.json old_voice.wav outdir
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft

new_path, old_words, old_wav, outdir = sys.argv[1:5]
out = Path(outdir); out.mkdir(parents=True, exist_ok=True)
SR = 24000
LEAD = 0.10

def load(p):
    sr, a = wavfile.read(p); assert sr == SR
    a = a.astype(np.float32) / (32768.0 if a.dtype == np.int16 else 1.0)
    return a

ref = load(old_wav)
new = load(new_path)
new = np.concatenate([np.zeros(int(LEAD * SR), np.float32), new])   # same 0.1 s lead as the placeholder

def melbank(n_fft, n_mels=40, fmin=60, fmax=7600):
    def hz2mel(h): return 2595 * np.log10(1 + h / 700)
    def mel2hz(m): return 700 * (10 ** (m / 2595) - 1)
    pts = mel2hz(np.linspace(hz2mel(fmin), hz2mel(fmax), n_mels + 2))
    bins = np.floor((n_fft + 1) * pts / SR).astype(int)
    fb = np.zeros((n_mels, n_fft // 2 + 1))
    for m in range(1, n_mels + 1):
        l, c, r = bins[m - 1], bins[m], bins[m + 1]
        for k in range(l, c): fb[m - 1, k] = (k - l) / max(1, c - l)
        for k in range(c, r): fb[m - 1, k] = (r - k) / max(1, r - c)
    return fb

HOP = 480  # 20 ms
NFFT = 1024
FB = melbank(NFFT)

def feats(a):
    a = a / (np.abs(a).max() + 1e-9)
    f, t, Z = stft(a, SR, nperseg=NFFT, noverlap=NFFT - HOP, boundary=None, padded=False)
    P = np.abs(Z) ** 2
    M = np.log(FB @ P + 1e-8).T            # frames x mels
    # pre-whiten: remove per-band mean and scale (speaker / channel normalization)
    M = (M - M.mean(0)) / (M.std(0) + 1e-6)
    M /= (np.linalg.norm(M, axis=1, keepdims=True) + 1e-9)
    return M.astype(np.float32)

FA, FB_ = feats(ref), feats(new)
nA, nB = len(FA), len(FB_)
print("frames", nA, nB, "ratio", round(nB / nA, 3))
d = Path(outdir)
FA.tofile(d / "A.bin"); FB_.tofile(d / "B.bin")
subprocess.run(["/home/claude/work/ep1/tools/dtw", str(d / "A.bin"), str(d / "B.bin"), str(nA), str(nB), "40", "2500", str(d / "map.bin")], check=True)
m = np.fromfile(d / "map.bin", dtype=np.int32)
lo, hi = m[:nA], m[nA:]
def ref2new(t_ref, side="mid"):
    i = min(nA - 1, max(0, int(round(t_ref * SR / HOP))))
    j = {"lo": lo[i], "hi": hi[i], "mid": (lo[i] + hi[i]) / 2}[side]
    return j * HOP / SR

# energy of the real voice at 10 ms
H2 = 240
nfr = len(new) // H2
env_db = 20 * np.log10(np.sqrt((new[: nfr * H2].reshape(nfr, H2) ** 2).mean(1)) + 1e-9)
SPEECH = -42.0
speech = env_db > SPEECH

def nearest_edge(t, rising, win):
    """nearest speech onset (rising) or offset (falling) to time t within +-win s"""
    k0 = int(t / 0.01)
    best = None
    for k in range(max(1, k0 - int(win * 100)), min(nfr - 1, k0 + int(win * 100))):
        if rising and (not speech[k - 1]) and speech[k]:
            c = k * 0.01
        elif (not rising) and speech[k - 1] and (not speech[k]):
            c = k * 0.01
        else:
            continue
        if best is None or abs(c - t) < abs(best - t): best = c
    return best

W = json.load(open(old_words))
lines_out = []
prev_end = 0.0
for ln in W["lines"]:
    s = ref2new(ln["start"], "lo") ; e = ref2new(ln["end"], "hi")
    s2 = nearest_edge(s, True, 0.35); e2 = nearest_edge(e, False, 0.35)
    s = s2 if s2 is not None and s2 > prev_end - 0.02 else s
    e = e2 if e2 is not None and e2 > s + 0.2 else e
    ws = []
    for w in ln["words"]:
        a = ref2new(w["start"], "lo"); b = ref2new(w["end"], "hi")
        ws.append([max(s, a), min(e, b)])
    # make monotone and gap-free inside the line
    for k in range(len(ws)):
        if k > 0: ws[k][0] = max(ws[k][0], ws[k - 1][0] + 0.04)
    for k in range(len(ws) - 1):
        mid = (ws[k][1] + ws[k + 1][0]) / 2
        ws[k][1] = max(ws[k][0] + 0.04, mid); ws[k + 1][0] = ws[k][1]
    ws[0][0] = s; ws[-1][1] = e
    # snap interior boundaries to a clear energy dip within +-60 ms
    for k in range(1, len(ws)):
        b = ws[k][0]; c = int(b / 0.01)
        lo_, hi_ = max(1, c - 6), min(nfr - 1, c + 6)
        seg = env_db[lo_:hi_ + 1]
        kmin = lo_ + int(np.argmin(seg))
        around = np.median(env_db[max(0, kmin - 15):kmin + 16])
        if env_db[kmin] < around - 6 and ws[k - 1][0] + 0.04 < kmin * 0.01 < (ws[k + 1][1] if k + 1 < len(ws) else e) - 0.04:
            ws[k][0] = kmin * 0.01; ws[k - 1][1] = kmin * 0.01
    prev_end = e
    lines_out.append({"id": ln["id"], "scene": ln["scene"], "text": ln["text"], "say": ln["say"],
                      "start": round(s, 3), "end": round(e, 3),
                      "words": [{"w": w["w"], "start": round(a, 3), "end": round(b, 3)} for w, (a, b) in zip(ln["words"], ws)]})

dur = len(new) / SR
json.dump({"duration": round(dur, 3), "lines": lines_out}, open(d / "words.json", "w"), indent=1)
wavfile.write(d / "voice.wav", SR, (new * 32767).astype(np.int16))
print("duration", round(dur, 2))
for l in lines_out[:6] + lines_out[-4:]:
    print(l["id"], l["start"], l["end"], l["say"][:40])
