// renders single frames, each in a fresh page (the first-frame-of-a-chunk condition)
process.env.TEMP = process.env.TMP = "/home/claude/rtmp";
import { bundle } from "@remotion/bundler"; import { renderStill, selectComposition } from "@remotion/renderer"; import path from "node:path";
const inputProps = { post: { dpr: 1.0, cardK: 1.0, lens: false, shadow: 2048 } }, browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
for (const f of process.argv.slice(2).map(Number)) {
  await renderStill({ composition, serveUrl, frame: f, output: `/home/claude/boat/qa/j/ff_${f}.png`, inputProps, browserExecutable, chromiumOptions, timeoutInMilliseconds: 600000 });
  console.log("still", f);
}
