exec(open('tools/t6.py').read().split("OFF=")[0])
exec(open('tools/t12.py').read().split("print('---- reporter")[0].split("for dx,dz")[0])
r2=[pf[0]+0.95,0,pf[2]-0.25]
A=fit([([EVc[0],0,EVc[2]],EVc[1]-0.66,EVc[1]+0.66,0.6),body(pf,0,2.3,0.45),body(r2,0,2.45,0.42)],30,6,44,0.9,0.1,0.05)
rt=[math.cos(math.radians(24)),0,-math.sin(math.radians(24))]; pp=[r2[0]+rt[0]*0.55,0,r2[2]+rt[2]*0.55]
R=fit([body(r2,0.9,2.45,0.42),(pp,1.2,2.1,0.38)],24,3,38,0.9,0)
C=fit([body(pf,1.05,2.35,0.42)],22,2,34,0.88)
print('pf',pf,'r2',r2)
for g in [[0.8,0,1.0],[1.3,0,-1.9],[0.9,0,-2.2],[-0.2,0,-2.3],[1.6,0,-1.2]]:
  out=[]
  for nm,cam,az,el,fov in [('A',A,30,6,44),('R',R,24,3,38),('C',C,22,2,34)]:
    out.append((nm,[proj(cam[0],cam[1],az,el,fov,[g[0]+e*0.87,1.5,g[2]-e*0.5]) for e in (-0.35,0.35)]))
  print(g,out)
