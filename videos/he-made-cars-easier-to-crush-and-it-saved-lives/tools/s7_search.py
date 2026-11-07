from proj import *
import math
def th(fov): return math.tan(math.radians(fov)/2)*9/16
res=[]
for cx in [2.4,2.8,3.2,3.6]:
  for cz in [-2.6,-2.0,-1.4,-0.8]:
    for lx,lz in [(0.2,-3.9),(0.5,-3.6),(0.0,-3.6),(0.4,-4.0)]:
      for fov in [50,54,58]:
        C=([cx,1.5,cz],[lx,1.0,lz],fov)
        if cx>3.4 and cz>-3.5: pass
        nose=[proj(*C,(0.95,0.75,z)) for z in (-4.6,-3.8)]
        nl,nr=min(n[0] for n in nose),max(n[0] for n in nose)
        dm=proj(*C,(-0.42,1.2,-3.17)); dhw=0.2/dm[2]/th(fov)
        if abs(dm[0])+dhw>0.82 or nl<-0.8 or nr>0.8: continue
        for ex in [1.3,1.5,1.7,1.9,2.1]:
          for ez in [-3.6,-3.2,-2.8,-2.4,-2.0,-1.6]:
            e=proj(*C,(ex,1.0,ez)); ehw=0.3/e[2]/th(fov)
            if e[2]<2.0 or abs(e[0])+ehw>0.8: continue
            if e[0]-ehw<nr+0.02 and e[0]+ehw>nl-0.02: continue      # covers nose
            if e[0]-ehw<dm[0]+dhw and e[0]+ehw>dm[0]-dhw: continue   # covers dummy
            gap=math.hypot(ex-0.95,ez+4.0)
            res.append((round(gap,2),round(e[2],1),C,(ex,ez),round(e[0],2),(round(nl,2),round(nr,2)),round(dm[0],2)))
res.sort(key=lambda r:(r[0],r[1]))
for r in res[:12]: print(r)
print(len(res))
