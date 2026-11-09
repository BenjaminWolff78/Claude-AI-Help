#!/usr/bin/env python3
"""Owners Sank Their Own Ships, So He Painted a Line - final audio mix (Rick's Clips-style music test).

usage: python3 mix.py cues.json out.wav [--length SECONDS]

cues.json: [{"t": 39.15, "sfx": "stinger", "gain_db": 0}, ...]

Level plan (all loudness = ITU-R BS.1770 K-weighted, measured on stereo stems):
  voice          reference (integrated LUFS)
  music bed      voice - 15 LU (integrated, before ducking; the 2026-11-08 test level for
                 Rick's Clips-style videos only), ducked 3 dB under every word span and a
                 further 5 dB under the quoted lines (3 dB under the fake-out), 80 ms attack /
                 250 ms release; NO fade-out: the music is cut on the end of the last word
  each SFX       loudest 400 ms window (max momentary) = voice - 17 LU, + gain_db
  stinger        voice - 11 LU, + gain_db
  safety         any element louder than (voice momentary - 3 LU) while the voice
                 talks, or than (voice integrated - 6 LU) in pauses, is turned down
  master         integrated -14.3 LUFS, true peak <= -1.0 dBTP (gentle voice
                 compression + look-ahead true-peak limiter), 48 kHz / 24-bit stereo
"""
import argparse, json, os, sys
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
TARGET_LUFS = -14.3
TP_CEIL = -1.0           # dBTP spec
TP_WORK = -1.25          # limiter ceiling (margin for 24-bit + measurement)
MUSIC_REL = -15.0
DUCK_DB = -3.0
QUOTE_DB = -5.0
FAKE_DB = -3.0
# quoted lines and the fake-out (s, e, extra dB)
DIPS = [(12.38, 12.74, QUOTE_DB), (24.96, 25.96, QUOTE_DB), (62.76, 63.24, QUOTE_DB),
        (27.42, 28.64, FAKE_DB), (42.12, 43.06, FAKE_DB)]
SFX_REL = -17.0
STINGER_REL = -11.0
MUSIC_CUT = None      # = end of the last word (set from words.json)
TAIL = 0.65

meter = pyln.Meter(SR)


# ---------------------------------------------------------------- helpers
def load(path):
    x, sr = sf.read(path, always_2d=True, dtype="float64")
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    x = x[:, :2]
    if sr != SR:
        g = np.gcd(sr, SR)
        x = resample_poly(x, SR // g, sr // g, axis=0)
    return x


def lufs(x):
    if len(x) < int(0.4 * SR):
        x = np.vstack([x, np.zeros((int(0.4 * SR) - len(x) + 1, 2))])
    v = meter.integrated_loudness(x)
    return v if np.isfinite(v) else -120.0


_kw_filters = None


def kweight(x):
    """K-weighted signal (same filters pyloudnorm uses)."""
    y = x.copy()
    for f in meter._filters.values():
        for ch in range(y.shape[1]):
            y[:, ch] = f.apply_filter(y[:, ch])
    return y


def momentary(x, hop=0.1, win=0.4):
    """Momentary loudness (400 ms) every `hop` s. Returns (times, LUFS)."""
    k = kweight(x)
    p = (k ** 2).sum(1)                      # channel weights G=1 for L/R
    c = np.concatenate([[0.0], np.cumsum(p)])
    w, h = int(win * SR), int(hop * SR)
    starts = np.arange(0, max(1, len(p) - w + 1), h)
    ms = (c[np.minimum(starts + w, len(p))] - c[starts]) / w
    return starts / SR, -0.691 + 10 * np.log10(ms + 1e-20)


def max_momentary(x):
    if len(x) < int(0.4 * SR):
        x = np.vstack([x, np.zeros((int(0.4 * SR) - len(x), 2))])
    return float(momentary(x, hop=0.01)[1].max())


def db(g):
    return 10 ** (g / 20)


def true_peak_db(x):
    up = resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.abs(up).max() + 1e-20)


