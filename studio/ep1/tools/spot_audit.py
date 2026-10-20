"""Audit/refine word times: for each content word, match a Kokoro-synthesized template (open-ended DTW) inside a
+-0.6 s window of the aligned time and report the offset. Usage: spot_audit.py in.json [out.json]"""
import sys, json, importlib.util
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft
sys.argv_saved = sys.argv; sys.argv = ['x']
spec = importlib.util.spec_from_file_location('tts', 'tools/tts.py'); tts = importlib.util.module_from_spec(spec); spec.loader.exec_module(tts)
sys.argv = sys.argv_saved
SR = 24000
sr, v = wavfile.read('audio2/voice.wav'); v = v.astype(np.float32) / 32768
def hz2mel(h): return 2595 * np.log10(1 + h / 700)
def mel2hz(m): return 700 * (10 ** (m / 2595) - 1)
pts = mel2hz(np.linspace(hz2mel(60), hz2mel(7600), 42)); bins = np.floor(1025 * pts / SR).astype(int)
FB = np.zeros((40, 513))
for m in range(1, 41):
    l, c, r = bins[m - 1], bins[m], bins[m + 1]
    for k in range(l, c): FB[m - 1, k] = (k - l) / max(1, c - l)
    for k in range(c, r): FB[m - 1, k] = (r - k) / max(1, r - c)
def mel(a):
    a = a / (abs(a).max() + 1e-9)
    f, t, Z = stft(a, SR, nperseg=1024, noverlap=1024 - 240, boundary=None, padded=False)
    return np.log(FB @ (np.abs(Z) ** 2) + 1e-8).T
def nz(M):
    M = (M - M.mean(0)) / (M.std(0) + 1e-6); return (M / (np.linalg.norm(M, axis=1, keepdims=True) + 1e-9)).astype(np.float32)
Mv = mel(v)
def subseq(A, B):
    """open-begin/end DTW of template A inside B; returns (cost, start, end) in frames of B"""
    n, m = len(A), len(B); C = 1 - A @ B.T
    D = np.full((n + 1, m + 1), 1e9); S = np.zeros((n + 1, m + 1), int)
    D[0, :] = 0; S[0, :] = np.arange(m + 1)
    for i in range(1, n + 1):
        Di, Dp, Si, Sp, Ci = D[i], D[i - 1], S[i], S[i - 1], C[i - 1]
        for j in range(1, m + 1):
            a, b, c = Dp[j - 1], Dp[j], Di[j - 1]
            if a <= b and a <= c: Di[j] = Ci[j - 1] + a; Si[j] = Sp[j - 1]
            elif b <= c: Di[j] = Ci[j - 1] + b; Si[j] = Sp[j]
            else: Di[j] = Ci[j - 1] + c; Si[j] = Si[j - 1]
    j = int(np.argmin(D[n, 1:] / (n + np.arange(1, m + 1)))) + 1
    return D[n, j] / (n + j - S[n, j]), S[n, j], j
data = json.load(open(sys.argv[1]))
cache = {}
res = []
for ln in data['lines']:
    for w in ln['words']:
        tok = w['w']
        if len(tok) < 4: continue
        if tok not in cache:
            try: ph, _ = tts.g2p(tok)
            except SystemExit: cache[tok] = None; continue
            a = tts.trim(tts.synth(ph, 0.92)); cache[tok] = nz(mel(a)) if len(a) > 2400 else None
        T = cache[tok]
        if T is None: continue
        s0 = int((w['start'] - 0.6) * 100); s1 = int((w['end'] + 0.6) * 100)
        s0 = max(0, s0); B = nz(Mv[s0:s1])
        cost, bs, be = subseq(T, B)
        ns, ne = (s0 + bs) / 100, (s0 + be) / 100
        res.append((ln['id'], tok, round(cost, 3), round(ns - w['start'], 2), round(ne - w['end'], 2), w['start'], w['end'], ns, ne))
offs = np.array([r[3] for r in res])
print(len(res), 'words; start offset median %.3f  mean|.| %.3f  p90|.| %.3f' % (np.median(offs), np.abs(offs).mean(), np.percentile(np.abs(offs), 90)))
json.dump(res, open('audio2/spot.json', 'w'))
big = [r for r in res if abs(r[3]) > 0.2 and r[2] < 0.3]
print(len(big), 'confident words >0.2 s off:')
for r in big[:40]: print(r[:5])
