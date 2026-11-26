"""List camera positions (cams.jsonl) inside solid parts of the drip set: house walls (minus the window/door holes),
partitions, counters, the fence, roofs. Prints frame runs per obstacle."""
import json, sys
rows=[json.loads(l) for l in open(sys.argv[1])]
FLR=0.3; CT=FLR+0.92; H=3.0
B=[]  # (name, x0,x1, y0,y1, z0,z1)
def box(n,x0,x1,y0,y1,z0,z1): B.append((n,min(x0,x1),max(x0,x1),min(y0,y1),max(y0,y1),min(z0,z1),max(z0,z1)))
for nm,(x0,x1,z0,z1) in {'old':(3,11,-6,0),'nbr':(-11,-3,-6,0)}.items():
    m=0.12
    box(nm+' back wall',x0,x1,0,H,z0-m,z0+m); box(nm+' front wall',x0,x1,0,H,z1-m,z1+m)
    for x in (x0,x1):
        kit = (nm=='old' and x==3) or (nm=='nbr' and x==-3)
        if kit:  # the kitchen wall with the window z -4.6..-3.2, y WIN_Y0..WIN_Y1
            box(nm+' kitchen wall',x-m,x+m,0,H,z0,-4.6); box(nm+' kitchen wall',x-m,x+m,0,H,-3.2,z1)
            box(nm+' kitchen wall (sill)',x-m,x+m,0,CT+0.12,-4.6,-3.2); box(nm+' kitchen wall (head)',x-m,x+m,CT+1.05,H,-4.6,-3.2)
        else: box(nm+' side wall',x-m,x+m,0,H,z0,z1)
    box(nm+' roof',x0-0.45,x1+0.45,H-0.25,H+1.6,z0-0.45,z1+0.45)
box('old counter',3.05,3.75,0,CT+0.02,-5.72,-1.98); box('nbr counter',-3.75,-3.05,0,CT+0.02,-5.72,-1.98)
box('old tap',3.08,3.47,CT,CT+0.5,-3.95,-3.85); box('nbr tap',-3.36,-3.08,CT,CT+0.36,-4.15,-3.65)
box('fence',-0.08,0.08,0,1.06,-6,2)
box('old partition x7.5',7.42,7.58,FLR,H,-6,-1.5); box('old partition z-1.5',3,7.5,FLR,H,-1.58,-1.42)
box('nbr partition x-7.5',-7.58,-7.42,FLR,H,-6,-1.5); box('nbr partition z-1.5',-7.5,-3,FLR,H,-1.58,-1.42)
box('old table',4.8,6.0,0,FLR+0.8,-3.9,-2.9)
hits={}
for r in rows:
    for L in r['L']:
        x,y,z=L['pos']
        for n,x0,x1,y0,y1,z0,z1 in B:
            if x0<x<x1 and y0<y<y1 and z0<z<z1: hits.setdefault(n,[]).append(r['n'])
for n,fs in hits.items():
    runs=[];s=p=None
    for f in fs:
        if s is None or f!=p+1:
            if s is not None: runs.append((s,p))
            s=f
        p=f
    runs.append((s,p)); print(n, runs)
print('checked', len(rows), 'frames;', 'no hits' if not hits else f'{len(hits)} obstacles hit')
