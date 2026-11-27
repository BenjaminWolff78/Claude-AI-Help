// dress.ts — SET DRESSING helpers (v34 R&D, 2026-11-27): fill the walls the camera actually sees, the way Rick's sets
// have something on every surface (kit/still_check.py: detail 11+, empty area 40% or less). Seeded, so renders repeat.
//   stockShelf  a steel or wood shelf unit filled with real Poly Haven groceries, cans, bottles, boxes and crates
//   panRail     a steel rail with S-hooks and hanging pans, pots, jugs and spoons
//   poster      a printed sign / notice / menu on a wall (canvas texture on a thin board), slightly askew
//   pipeRun     a straight pipe or conduit with wall brackets
//   wallLamp    a real wall lamp model with a warm point light (a visible source that lights the wall around it)
// Place them from the shot's camera: project the candidate wall area with kit/proj.py and fill what is IN FRAME.
import * as THREE from "three";
import { phModel, type PhModel } from "../ph";
import { canvasTex, std, tubeAlong, hsh } from "./harborkit";
import type { V3 } from "./types";

type Item = { m: PhModel; filt?: string; h: number; w: number };
export const STOCK: Item[] = [
  { m: "long_life_food" as PhModel, filt: "milk", h: 0.24, w: 0.11 }, { m: "long_life_food" as PhModel, filt: "tomatoes", h: 0.12, w: 0.13 },
  { m: "long_life_food" as PhModel, filt: "beans", h: 0.15, w: 0.09 }, { m: "russian_food_cans_01" as PhModel, filt: "salt_box", h: 0.16, w: 0.08 },
  { m: "russian_food_cans_01" as PhModel, filt: "can_cond", h: 0.09, w: 0.09 }, { m: "oil_tin" as PhModel, h: 0.22, w: 0.14 },
  { m: "cleaner_tin_01" as PhModel, h: 0.14, w: 0.09 }, { m: "multi_cleaner_bottle" as PhModel, h: 0.24, w: 0.09 },
  { m: "bleach_bottle" as PhModel, h: 0.29, w: 0.09 }, { m: "wooden_bowl_01" as PhModel, h: 0.09, w: 0.32 },
  { m: "brass_pot_01" as PhModel, h: 0.2, w: 0.3 }, { m: "pot_enamel_01" as PhModel, h: 0.18, w: 0.28 }, { m: "jug_01" as PhModel, h: 0.22, w: 0.15 },
];
export const BULK: Item[] = [
  { m: "cardboard_box_01" as PhModel, h: 0.35, w: 0.4 }, { m: "plastic_crate_02" as PhModel, h: 0.25, w: 0.5 }, { m: "wicker_basket_01" as PhModel, h: 0.12, w: 0.38 },
];
const rng = (seed: number) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

/** a shelf unit (local x along the wall, the back against the wall, facing +z before rotY). levels = board heights (m) */
export const stockShelf = (parent: THREE.Object3D, at: V3, rotY: number, o: { w?: number; d?: number; levels?: number[]; wood?: boolean; seed?: number; bulkBottom?: boolean } = {}) => {
  const w = o.w ?? 1.2, d = o.d ?? 0.36, levels = o.levels ?? [0.12, 0.55, 0.98, 1.41, 1.84], r = rng(o.seed ?? 7);
  const g = new THREE.Group(); g.position.set(...at); g.rotation.y = rotY; parent.add(g);
  const frame = o.wood ? std("#6b4a30", 0.8) : std("#9aa3ab", 0.45, 0.6), board = o.wood ? std("#7a5636", 0.75) : std("#b7bec4", 0.4, 0.55);
  for (const x of [-w / 2 + 0.02, w / 2 - 0.02]) for (const z of [0.02, d - 0.02]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.03, levels[levels.length - 1] + 0.05, 0.03), frame); post.position.set(x, (levels[levels.length - 1] + 0.05) / 2, z); post.castShadow = true; g.add(post);
  }
  levels.forEach((y, li) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, d), board); b.position.set(0, y, d / 2); b.castShadow = b.receiveShadow = true; g.add(b);
    const pool = li === 0 && o.bulkBottom ? BULK : STOCK;
    let x = -w / 2 + 0.05;
    while (x < w / 2 - 0.08) {
      const it = pool[Math.floor(r() * pool.length)];
      if (x + it.w > w / 2 - 0.03) break;
      const n = it.w < 0.12 && r() < 0.6 ? 1 + Math.floor(r() * 3) : 1;        // small things come in little rows
      for (let k = 0; k < n && x + it.w < w / 2 - 0.03; k++) {
        const m = phModel(it.m, { filt: it.filt, h: it.h * (0.9 + 0.2 * r()), center: true });
        m.position.set(x + it.w / 2, y + 0.013, d * (0.35 + 0.3 * r())); m.rotation.y = (r() - 0.5) * 0.6; g.add(m);
        x += it.w + 0.015;
      }
      x += 0.03 + 0.08 * r();
    }
  });
  return g;
};

