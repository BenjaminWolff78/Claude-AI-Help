// The shared old granite bridge of "Why He Put a Bridge in the Desert" (the 1831 five-arch river bridge).
// Built by the London builder; used by london.ts (variant "london") and the desert sets (variant "desert").
//
// Local frame: the bridge runs along local x from -L/2 to +L/2; width W along z, centred on z = 0; y = 0 is the level of
// the arch feet (river water level in London, the sand in the desert); deck top surface (pavements) at y = deckY.
//   L = 96, W = 14, deckY = 10.5 (the roadway between the kerbs is 0.12 lower, y = ROAD_Y = 10.38).
//   Arch spans (clear openings) centred at ARCH_X = [-36, -18, 0, 18, 36] with spans ARCH_W = [13, 14, 16, 14, 13]
//   (centre biggest); shallow semi-ellipses springing at y = SPRING (1.564, a course line) with soffit crowns CROWN = [5.5, 6.2, 7.0, 6.2, 5.5].
//   Piers between them (4.5 m and 3 m wide) carry pointed cutwaters up- and downstream (nose 0.6 x pier width out,
//   capped at y 3.8 - 5.0). Abutments x in [+-42.5, +-48]; the bridge ends in plain ashlar end faces at x = +-48.
//   Elevation stack on both faces: coursed ashlar (0.563 m courses from y = -1.25), rusticated voussoir rings
//   (1.15 m deep, keystone proud), a dentil cornice (y 9.45 - 10.5), a stone balustrade parapet (y 10.5 - 11.6,
//   outer face z = +-7.0, inner face z = +-6.45) with pedestals and lamp standards (ornate cast-iron posts with
//   lanterns, on the pedestals at x = +-9.5, +-27.25, +-45, both sides), pavements (z +-4.05..+-6.45), granite kerbs
//   (z +-3.75..+-4.05) and a sett roadway (|z| < 3.75).
// API: const br = oldBridge(parent, { variant: "london" | "desert" });
//   br.g  group (place / rotate it in your set)
//   br.set({ built, numbered, lamps, dismantle, t })
//     built      0..1 how much of the stonework exists (desert rebuild: courses appear from the abutments inward and
//                upward; the last stones are the centre-arch keystones and the deck/parapet over the centre arch:
//                built 0.85 = keystones of the centre arch + a V-notch of deck and parapet above it missing).
//                Hidden stones are simply not drawn; the rubble hearting closes the cut. Default 1.
//     numbered   0..1 painted white stencil numbers (e.g. "3-14-207") on every facing stone and voussoir fade in
//     lamps      0..1 parapet lamps lit (lantern glass, glow card, and point lights on the 4 centre lamps)
//     dismantle  0..1 (variant "london" only) the parapet, cornice and the top two courses are lifted off in 8 m
//                sections from the +x end towards -x, both sides together (lamps, coping, balusters, plinth +
//                pedestals, cornice, top courses); at 1 they are gone along the whole bridge. Stacked stones are the
//                set's job. Default 0.
//     t          seconds (ambient: a faint lantern flicker)
//   br.L, br.W, br.deckY, br.ARCH_X (centres), br.ARCH_W (spans), br.archTop(x) -> soffit height at x (0 at piers /
//   abutments / outside), br.SOLIDS [min, max][] in bridge-local metres (piers + cutwaters, abutments, the arch
//   barrels as strips above the soffit, deck slab, cornice, parapets, lamp standards).
//   Extra read-only fields: br.ROAD_Y, br.SPRING, br.PIERS ([x0, x1] per pier), br.LAMPS (lamp positions [x, y, z] of
//   the lanterns), br.variant.
// Optional extra options (all default off, API above unchanged): { skipLamps: [{ x, side }] } leaves out lamp
//   standards (side +1 = +z parapet); { lights: "centre" | "all" | "none" } which lamps get a point light (default
//   "centre": x = +-9.5 on both sides).
// Performance: everything static is merged per material into ordered buffers (stones sorted by build / dismantle key)
// and the controls only move geometry draw ranges, so a pose costs nothing.
import * as THREE from "three";
import { V } from "../build";
import { ctex, rng, jit } from "../paint";
import { glow } from "../setkit";
import { twoTone } from "../shade";
import type { V3 } from "./types";

export type OldBridgeCtl = { built?: number; numbered?: number; lamps?: number; dismantle?: number; t?: number };
export type OldBridge = {
  g: THREE.Group; set: (c: OldBridgeCtl) => void; L: number; W: number; deckY: number;
  ARCH_X: number[]; ARCH_W: number[]; archTop: (x: number) => number; SOLIDS: [V3, V3][];
  ROAD_Y: number; SPRING: number; PIERS: [number, number][]; LAMPS: V3[]; variant: "london" | "desert";
};
const L = 96, W = 14, DECK = 10.5, ROAD = 10.38, HW = W / 2;
const ARCH_X = [-36, -18, 0, 18, 36], ARCH_W = [13, 14, 16, 14, 13];
const Y0 = -1.253, CH = (9.45 - Y0) / 19; // 19 face courses: course 5 starts at the springing, 19 ends at the cornice
const CY = (j: number) => Y0 + j * CH;
const SPRING = CY(5), CROWN = [5.5, 6.2, 7.0, 6.2, 5.5], RING = 1.15;
const CORN0 = 9.45, PAR0 = DECK, PAR1 = DECK + 1.1;
const PI_IN = HW - 0.55; // parapet inner face
const KERB = 4.05, KERB_IN = 3.75;
const GAP = 0.024, BACK = -0.012; // stone joint gap, mortar slot depth (relative to the face plane)
const TAU = Math.PI * 2;
const ARCHES = ARCH_X.map((cx, i) => ({ cx, a: ARCH_W[i] / 2, b: CROWN[i] - SPRING, ao: ARCH_W[i] / 2 + RING, bo: CROWN[i] - SPRING + RING }));
const PIERS: [number, number][] = [];
for (let i = 0; i < 4; i++) PIERS.push([ARCH_X[i] + ARCH_W[i] / 2, ARCH_X[i + 1] - ARCH_W[i + 1] / 2]);
const CW_TOP = CY(9), CW_CAP = 5.0; // cutwater coursed to course 9 (y 3.82), capped to y 5.0 at the face
const archTop = (x: number) => {
  for (const A of ARCHES) { const u = (x - A.cx) / A.a; if (Math.abs(u) < 1) return SPRING + A.b * Math.sqrt(1 - u * u); }
  return 0;
};
/** extrados height at x (top of the voussoir ring), -Infinity away from the rings */
const extr = (x: number) => {
  for (const A of ARCHES) { const u = (x - A.cx) / A.ao; if (Math.abs(u) < 1) return SPRING + A.bo * Math.sqrt(1 - u * u); }
  return -Infinity;
};
/** desert rebuild order: outer + low first, the centre crown and the deck above it last */
const bkey = (x: number, y: number) => 0.6 * (1 - Math.min(1, Math.abs(x) / 48)) + 0.4 * Math.max(0, Math.min(1, y / 11.6));
/** London dismantling order: 12 sections of 8 m from +x, layer 0..5 inside a section (top first) */
const dkey = (x: number, layer: number) => (Math.min(11, Math.floor((48 - x) / 8)) + layer / 6) / 12;

