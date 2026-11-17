import subprocess, numpy as np, sys
from PIL import Image, ImageDraw
# usage: psheet.py out.jpg step chunk.mp4 [chunk.mp4 ...]   (chunk start frame from the file name p_NNNN.mp4)
out, step, vids = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
fr = []
for v in vids:
    a0 = int(v.split('p_')[-1][:4])
    raw = subprocess.run(["ffmpeg","-v","error","-i",v,"-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True).stdout
    arr = np.frombuffer(raw,np.uint8).reshape(-1,480,270,3)
    fr += [(a0+k, arr[k]) for k in range(0, len(arr), step)]
cols = 12; rows = (len(fr)+cols-1)//cols
s = Image.new('RGB',(cols*135, rows*240)); d = ImageDraw.Draw(s)
for i,(f,a) in enumerate(fr):
    x,y = (i%cols)*135, (i//cols)*240; s.paste(Image.fromarray(a).resize((135,240)),(x,y)); d.text((x+3,y+3),str(f),fill=(255,255,0))
s.save(out, quality=82)
