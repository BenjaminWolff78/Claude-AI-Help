"""Synthesised SFX for "They Blew Up Houses to Stop a Fire" (no loud swooshes, no ringing): writes into ../sfx/."""
import numpy as np, soundfile as sf, os
from scipy.signal import butter, sosfilt
SR = 48000; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sfx"); rng = np.random.default_rng(1666)
def tt(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=4): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def lp(x, hi, o=4): return sosfilt(butter(o, hi, "low", fs=SR, output="sos"), x)
def hp(x, lo, o=4): return sosfilt(butter(o, lo, "high", fs=SR, output="sos"), x)
def env(n, a, r):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))
def norm(x, peak=0.8): m = np.abs(x).max(); return x / m * peak if m > 0 else x
def save(name, x, stereo_w=0.25):
    x = norm(x); d = int(0.011 * SR); y = np.stack([x, np.concatenate([x[d:], np.zeros(d)]) * (1 - stereo_w) + x * stereo_w], 1)
    fade = np.ones(len(x)); k = min(len(x) // 4, int(0.02 * SR)); fade[-k:] = np.linspace(1, 0, k); y *= fade[:, None]
    sf.write(os.path.join(OUT, name + ".wav"), y, SR, subtype="PCM_24"); print(name, round(len(x) / SR, 2))
def pops(d, rate, lo=1200, hi=6000, amp=1.0):
    n = int(d * SR); x = np.zeros(n)
    for _ in range(int(d * rate)):
        i = rng.integers(0, n - 2000); L = rng.integers(60, 900); x[i:i + L] += rng.normal(0, 1, L) * np.exp(-np.arange(L) / (L / 4)) * rng.uniform(0.3, 1) * amp
    return bp(x, lo, hi)
# fire crackle: low roar bed + wood pops
d = 4.0; bed = lp(rng.normal(0, 1, int(d * SR)), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * tt(d)) ** 2); save("fire_crackle", 0.5 * bed / np.abs(bed).max() + pops(d, 26) * 0.9)
# big fire roar (the front grows): deep rumble swelling
d = 3.0; r = lp(rng.normal(0, 1, int(d * SR)), 260) * np.minimum(1, tt(d) / 1.2) * np.minimum(1, (d - tt(d)) / 0.8); save("fire_roar", r / np.abs(r).max() + 0.4 * pops(d, 14, 600, 3000))
# fire whoomp (the bakery flares up): a soft low thump of air, no hiss
d = 1.1; w = lp(rng.normal(0, 1, int(d * SR)), 320) * env(int(d * SR), 0.06, 0.28); save("fire_whoomp", w + 0.25 * pops(d, 10, 800, 3000) * env(int(d * SR), 0.01, 0.5))
# gunpowder boom: sub thump + cracking burst + debris rain
d = 3.2; n = int(d * SR); t = tt(d)
sub = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 9)) / SR) * env(n, 0.004, 0.45)
crack = bp(rng.normal(0, 1, n), 200, 2500) * env(n, 0.002, 0.12)
rum = lp(rng.normal(0, 1, n), 180) * env(n, 0.02, 0.9)
deb = pops(d, 50, 900, 5000) * np.clip((t - 0.25) / 0.2, 0, 1) * np.exp(-np.maximum(0, t - 0.4) / 0.7)
save("boom", 1.0 * sub + 0.55 * crack + 0.6 * rum / np.abs(rum).max() + 0.35 * deb)
# fuse sizzle: crackly hiss (band-limited, not bright)
d = 2.2; s = bp(rng.normal(0, 1, int(d * SR)), 1800, 5200) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 9 * tt(d)))) * 0.35 + pops(d, 60, 2000, 6000) * 0.7; save("fuse_sizzle", s)
# steam hiss (water on fire)
d = 1.6; save("steam_hiss", bp(rng.normal(0, 1, int(d * SR)), 1500, 5500) * env(int(d * SR), 0.03, 0.45) + 0.3 * pops(d, 30, 1500, 5000) * env(int(d * SR), 0.01, 0.3))
# timber collapse: creak + crashing thuds + debris
d = 2.4; n = int(d * SR); t = tt(d); x = np.zeros(n)
creak = np.sin(2 * np.pi * np.cumsum(140 + 60 * np.sin(2 * np.pi * 3 * t)) / SR) * (t < 0.6) * np.minimum(1, t / 0.1) * 0.25
for k, t0 in enumerate([0.55, 0.68, 0.8, 1.0, 1.25]):
    i = int(t0 * SR); L = n - i; tk = np.arange(L) / SR; x[i:] += (np.sin(2 * np.pi * np.cumsum(55 + 40 * np.exp(-tk * 12)) / SR) * np.exp(-tk / 0.18) + 0.5 * lp(rng.normal(0, 1, L), 900) * np.exp(-tk / 0.12)) * (1 - 0.12 * k)
