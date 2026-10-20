"""Sound for "Almost Right" (FloatVideo): why 0.1 + 0.2 isn't 0.3, and the Vancouver index.

Everything is placed from the voice's word timings (src/float/words.json), the same file the picture reads.
Stems: music (Rhodes, bass, brushes, kalimba; key of C, 96 BPM), sfx (foley from things on screen:
calculator keys, the print head, scissors, paper, flaps, coins), sting (one, on the pivot word "Unless").
Mix targets relative to the voice: music -19 dB and ducked a further 5 dB while the voice talks,
SFX -17 dB, sting -11 dB; master -14 LUFS, true peak <= -1 dBTP.

Usage: python3 sfx/cues/float.py <voice.wav> <out_dir>
"""
import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from sfx import synth  # noqa: E402

# shared instruments and foley helpers from the episode-2 cue sheet
_spec = importlib.util.spec_from_file_location('ep2cues', ROOT / 'sfx/cues/ep2.py')
E = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(E)
SR = E.SR
place, lowpass, bandpass, add_reverb, rhodes, bass, kick, brush, snare_brush, kalimba, echo, hz, sx = (
    E.place, E.lowpass, E.bandpass, E.add_reverb, E.rhodes, E.bass, E.kick, E.brush, E.snare_brush, E.kalimba, E.echo, E.hz, E.sx)

WORDS = json.load(open(ROOT / 'src/float/words.json'))
DUR = 86.6
N = int(SR * DUR) + SR
rng = np.random.default_rng(11)
E.rng = rng


def nr(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())


def WT(w, nth=1, at='s', off=0.0):
    k = 0
    for x in WORDS:
        if nr(x['w']) == nr(w):
            k += 1
            if k == nth:
                return (x['s'] if at == 's' else x['e']) + off
    raise SystemExit(f'no word {w} {nth}')


def spread(n, a, b, p=1.0):
    return [a + (b - a) * ((i / (n - 1)) ** p if n > 1 else 0) for i in range(n)]


VOICE_END = WORDS[-1]['e']

# ------------------------------------------------------------------ music
CH = {
    'Cmaj7': (['E3', 'G3', 'B3', 'D4'], 'C2'),
    'Am7': (['E3', 'G3', 'A3', 'C4'], 'A1'),
    'Fmaj7': (['E3', 'F3', 'A3', 'C4'], 'F1'),
    'G6': (['D3', 'G3', 'B3', 'E4'], 'G1'),
    'Dm7': (['D3', 'F3', 'A3', 'C4'], 'D2'),
    'E7sus': (['D3', 'E3', 'A3', 'B3'], 'E2'),
    'Fm6': (['D3', 'F3', 'G#3', 'C4'], 'F1'),
}
MOTIF = {
    'Cmaj7': [(1.5, 'G4'), (2.5, 'E5'), (3.5, 'D5')],
    'Am7': [(1.5, 'C5'), (2.5, 'A4')],
    'Fmaj7': [(1.5, 'A4'), (2.5, 'C5'), (3.5, 'E5')],
    'G6': [(1.5, 'D5'), (2.5, 'B4')],
    'Dm7': [(1.5, 'F4'), (2.5, 'A4')],
    'E7sus': [(1.5, 'B4'), (2.5, 'A4')],
    'Fm6': [(1.5, 'G#4'), (2.5, 'C5')],
}
BPM = 96.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
PIVOT = WT('unless')
JUMP = WT('jumped')
SECTIONS = [
    (0.0, WT('thats'), ['Cmaj7', 'Am7'], {'keys', 'bells'}),
    (WT('thats'), WT('in', 4), ['Fmaj7', 'G6', 'Cmaj7', 'Am7'], {'keys', 'bass', 'shaker', 'bells'}),
    (WT('in', 4), PIVOT - 0.4, ['Dm7', 'G6', 'Cmaj7', 'Am7'], {'keys', 'bass', 'shaker', 'kick', 'bells'}),
    (WT('in', 5), WT('twentytwo') - 0.2, ['Fmaj7', 'G6', 'Am7', 'G6'], {'keys', 'bass', 'shaker', 'kick', 'snare', 'bells'}),
    (WT('twentytwo') - 0.2, JUMP - 0.3, ['Am7', 'Fm6', 'Dm7', 'E7sus'], {'keys', 'bass'}),
    (JUMP + 0.9, WT('because') - 0.1, ['Fmaj7', 'G6', 'Cmaj7', 'Am7'], {'keys', 'bass', 'shaker', 'kick', 'snare', 'bells'}),
    (WT('because') + 0.8, VOICE_END + 0.6, ['Fmaj7', 'Cmaj7'], {'keys', 'bells'}),
]


