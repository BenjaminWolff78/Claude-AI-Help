exec(open('tools/t6.py').read().split("OFF=")[0])
for rx in (-1.42,-1.38):
 rv=[rx,1.6,-2.76]
 for px in (-0.82,-0.78):
  for az in (-8,-11):
    pf=[px,0,-2.15]
    A=fit([body(pf,1.0,2.2,0.33),([rv[0],0,rv[2]],rv[1]-0.32,rv[1]+0.32,0.26)],az,8,36,0.88); 
    P=lambda p: proj(A[0],A[1],az,8,36,p)
    print(rx,px,az,A[0],'rvL',P([rx-0.23,1.6,-2.76])[0],'wardR',P([-1.7,1.6,-2.2])[0],'rvR',P([rx+0.23,1.6,-2.76])[0],'beretL',P([px-0.27,1.9,-2.15])[0],'canvL',P([-0.72,1.4,-1.24])[0])
