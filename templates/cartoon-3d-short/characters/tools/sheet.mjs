// Offline cast-sheet renderer (no Remotion, no browser): bundles the rig's fig.ts / toon.ts / casts.ts with esbuild and
// draws each item with figure() on a @napi-rs/canvas, exactly like src/CastSheet.tsx does inside Remotion.
// usage: node sheet.mjs <rigDir> <spec.json>      e.g. (from characters/): node tools/sheet.mjs rig tools/joe_sheet.json
//   spec = [{ out, cols?, bg?, items: [{ who?, look?, o? }] }]  (look = an inline Look that overrides CAST[who])
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import { build } from "esbuild"; import { createCanvas } from "@napi-rs/canvas";
const here = path.dirname(fileURLToPath(import.meta.url));
const [rigDir, specPath] = process.argv.slice(2);
const entry = path.join(here, ".entry.ts");
fs.writeFileSync(entry, `export { figure } from ${JSON.stringify(path.resolve(rigDir, "fig"))};\n` +
  `export { Pen } from ${JSON.stringify(path.resolve(rigDir, "toon"))};\n` +
  (fs.existsSync(path.join(rigDir, "casts.ts")) ? `export { CAST } from ${JSON.stringify(path.resolve(rigDir, "casts"))};\n` : `export const CAST = {};\n`));
const out = path.join(here, ".rig.mjs");
await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "error", loader: { ".json": "json" } });
const { figure, Pen, CAST } = await import(out + "?t=" + Date.now());
const sheets = JSON.parse(fs.readFileSync(specPath, "utf8"));
for (const s of sheets) {
  const cols = s.cols ?? 5, W = s.width ?? 2400, cw = W / cols, ch = cw * 1000 / 600 * 0.95;
  const rows = Math.ceil(s.items.length / cols), c = createCanvas(W, Math.round(rows * ch)), g = c.getContext("2d");
  g.fillStyle = s.bg ?? "#cdb48e"; g.fillRect(0, 0, c.width, c.height);
  s.items.forEach((it, i) => {
    g.save(); g.translate((i % cols) * cw, Math.floor(i / cols) * ch - ch * 0.05); g.scale(cw / 600, cw / 600);
    g.fillStyle = (i % 2) ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"; g.fillRect(0, 0, 600, 1000);
    const look = { ...(CAST[it.who] ?? {}), ...(it.look ?? {}) };
    figure(new Pen(g), look, it.o ?? {}); g.restore();
  });
  fs.writeFileSync(s.out, /\.jpe?g$/i.test(s.out) ? await c.encode("jpeg", 90) : await c.encode("png"));
  console.log("ok", s.out);
}