def build_music():
    st = np.zeros((2, N))
    bl = np.zeros((2, N))
    for (t0, t1, chords, parts) in SECTIONS:
        b = int(np.ceil(t0 / BAR - 1e-6))
        ci = 0
        while b * BAR < t1:
            tb = b * BAR
            name = chords[ci % len(chords)]
            voicing, root = CH[name]
            hits = ((0.0, 0.5), (1.5 * BEAT, 0.33)) if ('kick' in parts or 'bass' in parts) else ((0.0, 0.5),)
            for hit, vel in hits:
                th = tb + hit + rng.uniform(-0.012, 0.012)
                if th < t1:
                    for k, nm in enumerate(voicing):
                        place(st, th + k * 0.011, rhodes(hz(nm), 2.4 if hit == 0 else 1.2, vel * rng.uniform(0.85, 1.05)), 0.16, pan=-0.25 + k * 0.17)
            if 'bells' in parts and b % 2 == 0:
                for hb, nm in MOTIF[name]:
                    th = tb + hb * BEAT
                    if th < t1 - 0.3:
                        place(bl, th, kalimba(hz(nm), 1.4, rng.uniform(0.75, 0.95)), 0.18, pan=0.35 if hb == 1.5 else -0.2)
            if 'bass' in parts:
                for hit in (0.0, 2.5 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, bass(hz(root), 1.2, 0.42), 1.0)
            if 'kick' in parts:
                for hit in (0.0, 2.5 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, kick(0.5), 1.0)
            if 'snare' in parts:
                for hit in (BEAT, 3 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit + 0.01, snare_brush(0.2), 1.0, pan=0.08)
            if 'shaker' in parts:
                for e in range(8):
                    te = tb + e * BEAT / 2 + (0.05 * BEAT if e % 2 else 0)
                    if te < t1:
                        place(st, te, brush(0.09 if e % 2 else 0.14), 1.0, pan=0.3)
            b += 1
            ci += 1
    # the pivot: a held low pad under "Unless you chop the same number... again, and again"
    pl, pr = synth.pad(WT('in', 5) - PIVOT + 0.2, [(0.0, [hz('A2'), hz('E3'), hz('C4')])])
    place(st, PIVOT, E.arr(pl), 0.22, pan=-0.3)
    place(st, PIVOT, E.arr(pr), 0.22, pan=0.3)
    st = st + echo(bl, delay=0.75 * BEAT)
    st = add_reverb(st, 0.2)
    t = np.arange(N) / SR
    env = np.clip(t / 0.25, 0, 1) * np.clip((VOICE_END + 0.6 - t) / 1.2, 0, 1)
    return st * env[None]


# ------------------------------------------------------------------ foley
def strike(dst, t, gain=0.3, pan=0.0):
    """the print head stamping one character: a key thunk plus a small low knock"""
    place(dst, t, sx(synth.key()), gain, pan)
    E.thud(dst, t, gain * 0.45, pan, f=rng.uniform(150, 190))


def snip(dst, t, gain=0.45, pan=0.0):
    """scissors: a metallic shear and the click of the blades closing"""
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    x = bandpass(rng.standard_normal(n), 2500, 9000) * np.exp(-tt / 0.03) * (1 - np.exp(-tt / 0.004))
    x += 0.35 * np.sin(2 * np.pi * 4100 * tt) * np.exp(-tt / 0.02)
    place(dst, t - 0.05, x * 0.6, gain, pan)
    place(dst, t, sx(synth.click(3800, 0.03)), gain, pan)


