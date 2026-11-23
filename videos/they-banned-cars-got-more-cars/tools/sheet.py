import sys,glob,re
from PIL import Image
pre,out,lo,hi=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])
fs=[f for f in glob.glob(pre+'*.jpg') if re.fullmatch(r'\d+',f[len(pre):-4])]
fs=sorted([f for f in fs if lo<=int(f[len(pre):-4])<=hi],key=lambda s:int(s[len(pre):-4]))
ims=[Image.open(f) for f in fs]; w,h=ims[0].size
s=Image.new('RGB',(w*len(ims),h))
for i,im in enumerate(ims): s.paste(im,(i*w,0))
s.save(out,quality=88); print([f[len(pre):-4] for f in fs])
