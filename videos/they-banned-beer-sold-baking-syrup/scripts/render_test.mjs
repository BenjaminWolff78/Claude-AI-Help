// node scripts/render_test.mjs <out.mp4> <from> <to> '<inputProps json>'   (fresh bundle every run; the bundle is deleted after)
import fs from "node:fs"; import path from "node:path";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer";
const [out, a, b, ip] = process.argv.slice(2); const inputProps = JSON.parse(ip || "{}");
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
const t0 = Date.now();
await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, inputProps, frameRange: [Number(a), Number(b)], concurrency: 1,   // 2 failed: "Error creating WebGL context" (one GL context per browser here) crf: 18, pixelFormat: "yuv420p", muted: true, scale: 0.5, browserExecutable, chromiumOptions, timeoutInMilliseconds: 600000,
  onProgress: ({ renderedFrames }) => { if (renderedFrames % 30 === 0) console.log("frames", renderedFrames, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } });
console.log("done", out, ((Date.now() - t0) / 1000).toFixed(0) + "s");
try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch (e) {}
