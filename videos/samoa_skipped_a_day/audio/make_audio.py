#!/usr/bin/env python3
"""Island foley + ukulele/log-drum bed + mix for samoa_skipped_a_day (36.3 s)."""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy import signal

SR = 48000; DUR = 36.3; N = int(DUR * SR)
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(2011)
T = np.arange(N) / SR

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0: print(r.stderr[-1500:]); sys.exit(1)
    return r
def bp(lo, hi, o=2): return signal.butter(o, [lo, hi], btype='band', fs=SR, output='sos')
def lp(fc, o=2): return signal.butter(o, fc, btype='low', fs=SR, output='sos')
def hp(fc, o=2): return signal.butter(o, fc, btype='high', fs=SR, output='sos')
def tt(d): return np.arange(int(d * SR)) / SR
def nz(d): return rng.standard_normal(int(d * SR))
def place(buf, sig, t0, pan=0.0, gain=1.0):
    i0 = int(round(t0 * SR))
    if i0 >= len(buf): return
    a = max(0, -i0); i0 = max(0, i0)
    seg = sig[a:a + (len(buf) - i0)]
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    buf[i0:i0 + len(seg), 0] += seg * np.cos(th) * gain
    buf[i0:i0 + len(seg), 1] += seg * np.sin(th) * gain

# ---------------- foley recipes ----------------
def tear(d=0.3):
    n = tt(d); dens = np.sin(np.pi * n / d) ** 0.7
    out = np.zeros(len(n)); k = rng.random(len(n)) < dens * 0.014
    out[k] = rng.uniform(-1, 1, k.sum())
    return (signal.sosfilt(bp(1200, 7000), out) * 6 + signal.sosfilt(bp(300, 1500), nz(d)) * 0.08 * dens) * dens
def flap(d=0.12, lo=400, hi=3000):
    n = tt(d)
    return signal.sosfilt(bp(lo, hi), nz(d)) * np.exp(-n / (d / 4.5)) * (1 - np.exp(-n / 0.003))
def flutter(d, rate=16):
    n = tt(d); am = (0.5 + 0.5 * np.sin(2 * np.pi * rate * n + rng.uniform(0, 6))) ** 3
    return signal.sosfilt(bp(500, 3500), nz(d)) * am * np.sin(np.pi * n / d) * 0.6
def tok(f=260, tau=0.03, click=0.5):
    n = tt(0.18)
    return np.sin(2 * np.pi * f * n) * np.exp(-n / tau) + signal.sosfilt(bp(1000, 5000), nz(0.18)) * np.exp(-n / 0.003) * click
def thump(f0=110, f1=50, tau=0.09, d=0.35):
    n = tt(d); f = f1 + (f0 - f1) * np.exp(-n / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-n / tau)
def stamp():
    return thump(140, 60, 0.07) + np.concatenate([signal.sosfilt(bp(300, 2500), nz(0.05)) * np.exp(-tt(0.05) / 0.01), np.zeros(int(0.30 * SR))]) * 0.8
def tick(f=2200):
    n = tt(0.03)
    return signal.sosfilt(bp(1500, 6000), nz(0.03)) * np.exp(-n / 0.003) + np.sin(2 * np.pi * f * n) * np.exp(-n / 0.004) * 0.4
def splash(d=0.7, big=1.0):
    n = tt(d)
    body = signal.sosfilt(bp(250, 4500), nz(d)) * np.exp(-n / (0.12 * big)) * (1 - np.exp(-n / 0.004))
    spray = signal.sosfilt(bp(3000, 9000), nz(d)) * np.exp(-n / 0.25) * 0.35
    out = body + spray + thump(90, 45, 0.08, d) * 0.5 * big
    for k in range(int(6 * big)):
        t0 = 0.08 + rng.uniform(0, d * 0.6); m = tt(0.06)
        f = 500 + rng.uniform(0, 700) + 2500 * m
        b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-m / 0.015) * 0.25
        i0 = int(t0 * SR); out[i0:i0 + len(b)] += b[:max(0, len(out) - i0)]
    return out
