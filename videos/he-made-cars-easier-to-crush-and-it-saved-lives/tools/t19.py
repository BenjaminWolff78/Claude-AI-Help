exec(open('tools/t6.py').read().split("OFF=")[0])
P=[0.35,1.55,-0.65]; SA=[-0.27,0,-0.4]; SB=[1.05,0,-0.45]; OF=[1.4,0,0.3]
for nm,boxes,az in [('old',[([P[0],0,P[2]+0.25],1.15,2.0,0.45),body(OF,1.3,2.2,0.3)],12),('slip+of',[([P[0],0,P[2]+0.25],1.42,1.82,0.24),body(OF,1.3,2.2,0.3)],12),('slip+of az20',[([P[0],0,P[2]+0.25],1.42,1.82,0.24),body(OF,1.3,2.2,0.3)],20)]:
  C=fit(boxes,az,2,38,0.9,0.1); chk(nm,C,mine)
  rt=[math.cos(math.radians(az)),0,-math.sin(math.radians(az))]
  for n2,g in [('SA',SA),('SB',SB),('OF',OF)]: print('   ',n2,[proj(C[0],C[1],az,2,38,[g[0]+rt[0]*e,1.6,g[2]+rt[2]*e]) for e in (-0.33,0.33)])
  print('    slip w', proj(C[0],C[1],az,2,38,[P[0]-0.21,1.6,P[2]+0.25]), proj(C[0],C[1],az,2,38,[P[0]+0.21,1.6,P[2]+0.25]))
