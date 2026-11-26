import json, sys, numpy as np
# frames where a point in the old man's kitchen is on screen (inside the room, or seen through his west window)
pts = {k: np.array(v, float) for k, v in json.loads(sys.argv[1]).items()}
WY0, WY1 = 0.3 + 0.92 + 0.12, 0.3 + 0.92 + 1.05
def vis(pos, look, fov, P):
    pos = np.array(pos); f = np.array(look) - pos; f /= np.linalg.norm(f)
    r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, f)
    d = P - pos; z = d @ f
    if z <= 0.1: return False
    ty = np.tan(np.radians(fov / 2)); tx = ty * 9 / 16
    if abs(d @ r / z) > tx * 1.05 or abs(d @ u / z) > ty * 1.05: return False
    inside = 3.0 < pos[0] < 7.5 and -5.9 < pos[2] < -1.5
    if inside: return True
    if pos[0] < 3.0:
        t = (3.0 - pos[0]) / d[0] if d[0] > 0 else -1
        if 0 < t < 1:
            q = pos + t * d
            return -4.6 < q[2] < -3.2 and WY0 < q[1] < WY1
    return False
hits = {k: [] for k in pts}
for line in open('/home/claude/p13/camdump/cams.jsonl'):
    o = json.loads(line); f = o['f']
    for L in o['L']:
        for k, P in pts.items():
            if vis(L['pos'], L['look'], L['fov'], P): hits[k].append(f)
for k, fs in hits.items():
    ch = sorted(set((x // 80) * 80 for x in fs))
    print(k, len(fs), 'frames; chunks', ch)
    runs = []; 
    for x in fs:
        if runs and x - runs[-1][1] <= 1: runs[-1][1] = x
        else: runs.append([x, x])
    print('  runs', [(a, b) for a, b in runs])
