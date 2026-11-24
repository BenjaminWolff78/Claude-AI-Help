import subprocess, numpy as np, sys
V="/home/claude/p11/final/video_raw.mp4"
def stats(vf):
    f="fps=2,scale=270:480" + ("," + vf if vf else "")
    raw=subprocess.run(['ffmpeg','-v','error','-i',V,'-vf',f,'-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    a=np.frombuffer(raw,np.uint8).reshape(-1,480,270,3).astype(np.float32)
    y=(0.299*a[...,0]+0.587*a[...,1]+0.114*a[...,2]); mx=a.max(-1); mn=a.min(-1); s=np.where(mx>0,(mx-mn)/np.maximum(mx,1),0)
    return y.mean(), np.median(s.mean(axis=(1,2))), (y<16).mean()*100, (y>245).mean()*100
for vf in ["curves=all='0/0.03 0.25/0.31 0.5/0.58 0.75/0.81 1/1',eq=saturation=1.5", "curves=all='0/0.03 0.25/0.32 0.5/0.59 0.75/0.815 1/1',eq=saturation=1.6"]:
    print(f"{stats(vf)}  {vf}")