def bloop(f0=300, f1=900, d=0.12):
    n = tt(d); f = np.linspace(f0, f1, len(n))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * n / d) ** 2
def boing(d=0.42, f0=170, f1=430):
    n = tt(d); f = f0 + (f1 - f0) * (1 - np.exp(-n / 0.06)) + 25 * np.sin(2 * np.pi * 14 * n) * np.exp(-n / 0.15)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * np.exp(-n / 0.14) * (1 - np.exp(-n / 0.004))
def creak(d=0.25, f0=180, f1=260):
    n = tt(d); f = np.linspace(f0, f1, len(n))
    pulses = (np.sin(2 * np.pi * np.cumsum(f) / SR) > 0.95).astype(float)
    return signal.sosfilt(bp(300, 2500), pulses) * np.sin(np.pi * n / d) * 3
def clink(f=2900):
    n = tt(0.09)
    return sum(a * np.sin(2 * np.pi * f * r * n) for r, a in ((1, 1), (1.47, 0.6), (2.31, 0.35))) * np.exp(-n / 0.022) * 0.5
def bird():
    n = tt(0.14); f = 3000 + 1400 * np.sin(np.pi * n / 0.14)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * n / 0.14) ** 2
def cricket():
    n = tt(0.18)
    return np.sin(2 * np.pi * 4600 * n) * (np.sin(2 * np.pi * 60 * n) > 0.3) * np.sin(np.pi * n / 0.18)
def snore(d=0.9):
    n = tt(d); env = np.sin(np.pi * n / d) ** 2
    rasp = 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 34 * n))
    return signal.sosfilt(bp(150, 900), nz(d)) * env * rasp * 0.7
def buzz(d=0.08):
    n = tt(d); s = np.sign(np.sin(2 * np.pi * 120 * n)) * 0.5 + signal.sosfilt(bp(2000, 6000), nz(d)) * 0.2
    return signal.sosfilt(lp(3000), s) * np.clip(n / 0.003, 0, 1) * np.clip((d - n) / 0.01, 0, 1)
def breeze(d, lo=300, hi=1600):
    n = tt(d)
    return signal.sosfilt(bp(lo, hi), nz(d)) * np.sin(np.pi * n / d) ** 2 * 0.5
def hiss_up(d=0.4):
    n = tt(d); s = signal.sosfilt(bp(1500, 6000), nz(d))
    return s * (n / d) ** 2 * 0.4
def crackle(d=0.8):
    n = tt(d); out = np.zeros(len(n)); k = rng.random(len(n)) < 0.0016 * np.exp(-n / 0.35)
    out[k] = rng.uniform(-1, 1, k.sum())
    return signal.sosfilt(bp(1500, 8000), out) * 5
def horn(d=0.9, f=98):
    n = tt(d); s = sum(a * np.sin(2 * np.pi * f * h * n) for h, a in ((1, 1), (2, 0.5), (3, 0.3), (4, 0.15)))
    return signal.sosfilt(lp(900), s) * np.clip(n / 0.08, 0, 1) * np.clip((d - n) / 0.2, 0, 1) * 0.6
def typing(d):
    out = np.zeros(int(d * SR)); t0 = 0.0
    while t0 < d - 0.05:
        s = tok(rng.uniform(900, 1500), 0.006, 0.9) * rng.uniform(0.4, 1)
        i0 = int(t0 * SR); out[i0:i0 + len(s)] += s[:max(0, len(out) - i0)]
        t0 += rng.uniform(0.06, 0.16)
    return out
def waves_bed(d, rate=0.16):
    n = tt(d)
    sw = 0.55 + 0.45 * np.sin(2 * np.pi * rate * n) ** 2
    return signal.sosfilt(lp(900), nz(d)) * sw * 0.5 + signal.sosfilt(bp(2000, 6000), nz(d)) * sw ** 3 * 0.06
