import json, sys, importlib.util
spec = importlib.util.spec_from_file_location("pg", "/home/claude/p15/kit/previz_guard.py"); pg = importlib.util.module_from_spec(spec); spec.loader.exec_module(pg)
R = [json.loads(l) for l in open('/home/claude/p15/previz/frames.jsonl')]
for f in map(int, sys.argv[1:]):
    r = R[f]; B = pg.basis(r['cam'])
    print('f', f, r['shot'], 'subj', r.get('subj'), 'cam', [round(v, 2) for v in r['cam']['pos']], [round(v, 2) for v in r['cam']['look']], r['cam']['fov'])
    for c in r['cast']:
        q = pg.project(B, c['head']); print('   ', c['who'], 'head', [round(v, 2) for v in c['head']], 'proj', q and [round(v, 3) for v in q])
    for t in r['tags']:
        q = pg.project(B, t['pos']); print('   tag', t['name'], 'proj', q and [round(v, 3) for v in q])
