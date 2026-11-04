"""Original underscore for 'Why He Put a Bridge in the Desert' (62.1 s): playful western-tinged pluck + marimba,
112 BPM, F major. Sections follow the scenes: desert (pluck guitar + shaker), London (muted, minor, clarinet pad),
map (marimba run), desert rebuild (full), night office (soft, pads), payoff (bright, full), fade before the end."""
import numpy as np, soundfile as sf
SR=44100; BPM=112; B=60/BPM; L=64.0
N=int(L*SR); out=np.zeros((N,2))
rng=np.random.default_rng(7)
def midi(n): return 440*2**((n-69)/12)
def add(x,t,pan=0.0,g=1.0):
    i=int(t*SR); j=min(N,i+len(x))
    if i>=N: return
    l=np.cos((pan+1)*np.pi/4); r=np.sin((pan+1)*np.pi/4)
    out[i:j,0]+=x[:j-i]*g*l; out[i:j,1]+=x[:j-i]*g*r
def ks(f,dur,bright=0.5):  # Karplus-Strong pluck
    n=int(dur*SR); p=max(2,int(SR/f)); buf=rng.uniform(-1,1,p); y=np.zeros(n)
    for k in range(n):
        y[k]=buf[k%p]; buf[k%p]=0.5*(buf[k%p]+buf[(k+1)%p])*(0.996 if bright>0.4 else 0.99)
    return y*np.linspace(1,0.0,n)**0.5
def marimba(f,dur=0.6):
    t=np.arange(int(dur*SR))/SR
    return (np.sin(2*np.pi*f*t)*np.exp(-t*7)+0.35*np.sin(2*np.pi*f*4*t)*np.exp(-t*22))*(1-np.exp(-t*400))
def bass(f,dur):
    t=np.arange(int(dur*SR))/SR
    return (np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*2*f*t))*np.exp(-t*3.2)*(1-np.exp(-t*300))
def pad(fs,dur,soft=1.0):
    t=np.arange(int(dur*SR))/SR; env=np.minimum(1,t/0.4)*np.minimum(1,(dur-t)/0.5)
    y=sum(np.sin(2*np.pi*f*t+0.3*np.sin(2*np.pi*0.3*t))+0.2*np.sin(2*np.pi*2*f*t) for f in fs)
    return y*env/len(fs)*soft
def shaker(dur=0.08):
    n=int(dur*SR); x=rng.normal(0,1,n); x=np.diff(np.concatenate([[0],x]))
    return x*np.exp(-np.arange(n)/SR*60)
def kick():
    t=np.arange(int(0.25*SR))/SR; return np.sin(2*np.pi*(55+60*np.exp(-t*30))*t)*np.exp(-t*12)
def clar(f,dur):
    t=np.arange(int(dur*SR))/SR; env=np.minimum(1,t/0.06)*np.minimum(1,(dur-t)/0.1)
    vib=1+0.004*np.sin(2*np.pi*5*t)
    y=np.sin(2*np.pi*f*vib*t)+0.4*np.sin(2*np.pi*3*f*vib*t)+0.2*np.sin(2*np.pi*5*f*vib*t)
    return y*env*0.5
F,Bb,C,Dm,Gm,Am=[53,57,60],[58,62,65],[60,64,67],[50,53,57],[55,58,62],[57,60,64]
def section(t0,t1,prog,style):
    beat=0; t=t0
    while t<t1-0.01:
        bar=int(beat//4); ch=prog[bar%len(prog)]; b=beat%4
        if style in("desert","full","payoff"):
            if b in(0,2): add(bass(midi(ch[0]-12),B*1.8),t,0,0.55)
            # boom-chick pluck
            if b in(1,3): [add(ks(midi(n),0.35),t+0.01*i,0.3,0.12) for i,n in enumerate(ch)]
            add(shaker(),t,-0.4,0.05); add(shaker(),t+B/2,-0.4,0.035)
            if style!="desert" and b==0: add(kick(),t,0,0.35)
        if style in("full","payoff","map"):
            mel=[ch[2]+12,ch[1]+12,ch[2]+12,ch[0]+24][int(b)]
            add(marimba(midi(mel)),t,-0.2,0.16); add(marimba(midi(mel+(7 if b%2 else 4))),t+B/2,0.2,0.09)
        if style=="london":
            if b==0: add(pad([midi(n) for n in ch],B*4,0.8),t,0,0.16); add(bass(midi(ch[0]-12),B*3),t,0,0.4)
            if b in(1,3): add(ks(midi(ch[1]+12),0.25,0.3),t,0.3,0.07)
            if b==2: add(clar(midi(ch[2]+12),B*1.6),t,-0.3,0.09)
        if style=="night":
            if b==0: add(pad([midi(n) for n in ch],B*4,0.7),t,0,0.15)
            add(marimba(midi(ch[(int(beat)%3)]+24),0.4),t,0.25,0.06)
        if style=="payoff" and b==0: add(pad([midi(n+12) for n in ch],B*4,0.6),t,0,0.1)
        beat+=1; t=t0+beat*B
section(0.0,10.53,[F,Bb,C,F],"desert")
section(10.53,16.67,[Dm,Gm,Am,Dm],"london")
section(16.67,21.4,[F,Dm,Bb,C],"full")
section(21.4,27.03,[F,C,Bb,C],"map")
section(27.03,36.93,[Dm,Gm,Am,Dm],"london")
section(36.93,40.1,[F,Bb,C,F],"full")
section(40.1,46.97,[Dm,Bb,F,C],"night")
section(46.97,53.83,[F,Bb,C,F],"full")
section(53.83,64.0,[F,Bb,C,F],"payoff")
# soft reverb-ish: a few delayed copies
y=out.copy()
for d,g in((0.083,0.25),(0.161,0.18),(0.27,0.12)):
    k=int(d*SR); y[k:]+=out[:-k]*g
y/=np.abs(y).max()*1.12
fade=np.ones(N); a=int(61.0*SR); b=int(63.4*SR); fade[a:b]=np.linspace(1,0,b-a); fade[b:]=0
y*=fade[:,None]
sf.write("/home/claude/bridge/audio/music.wav",y,SR,subtype="PCM_24"); print("ok",len(y)/SR)
