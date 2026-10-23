"""Sound for "The Long Way Out" (studio/sun): a sunbeam's 170,000-year trip. No voice: music leads, foley marks events.

Everything is placed from studio/sun/timeline.json, the file the picture reads (captions, scene beats).
Stems: music (Rhodes, bass, kick, brushes, plucked arp; D minor, 120 BPM, bars on even seconds),
sfx (word plucks, beam, labels, fusion, bounces, counter ticks, bubbling, neutrino glints), sting (one impact, the far reveal).
Mix: music is the reference, sfx -4 dB, sting +2 dB; master -14 LUFS, true peak <= -1 dBTP. No loud swooshes.

Usage: python3 sfx/cues/sun.py <out_dir>
"""
import importlib.util
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from sfx import synth  # noqa: E402

_spec = importlib.util.spec_from_file_location('ep2cues', ROOT / 'sfx/cues/ep2.py')
E = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(E)
SR = E.SR
place, lowpass, bandpass, add_reverb, rhodes, bass, kick, brush, snare_brush, echo, hz, sx = (
    E.place, E.lowpass, E.bandpass, E.add_reverb, E.rhodes, E.bass, E.kick, E.brush, E.snare_brush, E.echo, E.hz, E.sx)

TL = json.loads((ROOT / 'studio/sun/timeline.json').read_text())
S = TL['scenes']
DUR = TL['meta']['dur']
N = int(SR * DUR) + SR
rng = np.random.default_rng(41)
E.rng = rng
BPM = 120.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
PENTA = ['D5', 'F5', 'G5', 'A5', 'C6', 'D6']

CH = {
    'Dm9': (['F3', 'A3', 'C4', 'E4'], 'D2'),
    'Bbmaj7': (['F3', 'A3', 'D4', 'A#3'], 'A#1'),
    'Fmaj7': (['E3', 'A3', 'C4', 'F4'], 'F1'),
    'C6': (['E3', 'G3', 'A3', 'C4'], 'C2'),
    'Gm9': (['F3', 'A#3', 'D4', 'A4'], 'G1'),
    'Am7': (['E3', 'G3', 'C4', 'A3'], 'A1'),
}
SECTIONS = [
    (0.0, 16.0, ['Dm9', 'Bbmaj7'], {'keys', 'arp'}),
    (16.0, 40.0, ['Dm9', 'Bbmaj7', 'Fmaj7', 'C6'], {'keys', 'bass', 'kick', 'shaker', 'arp'}),
    (40.0, 62.0, ['Gm9', 'Bbmaj7'], {'keys', 'arp', 'bass'}),
    (62.0, 75.0, ['Dm9'], {'keys', 'bass8'}),
    (75.0, 88.0, ['Dm9', 'Bbmaj7', 'Fmaj7', 'C6'], {'keys', 'bass8', 'kick', 'shaker', 'arp', 'snare80'}),
    (88.0, 99.0, ['Dm9'], {'keys'}),
    (99.0, 104.0, ['Dm9'], {'keys', 'bass', 'kick4'}),
    (104.0, 114.0, ['Bbmaj7', 'C6'], {'keys', 'bass8'}),
    (114.0, 122.0, ['Dm9', 'Bbmaj7', 'Fmaj7', 'C6'], {'keys', 'bass', 'kick', 'shaker', 'snare', 'arp'}),
    (122.0, 130.0, ['Gm9', 'Bbmaj7'], {'keys', 'arp'}),
    (130.0, 152.0, ['Dm9', 'Am7'], {'keys', 'bass', 'kickhalf', 'shaker'}),
    (152.0, 160.0, ['Fmaj7', 'C6', 'Dm9', 'Bbmaj7'], {'keys', 'bass', 'kick', 'shaker', 'snare', 'arp'}),
    (160.0, 172.0, ['Bbmaj7', 'Fmaj7'], {'keys', 'arp', 'bass', 'kick'}),
    (172.0, 181.5, ['Dm9', 'Bbmaj7'], {'keys', 'arp'}),
]


