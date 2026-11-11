import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp";
import { bundle } from "@remotion/bundler"; import { renderMedia, selectComposition } from "@remotion/renderer"; import path from "node:path";
const configs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const browserExecutable = "/usr/bin/google-chrome";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
for (const c of configs) { try {
  const inputProps = c.props;
  const chromiumOptions = { gl: c.gl ?? "swangle" }; const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions, inputProps });
  const t0 = Date.now(); const ts = [];
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: `/home/claude/rtmp/prof_${c.name}.mp4`, inputProps, scale: c.scale ?? 0.5, frameRange: c.range, concurrency: 1, muted: true,
    browserExecutable, chromiumOptions, timeoutInMilliseconds: 900000,
    onProgress: ({ renderedFrames }) => { if (renderedFrames > ts.length) ts.push((Date.now() - t0) / 1000); } });
  const d = ts.slice(1).map((t, i) => (t - ts[i]).toFixed(1));
  console.log(c.name, "first", ts[0]?.toFixed(0), "per-frame", d.join(" "));
} catch (e) { console.log(c.name, 'FAILED', String(e).slice(0, 200)); } }
