"""Same measures as the in-browser check on Rick's Shorts: every 0.5 s, mean abs grey difference between a frame and the
next one at 54x96 (motion), share of near-still samples (<0.6), and the centre/edge Laplacian energy ratio (focus)."""
import sys, subprocess, numpy as np
p = sys.argv[1]
dur = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p]))
raw = subprocess.check_output(["ffmpeg","-v","error","-i",p,"-vf","scale=54:96,format=gray","-f","rawvideo","-"])
fr = np.frombuffer(raw, np.uint8).reshape(-1, 96, 54).astype(np.float32)
def lap(a): return (4*a[1:-1,1:-1]-a[:-2,1:-1]-a[2:,1:-1]-a[1:-1,:-2]-a[1:-1,2:])**2
m, c, e = [], 0, 0
for t in np.arange(0.2, dur - 0.3, 0.5):
    i = int(round(t * 30)); a, b = fr[i], fr[i + 1]; m.append(np.abs(a - b).mean())
    L = lap(a); c += L[19:69, 12:40].mean(); e += (L[:, :9].mean() + L[:, -9:].mean()) / 2 + 1
m = np.array(m); print(f"n {len(m)} motion median {np.median(m):.2f} p10 {np.percentile(m,10):.2f} nearStill {np.mean(m<0.6):.2f} centre/edge {c/e:.2f}")
