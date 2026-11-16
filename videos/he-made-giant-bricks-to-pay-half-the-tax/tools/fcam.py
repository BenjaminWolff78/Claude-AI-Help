import math
ORBIT=0.0019
KEY_NUDGE=[96,214,366,672,786,849,1182,1470,1563,1600]
def smooth(x):
    x=max(0,min(1,x)); return x*x*(3-2*x)
def F(c,f0,f,rate=0.0018):
    pos,look,fov=c
    r2=min(0.0035,rate*1.8); k=1-r2*max(0,f-f0)
    p0=[look[i]+(pos[i]-look[i])*k for i in range(3)]
    side=1 if (f0//7)%2 else -1
    a=side*0.12*math.tanh(ORBIT*max(0,f-f0)/0.12)
    dx=p0[0]-look[0]; dz=p0[2]-look[2]; ca=math.cos(a); sa=math.sin(a)
    tr=0
    for i,n in enumerate(KEY_NUDGE):
        if f0<=n<=f+12: tr+=(1 if i%2 else -1)*0.075*smooth((f-(n-4))/10)
    fl=math.hypot(dx,dz) or 1; rx=-dz/fl; rz=dx/fl
    return ([look[0]+dx*ca-dz*sa+rx*tr,p0[1],look[2]+dx*sa+dz*ca+rz*tr],[look[0]+rx*tr,look[1],look[2]+rz*tr],fov)