def reverb_ir(sec=1.4, lpf=5000, seed=3):
    r = np.random.default_rng(seed); n = int(sec * SR); t = np.arange(n) / SR
    ir = np.stack([signal.sosfilt(lp(lpf), r.standard_normal(n) * np.exp(-t / (sec * 0.28))) for _ in range(2)], 1)
    return ir / np.sqrt((ir ** 2).sum())
def reverb(x, ir, wet):
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet * 2.2

# ---------------- voice ----------------
mp3 = os.path.join(HERE, 'samoa_skipped_a_day.mp3'); raw = os.path.join(HERE, 'voice_raw.wav'); proc = os.path.join(HERE, 'voice_proc.wav')
run(['ffmpeg', '-y', '-i', mp3, '-ar', str(SR), '-ac', '1', raw])
run(['ffmpeg', '-y', '-i', raw, '-af', 'highpass=f=70,equalizer=f=250:t=q:w=1:g=-1.5,equalizer=f=3000:t=q:w=1.2:g=1.5,acompressor=threshold=-26dB:ratio=3:attack=6:release=110:makeup=5dB,alimiter=limit=0.89:attack=3:release=40', '-ar', str(SR), proc])
v, _ = sf.read(proc)
if v.ndim > 1: v = v[:, 0]
voice = np.zeros((N, 2)); L = min(len(v), N); voice[:L, 0] = v[:L]; voice[:L, 1] = v[:L]
meter = pyln.Meter(SR); vl = meter.integrated_loudness(voice); print('voice', round(vl, 2))
hop = int(0.01 * SR)
ev = signal.sosfilt(lp(14, 1), np.sqrt(np.convolve(v[:L] ** 2, np.ones(hop) / hop, mode='same')))
thr = np.percentile(ev[ev > 0.002], 25); act = np.clip((ev - thr * 0.5) / (thr * 1.5), 0, 1)
sm = np.zeros_like(act); cur = 0.0; aa = 1 - np.exp(-1 / (0.03 * SR)); ar = 1 - np.exp(-1 / (0.28 * SR))
for i in range(len(act)): cur += (act[i] - cur) * (aa if act[i] > cur else ar); sm[i] = cur
duck = np.ones(N); duck[:L] = 10 ** (-5.5 * sm / 20)

# ---------------- music: ukulele + log drums + bass ----------------
BPM = 100; beat = 60 / BPM
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def ks(f, d=1.2, bright=0.5, vel=1.0):
    """Karplus-Strong plucked nylon string"""
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p) * vel
    buf = signal.sosfilt(lp(1500 + 5000 * bright), buf)
    out = np.zeros(n); damp = 0.996
    idx = 0
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % p
        buf[idx] = damp * 0.5 * (buf[idx] + buf[nxt])
        idx = nxt
    return out
_cache = {}
def uke(m, d=1.0, vel=1.0):
    key = (m, round(d, 2))
    if key not in _cache: _cache[key] = ks(midi(m), d, 0.45)
    return _cache[key] * vel
CH = {'C': [67, 60, 64, 72], 'G': [67, 62, 67, 71], 'Am': [69, 60, 64, 69], 'F': [69, 60, 65, 69]}
ROOT = {'C': 36, 'G': 43, 'Am': 45, 'F': 41}
PROG = ['C', 'G', 'Am', 'F']
def strum(buf, ch, t0, down=True, vel=1.0, pan=-0.25, d=0.9):
    notes = CH[ch] if down else CH[ch][::-1]
    for k, m in enumerate(notes):
        place(buf, uke(m, d, 1.0), t0 + k * 0.011 + rng.normal(0, 0.002), pan + 0.08 * k, vel * (0.85 + 0.15 * rng.random()))
