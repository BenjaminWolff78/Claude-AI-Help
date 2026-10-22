"""Render stills at given seconds and tile them: python3 stills.py out.jpg 0,5,10 [cols]"""
import asyncio, sys, time, os
from playwright.async_api import async_playwright
from PIL import Image
OUT, TIMES = sys.argv[1], [float(x) for x in sys.argv[2].split(',')]
COLS = int(sys.argv[3]) if len(sys.argv) > 3 else 3
ARGS = ['--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///root/sun/sun.html')
        try: await pg.evaluate('window.ready')
        except Exception as e: print('READY FAIL', e)
        ims = []
        os.makedirs('/root/sun/stills', exist_ok=True)
        for t in TIMES:
            t0 = time.time()
            try: await pg.evaluate(f'renderFrame({round(t*60)})')
            except Exception as e: print('ERR', t, e); continue
            path = f'/root/sun/stills/s{t:07.2f}.png'
            await pg.screenshot(path=path)
            print(f't={t} {time.time()-t0:.2f}s', flush=True)
            ims.append(Image.open(path).convert('RGB').resize((640, 360)))
        for e in errs[:10]: print('CONSOLE', e[:400])
        await b.close()
    if ims:
        rows = (len(ims) + COLS - 1) // COLS
        sheet = Image.new('RGB', (640 * COLS, 360 * rows))
        for i, im in enumerate(ims): sheet.paste(im, ((i % COLS) * 640, (i // COLS) * 360))
        sheet.save(OUT, quality=88)
asyncio.run(main())