// ---------------- textures ----------------
const U = (r: () => number, a: number, b: number) => a + (b - a) * r();
const NC = 4, NR = 8; // atlas cells: rows 0-4 clean ashlar, row 5 crusted (London), rows 6-7 rusticated (voussoirs)
const atlasTex = () => ctex("obAtlas", 2048, 2048, (g, r) => {
  const CW = 512, CHh = 256;
  for (let row = 0; row < NR; row++) for (let col = 0; col < NC; col++) {
    const X = col * CW, Y = row * CHh;
    g.save(); g.beginPath(); g.rect(X, Y, CW, CHh); g.clip();
    const base = jit(r, ["#dcd5c8", "#d6cfc2", "#e0d9cc", "#d3cbbd", "#d9d3c9"][Math.floor(r() * 5)], 0.05, 6, 0.3);
    g.fillStyle = base; g.fillRect(X, Y, CW, CHh);
    // broad mottling
    for (let i = 0; i < 9; i++) {
      const x = X + U(r, 0, CW), y = Y + U(r, 0, CHh), rad = U(r, 40, 150), d = r() < 0.55;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, d ? `rgba(110,100,92,${U(r, 0.06, 0.14)})` : `rgba(255,252,244,${U(r, 0.08, 0.16)})`); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(X, Y, CW, CHh);
    }
    // granite crystals: dark mica, grey quartz, white feldspar, a few warm grains
    for (let i = 0; i < 1500; i++) {
      const x = X + U(r, 0, CW), y = Y + U(r, 0, CHh), k = r(), s = U(r, 0.7, 2.1);
      g.fillStyle = k < 0.45 ? `rgba(70,66,70,${U(r, 0.25, 0.55)})` : k < 0.7 ? `rgba(150,146,148,${U(r, 0.3, 0.5)})` : k < 0.92 ? `rgba(255,255,252,${U(r, 0.35, 0.7)})` : `rgba(196,150,128,${U(r, 0.3, 0.5)})`;
      g.beginPath(); g.ellipse(x, y, s, s * U(r, 0.5, 1), r() * 3, 0, TAU); g.fill();
    }
    const rust = row >= 6;
    if (rust) {
      // rusticated: smooth drafted margin, a groove, rock-faced centre (pits + lumps)
      const M = 30;
      g.fillStyle = "rgba(255,250,240,0.16)"; g.fillRect(X, Y, CW, M); g.fillRect(X, Y, M, CHh);
      g.fillStyle = "rgba(60,55,58,0.12)"; g.fillRect(X, Y + CHh - M, CW, M); g.fillRect(X + CW - M, Y, M, CHh);
      g.strokeStyle = "rgba(70,62,62,0.45)"; g.lineWidth = 4; g.strokeRect(X + M, Y + M, CW - 2 * M, CHh - 2 * M);
      g.strokeStyle = "rgba(255,250,240,0.3)"; g.lineWidth = 2; g.strokeRect(X + M + 3, Y + M + 3, CW - 2 * M - 6, CHh - 2 * M - 6);
      for (let i = 0; i < 70; i++) {
        const x = X + M + 10 + U(r, 0, CW - 2 * M - 20), y = Y + M + 10 + U(r, 0, CHh - 2 * M - 20), rad = U(r, 6, 22), d = r() < 0.5;
        const gr = g.createRadialGradient(x - rad * 0.3, y - rad * 0.3, 0, x, y, rad);
        gr.addColorStop(0, d ? "rgba(255,252,244,0.22)" : "rgba(80,72,70,0.2)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
    }
    if (row === 5) { // crusted: black soot crust patches + run-down streaks (London only)
      for (let i = 0; i < 5; i++) {
        const x = X + U(r, 0, CW), y = Y + U(r, 0, CHh), rad = U(r, 50, 130);
        const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(40,36,40,0.35)"); gr.addColorStop(1, "rgba(40,36,40,0)");
        g.fillStyle = gr; g.fillRect(X, Y, CW, CHh);
      }
    }
    // rain streaks from the top edge
    for (let i = 0; i < (row === 5 ? 9 : 3); i++) {
      const x = X + U(r, 10, CW - 20), w = U(r, 5, 18), h = U(r, 60, CHh);
      const gr = g.createLinearGradient(0, Y, 0, Y + h); gr.addColorStop(0, `rgba(80,72,68,${row === 5 ? 0.3 : 0.12})`); gr.addColorStop(1, "rgba(80,72,68,0)");
      g.fillStyle = gr; g.fillRect(x, Y, w, h);
    }
    // a corner chip or two, a hairline crack now and then
    for (let i = 0; i < (r() < 0.6 ? 1 : 2); i++) {
      const cx = r() < 0.5 ? X : X + CW, cy = r() < 0.5 ? Y : Y + CHh, s = U(r, 14, 34), sx = cx === X ? 1 : -1, sy = cy === Y ? 1 : -1;
      g.fillStyle = "rgba(120,110,104,0.55)"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * s, cy); g.lineTo(cx + sx * s * 0.4, cy + sy * s * 0.7); g.lineTo(cx, cy + sy * s * 0.9); g.fill();
      g.strokeStyle = "rgba(255,252,244,0.45)"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + sx * s, cy); g.lineTo(cx + sx * s * 0.4, cy + sy * s * 0.7); g.lineTo(cx, cy + sy * s * 0.9); g.stroke();
    }
    if (r() < 0.3) {
      let x = X + U(r, 60, CW - 60), y = Y + U(r, 20, 80);
      g.strokeStyle = "rgba(90,80,78,0.5)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += U(r, -30, 30); y += U(r, 15, 35); g.lineTo(x, y); }
      g.stroke();
    }
    // bevels + a soft dark rim (reads as the joint from far away, where the real gap is sub-pixel)
    const lg = g.createLinearGradient(0, Y, 0, Y + 14); lg.addColorStop(0, "rgba(255,252,246,0.32)"); lg.addColorStop(1, "rgba(255,252,246,0)");
    g.fillStyle = lg; g.fillRect(X, Y, CW, 14);
    const sg = g.createLinearGradient(0, Y + CHh - 16, 0, Y + CHh); sg.addColorStop(0, "rgba(60,54,56,0)"); sg.addColorStop(1, "rgba(60,54,56,0.3)");
    g.fillStyle = sg; g.fillRect(X, Y + CHh - 16, CW, 16);
    g.fillStyle = "rgba(255,252,246,0.14)"; g.fillRect(X, Y, 8, CHh);
    g.fillStyle = "rgba(60,54,56,0.16)"; g.fillRect(X + CW - 10, Y, 10, CHh);
    g.strokeStyle = "rgba(58,52,54,0.55)"; g.lineWidth = 6; g.strokeRect(X + 1, Y + 1, CW - 2, CHh - 2);
    g.restore();
  }
});
/** uv rectangle of atlas cell i ([u0, v0, u1, v1], canvas flipped by three) */
const cellUV = (i: number): [number, number, number, number] => {
  const col = i % NC, row = Math.floor(i / NC) % NR, e = 3 / 2048;
  return [col / NC + e, 1 - (row + 1) / NR + e, (col + 1) / NC - e, 1 - row / NR - e];
};
const graniteTex = () => ctex("obGranite", 512, 512, (g, r) => {
  g.fillStyle = "#d9d2c6"; g.fillRect(0, 0, 512, 512);
  const dot = (x: number, y: number, s: number, c: string) => { for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) { g.fillStyle = c; g.beginPath(); g.arc(x + dx, y + dy, s, 0, TAU); g.fill(); } };
  for (let i = 0; i < 20; i++) { const x = U(r, 0, 512), y = U(r, 0, 512), d = r() < 0.5; dot(x, y, U(r, 30, 90), d ? "rgba(110,100,92,0.06)" : "rgba(255,252,244,0.08)"); }
  for (let i = 0; i < 2600; i++) { const k = r(); dot(U(r, 0, 512), U(r, 0, 512), U(r, 0.6, 1.8), k < 0.45 ? "rgba(70,66,70,0.45)" : k < 0.75 ? "rgba(150,146,148,0.4)" : "rgba(255,255,252,0.55)"); }
});
const numsTex = () => ctex("obNums", 2048, 1024, (g, r) => {
  g.clearRect(0, 0, 2048, 1024);
  for (let i = 0; i < 64; i++) {
    const X = (i % 8) * 256, Y = Math.floor(i / 8) * 128;
    const txt = `${1 + Math.floor(r() * 5)}-${1 + Math.floor(r() * 19)}-${String(1 + Math.floor(r() * 640))}`;
    g.save(); g.translate(X + 128, Y + 64); g.rotate(U(r, -0.04, 0.04));
    let fs = 78; g.font = `900 ${fs}px "DejaVu Sans Condensed", "DejaVu Sans", Arial, sans-serif`;
    const w = g.measureText(txt).width; if (w > 220) { fs *= 220 / w; g.font = `900 ${fs}px "DejaVu Sans Condensed", "DejaVu Sans", Arial, sans-serif`; }
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fbfaf4"; g.fillText(txt, 0, 2);
    // stencil bridges + dry-brush edges
    g.globalCompositeOperation = "destination-out";
    g.fillRect(-128, -fs * 0.04, 256, fs * 0.07);
    for (let k = 0; k < 60; k++) { g.globalAlpha = U(r, 0.3, 0.9); g.fillRect(U(r, -120, 120), U(r, -fs * 0.45, fs * 0.45), U(r, 1, 5), U(r, 1, 3)); }
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    g.restore();
  }
});
const noiseTex = () => {
  const t = ctex("obNoise", 256, 256, (g, r) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, 256, 256); g.globalCompositeOperation = "lighter";
    for (let i = 0; i < 90; i++) { // R: blotches
      const x = U(r, 0, 256), y = U(r, 0, 256), rad = U(r, 10, 46), a = U(r, 0.15, 0.4);
      for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) {
        const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad); gr.addColorStop(0, `rgba(255,0,0,${a})`); gr.addColorStop(1, "rgba(255,0,0,0)");
        g.fillStyle = gr; g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
      }
    }
    for (let i = 0; i < 26; i++) { // G: soft vertical streaks
      const x = U(r, 0, 256), w = U(r, 6, 22), a = U(r, 0.25, 0.8);
      for (const dx of [-256, 0, 256]) { const gr = g.createLinearGradient(x + dx, 0, x + dx + w, 0); gr.addColorStop(0, "rgba(0,255,0,0)"); gr.addColorStop(0.5, `rgba(0,255,0,${a})`); gr.addColorStop(1, "rgba(0,255,0,0)"); g.fillStyle = gr; g.fillRect(x + dx, 0, w, 256); }
    }
    g.globalCompositeOperation = "source-over";
  });
  t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true; return t;
};
const rubbleTex = (light = false) => ctex(light ? "obRubbleL" : "obRubble", 512, 512, (g, r) => {
  g.fillStyle = light ? "#a8987e" : "#5c5650"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = U(r, 0, 512), y = U(r, 0, 512), w = U(r, 18, 46), h = w * U(r, 0.5, 0.9), c = jit(r, light ? "#e2d6c0" : "#8f8a84", 0.15, 4, 0.1);
    for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) {
      g.fillStyle = c; g.beginPath(); g.ellipse(x + dx, y + dy, w / 2, h / 2, U(r, 0, 3), 0, TAU); g.fill();
      g.fillStyle = "rgba(255,250,240,0.18)"; g.beginPath(); g.ellipse(x + dx - w * 0.1, y + dy - h * 0.15, w * 0.3, h * 0.2, 0, 0, TAU); g.fill();
    }
  }
});

