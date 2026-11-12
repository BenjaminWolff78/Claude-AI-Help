// render arbitrary frame ranges with the final settings of render_ice.mjs: node scripts/render_part.mjs a1 b1 [a2 b2 ...]
// -> out/chunks/c_<a>.mp4 for each range (skips ranges whose file exists); feeds /home/claude/proj/render_live.json
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp"; fs.mkdirSync("/home/claude/rtmp", { recursive: true });
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const dir = "out/chunks", inputProps = { post: { dpr: 0.55, cardK: 0.6, msaa: 1, shadow: 1536 } };
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const R = process.argv.slice(2).map(Number); let framesRun = 0, secsDone = 0;
const live = (a, b, inChunk, t0) => { const o = { chunkStart: a, chunkEnd: b, inChunk, frames: framesRun + inChunk, secs: secsDone + (Date.now() - t0) / 1000, updatedAt: new Date().toISOString() };
  fs.writeFileSync("/home/claude/proj/render_live.json.tmp", JSON.stringify(o)); fs.renameSync("/home/claude/proj/render_live.json.tmp", "/home/claude/proj/render_live.json"); };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
for (let i = 0; i < R.length; i += 2) {
  const a = R[i], b = R[i + 1], out = `${dir}/c_${String(a).padStart(4, "0")}.mp4`;
  if (fs.existsSync(out)) { console.log("skip", out); continue; }
  const t0 = Date.now(); live(a, b, 0, t0);
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out + ".part.mp4", inputProps, frameRange: [a, b], concurrency: 1, crf: 14, pixelFormat: "yuv420p", muted: true,
    browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000, onProgress: ({ renderedFrames }) => live(a, b, renderedFrames, t0) });
  fs.renameSync(out + ".part.mp4", out); secsDone += (Date.now() - t0) / 1000; framesRun += b - a + 1; console.log("done", out, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
console.log("PARTS DONE");
