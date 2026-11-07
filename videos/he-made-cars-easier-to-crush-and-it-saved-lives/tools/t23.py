exec(open('tools/t6.py').read().split("OFF=")[0])
P=[0.35,1.55,-0.65]; SA=[-0.49,0,-0.4]
for SB in ([1.27,0,-0.45],[1.55,0,-0.6]):
 for OF in ([0.95,0,0.75],[0.85,0,0.95],[1.1,0,0.9]):
  B=fit([body(SA),body(SB),body(OF),([P[0],0,P[2]+0.2],1.0,2.1,0.55)],2,6,50,0.86,0,0.1)
  pr=lambda p:proj(B[0],B[1],2,6,50,[p[0],1.4,p[2]])[0]
  h=lambda p:(proj(B[0],B[1],2,6,50,[p[0],2.05,p[2]])[1]-proj(B[0],B[1],2,6,50,[p[0],0,p[2]])[1])/2
  print(SB,OF,B[0][2],'SA %.2f P %.2f SB %.2f OF %.2f | h SA %.2f SB %.2f OF %.2f'%(pr(SA),pr(P),pr(SB),pr(OF),h(SA),h(SB),h(OF)))
