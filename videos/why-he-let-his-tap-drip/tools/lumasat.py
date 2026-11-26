import sys, glob, numpy as np
from PIL import Image
# kit-style luma / saturation / white% on a list of PNG frames
L=[];S=[];W=[];NB=[]
for p in sys.argv[1:]:
    f=np.asarray(Image.open(p).convert('RGB')).astype(np.int32)
    l=(54*f[...,0]+183*f[...,1]+19*f[...,2])>>8
    mx=f.max(2); mn=f.min(2)
    L.append(l.mean()); S.append(np.where(mx>0,(mx-mn)/np.maximum(mx,1),0).mean()); W.append(100*(mn>235).mean()); NB.append(100*(l<14).mean())
print('luma %.1f sat %.3f white%% %.1f nblack%% %.1f  (n=%d)'%(np.mean(L),np.mean(S),np.mean(W),np.mean(NB),len(L)))