def smooth_gain_db(target_db, rate, attack, release):
    """One-pole smoothing of a gain curve in dB: falling (more cut) uses attack."""
    out = np.empty_like(target_db)
    a_att = np.exp(-1.0 / (attack * rate))
    a_rel = np.exp(-1.0 / (release * rate))
    g = target_db[0]
    for i, tgt in enumerate(target_db):
        a = a_att if tgt < g else a_rel
        g = a * g + (1 - a) * tgt
        out[i] = g
    return out


def compress(x, thresh_db, ratio, attack=0.005, release=0.12):
    """Gentle feed-forward RMS-ish compressor (stereo linked)."""
    rate = 1000
    hop = SR // rate
    n = len(x) // hop + 1
    pad = np.vstack([x, np.zeros((n * hop - len(x), 2))])
    lvl = 20 * np.log10(np.sqrt((pad.reshape(n, hop, 2) ** 2).mean((1, 2))) + 1e-12)
    over = np.maximum(lvl - thresh_db, 0)
    gr = -over * (1 - 1 / ratio)
    gr = smooth_gain_db(gr, rate, attack, release)
    g = np.interp(np.arange(len(x)) / SR, np.arange(n) / rate, gr)
    return x * db(g)[:, None]


def tp_limit(x, ceil_db, lookahead=0.002, release=0.08):
    """Look-ahead limiter on the 4x-oversampled peak envelope."""
    ceil = db(ceil_db)
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(1)
    pk = up[: len(up) // 4 * 4].reshape(-1, 4).max(1)
    pk = np.concatenate([pk, np.zeros(len(x) - len(pk))]) if len(pk) < len(x) else pk[: len(x)]
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-12))
    la = int(lookahead * SR)
    # look-ahead: running min over the next `la` samples
    from scipy.ndimage import minimum_filter1d
    need = minimum_filter1d(need, size=2 * la + 1, origin=0)
    need = np.concatenate([need[la:], np.ones(la)])
    # smooth: instant-ish attack (within look-ahead), exponential release
    g = np.empty_like(need)
    a_rel = np.exp(-1.0 / (release * SR))
    a_att = np.exp(-1.0 / (0.0007 * SR))
    cur = 1.0
    for i, t in enumerate(need):
        cur = a_att * cur + (1 - a_att) * t if t < cur else a_rel * cur + (1 - a_rel) * t
        g[i] = min(cur, t) if t < cur * 0.98 else cur
    return x * g[:, None]