/** a steel rail with hanging pans, pots and spoons (along local x, against a wall facing +z) */
export const panRail = (parent: THREE.Object3D, at: V3, rotY: number, len = 1.6, seed = 3) => {
  const r = rng(seed), g = new THREE.Group(); g.position.set(...at); g.rotation.y = rotY; parent.add(g);
  const steel = std("#c9ced2", 0.3, 0.9);
  g.add(tubeAlong([[-len / 2, 0, 0.08], [len / 2, 0, 0.08]], 0.012, steel));
  for (const x of [-len / 2 + 0.05, len / 2 - 0.05]) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.08), steel); br.position.set(x, 0, 0.04); g.add(br); }
  // real-size models (s 1): pans and spoons lie flat in their files, so they turn 90° to hang by the handle (handle up)
  const HANG: { m: PhModel; flat?: boolean; w: number }[] = [{ m: "brass_pan_01" as PhModel, flat: true, w: 0.22 }, { m: "brass_pot_02" as PhModel, w: 0.36 }, { m: "metal_jug" as PhModel, w: 0.2 }, { m: "wooden_spoon" as PhModel, flat: true, w: 0.08 }, { m: "brass_pot_01" as PhModel, w: 0.3 }, { m: "wooden_spoon" as PhModel, flat: true, w: 0.08 }];
  let x = -len / 2 + 0.12;
  while (x < len / 2 - 0.12) {
    const it = HANG[Math.floor(r() * HANG.length)];
    if (x + it.w > len / 2 - 0.05) break;
    const cx = x + it.w / 2;
    const hook = tubeAlong([[cx, 0, 0.08], [cx, -0.05, 0.09], [cx, -0.07, 0.08]], 0.004, steel); g.add(hook);
    const m = phModel(it.m, { s: 1, center: true });
    m.rotation.set(it.flat ? Math.PI / 2 : 0.04, (r() - 0.5) * (it.flat ? 0.2 : 0.6), (r() - 0.5) * 0.08);
    const bb = new THREE.Box3().setFromObject(m);                 // unparented: the box is in rail space
    m.position.set(cx, -0.07 - bb.max.y, 0.1 + (it.flat ? 0.03 : (bb.max.z - bb.min.z) / 2)); g.add(m);
    x += it.w + 0.06 + 0.06 * r();
  }
  return g;
};

/** a printed notice / poster / menu on a thin board, a little askew; lines = [text, size px, colour?] */
export const poster = (parent: THREE.Object3D, at: V3, rotY: number, w: number, h: number, bg: string, lines: [string, number, string?][], o: { tilt?: number; key?: string; border?: string } = {}) => {
  const px = 512, ph = Math.round(px * h / w);
  const tex = canvasTex("dress:" + (o.key ?? lines.map((l) => l[0]).join("|")) + bg, px, ph, (c) => {
    c.fillStyle = bg; c.fillRect(0, 0, px, ph);
    for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(60,40,20,${0.02 + 0.03 * Math.random()})`; c.fillRect(Math.random() * px, Math.random() * ph, 2 + 6 * Math.random(), 2 + 6 * Math.random()); }
    if (o.border) { c.strokeStyle = o.border; c.lineWidth = 10; c.strokeRect(12, 12, px - 24, ph - 24); }
    let y = ph * 0.12;
    for (const [t, s, col] of lines) { c.fillStyle = col ?? "#222"; c.font = `900 ${s}px Montserrat, Arial Black, sans-serif`; c.textAlign = "center"; c.textBaseline = "top"; c.fillText(t, px / 2, y, px * 0.86); y += s * 1.18; }
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.008), [std("#ddd"), std("#ddd"), std("#ddd"), std("#ddd"), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), std("#ccc")]);
  m.position.set(...at); m.rotation.set(0, rotY, o.tilt ?? 0); m.castShadow = false; m.receiveShadow = true; parent.add(m);
  return m;
};

/** a straight pipe with brackets every ~0.9 m */
export const pipeRun = (parent: THREE.Object3D, a: V3, b: V3, rad = 0.035, col = "#8c8f92") => {
  const mat = std(col, 0.45, 0.7);
  parent.add(tubeAlong([a, b], rad, mat));
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(2, Math.round(L / 0.9));
  for (let i = 0; i <= n; i++) { const k = i / n; const br = new THREE.Mesh(new THREE.TorusGeometry(rad * 1.25, rad * 0.25, 6, 14), mat); br.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k); parent.add(br); }
};

/** a real wall lamp with a warm light that pools on the wall */
export const wallLamp = (parent: THREE.Object3D, at: V3, rotY: number, col = "#ffb36b", I = 1.6, dist = 3.2) => {
  const m = phModel("industrial_wall_lamp" as PhModel, { h: 0.42 }); m.position.set(...at); m.rotation.y = rotY; parent.add(m);
  const L = new THREE.PointLight(col, I, dist, 2); L.position.set(at[0] + Math.sin(rotY) * 0.18, at[1] - 0.05, at[2] + Math.cos(rotY) * 0.18); L.castShadow = false; parent.add(L);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: "#fff2d8" })); bulb.position.copy(L.position); parent.add(bulb);
  return L;
};
void hsh;

/** a drop-ceiling of 0.6 m tiles (speckled fibre board, metal grid): a ceiling with something on it instead of one flat
 *  cream plane (the bistro kitchen's plain ceiling was the biggest empty, brightest area of its wide shots) */
export const ceilingTileMat = (w: number, d: number, tint = "#b9b2a6") => {   // for planeM/boxM geometry (UVs in metres)
  const tex = canvasTex("dress:ceil" + tint, 256, 256, (c) => {
    c.fillStyle = tint; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) { const v = Math.random(); c.fillStyle = v < 0.5 ? "rgba(70,60,50,0.18)" : "rgba(255,250,240,0.14)"; c.fillRect(Math.random() * 256, Math.random() * 256, 1 + 2 * Math.random(), 1 + 2 * Math.random()); }
    const g = c.createLinearGradient(0, 0, 256, 256); g.addColorStop(0, "rgba(0,0,0,0.0)"); g.addColorStop(1, "rgba(0,0,0,0.08)"); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    c.fillStyle = "#8d9196"; c.fillRect(0, 0, 256, 7); c.fillRect(0, 0, 7, 256);
  });
  const t = tex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 0.6, 1 / 0.6); t.needsUpdate = true; void w; void d;   // planeM / boxM UVs are already in metres
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, side: THREE.DoubleSide });
};
