exec(open('tools/t6.py').read().split("OFF=")[0])
OFF=[0.75,0,-1.25]; P=[1.75,0,-0.85]
for az in (-10,-20,-30):
  A=fit([body(OFF,0,2.15,0.5),([P[0],0,P[2]],0.95,2.15,0.55)],az,7,44,0.86,0.05,0.05); chk(f'6A{az}',A,hall)
  for nm,p in [('porter',[2.3,1.0,1.05]),('porterHead',[2.6,1.9,1.05]),('cartRear',[2.0,1.5,1.9]),('cartRearLow',[2.0,0.6,1.9]),('nazi',[0.75,1.5,-1.25]),('paint',[1.75,1.55,-0.85])]: print('  ',nm,proj(A[0],A[1],az,7,44,p))