save("collapse", creak + x / np.abs(x).max() + 0.4 * pops(d, 40, 700, 4000) * np.clip((t - 0.6) / 0.1, 0, 1) * np.exp(-np.maximum(0, t - 0.7) / 0.6))
# barrels rolling on cobbles: low rumble + regular knocks
d = 2.6; n = int(d * SR); t = tt(d); x = lp(rng.normal(0, 1, n), 220) * 0.6
for t0 in np.arange(0.05, d - 0.1, 0.19):
    i = int((t0 + rng.uniform(-0.02, 0.02)) * SR); L = int(0.09 * SR); x[i:i + L] += np.sin(2 * np.pi * 95 * np.arange(L) / SR) * np.exp(-np.arange(L) / SR / 0.025) * rng.uniform(0.5, 1)
save("barrel_roll", x * np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.3))
# domino clicks (a run that speeds up, and a short run that stops)
def click(L=0.03, f=2400):
    tk = np.arange(int(L * SR)) / SR; return (bp(rng.normal(0, 1, len(tk)), 1200, 5000) * np.exp(-tk / 0.004) + 0.4 * np.sin(2 * np.pi * f * tk) * np.exp(-tk / 0.006))
def run(times, d):
    x = np.zeros(int(d * SR))
    for t0 in times: i = int(t0 * SR); c = click(f=rng.uniform(1900, 2700)); x[i:i + len(c)] += c * rng.uniform(0.7, 1)
    return x
save("domino_run", run(np.cumsum([0.0] + [0.077] * 9), 1.0)); save("domino_stop", run(np.cumsum([0.0] + [0.093] * 3), 0.6)); save("domino_click", run([0.0], 0.15))
# rope strain (hemp creak): two slow squeaky groans, soft
d = 1.4; t = tt(d); g = np.sin(2 * np.pi * np.cumsum(210 + 50 * np.sin(2 * np.pi * 1.6 * t)) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 34 * t)) * np.sin(np.pi * t / d) ** 2
save("rope_creak", bp(g, 150, 1800) * 0.6)
# molten lead pouring: thick gloopy glugs + sizzle
d = 2.4; n = int(d * SR); t = tt(d); x = np.zeros(n)
for t0 in np.arange(0.0, d - 0.3, 0.16):
    i = int((t0 + rng.uniform(0, 0.05)) * SR); L = int(0.14 * SR); tk = np.arange(L) / SR; x[i:i + L] += np.sin(2 * np.pi * np.cumsum(180 + 260 * tk / 0.14) / SR) * np.sin(np.pi * tk / 0.14) * 0.6
save("lead_pour", x + 0.35 * bp(rng.normal(0, 1, n), 1500, 4500) * np.minimum(1, t / 0.3))
# bucket throw: a slosh (filtered noise shaped like a throw), no whoosh
d = 0.7; save("bucket_slosh", bp(rng.normal(0, 1, int(d * SR)), 300, 2200) * np.sin(np.pi * tt(d) / d) ** 3)
# wildfire roar far away (ridge): low wind-like rumble with slow surges
d = 6.0; t = tt(d); save("wildfire_far", lp(rng.normal(0, 1, int(d * SR)), 300) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t)) * np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.8) + 0.15 * pops(d, 8, 800, 3000))
