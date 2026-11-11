# Voice build v3 (master prompt v13 3.25-3.28): one take -> every pause (silence or breath, i.e. a run of 10 ms frames
# quieter than THR dB below the take's peak, at least 0.12 s long, with no recognised word centred inside it) trimmed to
# 0.10 s -> ONE Rubber Band R3 pass for speed only (natural pitch, formants preserved) -> faster-whisper word timings.
# usage: python3 build_voice3.py TEMPO THR_DB   (needs raw.mp3 + raw_words.json)
import subprocess, sys, json, numpy as np
TEMPO = float(sys.argv[1]); THR = float(sys.argv[2]); R3 = 536870912; KEEP = 0.10
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','raw.mp3','-ac','1','-ar','16000','-f','f32le','/tmp/r.f32'],check=True)
a = np.fromfile('/tmp/r.f32', dtype=np.float32); tot = len(a) / 16000; fr = 160
rms = np.sqrt(np.convolve(a**2, np.ones(fr)/fr, 'same'))[::fr]; db = 20*np.log10(rms/rms.max() + 1e-9)
W = json.load(open('raw_words.json')); cen = [((w['s']+w['e'])/2, w['e']-w['s']) for w in W]
quiet = db < THR; runs = []; i = 0; n = len(quiet)
while i < n:
    if quiet[i]:
        j = i
        while j < n and quiet[j]: j += 1
        s, e = i/100, j/100
        if e - s >= 0.12 and not any(s + 0.03 < c < e - 0.03 and d > 0.06 for c, d in cen): runs.append((s, e))
        i = j
    else: i += 1
keep = []; cur = 0.0
for s, e in runs:
    if s < 0.02: cur = max(0, e - 0.04); continue
    if e > tot - 0.02: keep.append((cur, s + 0.08)); cur = None; break
    keep.append((cur, s + KEEP/2)); cur = e - KEEP/2
if cur is not None: keep.append((cur, tot))
f = [f"[0:a]atrim={x:.4f}:{y:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.010,afade=t=out:st={max(0,y-x-0.010):.4f}:d=0.010[s{k}]" for k,(x,y) in enumerate(keep)]
f.append("".join(f"[s{k}]" for k in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[c];[c]rubberband=tempo={TEMPO}:pitch=1.0:formant=preserved:channels={R3}[o]")
open('filt3.txt','w').write(";".join(f))
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i','raw.mp3','-filter_complex_script','filt3.txt','-map','[o]','-ar','44100','-ac','1','voice.wav'],check=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','voice.wav','-ac','1','-ar','16000','-f','f32le','v16.f32'],check=True)
b = np.fromfile('v16.f32', dtype=np.float32)
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(b, word_timestamps=True, language="en", beam_size=5)
words = [{"w": w.word.strip(), "s": round(w.start,3), "e": round(w.end,3)} for s in segs for w in s.words]
json.dump(words, open('words_raw.json','w'), indent=0); json.dump(keep, open('keep.json','w'))
print('THR', THR, 'raw %.2f final %.2f pieces %d words %d' % (tot, len(b)/16000, len(keep), len(words)))