// ---------------- materials ----------------
const WEATHER = /* glsl */ `
{
  vec2 nq = vec2((vLP.x + vLP.z) * 0.3, vLP.y * 0.3);
  float n1 = texture2D(obNoise, nq).r;
  float n2 = texture2D(obNoise, nq * 2.7 + 0.31).r;
  float st = texture2D(obNoise, vec2((vLP.x - vLP.z) * 0.22, vLP.y * 0.03)).g;
  float yy = vLP.y + (n1 - 0.5) * 0.55 + (n2 - 0.5) * 0.25;
  // tide / moss band (London) or sand dust (desert)
  float band = 1.0 - smoothstep(obTide - 0.12, obTide + 0.06, yy - st * obDrip);
  vec3 mc = mix(obMossA, obMossB, smoothstep(0.2, 0.7, n2));
  diffuseColor.rgb = mix(diffuseColor.rgb, mc * (0.75 + 0.5 * n1), band * obBandK);
  // damp darkening above the band
  float damp = 1.0 - smoothstep(obTide, obTide + 2.2, yy);
  diffuseColor.rgb *= 1.0 - damp * obDampK;
  // soot / rain streaks down the faces and a sheltered dark band under the cornice
  float soot = smoothstep(0.3, 0.9, st) * smoothstep(1.5, 8.0, vLP.y) * (0.5 + 0.6 * n1);
  float shel = smoothstep(8.0, 9.4, vLP.y) * (1.0 - step(9.45, vLP.y));
  diffuseColor.rgb *= 1.0 - clamp(soot * obSootK + shel * obSootK * 0.45, 0.0, 0.7);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * obWarm, n1 * 0.6);
}`;
const matCache = new Map<string, THREE.Material>();
const cached = <T extends THREE.Material>(key: string, make: () => T) => { let m = matCache.get(key) as T | undefined; if (!m) { m = make(); matCache.set(key, m); } return m; };
type Variant = "london" | "desert";
const weatherMat = (key: string, v: Variant, map: THREE.Texture, color: string, vc = true) => cached("obW_" + key + v, () => {
  const m = twoTone(new THREE.MeshLambertMaterial({ map, color, vertexColors: vc }));
  const Lon = v === "london";
  const uni = {
    obNoise: { value: noiseTex() }, obTide: { value: Lon ? 0.75 : 0.18 }, obDrip: { value: Lon ? 0.9 : 0.25 },
    obBandK: { value: Lon ? 0.92 : 0.55 }, obDampK: { value: Lon ? 0.3 : 0.0 }, obSootK: { value: Lon ? 0.5 : 0.0 },
    obMossA: { value: new THREE.Color(Lon ? "#3e5a34" : "#cfa874") }, obMossB: { value: new THREE.Color(Lon ? "#86a84a" : "#e2c08c") },
    obWarm: { value: new THREE.Vector3(...(Lon ? [0.92, 0.94, 0.98] : [1.04, 1.0, 0.93])) },
  };
  const base = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    base.call(m, sh, r);
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vLP;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvLP = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLP; uniform sampler2D obNoise; uniform float obTide, obDrip, obBandK, obDampK, obSootK; uniform vec3 obMossA, obMossB, obWarm;")
      .replace("#include <color_fragment>", "#include <color_fragment>\n" + WEATHER);
  };
  m.customProgramCacheKey = () => "obWeather2_twoTone6";
  return m;
});
/** the bridge's weathered-stone material (tide / moss band, damp, soot streaks by height above y = 0) for other river
 *  masonry of a set (embankment walls, landings): no vertex colours; geometry must be built in set-local metres. */
export const riverStoneMat = (variant: "london" | "desert", map: THREE.Texture, color: string) => weatherMat("ext_" + map.uuid + color, variant, map, color, false);
const plainMat = (key: string, p: THREE.MeshLambertMaterialParameters) => cached("obP_" + key, () => twoTone(new THREE.MeshLambertMaterial(p)));
const MATS = (v: Variant) => {
  const Lon = v === "london";
  const atlas = atlasTex(), gran = graniteTex();
  gran.wrapS = gran.wrapT = THREE.RepeatWrapping;
  return {
    stone: weatherMat("stone", v, atlas, Lon ? "#b3ada3" : "#f3e9d8"),
    gran: weatherMat("gran", v, gran, Lon ? "#aca69d" : "#f0e6d4"),
    mortar: plainMat("mortar" + v, { color: Lon ? "#5e5854" : "#a8977e" }),
    rubble: plainMat("rubble" + v, { map: rubbleTex(!Lon), color: Lon ? "#8d8780" : "#f4ead8" }),
    flags: plainMat("flags" + v, { map: atlas, color: Lon ? "#9b968e" : "#efe4d0", vertexColors: true }),
    setts: plainMat("setts" + v, { map: setTex(), color: Lon ? "#8e8c94" : "#f2e8d8" }),
    iron: plainMat("iron" + v, { color: Lon ? "#2b3638" : "#3a4446" }),
    ironHi: plainMat("ironHi" + v, { color: Lon ? "#4a5a58" : "#5c6a68" }),
    nums: cached("obNum" + v, () => {
      const m = twoTone(new THREE.MeshLambertMaterial({ map: numsTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, color: "#ffffff" }));
      m.opacity = 0; return m;
    }) as THREE.MeshLambertMaterial,
  };
};
/** granite setts for the roadway (512 px = 2 m), slightly domed, warm grey */
const setTex = () => ctex("obSetts", 1024, 1024, (g, r) => {
  const S = 1024, N = 16, CHs = S / N;
  g.fillStyle = "#6f6862"; g.fillRect(0, 0, S, S);
  for (let row = 0; row < N; row++) {
    let x = (row % 2) * 30 - 30;
    while (x < S) {
      const w = U(r, 52, 80), c = jit(r, ["#b8b0a4", "#aea596", "#c2b9ab", "#a59c90"][Math.floor(r() * 4)], 0.1, 6, 0.25);
      for (const dx of [-S, 0, S]) {
        const X = x + dx + 3, Y = row * CHs + 3, Wd = w - 6, H = CHs - 6;
        g.fillStyle = c; g.beginPath(); g.roundRect(X, Y, Wd, H, 9); g.fill();
        const gr = g.createLinearGradient(X, Y, X, Y + H); gr.addColorStop(0, "rgba(255,250,240,0.25)"); gr.addColorStop(0.5, "rgba(255,250,240,0)"); gr.addColorStop(1, "rgba(50,45,44,0.25)");
        g.fillStyle = gr; g.beginPath(); g.roundRect(X, Y, Wd, H, 9); g.fill();
        for (let k = 0; k < 6; k++) { g.fillStyle = r() < 0.5 ? "rgba(70,66,70,0.4)" : "rgba(255,255,250,0.4)"; g.fillRect(X + U(r, 4, Wd - 4), Y + U(r, 4, H - 4), 2, 2); }
      }
      x += w;
    }
  }
  for (let i = 0; i < 30; i++) { const x = U(r, 0, S), y = U(r, 0, S), rad = U(r, 40, 140); const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(60,55,60,0.12)"); gr.addColorStop(1, "rgba(60,55,60,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
});

// ---------------- ordered batch (pieces sorted by key; controls move draw ranges) ----------------
type Piece = { k: number; p: number[]; n: number[]; u: number[]; c: number[] };
type Ranged = { mesh: THREE.Mesh; keys: number[]; starts: number[]; total: number };
class OBatch {
  private m = new Map<THREE.Material, Piece[]>();
  private cur!: Piece;
  tint: [number, number, number] = [1, 1, 1];
  begin(mat: THREE.Material, key: number) {
    const pc: Piece = { k: key, p: [], n: [], u: [], c: [] };
    let l = this.m.get(mat); if (!l) { l = []; this.m.set(mat, l); } l.push(pc); this.cur = pc; return this;
  }
  private vert(p: THREE.Vector3, n: THREE.Vector3, u: number, v: number) {
    const c = this.cur; c.p.push(p.x, p.y, p.z); c.n.push(n.x, n.y, n.z); c.u.push(u, v); c.c.push(...this.tint);
  }
  /** quad a b c d (any winding: flipped to face `want`) with uvs */
  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, ua: [number, number], ub: [number, number], uc: [number, number], ud: [number, number], want?: THREE.Vector3) {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a));
    if (n.lengthSq() < 1e-12) n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b));
    n.normalize();
    if (want && n.dot(want) < 0) { this.quad(a, d, c, b, ua, ud, uc, ub); return; }
    this.vert(a, n, ...ua); this.vert(b, n, ...ub); this.vert(c, n, ...uc);
    this.vert(a, n, ...ua); this.vert(c, n, ...uc); this.vert(d, n, ...ud);
  }
  tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, ua: [number, number], ub: [number, number], uc: [number, number], want?: THREE.Vector3) {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    if (want && n.dot(want) < 0) { this.tri(a, c, b, ua, uc, ub); return; }
    this.vert(a, n, ...ua); this.vert(b, n, ...ub); this.vert(c, n, ...uc);
  }
  /** a whole BufferGeometry (indexed or not), transformed */
  geo(gm: THREE.BufferGeometry, m: THREE.Matrix4) {
    const src = gm.index ? gm.toNonIndexed() : gm.clone(); src.applyMatrix4(m);
    const P = src.attributes.position, N = src.attributes.normal, UVa = src.attributes.uv, c = this.cur;
    for (let i = 0; i < P.count; i++) { c.p.push(P.getX(i), P.getY(i), P.getZ(i)); c.n.push(N.getX(i), N.getY(i), N.getZ(i)); c.u.push(UVa ? UVa.getX(i) : 0, UVa ? UVa.getY(i) : 0); c.c.push(...this.tint); }
  }
  build(parent: THREE.Object3D, cast = true): Ranged[] {
    const out: Ranged[] = [];
    for (const [mat, list] of this.m) {
      list.sort((a, b) => a.k - b.k);
      let nv = 0; for (const pc of list) nv += pc.p.length / 3;
      const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), UV = new Float32Array(nv * 2), C = new Float32Array(nv * 3);
      const keys: number[] = [], starts: number[] = [];
      let o = 0;
      for (const pc of list) { keys.push(pc.k); starts.push(o); P.set(pc.p, o * 3); N.set(pc.n, o * 3); C.set(pc.c, o * 3); UV.set(pc.u, o * 2); o += pc.p.length / 3; }
      const gm = new THREE.BufferGeometry();
      gm.setAttribute("position", new THREE.BufferAttribute(P, 3)); gm.setAttribute("normal", new THREE.BufferAttribute(N, 3));
      gm.setAttribute("uv", new THREE.BufferAttribute(UV, 2)); gm.setAttribute("color", new THREE.BufferAttribute(C, 3));
      gm.computeBoundingSphere();
      const mesh = new THREE.Mesh(gm, mat); mesh.castShadow = cast && !(mat as THREE.Material).transparent; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
      parent.add(mesh);
      out.push({ mesh, keys, starts, total: nv });
    }
    this.m.clear();
    return out;
  }
}
/** first index with keys[i] > u (keys sorted) */
const upper = (keys: number[], u: number) => { let lo = 0, hi = keys.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (keys[mid] <= u) lo = mid + 1; else hi = mid; } return lo; };
const lower = (keys: number[], u: number) => { let lo = 0, hi = keys.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (keys[mid] < u) lo = mid + 1; else hi = mid; } return lo; };

