import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const [a, b, out, propsJson] = process.argv.slice(2); const inputProps = JSON.parse(propsJson);
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, inputProps, frameRange: [Number(a), Number(b)], concurrency: 1, crf: 14, pixelFormat: "yuv420p", muted: true, browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000 });
console.log("ok", out);
