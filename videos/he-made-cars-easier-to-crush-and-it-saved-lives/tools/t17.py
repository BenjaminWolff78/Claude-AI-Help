exec(open('tools/t6.py').read().split("OFF=")[0])
GA3=[-0.6,0,-0.38]; GB3=[0.8,0,1.0]
for az in (16,0,-10,30):
  A=fit([([D[0],0,D[2]],1.35,1.75,0.68)],az,2,34,0.9); chk(f'3A{az}',A,court)
  rt=[math.cos(math.radians(az)),0,-math.sin(math.radians(az))]
  for nm,g in [('GA',GA3),('GB',GB3)]:
    print('   ',nm,[proj(A[0],A[1],az,2,34,[g[0]+rt[0]*e,1.6,g[2]+rt[2]*e]) for e in (-0.33,0.33)])
