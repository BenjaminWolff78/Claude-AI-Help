#!/usr/bin/env python3
"""Sharpness ratio of a 1080x1920 video, the way Rick's Shorts and ours were compared (board BG2).
ratio = mean |pixel step| at full size / mean |pixel step| after 2x2 averaging, on the top 60% of
the frame (captions left out), median of 10 frames spread over the video.
Reference: a sharp photo ~1.0; a frame rendered at 0.55 and scaled up <= ~0.61.
Rick on YouTube: median 0.68 (51 frames, 17 Shorts, lowest 0.59). Ours on YouTube 0.54-0.62.
YouTube's re-encode adds ~0.02-0.03. TARGET for our final mp4: median >= 0.64.
Usage: python3 sharpness.py render.mp4"""
import subprocess, sys, json, numpy as np
def frames(path, n=10):
    dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',path],capture_output=True,text=True).stdout)
    for k in range(n):
        t=1+(dur-2)*k/(n-1)
        raw=subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','gray','-'],capture_output=True).stdout
        w,h=1080,1920
        if len(raw)!=w*h: raise SystemExit('expected 1080x1920')
        yield t, np.frombuffer(raw,np.uint8).reshape(h,w).astype(np.float32)
def ratio(L):
    L=L[:int(L.shape[0]*0.6)]
    e1=(np.abs(np.diff(L,axis=1))[:-1,:]+np.abs(np.diff(L,axis=0))[:,:-1]).mean()
    h2,w2=L.shape[0]//2,L.shape[1]//2
    M=L[:2*h2,:2*w2].reshape(h2,2,w2,2).mean(axis=(1,3))
    e2=(np.abs(np.diff(M,axis=1))[:-1,:]+np.abs(np.diff(M,axis=0))[:,:-1]).mean()
    return float(e1/e2)
if __name__=='__main__':
    rs=[(round(t,1),round(ratio(L),3)) for t,L in frames(sys.argv[1])]
    med=float(np.median([r for _,r in rs]))
    print(json.dumps({'median':round(med,3),'frames':rs,'target':0.64,'verdict':'OK' if med>=0.64 else 'LOW: render at dpr 1.0, use real textures and models, no lens blur on medium/wide shots'},indent=1))
