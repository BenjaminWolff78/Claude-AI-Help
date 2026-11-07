# Voice build for cartoon-3d-short (user rule 2026-11-05).
# raw.mp3 = one eleven_v4 take of the whole script in "The Pharaoh 3" (Qziuou6kCJ2R3w53L2Zs).
# 1) trims every pause longer than 0.10 s down to ~0.10 s, 2) ONE Rubber Band pass that does the
# speed-up (and an optional pitch shift, now OFF by default) together (R3 "finer" engine, formants preserved),
# User 2026-11-07: the +3.5 semitone voices "sounded kinda weird" -> keep the natural pitch (SEMITONES=0).
# 3) word timings with faster-whisper on the final file.
# usage: python3 build_voice_r3.py TEMPO [SEMITONES=0]
import subprocess, json, re, sys, numpy as np
TEMPO = float(sys.argv[1]) if len(sys.argv) > 1 else 1.22
SEMI = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
PITCH = 2 ** (SEMI / 12)
R3 = 536870912  # RubberBandStretcher::OptionEngineFiner (0x20000000), passed through ffmpeg's "channels" flag field; needs librubberband >= 3.0
tot = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'raw.mp3']))
o = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'raw.mp3', '-af', 'silencedetect=n=-38dB:d=0.12', '-f', 'null', '-'], capture_output=True, text=True).stderr
v = [float(x) for x in re.findall(r'silence_(?:start|end): ([0-9.]+)', o)]
pairs = list(zip(v[0::2], v[1::2])); keep = []; cur = 0.0
for s, e in pairs:
    if s < 0.01: cur = e - 0.03; continue
    if e > tot - 0.05: keep.append((cur, s + 0.06)); cur = None; break
    if e - s > 0.10: keep.append((cur, s + 0.05)); cur = e - 0.05
if cur is not None: keep.append((cur, tot))
f = [f"[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={max(0, b - a - 0.012):.4f}:d=0.012[s{i}]" for i, (a, b) in enumerate(keep)]
f.append("".join(f"[s{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[c];[c]rubberband=tempo={TEMPO}:pitch={PITCH:.6f}:formant=preserved:channels={R3}[o]")
open('filt.txt', 'w').write(";".join(f))
subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', 'raw.mp3', '-filter_complex_script', 'filt.txt', '-map', '[o]', '-ar', '44100', '-ac', '1', 'voice.wav'], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'voice.wav', '-ac', '1', '-ar', '16000', '-f', 'f32le', 'v16.f32'], check=True)
a = np.fromfile('v16.f32', dtype=np.float32)
try:
    import librosa
    f0, vo, _ = librosa.pyin(a[:16000 * 30], fmin=70, fmax=450, sr=16000, frame_length=1024)
    print('median F0', round(float(np.median(f0[vo & ~np.isnan(f0)])), 1), 'Hz (target 200-220)')
except Exception as ex:
    print('F0 check skipped', ex)
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(a, word_timestamps=True, language="en", beam_size=5)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(words, open('words.json', 'w'), indent=0)
print('raw', tot, 'final', len(a) / 16000, 'words', len(words))