def logdrum(f=230, vel=1.0):
    n = tt(0.2)
    return (np.sin(2 * np.pi * f * n) + 0.4 * np.sin(2 * np.pi * f * 2.7 * n) * np.exp(-n / 0.015)) * np.exp(-n / 0.05) * vel + signal.sosfilt(bp(800, 4000), nz(0.2)) * np.exp(-n / 0.004) * 0.4 * vel
def bass(f, d=0.5, vel=1.0):
    n = tt(d)
    return (np.sin(2 * np.pi * f * n) + 0.25 * np.sin(4 * np.pi * f * n)) * np.exp(-n / 0.35) * (1 - np.exp(-n / 0.006)) * np.clip((d - n) / 0.05, 0, 1) * vel
def shaker(vel=1.0):
    n = tt(0.07)
    return signal.sosfilt(bp(4000, 11000), nz(0.07)) * np.sin(np.pi * n / 0.07) ** 2 * vel

music = np.zeros((N, 2)); old = np.zeros((N, 2))
bar = 0; t0 = 0.0
while t0 < DUR:
    ch = PROG[bar % 4]
    for b in range(4):
        tb = t0 + b * beat
        if tb > 35.5: continue
        night = tb < 7.4
        under = 10.05 <= tb < 12.4
        brk = 28.55 <= tb < 29.45
        era = 29.45 <= tb < 33.55
        target = old if era else music
        if brk: continue
        if night or under:
            # gentle arpeggio
            for k in range(2):
                m = CH[ch][(b * 2 + k) % 4]
                place(target, uke(m, 1.2, 1.0), tb + k * beat / 2 + rng.normal(0, 0.004), -0.3 + 0.2 * ((b * 2 + k) % 4), 0.55)
            if b == 0: place(target, bass(midi(ROOT[ch]), 1.2, 0.7), tb, 0, 1)
            continue
        # island strum pattern: D . D U . U D U
        pat = [(0, True, 1.0), (1, True, 0.8), (1.5, False, 0.6), (2.5, False, 0.6), (3, True, 0.8), (3.5, False, 0.6)]
        if b == 0:
            for off, dn, vv in pat: strum(target, ch, t0 + off * beat, dn, vv * 0.9)
        place(target, bass(midi(ROOT[ch] + (0 if b % 2 == 0 else 7)), 0.5, 0.9), tb + rng.normal(0, 0.004), 0, 1)
        # log drums (pate) on 16ths: x . x x . x . x
        for s16, vv in ((0, 1.0), (2, 0.6), (3, 0.8), (5, 0.55), (7, 0.7)):
            if b % 2 == 1 and s16 == 0: vv = 0.7
            place(target, logdrum(230 if s16 % 2 == 0 else 320, vv), tb + s16 * beat / 4 + rng.normal(0, 0.003), 0.35 if s16 % 2 else -0.15, 0.55)
        for s8 in range(2): place(target, shaker(0.6 if s8 else 0.35), tb + s8 * beat / 2 + 0.01, 0.5, 0.5)
    t0 += 4 * beat; bar += 1
# underwater: muffle the bed
uw = (T >= 10.05) & (T < 12.4)
muf = signal.sosfilt(lp(600, 4), music, axis=0)
xf = np.clip(np.minimum((T - 10.0) / 0.12, (12.45 - T) / 0.12), 0, 1)[:, None] * uw[:, None]
music = music * (1 - xf) + muf * xf * 1.4
# 1892: gramophone tone
old = signal.sosfilt(bp(350, 3200, 2), old, axis=0) * 1.6
cr = np.zeros(N); k = (rng.random(N) < 0.0006) & (T > 29.4) & (T < 33.6); cr[k] = rng.uniform(-1, 1, k.sum())
cr = signal.sosfilt(bp(1500, 7000), cr) * 2.5
old[:, 0] += cr; old[:, 1] += cr
music = music + old
fade = np.clip((35.7 - T) / 0.9, 0, 1) ** 1.5
music *= fade[:, None]
music = reverb(music, reverb_ir(1.3, 6500, 5), 0.18)

