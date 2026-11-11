# Voice build (master prompt v13 3.25-3.28): raw.mp3 = one eleven_v4 take of the whole script, The Pharaoh 3.
# 1) every pause longer than 0.10 s is trimmed to ~0.10 s (silence = below THR dB after peak-normalising),
# 2) exactly ONE Rubber Band R3 ("finer") pass for speed only, natural pitch, formants preserved,
# 3) word timings with faster-whisper on the final file -> words_raw.json
# usage: python3 build_voice.py TEMPO THR_DB
import subprocess, re, sys, json, numpy as np
TEMPO = float(sys.argv[1]); THR = sys.argv[2] if len(sys.argv) > 2 else '-36'
R3 = 536870912
tot = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','raw.mp3']))
o = subprocess.run(['ffmpeg','-hide_banner','-i','raw.mp3','-af',f'loudnorm=I=-16:TP=-1.5,silencedetect=n={THR}dB:d=0.10','-f','null','-'],capture_output=True,text=True).stderr
v = [float(x) for x in re.findall(r'silence_(?:start|end): ([0-9.]+)', o)]
pairs = list(zip(v[0::2], v[1::2])); keep = []; cur = 0.0
for s, e in pairs:
    if s < 0.01: cur = max(0, e - 0.04); continue
    if e > tot - 0.05: keep.append((cur, s + 0.06)); cur = None; break
    if e - s > 0.10: keep.append((cur, s + 0.05)); cur = e - 0.05
if cur is not None: keep.append((cur, tot))
json.dump(keep, open('keep.json','w'))
f = [f"[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={max(0,b-a-0.012):.4f}:d=0.012[s{i}]" for i,(a,b) in enumerate(keep)]
f.append("".join(f"[s{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[c];[c]rubberband=tempo={TEMPO}:pitch=1.0:formant=preserved:channels={R3}[o]")
open('filt.txt','w').write(";".join(f))
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i','raw.mp3','-filter_complex_script','filt.txt','-map','[o]','-ar','44100','-ac','1','voice.wav'],check=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','voice.wav','-ac','1','-ar','16000','-f','f32le','v16.f32'],check=True)
a = np.fromfile('v16.f32', dtype=np.float32)
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(a, word_timestamps=True, language="en", beam_size=5)
words = [{"w": w.word.strip(), "s": round(w.start,3), "e": round(w.end,3)} for s in segs for w in s.words]
json.dump(words, open('words_raw.json','w'), indent=0)
print('raw %.2f final %.2f pieces %d words %d' % (tot, len(a)/16000, len(keep), len(words)))
