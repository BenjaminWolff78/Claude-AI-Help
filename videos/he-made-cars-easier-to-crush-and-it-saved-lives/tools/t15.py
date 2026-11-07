exec(open('tools/t6.py').read().split("OFF=")[0])
rv=[-1.53,1.55,-2.76]
for px,pz in [(-0.95,-2.15),(-0.85,-2.0),(-0.8,-1.95)]:
  for az in (-15,-25):
    pf=[px,0,pz]
    A=fit([body(pf,1.0,2.2,0.35),([rv[0],0,rv[2]],rv[1]-0.32,rv[1]+0.32,0.26)],az,2,36,0.86); chk(f'11 {px} {az}',A,studio)
    rt=[math.cos(math.radians(az)),0,-math.sin(math.radians(az))]
    print('   rvR',proj(A[0],A[1],az,2,36,[rv[0]+0.26,1.6,rv[2]]),'pfL',proj(A[0],A[1],az,2,36,[px-rt[0]*0.33,1.6,pz-rt[2]*0.33]),'canvL',proj(A[0],A[1],az,2,36,[-0.72,1.4,-1.24]),'easelLeg',proj(A[0],A[1],az,2,36,[-0.75,0.6,-1.1]))