# ---------------- SFX ----------------
sfx = np.zeros((N, 2)); amb = np.zeros((N, 2)); sting = np.zeros((N, 2))
# ambience: night waves + crickets (also the loop tail), day sea, underwater rumble
wb = waves_bed(DUR)
nightamb = np.clip(np.minimum((7.6 - T) / 0.6, 1), 0, 1) + np.clip((T - 35.75) / 0.4, 0, 1)
dayamb = ((T > 12.4) & (T < 25.1)).astype(float) * 0.8 + ((T > 7.4) & (T < 10.05)).astype(float) * 0.7
envamb = signal.sosfilt(lp(3, 1), np.clip(nightamb + dayamb, 0, 1))
amb[:, 0] += wb * envamb; amb[:, 1] += np.roll(wb, 2400) * envamb
crk = np.zeros(N)
for i in range(60):
    tc = rng.uniform(0, 7.3) if i < 48 else rng.uniform(35.8, 36.2)
    c = cricket(); i0 = int(tc * SR); crk[i0:i0 + len(c)] += c[:max(0, N - i0)] * rng.uniform(0.3, 1)
amb[:, 0] += crk * 0.06; amb[:, 1] += np.roll(crk, 700) * 0.06
rum = signal.sosfilt(lp(220), nz(DUR)) * uw * 0.9
amb[:, 0] += rum; amb[:, 1] += rum
# S1 — flutter + tear + page flying away
place(sfx, flutter(0.8, 14), 0.0, 0.1, 0.6)
place(sfx, tear(0.22), 0.8, 0.0, 1.1)
place(sfx, flutter(1.9, 11), 0.95, 0.2, 0.5)
for k in range(3): place(sfx, flap(), 1.0 + k * 0.33, rng.uniform(-0.5, 0.5), 0.35)
place(sfx, breeze(0.5), 2.7, 0, 0.35)
# S2 — night to Saturday
place(sfx, tok(300, 0.03), 3.2, 0, 0.7)
for k in range(3): place(sfx, flap(0.1, 600, 3500), 4.2 + k * 0.1, 0.4, 0.45)
place(sfx, tok(1700, 0.004, 0.9), 4.98, 0.2, 0.8)
place(sfx, tok(1500, 0.004, 0.9), 5.1, 0.2, 0.5)
place(sfx, snore(0.9), 5.4, 0.2, 0.45); place(sfx, snore(0.9), 6.45, 0.2, 0.4)
place(sfx, breeze(0.55, 400, 2000), 7.2, -0.4, 0.3)
place(sfx, bloop(240, 520, 0.18) * 0.5, 7.45, 0, 0.45)
for tb in (7.75, 7.92, 8.5, 8.66): place(sfx, bird(), tb, rng.uniform(-0.6, 0.6), 0.18)
place(sfx, flap(0.14), 7.88, 0, 0.6); place(sfx, tok(260, 0.025), 8.2, 0, 0.5)
place(sfx, flutter(0.6, 15), 9.5, -0.1, 0.5)
# S3 — splash + bubbles + Why
place(sfx, splash(0.8, 1.0), 10.06, 0, 1.0)
for k in range(8): place(sfx, bloop(rng.uniform(300, 500), rng.uniform(800, 1300), 0.08) * 0.35, 10.3 + k * 0.22 + rng.uniform(0, 0.1), rng.uniform(-0.5, 0.5), 0.6)
place(sfx, bloop(180, 420, 0.3), 12.0, 0, 0.6)
place(sfx, bloop(500, 1400, 0.06), 12.36, 0, 0.6); place(sfx, tok(900, 0.01, 0.3), 12.37, 0, 0.4)
# S4 — map
place(sfx, horn(0.9, 98), 13.3, 0.4, 0.35)
place(sfx, thump(120, 60, 0.08), 14.58, -0.4, 0.8); place(sfx, flap(), 14.7, -0.4, 0.5); place(sfx, flap(), 14.82, -0.4, 0.4)
place(sfx, thump(130, 65, 0.08), 15.32, 0.1, 0.75); place(sfx, flap(), 15.44, 0.1, 0.45); place(sfx, flap(), 15.56, 0.1, 0.35)
for t0b, d in ((16.06, 0.06), (16.18, 0.08), (16.26, 0.05), (16.3, 0.35)): place(sfx, buzz(d), t0b, 0.3, 0.3)
place(sfx, tok(500, 0.02), 16.06, 0.3, 0.5)
for k in range(10): place(sfx, tick(2400 if k % 2 else 2000), 16.24 + k * 0.136, 0.3, 0.5)
place(sfx, tok(700, 0.03, 0.3), 17.62, 0.3, 0.45)
place(sfx, breeze(0.4, 300, 1400), 18.0, 0.3, 0.35)
# S4b — Monday | Sunday
place(sfx, flap(0.18, 300, 1800), 18.3, -0.5, 0.5); place(sfx, flap(0.18, 300, 1800), 18.34, 0.5, 0.5)
for k in range(2): place(sfx, flap(), 18.6 + k * 0.12, -0.5, 0.35)
place(sfx, typing(1.3), 18.95, -0.45, 0.55)
place(sfx, tok(420, 0.03), 19.5, -0.4, 0.7)
place(sfx, creak(0.5, 160, 220), 20.4, 0.5, 0.4); place(sfx, creak(0.5, 220, 170), 21.1, 0.5, 0.35)
for k in range(2): place(sfx, flap(), 20.3 + k * 0.12, 0.5, 0.35)
place(sfx, tok(380, 0.03), 21.44, 0.4, 0.7)
place(sfx, flap(0.2, 300, 1600), 22.24, -0.6, 0.45); place(sfx, flap(0.2, 300, 1600), 22.28, 0.6, 0.45)
# S5 — HERO hop
place(sfx, creak(0.26, 140, 300), 22.72, 0.4, 0.6)
place(sfx, boing(0.5, 160, 460), 22.98, 0.3, 0.9)
place(sfx, splash(0.25, 0.4) * 0.5, 22.98, 0.3, 0.5)
place(sfx, breeze(1.0, 250, 1200), 23.3, 0, 0.35)
place(sfx, splash(1.0, 1.5), 24.6, -0.4, 1.2)
place(sfx, flap(0.14), 24.64, -0.4, 0.5); place(sfx, tok(300, 0.025), 24.92, -0.4, 0.45)
place(sfx, flutter(0.35, 18), 24.8, -0.2, 0.6)
# S6 — paid
place(sfx, flap(0.18, 300, 2500), 25.7, 0, 0.6); place(sfx, tok(200, 0.03, 0.2), 25.74, 0, 0.5)
place(sfx, stamp(), 26.68, 0, 1.3)
for i, (tl, pn) in enumerate(zip([0.62, 0.66, 0.71, 0.75, 0.8, 0.85, 0.9], [-0.7, -0.4, -0.2, 0.2, 0.5, 0.7, -0.6])):
    place(sfx, clink(rng.uniform(2600, 3400)), 26.73 + i * 0.045 + tl, pn, 0.35)
    place(sfx, clink(rng.uniform(2600, 3400)) * 0.5, 26.73 + i * 0.045 + tl + 0.1, pn, 0.2)
