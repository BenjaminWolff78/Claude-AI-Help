# Poly Haven CC0 assets for the bread-syrup video (1k) into the shared store /home/claude/p10/app/public/ph
import json, os, sys, urllib.request, concurrent.futures as cf
UA = {'User-Agent': 'Mozilla/5.0 (asset-fetch)'}
OUT = '/home/claude/p10/app/public/ph/'
API = 'https://api.polyhaven.com/files/'
def op(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120)
def get(url, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not os.path.exists(path):
        data = op(url).read(); open(path + '.part', 'wb').write(data); os.rename(path + '.part', path)
def model(name, res='1k'):
    f = json.load(op(API + name))['gltf'][res]['gltf']
    base = OUT + f'models/{name}/'
    get(f['url'], base + name + '.gltf')
    for rel, inc in f['include'].items(): get(inc['url'], base + rel)
    return name
def texture(name, res='1k'):
    f = json.load(op(API + name)); got = []
    for key, alias in [('Diffuse', 'diff'), ('nor_gl', 'nor'), ('Rough', 'rough'), ('AO', 'ao')]:
        if key in f and res in f[key]:
            j = f[key][res].get('jpg') or f[key][res].get('png')
            get(j['url'], OUT + f'tex/{name}_{alias}.jpg'); got.append(alias)
    return name + ':' + ','.join(got)
def hdri(name, res='1k'):
    f = json.load(op(API + name))['hdri'][res]['hdr']
    get(f['url'], OUT + f'hdri/{name}_{res}.hdr'); return name
M = sys.argv[1].split(',') if len(sys.argv) > 1 and sys.argv[1] else []
T = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[2] else []
H = sys.argv[3].split(',') if len(sys.argv) > 3 and sys.argv[3] else []
jobs = [(model, n) for n in M] + [(texture, n) for n in T] + [(hdri, n) for n in H]
with cf.ThreadPoolExecutor(6) as ex:
    futs = {ex.submit(fn, n): n for fn, n in jobs}
    for fu in cf.as_completed(futs):
        try: print('ok', fu.result())
        except Exception as e: print('FAIL', futs[fu], e)
