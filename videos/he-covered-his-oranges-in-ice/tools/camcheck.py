import numpy as np, sys, json
def proj(pos, look, fov, pts, aspect=9/16):
    pos, look = np.array(pos, float), np.array(look, float); f = look - pos; f /= np.linalg.norm(f)
    r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, f)
    tv = np.tan(np.radians(fov / 2)); th = tv * aspect; out = {}
    for k, p in pts.items():
        v = np.array(p, float) - pos; z = v @ f
        out[k] = (round(float(v @ r / z / th), 2), round(float(v @ u / z / tv), 2), round(float(z), 2))
    return out
if __name__ == "__main__":
    a = json.loads(sys.argv[1]); print(proj(a["pos"], a["look"], a["fov"], a["pts"]))
