import numpy as np, sys, json
def proj(pos, look, fov, X):
    pos=np.array(pos,float); f=np.array(look,float)-pos; f/=np.linalg.norm(f); r=np.cross(f,[0,1,0]); r/=np.linalg.norm(r); u=np.cross(r,f)
    d=np.array(X,float)-pos; z=d@f; ty=np.tan(np.radians(fov/2)); tx=ty*9/16
    return round(0.5+0.5*(d@r)/z/tx,3), round(0.5-0.5*(d@u)/z/ty,3), round(z,2)   # x 0..1 left->right, y 0..1 top->bottom
if __name__=='__main__':
    cam=json.loads(sys.argv[1]); pts=json.loads(sys.argv[2])
    for k,X in pts.items(): print(k, proj(cam['pos'],cam['look'],cam['fov'],X))