# stinger on "But" + twist
n = tt(1.4)
boomS = np.sin(2 * np.pi * np.cumsum(36 + 40 * np.exp(-n / 0.07)) / SR) * np.exp(-n / 0.5)
place(sting, boomS + np.concatenate([stamp(), np.zeros(len(n) - len(stamp()))]) * 0.6, 28.56, 0, 1)
place(sfx, breeze(0.85, 200, 1000), 28.62, 0, 0.45)
# S7 — 1892
for k in range(3): place(sfx, flap(0.12, 300, 2000), 30.26 + k * 0.1, 0, 0.5)
place(sfx, tok(280, 0.03), 30.62, -0.4, 0.55)
place(sfx, creak(0.22, 140, 300), 31.8, -0.4, 0.55)
place(sfx, boing(0.5, 160, 460), 32.02, -0.3, 0.8)
place(sfx, splash(0.8, 1.0) * 0.8, 32.98, 0.4, 0.9)
place(sfx, tok(320, 0.025), 33.0, 0.2, 0.5)
place(sfx, breeze(0.4, 300, 1500), 33.45, 0, 0.35)
for k in range(4): place(sfx, flap(0.1, 500, 3000), 33.7 + k * 0.09, rng.uniform(-0.6, 0.6), 0.35)
for tf, pn in ((34.15, -0.5), (34.5, 0.5), (35.04, 0.0), (35.32, -0.5), (35.5, 0.5)):
    place(sfx, hiss_up(0.3), tf - 0.32, pn, 0.25)
    place(sfx, thump(90, 40, 0.12, 0.4), tf, pn, 0.55)
    place(sfx, crackle(0.9), tf + 0.05, pn, 0.35)
