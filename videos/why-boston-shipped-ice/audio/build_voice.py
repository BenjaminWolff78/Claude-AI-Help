import subprocess, json, numpy as np
tot=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','raw.mp3']))
o=subprocess.run(['ffmpeg','-hide_banner','-i','raw.mp3','-af','silencedetect=n=-38dB:d=0.12','-f','null','-'],capture_output=True,text=True).stderr
import re
v=[float(x) for x in re.findall(r'silence_(?:start|end): ([0-9.]+)',o)]
pairs=list(zip(v[0::2],v[1::2])); keep=[]; cur=0.0
for s,e in pairs:
    if s<0.01: cur=e-0.03; continue
    if e>tot-0.05: keep.append((cur,s+0.06)); cur=None; break
    if e-s>0.10: keep.append((cur,s+0.05)); cur=e-0.05
if cur is not None: keep.append((cur,tot))
f=[f"[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={max(0,b-a-0.012):.4f}:d=0.012[s{i}]" for i,(a,b) in enumerate(keep)]
f.append("".join(f"[s{i}]" for i in range(len(keep)))+f"concat=n={len(keep)}:v=0:a=1[c];[c]atempo=1.28[o]")
open('filt.txt','w').write(";".join(f))
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i','raw.mp3','-filter_complex_script','filt.txt','-map','[o]','-ar','44100','voice.wav'],check=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','voice.wav','-ac','1','-ar','16000','-f','f32le','v16.f32'],check=True)
from faster_whisper import WhisperModel
a=np.fromfile('v16.f32',dtype=np.float32)
m=WhisperModel("small.en",device="cpu",compute_type="int8")
segs,_=m.transcribe(a,word_timestamps=True,language="en",beam_size=5)
words=[{"w":w.word.strip(),"s":round(w.start,3),"e":round(w.end,3)} for s in segs for w in s.words]
json.dump(words,open('words.json','w'),indent=0)
print('raw',tot,'final',len(a)/16000,'words',len(words))
print(" ".join(f"{x['w']}@{x['s']}" for x in words))
