import math
def proj(cam, D, az, el, fov, p):
    a,e=math.radians(az),math.radians(el)
    fw=[-math.sin(a)*math.cos(e),-math.sin(e),-math.cos(a)*math.cos(e)]
    rl=math.hypot(fw[0],fw[2]); rt=[-fw[2]/rl,0,fw[0]/rl]
    up=[rt[1]*fw[2]-rt[2]*fw[1],rt[2]*fw[0]-rt[0]*fw[2],rt[0]*fw[1]-rt[1]*fw[0]]
    r=[p[i]-cam[i] for i in range(3)]; z=sum(r[i]*fw[i] for i in range(3))
    tv=math.tan(math.radians(fov)/2); th=tv*1080/1920
    x=sum(r[i]*rt[i] for i in range(3))/z/th; y=sum(r[i]*up[i] for i in range(3))/z/tv
    return round(x,2),round(y,2),round(z,2)
OFF=[0.75,0,-1.25]; P=[1.75,0,-0.85]
A=fit([body(OFF,0,2.15,0.5),([P[0],0,P[2]],0.95,2.15,0.55)],20,7,44,0.86,0.05,0.05); chk('6A',A,hall)
for nm,p in [('porter',[1.45,1.0,1.9]),('cartL',[1.9,1.5,1.9]),('cartC',[3.2,1.5,1.9])]: print(nm,proj(A[0],A[1],20,7,44,p))
CA=[3.2,0,1.9]
for az in (-35,-45,-55):
  for fov in (40,46):
    B=fit([(CA,0.2,2.7,1.35),body([1.45,0,1.9],0,2.05,0.35)],az,8,fov,0.86,0,0); chk(f'6B{az}/{fov}',B,hall)
    for nm,p in [('nazi',[0.75,1.5,-1.25]),('cartEnd',[4.6,1.5,1.8]),('door',[5,1.5,1.7])]: print('  ',nm,proj(B[0],B[1],az,8,fov,p))
