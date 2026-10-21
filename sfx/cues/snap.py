"""Sound for "Snap" (SnapVideo): why spaghetti breaks into three pieces, and the twist that stops it.

Everything is placed from the voice's word timings (src/snap/words.json), the same file the picture reads.
Stems: music (Rhodes, bass, brushes, kalimba; key of C, 96 BPM), sfx (foley from things on screen:
calculator keys, the print head, scissors, paper, flaps, coins), sting (one, on the pivot word "Unless").
Mix targets relative to the voice: music -19 dB and ducked a further 5 dB while the voice talks,
SFX -17 dB, sting -11 dB; master -14 LUFS, true peak <= -1 dBTP.

Usage: python3 sfx/cues/snap.py <voice.wav> <out_dir>
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

WORDS = json.load(open(ROOT / 'src/snap/words.json'))
DUR = 75.4
N = int(SR * DUR) + SR
rng = np.random.default_rng(23)
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
    'Fmaj7': (['E3', 'F3', 'A3', 'C4'], 'F1'),
    'Dm7': (['D3', 'F3', 'A3', 'C4'], 'D2'),
    'Bbmaj7': (['D3', 'F3', 'A3', 'A#3'], 'A#1'),
    'C7sus': (['F3', 'A#3', 'C4', 'D4'], 'C2'),
    'Gm7': (['F3', 'A#3', 'D4', 'G4'], 'G1'),
    'Am7': (['E3', 'G3', 'A3', 'C4'], 'A1'),
}
MOTIF = {
    'Fmaj7': [(0.5, 'C5'), (1.0, 'A4'), (2.5, 'F5')],
    'Dm7': [(0.5, 'A4'), (1.5, 'D5')],
    'Bbmaj7': [(0.5, 'D5'), (1.0, 'F5'), (2.5, 'A4')],
    'C7sus': [(0.5, 'G4'), (1.5, 'C5'), (2.5, 'D5')],
    'Gm7': [(0.5, 'D5'), (1.5, 'A#4')],
    'Am7': [(0.5, 'E5'), (1.5, 'C5')],
}
BPM = 104.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
PIVOT = WT('crack')
VOICE_END = WORDS[-1]['e']


def pluck(f, dur, vel):
    """pizzicato-ish pluck: bright attack, quick body decay"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.05) + 0.2 * np.sin(6 * np.pi * f * t) * np.exp(-t / 0.03))
    return lowpass(x * np.exp(-t / 0.22) * (1 - np.exp(-t / 0.002)) * vel, 4500)


SECTIONS = [
    (0.0, WT('physicist'), ['Fmaj7', 'C7sus'], {'pluck', 'bass'}),
    (WT('physicist'), WT('heres'), ['Dm7', 'Bbmaj7'], {'keys', 'pluck'}),
    (WT('heres'), WT('cracks') - 0.3, ['Fmaj7', 'Am7', 'Bbmaj7', 'C7sus'], {'keys', 'bass', 'shaker', 'pluck'}),
    (WT('cracks') + 0.6, PIVOT - 0.5, ['Dm7'], {'keys'}),
    (PIVOT + 1.4, WT('their'), ['Bbmaj7', 'C7sus', 'Fmaj7', 'Dm7'], {'keys', 'bass', 'shaker', 'kick', 'pluck'}),
    (WT('their'), WT('breaks', 3) - 0.3, ['Gm7', 'C7sus'], {'keys', 'bass', 'shaker', 'pluck'}),
    (WT('two', 3) - 0.1, VOICE_END + 0.6, ['Fmaj7', 'Bbmaj7', 'C7sus', 'Fmaj7'], {'keys', 'bass', 'shaker', 'kick', 'snare', 'pluck'}),
]