def flutter(dst, t, dur=0.6, gain=0.22, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = bandpass(rng.standard_normal(n), 900, 5000) * (0.4 + 0.6 * (np.sin(2 * np.pi * 14 * tt) ** 2)) * np.sin(np.pi * tt / dur)
    place(dst, t, x, gain, pan)


def flap(dst, t, gain=0.16, pan=0.0):
    place(dst, t, sx(synth.click(rng.uniform(1300, 1700), 0.03)), gain, pan)
    E.paper(dst, t, 0.04, gain * 0.6, pan)


def build_sfx():
    st = np.zeros((2, N))
    # calculator keys
    for tk in [WT('point'), WT('one'), WT('and'), WT('point', 2), WT('two'), WT('ask'), 80.62, 80.78, 80.94, WT('perfect', 1, 's', -0.08), 85.42]:
        place(st, tk, sx(synth.key()), 0.5, -0.45)
        E.thud(st, tk, 0.12, -0.45, f=220)
    # CAN'T stamp
    E.thud(st, WT('cant', 1, 's', 0.03), 0.6, 0.3, f=120)
    E.paper(st, WT('cant'), 0.08, 0.3, 0.3)
    E.paper(st, WT('ask', 1, 's', -0.1), 0.3, 0.2, 0.4)
    # the print head: 0.30000000000000004
    run = [WT('point', 3), WT('point', 3, 's', 0.12), WT('three')] + spread(15, WT('fifteen', 1, 's', 0.05), WT('zeros', 1, 'e', -0.08))
    for i, tk in enumerate(run):
        strike(st, tk, 0.26, -0.2 + 0.03 * i)
    strike(st, WT('four'), 0.42, 0.3)
    E.pencil(st, WT('four', 1, 's', 0.25), 0.45, 0.25, 0.3)
    # the bug scurries in and gets struck out
    for i in range(10):
        place(st, WT('thats', 1, 's', -0.2) + i * 0.07, sx(synth.click(5200, 0.01)), 0.05, 0.4)
    E.pencil(st, WT('bug'), 0.12, 0.35, 0.2)
    flutter(st, WT('bug', 1, 's', 0.25), 0.5, 0.12, 0.5)
    # switches counting in binary
    t0 = WT('computers', 1, 's', 0.35)
    for k in range(16):
        E.tick(st, t0 + k * 0.105, 0.12, -0.3 + k * 0.04)
    # dots racing ahead
    for tk in spread(14, WT('some'), WT('end', 1, 'e', -0.2), 0.62):
        strike(st, tk, 0.12, 0.4)
    # one third
    E.thud(st, WT('tens', 1, 's', -0.05), 0.3, -0.2, f=100)
    E.pencil(st, WT('third'), 0.3, 0.25, -0.2)
    E.paper(st, WT('ends'), 0.3, 0.2, -0.1)
    T3 = [WT('point', 4), WT('point', 4, 's', 0.12), WT('three', 2), WT('three', 3), WT('three', 4)] + spread(21, WT('forever', 1, 's', 0.02), WT('forever', 1, 'e', 0.6), 0.55)
    for i, tk in enumerate(T3):
        strike(st, tk, 0.24 if i < 5 else 0.14, -0.1 + 0.02 * i)
    snip(st, WT('chop', 1, 's', 0.02), 0.55, 0.2)
    flutter(st, WT('chop', 1, 's', 0.1), 0.9, 0.2, 0.4)
    # one tenth in twos
    E.thud(st, WT('in', 4, 's', -0.1), 0.25, 0.2, f=100)
    E.pencil(st, WT('one', 4), 0.3, 0.22, 0.2)
    E.paper(st, WT('tenth'), 0.25, 0.2, 0.2)
    bins = [WT('zero'), WT('point', 6), WT('zero', 2), WT('zero', 3), WT('zero', 4), WT('one', 5), WT('one', 6), WT('zero', 5), WT('zero', 6), WT('one', 7), WT('one', 8)]
    bins += spread(15, WT('over', 1, 's', 0.02), WT('stop', 1, 's', -0.06), 0.7)
    for i, tk in enumerate(bins):
        strike(st, tk, 0.24 if i < 11 else 0.15, -0.2 + 0.015 * i)
    E.thud(st, WT('stop'), 0.5, 0.3, f=90)
    flutter(st, WT('round', 1, 's', -0.3), 0.6, 0.12, 0.5)
    for k in range(4):
        E.tick(st, WT('round') + k * 0.08, 0.14, 0.2)
    # number line: ticks stamped, two hops, the landing, the hair
    for tk in (35.62, 35.74, 35.86, 35.98):
        strike(st, tk, 0.16, 0.0)
    E.pop_(st, WT('rounded'), 400, 700, 0.22, -0.3)
    E.pop_(st, WT('plus'), 500, 900, 0.22, 0.2)
    E.tick(st, WT('lands', 1, 's', 0.05), 0.25, 0.4)
    place(st, WT('hair', 2), synth.bandnoise(int(0.9 * SR), lambda k: 900 + 2500 * k / (0.9 * SR)) * np.hanning(int(0.9 * SR)) * 0.4, 0.3, 0.4)
    # 1000.000 and the chops
    for tk in spread(8, WT('harmless', 1, 'e', -0.1), WT('harmless', 1, 'e', 0.3)):
        strike(st, tk, 0.2, 0.1)
    for (tp, tc) in [(WT('chop', 2, 's', -0.1), WT('chop', 2, 's', 0.12)), (WT('again', 1, 's', -0.12), WT('again', 1, 's', 0.1)), (WT('again', 2, 's', -0.08), WT('again', 2, 's', 0.14))]:
        strike(st, tp, 0.2, 0.3)
        snip(st, tc, 0.5, 0.3)
    # Vancouver: calendar, the paper theatre, the typed name, the board, the clock
    E.thud(st, WT('january', 1, 's', 0.05), 0.4, -0.3, f=110)
    E.paper(st, WT('january'), 0.15, 0.3, -0.3)
    E.paper(st, WT('vancouver', 1, 's', -0.25), 0.45, 0.25, 0.0)
    E.paper(st, WT('stock', 1, 's', -0.1), 0.45, 0.2, 0.2)
    for tk in spread(24, WT('vancouver'), WT('exchange', 1, 'e', 0.05)):
        strike(st, tk, 0.12, 0.1)
    E.thud(st, WT('index'), 0.3, 0.2, f=95)
    for i in range(8):
        flap(st, WT('one', 9) + i * 0.045, 0.2, -0.2 + i * 0.06)
    tc = WT('three', 6, 's', -0.3)
    for k in range(int((60 - tc) / 0.125)):
        E.tick(st, tc + k * 0.125, 0.06, -0.5)
    tr = WT('recalculated')
    for k in range(int((WT('everything') - tr) / 0.14)):
        for i in range(3):
            flap(st, tr + k * 0.14 + i * 0.012, 0.07, 0.1 + i * 0.1)
    for i in range(4):
        E.pop_(st, WT('everything') + 0.12 * i, 700 + 80 * i, 1100 + 80 * i, 0.12, 0.5)
    snip(st, WT('chopped', 1, 's', 0.12), 0.55, 0.5)
    # crumbs into the jar, then the stream
    a, b = WT('each'), WT('adds', 1, 'e')
    t, gap = a, 0.45
    while t < b:
        place(st, t + 0.6, sx(synth.click(rng.uniform(3500, 5200), 0.012)), 0.1 if gap > 0.1 else 0.04, 0.4)
        t += gap
        gap = max(0.035, gap * (0.8 if t > WT('three', 7) else 0.93))
    E.pour(st, WT('three', 7) + 0.4, b - WT('three', 7), 0.12, 0.4)
    # 22 months fly off the calendar
    for k in range(22):
        E.paper(st, WT('twentytwo') - 0.1 + k * (WT('later', 1, 'e') - WT('twentytwo') + 0.1) / 22, 0.05, 0.14, -0.2)
    # the chart draws itself; the fix; the jump (a bright pop, the sting is elsewhere)
    E.pencil(st, WT('index', 2) - 0.1, WT('twentyfour', 1, 'e') - WT('index', 2), 0.2, 0.0)
    E.thud(st, WT('twentyfour'), 0.25, 0.3, f=140)
    E.pencil(st, WT('market'), WT('crashed', 1, 'e') - WT('market'), 0.16, -0.2)
    E.pencil(st, WT('fixed'), 0.6, 0.2, 0.3)
    E.pop_(st, JUMP, 380, 1200, 0.4, 0.3)
    place(st, JUMP + 0.05, sx(synth.chime([hz('C5'), hz('E5'), hz('G5')], 1.4, 0.5)), 0.12, 0.3)
    for i in range(8):
        flap(st, JUMP + 0.2 + i * 0.03, 0.14, 0.2)
    # the price tag, the plucked point, the cents, the coins
    E.thud(st, WT('careful', 1, 's', -0.2), 0.3, -0.3, f=130)
    E.pop_(st, WT('decimals', 1, 's', 0.1), 900, 1500, 0.22, 0.2)
    E.thud(st, WT('counts'), 0.3, 0.2, f=150)
    for tk in spread(11, WT('whole'), WT('cents', 1, 'e', 0.05), 0.85):
        E.coin_hit(st, tk, 0.16, 0.4)
    # the run home along the tape: paper rushing past, no swoosh
    for k in range(18):
        E.tick(st, WT('because', 1, 's', -0.05) + k * 0.05, 0.05 * (1 - abs(k - 9) / 10), 0.6 - k * 0.07)
    E.pencil(st, WT('perfect'), 0.3, 0.3, -0.4)
    E.pencil(st, 83.5, 0.5, 0.18, 0.2)
    # C: the printout tears off and fresh paper feeds out
    E.rip(st, 85.46, 0.45, 0.35)
    n = int(0.8 * SR)
    tt = np.arange(n) / SR
    motor = (np.sign(np.sin(2 * np.pi * 110 * tt)) * 0.3 + bandpass(rng.standard_normal(n), 300, 2000)) * np.sin(np.pi * tt / 0.8) ** 0.8
    place(st, 85.66, lowpass(motor, 1800) * 0.4, 0.3, -0.3)
    return add_reverb(st, 0.08, 0.6)


def build_sting():
    st = np.zeros((2, N))
    place(st, PIVOT, sx(synth.impact(1.3)), 0.8)
    n = int(2.0 * SR)
    tt = np.arange(n) / SR
    tone = sum(np.sin(2 * np.pi * hz(nm) * tt) for nm in ('A2', 'E3', 'A#3')) * np.exp(-tt / 0.7) * (1 - np.exp(-tt / 0.005))
    place(st, PIVOT, lowpass(tone, 2200), 0.22)
    return add_reverb(st, 0.3, 1.6)


def main():
    voice_path, out = sys.argv[1], Path(sys.argv[2])
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
    for name, s in stems.items():
        s /= max(1e-9, np.abs(s).max()) * 1.12
        E.write(out / f'stem-{name}.wav', s)
    L = {name: E.lufs(out / f'stem-{name}.wav')[0] for name in stems}
    lv = L['voice']
    rel = {'music': -19.0, 'sfx': -17.0, 'sting': -11.0}
    g = {name: 10 ** ((lv + rel[name] - L[name]) / 20) for name in rel}
    duck = np.zeros(N)
    for w in WORDS:
        duck[int(w['s'] * SR): int((w['e'] + 0.15) * SR)] = 1.0
    k = int(0.25 * SR)
    duck = np.convolve(duck, np.ones(k) / k, mode='same')
    mix = stems['voice'] + stems['music'] * g['music'] * (10 ** (-5.0 * duck / 20))[None] + stems['sfx'] * g['sfx'] + stems['sting'] * g['sting']
    rt = lowpass(rng.standard_normal(N), 700, 2) * 0.004
    mix = mix + np.stack([rt, np.roll(rt, 900)])
    mix = mix[:, : int(DUR * SR)]
    E.write(out / 'premaster.wav', mix / max(1e-9, np.abs(mix).max()) * 0.7)
    p1 = subprocess.run(['ffmpeg', '-nostats', '-i', str(out / 'premaster.wav'), '-af', 'loudnorm=I=-14:TP=-2.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = json.loads(p1[p1.rfind('{'): p1.rfind('}') + 1])
    flt = (f"loudnorm=I=-14:TP=-2.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
           f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(out / 'premaster.wav'), '-af', flt, '-ar', '48000', str(out / 'mix.wav')], check=True)
    i, tp = E.lufs(out / 'mix.wav')
    print(json.dumps({'stem_lufs': L, 'gains_db': {k2: round(20 * np.log10(v2), 2) for k2, v2 in g.items()}, 'final_I': i, 'final_TP': tp}, indent=1))


if __name__ == '__main__':
    main()
