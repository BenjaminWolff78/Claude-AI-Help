exec(open('tools/t6.py').read().split("OFF=")[0])
rv=[-1.33,1.55,-2.76]
for pz in (-2.15,):
 for px in (-0.95,-1.05):
  for az in (-12,0,8):
    pf=[px,0,pz]
    A=fit([body(pf,1.0,2.2,0.35),([rv[0],0,rv[2]],rv[1]-0.32,rv[1]+0.32,0.26)],az,2,36,0.86); chk(f'11 {px} {az}',A,studio)
    for nm,p in [('canvL',[-0.72,1.4,-1.24]),('canvR',[0.08,1.4,-1.24]),('easelTop',[-0.32,2.1,-1.3]),('table',[-1.15,1.0,-1.0]),('lamp',[-1.6,1.3,-1.4])]: print('   ',nm,proj(A[0],A[1],az,2,36,p))
