exec(open('tools/t6.py').read().split("OFF=")[0])
EVc=[-2.35+math.sin(0.55)*0.08,1.55,-1.25+math.cos(0.55)*0.08]
pf=[EVc[0]+1.25,0,EVc[2]+0.75]
for dx,dz in [(0.95,-0.25),(1.0,0.1)]:
  r2=[pf[0]+dx,0,pf[2]+dz]
  A=fit([([EVc[0],0,EVc[2]],EVc[1]-0.66,EVc[1]+0.66,0.6),body(pf,0,2.3,0.45),body(r2,0,2.45,0.42)],30,6,44,0.9,0.1,0.05); chk(f'10A {dx},{dz}',A,court)
  print('   r2 in A',proj(A[0],A[1],30,6,44,[r2[0],1.5,r2[2]]),'pf',proj(A[0],A[1],30,6,44,[pf[0],1.5,pf[2]]))
  rt=[math.cos(math.radians(24)),0,-math.sin(math.radians(24))]
  pp=[r2[0]+rt[0]*0.5,0,r2[2]+rt[2]*0.5]
  for az in (24,10):
    R=fit([body(r2,0.9,2.45,0.42),body(pf,0.9,2.3,0.3),(pp,1.1,2.1,0.4)],az,3,40,0.88,0); chk(f'  R{az}',R,court)
    print('     pf',proj(R[0],R[1],az,3,40,[pf[0],1.6,pf[2]]),'r2',proj(R[0],R[1],az,3,40,[r2[0],1.6,r2[2]]))
print('---- reporter+paper only')
r2=[pf[0]+0.95,0,pf[2]-0.25]
for az in (24,40):
  rt=[math.cos(math.radians(az)),0,-math.sin(math.radians(az))]
  pp=[r2[0]+rt[0]*0.55,0,r2[2]+rt[2]*0.55]
  R=fit([body(r2,0.9,2.45,0.42),(pp,1.2,2.1,0.38)],az,3,38,0.9,0); chk(f'  R{az}',R,court)
  for y in (1.2,2.2):
    print('    pf edgeR',proj(R[0],R[1],az,3,38,[pf[0]+rt[0]*0.35,y,pf[2]+rt[2]*0.35]),'pf edgeL',proj(R[0],R[1],az,3,38,[pf[0]-rt[0]*0.35,y,pf[2]-rt[2]*0.35]))
print('---- CU')
for az in (22,10,0):
  C=fit([body(pf,1.05,2.35,0.42)],az,2,34,0.88); chk(f' C{az}',C,court)
  rt=[math.cos(math.radians(az)),0,-math.sin(math.radians(az))]
  for y in (1.2,2.2): print('   r2 edgeL',proj(C[0],C[1],az,2,34,[r2[0]-rt[0]*0.4,y,r2[2]-rt[2]*0.4]), 'edgeR', proj(C[0],C[1],az,2,34,[r2[0]+rt[0]*0.4,y,r2[2]+rt[2]*0.4]))
