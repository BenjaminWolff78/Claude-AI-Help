// node scripts/bench_media.mjs <from> <to> '<postJSON>'  -> per-frame timing of renderMedia at full size
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const [a, b] = process.argv.slice(2, 4).map(Number), post = JSON.parse(process.argv[4] ?? '{"dpr":1}');
const inputProps = { post, tprof: !!process.env.TPROF, ...(process.env.DBG ? { dbg: JSON.parse(process.env.DBG) } : {}) }, browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
const t0 = Date.now(); let last = t0;
await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: "/home/claude/p11/bench/m.mp4", inputProps, frameRange: [a, b], concurrency: 1, crf: 14, pixelFormat: "yuv420p", muted: true, browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000, onBrowserLog: (l) => { if (l.text.startsWith("T|") || l.text.startsWith("L|")) console.log(l.text); },
  onProgress: ({ renderedFrames }) => { const n = Date.now(); console.log("frames", renderedFrames, ((n - last) / 1000).toFixed(1) + "s", ((n - t0) / 1000).toFixed(0) + "s total"); last = n; } });
console.log("done", ((Date.now() - t0) / 1000).toFixed(0) + "s");
