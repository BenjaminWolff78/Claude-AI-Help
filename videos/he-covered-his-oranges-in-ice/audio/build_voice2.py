# Voice build v2: pauses (silence AND breaths) between words trimmed to 0.10 s using word timings of the raw take,
# then ONE Rubber Band R3 tempo pass (natural pitch, formants preserved), then word timings on the final file.
# usage: python3 build_voice2.py TEMPO   (needs raw.mp3 and raw_words.json from faster-whisper on raw.mp3)
import subprocess, sys, json, numpy as np
TEMPO = float(sys.argv[1]); R3 = 536870912; KEEP = 0.10
tot = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','raw.mp3']))
W = json.load(open('raw_words.json'))
keep = []; cur = max(0, W[0]['s'] - 0.04)
for i in range(len(W) - 1):
    e, s = W[i]['e'], W[i+1]['s']
    if s - e > KEEP + 0.02:
        keep.append((cur, e + KEEP / 2)); cur = s - KEEP / 2
keep.append((cur, min(tot, W[-1]['e'] + 0.12)))
f = [f"[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.010,afade=t=out:st={max(0,b-a-0.010):.4f}:d=0.010[s{i}]" for i,(a,b) in enumerate(keep)]
f.append("".join(f"[s{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[c];[c]rubberband=tempo={TEMPO}:pitch=1.0:formant=preserved:channels={R3}[o]")
open('filt2.txt','w').write(";".join(f))
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i','raw.mp3','-filter_complex_script','filt2.txt','-map','[o]','-ar','44100','-ac','1','voice.wav'],check=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','voice.wav','-ac','1','-ar','16000','-f','f32le','v16.f32'],check=True)
a = np.fromfile('v16.f32', dtype=np.float32)
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(a, word_timestamps=True, language="en", beam_size=5)
words = [{"w": w.word.strip(), "s": round(w.start,3), "e": round(w.end,3)} for s in segs for w in s.words]
json.dump(words, open('words_raw.json','w'), indent=0); json.dump(keep, open('keep.json','w'))
print('raw %.2f final %.2f pieces %d words %d' % (tot, len(a)/16000, len(keep), len(words)))
