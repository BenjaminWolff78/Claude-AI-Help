// usage: node scripts/preview.mjs <spec.json>   spec = [{ out, frame?, preview: {...} }, ...]   (one bundle, many stills)
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp"; fs.mkdirSync("/home/claude/rtmp", { recursive: true });
import { bundle } from "@remotion/bundler"; import { renderStill, selectComposition } from "@remotion/renderer"; import path from "node:path";
const specs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "angle-egl" };
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
for (const s of specs) {
  const inputProps = s.preview ? { preview: s.preview, ...(s.props ?? {}) } : (s.props ?? {});
  const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: s.frame ?? 0, output: s.out, imageFormat: "jpeg", jpegQuality: 90, scale: s.scale ?? 0.5, browserExecutable, chromiumOptions, inputProps, timeoutInMilliseconds: 300000,
    onBrowserLog: (l) => { if (l.type === "error" && !l.text.includes("404")) console.log("[err]", l.text.slice(0, 400)); } });
  console.log("still", s.out, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
// 2026-11-27: every bundle() leaves ~430 MB in /tmp; 22 preview runs filled the disk to 1.6 GB free. Remove it after the stills.
try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch (e) { console.log("bundle cleanup failed", String(e)); }
