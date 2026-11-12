// final render of "He Covered His Oranges in Ice" in resumable chunks: out/chunks/c_<from>.mp4 (skips chunks that exist),
// then concat with tools/final_mux.sh. Writes /home/claude/.render-progress.json after every chunk.
// usage: node scripts/render_ice.mjs [from] [to]   (defaults: the whole video)
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp"; fs.mkdirSync("/home/claude/rtmp", { recursive: true });
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const TOTAL = 1924, N = 96, dir = "out/chunks"; fs.mkdirSync(dir, { recursive: true });
const A0 = Number(process.argv[2] ?? 0), B0 = Number(process.argv[3] ?? TOTAL - 1);
const TITLE = "He Covered His Oranges in Ice to Stop Them Freezing";
const inputProps = { post: { dpr: 0.55, cardK: 0.6, msaa: 1, shadow: 1536 } };   // software GL: ~12-17 s per frame. msaa 0 + lens = BLANK frames (depth feedback loop): keep msaa >= 1
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const done = () => fs.readdirSync(dir).filter((f) => /^c_\d{4}\.mp4$/.test(f)).reduce((s, f) => { const a = Number(f.slice(2, 6)); return s + Math.min(N, TOTAL - a); }, 0);
let framesThisRun = 0;
// live feed for tools/progress.py (the single writer of /home/claude/.render-progress.json)
let secsDone = 0;
const live = (a, b, inChunk, t0) => { const o = { chunkStart: a, chunkEnd: b, inChunk, frames: framesThisRun + inChunk, secs: secsDone + (Date.now() - t0) / 1000, updatedAt: new Date().toISOString() };
  fs.writeFileSync("/home/claude/proj/render_live.json.tmp", JSON.stringify(o)); fs.renameSync("/home/claude/proj/render_live.json.tmp", "/home/claude/proj/render_live.json"); };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
for (let a = Math.floor(A0 / N) * N; a <= B0; a += N) {
  const b = Math.min(TOTAL - 1, a + N - 1), out = `${dir}/c_${String(a).padStart(4, "0")}.mp4`;
  if (fs.existsSync(out)) { console.log("skip", out); continue; }
  const t0 = Date.now(); let last = 0; live(a, b, 0, t0);
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out + ".part.mp4", inputProps, frameRange: [a, b], concurrency: 1, crf: 14, pixelFormat: "yuv420p", muted: true,
    browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000,
    onProgress: ({ renderedFrames }) => { live(a, b, renderedFrames, t0); if (renderedFrames - last >= 24) { last = renderedFrames; console.log(out, renderedFrames, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } } });
  fs.renameSync(out + ".part.mp4", out); secsDone += (Date.now() - t0) / 1000; framesThisRun += b - a + 1; console.log("done", out, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
console.log("ALL DONE", done(), "/", TOTAL);
