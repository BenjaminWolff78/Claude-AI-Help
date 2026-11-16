import math
from frame import scr
HEAD=0.52
def frameOn(head,yaw,hw,xp=50,fov=52,dy=0.2,eyeY=0.4):
    th=math.tan(math.radians(fov/2)); d=HEAD/(hw*2*0.5625*th); a=math.radians(yaw)
    bx,bz=math.sin(a),math.cos(a); rx,rz=math.cos(a),-math.sin(a)
    pos=(head[0]+bx*d,head[1]+dy,head[2]+bz*d)
    off=(xp-50)/50*th*0.5625*d; vy=(0.5-eyeY)*2*th*d
    return pos,(head[0]-rx*off,head[1]-vy,head[2]-rz*off),fov
def chk(cam,pts):
    P,L,F=cam; return {k:[round(v) for v in scr(P,L,F,q)] for k,q in pts.items()}
def frameTwo(A,B,yaw,xa,xb,fov=52,dy=0.25,eyeY=0.42):
    a=math.radians(yaw); rx,rz=math.cos(a),-math.sin(a); bx,bz=math.sin(a),math.cos(a); th=math.tan(math.radians(fov/2))*0.5625
    sep=(B[0]-A[0])*rx+(B[2]-A[2])*rz; ddep=-((B[0]-A[0])*bx+(B[2]-A[2])*bz)
    lo,hi=0.6,30
    for _ in range(50):
        dA=(lo+hi)/2; dB=dA+ddep; lA=-((50-xa)/50)*th*dA; xbN=50+50*((lA+sep)/(th*max(0.2,dB)))
        if (xbN-xa)/(xb-xa)>1: lo=dA
        else: hi=dA
    dA=(lo+hi)/2; lA=-((50-xa)/50)*th*dA
    cx=A[0]-rx*lA+bx*dA; cz=A[2]-rz*lA+bz*dA; my=(A[1]+B[1])/2
    D=max(0.8,dA+ddep/2); vy=(0.5-eyeY)*2*math.tan(math.radians(fov/2))*D
    return (cx,my+dy,cz),(cx-bx*D,my-vy,cz-bz*D),fov
