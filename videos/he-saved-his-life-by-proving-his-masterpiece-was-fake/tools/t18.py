exec(open('tools/t6.py').read().split("OFF=")[0])
for GA3 in ([-0.6,0,-0.38],[-0.9,0,-0.5],[-1.0,0,-0.3]):
  A=fit([([D[0],0,D[2]],1.25,1.9,0.3)],16,2,34,0.9,-0.0); chk('3A',A,court)
  rt=[math.cos(math.radians(16)),0,-math.sin(math.radians(16))]
  print('  GA',[proj(A[0],A[1],16,2,34,[GA3[0]+rt[0]*e,1.9,GA3[2]+rt[2]*e]) for e in (-0.33,0.33)])
  W=fit([body(D,0,2.35,0.42),body(GA3),body([0.8,0,1.0])],20,6,46,0.88,0,0.1); chk('  W3',W,court)
