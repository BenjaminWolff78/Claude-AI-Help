// usage: node scripts/render.mjs <out.mp4> <scale> <from-to> [concurrency] [propsJSON]
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp"; fs.mkdirSync("/home/claude/rtmp", { recursive: true });
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const [out, scale = "0.5", range = "", conc = "1", props = "{}"] = process.argv.slice(2);
const inputProps = JSON.parse(props);
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
const frameRange = range ? range.split("-").map(Number) : undefined;
const t0 = Date.now(); let last = 0;
await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, inputProps, scale: Number(scale), frameRange, concurrency: Number(conc), crf: 16, pixelFormat: "yuv420p",
  browserExecutable, chromiumOptions, timeoutInMilliseconds: 600000, muted: true,
  onProgress: ({ renderedFrames }) => { if (renderedFrames - last >= (Number(process.env.EVERY) || 10)) { last = renderedFrames; console.log("frames", renderedFrames, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } },
  onBrowserLog: (l) => { if (l.type === "error" && !l.text.includes("404")) console.log("[err]", l.text.slice(0, 300)); } });
console.log("done", out, ((Date.now() - t0) / 1000).toFixed(0) + "s");
