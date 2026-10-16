"""Sound for "Can A Raise Make You Poorer" (RaiseVideo).

Everything is placed from src/raise/timeline.json (the file the picture reads), never typed times.
Builds three stems and the final mix:
  music  - synthesized lo-fi score (Rhodes, bass, brushes), one arrangement per section, key of F
  sfx    - foley from things on screen (pencil, coins, paper, footsteps, calendar, rip)
  sting  - the one stinger, on the pivot word "cliffs"
Mix targets (relative to the voice's integrated loudness): music -19 dB and ducked a further
5 dB while the voice talks, SFX -17 dB, stinger -11 dB; master -14 LUFS, true peak <= -1 dBTP.

Usage: python3 sfx/cues/raise.py <voice.wav> <words.json> <out_dir>
"""
import json
import random
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import fftconvolve, resample_poly, butter, sosfilt

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from sfx import synth  # noqa: E402

SR = 48000
TL = json.load(open(Path(__file__).resolve().parents[2] / 'src/raise/timeline.json'))
B = TL['beats']
SC = TL['scenes']
DUR = TL['duration']
N = int(SR * DUR) + SR
rng = np.random.default_rng(7)
random.seed(7)


def arr(x):
    return np.asarray(x, dtype=np.float64)


def place(dst, t, x, gain=1.0, pan=0.0):
    """Mono x into stereo dst (2, N) at t seconds, equal-power pan."""
    i0 = int(round(t * SR))
    if i0 >= dst.shape[1] or i0 + len(x) <= 0:
        return
    a = (pan + 1) * np.pi / 4
    s = max(0, -i0)
    e = min(len(x), dst.shape[1] - i0)
    dst[0, i0 + s:i0 + e] += x[s:e] * gain * np.cos(a)
    dst[1, i0 + s:i0 + e] += x[s:e] * gain * np.sin(a)


def lowpass(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def reverb_ir(sec=1.4, decay=3.2, seed=3):
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    ir = r.standard_normal((2, n)) * np.exp(-decay * np.arange(n) / SR * 3)[None]
    ir = np.stack([lowpass(ir[0], 5000), lowpass(ir[1], 5000)])
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def add_reverb(st, wet=0.18, sec=1.4):
    ir = reverb_ir(sec)
    out = st.copy()
    for c in range(2):
        out[c] += wet * fftconvolve(st[c], ir[c])[: st.shape[1]]
    return out


# ------------------------------------------------------------------ music
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}


def hz(name):
    m = re.match(r'([A-G]#?)(\d)', name)
    return 440.0 * 2 ** ((NOTE[m.group(1)] + 12 * (int(m.group(2)) + 1) - 69) / 12)


CH = {  # voicings (low to high) and bass roots
    'Fmaj7': (['F3', 'A3', 'C4', 'E4'], 'F2'),
    'Dm7': (['D3', 'F3', 'A3', 'C4'], 'D2'),
    'Am7': (['E3', 'G3', 'A3', 'C4'], 'A1'),
    'Bbmaj7': (['D3', 'F3', 'A3', 'A#3'], 'A#1'),
    'C7sus': (['F3', 'A#3', 'C4', 'D4'], 'C2'),
    'Gm7': (['F3', 'A#3', 'D4', 'G4'], 'G1'),
    'A7sus': (['E3', 'G3', 'A3', 'D4'], 'A1'),
    'Bbadd9': (['F3', 'A#3', 'C4', 'D4'], 'A#1'),
    'C/E': (['E3', 'G3', 'C4', 'D4'], 'E2'),
}

BPM = 84.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT


def rhodes(f, dur, vel):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.exp(-t / 1.25) * (1 - np.exp(-t / 0.004))
    bell = np.exp(-t / 0.18)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.6 * t)
    x = np.sin(2 * np.pi * f * t) + 0.32 * bell * np.sin(2 * np.pi * 2 * f * t) + 0.08 * bell * np.sin(2 * np.pi * 7.02 * f * t)
    return lowpass(x * env * trem * vel, 3200)


