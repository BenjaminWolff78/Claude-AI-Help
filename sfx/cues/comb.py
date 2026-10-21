"""Sound for "Honeycomb" (CombVideo): the bees' hexagon and the 2,000-year proof. No voice: music leads, foley marks every beat.

Everything is placed from the voice's word timings (src/snap/words.json), the same file the picture reads.
Stems: music (Rhodes, bass, brushes, kalimba; key of C, 96 BPM), sfx (foley from things on screen:
calculator keys, the print head, scissors, paper, flaps, coins), sting (one, on the pivot word "Unless").
Mix targets relative to the voice: music -19 dB and ducked a further 5 dB while the voice talks,
SFX -17 dB, sting -11 dB; master -14 LUFS, true peak <= -1 dBTP.

Usage: python3 sfx/cues/comb.py <out_dir>
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

DUR = 53.4
N = int(SR * DUR) + SR
rng = np.random.default_rng(31)
E.rng = rng
T = dict(hook1=0.15, hook2=2.85, s2=6.0, bc=6.4, roll=8.7, hales=10.4, s3=12.6, floor1=12.9, floor2=14.5, s4=18.0, gaps=19.5, waste=20.6,
         s5=22.2, three=22.6, tiles=23.7, s6=28.2, area=28.4, unroll=30.0, s7=36.0, wins=36.2, s8=40.2, curvy=40.4, longer=42.4, proof=43.6,
         s9=47.0, wax=47.2, build=49.8, loop=51.6)
# word landings (same text and stagger as the picture: 0.07 s per word)
PHRASES = [(-0.25, 'Bees solved a math problem.'), (T['hook2'], 'Humans needed over 2,000 years to prove it.'),
           (T['bc'] + 0.25, 'A Roman scholar, Varro, writes: the hexagon holds the most.'), (T['hales'] + 0.1, 'Thomas Hales finally proves it.'),
           (T['floor1'], 'Split a floor into equal rooms,'), (T['floor2'], 'with the least wall.'), (T['s4'] + 0.15, 'Circles?'),
           (T['gaps'], 'They leave gaps:'), (T['three'], 'Only 3 regular shapes fit with no gaps.'), (T['area'], 'Give every room the same area.'),
           (T['unroll'] + 1.8, 'Now unroll the walls.'), (T['wins'], 'The hexagon uses 7% less wall than the square.'),
           (T['curvy'], 'What about curvy walls?'), (T['longer'], 'Longer.'), (T['proof'], 'In 1999, Hales proved it: nothing beats the hexagon.'),
           (T['wax'], 'Less wall means less wax.'), (T['build'], 'Bees just build it.')]
PENTA = ['A4', 'C5', 'D5', 'E5', 'G5', 'A5']

# ------------------------------------------------------------------ music: A minor pentatonic, 100 BPM
CH = {
    'Am9': (['E3', 'G3', 'B3', 'C4'], 'A1'),
    'Fmaj7': (['E3', 'F3', 'A3', 'C4'], 'F1'),
    'C6': (['E3', 'G3', 'A3', 'C4'], 'C2'),
    'G6': (['D3', 'G3', 'B3', 'E4'], 'G1'),
    'Dm9': (['F3', 'A3', 'C4', 'E4'], 'D2'),
}
BPM = 100.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
SECTIONS = [
    (0.0, T['s2'], ['Am9', 'Fmaj7'], {'keys', 'bass', 'arp'}),
    (T['s2'], T['s3'], ['C6', 'G6'], {'keys', 'arp'}),
    (T['s3'], T['s5'], ['Am9', 'Fmaj7', 'C6', 'G6'], {'keys', 'bass', 'shaker', 'kick', 'arp'}),
    (T['s5'], T['s6'], ['Fmaj7', 'G6'], {'keys', 'bass', 'shaker', 'kick', 'snare', 'arp'}),
    (T['s6'], T['s8'], ['Am9', 'Dm9', 'Fmaj7', 'G6'], {'keys', 'bass', 'shaker', 'kick', 'snare', 'arp'}),
    (T['s8'], T['proof'] - 0.2, ['Dm9'], {'keys'}),
    (T['proof'] + 1.0, T['loop'], ['Fmaj7', 'G6', 'Am9', 'C6'], {'keys', 'bass', 'shaker', 'kick', 'snare', 'arp'}),
    (T['loop'], DUR, ['Am9'], {'keys', 'arp'}),
]


def pluck(f, dur, vel):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.05) + 0.15 * np.sin(6 * np.pi * f * t) * np.exp(-t / 0.03)
    return lowpass(x * np.exp(-t / 0.25) * (1 - np.exp(-t / 0.002)) * vel, 5000)


def build_music():
    st = np.zeros((2, N))
    ar = np.zeros((2, N))
    for (t0, t1, chords, parts) in SECTIONS:
        b = int(np.ceil(t0 / BAR - 1e-6))
        ci = 0
        while b * BAR < t1:
            tb = b * BAR
            name = chords[ci % len(chords)]
            voicing, root = CH[name]
            if 'keys' in parts:
                for hit, vel in ((0.0, 0.42), (2.5 * BEAT, 0.28)):
                    if tb + hit < t1:
                        for k, nm in enumerate(voicing):
                            place(st, tb + hit + k * 0.01, rhodes(hz(nm), 2.2, vel), 0.15, pan=-0.3 + k * 0.2)
            if 'arp' in parts:
                for e in range(8):
                    te = tb + e * BEAT / 2
                    if te < t1:
                        nm = voicing[(e * 3) % 4].replace('3', '5').replace('4', '5')
                        place(ar, te, pluck(hz(nm), 0.4, 0.5 if e % 2 else 0.7), 0.12, pan=0.4 if e % 2 else -0.4)
            if 'bass' in parts:
                for hit in (0.0, 1.5 * BEAT, 2.5 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, bass(hz(root), 0.7, 0.45), 1.0)
            if 'kick' in parts:
                for hit in (0.0, 2.0 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, kick(0.55), 1.0)
            if 'snare' in parts:
                for hit in (BEAT, 3 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, snare_brush(0.22), 1.0, pan=0.1)
            if 'shaker' in parts:
                for e in range(8):
                    te = tb + e * BEAT / 2
                    if te < t1:
                        place(st, te, brush(0.08 if e % 2 else 0.13), 1.0, pan=0.3)
            b += 1
            ci += 1
    st = st + echo(ar, delay=0.75 * BEAT, fb=0.3)
    st = add_reverb(st, 0.18)
    t = np.arange(N) / SR
    return st * np.clip(t / 0.05, 0, 1)[None]


def buzz(dst, t0, t1, gain=0.06, pan=0.0):
    n = int((t1 - t0) * SR)
    tt = np.arange(n) / SR
    f = 210 + 12 * np.sin(2 * np.pi * 0.7 * tt)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (2 * ((ph / (2 * np.pi)) % 1) - 1) * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * tt))
    x = bandpass(x, 300, 3000) * np.clip(tt / 0.3, 0, 1) * np.clip((tt[-1] - tt) / 0.3, 0, 1)
    place(dst, t0, x, gain, pan)


def build_sfx():
    st = np.zeros((2, N))
    for (t0, text) in PHRASES:
        for i, w in enumerate(text.split()):
            tw = t0 + i * 0.07 + 0.04
            if tw >= 0:
                place(st, tw, pluck(hz(PENTA[i % len(PENTA)]), 0.35, 0.5), 0.16, pan=-0.4 + 0.8 * ((i % 5) / 4))
    # the comb grows ring by ring
    for ring in range(10):
        place(st, max(0.0, -1.0 + ring * 0.09), sx(synth.blip(hz(PENTA[ring % 6]) / 2, 0.3, 0.1)), 0.06, 0.0)
    buzz(st, 0.0, 5.6, 0.07, 0.0)
    buzz(st, T['floor2'] - 0.2, T['s4'] + 0.3, 0.05, 0.3)
    buzz(st, T['wax'] - 0.2, T['loop'] + 0.6, 0.06, -0.2)
    # portals: a soft rising air into each cell (no loud swoosh)
    for tp in (T['s2'] - 0.35, T['s3'] - 0.35, T['s6'] - 0.35, T['s8'] - 0.35, T['s9'] - 0.35):
        place(st, tp, synth.bandnoise(int(0.8 * SR), lambda k: 400 + 2500 * k / (0.8 * SR)) * np.hanning(int(0.8 * SR)) * 0.35, 0.2, 0.0)
    # the years roll: ticks speeding up
    k = 0
    tt = T['roll']
    while tt < T['hales'] - 0.1:
        E.tick(st, tt, 0.08, 0.3)
        k += 1
        tt += max(0.035, 0.18 * (1 - k / 30))
    E.thud(st, T['hales'], 0.4, 0.0, f=120)
    # the floor: walls drawn
    for i in range(1, 4):
        E.pencil(st, T['floor2'] + i * 0.18, 0.4, 0.12, -0.2)
        E.pencil(st, T['floor2'] + 0.6 + i * 0.18, 0.4, 0.12, 0.2)
    # circles drop in, the gaps show, the waste
    for i in range(40):
        E.pop_(st, T['s4'] + 0.1 + rng.random() * 0.7 + 0.3, 400 + rng.random() * 300, 800, 0.05, rng.uniform(-0.6, 0.6))
    E.thud(st, T['gaps'], 0.3, 0.0, f=90)
    # circles grow into hexagons
    place(st, T['s5'] + 0.1, synth.bandnoise(int(1.0 * SR), lambda k: 300 + 1200 * k / SR) * np.hanning(int(1.0 * SR)) * 0.3, 0.2, 0.0)
    for i in range(3):
        for j in range(12):
            E.tick(st, T['tiles'] + i * 0.35 + j * 0.03, 0.05, -0.5 + i * 0.5)
    # the walls unroll
    for i in range(3):
        k0 = T['unroll'] + i * 0.45
        for j in range(6):
            place(st, k0 + j * 0.2, pluck(hz(PENTA[j]), 0.3, 0.6), 0.1, -0.4 + i * 0.4)
    place(st, T['wins'] + 0.5, sx(synth.chime([hz('A5'), hz('C6'), hz('E6')], 1.4, 0.5)), 0.12, 0.2)
    # curvy walls: a wobble; the proof: the one impact
    n = int(2.0 * SR)
    tt2 = np.arange(n) / SR
    wob = np.sin(2 * np.pi * (220 + 30 * np.sin(2 * np.pi * 5 * tt2)) * tt2) * np.hanning(n)
    place(st, T['curvy'] + 0.4, lowpass(wob, 1500), 0.12, 0.0)
    # honey floods the comb
    E.pour(st, T['wax'] + 0.4, 2.6, 0.18, -0.3)
    # back into the first cell
    place(st, T['loop'], synth.bandnoise(int((DUR - T['loop']) * SR), lambda k: 500 + 3000 * k / ((DUR - T['loop']) * SR)) * np.hanning(int((DUR - T['loop']) * SR)) * 0.3, 0.2, 0.0)
    return add_reverb(st, 0.1, 0.7)


def build_sting():
    st = np.zeros((2, N))
    place(st, T['proof'], sx(synth.impact(1.3)), 0.8)
    return add_reverb(st, 0.3, 1.5)


def main():
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    stems = {'music': build_music(), 'sfx': build_sfx(), 'sting': build_sting()}
    for name, s in stems.items():
        s /= max(1e-9, np.abs(s).max()) * 1.12
        E.write(out / f'stem-{name}.wav', s)
    L = {name: E.lufs(out / f'stem-{name}.wav')[0] for name in stems}
    # no narration: the music is the reference; foley sits 4 dB under it, the one impact 2 dB over
    rel = {'music': 0.0, 'sfx': -4.0, 'sting': 2.0}
    g = {name: 10 ** ((L['music'] + rel[name] - L[name]) / 20) for name in rel}
    mix = sum(stems[n] * g[n] for n in stems)
    mix = mix[:, : int(DUR * SR)]
    # loop: fade the last 40 ms into the first so the seam doesn't click
    E.write(out / 'premaster.wav', mix / max(1e-9, np.abs(mix).max()) * 0.7)
    p1 = subprocess.run(['ffmpeg', '-nostats', '-i', str(out / 'premaster.wav'), '-af', 'loudnorm=I=-14:TP=-2.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = json.loads(p1[p1.rfind('{'): p1.rfind('}') + 1])
    flt = (f"loudnorm=I=-14:TP=-2.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
           f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(out / 'premaster.wav'), '-af', flt, '-ar', '48000', str(out / 'mix.wav')], check=True)
    i, tp = E.lufs(out / 'mix.wav')
    print(json.dumps({'stem_lufs': L, 'final_I': i, 'final_TP': tp}, indent=1))


if __name__ == '__main__':
    main()
