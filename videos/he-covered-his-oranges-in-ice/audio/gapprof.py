import json, numpy as np, subprocess
a=np.fromfile('/tmp/r.f32',dtype=np.float32); fr=160
rms=np.sqrt(np.convolve(a**2,np.ones(fr)/fr,'same'))[::fr]; db=20*np.log10(rms/rms.max()+1e-9)
# spectral flatness per 10ms (25ms window)
def flat(i):
    seg=a[max(0,i*fr-200):i*fr+200]
    if len(seg)<400: return 0
    S=np.abs(np.fft.rfft(seg*np.hanning(len(seg))))+1e-9
    return np.exp(np.mean(np.log(S)))/np.mean(S)
W=json.load(open('raw_words.json'))
for i in range(len(W)-1):
    e,s=W[i]['e'],W[i+1]['s']
    if s-e<0.15: continue
    a0,a1=int((e-0.15)*100),int((s+0.10)*100)
    ch=''.join(' ' if d<-40 else '.' if d<-30 else '-' if d<-24 else 'o' if d<-20 else 'O' if d<-14 else '#' for d in db[a0:a1])
    fl=''.join(str(min(9,int(flat(k)*20))) for k in range(a0,a1))
    print(f"{W[i]['w']:>12} | {W[i+1]['w']:<10} gap {s-e:.2f}\n   [{ch[:15]}|{ch[15:-10]}|{ch[-10:]}]\n   [{fl[:15]}|{fl[15:-10]}|{fl[-10:]}]")
