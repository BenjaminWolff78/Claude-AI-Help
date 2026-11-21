# Voice build v6: one take -> pauses cut using ENERGY inside each aligner gap (so a mis-timed word or an s-tail is never cut):
# in each gap > 0.10 s, the longest run of near-floor frames is removed except 0.05 s at each end -> R3 tempo -> words.
import subprocess, sys, json, re, numpy as np
TEMPO=float(sys.argv[1]); RISE=float(sys.argv[2]) if len(sys.argv)>2 else 6.0; R3=536870912
W=json.load(open('raw_words.json'))
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','raw.mp3','-ac','1','-ar','16000','-f','f32le','/tmp/r6.f32'],check=True)
a=np.fromfile('/tmp/r6.f32',dtype=np.float32); sr=16000; tot=len(a)/sr
hop=160; win=320
fr=np.array([np.sqrt(np.mean(a[i:i+win]**2)+1e-12) for i in range(0,len(a)-win,hop)])
db=20*np.log10(fr/fr.max())
def T(t): return int(round(t*100))
cuts=[]
# lead-in and tail
cuts.append((0.0,max(0.0,W[0]['s']-0.05)))
for i in range(len(W)-1):
    e,s=W[i]['e'],W[i+1]['s']
    if s-e<0.10: continue
    lo,hi=T(e-0.03),T(s+0.03); seg=db[lo:hi]
    if len(seg)<5: continue
    q=seg<RISE
    best=(0,0); j=0
    while j<len(q):
        if q[j]:
            k=j
            while k<len(q) and q[k]: k+=1
            if k-j>best[1]-best[0]: best=(j,k)
            j=k
        else: j+=1
    rs,re_=(lo+best[0])/100,(lo+best[1])/100
    if re_-rs-0.10>0.03: cuts.append((rs+0.05,re_-0.05))
cuts.append((min(tot,W[-1]['e']+0.25),tot))
CUT=[int(x) for x in sys.argv[3].split(',')] if len(sys.argv)>3 and sys.argv[3] else []
sents=[];curs=[]
for i,w in enumerate(W):
    curs.append(i)
    if re.search(r'[.!?]["\u201d]?$',w['w']): sents.append(curs);curs=[]
if curs: sents.append(curs)
for k in CUT:
    a0=W[sents[k-1][-1]]['e']+0.06; b0=W[sents[k][-1]]['e']+0.06
    cuts.append((a0,b0)); print('cut sentence',k,' '.join(W[i]['w'] for i in sents[k]))
cuts=[c for c in cuts if c[1]-c[0]>0.005]; cuts.sort()
keep=[]; cur=0.0
for x,y in cuts:
    if x>cur: keep.append((cur,x))
    cur=max(cur,y)
if cur<tot: keep.append((cur,tot))
f=[f"[0:a]atrim={x:.4f}:{y:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st={max(0,y-x-0.008):.4f}:d=0.008[s{k}]" for k,(x,y) in enumerate(keep)]
f.append("".join(f"[s{k}]" for k in range(len(keep)))+f"concat=n={len(keep)}:v=0:a=1[c];[c]rubberband=tempo={TEMPO}:pitch=1.0:formant=preserved:channels={R3}[o]")
open('filt6.txt','w').write(";".join(f))
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i','raw.mp3','-filter_complex_script','filt6.txt','-map','[o]','-ar','44100','-ac','1','voice.wav'],check=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','voice.wav','-ac','1','-ar','16000','-f','f32le','v16.f32'],check=True)
b=np.fromfile('v16.f32',dtype=np.float32)
from faster_whisper import WhisperModel
m=WhisperModel("small.en",device="cpu",compute_type="int8")
segs,_=m.transcribe(b,word_timestamps=True,language="en",beam_size=5)
words=[{"w":w.word.strip(),"s":round(w.start,3),"e":round(w.end,3)} for s in segs for w in s.words]
json.dump(words,open('words_raw.json','w'),indent=0); json.dump(keep,open('keep.json','w'))
print('raw %.2f final %.2f pieces %d words %d removed %.2f'%(tot,len(b)/16000,len(keep),len(words),sum(y-x for x,y in cuts)))
