// Shutter sub-frames for RaiseVideo. Usage: node scripts/raise-sub.mjs --plan plan.json --out out/raise/sub
// plan.json: {"<sub as decimal frame fraction>": [frame, ...], ...}; renders each (sub, frame) once, resumable.
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition, openBrowser} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const plan = JSON.parse(fs.readFileSync(opt('plan'), 'utf8'));
const outRoot = opt('out', 'out/raise/sub');
const browserExecutable = process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), onProgress: () => {}});
const browser = await openBrowser('chrome', {browserExecutable});
let done = 0;
const total = Object.values(plan).reduce((a, v) => a + v.length, 0);
for (const [sub, list] of Object.entries(plan)) {
  const dir = path.join(outRoot, 's' + sub);
  fs.mkdirSync(dir, {recursive: true});
  const todo = list.filter((f) => !fs.existsSync(path.join(dir, `f${String(f).padStart(5, '0')}.jpeg`))).sort((a, b) => a - b);
  done += list.length - todo.length;
  const inputProps = {sub: parseFloat(sub)};
  const comp = await selectComposition({serveUrl, id: 'RaiseVideo', inputProps, puppeteerInstance: browser});
  // contiguous runs
  const runs = [];
  for (const f of todo) {
    const r = runs[runs.length - 1];
    if (r && f === r[1] + 1) r[1] = f; else runs.push([f, f]);
  }
  for (const [a, b] of runs) {
    const tmp = path.join(dir, `_t${a}`);
    await renderFrames({
      composition: comp, serveUrl, inputProps, frameRange: [a, b], outputDir: tmp,
      imageFormat: 'jpeg', jpegQuality: 95, scale: 1, puppeteerInstance: browser, concurrency: 2,
      onStart: () => {}, onFrameUpdate: () => {},
      imageSequencePattern: 'f[frame].[ext]'.replace('[frame]', '[frame]'),
    });
    for (const fn of fs.readdirSync(tmp)) {
      const n = parseInt(fn.match(/\d+/)[0], 10);
      fs.renameSync(path.join(tmp, fn), path.join(dir, `f${String(n).padStart(5, '0')}.jpeg`));
    }
    fs.rmdirSync(tmp);
    done += b - a + 1;
    console.log(`sub ${sub}: ${a}-${b} (${done}/${total})`);
  }
}
try { await browser.close({silent: true}); } catch {}
console.log('SUB_DONE');
