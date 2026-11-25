// usage: node scripts/sample.mjs <outdir> <every> [from] [to] [scale] [postJSON]
// One page load, every Nth frame as a jpeg (renderFrames): a fast contact sheet of the whole timeline.
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp"; fs.mkdirSync("/home/claude/rtmp", { recursive: true });
import { bundle } from "@remotion/bundler"; import { renderFrames, selectComposition } from "@remotion/renderer"; import path from "node:path";
const [dir, every = "30", from = "0", to = "-1", scale = "0.4", postJ] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
const post = postJ ? JSON.parse(postJ) : { dpr: 0.5, cardK: 0.6, lens: false, bloom: false, msaa: 2, shadow: 2048 };
const inputProps = { post };
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
const T = composition.durationInFrames, A = Number(from), B = Number(to) < 0 ? T - 1 : Number(to);
const t0 = Date.now();
await renderFrames({ composition, serveUrl, inputProps, outputDir: dir, frameRange: [A, B], everyNthFrame: Number(every), imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale), concurrency: 1,
  browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000,
  onBrowserLog: (l) => { if (l.type === "error" && !l.text.includes("404")) console.log("[err]", l.text.slice(0, 300)); },
  onFrameUpdate: (n) => { if (n % 5 === 0) console.log("frames", n, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } });
console.log("done", ((Date.now() - t0) / 1000).toFixed(0) + "s");
