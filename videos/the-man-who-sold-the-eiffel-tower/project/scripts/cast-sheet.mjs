import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp"; fs.mkdirSync("/home/claude/rtmp", { recursive: true });
import { bundle } from "@remotion/bundler"; import { renderStill, selectComposition } from "@remotion/renderer"; import path from "node:path";
const [out, props = "{}"] = process.argv.slice(2); const inputProps = JSON.parse(props);
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "CastSheet", browserExecutable, chromiumOptions, inputProps });
await renderStill({ composition, serveUrl, frame: 0, output: out, imageFormat: "png", browserExecutable, chromiumOptions, inputProps, onBrowserLog: (l) => { if (l.type === "error") console.log(l.text.slice(0, 300)); } });
console.log("ok", out);
