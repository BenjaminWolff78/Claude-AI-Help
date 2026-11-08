// usage: node scripts/art.mjs <spec.json>   spec = [{ out, w, h, scale?, preview: {...} }]  (renders the BridgeArt composition at w x h)
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp"; fs.mkdirSync("/home/claude/rtmp", { recursive: true });
import { bundle } from "@remotion/bundler"; import { renderStill, selectComposition } from "@remotion/renderer"; import path from "node:path";
const specs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
for (const s of specs) {
  const inputProps = { preview: s.preview, w: s.w, h: s.h, noCaps: true };
  const composition = await selectComposition({ serveUrl, id: "BridgeArt", browserExecutable, chromiumOptions, inputProps });
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: 0, output: s.out, imageFormat: "png", scale: s.scale ?? 1, browserExecutable, chromiumOptions, inputProps, timeoutInMilliseconds: 600000,
    onBrowserLog: (l) => { if (l.type === "error" && !l.text.includes("404")) console.log("[err]", l.text.slice(0, 400)); } });
  console.log("art", s.out, composition.width + "x" + composition.height, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
