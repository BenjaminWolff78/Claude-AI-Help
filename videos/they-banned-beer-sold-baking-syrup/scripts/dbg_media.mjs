import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const inputProps = JSON.parse(process.argv[4] ?? '{"post":{"dpr":1.0,"cardK":1.0,"lens":false,"shadow":2048}}');
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: process.argv[5] ?? "/home/claude/boat/qa/dbg.mp4", inputProps, frameRange: [Number(process.argv[2]), Number(process.argv[3])], concurrency: 1, crf: 14, pixelFormat: "yuv420p", muted: true,
  browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000, onBrowserLog: (l) => { if (!l.text.includes("404")) console.log("[" + l.type + "]", l.text.slice(0, 300)); } });
console.log("done");
