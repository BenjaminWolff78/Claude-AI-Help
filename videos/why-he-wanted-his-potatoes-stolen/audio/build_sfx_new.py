"""New Eiffel SFX: decode, trim leading/trailing silence, loop short ambiences with crossfades, peak -1 dBFS, 44.1k stereo."""
import subprocess, numpy as np, soundfile as sf, os
SR=44100
def load(p):
    b=subprocess.run(["ffmpeg","-v","error","-i",p,"-ac","2","-ar",str(SR),"-f","f32le","-"],capture_output=True,check=True).stdout
    return np.frombuffer(b,np.float32).reshape(-1,2).astype(np.float64)
def trim(x,th=0.004):
    e=np.abs(x).max(1); idx=np.where(e>th)[0]
    return x[max(0,idx[0]-200):idx[-1]+400] if len(idx) else x
def loop(x,L,xf=0.25):
    n=int(L*SR); k=min(int(xf*SR),len(x)//3); out=x.copy()
    while len(out)<n:
        r=np.linspace(0,1,k)[:,None]; out=np.concatenate([out[:-k], out[-k:]*(1-r)+x[:k]*r, x[k:]])
    return out[:n]
def fade(x,a=0.01,b=0.12):
    na,nb=int(a*SR),int(b*SR); x=x.copy(); x[:na]*=np.linspace(0,1,na)[:,None]; x[-nb:]*=np.linspace(1,0,nb)[:,None]; return x
LOOP={"desert_amb":10.0,"london_amb":14.0,"bulldozer":4.0,"motorboat":4.0}
for f in sorted(os.listdir("raw_sfx")):
    n=f[:-4]; x=trim(load("raw_sfx/"+f))
    if n in LOOP: x=loop(x,LOOP[n])
    x=fade(x); x*=10**(-1/20)/max(1e-9,np.abs(x).max())
    sf.write(f"sfx/{n}.wav",x,SR,subtype="PCM_24"); print(n, round(len(x)/SR,2))
