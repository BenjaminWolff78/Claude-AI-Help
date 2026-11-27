// usage: node scripts/review.mjs <outDir> <frame,frame,...> [scale]  - one still per frame, building only that shot's set
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp";
import { bundle } from "@remotion/bundler"; import { renderStill, selectComposition, openBrowser } from "@remotion/renderer"; import path from "node:path";
const [dir, frames, scale = "0.5"] = process.argv.slice(2); fs.mkdirSync(dir, { recursive: true });
const story = fs.readFileSync("src/videos/ice/story.ts", "utf8");
const shots = [...story.matchAll(/S\((\d+), (\d+), (\w+|\d+), "/g)].map((m) => ({ id: +m[1], a: +m[2], b: m[3] === "TOTAL" ? 1941 : +m[3] }));
const XF = { 3: 8, 5: 8, 6: 8, 7: 6, 10: 8, 11: 8, 12: 6, 14: 8, 16: 8, 17: 8, 18: 8, 19: 8, 20: 8, 21: 8 };
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const puppeteerInstance = await openBrowser("chrome", { browserExecutable, chromiumOptions });
for (const f of frames.split(",").map(Number)) {
  const s = shots.find((x) => f >= x.a && f < x.b) ?? shots[shots.length - 1];
  const only = [s.id]; const prev = shots.find((x) => x.id === s.id - 1); if (prev && XF[s.id] && f < s.a + XF[s.id]) only.push(prev.id);
  const inputProps = { only, post: { dpr: Number(scale), cardK: Number(scale) } };
  const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps, puppeteerInstance });
  const t0 = Date.now();
  try {
    await renderStill({ composition, serveUrl, frame: f, output: `${dir}/f${String(f).padStart(4, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 90, scale: Number(scale), inputProps, puppeteerInstance, timeoutInMilliseconds: 300000,
      onBrowserLog: (l) => { if (l.type === "error" && !l.text.includes("404")) console.log("[err]", l.text.slice(0, 300)); } });
    console.log("still", f, "S" + s.id, ((Date.now() - t0) / 1000).toFixed(1) + "s");
  } catch (e) { console.log("FAIL", f, String(e).slice(0, 300)); }
}
await puppeteerInstance.close({ silent: true });
