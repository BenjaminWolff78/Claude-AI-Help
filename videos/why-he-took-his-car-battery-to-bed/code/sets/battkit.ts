// battkit.ts (p15, "Why He Took His Car Battery to Bed", Nov 28): the story objects, modelled.
//  carBattery()   a 12 V lead-acid car battery at real size (L 0.26 x H 0.2 x W 0.175 m, a ~40 lb box): a moulded black case
//                 with ribs, a lighter lid with six cell caps, red (+) and black (-) terminal posts with caps, a strap handle,
//                 a printed label (NORDCELL, COLD CRANKING AMPS 600, 40 LB). Options: truck (bigger, heavy-duty), frost (white
//                 rime), cutaway (the front wall can open to show the six cells: lead plates in acid with the reaction
//                 streaming between them; set({ cut, glow, t })).
//  engineBay()    the bay under an opening hood: floor, inner fenders, engine block with a valve cover, air cleaner, hoses,
//                 a battery tray, two clamps on cables, a dipstick (set({ hood, dip, clampR, clampB })).
//  knitCap(), pillow(), blanket drape, honeyBottle(), pancakes(), tester(), cable(): small props.
// Local frame of every object: y up, origin at its base centre (the battery: the middle of the bottom face, long side along x).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { canvasTex, cl, sm, hsh, std } from "./harborkit";
import type { V3 } from "./types";

const INK = "#241726";
export const BATT = { L: 0.26, H: 0.2, W: 0.175, POST_Y: 0.235, TRUCK_K: 1.28 };

