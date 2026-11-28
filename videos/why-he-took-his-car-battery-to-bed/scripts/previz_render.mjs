// node scripts/previz_render.mjs <out.mp4> [from] [to]  - the v34 draft previz: 270x480 (scale 0.25), captions on,
// no depth of field / bloom / ink / soft extras; one fresh bundle, deleted by the caller afterwards (its path is printed)
import fs from "node:fs";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const [outp, a = "0", b = "1965"] = process.argv.slice(2);
const inputProps = { post: { dpr: 0.25, cardK: 0.25, ink: false, lens: false, pre: false, bloom: false, msaa: 0 } };
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
console.log("BUNDLE", serveUrl);
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
// RANGES="905-930,1525-1550": re-render only those ranges (concurrency 1: two tabs gave white frames, the skill's gotcha) to <out>_<a>.mp4
const ranges = process.env.RANGES ? process.env.RANGES.split(",").map((r) => r.split("-").map(Number)) : [[Number(a), Number(b)]];
for (const [ra, rb] of ranges) {
  const o = process.env.RANGES ? outp.replace(/\.mp4$/, `_${ra}.mp4`) : outp;
  const t0 = Date.now(); let last = 0;
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: o + ".part.mp4", inputProps, scale: 0.25, frameRange: [ra, rb],
    concurrency: Number(process.env.CONC || 1), crf: 20, pixelFormat: "yuv420p", muted: true, browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000,
    onProgress: ({ renderedFrames }) => { if (renderedFrames - last >= 100) { last = renderedFrames; console.log("frames", renderedFrames, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } } });
  fs.renameSync(o + ".part.mp4", o); console.log("done", o, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
