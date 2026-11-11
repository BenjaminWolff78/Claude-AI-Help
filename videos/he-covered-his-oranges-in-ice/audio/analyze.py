import sys, re, json, numpy as np, subprocess
from faster_whisper import WhisperModel
def syl(w):
    w=re.sub(r'[^a-z]','',w.lower())
    if not w: return 0
    if len(w)<=3: return 1
    w=re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$','',w); w=re.sub(r'^y','',w)
    return max(1,len(re.findall(r'[aeiouy]{1,2}',w)))
m = WhisperModel("small.en", device="cpu", compute_type="int8")
for f in sys.argv[1:]:
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f,'-ac','1','-ar','16000','-f','f32le','/tmp/a.f32'],check=True)
    a=np.fromfile('/tmp/a.f32',dtype=np.float32)
    segs,_=m.transcribe(a,word_timestamps=True,language='en',beam_size=5)
    W=[(w.start,w.end,w.word.strip()) for s in segs for w in s.words]
    dur=W[-1][1]-W[0][0]; gaps=[W[i+1][0]-W[i][1] for i in range(len(W)-1)]
    big=sum(g-0.1 for g in gaps if g>0.1)
    sy=sum(syl(x) for w in W for x in re.split(r'-',w[2]))
    json.dump([{"w":w[2],"s":round(w[0],3),"e":round(w[1],3)} for w in W],open(f.replace('.mp3','_words.json'),'w'))
    print(f, 'words',len(W),'span %.1f'%dur,'gap>0.1 total %.1f'%big,'syl',sy,'rate raw %.2f'%(sy/dur),'rate trimmed %.2f'%(sy/(dur-big)),'trimmed len %.1f'%(dur-big))
