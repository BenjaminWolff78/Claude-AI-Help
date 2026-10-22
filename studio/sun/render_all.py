"""Full capture in resumable 5-second chunks: frames -> PNG -> chunk mp4 (crf 14), PNGs removed.
python3 render_all.py [workers]   (out: /root/sun/chunks/c###.mp4)"""
import asyncio, sys, os, time, subprocess, shutil, json
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
FPS, N = 60, int(round(TL['meta']['dur'] * 60))
CH = 300
OUT = '/root/sun/chunks'; os.makedirs(OUT, exist_ok=True)
WORKERS = int(sys.argv[1]) if len(sys.argv) > 1 else 2
ARGS = ['--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
chunks = [c for c in range((N + CH - 1) // CH) if not os.path.exists(f'{OUT}/c{c:03d}.mp4')]
def encode(c, d):
    tmp = f'{OUT}/c{c:03d}.tmp.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-start_number', str(c * CH), '-i', f'{d}/f%05d.png',
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', str(FPS), tmp], check=True)
    os.replace(tmp, f'{OUT}/c{c:03d}.mp4'); shutil.rmtree(d)
async def worker(p, wid, queue):
    b = await p.chromium.launch(args=ARGS)
    pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
    await pg.goto('file:///root/sun/sun.html'); await pg.evaluate('window.ready')
    while queue:
        c = queue.pop(0); d = f'{OUT}/w{c:03d}'; os.makedirs(d, exist_ok=True)
        t0 = time.time()
        for f in range(c * CH, min(N, (c + 1) * CH)):
            fp = f'{d}/f{f:05d}.png'
            if os.path.exists(fp): continue
            await pg.evaluate(f'renderFrame({f})')
            await pg.screenshot(path=fp + '.tmp.png'); os.replace(fp + '.tmp.png', fp)
        await asyncio.to_thread(encode, c, d)
        print(f'w{wid} chunk {c} done in {time.time()-t0:.0f}s, {len(queue)} queued', flush=True)
    await b.close()
async def main():
    q = list(chunks)
    print(f'{len(q)} chunks to render of {(N + CH - 1) // CH}', flush=True)
    async with async_playwright() as p:
        await asyncio.gather(*[worker(p, i, q) for i in range(WORKERS)])
asyncio.run(main())
