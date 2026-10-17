// Render chosen frames of RaiseVideo with Remotion (bundle once), optionally collecting QA boxes.
// Usage: node scripts/raise-frames.mjs --out out/raise/stills --times 0,1.5,3 [--qa] [--every 15] [--from s --to s] [--scale 0.5]
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf('--' + k);
  return i >= 0 ? args[i + 1] : d;
};
const flag = (k) => args.includes('--' + k);
const outDir = opt('out', 'out/raise/stills');
const qa = flag('qa');
const scale = parseFloat(opt('scale', '1'));
const browserExecutable = process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
fs.mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), onProgress: () => {}});
const inputProps = qa ? {qa: true} : {};
const comp = await selectComposition({serveUrl, id: opt('id', 'RaiseVideo'), inputProps, browserExecutable});
const fps = comp.fps;
let frames = [];
if (opt('times')) frames = opt('times').split(',').map((s) => Math.min(comp.durationInFrames - 1, Math.round(parseFloat(s) * fps)));
else {
  const every = parseInt(opt('every', '15'), 10);
  const from = Math.round(parseFloat(opt('from', '0')) * fps);
  const to = Math.min(comp.durationInFrames - 1, Math.round(parseFloat(opt('to', String(comp.durationInFrames / fps))) * fps));
  for (let f = from; f <= to; f += every) frames.push(f);
}
const want = new Set(frames);
const qaLog = {};
const min = Math.min(...frames);
const max = Math.max(...frames);
// renderFrames renders a contiguous range; we filter with everyNthFrame when evenly spaced, else render one by one.
const renderOne = async (f) => {
  await renderFrames({
    composition: comp,
    serveUrl,
    inputProps,
    frameRange: [f, f],
    outputDir: outDir,
    imageFormat: 'jpeg',
    jpegQuality: 90,
    scale,
    browserExecutable,
    concurrency: 1,
    onStart: () => {},
    onFrameUpdate: () => {},
    onBrowserLog: (log) => {
      if (log.text.startsWith('QA|')) {
        const [, fr, json] = log.text.split('|');
        qaLog[fr] = JSON.parse(json);
      }
    },
    imageSequencePattern: `f[frame].[ext]`,
  });
};
const evenly = frames.length > 2 && frames.every((f, i) => i === 0 || f - frames[i - 1] === frames[1] - frames[0]);
if (evenly) {
  await renderFrames({
    composition: comp,
    serveUrl,
    inputProps,
    frameRange: [min, max],
    everyNthFrame: frames[1] - frames[0],
    outputDir: outDir,
    imageFormat: 'jpeg',
    jpegQuality: 88,
    scale,
    browserExecutable,
    concurrency: 2,
    onStart: () => {},
    onFrameUpdate: () => {},
    onBrowserLog: (log) => {
      if (log.text.startsWith('QA|')) {
        const [, fr, json] = log.text.split('|');
        qaLog[fr] = JSON.parse(json);
      }
    },
    imageSequencePattern: `f[frame].[ext]`,
  });
} else {
  for (const f of frames) await renderOne(f);
}
if (qa) fs.writeFileSync(path.join(outDir, 'qa.json'), JSON.stringify(qaLog));
console.log('rendered', frames.length, 'frames to', outDir, qa ? `(qa for ${Object.keys(qaLog).length} frames)` : '');
void want;
