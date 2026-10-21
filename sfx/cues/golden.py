"""Sound for "One Rule" (GoldenVideo): the golden angle in a sunflower. Music-led, no voice.

Everything is placed from the voice's word timings (src/snap/words.json), the same file the picture reads.
Stems: music (Rhodes, bass, brushes, kalimba; key of C, 96 BPM), sfx (foley from things on screen:
calculator keys, the print head, scissors, paper, flaps, coins), sting (one, on the pivot word "Unless").
Mix targets relative to the voice: music -19 dB and ducked a further 5 dB while the voice talks,
SFX -17 dB, sting -11 dB; master -14 LUFS, true peak <= -1 dBTP.

Usage: python3 sfx/cues/golden.py <out_dir>
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

DUR = 52.0
N = int(SR * DUR) + SR
rng = np.random.default_rng(31)
E.rng = rng
BPM = 92.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
CH = {
    'Dmaj9': (['F#3', 'A3', 'C#4', 'E4'], 'D2'),
    'Bm7': (['D3', 'F#3', 'A3', 'C#4'], 'B1'),
    'Gmaj7': (['D3', 'F#3', 'G3', 'B3'], 'G1'),
    'A6': (['C#3', 'E3', 'F#3', 'A3'], 'A1'),
    'Em9': (['D3', 'F#3', 'G3', 'B3'], 'E2'),
}
PENTA = ['D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'A5', 'B5', 'D6']
SECTIONS = [
    (0.0, 7.6, ['Dmaj9', 'Gmaj7'], {'keys', 'bass'}),
    (8.6, 14.2, ['Bm7', 'Gmaj7'], {'keys'}),
    (14.2, 25.0, ['Em9', 'A6', 'Bm7', 'Gmaj7'], {'keys', 'bass', 'shaker'}),
    (25.0, 41.4, ['Dmaj9', 'Bm7', 'Gmaj7', 'A6'], {'keys', 'bass', 'shaker', 'kick', 'snare'}),
    (41.4, 49.4, ['Gmaj7', 'A6', 'Dmaj9', 'Dmaj9'], {'keys', 'bass', 'shaker', 'kick'}),
    (49.4, 52.0, ['Dmaj9'], {'keys'}),
]


def build_music():
    st = np.zeros((2, N))
    for (t0, t1, chords, parts) in SECTIONS:
        b = int(np.ceil(t0 / BAR - 1e-6))
        ci = 0
        while b * BAR < t1:
            tb = b * BAR
            voicing, root = CH[chords[ci % len(chords)]]
            for hit, vel in ((0.0, 0.42), (2.5 * BEAT, 0.28)):
                if tb + hit < t1 and 'keys' in parts:
                    for k, nm in enumerate(voicing):
                        place(st, tb + hit + k * 0.012, rhodes(hz(nm), 2.4, vel), 0.15, pan=-0.3 + k * 0.2)
            if 'bass' in parts:
                for hit in (0.0, 2.5 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, bass(hz(root), 1.2, 0.4), 1.0)
            if 'kick' in parts:
                for hit in (0.0, 2.5 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, kick(0.45), 1.0)
            if 'snare' in parts:
                for hit in (BEAT, 3 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, snare_brush(0.18), 1.0, pan=0.1)
            if 'shaker' in parts:
                for e in range(8):
                    te = tb + e * BEAT / 2
                    if te < t1:
                        place(st, te, brush(0.07 if e % 2 else 0.12), 1.0, pan=0.3)
            b += 1
            ci += 1
    pl, pr = synth.pad(DUR, [(0.0, [hz('D3'), hz('A3'), hz('E4')]), (14.2, [hz('E3'), hz('B3'), hz('F#4')]), (25.0, [hz('D3'), hz('A3'), hz('F#4')]), (41.4, [hz('G2'), hz('D3'), hz('B3')]), (46.6, [hz('D3'), hz('A3'), hz('F#4')])])
    place(st, 0.0, E.arr(pl), 0.18, pan=-0.4)
    place(st, 0.0, E.arr(pr), 0.18, pan=0.4)
    st = add_reverb(st, 0.22)
    t = np.arange(N) / SR
    env = np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 0.4, 0.35, 1)
    return st * env[None]


def tine(dst, t, nm, gain=0.2, pan=0.0, dur=1.0):
    place(dst, t, kalimba(hz(nm), dur, rng.uniform(0.8, 1.0)), gain, pan)


def shimmer(dst, t0, t1, dens0, dens1, gain=0.05):
    """many tiny seed ticks, density ramping"""
    t = t0
    while t < t1:
        k = (t - t0) / max(1e-6, t1 - t0)
        place(dst, t, sx(synth.click(rng.uniform(3000, 7000), 0.008)), gain * rng.uniform(0.4, 1.0), rng.uniform(-0.7, 0.7))
        t += 1.0 / lerp_(dens0, dens1, k)


def lerp_(a, b, k):
    return a + (b - a) * k


def build_sfx():
    st = np.zeros((2, N))
    # the opening growth: one seed, then hundreds
    tine(st, 0.0, 'D5', 0.3, 0.2, 1.4)
    shimmer(st, 0.05, 3.2, 6, 260, 0.05)
    E.paper(st, 3.0, 1.4, 0.18, -0.3)
    place(st, 3.2, sx(synth.chime([hz('D5'), hz('F#5'), hz('A5')], 1.8, 0.6)), 0.08, 0.3)
    E.paper(st, 7.0, 0.6, 0.12, 0.3)
    shimmer(st, 7.7, 8.6, 200, 20, 0.04)
    # step by step: turn (ratchet) and place (a tine)
    for i, s in enumerate([8.8, 9.7, 10.6, 11.6]):
        for k in range(3):
            place(st, s + k * 0.06, sx(synth.click(1700, 0.02)), 0.12, -0.3)
        tine(st, s + 0.25, PENTA[i * 2], 0.25, 0.3)
        tine(st, s + 0.5, PENTA[i * 2 + 1], 0.2, 0.3)
    shimmer(st, 12.2, 14.2, 10, 300, 0.045)
    # the sweep: a tone that follows the angle, a soft click at each hold
    holds = [(16.0, 17.5, 90), (18.3, 19.7, 120), (20.6, 22.0, 144), (22.9, 24.2, 137), (25.0, 26.6, 137.5)]
    for (a, b, ang) in holds[:-1]:
        place(st, a, sx(synth.click(900, 0.04)), 0.2, 0.0)
        tine(st, a + 0.02, 'A4' if ang != 137 else 'B4', 0.16, -0.2)
    place(st, 25.0, sx(synth.chime([hz('D5'), hz('F#5'), hz('A5'), hz('D6')], 2.2, 0.8)), 0.2, 0.0)
    n = int(11.0 * SR)
    tt = np.arange(n) / SR
    f = 220 + 2.2 * np.interp(tt + 15.0, [15.0, 16.0, 17.5, 18.3, 19.7, 20.6, 22.0, 22.9, 24.2, 25.0, 26.0], [137.5, 90, 90, 120, 120, 144, 144, 137, 137, 137.5, 137.5])
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + 0.3 * np.sin(2 * ph)) * 0.12 * np.clip(tt / 0.8, 0, 1) * np.clip((n / SR - tt) / 1.0, 0, 1)
    place(st, 15.0, lowpass(tone, 1500), 1.0, 0.0)
    # the golden angle
    for k, nm in enumerate(['D4', 'F#4', 'A4', 'D5']):
        tine(st, 26.7 + k * 0.12, nm, 0.2, -0.3 + k * 0.2)
    # 34 and 55: two arpeggios as the spirals draw
    for k in range(10):
        tine(st, 34.3 + k * 0.14, PENTA[k % len(PENTA)], 0.12, -0.5)
    for k in range(10):
        tine(st, 36.5 + k * 0.14, PENTA[(len(PENTA) - 1 - k) % len(PENTA)], 0.12, 0.5)
    # Fibonacci: a note per number
    for i in range(11):
        tine(st, 38.6 + i * 0.12, PENTA[i], 0.16, -0.6 + i * 0.12, 0.8)
    # pinecones: woody clicks while the scales turn
    for k in range(18):
        E.thud(st, 41.6 + k * 0.06, 0.06, rng.uniform(-0.5, 0.5), f=rng.uniform(300, 500))
    # finale: petals open again, then everything folds back into one seed
    E.paper(st, 46.4, 1.4, 0.18, -0.3)
    place(st, 46.8, sx(synth.chime([hz('D5'), hz('A5'), hz('F#6')], 1.8, 0.6)), 0.1, 0.2)
    shimmer(st, 49.4, 51.6, 260, 8, 0.045)
    tine(st, 51.7, 'D5', 0.28, 0.2, 1.2)
    return add_reverb(st, 0.12, 0.8)


def main():
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    music = build_music()
    sfx_ = build_sfx()
    for s in (music, sfx_):
        s /= max(1e-9, np.abs(s).max()) * 1.12
    E.write(out / 'stem-music.wav', music)
    E.write(out / 'stem-sfx.wav', sfx_)
    Lm = E.lufs(out / 'stem-music.wav')[0]
    Ls = E.lufs(out / 'stem-sfx.wav')[0]
    # no voice here: the music leads, the foley sits 6 dB under it
    g = 10 ** ((Lm - 6.0 - Ls) / 20)
    mix = (music + sfx_ * g)[:, : int(DUR * SR)]
    E.write(out / 'premaster.wav', mix / max(1e-9, np.abs(mix).max()) * 0.7)
    p1 = subprocess.run(['ffmpeg', '-nostats', '-i', str(out / 'premaster.wav'), '-af', 'loudnorm=I=-14:TP=-2.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = json.loads(p1[p1.rfind('{'): p1.rfind('}') + 1])
    flt = (f"loudnorm=I=-14:TP=-2.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
           f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(out / 'premaster.wav'), '-af', flt, '-ar', '48000', str(out / 'mix.wav')], check=True)
    print(json.dumps({'music_lufs': Lm, 'sfx_lufs': Ls, 'final': E.lufs(out / 'mix.wav')}))


if __name__ == '__main__':
    main()
