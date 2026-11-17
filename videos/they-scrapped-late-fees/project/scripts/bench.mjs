import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const V = { A: { dpr: 0.75, cardK: 0.75 }, E: { dpr: 0.75, cardK: 0.75, msaa: 2 } };
for (const [k, post] of Object.entries(V)) {
  const inputProps = { post, only: [2] };
  const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
  const t = []; const t0 = Date.now();
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: `/tmp/bench_${k}.mp4`, inputProps, frameRange: [350, 355], concurrency: 1, crf: 14, pixelFormat: "yuv420p", muted: true, browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000,
    onProgress: ({ renderedFrames }) => { t.push([renderedFrames, Date.now() - t0]); } });
  const r = t.filter((x, i) => i === 0 || x[0] !== t[i - 1][0]).map((x) => x[0] + ":" + (x[1] / 1000).toFixed(0)).join(" ");
  console.log("VARIANT", k, r);
}
