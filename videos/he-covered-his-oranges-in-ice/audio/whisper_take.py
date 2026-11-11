import sys, json, subprocess, numpy as np
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',src,'-ac','1','-ar','16000','-f','f32le','/tmp/w.f32'],check=True)
b=np.fromfile('/tmp/w.f32',dtype=np.float32)
m=WhisperModel("small.en",device="cpu",compute_type="int8")
segs,_=m.transcribe(b,word_timestamps=True,language="en",beam_size=5)
W=[{"w":w.word.strip(),"s":round(w.start,3),"e":round(w.end,3)} for s in segs for w in s.words]
json.dump(W,open(out,'w'),indent=0); print(src,len(W),'words',round(len(b)/16000,2),'s')
