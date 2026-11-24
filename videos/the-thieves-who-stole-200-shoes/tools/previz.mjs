// PREVIZ (v14 STEP 5b): the whole video at 270x480, no DOF, no bloom, basic shadows, in resumable chunks.
// usage: node scripts/previz.mjs <outdir> [from] [to]      chunks: <outdir>/p_<from>.mp4, then concat with ffmpeg.
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp"; fs.mkdirSync("/home/claude/rtmp", { recursive: true });
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const dir = process.argv[2], TOTAL = 1897, N = 120; fs.mkdirSync(dir, { recursive: true });
const A0 = Number(process.argv[3] ?? 0), B0 = Number(process.argv[4] ?? TOTAL - 1);
const inputProps = { qa: true, post: { dpr: 0.25, cardK: 0.4, msaa: 1, shadow: 512, shadowType: "basic", lens: false, pre: false, bloom: false } };
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
for (let a = Math.floor(A0 / N) * N; a <= B0; a += N) {
  const b = Math.min(TOTAL - 1, a + N - 1), out = `${dir}/p_${String(a).padStart(4, "0")}.mp4`;
  if (fs.existsSync(out)) { console.log("skip", out); continue; }
  const t0 = Date.now(); let last = 0; const qa = [];
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out + ".part.mp4", inputProps, frameRange: [a, b], concurrency: 1, crf: 20, pixelFormat: "yuv420p", muted: true,
    scale: 0.25, browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000,
    onBrowserLog: (l) => { if (l.text.startsWith("QA|")) qa.push(l.text.slice(3)); },
    onProgress: ({ renderedFrames }) => { if (renderedFrames - last >= 30) { last = renderedFrames; console.log(out, renderedFrames, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } } });
  fs.writeFileSync(`${dir}/qa_${String(a).padStart(4, "0")}.jsonl`, qa.join("\n") + "\n"); fs.renameSync(out + ".part.mp4", out); console.log("done", out, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
console.log("ALL DONE");
