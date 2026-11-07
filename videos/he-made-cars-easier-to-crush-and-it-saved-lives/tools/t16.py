exec(open('tools/t6.py').read().split("OFF=")[0])
rv=[-1.52,1.6,-2.76]
for px in (-0.92,):
 for az,el in [(-4,8),(-8,8),(-12,8)]:
  pf=[px,0,-2.15]
  A=fit([body(pf,1.0,2.2,0.33),([rv[0],0,rv[2]],rv[1]-0.32,rv[1]+0.32,0.26)],az,el,36,0.88); chk(f'11 {px} {az}/{el}',A,studio)
  P=lambda p: proj(A[0],A[1],az,el,36,p)
  print('   rv L/R/bot',P([rv[0]-0.23,1.55,rv[2]]),P([rv[0]+0.23,1.55,rv[2]]),P([rv[0],1.26,rv[2]]),' head L',P([px-0.15,1.85,-2.15]),' canvL',P([-0.72,1.4,-1.24]),P([-0.72,1.0,-1.24]),' lamp',P([-1.43,1.25,-1.59]),' door',P([-1.7,1.5,-1.8]))