def fade_curve(n, kind="out"):
    c = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))
    return c if kind == "in" else c[::-1]


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cues")
    ap.add_argument("out")
    ap.add_argument("--length", type=float, default=0.0)
    ap.add_argument("--voice", default=os.path.join(HERE, "voice.wav"))
    ap.add_argument("--music", default=os.path.join(HERE, "music.wav"))
    ap.add_argument("--words", default=os.path.join(HERE, "words.json"))
    ap.add_argument("--sfxdir", default=os.path.join(HERE, "sfx"))
    ap.add_argument("--stems", default="")
    a = ap.parse_args()

    voice = load(a.voice)
    total = max(len(voice) / SR + TAIL, a.length)
    N = int(round(total * SR))
    t = np.arange(N) / SR

    def fit(x):
        y = np.zeros((N, 2))
        y[: min(N, len(x))] = x[:N]
        return y

    voice = fit(voice)
    words = json.load(open(a.words))
    cues = json.load(open(a.cues))

    # gentle voice compression (2:1, ~3 dB on the loudest syllables) so the
    # limiter has little to do
    v_lvl = momentary(voice, hop=0.01)[1]
    voice_c = compress(voice, thresh_db=np.percentile(v_lvl[v_lvl > -50], 90) - 2, ratio=2.0)
    voice_c *= db(lufs(voice) - lufs(voice_c))          # keep voice loudness
    voice = voice_c
    V = lufs(voice)

    # ------------------------------------------------ music bed
    music = fit(load(a.music))
    M_raw = lufs(music[: int(min(60.0, total) * SR)])  # measure the body, not the fade
    music *= db(V + MUSIC_REL - M_raw)
    M_bed = lufs(music[: int(min(60.0, total) * SR)])

    # ducking under word spans (80 ms attack, 250 ms release, 40 ms look-ahead)
    rate = 1000
    tc = np.arange(int(total * rate) + 1) / rate
    talk = np.zeros_like(tc, dtype=bool)
    for w in words:
        talk |= (tc >= w["s"] - 0.04) & (tc < w["e"])
    target = np.where(talk, DUCK_DB, 0.0)
    for s0, e0, d0 in DIPS:
        target = np.where((tc >= s0 - 0.04) & (tc < e0), target + d0, target)
    duck = smooth_gain_db(target, rate, 0.080, 0.250)
    # no fade-out: a clean cut on the end of the last spoken word (12 ms de-click only)
    cut = MUSIC_CUT or max(w["e"] for w in words)
    mg = db(np.interp(t, tc, duck))
    nd = int(0.012 * SR); ci = int(round(cut * SR))
    mg[max(0, ci - nd):ci] *= np.linspace(1, 0, min(nd, ci))
    mg[t >= cut] = 0.0
    music *= mg[:, None]

    # ------------------------------------------------ SFX
    cache = {}
    sfx_tracks = []      # (cue, track, target_rel)
    for c in cues:
        name = c["sfx"]
        if name not in cache:
            p = os.path.join(a.sfxdir, name + ".wav")
            if not os.path.exists(p):
                sys.exit(f"missing sfx: {p}")
            x = load(p)
            cache[name] = (x, max_momentary(x))
        x, L = cache[name]
        if c.get("loop") and "dur" in c:                 # tile a short ambience to its scene, 0.25 s crossfades
            need = int((float(c["dur"]) + 0.5) * SR); xf = int(0.25 * SR); y0 = x.copy()
            while len(y0) < need:
                r = np.linspace(0, 1, xf)[:, None]
                y0 = np.vstack([y0[:-xf], y0[-xf:] * (1 - r) + x[:xf] * r, x[xf:]])
            x = y0
        rel = (STINGER_REL if name == "stinger" else SFX_REL) + float(c.get("gain_db", 0.0))
        y = x * db(V + rel - L)
        s = int(round(float(c["t"]) * SR))
        if s >= N:
            continue
        seg_ = y[: N - s].copy()
        if "dur" in c and len(seg_) > int(float(c["dur"]) * SR):   # cut a long ambience to its scene, 0.4 s fade
            seg_ = seg_[: int(float(c["dur"]) * SR)]
            nf = min(len(seg_), int(0.4 * SR)); seg_[-nf:] *= np.linspace(1, 0, nf)[:, None]
        if len(seg_) < len(y):                       # truncated by the end
            nf = min(len(seg_), int(0.05 * SR))
            seg_[-nf:] *= fade_curve(nf)[:, None]
        tr = np.zeros((N, 2))
        tr[s: s + len(seg_)] = seg_
        sfx_tracks.append([c, tr, rel])

    # ------------------------------------------------ voice-is-loudest safety
    vt, vm = momentary(voice)
    vtalk = np.interp(vt + 0.2, tc, talk.astype(float)) > 0.5
    limit = np.where(vtalk, vm - 3.0, V - 6.0)
    adjustments = []

    def enforce(track, label):
        _, m = momentary(track)
        excess = np.max(m - limit) if len(m) else -99
        if excess > 0:
            track *= db(-excess)
            adjustments.append(f"{label}: turned down {excess:.1f} dB to stay under the voice")
        return track

    music = enforce(music, "music")
    for st in sfx_tracks:
        st[1] = enforce(st[1], f"sfx {st[0]['sfx']} @ {st[0]['t']}")

    sfx_sum = np.zeros((N, 2))
    for _, tr, _ in sfx_tracks:
        sfx_sum += tr

    # ------------------------------------------------ master
    mix = voice + music + sfx_sum
    gain = TARGET_LUFS - lufs(mix)
    out = mix * db(gain)
    for _ in range(6):
        lim = tp_limit(out, TP_WORK)
        err = TARGET_LUFS - lufs(lim)
        if abs(err) < 0.03:
            break
        out *= db(err)
    out = lim
    if true_peak_db(out) > TP_CEIL - 0.05:            # hard safety
        out *= db(TP_CEIL - 0.1 - true_peak_db(out))
    # 10 ms fade in/out at the very edges
    nf = int(0.01 * SR)
    out[:nf] *= fade_curve(nf, "in")[:, None]
    out[-nf:] *= fade_curve(nf)[:, None]

    sf.write(a.out, out.astype(np.float32), SR, subtype="PCM_24")
    if a.stems:
        os.makedirs(a.stems, exist_ok=True); gg = db(gain)
        for nm, x in (("voice", voice), ("music", music), ("sfx", sfx_sum)): sf.write(os.path.join(a.stems, nm + ".wav"), (x * gg).astype(np.float32), SR)

    # ------------------------------------------------ report
    chk, _ = sf.read(a.out, always_2d=True)
    I = lufs(chk)
    TP = true_peak_db(chk)
    g = db(gain)
    Vf = lufs(voice * g)
    print("=" * 64)
    print(f"output            {a.out}  ({len(chk)/SR:.2f} s, {SR} Hz, 24-bit stereo)")
    print(f"master integrated {I:6.2f} LUFS   (target {TARGET_LUFS} +/-0.2)  "
          f"{'OK' if abs(I - TARGET_LUFS) <= 0.2 else 'FAIL'}")
    print(f"true peak         {TP:6.2f} dBTP   (limit {TP_CEIL})            "
          f"{'OK' if TP <= TP_CEIL else 'FAIL'}")
    print(f"voice             {Vf:6.2f} LUFS integrated in the master")
    mb = lufs(music[: int(min(60.0, total) * SR)] * g)
    print(f"music bed (pre-duck)  {M_bed - V:+6.2f} LU vs voice   (target {MUSIC_REL})")
    print(f"music after duck      {mb - Vf:+6.2f} LU vs voice   (duck {DUCK_DB} dB under words)")
    print(f"music cut on the last word ({cut:.2f}s), no fade-out: "
          f"{'yes' if np.abs(music[int(cut*SR):]).max() == 0 and np.abs(music[int((cut-0.3)*SR):int((cut-0.02)*SR)]).max() > 0 else 'NO'}")
    for s0, e0, d0 in DIPS:
        i0, i1 = int(s0 * SR), int(e0 * SR)
        print(f"  dip {s0:5.2f}-{e0:5.2f}s: music {lufs(music[i0:i1] * g) - Vf:+6.1f} LU vs voice")
    print("SFX (max momentary vs voice integrated):")
    for c, tr, rel in sfx_tracks:
        s = int(float(c["t"]) * SR)
        seg_ = tr[s: s + int(4 * SR)] * g
        lvl = max_momentary(seg_) - Vf
        print(f"   {c['sfx']:16s} @ {float(c['t']):6.2f}s  {lvl:+6.2f} LU   (target {rel:+.1f})")
    # voice loudest check in the final balance
    _, vmf = momentary(voice * g)
    worst = -99.0
    for tr in [music] + [s[1] for s in sfx_tracks]:
        _, m = momentary(tr * g)
        d = m - np.where(vtalk, vmf, Vf - 3)
        worst = max(worst, float(np.max(d[m > -60])) if np.any(m > -60) else -99)
    print(f"voice-loudest check: loudest other element is {-worst:.1f} LU below the voice "
          f"at its closest moment  {'OK' if worst < 0 else 'FAIL'}")
    for s in adjustments:
        print("   adjust:", s)
    print("=" * 64)


if __name__ == "__main__":
    main()
