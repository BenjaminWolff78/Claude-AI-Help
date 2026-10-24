import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const times = process.argv.slice(2).map(Number);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const comp = await selectComposition({serveUrl, id: 'Main', inputProps: {sub: 1}, browserExecutable});
for (const t of times) {
  const frame = Math.round(t * 30);
  await renderStill({composition: comp, serveUrl, output: `out/stills/s_${t.toFixed(2)}.jpg`, frame, inputProps: {sub: 1}, browserExecutable, imageFormat: 'jpeg', jpegQuality: 85});
  console.log('ok', t);
}