def build_music():
    st = np.zeros((2, N))
    pl = np.zeros((2, N))
    for (t0, t1, chords, parts) in SECTIONS:
        b = int(np.ceil(t0 / BAR - 1e-6))
        ci = 0
        while b * BAR < t1:
            tb = b * BAR
            name = chords[ci % len(chords)]
            voicing, root = CH[name]
            if 'keys' in parts:
                for hit, vel in ((0.0, 0.45), (2.5 * BEAT, 0.3)):
                    th = tb + hit
                    if th < t1:
                        for k, nm in enumerate(voicing):
                            place(st, th + k * 0.01, rhodes(hz(nm), 2.0, vel), 0.15, pan=-0.25 + k * 0.17)
            if 'pluck' in parts:
                for hb, nm in MOTIF[name]:
                    th = tb + hb * BEAT
                    if th < t1 - 0.2:
                        place(pl, th, pluck(hz(nm), 0.7, rng.uniform(0.75, 0.95)), 0.22, pan=0.3 if hb < 1 else -0.25)
            if 'bass' in parts:
                for hit in (0.0, 1.5 * BEAT, 2.5 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, bass(hz(root), 0.6, 0.42), 1.0)
            if 'kick' in parts:
                for hit in (0.0, 2.0 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, kick(0.5), 1.0)
            if 'snare' in parts:
                for hit in (BEAT, 3 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, snare_brush(0.2), 1.0, pan=0.1)
            if 'shaker' in parts:
                for e in range(8):
                    te = tb + e * BEAT / 2
                    if te < t1:
                        place(st, te, brush(0.08 if e % 2 else 0.13), 1.0, pan=0.3)
            b += 1
            ci += 1
    st = st + echo(pl, delay=0.5 * BEAT)
    st = add_reverb(st, 0.18)
    t = np.arange(N) / SR
    env = np.clip(t / 0.1, 0, 1) * np.clip((VOICE_END + 0.6 - t) / 1.2, 0, 1)
    return st * env[None]


# ------------------------------------------------------------------ foley
def crack(dst, t, gain=0.5, pan=0.0, slow=1.0):
    """a dry stick of pasta snapping; slow > 1 stretches and lowers it (the slow-motion view)"""
    n = int(0.06 * slow * SR)
    tt = np.arange(n) / SR
    x = bandpass(rng.standard_normal(n), 1800 / slow, 9000 / slow) * np.exp(-tt / (0.008 * slow))
    x += 0.6 * np.sin(2 * np.pi * (3200 / slow) * tt) * np.exp(-tt / (0.01 * slow))
    place(dst, t, x, gain, pan)
    place(dst, t, sx(synth.click(int(2600 / slow), 0.02 * slow)), gain * 0.8, pan)


def ratchet(dst, t, gain=0.16, pan=0.0):
    place(dst, t, sx(synth.click(rng.uniform(1500, 1900), 0.025)), gain, pan)
    E.thud(dst, t, gain * 0.3, pan, f=240)


