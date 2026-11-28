// final render in chunks (resumable): out/chunks/c_<from>.mp4, then concat. angle-egl (Mesa llvmpipe) is ~4x faster than swangle here.
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const TOTAL = 1965, N = 80, dir = "out/chunks15"; fs.mkdirSync(dir, { recursive: true });
const inputProps = { post: { dpr: 1.0, cardK: 1.0, lens: false, shadow: 2048 } };   // 2026-11-25 (v28 6.16): full-resolution buffer, NO lens pass (it cost 0.17 sharpness on the shoes video)
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
const A0 = Number(process.argv[2] ?? 0), B0 = Number(process.argv[3] ?? TOTAL - 1);
for (let a = A0; a <= B0; a += N) {
  const b = Math.min(TOTAL - 1, B0, a + N - 1), out = `${dir}/c_${String(a).padStart(4, "0")}.mp4`;
  if (fs.existsSync(out)) { console.log("skip", out); continue; }
  const t0 = Date.now(); let last = 0;
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out + ".part.mp4", inputProps, frameRange: [a, b], concurrency: 1, crf: 14, pixelFormat: "yuv420p", muted: true,
    browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000,
    onProgress: ({ renderedFrames }) => { if (renderedFrames - last >= 30) { last = renderedFrames; console.log(out, renderedFrames, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } } });
  fs.renameSync(out + ".part.mp4", out); console.log("done", out, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
console.log("ALL DONE");
