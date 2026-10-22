import asyncio, sys
from playwright.async_api import async_playwright
ARGS = ['--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
JS = sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
        await pg.goto('file:///root/sun/sun.html'); await pg.evaluate('window.ready')
        print(await pg.evaluate(JS))
        await b.close()
asyncio.run(main())
