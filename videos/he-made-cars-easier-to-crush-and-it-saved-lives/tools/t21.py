exec(open('tools/t6.py').read().split("OFF=")[0])
P=[0.35,1.55,-0.65]; SA=[-0.49,0,-0.4]; SB=[1.27,0,-0.45]; OF=[1.4,0,0.3]
for az,el,fov in [(2,6,50),(25,5,46),(35,5,44),(45,5,44)]:
  B=fit([body(SA),body(SB),body(OF),([P[0],0,P[2]+0.2],1.0,2.1,0.55)],az,el,fov,0.86,0,0.1)
  hgt=lambda p: (proj(B[0],B[1],az,el,fov,[p[0],2.05,p[2]])[1]-proj(B[0],B[1],az,el,fov,[p[0],0,p[2]])[1])/2
  print(az,B[0],B[1],' heights SA %.2f SB %.2f OF %.2f'%(hgt(SA),hgt(SB),hgt(OF)), 'x', [proj(B[0],B[1],az,el,fov,[p[0],1.2,p[2]])[0] for p in (SA,SB,OF)])