const labelTex = (key: string, big: boolean) => canvasTex("battLabel_" + key, 640, 400, (g) => {
  g.fillStyle = "#1c1d22"; g.fillRect(0, 0, 640, 400);
  g.fillStyle = "#e8392a"; g.fillRect(0, 0, 640, 92);
  g.fillStyle = "#ffffff"; g.font = "900 70px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(big ? "NORDCELL HD" : "NORDCELL", 320, 50);
  g.fillStyle = "#f4f1e8"; g.font = "900 44px Arial, sans-serif"; g.fillText("COLD CRANKING AMPS", 320, 150);
  g.fillStyle = "#ffd23a"; g.font = "900 96px Arial Black, Arial, sans-serif"; g.fillText(big ? "950" : "600", 320, 240);
  g.fillStyle = "#e8392a"; g.fillRect(40, 300, 560, 6);
  g.fillStyle = "#f4f1e8"; g.font = "800 46px Arial, sans-serif"; g.fillText(big ? "12 VOLT   •   55 LB" : "12 VOLT   •   40 LB", 320, 350);
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + 0.03 * hsh(i)})`; g.fillRect(hsh(i + 0.3) * 640, hsh(i + 0.7) * 400, 2 + 6 * hsh(i + 1.1), 1); }
});
const frostTex = () => canvasTex("battFrost", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { const x = hsh(i) * 256, y = hsh(i + 0.5) * 256, r = 1 + 3 * hsh(i + 0.9); g.fillStyle = `rgba(240,248,255,${0.35 + 0.5 * hsh(i + 1.7)})`; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); }
  g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 1.2;
  for (let i = 0; i < 60; i++) { const x = hsh(i + 3) * 256, y = hsh(i + 4) * 256; g.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); } g.stroke(); }
});
export type Battery = { g: THREE.Group; set: (o: { cut?: number; glow?: number; t?: number; frost?: number; steam?: number }) => void; top: number };
export const carBattery = (o: { truck?: boolean; frost?: boolean; cutaway?: boolean; key?: string } = {}): Battery => {
  const k = o.truck ? BATT.TRUCK_K : 1, L = BATT.L * k, H = BATT.H * k, W = BATT.W * k;
  const g = new THREE.Group();
  const caseM = std("#202126", 0.55, 0.0, { envMapIntensity: 0.9 }), lidM = std("#33353c", 0.6), ribM = std("#17181c", 0.6);
  const red = std("#d42a1e", 0.4), blk = std("#1a1a1c", 0.45), lead = std("#9aa0a8", 0.35, 0.8);
  const body = new THREE.Group(); g.add(body);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, p: V3, par: THREE.Object3D = body) => { const me = new THREE.Mesh(geo, m); me.position.set(...p); me.castShadow = true; me.receiveShadow = true; par.add(me); return me; };
  // the case as four walls + bottom so the front wall (+z) can open for the cutaway
  const T = 0.012 * k;
  add(new RoundedBoxGeometry(L, T * 2, W, 2, 0.006), caseM, [0, T, 0]);                                  // bottom
  const back = add(new RoundedBoxGeometry(L, H, T * 2, 2, 0.008), caseM, [0, H / 2, -W / 2 + T]);        // back wall
  for (const s of [-1, 1]) add(new RoundedBoxGeometry(T * 2, H, W, 2, 0.008), caseM, [s * (L / 2 - T), H / 2, 0]);   // end walls
  const frontG = new THREE.Group(); frontG.position.set(0, 0, W / 2 - T); body.add(frontG);               // hinge at the bottom edge (the cutaway folds it down)
  add(new RoundedBoxGeometry(L, H, T * 2, 2, 0.008), caseM, [0, H / 2, 0], frontG);
  // ribs on the long walls (moulded)
  for (let i = 0; i < 7; i++) { const x = -L / 2 + L * (i + 0.5) / 7; add(new THREE.BoxGeometry(0.006 * k, H * 0.82, 0.006 * k), ribM, [x, H * 0.48, -W / 2 - 0.002], body); }
  // the label on the front wall (opens with it)
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.86, H * 0.62), new THREE.MeshStandardMaterial({ map: labelTex(o.key ?? (o.truck ? "hd" : "car"), !!o.truck), roughness: 0.45, envMapIntensity: 0.8 }));
  lab.position.set(0, H * 0.48, T + 0.0015); frontG.add(lab);
  // the lid, slightly wider, with six cell caps, a handle strap and the two posts
  add(new RoundedBoxGeometry(L + 0.008 * k, 0.024 * k, W + 0.008 * k, 2, 0.006), lidM, [0, H + 0.006 * k, 0]);
  for (let i = 0; i < 6; i++) { const x = -L * 0.33 + (L * 0.66 * i) / 5; add(new THREE.CylinderGeometry(0.011 * k, 0.012 * k, 0.012 * k, 14), ribM, [x, H + 0.024 * k, 0.012 * k]); }
  const strap = new THREE.Mesh(new THREE.TorusGeometry(L * 0.26, 0.007 * k, 6, 20, Math.PI), blk); strap.position.set(0, H + 0.016 * k, -0.04 * k); strap.castShadow = true; body.add(strap);
  for (const [sx, m] of [[-1, red], [1, blk]] as [number, THREE.Material][]) {
    add(new THREE.CylinderGeometry(0.0085 * k, 0.011 * k, 0.03 * k, 16), lead, [sx * L * 0.36, H + 0.03 * k, W * 0.22]);
    const cap = add(new THREE.CylinderGeometry(0.016 * k, 0.019 * k, 0.026 * k, 16), m, [sx * L * 0.36, H + 0.05 * k, W * 0.22]);
    cap.name = sx < 0 ? "posCap" : "negCap";
  }
  // + / - marks on the lid
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.03 * k, 0.03 * k), new THREE.MeshBasicMaterial({ map: canvasTex("battPlus", 64, 64, (g2) => { g2.fillStyle = "#e8392a"; g2.fillRect(26, 8, 12, 48); g2.fillRect(8, 26, 48, 12); }), transparent: true }));
  pm.rotation.x = -Math.PI / 2; pm.position.set(-L * 0.36, H + 0.0185 * k, -W * 0.08); body.add(pm);
  // cutaway cells: six cells of plates in acid, the reaction glowing between the plates
  const cells = new THREE.Group(); cells.visible = false; body.add(cells);
  const acid = new THREE.MeshStandardMaterial({ color: "#7fb8d8", roughness: 0.15, transparent: true, opacity: 0.55, envMapIntensity: 1.2, depthWrite: false });
  const plateA = std("#5a5e64", 0.5, 0.6), plateB = std("#8a5a3a", 0.6, 0.3);
  const glowM: THREE.MeshBasicMaterial[] = [];
  for (let c = 0; c < 6; c++) {
    const x0 = -L / 2 + T * 2 + ((L - T * 4) * c) / 6, cw = (L - T * 4) / 6;
    if (c > 0) add(new THREE.BoxGeometry(0.004, H * 0.92, W - T * 3), caseM, [x0, H * 0.48, 0], cells);
    add(new THREE.BoxGeometry(cw * 0.96, H * 0.8, W - T * 3), acid, [x0 + cw / 2, H * 0.42, 0], cells);
    for (let p = 0; p < 5; p++) {
      const x = x0 + cw * (0.15 + 0.7 * p / 4);
      add(new THREE.BoxGeometry(cw * 0.06, H * 0.7, W * 0.8), p % 2 ? plateB : plateA, [x, H * 0.4, 0], cells);
      if (p < 4) { const m = new THREE.MeshBasicMaterial({ color: "#ffd27a", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); glowM.push(m);
        const s = new THREE.Mesh(new THREE.PlaneGeometry(cw * 0.12, H * 0.62), m); s.position.set(x + cw * 0.09, H * 0.4, W * 0.36); cells.add(s); }
    }
  }
  // frost: a rime skin over the case and lid
  const frostM = new THREE.MeshStandardMaterial({ map: frostTex(), transparent: true, opacity: 0, roughness: 0.9, depthWrite: false, color: "#ffffff" });
  const fr = new THREE.Mesh(new RoundedBoxGeometry(L + 0.012, H + 0.034 * k, W + 0.012, 2, 0.01), frostM); fr.position.y = (H + 0.034 * k) / 2; fr.renderOrder = 2; body.add(fr);
  if (o.frost) frostM.opacity = 0.85;
  return {
    g, top: H + 0.063 * k,
    set: ({ cut = 0, glow = 0, t = 0, frost }) => {
      cells.visible = cut > 0.02; frontG.position.y = -(o.cutaway ? 1 : 0) * sm(cut) * H * 1.08; frontG.visible = !(o.cutaway && cut > 0.98);   // the front wall slides straight down out of sight (folded toward the lens it covered the cells) back.visible = true;
      glowM.forEach((m, i) => { const ph = (t * (0.6 + 2.4 * glow) + i * 0.37) % 1; m.opacity = cl(glow) * (0.35 + 0.65 * Math.sin(ph * Math.PI)); });
      if (frost !== undefined) frostM.opacity = cl(frost) * 0.9;
    },
  };
};

/** the engine bay under an opening hood (car-local: x across, z forward, the bay between z0 and z1, floor y0, hood hinge at
 *  the back edge (z0, yH)). Returns the hood group (rotate with set) and the tray point where a battery stands. */
export type Bay = { set: (o: { hood?: number; dip?: number; clamps?: number }) => void; TRAY: V3; DIP: V3; DIP_TOP: V3 };
export const engineBay = (parent: THREE.Object3D, o: { x: number; z0: number; z1: number; y0: number; yH: number; paint: THREE.Material; tray: V3; dip?: V3; hoodLen?: number }): Bay => {
  const dark = std("#1d1e22", 0.8), metal = std("#5c6066", 0.5, 0.6), valve = std("#7a2a24", 0.45, 0.3), hose = std("#151517", 0.85), tray = std("#2a2b30", 0.7);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, p: V3, par: THREE.Object3D = parent) => { const me = new THREE.Mesh(geo, m); me.position.set(...p); me.castShadow = true; me.receiveShadow = true; par.add(me); return me; };
  const { x, z0, z1, y0, yH } = o, zm = (z0 + z1) / 2, D = z1 - z0;
  add(new THREE.BoxGeometry(2 * x, 0.04, D), dark, [0, y0, zm]);                                         // floor
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.04, yH - y0, D), dark, [s * (x - 0.02), (y0 + yH) / 2, zm]);   // inner fenders
  add(new THREE.BoxGeometry(2 * x, yH - y0, 0.04), dark, [0, (y0 + yH) / 2, z0 + 0.02]);                 // firewall
  // engine block + valve cover + air cleaner + hoses
  const bw = Math.min(0.62, x * 0.75);
  add(new RoundedBoxGeometry(bw, 0.26, D * 0.55, 2, 0.03), metal, [-x * 0.12, y0 + 0.15, zm - D * 0.04]);
  add(new RoundedBoxGeometry(bw * 0.8, 0.07, D * 0.48, 2, 0.02), valve, [-x * 0.12, y0 + 0.31, zm - D * 0.04]);
  for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), metal, [-x * 0.12, y0 + 0.355, zm - D * 0.2 + i * D * 0.11]);
  add(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 22), dark, [-x * 0.55, y0 + 0.33, zm + D * 0.12]);
  add(new THREE.TorusGeometry(0.09, 0.02, 8, 18, Math.PI).rotateY(Math.PI / 2), hose, [x * 0.2, y0 + 0.24, z1 - D * 0.18]);
  add(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 16), std("#c8c2b0", 0.6), [x * 0.55, y0 + 0.08, z0 + D * 0.18]);   // washer bottle
  // the battery tray and its hold-down
  add(new THREE.BoxGeometry(0.3, 0.03, 0.2), tray, [o.tray[0], o.tray[1] - 0.015, o.tray[2]]);
  // clamps + cables (they sit on the posts when a battery is in: clamps 0..1)
  const clampR = add(new THREE.BoxGeometry(0.04, 0.03, 0.05), std("#c8281c", 0.5), [o.tray[0] - 0.094, o.tray[1] + 0.24, o.tray[2] + 0.04]);
  const clampB = add(new THREE.BoxGeometry(0.04, 0.03, 0.05), std("#202022", 0.5), [o.tray[0] + 0.094, o.tray[1] + 0.24, o.tray[2] + 0.04]);
  const cabR = add(new THREE.CylinderGeometry(0.009, 0.009, 0.3, 8), std("#c8281c", 0.6), [o.tray[0] - 0.12, o.tray[1] + 0.12, o.tray[2] - 0.1]);
  const cabB = add(new THREE.CylinderGeometry(0.009, 0.009, 0.3, 8), hose, [o.tray[0] + 0.12, o.tray[1] + 0.12, o.tray[2] - 0.1]);
  cabR.rotation.x = cabB.rotation.x = 0.6;
  // the dipstick (a yellow loop handle on a rod in the block)
  const DIP: V3 = o.dip ?? [-x * 0.12 + bw * 0.55, y0 + 0.28, zm + D * 0.1];
  const dip = new THREE.Group(); dip.position.set(...DIP); parent.add(dip);
  { const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 6), metal); rod.position.y = -0.25; dip.add(rod);
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 16), std("#f2c21a", 0.5)); loop.position.y = 0.03; loop.rotation.y = Math.PI / 2; dip.add(loop);
    const goo = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), std("#2a1608", 0.12, 0, { envMapIntensity: 1.4 })); goo.scale.set(1, 2.6, 1); goo.position.y = -0.47; goo.name = "goo"; dip.add(goo); }
  // the hood: a panel hinged at the back edge
  const hood = new THREE.Group(); hood.position.set(0, yH, z0); parent.add(hood);
  const hl = o.hoodLen ?? D;
  { const p = new THREE.Mesh(new RoundedBoxGeometry(2 * x + 0.06, 0.04, hl, 2, 0.015), o.paint); p.position.set(0, 0.02, hl / 2); p.castShadow = true; p.receiveShadow = true; hood.add(p);
    const u = new THREE.Mesh(new THREE.BoxGeometry(2 * x - 0.1, 0.01, hl - 0.12), dark); u.position.set(0, -0.005, hl / 2); hood.add(u); }
  return {
    TRAY: o.tray, DIP, DIP_TOP: [DIP[0], DIP[1] + 0.03, DIP[2]],
    set: ({ hood: h = 0, dip: d = 0, clamps = 1 }) => {
      hood.rotation.x = -sm(cl(h)) * 1.15;
      dip.visible = d >= 0; dip.position.set(DIP[0], DIP[1] + 0.5 * cl(d), DIP[2]);   // d < 0: pulled out (a handheld copy takes over)
      clampR.visible = clampB.visible = clamps > 0.5;
    },
  };
};

/** a knit beanie with a pompom (sits on the battery's lid on night three) */
export const knitCap = (r = 0.075) => {
  const g = new THREE.Group();
  const knit = new THREE.MeshStandardMaterial({ map: canvasTex("knitCap", 128, 128, (c) => { c.fillStyle = "#3a6fc4"; c.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 8) { c.fillStyle = "rgba(0,0,0,0.18)"; c.fillRect(0, y, 128, 2); } for (let x = 0; x < 128; x += 6) { c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(x, 0, 2, 128); } c.fillStyle = "#e8e4da"; c.fillRect(0, 100, 128, 14); }), roughness: 0.95 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), knit); dome.scale.y = 1.1; dome.castShadow = true; g.add(dome);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.04, r * 1.04, r * 0.36, 20, 1, true), knit); cuff.position.y = r * 0.12; g.add(cuff);
  const pom = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.38, 1), std("#e8e4da", 1)); pom.position.y = r * 1.12; pom.castShadow = true; g.add(pom);
  return g;
};
/** a striped-ticking pillow (w across, d deep) */
export const pillow = (w = 0.55, d = 0.36, h = 0.12) => {
  const m = new THREE.MeshStandardMaterial({ map: canvasTex("pillowTick", 128, 128, (c) => { c.fillStyle = "#f2efe6"; c.fillRect(0, 0, 128, 128); for (let x = 0; x < 128; x += 16) { c.fillStyle = "#7a8fb8"; c.fillRect(x, 0, 4, 128); } }), roughness: 0.95 });
  const geo = new RoundedBoxGeometry(w, h, d, 4, h * 0.45); const me = new THREE.Mesh(geo, m); me.position.y = h / 2; me.castShadow = true; me.receiveShadow = true;
  const g = new THREE.Group(); g.add(me); return g;
};
/** a draped wool blanket: an (nx x nz) grid over a heightfield. hf(x, z) gives the surface under it (local); the blanket
 *  covers z from zA to zB (its far edge zB slides as it is pulled up); w across. Call set(zA, zB, hf, lift) per frame. */
export const blanket = (w: number, len: number, col = "#b8302a") => {
  const nx = 18, nz = 26;
  const tex = canvasTex("blanketWool_" + col, 256, 256, (c) => { c.fillStyle = col; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2400; i++) { c.fillStyle = `rgba(${hsh(i) > 0.5 ? "255,255,255" : "0,0,0"},${0.04 + 0.05 * hsh(i + 0.3)})`; c.fillRect(hsh(i + 0.6) * 256, hsh(i + 0.9) * 256, 1 + 2 * hsh(i + 1.2), 1); }
    c.fillStyle = "rgba(20,10,10,0.55)"; c.fillRect(0, 16, 256, 10); c.fillRect(0, 230, 256, 10); c.fillStyle = "rgba(240,220,160,0.7)"; c.fillRect(0, 30, 256, 4); c.fillRect(0, 222, 256, 4); });
  const geo = new THREE.PlaneGeometry(w, len, nx, nz); geo.rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.98, side: THREE.DoubleSide, envMapIntensity: 0.5 });
  const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true;
  const P = geo.attributes.position as THREE.BufferAttribute, base = Float32Array.from(P.array as Float32Array);
  return {
    mesh: me,
    set: (zA: number, zB: number, hf: (x: number, z: number) => number, lift = 0) => {
      for (let i = 0; i < P.count; i++) {
        const u = (base[i * 3 + 2] + len / 2) / len, x = base[i * 3];   // u 0 (zA end) .. 1 (zB end)
        const z = zA + (zB - zA) * u, edge = Math.min(1, (w / 2 - Math.abs(x)) / 0.12);
        const y = hf(x * 0.92, z) + 0.012 + lift * Math.sin(Math.PI * u) * 0.25 - (1 - edge) * 0.06;
        P.setXYZ(i, x * (0.96 + 0.04 * edge), y, z);
      }
      P.needsUpdate = true; geo.computeVertexNormals();
    },
  };
};
/** a plastic honey squeeze bottle (amber, a flip cap, a HONEY label), origin at its base */
export const honeyBottle = () => {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.13, 22), new THREE.MeshStandardMaterial({ color: "#d88a1a", roughness: 0.25, transparent: true, opacity: 0.92, envMapIntensity: 1.3 }));
  body.position.y = 0.065; body.castShadow = true; g.add(body);
  const sh = new THREE.Mesh(new THREE.SphereGeometry(0.038, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), body.material); sh.position.y = 0.13; g.add(sh);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.03, 16), std("#f2f0ea", 0.4)); cap.position.y = 0.175; g.add(cap);
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0425, 0.0425, 0.055, 22, 1, true), new THREE.MeshStandardMaterial({ map: canvasTex("honeyLab", 256, 80, (c) => { c.fillStyle = "#f4e6b8"; c.fillRect(0, 0, 256, 80); c.fillStyle = "#7a3a0a"; c.font = "900 46px Arial Black, Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("HONEY", 128, 42); }), roughness: 0.6 }));
  lab.position.y = 0.07; g.add(lab);
  return g;
};
/** a stack of pancakes on a tin plate with a butter pat (origin at the plate's base) */
export const pancakes = (n = 4) => {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.015, 28), std("#c8ccd2", 0.35, 0.7)); plate.position.y = 0.008; plate.receiveShadow = true; g.add(plate);
  const cake = std("#c8862e", 0.7), edge = std("#8a5016", 0.8);
  for (let i = 0; i < n; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09 - i * 0.002, 0.092, 0.016, 26), [edge, cake, cake]); p.position.set(0.003 * (i % 2), 0.024 + i * 0.017, 0); p.castShadow = true; g.add(p); }
  const butter = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.014, 0.03, 2, 0.004), std("#f6e08a", 0.4)); butter.position.y = 0.024 + n * 0.017 + 0.004; g.add(butter);
  return g;
};
/** a handheld battery tester (yellow box, a needle dial facing +z, two leads), origin at its base centre */
export const tester = (dialTex: THREE.Texture) => {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.17, 0.06, 3, 0.012), std("#f2c21a", 0.45)); box.position.y = 0.085; box.castShadow = true; g.add(box);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.05, 36), new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.4 })); face.position.set(0, 0.11, 0.0305); g.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.051, 0.005, 6, 30), std("#202022", 0.5)); rim.position.set(0, 0.11, 0.031); g.add(rim);
  const grip = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.08, 0.05, 2, 0.01), std("#2a2b30", 0.8)); grip.position.set(0, -0.02, 0); g.add(grip);
  return g;
};
/** a jumper cable (a sagging tube between two points, red or black) */
export const cable = (A: V3, B: V3, sag: number, col: string) => {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push(new THREE.Vector3(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u - sag * Math.sin(Math.PI * u), A[2] + (B[2] - A[2]) * u)); }
  const me = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.012, 6), std(col, 0.6)); me.castShadow = true; return me;
};