def pluck(f, dur, vel):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.05) + 0.15 * np.sin(6 * np.pi * f * t) * np.exp(-t / 0.03)
    return lowpass(x * np.exp(-t / 0.25) * (1 - np.exp(-t / 0.002)) * vel, 5000)


def air(dur, f0, f1, gain=0.3):
    """soft band-passed air that rises or falls; quiet by design"""
    n = int(dur * SR)
    return synth.bandnoise(n, lambda k: f0 + (f1 - f0) * k / n) * np.hanning(n) * gain


def build_music():
    st = np.zeros((2, N))
    ar = np.zeros((2, N))
    for (t0, t1, chords, parts) in SECTIONS:
        b = int(math.ceil(t0 / BAR - 1e-6))
        ci = 0
        while b * BAR < t1 - 1e-6:
            tb = b * BAR
            voicing, root = CH[chords[ci % len(chords)]]
            if 'keys' in parts:
                for hit, vel in ((0.0, 0.42), (2.5 * BEAT, 0.26)):
                    if tb + hit < t1:
                        for k, nm in enumerate(voicing):
                            place(st, tb + hit + k * 0.012, rhodes(hz(nm), 2.4, vel), 0.15, pan=-0.3 + k * 0.2)
            if 'arp' in parts:
                for e in range(8):
                    te = tb + e * BEAT / 2
                    if te < t1:
                        nm = voicing[(e * 3) % 4].replace('3', '5').replace('4', '5')
                        place(ar, te, pluck(hz(nm), 0.4, 0.5 if e % 2 else 0.72), 0.12, pan=0.45 if e % 2 else -0.45)
            if 'bass' in parts:
                for hit in (0.0, 1.5 * BEAT, 2.5 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, bass(hz(root), 0.7, 0.45), 1.0)
            if 'bass8' in parts:
                for e in range(8):
                    if tb + e * BEAT / 2 < t1:
                        place(st, tb + e * BEAT / 2, bass(hz(root), 0.22, 0.4 if e % 2 else 0.5), 1.0)
            kicks = {'kick': (0, 2), 'kick4': (0, 1, 2, 3), 'kickhalf': (0,)}
            for key, beats in kicks.items():
                if key in parts:
                    for bt in beats:
                        if tb + bt * BEAT < t1:
                            place(st, tb + bt * BEAT, kick(0.55), 1.0)
            if 'snare' in parts or ('snare80' in parts and tb >= 80):
                for hit in (BEAT, 3 * BEAT):
                    if tb + hit < t1:
                        place(st, tb + hit, snare_brush(0.22), 1.0, pan=0.1)
            if 'shaker' in parts:
                for e in range(8):
                    if tb + e * BEAT / 2 < t1:
                        place(st, tb + e * BEAT / 2, brush(0.08 if e % 2 else 0.13), 1.0, pan=0.3)
            b += 1
            ci += 1
    # the last chord rings out under the end card
    for k, nm in enumerate(CH['Fmaj7'][0] + ['A4', 'C5']):
        place(st, S['outro']['card'] + k * 0.03, rhodes(hz(nm), 4.4, 0.36), 0.16, pan=-0.4 + k * 0.16)
    place(st, S['outro']['card'], bass(hz('F1'), 3.5, 0.4), 1.0)
    # the hook's swell into "170,000"
    place(st, S['hook']['dive'] - 2.0, air(3.0, 120, 900, 0.5), 0.25)
    st = st + echo(ar, delay=0.75 * BEAT, fb=0.3)
    st = add_reverb(st, 0.2, 1.8)
    t = np.arange(N) / SR
    fade = np.clip(t / 0.05, 0, 1) * np.clip((DUR + 0.15 - t) / 0.75, 0, 1)
    return st * fade[None]


def words(cap):
    """(time, index) of each word landing, following the per-character stagger in captions.js"""
    raw = cap['text'].replace('*', '').replace('|', ' ')
    stag = 0.03 if cap['style'] == 'pop' else (0.012 if cap['style'] == 'kicker' else 0.022)
    out, gi = [], 0
    for wi, w in enumerate(raw.split(' ')):
        out.append((cap['t0'] + gi * stag + 0.05, wi))
        gi += len(w)
    return out


