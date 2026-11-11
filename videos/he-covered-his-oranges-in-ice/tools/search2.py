from frame import scr, aim
import itertools, math
HY={"kid":0.99,"scarecrow":1.38}
def search(figs, want, xs_, zs_, ys_=(1.38,), fovs=(44,48), aimpt=None, sit=(), top=6, dist=None):
    """want: {who: (xmin,xmax)}; heads y 30..50 preferred"""
    best=[]
    for x in xs_:
      for z in zs_:
        for y in ys_:
          for fov in fovs:
            pos=[x,y,z]
            if aimpt is None:
                pts=[(p[0],p[1]+(0.85 if k in sit else HY.get(k,1.3)),p[2]) for k,p in figs.items()]
                mid=tuple(sum(q[i] for q in pts)/len(pts) for i in range(3))
            else: mid=aimpt
            for yt in (40,44):
              look=aim(pos,mid,yt,50,fov)
              res={}; bad=False
              for k,p in figs.items():
                hy=0.85 if k in sit else HY.get(k,1.3)
                s=scr(pos,look,fov,(p[0],p[1]+hy,p[2]))
                if not s: bad=True; break
                res[k]=s
              if bad: continue
              sc=0
              for k,(a,b) in want.items():
                v=res[k][0]; sc-= max(0,a-v)+max(0,v-b)
                sc-= max(0,30-res[k][1])+max(0,res[k][1]-50)
                if dist and k in dist: sc-=5*abs(res[k][2]-dist[k])
              xsv=[r[0] for r in res.values() if 0<r[0]<100]
              sep=min([abs(a-b) for a,b in itertools.combinations(xsv,2)] or [99])
              sc+=min(sep,10)
              best.append((round(sc,1),pos,[round(v,2) for v in look],fov,{k:(round(v[0]),round(v[1]),round(v[2],1)) for k,v in res.items()}))
    best.sort(key=lambda b:-b[0])
    for b in best[:top]: print(b)
