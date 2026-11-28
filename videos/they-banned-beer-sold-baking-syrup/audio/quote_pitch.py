"""Give the two quoted lines their own voices (v34 / mix_check row 4: a quote should sit 20%+ off the narrator's pitch).
The agent's "Syrup? With hops in it? Who bakes with hops?" goes up 4.5 semitones (thin, sneering), the brewer's
"It's for baking." down 4 semitones (stout, deadpan). Formants preserved, length unchanged, 15 ms crossfades.
usage: python3 quote_pitch.py voice_final.wav words.json voice_q.wav"""
import json, subprocess, sys, os, tempfile
import numpy as np, soundfile as sf
src, wpath, dst = sys.argv[1:4]
x, sr = sf.read(src); W = json.load(open(wpath))
def span(first, last):
    i = next(k for k, w in enumerate(W) if w["w"].startswith(first) and (k == 0 or True))
    j = next(k for k in range(i, len(W)) if W[k]["w"].endswith(last))
    return W[i]["s"], W[j]["e"], i, j
QUOTES = [('"Syrup?', 'hops?"', 2 ** (4.5 / 12)), ('"It\'s', 'baking."', 2 ** (-4 / 12))]
y = x.copy(); tmp = tempfile.mkdtemp(prefix="qp_", dir=os.path.dirname(os.path.abspath(dst)))
for a, b, ratio in QUOTES:
    s, e, i, j = span(a, b)
    s0 = max(0.0, s - 0.03); e0 = min(len(x) / sr, e + 0.06)
    pre = W[i - 1]["e"] if i > 0 else 0.0; post = W[j + 1]["s"] if j + 1 < len(W) else len(x) / sr
    s0 = max(s0, (pre + s) / 2); e0 = min(e0, (e + post) / 2)
    i0, i1 = int(s0 * sr), int(e0 * sr); seg = x[i0:i1]
    fi, fo = os.path.join(tmp, "in.wav"), os.path.join(tmp, "out.wav")
    sf.write(fi, seg, sr)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", fi, "-af", f"rubberband=pitch={ratio:.5f}:formant=preserved:pitchq=quality", "-ar", str(sr), "-ac", "1", fo], check=True)
    z, _ = sf.read(fo)
    z = z[: len(seg)] if len(z) >= len(seg) else np.concatenate([z, np.zeros(len(seg) - len(z))])
    n = int(0.015 * sr); r = np.linspace(0, 1, n)
    out = z.copy(); out[:n] = seg[:n] * (1 - r) + z[:n] * r; out[-n:] = z[-n:] * (1 - r) + seg[-n:] * r
    y[i0:i1] = out
    print(f"{a} .. {b}: {s0:.2f}-{e0:.2f} s, pitch x{ratio:.3f}")
    os.remove(fi); os.remove(fo)
os.rmdir(tmp)
sf.write(dst, y, sr, subtype="PCM_24"); print("ok", dst, len(y) / sr)
