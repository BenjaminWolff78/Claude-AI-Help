s1=[CX-0.62,0,CZ+0.3]; s2=[CX+0.7,0,CZ+0.25]; OF=[CX+1.05,0,CZ+1.0]
for az in (0,10,20):
  for fov in (44,50):
    chk(f'2B{az}/{fov}',fit([body(s1),body(s2),body(OF),([Pm[0],0,Pm[2]+0.2],1.0,2.1,0.55)],az,6,fov,0.88,0,0.15),lambda p:(abs(p[0])<2.3 and p[2]<7.5))
chk('2C',fit([([Pm[0],0,Pm[2]+0.25],1.15,2.0,0.45),body(OF,1.3,2.2,0.3)],12,2,38,0.9,0.1),lambda p:(abs(p[0])<2.3 and p[2]<7.5))
H2=[-1.38,2.35,MPZ]; H3=[1.38,2.35,MPZ]; DIR=[0.95,0,-2.6]; PM=[1.75,0,-1.6]; EXP=[-0.55,0,-2.75]
for az in (0,8):
  chk(f'5B{az}',fit([body(EXP),body(DIR),body(PM),(H2,-0.6,0.6,0.5),(H3,-0.6,0.6,0.5)],az,5,46,0.88,0,0.1),museum)
for az in (10,20,30):
  chk(f'6A{az}',fit([body(OFF,0,2.15,0.5),([HP[0],0,HP[2]],0.95,2.15,0.55)],az,7,44,0.86,0.05,0.05),hall)
for fov in (46,50):
  chk(f'8B{fov}',fit([body(OVEN,0,2.15,0.35),(OVD,-0.45,0.6,0.6),([PIPE[0],0,PIPE[2]],0.5,1.6,0.5),body(ROLL,0,2.15,0.3)],8,6,fov,0.88,0,0.1),studio)
for az in (35,50,65):
  chk(f'9A{az}',fit([body(sciA),body(sciB),([LAB[0],0,LAB[2]],0.85,1.2,0.7),([EV[0],0,EV[2]],EV[1]-0.6,EV[1]+0.6,0.5)],az,6,46,0.88,0,0.1),court)
  chk(f'9A2{az}',fit([body(sciA),body(sciB),([LAB[0],0,LAB[2]],0.85,1.2,0.7)],az,6,44,0.88,0,0.1),court)
PF=add(EV,1.25,-EV[1],0.75)
for az in (20,30,40):
  chk(f'10A{az}',fit([([EV[0],0,EV[2]],EV[1]-0.66,EV[1]+0.66,0.6),body(PF,0,2.3,0.45)],az,6,44,0.9,0.1,0.05),court)
for az in (15,20,25):
  chk(f'3W{az}',fit([body(D,0,2.35,0.42),body([-0.75,0,-0.35]),body([0.95,0,0.95])],az,6,46,0.88,0,0.1),court)
for az in (-50,-60,-70):
  chk(f'3R{az}',fit([body(r1,0.5,2.6,0.5),body(r2,0.5,2.4,0.4)],az+180,4,40,0.86,-0.1,0.1),court)
