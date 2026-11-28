import json,math,sys
import numpy as np
R=[json.loads(l) for l in open(sys.argv[1])]
P=json.load(open(sys.argv[2]))
cuts={round(s['t0']*30) for s in P['shots'] if s['in']['type'] in ('cut','dissolve')}
def basis(c):
    p=np.array(c['pos'],float); f=np.array(c['look'],float)-p; f/=np.linalg.norm(f)
    th=math.tan(math.radians(c['fov'])/2); return p,f,th*9/16
def spd(a,b):
    pa,fa,twa=basis(a); pb,fb,_=basis(b)
    ang=math.degrees(math.acos(max(-1,min(1,float(fa@fb))))); hfov=math.degrees(2*math.atan(twa)); rot=ang/hfov*720
    dist=max(0.3,float(np.linalg.norm(np.array(a['look'])-pa))); dp=pb-pa; lat=float(np.linalg.norm(dp-(dp@fa)*fa))
    return rot+lat/(2*dist*twa)*720+abs(b['fov']-a['fov'])/a['fov']*360+abs(float(dp@fa))/dist*360
runs=[];cur=None
for i in range(1,len(R)):
    f=R[i]['f']
    if f in cuts: continue
    s=spd(R[i-1]['cam'],R[i]['cam'])
    if s>40:
        if cur and f==cur[1]+1: cur[1]=f; cur[3]=max(cur[3],s)
        else:
            if cur: runs.append(cur)
            cur=[f,f,R[i]['shot'],s]
if cur: runs.append(cur)
for r in runs: print('speed',r[0],r[1],r[2],round(r[3]))
