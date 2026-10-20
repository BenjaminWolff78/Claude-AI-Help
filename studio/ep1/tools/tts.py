"""Placeholder narrator: Kokoro-82M (onnx) + misaki lexicons.

Synthesizes the script line by line, trims silence, adds the scripted pauses,
and estimates word timings from per-word synthesis lengths snapped to energy
minima in the real line audio. Writes voice.wav (24 kHz) and words.json.

Usage: python3 tts.py script.json outdir
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from scipy.io import wavfile

SR = 24000
MODEL = "/home/claude/dl/kokoro/kokoro-v1.0.onnx"
VOICES = "/home/claude/dl/kokoro/voices-v1.0.bin"
CONFIG = "/home/claude/dl/repos/kokoro-onnx/src/kokoro_onnx/config.json"
LEX = ["/home/claude/dl/repos/misaki/misaki/data/us_gold.json",
       "/home/claude/dl/repos/misaki/misaki/data/us_silver.json"]
VOICE = "af_heart"
BASE_SPEED = 0.92

OVERRIDES = {
    "A": "ˈA", "C": "sˈi", "I": "ˈI", "R": "ˈɑɹ",
    "maya": "mˈIə", "maya's": "mˈIəz", "dan": "dˈæn", "dan's": "dˈænz",
    "coworker": "kˈOwˌɜɹkəɹ", "it'll": "ˈɪɾᵊl", "hasn't": "hˈæzᵊnt",
    "gets": "ɡˈɛts", "voted": "vˈOɾᵻd", "qualifies": "kwˈɑləfˌIz", "poorer": "pˈʊɹəɹ", "expired": "ɪkspˈIəɹd",
}

vocab = json.load(open(CONFIG))["vocab"]
lex = {}
for p in reversed(LEX):  # gold wins
    lex.update(json.load(open(p)))


def lookup(word):
    for key in (word, word.lower(), word.capitalize()):
        if key in OVERRIDES:
            return OVERRIDES[key]
    for key in (word, word.lower(), word.capitalize()):
        v = lex.get(key)
        if v is None:
            continue
        if isinstance(v, dict):
            v = v.get("DEFAULT") or next(iter(v.values()))
        if v:
            return v
    low = word.lower()
    if low.endswith("'s") and lookup(low[:-2]):
        base = lookup(low[:-2])
        return base + ("z" if base[-1] in "aeiouəɚAIOWYɪʊɛæʌɑɔᵊnmŋlɹdgbvðz" else "s")
    if low.endswith("s") and len(low) > 3:
        base = lex.get(low[:-1])
        if isinstance(base, dict):
            base = base.get("DEFAULT")
        if isinstance(base, str) and base:
            return base + ("s" if base[-1] in "ptkfθ" else "z")
    return None


TOKEN = re.compile(r"[A-Za-z][A-Za-z']*|[.,?!:;]")


def g2p(text):
    words, ph = [], []
    for tok in TOKEN.findall(text):
        if tok in ".,?!:;":
            ph.append(tok)
            continue
        p = lookup(tok)
        if p is None:
            raise SystemExit(f"no pronunciation for {tok!r} in: {text}")
        words.append((tok, p))
        ph.append(" " + p if ph else p)
    return "".join(ph).strip(), words


sess = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
voices = np.load(VOICES)
style_all = voices[VOICE]


def synth(phonemes, speed):
    toks = [vocab[c] for c in phonemes if c in vocab]
    style = style_all[min(len(toks), len(style_all)) - 1]
    out = sess.run(None, {
        "tokens": np.array([[0, *toks, 0]], dtype=np.int64),
        "style": np.asarray(style, dtype=np.float32).reshape(1, 256),
        "speed": np.array([speed], dtype=np.float32),
    })[0]
    return np.asarray(out, dtype=np.float32).ravel()


def trim(a, thr=0.012, pad=0.03):
    env = np.abs(a)
    idx = np.where(env > thr)[0]
    if len(idx) == 0:
        return a[:0]
    s = max(0, idx[0] - int(pad * SR))
    e = min(len(a), idx[-1] + int(pad * SR))
    return a[s:e]


def rms_frames(a, hop=240):
    n = len(a) // hop
    return np.sqrt(np.mean(a[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)


def word_times(line_audio, words, speed):
    """Proportional split by isolated word length, then snap to energy dips."""
    lens = []
    for _, p in words:
        w = trim(synth(p, speed))
        lens.append(max(len(w), int(0.08 * SR)))
    lens = np.array(lens, dtype=float)
    total = len(line_audio)
    bounds = np.concatenate([[0], np.cumsum(lens) / lens.sum() * total])
    env = rms_frames(line_audio)
    hop = 240
    snapped = [0]
    for b in bounds[1:-1]:
        c = int(b / hop)
        lo, hi = max(1, c - 10), min(len(env) - 1, c + 10)  # +-100 ms
        if hi > lo:
            c = lo + int(np.argmin(env[lo:hi]))
        snapped.append(max(snapped[-1] + int(0.06 * SR), c * hop))
    snapped.append(total)
    return [(snapped[i] / SR, snapped[i + 1] / SR) for i in range(len(words))]


def main():
    script = json.load(open(sys.argv[1]))
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    lead = 0.10
    chunks = [np.zeros(int(lead * SR), np.float32)]
    t = lead
    lines = []
    for ln in script["lines"]:
        speed = BASE_SPEED * ln.get("speed", 1.0)
        nwords = len(TOKEN.findall(ln["say"]))
        if nwords <= 4:
            speed *= 0.95
        ph, words = g2p(ln["say"])
        a = trim(synth(ph, speed))
        a = a / max(1e-6, np.abs(a).max()) * 0.85
        wt = word_times(a, words, speed)
        dur = len(a) / SR
        lines.append({
            "id": ln["id"], "scene": ln["scene"], "text": ln["text"], "say": ln["say"],
            "start": round(t, 3), "end": round(t + dur, 3),
            "words": [{"w": w, "start": round(t + s, 3), "end": round(t + e, 3)}
                      for (w, _), (s, e) in zip(words, wt)],
        })
        chunks.append(a)
        pause = ln.get("pause", 0.2)
        chunks.append(np.zeros(int(pause * SR), np.float32))
        t += dur + pause
        print(f"{ln['id']:>3} {t:7.2f}s  {ln['text'][:60]}")
    audio = np.concatenate(chunks)
    wavfile.write(out / "voice.wav", SR, (audio * 32767).astype(np.int16))
    json.dump({"duration": round(len(audio) / SR, 3), "lines": lines},
              open(out / "words.json", "w"), indent=1)
    print("total", round(len(audio) / SR, 2), "s")


if __name__ == "__main__":
    main()