// ---------------- the bridge ----------------
export const oldBridge = (parent: THREE.Object3D, o: { variant?: Variant; skipLamps?: { x: number; side: number }[]; lights?: "centre" | "all" | "none" } = {}): OldBridge => {
  const variant: Variant = o.variant ?? "london", Lon = variant === "london";
  const g = new THREE.Group(); g.name = "oldBridge"; parent.add(g);
  const M = MATS(variant);
  const r = rng(Lon ? 1831 : 1971);
  const A = new OBatch(), B = new OBatch(); // A: structure (built), B: parapet + cornice + top courses (dismantle in London)
  const keyB = (x: number, y: number, layer: number) => (Lon ? dkey(x, layer) : bkey(x, y));
  const cellPool = Lon ? 24 : 20;
  const tintStone = () => {
    const k = 1 + U(r, -1, 1) * (Lon ? 0.12 : 0.08), dark = Lon && r() < 0.18 ? 0.82 : 1;
    const warm = U(r, -1, 1) * 0.035;
    return [k * dark * (1 + warm), k * dark, k * dark * (1 - warm * 1.4)] as [number, number, number];
  };
  const Z = new THREE.Vector3(0, 0, 1), Y = new THREE.Vector3(0, 1, 0);

  // ---- a coursed stone on a planar wall: point = o + U*a + Y*y + N*n ----
  type Wall = { o: THREE.Vector3; U: THREE.Vector3; N: THREE.Vector3; flip?: boolean };
  const P = (w: Wall, a: number, y: number, n: number) => w.o.clone().addScaledVector(w.U, a).addScaledVector(Y, y).addScaledVector(w.N, n);
  const stone = (bt: OBatch, w: Wall, a0: number, a1: number, y0: number, y1: number, key: number, o2: { bottom?: (a: number) => number; cell?: number; prot?: number; num?: boolean; slot?: boolean } = {}) => {
    const g2 = GAP / 2, prot = o2.prot ?? U(r, 0, 0.012);
    const cell = cellUV(o2.cell ?? Math.floor(r() * cellPool));
    const bot = (a: number) => Math.max(y0, o2.bottom ? o2.bottom(a) : y0);
    const n = o2.bottom ? Math.max(2, Math.ceil((a1 - a0) / 0.14) + 1) : 2;
    const A0 = a0 + g2, A1 = a1 - g2, T = y1 - g2;
    const as = Array.from({ length: n }, (_, i) => A0 + ((A1 - A0) * i) / (n - 1));
    const bs = as.map((a) => Math.min(T - 0.02, bot(a) + g2));
    const uvOf = (a: number, y: number): [number, number] => {
      const ua = w.flip ? (a1 - a) / (a1 - a0) : (a - a0) / (a1 - a0);
      return [cell[0] + (cell[2] - cell[0]) * ua, cell[1] + (cell[3] - cell[1]) * Math.max(0, Math.min(1, (y - y0) / (y1 - y0)))];
    };
    bt.tint = tintStone();
    bt.begin(M.stone, key);
    const NN = w.N;
    for (let i = 0; i < n - 1; i++) {
      bt.quad(P(w, as[i], bs[i], prot), P(w, as[i + 1], bs[i + 1], prot), P(w, as[i + 1], T, prot), P(w, as[i], T, prot), uvOf(as[i], bs[i]), uvOf(as[i + 1], bs[i + 1]), uvOf(as[i + 1], T), uvOf(as[i], T), NN);
      // bottom side (follows the curve)
      const d = P(w, as[i + 1], bs[i + 1], 0).sub(P(w, as[i], bs[i], 0)), down = new THREE.Vector3().crossVectors(d, w.N).normalize();
      if (down.y > 0) down.negate();
      bt.quad(P(w, as[i], bs[i], prot), P(w, as[i + 1], bs[i + 1], prot), P(w, as[i + 1], bs[i + 1], BACK), P(w, as[i], bs[i], BACK), [cell[0], cell[1]], [cell[2], cell[1]], [cell[2], cell[1] + 0.01], [cell[0], cell[1] + 0.01], down);
    }
    bt.quad(P(w, A0, T, prot), P(w, A1, T, prot), P(w, A1, T, BACK), P(w, A0, T, BACK), [cell[0], cell[3]], [cell[2], cell[3]], [cell[2], cell[3] - 0.01], [cell[0], cell[3] - 0.01], Y);
    bt.quad(P(w, A0, bs[0], prot), P(w, A0, T, prot), P(w, A0, T, BACK), P(w, A0, bs[0], BACK), [cell[0], cell[1]], [cell[0], cell[3]], [cell[0] + 0.01, cell[3]], [cell[0] + 0.01, cell[1]], w.U.clone().negate());
    bt.quad(P(w, A1, bs[n - 1], prot), P(w, A1, T, prot), P(w, A1, T, BACK), P(w, A1, bs[n - 1], BACK), [cell[2], cell[1]], [cell[2], cell[3]], [cell[2] - 0.01, cell[3]], [cell[2] - 0.01, cell[1]], w.U);
    if (o2.slot !== false) {
      bt.begin(M.mortar, key);
      const bs0 = as.map((a) => bot(a));
      const as0 = Array.from({ length: n }, (_, i) => a0 + ((a1 - a0) * i) / (n - 1));
      for (let i = 0; i < n - 1; i++) bt.quad(P(w, as0[i], bs0[i], BACK), P(w, as0[i + 1], bs0[i + 1], BACK), P(w, as0[i + 1], y1, BACK), P(w, as0[i], y1, BACK), [0, 0], [1, 0], [1, 1], [0, 1], NN);
    }
    if (o2.num !== false && a1 - a0 > 0.5 && T - Math.max(...bs) > 0.3) {
      const nc = Math.floor(r() * 64), nu0 = (nc % 8) / 8, nv1 = 1 - Math.floor(nc / 8) / 8, nu1 = nu0 + 1 / 8, nv0 = nv1 - 1 / 8;
      const dw = Math.min(0.56, (a1 - a0) * 0.7), dh = dw * 0.45, am = (a0 + a1) / 2 + U(r, -0.1, 0.1) * (a1 - a0 - dw), ym = T - 0.07 - dh / 2;
      const ua = w.flip ? [nu1, nu0] : [nu0, nu1];
      bt.begin(M.nums, key);
      bt.quad(P(w, am - dw / 2, ym - dh / 2, prot + 0.002), P(w, am + dw / 2, ym - dh / 2, prot + 0.002), P(w, am + dw / 2, ym + dh / 2, prot + 0.002), P(w, am - dw / 2, ym + dh / 2, prot + 0.002),
        [ua[0], nv0], [ua[1], nv0], [ua[1], nv1], [ua[0], nv1], NN);
    }
  };
  /** lay random-length stones along [a0, a1] in a course */
  const run = (a0: number, a1: number, f: (s0: number, s1: number) => void, lo = 0.85, hi = 1.7) => {
    let a = a0; const cuts: number[] = [a0];
    while (a1 - a > hi) { a += U(r, lo, hi); cuts.push(a); }
    if (a1 - a < 0.45 && cuts.length > 1) cuts.pop();
    cuts.push(a1);
    for (let i = 0; i < cuts.length - 1; i++) f(cuts[i], cuts[i + 1]);
  };
  const minus = (iv: [number, number][], cut: [number, number]) => {
    const out: [number, number][] = [];
    for (const [a, b] of iv) { if (cut[1] <= a || cut[0] >= b) { out.push([a, b]); continue; } if (cut[0] > a) out.push([a, cut[0]]); if (cut[1] < b) out.push([cut[1], b]); }
    return out.filter(([a, b]) => b - a > 0.05);
  };

  // ---- the two faces: coursed spandrels / pier fronts / abutments ----
  for (const s of [1, -1]) {
    const w: Wall = { o: V(0, 0, s * HW), U: V(1, 0, 0), N: V(0, 0, s), flip: s < 0 };
    for (let j = 0; j < 19; j++) {
      const y0 = CY(j), y1 = CY(j + 1);
      let iv: [number, number][] = [[-L / 2, L / 2]];
      for (const Ar of ARCHES) {
        if (y1 <= SPRING + 1e-6) iv = minus(iv, [Ar.cx - Ar.a, Ar.cx + Ar.a]);
        else { const q = (y1 - 0.1 - SPRING) / Ar.bo; if (q < 1) { const hw = Ar.ao * Math.sqrt(1 - q * q); iv = minus(iv, [Ar.cx - hw, Ar.cx + hw]); } }
      }
      if (y1 <= CW_TOP + 1e-6) for (const [p0, p1] of PIERS) iv = minus(iv, [p0, p1]);
      const top2 = j >= 17;
      for (const [a, b] of iv) run(a, b, (x0, x1) => {
        const xm = (x0 + x1) / 2, cutNeeded = y0 > SPRING - 1e-6 && [0, 0.25, 0.5, 0.75, 1].some((k) => extr(x0 + (x1 - x0) * k) > y0 - 0.01);
        const bt = top2 ? B : A, key = top2 ? keyB(xm, (y0 + y1) / 2, j === 18 ? 4 : 5) : bkey(xm, (y0 + y1) / 2);
        stone(bt, w, x0, x1, y0, y1, key, { bottom: cutNeeded ? extr : undefined });
      });
    }
  }
  // ---- voussoir rings + soffits ----
  ARCHES.forEach((Ar, ai) => {
    const ellIn = (t: number) => V(Ar.cx + Ar.a * Math.cos(t), SPRING + Ar.b * Math.sin(t), 0);
    const ellOut = (t: number) => V(Ar.cx + Ar.ao * Math.cos(t), SPRING + Ar.bo * Math.sin(t), 0);
    // arc-length parametrisation on the mid ring
    const NS = 600, cum: number[] = [0], ts: number[] = [];
    for (let i = 0; i <= NS; i++) ts.push(Math.PI - (Math.PI * i) / NS);
    const mid = (t: number) => ellIn(t).add(ellOut(t)).multiplyScalar(0.5);
    for (let i = 1; i <= NS; i++) cum.push(cum[i - 1] + mid(ts[i]).distanceTo(mid(ts[i - 1])));
    const len = cum[NS];
    let nv = Math.round(len / 0.66); if (nv % 2 === 0) nv++;
    const tAt = (sArc: number) => { let i = 1; while (i < NS && cum[i] < sArc) i++; const u = (sArc - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]); return ts[i - 1] + (ts[i] - ts[i - 1]) * u; };
    const tk = Array.from({ length: nv + 1 }, (_, k) => tAt((len * k) / nv));
    for (let k = 0; k < nv; k++) {
      const ta = tk[k], tb = tk[k + 1], key = k === (nv - 1) / 2;
      const xm = mid((ta + tb) / 2).x, ym = mid((ta + tb) / 2).y;
      const bk = bkey(xm, ym);
      const cell = cellUV(24 + Math.floor(r() * 8));
      // per face: front + sides + slot + number
      for (const s of [1, -1]) {
        const prot = key ? 0.17 : U(r, 0.075, 0.1), zf = s * (HW + prot), zb = s * (HW + BACK);
        const dA = GAP / 2 / Math.max(0.3, mid(ta).distanceTo(mid(tb))) * (tb - ta);
        const t0 = ta + dA, t1 = tb - dA, tm = (t0 + t1) / 2;
        const inP = (t: number, z: number, sh: number) => { const pi = ellIn(t), po = ellOut(t), d = po.clone().sub(pi).normalize(); return pi.addScaledVector(d, sh).setZ(z); };
        const outP = (t: number, z: number, sh: number) => { const pi = ellIn(t), po = ellOut(t), d = po.clone().sub(pi).normalize(); return po.addScaledVector(d, -sh).setZ(z); };
        const T3 = [t0, tm, t1], ex = 0;
        A.tint = tintStone(); A.begin(M.stone, bk);
        const fz = V(0, 0, s);
        const uvF = (i: number, outer: boolean): [number, number] => { const ua = s > 0 ? i / 2 : 1 - i / 2; return [cell[0] + (cell[2] - cell[0]) * (outer ? 1 : 0), cell[1] + (cell[3] - cell[1]) * ua]; };
        for (let i = 0; i < 2; i++) {
          A.quad(inP(T3[i], zf, GAP / 2), outP(T3[i], zf, GAP / 2 - ex), outP(T3[i + 1], zf, GAP / 2 - ex), inP(T3[i + 1], zf, GAP / 2), uvF(i, false), uvF(i, true), uvF(i + 1, true), uvF(i + 1, false), fz);
          // intrados + extrados sides
          const cIn = V(Ar.cx, SPRING, 0);
          const pin = inP(T3[i], 0, 0), downIn = cIn.clone().sub(pin).normalize();
          A.quad(inP(T3[i], zf, GAP / 2), inP(T3[i + 1], zf, GAP / 2), inP(T3[i + 1], zb, GAP / 2), inP(T3[i], zb, GAP / 2), [cell[0], cell[1]], [cell[0], cell[3]], [cell[0] + 0.01, cell[3]], [cell[0] + 0.01, cell[1]], downIn);
          A.quad(outP(T3[i], zf, GAP / 2), outP(T3[i + 1], zf, GAP / 2), outP(T3[i + 1], zb, GAP / 2), outP(T3[i], zb, GAP / 2), [cell[2], cell[1]], [cell[2], cell[3]], [cell[2] - 0.01, cell[3]], [cell[2] - 0.01, cell[1]], downIn.clone().negate());
        }
        for (const [t, sg] of [[t0, 1], [t1, -1]] as [number, number][]) {
          const tang = ellIn(t + sg * 0.01).sub(ellIn(t)).normalize();
          A.quad(inP(t, zf, GAP / 2), outP(t, zf, GAP / 2), outP(t, zb, GAP / 2), inP(t, zb, GAP / 2), [cell[0], cell[1]], [cell[2], cell[1]], [cell[2], cell[1] + 0.01], [cell[0], cell[1] + 0.01], tang);
        }
        A.begin(M.mortar, bk);
        const sl = [ta, (ta + tb) / 2, tb];
        for (let i = 0; i < 2; i++) A.quad(ellIn(sl[i]).setZ(zb), ellOut(sl[i]).setZ(zb), ellOut(sl[i + 1]).setZ(zb), ellIn(sl[i + 1]).setZ(zb), [0, 0], [1, 0], [1, 1], [0, 1], fz);
        // number (upright text)
        const c = inP(tm, 0, 0).add(outP(tm, 0, 0)).multiplyScalar(0.5);
        const nc = Math.floor(r() * 64), nu0 = (nc % 8) / 8, nv1 = 1 - Math.floor(nc / 8) / 8, nu1 = nu0 + 1 / 8, nv0 = nv1 - 1 / 8;
        const dw = 0.42, dh = 0.19, zz = zf + s * 0.002, ux = s;
        A.begin(M.nums, bk);
        A.quad(V(c.x - ux * dw / 2, c.y - dh / 2, zz), V(c.x + ux * dw / 2, c.y - dh / 2, zz), V(c.x + ux * dw / 2, c.y + dh / 2, zz), V(c.x - ux * dw / 2, c.y + dh / 2, zz), [nu0, nv0], [nu1, nv0], [nu1, nv1], [nu0, nv1], fz);
      }
      // soffit strip: staggered stones along z (joint rims from the atlas), inward normal
      const pa = ellIn(ta), pb = ellIn(tb), inward = V(Ar.cx, SPRING, 0).sub(pa.clone().add(pb).multiplyScalar(0.5)).normalize();
      const zr = HW + BACK;
      let z = -zr; const cuts = [z]; z += (k % 2 ? 0.55 : 0) + U(r, 0.7, 1.5);
      while (z < zr - 0.5) { cuts.push(z); z += U(r, 1.0, 1.7); }
      cuts.push(zr);
      for (let i = 0; i < cuts.length - 1; i++) {
        const c = cellUV(Math.floor(r() * cellPool));
        A.tint = tintStone(); A.begin(M.stone, bk);
        A.quad(pa.clone().setZ(cuts[i]), pb.clone().setZ(cuts[i]), pb.clone().setZ(cuts[i + 1]), pa.clone().setZ(cuts[i + 1]), [c[0], c[1]], [c[0], c[3]], [c[2], c[3]], [c[2], c[1]], inward);
      }
      // extrados top of the barrel (rubble; only seen while the hearting above is missing)
      const oa = ellOut(ta), ob = ellOut(tb);
      A.begin(M.rubble, bk);
      A.quad(oa.clone().setZ(-zr), ob.clone().setZ(-zr), ob.clone().setZ(zr), oa.clone().setZ(zr), [oa.x / 3, 0], [ob.x / 3, 0], [ob.x / 3, W / 3], [oa.x / 3, W / 3], inward.clone().negate());
    }
    void ai;
  });
  // ---- pier sides inside the openings, abutment end faces ----
  ARCHES.forEach((Ar) => {
    for (const sd of [-1, 1]) {
      const x = Ar.cx + sd * Ar.a, w: Wall = { o: V(x, 0, 0), U: V(0, 0, -sd), N: V(-sd, 0, 0) };
      for (let j = 0; j < 5; j++) run(-(HW + BACK), HW + BACK, (a0, a1) => stone(A, w, a0, a1, CY(j), CY(j + 1), bkey(x, CY(j)), { num: false, prot: U(r, 0, 0.01) }));
    }
  });
  for (const sd of [-1, 1]) {
    const w: Wall = { o: V(sd * L / 2, 0, 0), U: V(0, 0, sd), N: V(sd, 0, 0) };
    for (let j = 0; j < 20; j++) {
      const y0 = CY(j), y1 = j < 19 ? CY(j + 1) : ROAD;
      run(-HW, HW, (a0, a1) => stone(A, w, a0, a1, y0, y1, bkey(sd * 47.9, y0), { num: false }));
    }
  }
  // ---- cutwaters (pointed, both sides of every pier) ----
  for (const [p0, p1] of PIERS) {
    const pc = (p0 + p1) / 2, D = (p1 - p0) * 0.6;
    for (const s of [1, -1]) {
      const nose = V(pc, 0, s * (HW + D)), cA = V(p0, 0, s * HW), cB = V(p1, 0, s * HW);
      for (const [from, to] of [[cA, nose], [nose, cB]] as [THREE.Vector3, THREE.Vector3][]) {
        const d = to.clone().sub(from), len = d.length(); d.normalize();
        const nrm = new THREE.Vector3().crossVectors(d, Y).normalize(); if (nrm.z * s < 0) nrm.negate();
        // face-local a runs along the face as seen from outside (left -> right)
        const flip = new THREE.Vector3().crossVectors(Y, nrm).dot(d) < 0;
        const w: Wall = { o: from, U: d, N: nrm, flip };
        for (let j = 0; j < 9; j++) run(0, len, (a0, a1) => stone(A, w, a0, a1, CY(j), CY(j + 1), bkey(pc, CY(j)), { num: j >= 3 }), 0.8, 1.3);
      }
      // cap: two sloped faces up to the pier face
      const top = CW_TOP, apex = V(pc, CW_CAP, s * HW), nT = nose.clone().setY(top), aT = cA.clone().setY(top), bT = cB.clone().setY(top);
      A.tint = [1, 1, 1]; A.begin(M.gran, bkey(pc, top));
      const up = V(0, 1, s);
      A.tri(aT, nT, apex, [aT.x / 2, 0], [nT.x / 2, 0.6], [apex.x / 2, 0.8], up);
      A.tri(nT, bT, apex, [nT.x / 2, 0.6], [bT.x / 2, 0], [apex.x / 2, 0.8], up);
      // a thin projecting lip course under the cap
      for (const [from, to] of [[cA, nose], [nose, cB]] as [THREE.Vector3, THREE.Vector3][]) {
        const d = to.clone().sub(from).normalize(), nrm = new THREE.Vector3().crossVectors(d, Y).normalize(); if (nrm.z * s < 0) nrm.negate();
        const a = from.clone().setY(top - 0.12).addScaledVector(nrm, 0.07), b = to.clone().setY(top - 0.12).addScaledVector(nrm, 0.07);
        A.quad(a, b, b.clone().setY(top), a.clone().setY(top), [0, 0], [1, 0], [1, 0.05], [0, 0.05], nrm);
        A.quad(a, b, b.clone().addScaledVector(nrm, -0.07), a.clone().addScaledVector(nrm, -0.07), [0, 0], [1, 0], [1, 0.02], [0, 0.02], V(0, -1, 0));
      }
    }
  }
  // ---- hearting (rubble core cells: their tops / ends show only where neighbouring stones are missing) ----
  for (let xi = -48; xi < 48; xi++) {
    const x0 = xi, x1 = xi + 1, xm = xi + 0.5;
    const sMax = Math.max(archTop(x0), archTop(x1), archTop(xm)) > 0 ? Math.max(extr(x0), extr(x1), extr(xm)) : -Infinity;
    for (let j = 0; j < 20; j++) {
      const y0 = CY(j), y1 = j < 19 ? CY(j + 1) : ROAD - 0.02;
      if (y1 < sMax + 0.05) continue;
      const yb = Math.max(y0, sMax), zr = HW - 0.06, key = bkey(xm, (y0 + y1) / 2);
      A.tint = [1, 1, 1]; A.begin(M.rubble, key);
      A.quad(V(x0, y1, -zr), V(x1, y1, -zr), V(x1, y1, zr), V(x0, y1, zr), [x0 / 2, -zr / 2], [x1 / 2, -zr / 2], [x1 / 2, zr / 2], [x0 / 2, zr / 2], Y);
      for (const [x, sd] of [[x0, -1], [x1, 1]] as [number, number][]) A.quad(V(x, yb, -zr), V(x, yb, zr), V(x, y1, zr), V(x, y1, -zr), [-zr / 2, yb / 2], [zr / 2, yb / 2], [zr / 2, y1 / 2], [-zr / 2, y1 / 2], V(sd, 0, 0));
    }
  }
  // rubble faces behind the top courses + cornice (seen once they are lifted off in London)
  for (let x = -48; x < 48; x += 8) for (const s of [1, -1]) {
    const z = s * (HW - 0.05), key = bkey(x + 4, 9);
    A.begin(M.rubble, key);
    A.quad(V(x, CY(17), z), V(x + 8, CY(17), z), V(x + 8, DECK - 0.02, z), V(x, DECK - 0.02, z), [x / 2, CY(17) / 2], [(x + 8) / 2, CY(17) / 2], [(x + 8) / 2, DECK / 2], [x / 2, DECK / 2], V(0, 0, s));
    A.quad(V(x, DECK - 0.02, s * PI_IN), V(x + 8, DECK - 0.02, s * PI_IN), V(x + 8, DECK - 0.02, z), V(x, DECK - 0.02, z), [x / 2, 0], [(x + 8) / 2, 0], [(x + 8) / 2, 0.3], [x / 2, 0.3], Y);
  }

  // ---- cornice: fascia, dentils, corona with a soffit, weathered top (B group, layer 3) ----
  const PROF: [number, number][] = [[-0.06, 9.45], [0.05, 9.45], [0.05, 9.6], [0.035, 9.6], [0.035, 9.8], [0.22, 9.8], [0.22, 9.88], [0.37, 9.88], [0.37, 10.25], [0.31, 10.3], [0.14, DECK], [-0.06, DECK]];
  const plen: number[] = [0]; for (let i = 1; i < PROF.length; i++) plen.push(plen[i - 1] + Math.hypot(PROF[i][0] - PROF[i - 1][0], PROF[i][1] - PROF[i - 1][1]));
  for (const s of [1, -1]) {
    run(-L / 2, L / 2, (x0, x1) => {
      const xm = (x0 + x1) / 2, key = keyB(xm, 10, 3), c = cellUV(Math.floor(r() * cellPool));
      const pt = (x: number, i: number) => V(x, PROF[i][1], s * (HW + PROF[i][0]));
      B.tint = tintStone(); B.begin(M.stone, key);
      for (let i = 0; i < PROF.length - 1; i++) {
        const dn = PROF[i + 1][0] - PROF[i][0], dy = PROF[i + 1][1] - PROF[i][1];
        const want = V(0, -dn, s * dy); // outward normal of a CCW profile edge (dy, -dn) mapped to (z, y)
        const v0 = c[1] + (c[3] - c[1]) * (plen[i] / plen[plen.length - 1]), v1 = c[1] + (c[3] - c[1]) * (plen[i + 1] / plen[plen.length - 1]);
        B.quad(pt(x0 + 0.004, i), pt(x1 - 0.004, i), pt(x1 - 0.004, i + 1), pt(x0 + 0.004, i + 1), [c[0], v0], [c[2], v0], [c[2], v1], [c[0], v1], want);
      }
      // end caps (seen at the bridge ends and once neighbours are lifted off)
      const tris = THREE.ShapeUtils.triangulateShape(PROF.map(([n, y]) => new THREE.Vector2(n, y)), []);
      for (const xe of [x0 + 0.004, x1 - 0.004]) for (const [a, b, cc] of tris) B.tri(pt(xe, a), pt(xe, b), pt(xe, cc), [c[0], c[1]], [c[0] + 0.02, c[1]], [c[0], c[1] + 0.02], V(xe < xm ? -1 : 1, 0, 0));
      // dentils
      B.begin(M.gran, key);
      for (let x = Math.ceil((x0 + 0.1) / 0.3) * 0.3; x < x1 - 0.12; x += 0.3) {
        const za = s * (HW + 0.035), zb2 = s * (HW + 0.19);
        const bx = (a: number, b: number) => {
          B.quad(V(a, 9.62, zb2), V(b, 9.62, zb2), V(b, 9.8, zb2), V(a, 9.8, zb2), [a, 0], [b, 0], [b, 0.1], [a, 0.1], V(0, 0, s));
          B.quad(V(a, 9.62, za), V(b, 9.62, za), V(b, 9.62, zb2), V(a, 9.62, zb2), [a, 0], [b, 0], [b, 0.1], [a, 0.1], V(0, -1, 0));
          B.quad(V(a, 9.62, za), V(a, 9.8, za), V(a, 9.8, zb2), V(a, 9.62, zb2), [0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1], V(-1, 0, 0));
          B.quad(V(b, 9.62, za), V(b, 9.8, za), V(b, 9.8, zb2), V(b, 9.62, zb2), [0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1], V(1, 0, 0));
        };
        bx(x - 0.075, x + 0.075);
      }
    }, 1.2, 1.9);
  }

  // ---- deck: pavements (flags), kerbs, sett roadway (A group) ----
  for (let x = -L / 2; x < L / 2 - 0.01; x += 2) {
    const key = bkey(x + 1, DECK), x1 = x + 2;
    A.tint = [1, 1, 1]; A.begin(M.setts, key);
    A.quad(V(x, ROAD, -KERB_IN), V(x1, ROAD, -KERB_IN), V(x1, ROAD, KERB_IN), V(x, ROAD, KERB_IN), [x / 2, -KERB_IN / 2], [x1 / 2, -KERB_IN / 2], [x1 / 2, KERB_IN / 2], [x / 2, KERB_IN / 2], Y);
    for (const s of [1, -1]) {
      // flagstones: 2 rows of slabs per pavement (atlas cells as slabs, real joints by the gaps over a mortar bed)
      A.begin(M.mortar, key);
      A.quad(V(x, DECK - 0.015, s * KERB), V(x1, DECK - 0.015, s * KERB), V(x1, DECK - 0.015, s * PI_IN), V(x, DECK - 0.015, s * PI_IN), [0, 0], [1, 0], [1, 1], [0, 1], Y);
      const rows = [KERB, KERB + 0.8, KERB + 1.6, PI_IN];
      for (let k = 0; k < 3; k++) {
        let xa = x; const ends: number[] = [x];
        xa += ((k + Math.round(x / 2)) % 2) * 0.45 + U(r, 0.55, 0.9);
        while (xa < x1 - 0.35) { ends.push(xa); xa += U(r, 0.7, 1.05); }
        ends.push(x1);
        for (let i = 0; i < ends.length - 1; i++) {
          const c = cellUV(Math.floor(r() * cellPool)), za = s * (rows[k] + 0.012), zb2 = s * (rows[k + 1] - 0.012), xa0 = ends[i] + 0.012, xa1 = ends[i + 1] - 0.012;
          const kk = U(r, 0.86, 1.08); A.tint = [kk, kk * U(r, 0.98, 1.01), kk * U(r, 0.96, 1.02)]; A.begin(M.flags, key);
          A.quad(V(xa0, DECK, za), V(xa1, DECK, za), V(xa1, DECK, zb2), V(xa0, DECK, zb2), [c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]], Y);
        }
      }
      // kerb stones
      run(x, x1, (k0, k1) => {
        const c = cellUV(Math.floor(r() * cellPool)), za = s * KERB_IN, zb2 = s * KERB;
        A.tint = tintStone(); A.begin(M.stone, key);
        A.quad(V(k0 + 0.01, DECK, za), V(k1 - 0.01, DECK, za), V(k1 - 0.01, DECK, zb2), V(k0 + 0.01, DECK, zb2), [c[0], c[1]], [c[2], c[1]], [c[2], c[1] + 0.06], [c[0], c[1] + 0.06], Y);
        A.quad(V(k0 + 0.01, ROAD, za), V(k1 - 0.01, ROAD, za), V(k1 - 0.01, DECK, za), V(k0 + 0.01, DECK, za), [c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]], V(0, 0, -s));
      }, 0.9, 1.3);
    }
  }

  // ---- parapet: pedestals, plinth, balusters, coping; lamp standards (B group) ----
  const LAMPX = [-45, -27.25, -9.5, 9.5, 27.25, 45];
  const pedX = new Set<number>([-47.55, 47.55, ...LAMPX, -36, -18, 0, 18, 36]);
  { const base = [...pedX].sort((a, b) => a - b); for (let i = 0; i < base.length - 1; i++) { const gap = base[i + 1] - base[i]; if (gap > 6) { const n = Math.round(gap / 4.6); for (let k = 1; k < n; k++) pedX.add(+(base[i] + (gap * k) / n).toFixed(2)); } } }
  const peds = [...pedX].sort((a, b) => a - b);
  const balGeo = (() => {
    const prof: [number, number][] = [[0.0, 0.0], [0.085, 0.0], [0.085, 0.05], [0.06, 0.07], [0.07, 0.1], [0.05, 0.13], [0.075, 0.2], [0.1, 0.27], [0.095, 0.33], [0.07, 0.39], [0.05, 0.44], [0.058, 0.47], [0.08, 0.495], [0.06, 0.52], [0.085, 0.53], [0.085, 0.58], [0.0, 0.58]];
    return new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 8);
  })();
  const boxF = (bt: OBatch, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: [number, number, number, number], faces = "tfbslr") => {
    const corners = (x: number, y: number, z: number) => V(x, y, z);
    const du = c[2] - c[0], dv = c[3] - c[1];
    const f = (a: THREE.Vector3, b: THREE.Vector3, cc: THREE.Vector3, d: THREE.Vector3, want: THREE.Vector3, ku = 1, kv = 1) => bt.quad(a, b, cc, d, [c[0], c[1]], [c[0] + du * ku, c[1]], [c[0] + du * ku, c[1] + dv * kv], [c[0], c[1] + dv * kv], want);
    const sx = Math.min(1, (x1 - x0) / 1.6), sz = Math.min(1, (z1 - z0) / 1.6), sy = Math.min(1, (y1 - y0) / 0.6);
    if (faces.includes("t")) f(corners(x0, y1, z0), corners(x1, y1, z0), corners(x1, y1, z1), corners(x0, y1, z1), Y, sx, sz);
    if (faces.includes("f")) f(corners(x0, y0, z1), corners(x1, y0, z1), corners(x1, y1, z1), corners(x0, y1, z1), Z, sx, sy);
    if (faces.includes("b")) f(corners(x1, y0, z0), corners(x0, y0, z0), corners(x0, y1, z0), corners(x1, y1, z0), Z.clone().negate(), sx, sy);
    if (faces.includes("l")) f(corners(x0, y0, z0), corners(x0, y0, z1), corners(x0, y1, z1), corners(x0, y1, z0), V(-1, 0, 0), sz, sy);
    if (faces.includes("r")) f(corners(x1, y0, z1), corners(x1, y0, z0), corners(x1, y1, z0), corners(x1, y1, z1), V(1, 0, 0), sz, sy);
    if (faces.includes("u")) f(corners(x0, y0, z1), corners(x1, y0, z1), corners(x1, y0, z0), corners(x0, y0, z0), V(0, -1, 0), sx, sz);
  };
  const lampPos: { x: number; s: number; key: number }[] = [];
  const skip = (x: number, s: number) => (o.skipLamps ?? []).some((q) => Math.abs(q.x - x) < 0.6 && Math.sign(q.side) === s);
  for (const s of [1, -1]) {
    const zo = s * HW, zi = s * PI_IN, zlo = Math.min(zo, zi), zhi = Math.max(zo, zi);
    peds.forEach((px, i) => {
      const isLamp = LAMPX.includes(px), end = Math.abs(px) > 47, hw = isLamp ? 0.5 : end ? 0.45 : 0.32;
      const key = keyB(px, 11, 2), c = cellUV(Math.floor(r() * cellPool));
      B.tint = tintStone(); B.begin(M.stone, key);
      boxF(B, px - hw, px + hw, PAR0, PAR1 - 0.1, zlo - 0.05, zhi + 0.05, c);
      boxF(B, px - hw - 0.06, px + hw + 0.06, PAR1 - 0.1, PAR1 + 0.04, zlo - 0.1, zhi + 0.1, c, "tfblru");
      boxF(B, px - hw - 0.04, px + hw + 0.04, PAR0, PAR0 + 0.16, zlo - 0.09, zhi + 0.09, c, "tfblr");
      // a sunk panel on the outer face of the pedestal
      const zp = s * (HW + 0.05 + 0.012);
      B.begin(M.gran, key);
      B.quad(V(px - hw + 0.08, PAR0 + 0.26, zp), V(px + hw - 0.08, PAR0 + 0.26, zp), V(px + hw - 0.08, PAR1 - 0.2, zp), V(px - hw + 0.08, PAR1 - 0.2, zp), [0, 0], [0.5, 0], [0.5, 0.3], [0, 0.3], V(0, 0, s));
      if (isLamp && !skip(px, s)) lampPos.push({ x: px, s, key: keyB(px, 12, 0) });
      if (i === peds.length - 1) return;
      const xa = px + hw, xb = peds[i + 1] - (LAMPX.includes(peds[i + 1]) ? 0.5 : Math.abs(peds[i + 1]) > 47 ? 0.45 : 0.32);
      const xm = (xa + xb) / 2;
      // plinth + coping in stones
      run(xa, xb, (a, b) => { const c2 = cellUV(Math.floor(r() * cellPool)); B.tint = tintStone(); B.begin(M.stone, keyB((a + b) / 2, 10.6, 2)); boxF(B, a + 0.005, b - 0.005, PAR0, PAR0 + 0.28, zlo + 0.02, zhi - 0.02, c2, "tfb"); }, 1.0, 1.6);
      run(xa, xb, (a, b) => {
        const c2 = cellUV(Math.floor(r() * cellPool)); B.tint = tintStone(); B.begin(M.stone, keyB((a + b) / 2, 11.5, 0));
        boxF(B, a + 0.005, b - 0.005, PAR1 - 0.24, PAR1 - 0.1, zlo - 0.04, zhi + 0.04, c2, "tfbu");
        boxF(B, a + 0.005, b - 0.005, PAR1 - 0.1, PAR1, zlo + 0.04, zhi - 0.04, c2, "tfb");
      }, 1.0, 1.6);
      // balusters
      const n = Math.max(1, Math.round((xb - xa) / 0.31)), step = (xb - xa) / n;
      B.tint = [1, 1, 1]; B.begin(M.gran, keyB(xm, 11, 1));
      for (let k = 0; k < n; k++) B.geo(balGeo, new THREE.Matrix4().makeTranslation(xa + step * (k + 0.5), PAR0 + 0.28, s * (HW - 0.275)));
    });
  }
  // lamp standards: ornate cast-iron post + hexagonal lantern on the lamp pedestals
  const postGeo = (() => {
    const prof: [number, number][] = [[0, 0], [0.26, 0], [0.26, 0.08], [0.22, 0.1], [0.22, 0.16], [0.18, 0.2], [0.13, 0.32], [0.11, 0.48], [0.15, 0.52], [0.15, 0.58], [0.1, 0.62], [0.085, 0.7], [0.075, 2.3], [0.11, 2.34], [0.11, 2.4], [0.085, 2.44], [0.085, 2.62], [0.13, 2.7], [0.2, 2.86], [0.22, 2.92], [0.2, 2.96], [0, 2.96]];
    return new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 12);
  })();
  const LAMPS: V3[] = [];
  const lampObjs: { glass: THREE.Mesh; glow: THREE.Sprite; light: THREE.PointLight | null; key: number; seed: number; g: THREE.Group }[] = [];
  const glassMat = () => new THREE.MeshBasicMaterial({ color: "#ffc67a", toneMapped: true });
  const lightOn = (x: number) => (o.lights ?? "centre") === "all" || ((o.lights ?? "centre") === "centre" && Math.abs(Math.abs(x) - 9.5) < 0.1);
  for (const lp of lampPos) {
    const bx = lp.x, bz = lp.s * (HW - 0.275), by = PAR1 + 0.04;
    B.tint = [1, 1, 1]; B.begin(M.iron, lp.key);
    B.geo(postGeo, new THREE.Matrix4().makeTranslation(bx, by, bz));
    const ly = by + 2.96;
    // scroll brackets under the lantern
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + Math.PI / 4, tor = new THREE.TorusGeometry(0.12, 0.018, 5, 10, Math.PI * 1.2);
      const m = new THREE.Matrix4().makeTranslation(bx + Math.cos(a) * 0.16, by + 2.62, bz + Math.sin(a) * 0.16).multiply(new THREE.Matrix4().makeRotationY(-a)).multiply(new THREE.Matrix4().makeRotationZ(-0.4));
      B.geo(tor, m);
    }
    // lantern frame: base plate, 6 corner bars, roof cone, crown + finial
    B.geo(new THREE.CylinderGeometry(0.24, 0.2, 0.07, 6), new THREE.Matrix4().makeTranslation(bx, ly + 0.035, bz));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU, x0 = Math.cos(a) * 0.2, z0 = Math.sin(a) * 0.2, x1 = Math.cos(a) * 0.27, z1 = Math.sin(a) * 0.27;
      const p0 = V(bx + x0, ly + 0.07, bz + z0), p1 = V(bx + x1, ly + 0.62, bz + z1), mid = p0.clone().add(p1).multiplyScalar(0.5);
      const bar = new THREE.BoxGeometry(0.03, p0.distanceTo(p1), 0.03), q = new THREE.Quaternion().setFromUnitVectors(Y, p1.clone().sub(p0).normalize());
      B.geo(bar, new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
    }
    B.geo(new THREE.CylinderGeometry(0.31, 0.29, 0.05, 6), new THREE.Matrix4().makeTranslation(bx, ly + 0.64, bz));
    B.geo(new THREE.ConeGeometry(0.33, 0.3, 6), new THREE.Matrix4().makeTranslation(bx, ly + 0.81, bz));
    B.geo(new THREE.CylinderGeometry(0.05, 0.08, 0.12, 8), new THREE.Matrix4().makeTranslation(bx, ly + 1.0, bz));
    B.geo(new THREE.SphereGeometry(0.06, 8, 6), new THREE.Matrix4().makeTranslation(bx, ly + 1.1, bz));
    const lg = new THREE.Group(); g.add(lg);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.195, 0.53, 6, 1, true).translate(bx, ly + 0.345, bz), glassMat());
    lg.add(glass);
    const gl = glow(lg, [bx, ly + 0.36, bz], "#ffbf70", 3.0, 0.9);
    let light: THREE.PointLight | null = null;
    if (lightOn(bx)) { light = new THREE.PointLight("#ffb466", 10, 18, 1.3); light.position.set(bx, ly + 0.2, bz + lp.s * 0.6); lg.add(light); }
    LAMPS.push([bx, ly + 0.35, bz]);
    lampObjs.push({ glass, glow: gl, light, key: lp.key, seed: bx * 0.37 + lp.s, g: lg });
  }

  const RA = A.build(g), RB = B.build(g);
  const numMats = [M.nums];

  // ---- SOLIDS ----
  const SOLIDS: [V3, V3][] = [];
  SOLIDS.push([[-48, -1.3, -HW], [-42.5, DECK, HW]], [[42.5, -1.3, -HW], [48, DECK, HW]]);
  for (const [p0, p1] of PIERS) { const D = (p1 - p0) * 0.6; SOLIDS.push([[p0, -1.3, -HW - D], [p1, CW_CAP, HW + D]], [[p0, -1.3, -HW], [p1, DECK, HW]]); }
  for (const Ar of ARCHES) for (let k = 0; k < 8; k++) {
    const x0 = Ar.cx - Ar.a + (2 * Ar.a * k) / 8, x1 = x0 + (2 * Ar.a) / 8;
    SOLIDS.push([[x0, Math.min(archTop(x0 + 0.001), archTop(x1 - 0.001)), -HW], [x1, DECK, HW]]);
  }
  SOLIDS.push([[-48, CORN0, HW], [48, DECK, HW + 0.4]], [[-48, CORN0, -HW - 0.4], [48, DECK, -HW]]);
  SOLIDS.push([[-48, DECK, PI_IN], [48, PAR1 + 0.05, HW + 0.12]], [[-48, DECK, -HW - 0.12], [48, PAR1 + 0.05, -PI_IN]]);
  for (const [x, y, z] of LAMPS) SOLIDS.push([[x - 0.35, PAR1, z - 0.35], [x + 0.35, y + 0.8, z + 0.35]]);

  const st = { built: 1, numbered: 0, lamps: 1, dismantle: 0, t: 0 };
  const apply = () => {
    for (const R of RA) { const n = upper(R.keys, st.built + 1e-6), end = n < R.keys.length ? R.starts[n] : R.total; R.mesh.geometry.setDrawRange(0, end); R.mesh.visible = end > 0; }
    for (const R of RB) {
      if (Lon) { const i = lower(R.keys, st.dismantle - 1e-6), s0 = st.dismantle <= 1e-6 ? 0 : i < R.keys.length ? R.starts[i] : R.total; R.mesh.geometry.setDrawRange(s0, R.total - s0); R.mesh.visible = s0 < R.total; }
      else { const n = upper(R.keys, st.built + 1e-6), end = n < R.keys.length ? R.starts[n] : R.total; R.mesh.geometry.setDrawRange(0, end); R.mesh.visible = end > 0; }
    }
    for (const m of numMats) { m.opacity = st.numbered; m.visible = st.numbered > 0.004; }
    for (const lo of lampObjs) {
      const present = Lon ? st.dismantle <= 1e-6 || lo.key >= st.dismantle : lo.key <= st.built + 1e-6;
      lo.g.visible = present;
      const k = st.lamps, f = 0.94 + 0.06 * Math.sin(st.t * 9 + lo.seed) * Math.sin(st.t * 4.3 + lo.seed * 2);
      (lo.glass.material as THREE.MeshBasicMaterial).color.set("#3a4054").lerp(new THREE.Color("#ffc67a").multiplyScalar(1.9), k);
      (lo.glow.material as THREE.SpriteMaterial).opacity = k * f; lo.glow.visible = k > 0.01;
      if (lo.light) { lo.light.intensity = 10 * k * f; lo.light.visible = k > 0.01 && present; }
    }
  };
  apply();
  return {
    g, L, W, deckY: DECK, ARCH_X, ARCH_W, archTop, SOLIDS, ROAD_Y: ROAD, SPRING, PIERS, LAMPS, variant,
    set: (c) => {
      const n = { built: c.built ?? 1, numbered: c.numbered ?? 0, lamps: c.lamps ?? 1, dismantle: c.dismantle ?? 0, t: c.t ?? 0 };
      Object.assign(st, n); apply();
    },
  };
};
