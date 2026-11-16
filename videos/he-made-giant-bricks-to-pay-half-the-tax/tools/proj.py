import math
def proj(cam, look, fov, p):
    """screen coords of world point p: x -1..1 (left..right), y -1..1 (bottom..top), depth; 9:16 frame"""
    f=[look[i]-cam[i] for i in range(3)]; L=math.sqrt(sum(v*v for v in f)); f=[v/L for v in f]
    r=[-f[2],0,f[0]]; rl=math.hypot(r[0],r[2]); r=[r[0]/rl,0,r[2]/rl]
    # right = forward x up (three.js camera looking along f with up y): right = f x y = (-fz, 0, fx)?? check sign below
    u=[r[1]*f[2]-r[2]*f[1], r[2]*f[0]-r[0]*f[2], r[0]*f[1]-r[1]*f[0]]
    d=[p[i]-cam[i] for i in range(3)]; z=sum(d[i]*f[i] for i in range(3))
    tv=math.tan(math.radians(fov)/2); th=tv*9/16
    return round(sum(d[i]*r[i] for i in range(3))/z/th,2), round(-sum(d[i]*u[i] for i in range(3))/z/tv,2), round(z,2)
def show(name, cam, look, fov, pts):
    print(name)
    for k,p in pts.items():
        hx,hy,z=proj(cam,look,fov,(p[0],p[1]+1.7,p[2])); fx,fy,_=proj(cam,look,fov,(p[0],p[1],p[2]))
        print(f"  {k:10s} head x {hx:+.2f} y {hy:+.2f}  feet y {fy:+.2f}  depth {z:.1f}")
