exec(open('tools/t6.py').read().split("OFF=")[0])
A=fit([body(PP,0,2.15,0.36),([PROOF[0],0,PROOF[2]],0.9,1.88,0.42)],26,5,40,0.84,0.05,0.05); chk('1A',A,court)
ga=[PROOF[0]+1.75,0,PROOF[2]-1.6]
for nm,p in [('guardA',ga),('judge',J),('pp',PP),('evid',EV),('dock',D)]:
  print(nm,[proj(A[0],A[1],26,5,40,[p[0]+dx,1.6,p[2]]) for dx in (-0.35,0.35)])
for dx,dz in [(0.2,-1.6),(-0.2,-1.6),(0.0,-2.2),(0.4,-2.4)]:
  g=[PROOF[0]+dx,0,PROOF[2]+dz]; print((dx,dz),g,[proj(A[0],A[1],26,5,40,[g[0]+e,1.6,g[2]]) for e in (-0.35,0.35)], proj(A[0],A[1],26,5,40,[g[0],0,g[2]]))
print('--- wider')
for az in (26,16):
  A2=fit([body(PP,0,2.15,0.36),([PROOF[0],0,PROOF[2]],0.9,1.88,0.42),body(ga,0,2.1,0.35)],az,5,40,0.86,0,0.05); chk(f'1A2 {az}',A2,court)
  for nm,p in [('guardA',ga),('pp',PP),('judge',J),('evid',EV)]: print('  ',nm,[proj(A2[0],A2[1],az,5,40,[p[0]+dx,1.6,p[2]]) for dx in (-0.35,0.35)])
