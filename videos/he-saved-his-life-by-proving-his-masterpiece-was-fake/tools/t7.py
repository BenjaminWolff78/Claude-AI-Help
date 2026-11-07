exec(open('tools/t6.py').read().split("OFF=")[0])
CA=[3.0,0,1.9]
for az in (-70,-80,-90):
  for fov in (44,):
    for pad in (0.8,0.9):
      B=fit([(CA,0.2,2.7,0.6),body([2.0,0,1.05],0,2.05,0.35)],az,8,fov,pad,0,0); chk(f'6B{az}/{pad}',B,hall)
      for nm,p in [('nazi',[0.75,1.5,-1.25]),('nazi feet',[0.75,0,-1.25]),('cart rear',[1.7,1.5,1.9]),('cart end',[4.8,1.5,1.8]),('porter',[2.0,1.0,1.05]),('porter2',[3.6,1.0,1.0]),('paintg',[1.75,1.55,-0.85])]: print('  ',nm,proj(B[0],B[1],az,8,fov,p))
