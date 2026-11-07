from fit import *
import math
add=lambda a,dx,dy,dz:[a[0]+dx,a[1]+dy,a[2]+dz]
# court marks
EX,EZ,EY,EYAW=-2.35,-1.25,1.55,0.55; EV=[EX+math.sin(EYAW)*0.08,EY,EZ+math.cos(EYAW)*0.08]
PX,PZ,PYAW=-2.25,1.55,0.55; PROOF=[PX+math.sin(PYAW)*0.08,1.38,PZ+math.cos(PYAW)*0.08]; PP=[PX+0.72,0,PZ+0.32]
D=[0,0.1,0.3]; J=[0,0.45,-3.85]; GA=[-1.05,0,-0.45]; GB=[1.15,0,1.05]; r1=[3.0,0,-0.6]; r2=[3.8,0,0.9]
LBX,LBZ=-3.55,-0.2; sciA=[LBX+0.55,0,LBZ+0.75]; sciB=[LBX-0.65,0,LBZ+0.7]; LAB=[LBX,0.9,LBZ]
pub2=[-2.1,0,3.3]
court=lambda p:(-5.8<p[0]<5.8 and -4.8<p[2]<5.8 and p[1]<5.6)
CX,CZ=0.35,-0.7; Pm=[CX,1.55,CZ+0.05]; s1=[CX-0.95,0,CZ+0.55]; s2=[CX+1.05,0,CZ+0.35]; OF=add([CX,0.62,CZ],1.35,-0.62,0.95)
mine=lambda p:(-2.3<p[0]<2.3 and p[2]<2.9 and p[1]<3.2)
# studio
EXs,EZs,EYs=-0.32,-1.32,1.38; CV=[EXs,EYs,EZs+0.08]; OX0,OX1,OZ1=0.7,1.9,-1.75; OXC=1.3
RX0,RX1,RZ,RY=0.5,1.5,-1.0,0.98; PAINT=[0.36,0,-1.0]; OVEN=[OX0-0.22,0,-1.4]; ROLL=[RX1+0.3,0,RZ-0.32]; BOARD=[-0.75,0,-1.95]; READ=[-0.62,0,-0.55]; BIN=[-0.98,0,-0.55]
OVD=[OXC,0.78,OZ1]; PIPE=[1.0,RY,RZ]; REVIEW=[-1.33,1.55,-2.76]
studio=lambda p:(abs(p[0])<3.4 and -2.6<p[2]<3.4 and p[1]<3.6-0.667*abs(p[0])-0.15)
# museum
MPZ=-4.38; MP=[0,2.35,MPZ]; EXP=[-0.55,0,-2.45]; DIR=[1.35,0,-2.2]; PM=[2.4,0,-0.9]; H2=[-2.1,2.35,MPZ]; H3=[2.1,2.35,MPZ]
museum=lambda p:(abs(p[0])<4.3 and -4.3<p[2]<4.8 and p[1]<4.8)
OFF=[0.75,0,-1.25]; HP=[1.75,1.55,-0.85]
hall=lambda p:(abs(p[0])<4.8 and -4.3<p[2]<4.8 and p[1]<5.8)
def chk(name,res,ok): print(f"{name:8s} pos {res[0]} D {res[1]} {'OK' if ok(res[0]) else 'OUTSIDE!'}")
import sys
exec(open(sys.argv[1]).read())