def build_sfx():
    st = np.zeros((2, N))
    # hook: the bend creaks, then it shatters
    E.pencil(st, 0.0, 1.9, 0.08, 0.0)
    tsn = WT('half', 1, 's', 0.02)
    crack(st, tsn, 0.8, 0.0)
    crack(st, tsn + 0.012, 0.5, -0.3)
    crack(st, tsn + 0.02, 0.5, 0.3)
    for i in range(4):
        E.tick(st, tsn + 0.5 + i * 0.07, 0.16, -0.6 + i * 0.4)
    for i, tk in enumerate([WT('three', 1, 's', -0.45), WT('three', 1, 's', -0.2), WT('three'), WT('more')]):
        E.pop_(st, tk, 500 + i * 120, 900 + i * 120, 0.2, -0.4 + i * 0.27)
    # the kitchen: lines drawn, a clock running all evening, pieces piling up
    E.pencil(st, WT('physicist') - 0.3, 1.2, 0.18, -0.2)
    for k in range(int((WT('trying', 1, 'e') - WT('once')) / 0.25)):
        E.tick(st, WT('once') + k * 0.25, 0.07, 0.5)
    for i in range(46):
        ti = WT('spent') + (WT('trying', 1, 'e') - WT('spent')) * (i / 45) ** 0.8
        crack(st, ti + 0.25, 0.08 * rng.uniform(0.6, 1.0), rng.uniform(-0.6, 0.2))
    E.pencil(st, WT('never'), 0.55, 0.3, 0.2)
    # the diagram
    E.pencil(st, 12.2, 0.9, 0.15, 0.0)
    E.pencil(st, WT('most'), 0.4, 0.25, 0.0)
    crack(st, WT('cracks'), 0.75, 0.0, slow=4.0)
    place(st, WT('wave'), synth.bandnoise(int(2.5 * SR), lambda k: 300 + 900 * k / (2.5 * SR)) * np.hanning(int(2.5 * SR)) * 0.4, 0.25, 0.0)
    E.pencil(st, WT('even'), 0.6, 0.2, 0.3)
    crack(st, WT('crack', 1, 's', 0.0), 0.9, -0.3, slow=4.0)
    crack(st, 33.8, 0.6, 0.4, slow=3.0)
    E.pop_(st, WT('three', 2), 600, 1000, 0.3, -0.2)
    # the timeline
    E.pencil(st, 34.2, 1.2, 0.18, 0.0)
    E.thud(st, WT('2005', 1, 's', 0.05), 0.3, 0.2, f=140)
    E.paper(st, WT('2005') - 0.1, 0.3, 0.25, 0.2)
    E.pencil(st, WT('seventeen'), 0.5, 0.2, -0.2)
    place(st, WT('ig', 1, 's', 0.05), sx(synth.chime([hz('F5'), hz('A5'), hz('C6')], 1.2, 0.45)), 0.1, 0.4)
    E.thud(st, WT('ig'), 0.25, 0.4, f=200)
    E.pop_(st, WT('2018'), 700, 1200, 0.22, 0.4)
    # the machine
    E.pencil(st, WT('mit') - 0.2, 1.3, 0.18, 0.0)
    n = int(2.0 * SR)
    tt = np.arange(n) / SR
    whir = (np.sign(np.sin(2 * np.pi * 180 * tt)) * 0.25 + bandpass(rng.standard_normal(n), 800, 4000)) * np.sin(np.pi * tt / 2.0) ** 0.6
    place(st, WT('million') - 0.2, lowpass(whir, 3000) * 0.35, 0.25, 0.5)
    for k in range(int((WT('turn', 1, 'e') - WT('twist')) / 0.11)):
        ratchet(st, WT('twist') + k * 0.11, 0.15, -0.5)
    E.pencil(st, WT('bend', 2), 1.2, 0.1, 0.0)
    crack(st, WT('breaks', 3), 0.75, 0.0, slow=4.0)
    place(st, WT('unwinds'), synth.bandnoise(int(1.4 * SR), lambda k: 2400 - 1600 * k / (1.4 * SR)) * np.hanning(int(1.4 * SR)) * 0.4, 0.2, 0.0)
    E.pop_(st, WT('two', 3), 500, 800, 0.25, -0.3)
    E.pop_(st, WT('pieces', 3), 600, 950, 0.25, 0.3)
    # the ending: hands come back, twist, snap, two pieces into the pot, a new stick
    for k in range(6):
        ratchet(st, WT('twist', 3) + k * 0.1, 0.1, 0.0)
    crack(st, WT('snap', 3, 's', 0.05), 0.8, 0.0)
    E.thud(st, WT('youll') + 0.4, 0.3, 0.0, f=180)
    place(st, WT('youll') + 0.45, sx(synth.chime([hz('A4'), hz('F5')], 0.9, 0.35)), 0.08, 0.0)
    E.paper(st, 73.9, 0.4, 0.2, 0.6)
    return add_reverb(st, 0.08, 0.6)


def build_sting():
    st = np.zeros((2, N))
    place(st, PIVOT, sx(synth.impact(1.2)), 0.8)
    n = int(1.8 * SR)
    tt = np.arange(n) / SR
    tone = sum(np.sin(2 * np.pi * hz(nm) * tt) for nm in ('D3', 'A3', 'D#4')) * np.exp(-tt / 0.6) * (1 - np.exp(-tt / 0.004))
    place(st, PIVOT, lowpass(tone, 2200), 0.2)
    return add_reverb(st, 0.3, 1.5)


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
