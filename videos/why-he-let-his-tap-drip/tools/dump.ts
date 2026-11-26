import { camFor } from "../app/src/videos/ice/cams";
import { layersAt, storyF, STORY_SHOTS } from "../app/src/videos/ice/story";
import * as fs from "node:fs";
const rows: string[] = [];
const N = Number(process.argv[2] ?? 1973);
for (let n = 0; n < N; n++) {
  const f = storyF(n), L = layersAt(f);
  const ls = L.map((l) => { const c = camFor(l.id, f, { cams: {} } as any); return { id: l.id, a: l.alpha, pos: c.pos, look: c.look, fov: c.fov, roll: c.roll ?? 0 }; });
  rows.push(JSON.stringify({ n, f, L: ls }));
}
fs.writeFileSync(process.argv[3] ?? "cams.jsonl", rows.join("\n"));
console.log("ok", rows.length, STORY_SHOTS.length);
