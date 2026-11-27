// usage: node scripts/sample_list.mjs <outdir> <frames comma list> [scale]
// renders each listed frame (pairs around shot boundaries) as jpeg, one bundle
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp"; fs.mkdirSync("/home/claude/rtmp", { recursive: true });
import { bundle } from "@remotion/bundler"; import { renderFrames, selectComposition, openBrowser } from "@remotion/renderer"; import path from "node:path";
const [dir, list, scale = "0.35", extra = "{}"] = process.argv.slice(2);   // v34.1: optional extra input props JSON (e.g. {"testScene":true})
fs.mkdirSync(dir, { recursive: true });
const post = { dpr: 0.5, cardK: 0.6, lens: false, bloom: false, msaa: 2, shadow: 2048 };
const inputProps = { post, ...JSON.parse(extra) };
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
const puppeteerInstance = await openBrowser("chrome", { browserExecutable, chromiumOptions });
const t0 = Date.now();
for (const fr of list.split(",").map(Number)) {
  const od = path.join(dir, "f" + String(fr).padStart(4, "0")); fs.mkdirSync(od, { recursive: true });
  await renderFrames({ composition, serveUrl, inputProps, outputDir: od, frameRange: [fr, fr], imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale), concurrency: 1,
    browserExecutable, chromiumOptions, puppeteerInstance, timeoutInMilliseconds: 900000,
    onBrowserLog: (l) => { if (l.type === "error" && !l.text.includes("404")) console.log("[err]", l.text.slice(0, 200)); } });
  console.log("frame", fr, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
await puppeteerInstance.close({ silent: true });
console.log("done");
try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch (e) { void e; }   // a bundle is ~430 MB
