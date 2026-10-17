// Render Still compositions to PNG. Usage: node scripts/stills.mjs out/brand BrandPfp BrandBanner ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [outDir, ...ids] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const browserExecutable = process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), onProgress: () => {}});
const browser = await openBrowser('chrome', {browserExecutable});
for (const id of ids) {
  const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser});
  await renderStill({composition, serveUrl, output: path.join(outDir, id + '.png'), imageFormat: 'png', puppeteerInstance: browser});
  console.log('ok', id);
}
await browser.close({silent: true});
