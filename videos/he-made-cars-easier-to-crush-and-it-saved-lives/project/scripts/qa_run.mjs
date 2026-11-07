// node scripts/qa_run.mjs <from> <to> <out.jsonl>  - low-res pass with inputProps.qa, collects the per-frame QA lines
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const [a, b, outp] = process.argv.slice(2);
const inputProps = { qa: true, noCaps: true, post: { dpr: 0.15, cardK: 0.2, ink: false, lens: false, pre: false, bloom: false, msaa: 0 } };
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
const lines = []; const t0 = Date.now();
await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: "/home/claude/rtmp/qa_crumple.mp4", inputProps, scale: 0.25, frameRange: [Number(a), Number(b)], concurrency: 1, muted: true,
  browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000,
  onBrowserLog: (l) => { if (l.text.startsWith("QA|")) lines.push(l.text.slice(3)); } });
fs.writeFileSync(outp, lines.join("\n") + "\n"); console.log("qa frames", lines.length, ((Date.now() - t0) / 1000).toFixed(0) + "s");