def walk_times():
    T = [89.0, 94.6, 96.1, 97.4, 98.5] + [99 + k * 0.5 for k in range(10)]
    i = 15
    while True:
        t = 104 + math.log(1 + (i - 15) * 0.62 / 2) / 0.62
        if t > 112:
            break
        T.append(t)
        i += 1
    return T


def build_sfx():
    st = np.zeros((2, N))
    for cap in TL['captions']:
        for (tw, wi) in words(cap):
            if 0 <= tw < DUR:
                g = 0.11 if cap['style'] in ('note', 'kicker') else 0.15
                place(st, tw, pluck(hz(PENTA[wi % len(PENTA)]), 0.35, 0.5), g, pan=-0.4 + 0.8 * ((wi % 5) / 4))
        if cap['style'] == 'pop':
            E.thud(st, cap['t0'], 0.25, 0.0, f=140)
    h = S['hook']
    E.pencil(st, h['strike'], 0.35, 0.3, 0.0)
    E.thud(st, h['dive'] + 0.15, 0.45, 0.0, f=70)
    for i in range(7):
        E.pop_(st, h['dive'] + 0.1 + i * 0.045, 500 + i * 60, 900 + i * 60, 0.08, -0.5 + i / 6)
    place(st, h['title'] + 0.1, sx(synth.chime([hz('D5'), hz('A5'), hz('F6')], 2.2, 0.8)), 0.16, 0.0)
    # flashes between worlds: a soft shimmer plus a low bump
    for tf in (16.0, 62.0, 88.0, 130.0, S['conv']['skim'] - 0.55, S['escape']['breach'], S['escape']['land']):
        place(st, tf - 0.5, air(0.8, 2000, 7000, 0.35), 0.2, 0.0)
        E.thud(st, tf, 0.3, 0.0, f=80)
    # the beam lands on Earth
    lg = S['leg']
    place(st, lg['arrive'] - 1.4, air(1.5, 300, 2400, 0.4), 0.18, 0.4)
    place(st, lg['arrive'], sx(synth.blip(hz('A5'), 0.6, 0.2)), 0.2, 0.0)
    # passing the distance signs (camera distance matches each sign; same curve as the picture)
    def fd(t):
        u = min(1, max(0, (t - 21.6) / 12.0))
        u = 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2
        return math.exp(math.log(22.16) + (math.log(2.75) - math.log(22.16)) * u)
    for D in (15, 8, 3.7):
        tt = next(t / 100 for t in range(2160, 3360) if fd(t / 100) <= D)
        place(st, tt - 0.4, air(0.7, 600, 1800, 0.3), 0.14, -0.6)
        place(st, tt - 0.3, sx(synth.blip(hz('D6'), 0.4, 0.12)), 0.08, -0.4)
    # labels on the cutaway
    for k, lb in enumerate(TL['labels']):
        E.pop_(st, lb['t0'], 500 + 80 * k, 1000 + 80 * k, 0.16, -0.3 if lb['lx'] < 960 else 0.3)
    place(st, S['inside']['open'], air(3.0, 200, 1200, 0.4), 0.2, 0.0)
    place(st, S['inside']['push'] + 1.5, air(4.0, 150, 3000, 0.45), 0.2, 0.0)
    # fusion
    c = S['core']
    for i in range(4):
        place(st, c['converge'] + i * 0.12, sx(synth.blip(hz(PENTA[i]) / 2, 0.5, 0.2)), 0.08, -0.4 + i * 0.27)
    E.pop_(st, c['pair'], 400, 900, 0.22, -0.3)
    E.pop_(st, c['pair'] + 0.06, 420, 950, 0.22, 0.3)
    E.thud(st, c['merge'], 0.5, 0.0, f=90)
    place(st, c['merge'], sx(synth.chime([hz('D5'), hz('F5'), hz('A5')], 1.6, 0.6)), 0.14, 0.0)
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    zap = np.sin(2 * np.pi * np.cumsum(1800 - 1200 * tt / 0.6) / SR) * np.exp(-tt / 0.18)
    place(st, c['flash'], lowpass(zap, 6000), 0.12, -0.4)
    for i in range(160):
        tz = c['zoom'] + rng.random() * 12.5
        E.tick(st, tz, 0.03 + 0.05 * rng.random(), rng.uniform(-0.8, 0.8))
    # the random walk: every bounce you can see
    WT = walk_times()
    place(st, WT[0], sx(synth.blip(hz('D6'), 0.8, 0.3)), 0.1, -0.3)
    for i, tb in enumerate(WT[1:], 1):
        if i < 15:
            place(st, tb, sx(synth.click(2400 - 60 * i, 0.05)), 0.22, -0.5 + (i % 5) / 4)
            place(st, tb, pluck(hz(PENTA[i % 6]), 0.3, 0.6), 0.1, 0.0)
        else:
            E.tick(st, tb, 0.06 * min(1.0, 8 / (i - 6)), rng.uniform(-0.7, 0.7))
    place(st, S['walk']['pull'], air(10.0, 100, 2500, 0.5), 0.24, 0.0)
    # the years roll
    tt, k = 114.6, 0
    while tt < 119.6:
        E.tick(st, tt, 0.09, 0.2)
        k += 1
        tt += 0.035 + 0.3 * ((tt - 114.6) / 5.0) ** 2.2
    E.thud(st, 119.6, 0.35, 0.0, f=110)
    # boiling plasma: low pops
    for i in range(240):
        tp = 130.4 + rng.random() * 14
        E.pop_(st, tp, 120 + 140 * rng.random(), 260 + 200 * rng.random(), 0.06, rng.uniform(-0.8, 0.8))
    place(st, S['conv']['rise'], air(4.6, 120, 1600, 0.4), 0.2, 0.0)
    # out and away
    e = S['escape']
    place(st, e['breach'], air(2.0, 400, 3000, 0.35), 0.18, 0.0)
    place(st, 156.2, air(3.8, 200, 4000, 0.45), 0.2, 0.0)
    place(st, e['land'], sx(synth.chime([hz('F5'), hz('A5'), hz('C6'), hz('E6')], 2.4, 0.9)), 0.17, 0.0)
    for i in range(3):
        E.pop_(st, e['land'] + 0.3 + i * 0.08, 600 + 100 * i, 1200 + 100 * i, 0.16, 0.2 + i * 0.1)
    # neutrinos: faint glassy glints, passing straight through
    for i in range(140):
        tg = e['ghost'] + rng.random() * 8.6
        f = 3000 + 3000 * rng.random()
        place(st, tg, sx(synth.blip(f, 0.12, 0.03)), 0.025, rng.uniform(-0.9, 0.9))
    # end card letters
    o = S['outro']
    for li in range(2):
        for i in range(7):
            E.pop_(st, o['card'] + li * 0.2 + i * 0.055 + 0.15, 500 + 40 * i, 900 + 40 * i, 0.07, -0.5 + i / 6)
    return add_reverb(st, 0.12, 0.8)


def build_sting():
    st = np.zeros((2, N))
    place(st, 114.4, sx(synth.impact(1.6)), 0.8)
    return add_reverb(st, 0.3, 1.8)


def main():
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    stems = {'music': build_music(), 'sfx': build_sfx(), 'sting': build_sting()}
    for name, s in stems.items():
        s /= max(1e-9, np.abs(s).max()) * 1.12
        E.write(out / f'stem-{name}.wav', s)
    L = {name: E.lufs(out / f'stem-{name}.wav')[0] for name in stems}
    rel = {'music': 0.0, 'sfx': -4.0, 'sting': 2.0}
    g = {name: 10 ** ((L['music'] + rel[name] - L[name]) / 20) for name in rel}
    mix = sum(stems[n] * g[n] for n in stems)[:, : int(DUR * SR)]
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
