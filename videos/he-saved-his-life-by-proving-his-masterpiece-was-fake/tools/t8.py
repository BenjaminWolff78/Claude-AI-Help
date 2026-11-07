exec(open('tools/t6.py').read().split("OFF=")[0])
OFF=[0.75,0,-1.25]; P=[1.75,0,-0.85]
A=fit([body(OFF,0,2.15,0.5),([P[0],0,P[2]],0.95,2.15,0.55)],20,7,44,0.86,0.05,0.05); chk('6A',A,hall)
for nm,p in [('porter',[2.3,1.0,1.05]),('porterHead',[2.3,1.9,1.05]),('cartRear',[2.0,1.5,1.9]),('cartRearLow',[2.0,0.6,1.9])]: print(nm,proj(A[0],A[1],20,7,44,p))
CA=[3.3,0,1.9]
B=fit([(CA,0.2,2.7,0.6),body([2.3,0,1.05],0,2.05,0.35)],-75,8,44,0.85,0,0); chk('6B',B,hall); print(B)
for nm,p in [('cart rear',[2.0,1.5,1.9]),('cart end',[6.2,1.5,1.75]),('porter',[2.3,1.0,1.05]),('porterEnd',[4.0,1.0,0.9]),('cartEndRear',[3.9,2.6,1.75])]: print('  ',nm,proj(B[0],B[1],-75,8,44,p))
