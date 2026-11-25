# Thin a Poly Haven tree glTF for the renderer: big foliage primitives (twigs / leaves) keep a random share of their
# connected clusters (each cluster scaled about its centre to keep the crown full); everything else is kept as is.
# usage: python3 -I decimate_tree.py SRC_DIR NAME OUT_DIR OUTNAME KEEP [SCALE] [NODES]
#   KEEP  share of foliage clusters kept (0.03 = 3%)   SCALE  cluster scale (default 1.0)   NODES comma list of node names
import json, sys, os, numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

src, name, out, oname, keep = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5])
scale = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
only = sys.argv[7].split(',') if len(sys.argv) > 7 else None
g = json.load(open(os.path.join(src, name + '.gltf')))
binp = os.path.join(src, g['buffers'][0]['uri'])
B = np.memmap(binp, dtype=np.uint8, mode='r')
CT = {5126: (np.float32, 4), 5125: (np.uint32, 4), 5123: (np.uint16, 2), 5121: (np.uint8, 1)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}

def read(ai):
    a = g['accessors'][ai]; bv = g['bufferViews'][a['bufferView']]
    dt, sz = CT[a['componentType']]; n = NC[a['type']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride', sz * n)
    if stride == sz * n:
        arr = np.frombuffer(B[off: off + a['count'] * stride].tobytes(), dtype=dt).reshape(a['count'], n)
    else:
        raw = np.frombuffer(B[off: off + a['count'] * stride].tobytes(), dtype=np.uint8).reshape(a['count'], stride)[:, : sz * n]
        arr = np.frombuffer(raw.tobytes(), dtype=dt).reshape(a['count'], n)
    return arr, a

out_bin = bytearray(); views = []; accs = []
def push(arr, a_src, target):
    arr = np.ascontiguousarray(arr)
    while len(out_bin) % 4: out_bin.append(0)
    off = len(out_bin); out_bin.extend(arr.tobytes())
    views.append({'buffer': 0, 'byteOffset': off, 'byteLength': arr.nbytes, 'target': target})
    a = {'bufferView': len(views) - 1, 'componentType': a_src['componentType'], 'count': int(arr.shape[0]), 'type': a_src['type']}
    if a_src.get('normalized'): a['normalized'] = True
    if a_src['type'] == 'VEC3' and arr.dtype == np.float32:
        a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
    accs.append(a); return len(accs) - 1

rng = np.random.default_rng(7)
meshes = []
stats = []
for m in g['meshes']:
    prims = []
    for p in m['primitives']:
        pos, pa = read(p['attributes']['POSITION'])
        idx, ia = read(p['indices']); idx = idx.reshape(-1, 3).astype(np.int64)
        attrs = {k: read(v) for k, v in p['attributes'].items()}
        nv = pos.shape[0]
        mname = g['materials'][p['material']].get('name', '') if 'material' in p else ''
        if nv > 200000 and keep < 1 and ('twig' in mname or 'lea' in mname):
            e0 = np.concatenate([idx[:, 0], idx[:, 1], idx[:, 2]]); e1 = np.concatenate([idx[:, 1], idx[:, 2], idx[:, 0]])
            G = coo_matrix((np.ones(e0.size, dtype=np.int8), (e0, e1)), shape=(nv, nv))
            nc, lab = connected_components(G, directed=False)
            kc = rng.random(nc) < keep
            tri_keep = kc[lab[idx[:, 0]]]
            vk = kc[lab]
            # scale each kept cluster about its centre
            if scale != 1.0:
                P = pos.astype(np.float64)
                cnt = np.bincount(lab, minlength=nc).astype(np.float64)
                cen = np.stack([np.bincount(lab, weights=P[:, i], minlength=nc) for i in range(3)], 1) / np.maximum(cnt, 1)[:, None]
                P = cen[lab] + (P - cen[lab]) * scale
                attrs['POSITION'] = (P.astype(np.float32), pa)
            stats.append((m.get('name'), nv, nc, int(vk.sum())))
        else:
            tri_keep = np.ones(idx.shape[0], bool); vk = np.zeros(nv, bool); vk[np.unique(idx)] = True
        remap = -np.ones(nv, np.int64); remap[vk] = np.arange(int(vk.sum()))
        nidx = remap[idx[tri_keep]].astype(np.uint32).reshape(-1)
        np_ = {'attributes': {}, 'indices': None}
        for k, (arr, a) in attrs.items():
            np_['attributes'][k] = push(arr[vk], a, 34962)
        np_['indices'] = push(nidx.reshape(-1, 1), {'componentType': 5125, 'type': 'SCALAR'}, 34963)
        if 'material' in p: np_['material'] = p['material']
        if 'mode' in p: np_['mode'] = p['mode']
        prims.append(np_)
    meshes.append({'name': m.get('name', ''), 'primitives': prims})

o = dict(g)
o['meshes'] = meshes; o['accessors'] = accs; o['bufferViews'] = views
o['buffers'] = [{'uri': oname + '.bin', 'byteLength': len(out_bin)}]
if only:
    keepn = [i for i, nd in enumerate(g['nodes']) if nd.get('name') in only]
    for sc in o['scenes']: sc['nodes'] = [i for i in sc['nodes'] if i in keepn]
os.makedirs(out, exist_ok=True)
import shutil
if os.path.isdir(os.path.join(src, 'textures')) and not os.path.isdir(os.path.join(out, 'textures')): shutil.copytree(os.path.join(src, 'textures'), os.path.join(out, 'textures'))
open(os.path.join(out, oname + '.bin'), 'wb').write(out_bin)
json.dump(o, open(os.path.join(out, oname + '.gltf'), 'w'))
print(oname, 'MB', round(len(out_bin) / 1e6, 1), 'foliage', stats)
