// node scripts/render_range.mjs <from> <to>  -> out/chunks/c_<from>.mp4 (same settings as render_chunks.mjs)
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const [a, b] = process.argv.slice(2).map(Number), out = `out/chunks/c_${String(a).padStart(4, "0")}.mp4`;
if (fs.existsSync(out)) { console.log("skip"); process.exit(0); }
const inputProps = { post: { dpr: 0.75, cardK: 0.75 } }, browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = fs.existsSync("/home/claude/rtmp/bundle_ok_potato") ? fs.readFileSync("/home/claude/rtmp/bundle_ok_potato", "utf8") : await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
fs.writeFileSync("/home/claude/rtmp/bundle_ok_potato", serveUrl);
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
const t0 = Date.now();
await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out + ".part.mp4", inputProps, frameRange: [a, b], concurrency: 1, crf: 14, pixelFormat: "yuv420p", muted: true, browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000 });
fs.renameSync(out + ".part.mp4", out); console.log("done", out, ((Date.now() - t0) / 1000).toFixed(0) + "s");