place(sfx, flap(0.14), 34.68, 0, 0.55); place(sfx, tok(400, 0.03), 35.0, 0.3, 0.6)
place(sfx, flap(0.14), 35.52, 0, 0.55)
# land a soft hit on each hard picture change (look.py cut-sync)
place(sfx, tok(240, 0.03, 0.3), 22.62, 0, 0.45)
place(sfx, flap(0.16, 300, 2200), 25.08, 0, 0.6); place(sfx, tok(220, 0.03, 0.3), 25.1, 0, 0.4)
place(sfx, tok(200, 0.04, 0.3), 29.42, 0, 0.55)
place(sfx, tok(260, 0.03, 0.3), 33.82, 0, 0.5)
sfx = reverb(sfx, reverb_ir(0.8, 7000, 7), 0.12)
sting = reverb(sting, reverb_ir(1.6, 4000, 9), 0.25)
sfx = sfx + amb * 0.55

# ---------------- levels + master ----------------
def lufs(x): return meter.integrated_loudness(x)
def setl(x, tgt): return x * 10 ** ((tgt - lufs(x)) / 20)
music_n = setl(music, vl - 19.0) * duck[:, None]
sfx_n = setl(sfx, vl - 17.0)
sting_n = setl(sting, vl - 11.0)
mix = voice + music_n + sfx_n + sting_n
sf.write(os.path.join(HERE, 'mix_pre.wav'), mix, SR, subtype='FLOAT')
r1 = run(['ffmpeg', '-hide_banner', '-nostats', '-i', os.path.join(HERE, 'mix_pre.wav'), '-af', 'loudnorm=I=-14.3:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-'])
txt = r1.stderr; j = json.loads(txt[txt.rindex('{'):txt.rindex('}') + 1])
af = f"loudnorm=I=-14.3:TP=-1.5:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
run(['ffmpeg', '-y', '-i', os.path.join(HERE, 'mix_pre.wav'), '-af', af, '-ar', '48000', os.path.join(HERE, 'mix_final.wav')])
fin, _ = sf.read(os.path.join(HERE, 'mix_final.wav'))
g = np.sqrt((fin ** 2).sum() / (mix ** 2).sum())
print('FINAL', round(lufs(fin), 2), 'peak', round(float(np.abs(fin).max()), 3))
for nm, x in (('voice', voice), ('music', music_n), ('sfx', sfx_n), ('stinger', sting_n)): print(f'{nm:8s} {lufs(x * g):6.1f}')
