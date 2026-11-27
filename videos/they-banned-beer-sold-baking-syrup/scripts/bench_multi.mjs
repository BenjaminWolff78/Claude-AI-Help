// node scripts/bench_multi.mjs <from> <to> '<configsJSON: [{name, post, dbg}]>' -> scene-pass timing per config (one bundle)
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const [a, b] = process.argv.slice(2, 4).map(Number), cfgs = JSON.parse(process.argv[4]);
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
for (const c of cfgs) {
  const inputProps = { post: c.post ?? { dpr: 1, cardK: 1, lens: false }, tprof: true, ...(c.dbg ? { dbg: c.dbg } : {}) };
  const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
  const sc = [];
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: "/home/claude/p11/bench/m.mp4", inputProps, frameRange: [a, b], concurrency: 1, crf: 14, pixelFormat: "yuv420p", muted: true, browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000,
    onBrowserLog: (l) => { const m = l.text.match(/T\|passes scene:(\d+)/); if (m) sc.push(Number(m[1])); } });
  console.log("CFG", c.name, "scene ms", sc.join(" "));
}
