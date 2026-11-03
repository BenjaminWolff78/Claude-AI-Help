// usage (old):  node scripts/cast-sheet.mjs out.png '{"items":[...],"cols":10,"bg":"#7f9fc4"}'
// usage (new):  node scripts/cast-sheet.mjs --spec sheets.json   sheets = [{ out, items, cols?, bg?, labels? }, ...]
//               one bundle, many sheets (.jpg -> jpeg). labels: true writes each item's `label ?? who` under its cell
//               (python3 + PIL, after the render). Always run through the render lock:
//               flock /home/claude/rtmp/render.lock node scripts/cast-sheet.mjs --spec out/t/sheets.json
import fs from "node:fs"; process.env.TEMP = process.env.TMP = "/home/claude/rtmp"; fs.mkdirSync("/home/claude/rtmp", { recursive: true });
import { bundle } from "@remotion/bundler"; import { renderStill, selectComposition } from "@remotion/renderer"; import path from "node:path";
import { execFileSync } from "node:child_process";
const args = process.argv.slice(2);
const sheets = args[0] === "--spec" ? JSON.parse(fs.readFileSync(args[1], "utf8")) : [{ out: args[0], ...JSON.parse(args[1] ?? "{}") }];
const browserExecutable = "/usr/bin/google-chrome", chromiumOptions = { gl: "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
for (const s of sheets) {
  const { out, labels, ...inputProps } = s;
  const composition = await selectComposition({ serveUrl, id: "CastSheet", browserExecutable, chromiumOptions, inputProps });
  const jpg = /\.jpe?g$/i.test(out);
  await renderStill({ composition, serveUrl, frame: 0, output: out, imageFormat: jpg ? "jpeg" : "png", jpegQuality: 92, browserExecutable, chromiumOptions, inputProps,
    onBrowserLog: (l) => { if (l.type === "error") console.log(l.text.slice(0, 300)); } });
  if (labels && inputProps.items) {
    const cols = Number(inputProps.cols ?? 10), names = inputProps.items.map((it) => it.label ?? it.who);
    const py = `
import sys, json
from PIL import Image, ImageDraw, ImageFont
out, cols, names = sys.argv[1], int(sys.argv[2]), json.loads(sys.argv[3])
im = Image.open(out).convert("RGB"); d = ImageDraw.Draw(im)
cw = im.width / cols; ch = cw * 1000 / 600 * 0.95
f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", max(12, int(cw / 13)))
for i, n in enumerate(names):
    x = (i % cols) * cw + 6; y = (i // cols) * ch + 4
    d.rectangle([x - 3, y - 2, x + d.textlength(n, font=f) + 3, y + f.size + 4], fill=(28, 22, 34))
    d.text((x, y), n, font=f, fill=(255, 236, 170))
im.save(out, quality=92)
`;
    execFileSync("python3", ["-c", py, out, String(cols), JSON.stringify(names)]);
  }
  console.log("ok", out);
}