def bass(f, dur, vel):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.exp(-t / 0.9) * (1 - np.exp(-t / 0.006))
    x = np.tanh(1.6 * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)))
    return lowpass(x * env * vel, 900)


def kick(vel):
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    f = 46 + 70 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.13) * vel


def brush(vel, dur=0.09, lo=3500, hi=9000):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bandpass(rng.standard_normal(n), lo, hi) * np.exp(-t / (dur / 3)) * (1 - np.exp(-t / 0.003))
    return x * vel


def snare_brush(vel):
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    x = bandpass(rng.standard_normal(n), 900, 6000) * np.exp(-t / 0.09) * (1 - np.exp(-t / 0.012))
    return x * vel


def kalimba(f, dur, vel):
    """Thumb-piano tine: soft sine body, a short inharmonic tine on top, quick wooden decay."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.exp(-t / 0.55) * (1 - np.exp(-t / 0.003))
    tine = np.exp(-t / 0.05)
    x = np.sin(2 * np.pi * f * t) + 0.22 * tine * np.sin(2 * np.pi * 5.4 * f * t) + 0.1 * np.exp(-t / 0.12) * np.sin(2 * np.pi * 2 * f * t)
    return lowpass(x * env * vel, 5200)


# lead motifs per chord: (beat offset within the bar, note) - pentatonic, stepwise, leaves room for the voice
MOTIF = {
    'Fmaj7': [(1.5, 'A4'), (2.5, 'C5'), (3.5, 'A4')],
    'Dm7': [(1.5, 'F4'), (2.5, 'A4')],
    'Am7': [(1.5, 'E4'), (2.5, 'A4'), (3.5, 'C5')],
    'Bbmaj7': [(1.5, 'D5'), (2.5, 'C5')],
    'C7sus': [(1.5, 'G4'), (2.5, 'A4'), (3.5, 'C5')],
    'Gm7': [(1.5, 'D5'), (2.5, 'A#4')],
    'A7sus': [(1.5, 'E5'), (2.5, 'D5')],
    'Bbadd9': [(1.5, 'F5'), (2.5, 'D5'), (3.5, 'C5')],
    'C/E': [(1.5, 'G4'), (2.5, 'C5')],
}


def echo(st, delay=0.75 * BEAT, fb=0.38, n=3):
    out = st.copy()
    for k in range(1, n + 1):
        d = int(delay * k * SR)
        out[:, d:] += st[:, : st.shape[1] - d] * (fb ** k)
    return out


# sections: (start, end, chords per bar (cycled), parts)
S = lambda k: SC[k]['start']
SECTIONS = [
    (0.0, S('claim'), ['Fmaj7', 'Dm7'], {'keys'}),
    (S('claim'), S('maya'), ['Bbmaj7', 'C7sus'], {'keys', 'bass', 'shaker'}),
    (S('maya'), S('pivot'), ['Fmaj7', 'Am7', 'Bbmaj7', 'C7sus'], {'keys', 'bass', 'shaker', 'kick', 'snare', 'bells'}),
    (S('pivot'), B['pivot']['cliffs'] - 0.45, ['Bbmaj7'], {'keys'}),
    (B['pivot']['cliffs'] + 1.6, S('move'), ['Dm7', 'Bbmaj7', 'Gm7', 'A7sus'], {'keys', 'bass', 'shaker', 'kick', 'bells'}),
    (S('move'), S('close'), ['Bbadd9', 'C7sus', 'Fmaj7', 'Dm7'], {'keys', 'bass', 'shaker', 'kick', 'snare', 'bells'}),
    (S('close'), B['end']['hold'], ['Fmaj7', 'C/E', 'Dm7', 'Bbmaj7'], {'keys', 'bass', 'shaker', 'kick', 'snare', 'bells'}),
]


def build_music():
    st = np.zeros((2, N))
    bl = np.zeros((2, N))
    for (t0, t1, chords, parts) in SECTIONS:
        # snap section start to the bar grid so the groove never stumbles
        bar0 = int(np.ceil(t0 / BAR - 1e-6))
        b = bar0
        ci = 0
        while b * BAR < t1:
            tb = b * BAR
            name = chords[ci % len(chords)]
            voicing, root = CH[name]
            last = (b + 1) * BAR >= t1
            # keys: a comp on 1 and the "and" of 2, humanized, slightly spread
            for hit, vel in ((0.0, 0.5), (1.5 * BEAT, 0.33)) if 'kick' in parts or 'bass' in parts else ((0.0, 0.5),):
                th = tb + hit + rng.uniform(-0.012, 0.012)
                if th >= t1:
                    continue
                for k, nm in enumerate(voicing):
                    place(st, th + k * 0.011, rhodes(hz(nm), 2.4 if hit == 0 else 1.2, vel * rng.uniform(0.85, 1.05)), 0.16, pan=-0.25 + k * 0.17)
            if 'bells' in parts and (b % 2 == 0 or len(chords) == 1):
                for hb, nm in MOTIF[name]:
                    th = tb + hb * BEAT + rng.uniform(-0.008, 0.008)
                    if th < t1 - 0.3:
                        place(bl, th, kalimba(hz(nm), 1.6, rng.uniform(0.8, 1.0)), 0.2, pan=0.35 if hb == 1.5 else -0.2)
            if 'bass' in parts:
                for hit in (0.0, 2.5 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, bass(hz(root), 1.3, 0.42 * rng.uniform(0.9, 1.0)), 1.0)
            if 'kick' in parts:
                for hit in (0.0, 2.5 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, kick(0.55), 1.0)
            if 'snare' in parts:
                for hit in (BEAT, 3 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit + 0.01, snare_brush(0.22), 1.0, pan=0.08)
            if 'shaker' in parts:
                for e in range(8):
                    swing = 0.06 * BEAT if e % 2 else 0.0
                    te = tb + e * BEAT / 2 + swing
                    if te < t1:
                        place(st, te, brush(0.10 if e % 2 else 0.16), 1.0, pan=0.3)
            b += 1
            ci += 1
            if last:
                break
    # a sustained Bb pad through the pivot, cut dead before the stinger (the silence sells it)
    p0, p1 = S('pivot'), B['pivot']['cliffs'] - 0.45
    pl, pr = synth.pad(p1 - p0, [(0.0, [hz('A#2'), hz('F3'), hz('D4')])])
    place(st, p0, arr(pl), 0.25, pan=-0.3)
    place(st, p0, arr(pr), 0.25, pan=0.3)
    st = st + echo(bl)
    st = add_reverb(st, 0.2)
    # fades: in over the first 0.3 s, out from the final action to the start of the hold
    env = np.ones(N)
    t = np.arange(N) / SR
    a0, a1 = B['end']['action'], B['end']['hold']
    env *= np.clip(t / 0.3, 0, 1)
    env *= np.clip((a1 - t) / (a1 - a0), 0, 1)
    pv = B['pivot']['cliffs']
    env *= np.where((t > pv - 0.5) & (t < pv + 1.6), 0.0, 1.0)
    return st * env[None]


# ------------------------------------------------------------------ foley
def sx(x):
    return arr(x)


def coin(f=None):
    f = f or rng.uniform(2600, 3600)
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.53 * t) + 0.3 * np.sin(2 * np.pi * f * 2.11 * t)) * np.exp(-t / 0.018)
    return x * 0.3


def coin_hit(dst, t, gain=0.5, pan=0.0):
    place(dst, t, coin(), gain, pan)
    place(dst, t, sx(synth.click(5200, 0.015)), gain * 0.8, pan)


def pencil(dst, t, dur, gain=0.55, pan=0.0):
    place(dst, t, sx(synth.scratch(dur)), gain, pan)


def paper(dst, t, dur=0.35, gain=0.35, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = bandpass(rng.standard_normal(n), 1500, 7000) * np.sin(np.pi * tt / dur) ** 1.5 * (0.6 + 0.4 * rng.random(n) ** 3)
    place(dst, t, x, gain, pan)


def thud(dst, t, gain=0.5, pan=0.0, f=110):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * (f + 60 * np.exp(-tt / 0.02)) * tt) * np.exp(-tt / 0.07)
    x += 0.3 * bandpass(rng.standard_normal(n), 300, 2000) * np.exp(-tt / 0.02)
    place(dst, t, x, gain, pan)


def step(dst, t, gain=0.25, pan=0.0):
    thud(dst, t, gain, pan, f=rng.uniform(80, 110))
    paper(dst, t, 0.06, gain * 0.5, pan)


def pour(dst, t, dur, gain=0.3, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = bandpass(rng.standard_normal(n), 400, 2400) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tt + rng.random() * 6) ** 2)
    x *= np.sin(np.pi * tt / dur) ** 0.7
    place(dst, t, x, gain, pan)


def pop_(dst, t, f0=500, f1=900, gain=0.35, pan=0.0):
    place(dst, t, sx(synth.pop(f0, f1)), gain, pan)


def tick(dst, t, gain=0.18, pan=0.0):
    place(dst, t, sx(synth.click(2400, 0.03)), gain, pan)


def rip(dst, t, dur=0.5, gain=0.4):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    crack = (rng.random(n) < 0.06) * rng.standard_normal(n)
    x = bandpass(rng.standard_normal(n) * 0.4 + crack * 2.5, 800, 8000) * np.sin(np.pi * tt / dur) ** 0.6
    place(dst, t, x, gain, -0.4)
    place(dst, t + 0.01, x, gain, 0.4)


def build_sfx():
    st = np.zeros((2, N))
    c, s, cl, m, bk, k, p, d, f, co, mv, ss, cs, e = (B[x] for x in ['cold', 'setup', 'claim', 'maya', 'buckets', 'math', 'pivot', 'dan', 'cliff', 'cost', 'move', 'status', 'close', 'end'])
    # cold open: the whisper bubble, the red pen crossing it out
    paper(st, c['bubble'], 0.4, 0.25, 0.2)
    pencil(st, c['wrong'] - 0.05, 0.45, 0.6, -0.4)
    pop_(st, c['mostly'], 420, 620, 0.3, 0.3)
    # rewind: a few quick tape ticks, no swoosh
    for i in range(6):
        tick(st, s['rewind'] + i * 0.06, 0.14, -0.2 + i * 0.08)
    paper(st, s['boss'], 0.5, 0.3, 0.5)
    thud(st, s['raise_'], 0.25, 0.1, f=180)
    pencil(st, s['higher'] - 0.1, 0.6, 0.45, -0.6)
    # claim
    thud(st, cl['wrong'], 0.45, 0.3, f=90)
    pencil(st, cl['right'] - 0.3, 0.5, 0.35, 0.0)
    for i in range(6):
        paper(st, cl['thousands'] + i * 0.18, 0.12, 0.22, 0.4)
    # maya ledger: each number is written
    for key, dur in (('salary', 0.7), ('deduction', 0.5), ('dedAmt', 0.6), ('taxable', 0.8)):
        pencil(st, m[key] - 0.05, dur, 0.4, 0.35)
    # buckets: coins drop as they fill; the spill; a red circle; check marks
    for i in range(5):
        coin_hit(st, bk['first'] + 0.1 + i * 0.56, 0.32 * rng.uniform(0.7, 1), -0.45)
    for i in range(7):
        coin_hit(st, bk['everything'] + i * 1.0, 0.28 * rng.uniform(0.7, 1), -0.1)
    pop_(st, bk['full'], 600, 980, 0.22, -0.1)
    pour(st, bk['spills'] - 0.1, 1.3, 0.3, 0.35)
    for i in range(4):
        coin_hit(st, bk['twentyTwo'] + i * 0.3, 0.25, 0.4)
    pencil(st, bk['overflow'], 0.7, 0.45, 0.4)
    tick(st, bk['same'] - 1.6, 0.22, -0.4)
    tick(st, bk['same'] - 1.3, 0.22, -0.1)
    # math card
    pencil(st, k['start'], 0.4, 0.35, 0.3)
    for i in range(10):
        tick(st, k['result'] + i * 0.05, 0.10, 0.4)
    paper(st, k['keeps'], 0.5, 0.35, -0.3)
    pencil(st, k['total'] - 0.5, 0.6, 0.35, 0.3)
    pencil(st, k['nine'], 0.55, 0.4, 0.3)
    pencil(st, k['not22'] - 0.1, 0.4, 0.45, 0.2)
    for i in range(5):
        coin_hit(st, k['fill'] - 1.4 + i * 0.32, 0.18, -0.6)
    # dan
    for i in range(16):
        place(st, d['dan'] + i * 0.1 + rng.uniform(-0.01, 0.01), sx(synth.key()), 0.16, 0.1)
    pop_(st, d['market'], 500, 700, 0.25, 0.4)
    for i in range(3):
        coin_hit(st, d['premium'] - 0.6 + i * 0.25, 0.2, 0.4)
    thud(st, d['expired'], 0.55, 0.35, f=85)
    # cliff
    t = f['start'] - 0.1
    while t < f['start'] + 2.4:
        step(st, t, 0.22, -0.5 + (t - f['start']) * 0.15)
        t += 0.42
    pencil(st, f['four'] - 0.2, 0.8, 0.3, 0.2)
    thud(st, f['zero'], 0.4, 0.5, f=100)
    thud(st, f['single'] - 0.1, 0.3, 0.1, f=150)
    for i in range(3):
        step(st, f['income'] - 1.1 + i * 0.4, 0.2, 0.0)
    paper(st, f['client'], 0.6, 0.3, 0.6)
    pencil(st, f['over'] - 0.1, 0.5, 0.35, 0.3)
    for i in range(6):
        coin_hit(st, f['gone'] + 0.1 + i * 0.13 + rng.uniform(0, 0.04), 0.3 * (1 - i * 0.1), 0.2 + i * 0.1)
    # cost: calendar pages tick by while the credit stack grows
    for i in range(12):
        paper(st, co['start'] + 0.6 + i * 1.35, 0.12, 0.15, 0.2)
    thud(st, co['amount'], 0.3, 0.4, f=140)
    pencil(st, co['ten'] - 0.2, 0.5, 0.35, 0.2)
    pop_(st, co['yes'], 520, 380, 0.3, -0.5)
    # move
    pencil(st, mv['paycheck'] + 0.4, 0.4, 0.45, 0.2)
    pop_(st, mv['magi'], 450, 700, 0.25, 0.2)
    for i in range(5):
        coin_hit(st, mv['ira'] + i * 0.22, 0.22, -0.1)
    for i in range(4):
        coin_hit(st, mv['hsa'] + i * 0.22, 0.22, 0.25)
    for key in ('job', 'money', 'credit'):
        pencil(st, mv[key], 0.25, 0.4, -0.6)
    # status card
    thud(st, ss['start'] + 0.3, 0.25, 0.4, f=200)
    pencil(st, ss['house'], 0.5, 0.3, 0.4)
    pencil(st, ss['senate'], 0.5, 0.3, 0.4)
    # close: footsteps in, the final pour into the bucket, footsteps to the edge, the paper rip
    for i in range(4):
        step(st, cs['next'] - 0.5 + i * 0.35, 0.18, 0.0)
    for i in range(4):
        coin_hit(st, e['action'] + 0.35 + i * 0.34, 0.28, -0.35)
    for i in range(4):
        step(st, e['action'] + i * 0.35, 0.18, 0.2)
    rip(st, e['wipe'], DUR - e['wipe'], 0.4)
    return add_reverb(st, 0.08, 0.6)


def build_sting():
    st = np.zeros((2, N))
    t = B['pivot']['cliffs']
    place(st, t, sx(synth.impact(1.4)), 0.9)
    n = int(2.0 * SR)
    tt = np.arange(n) / SR
    tone = sum(np.sin(2 * np.pi * hz(nm) * tt) for nm in ('D3', 'G#3', 'D4')) * np.exp(-tt / 0.7) * (1 - np.exp(-tt / 0.005))
    place(st, t, lowpass(tone, 2500), 0.25)
    return add_reverb(st, 0.3, 1.6)


# ------------------------------------------------------------------ mix
def lufs(path):
    out = subprocess.run(['ffmpeg', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    summ = out[out.rfind('Summary:'):]
    i = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    tp = re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', summ)
    return i, (float(tp.group(1)) if tp and tp.group(1) != '-inf' else -99.0)


def write(path, st):
    wavfile.write(str(path), SR, (np.clip(st.T, -1, 1) * 32767).astype(np.int16))


def main():
    voice_path, words_path, out = sys.argv[1], sys.argv[2], Path(sys.argv[3])
    out.mkdir(parents=True, exist_ok=True)
    vsr, v = wavfile.read(voice_path)
    v = v.astype(np.float64) / (32768.0 if v.dtype == np.int16 else 1.0)
    if v.ndim > 1:
        v = v.mean(axis=1)
    if vsr != SR:
        v = resample_poly(v, SR, vsr)
    voice = np.zeros((2, N))
    voice[:, : min(N, len(v))] = v[:N][None]
    stems = {'voice': voice, 'music': build_music(), 'sfx': build_sfx(), 'sting': build_sting()}
    for name, st in stems.items():
        st /= max(1e-9, np.abs(st).max()) * 1.12
        write(out / f'stem-{name}.wav', st)
    L = {name: lufs(out / f'stem-{name}.wav')[0] for name in stems}
    lv = L['voice']
    rel = {'music': -19.0, 'sfx': -17.0, 'sting': -11.0}
    g = {name: 10 ** ((lv + rel[name] - L[name]) / 20) for name in rel}
    # duck music a further 5 dB while the voice talks (from measured line timings)
    words = json.load(open(words_path))
    duck = np.zeros(N)
    for ln in words['lines']:
        duck[int(ln['start'] * SR): int((ln['end'] + 0.15) * SR)] = 1.0
    k = int(0.2 * SR)
    duck = np.convolve(duck, np.ones(k) / k, mode='same')
    duck_gain = 10 ** (-5.0 * duck / 20)
    mix = stems['voice'] + stems['music'] * g['music'] * duck_gain[None] + stems['sfx'] * g['sfx'] + stems['sting'] * g['sting']
    mix = mix[:, : int(DUR * SR)]
    write(out / 'premaster.wav', mix / max(1e-9, np.abs(mix).max()) * 0.7)
    # two-pass loudnorm to -14 LUFS / -1.5 dBTP, linear
    p1 = subprocess.run(['ffmpeg', '-nostats', '-i', str(out / 'premaster.wav'), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = json.loads(p1[p1.rfind('{'): p1.rfind('}') + 1])
    flt = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
           f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(out / 'premaster.wav'), '-af', flt, '-ar', '48000', str(out / 'mix.wav')], check=True)
    i, tp = lufs(out / 'mix.wav')
    print(json.dumps({'stem_lufs': L, 'gains_db': {k2: round(20 * np.log10(v2), 2) for k2, v2 in g.items()}, 'final_I': i, 'final_TP': tp}, indent=1))


if __name__ == '__main__':
    main()
