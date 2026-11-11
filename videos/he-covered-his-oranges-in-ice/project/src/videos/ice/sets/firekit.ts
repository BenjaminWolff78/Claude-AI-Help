// FIRE KIT ("They Blew Up Houses to Stop a Fire"): flat 2D cartoon effects living in the 3D world (master prompt part I):
// flame tongues with a plum ink outline (8 hand-drawn frames, swapped per frame), painted smoke puffs, glowing embers
// riding the wind, explosion fireballs + dust rings, molten-lead ribbons. Everything is NOINK (they carry their own
// outline) and camera-facing. Builders return small controllers that the set's pose() drives from story controls.
import * as THREE from "three";
import { ctex, rng } from "../paint";
import { NOINK } from "../ink";
import type { V3 } from "./types";

const INKC = "#241726";
export const FR = 8;
const TAU = Math.PI * 2;

/** one flame frame: 3 nested tongues (red-orange, orange, yellow core) with 3 swaying tips, plum outline.
 *  canvas 128 x 192, base centre at the bottom (sprite.center = (0.5, 0)) */
const flameFrame = (i: number, v: number) => ctex(`flm${v}_${i}`, 128, 192, (g) => {
  const ph = (i / FR) * TAU, r = rng(31 + v * 7);
  const tips = [0, 1, 2].map((k) => ({ x: 64 + (k - 1) * (22 + 6 * r()) + 7 * Math.sin(ph + k * 2.1 + v), y: 18 + 30 * Math.abs(k - 1) + 14 * r() + 9 * Math.sin(ph * 2 + k * 1.3) }));
  const tongue = (s: number, dy: number) => {
    g.beginPath(); g.moveTo(64 - 52 * s, 186);
    g.bezierCurveTo(64 - 60 * s, 140 - dy * 0.3, 64 - 46 * s, 96 + dy * 0.4, tips[0].x * s + 64 * (1 - s), tips[0].y + dy);
    g.bezierCurveTo(64 - 18 * s, 92 + dy * 0.5, 64 - 12 * s, 80 + dy * 0.5, tips[1].x * s + 64 * (1 - s), tips[1].y + dy);
    g.bezierCurveTo(64 + 14 * s, 82 + dy * 0.5, 64 + 22 * s, 90 + dy * 0.5, tips[2].x * s + 64 * (1 - s), tips[2].y + dy);
    g.bezierCurveTo(64 + 48 * s, 100 + dy * 0.4, 64 + 60 * s, 140 - dy * 0.3, 64 + 52 * s, 186);
    g.quadraticCurveTo(64, 192, 64 - 52 * s, 186); g.closePath();
  };
  tongue(1, 0); g.fillStyle = "#e8462a"; g.fill(); g.lineWidth = 7; g.strokeStyle = INKC; g.stroke();
  tongue(0.72, 26); g.fillStyle = "#ff9a2a"; g.fill();
  tongue(0.42, 56); g.fillStyle = "#ffe26a"; g.fill();
  g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.ellipse(58, 160, 9, 14, 0.2, 0, TAU); g.fill();
});
const flameMats: THREE.SpriteMaterial[][] = [];
const flameMat = (v: number, i: number) => {
  flameMats[v] ??= [];
  return (flameMats[v][i] ??= new THREE.SpriteMaterial({ map: flameFrame(i, v), transparent: true, depthWrite: true, fog: false, alphaTest: 0.35 }));
};

/** a flame tongue sprite (base at pos); drive with flameSet(s, frame, k) */
export const flameSprite = (parent: THREE.Object3D, pos: V3, size: number, v = 0) => {
  const s = new THREE.Sprite(flameMat(v % 3, 0));
  s.center.set(0.5, 0.02); s.position.set(...pos); s.scale.set(size * 0.66, size, 1);
  s.layers.set(NOINK); s.renderOrder = 6; s.visible = false;
  s.userData = { size, v: v % 3, ph: Math.floor(rng(pos[0] * 13 + pos[2] * 7 + v)() * FR), base: [...pos] };
  parent.add(s); return s;
};
/** k = 0 hidden .. 1 full size; frame = global frame (each sprite cycles 8 drawings, swapped every 2 frames) */
export const flameSet = (s: THREE.Sprite, frame: number, k: number) => {
  const u = s.userData; s.visible = k > 0.02;
  if (!s.visible) return;
  s.material = flameMat(u.v, (Math.floor(frame / 2) + u.ph) % FR);
  const wob = 1 + 0.08 * Math.sin(frame * 0.7 + u.ph);
  s.scale.set(u.size * 0.66 * k * (2 - wob), u.size * k * wob, 1);
};

/** painted smoke puff (dark brown-grey body, lighter top) */
const smokeTex = (v: number) => ctex("smk" + v, 192, 160, (g) => {
  const r = rng(17 + v * 5), blobs: [number, number, number][] = [];
  for (let i = 0; i < 8; i++) blobs.push([40 + 112 * r(), 50 + 64 * r(), 24 + 22 * r()]);
  for (const [x, y, rr] of blobs) { g.fillStyle = "#4a3c46"; g.beginPath(); g.arc(x, y + 6, rr, 0, TAU); g.fill(); }
  for (const [x, y, rr] of blobs) { g.fillStyle = "#6e5c64"; g.beginPath(); g.arc(x, y, rr * 0.92, 0, TAU); g.fill(); }
  for (const [x, y, rr] of blobs) { g.fillStyle = "#8f7c80"; g.beginPath(); g.arc(x - rr * 0.25, y - rr * 0.3, rr * 0.5, 0, TAU); g.fill(); }
});
export type Smoke = { s: THREE.Sprite; base: V3; size: number; ph: number; rise: number };
export const smokeSprite = (parent: THREE.Object3D, base: V3, size: number, v = 0, rise = 6): Smoke => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex(v % 3), transparent: true, depthWrite: true, alphaTest: 0.05, opacity: 0, fog: true }));
  s.layers.set(NOINK); s.renderOrder = 5; s.visible = false; parent.add(s);
  return { s, base, size, ph: rng(base[0] * 3 + base[2] * 11 + v)(), rise };
};
/** rising looped puff: k = amount, wind = drift (m per rise, + = +x), t seconds, tint lightens the smoke (dawn haze) */
export const smokeSet = (m: Smoke, t: number, k: number, wind = 0, speed = 0.18) => {
  m.s.visible = k > 0.02; if (!m.s.visible) return;
  const u = (t * speed + m.ph) % 1, h = u * m.rise;
  m.s.position.set(m.base[0] + wind * u * m.rise * 0.9 + 0.3 * Math.sin(t * 0.7 + m.ph * 9), m.base[1] + h, m.base[2]);
  const sc = m.size * (0.6 + 1.5 * u) * (0.7 + 0.3 * k);
  m.s.scale.set(sc, sc * 0.82, 1);
  (m.s.material as THREE.SpriteMaterial).opacity = Math.min(1, k) * 0.92 * Math.sin(Math.PI * Math.min(1, u * 1.15));
};

/** embers: N glowing dots that rise from emitters and ride the wind */
const dotTex = () => ctex("emberDot", 32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,250,210,1)"); gr.addColorStop(0.35, "rgba(255,170,60,0.95)"); gr.addColorStop(1, "rgba(255,90,30,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
export const embers = (parent: THREE.Object3D, n: number) => {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: dotTex(), size: 0.22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: "#ffffff", sizeAttenuation: true }));
  pts.layers.set(NOINK); pts.renderOrder = 7; pts.frustumCulled = false; parent.add(pts);
  const seeds = Array.from({ length: n }, (_, i) => { const r = rng(i * 7 + 3); return [r(), r(), r(), r()]; });
  /** emit(i) gives an emitter point for particle slot i (or null = hidden); wind m/s (+x); amount 0..1 */
  const set = (t: number, emit: (i: number, r: number) => V3 | null, wind: number, amount = 1, life = 3.2) => {
    let j = 0;
    for (let i = 0; i < n; i++) {
      const [a, b, c, d] = seeds[i], on = a < amount, E = on ? emit(i, b) : null;
      if (!E) { pos[j++] = 0; pos[j++] = -99; pos[j++] = 0; continue; }
      const u = (t / life + c) % 1, tt = u * life;
      pos[j++] = E[0] + wind * tt + 0.6 * Math.sin(tt * 2 + d * 9);
      pos[j++] = E[1] + 1.6 * tt - 0.12 * tt * tt + 0.3 * Math.sin(tt * 3 + a * 7);
      pos[j++] = E[2] + 0.5 * Math.sin(tt * 1.7 + b * 11);
    }
    geo.attributes.position.needsUpdate = true;
  };
  return { pts, set };
};

/** an explosion at pos: flash, fireball tongues, a ring of dust, flying sparks. age = seconds since the boom */
const fireballTex = (i: number) => ctex("fball" + i, 192, 192, (g) => {
  const r = rng(91 + i * 3), cols = ["#ffe26a", "#ff9a2a", "#e8462a"];
  const lobes: [number, number, number][] = [];
  for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU + r() * 0.4; lobes.push([96 + Math.cos(a) * 46, 96 + Math.sin(a) * 40, 34 + 14 * r()]); }
  g.fillStyle = INKC; for (const [x, y, rr] of lobes) { g.beginPath(); g.arc(x, y, rr + 4, 0, TAU); g.fill(); }
  g.beginPath(); g.arc(96, 96, 60, 0, TAU); g.fill();
  for (let c = 2; c >= 0; c--) { g.fillStyle = cols[c]; const s = 1 - c * 0.0 - (2 - c) * 0.2; for (const [x, y, rr] of lobes) { g.beginPath(); g.arc(96 + (x - 96) * s, 96 + (y - 96) * s, rr * s, 0, TAU); g.fill(); } g.beginPath(); g.arc(96, 96, 56 * s, 0, TAU); g.fill(); }
});
const flashTex = () => ctex("boomFlash", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,240,1)"); gr.addColorStop(0.3, "rgba(255,220,140,0.8)"); gr.addColorStop(1, "rgba(255,140,60,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const dustTex = () => ctex("boomDust", 192, 140, (g) => {
  const r = rng(5), blobs: [number, number, number][] = [];
  for (let i = 0; i < 8; i++) blobs.push([36 + 120 * r(), 52 + 46 * r(), 26 + 22 * r()]);
  for (const [x, y, rr] of blobs) { g.fillStyle = "#9a8476"; g.beginPath(); g.arc(x, y + 6, rr, 0, TAU); g.fill(); }
  for (const [x, y, rr] of blobs) { g.fillStyle = "#cdb89e"; g.beginPath(); g.arc(x, y, rr * 0.92, 0, TAU); g.fill(); }
  for (const [x, y, rr] of blobs) { g.fillStyle = "#ecdcc0"; g.beginPath(); g.arc(x - rr * 0.25, y - rr * 0.3, rr * 0.5, 0, TAU); g.fill(); }
});
export const boom = (parent: THREE.Object3D, pos: V3, size = 6, fire = true) => {   // fire = false: a dust burst only (a collapse, not a blast)
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const mk = (map: THREE.Texture, add = false, ro = 8) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: !add, alphaTest: add ? 0 : 0.05, fog: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })); s.layers.set(NOINK); s.renderOrder = ro; s.visible = false; g.add(s); return s; };
  const flash = mk(flashTex(), true, 9), balls = [0, 1, 2, 3].map((i) => mk(fireballTex(i), false, 8)), dust = Array.from({ length: 8 }, () => mk(dustTex(), false, 7));
  const smoke = [0, 1, 2].map((i) => mk(smokeTex(i), false, 6));
  const r = rng(pos[0] * 5 + pos[2] * 3 + 1), dirs = dust.map((_, i) => { const a = (i / dust.length) * TAU + r() * 0.3; return [Math.cos(a), Math.sin(a)]; });
  const ballOff = balls.map(() => [r() * 2 - 1, r() * 0.8, r() * 2 - 1]);
  const set = (age: number, fade = 3.0) => {   // fade: seconds for the dust to clear
    const on = age >= 0 && age < Math.max(4.5, fade + 1.5);
    g.visible = on; if (!on) return;
    const fk = age < 0.35 ? 1 - age / 0.35 : 0;
    flash.visible = fire && fk > 0; flash.scale.setScalar(size * (1.1 + 0.8 * (1 - fk))); (flash.material as THREE.SpriteMaterial).opacity = 0.6 * fk;
    balls.forEach((b, i) => {
      const a = age - i * 0.04, k = a < 0 ? 0 : a < 0.9 ? Math.sin(Math.min(1, a / 0.9) * Math.PI) ** 0.6 : 0;
      b.visible = fire && k > 0.02; const sc = size * (0.35 + 0.65 * Math.min(1, a / 0.4)) * (0.8 + 0.25 * i / 3);
      b.scale.setScalar(sc * Math.max(0.3, k)); b.position.set(ballOff[i][0] * size * 0.25, size * 0.25 + ballOff[i][1] * size * 0.2 + a * size * 0.25, ballOff[i][2] * size * 0.25);
      b.material.rotation = i * 1.3 + a * 0.6; (b.material as THREE.SpriteMaterial).opacity = Math.min(1, k * 1.4);
    });
    dust.forEach((d, i) => {
      const a = age - 0.05; d.visible = a > 0; if (!d.visible) return;
      const R = size * (0.3 + 0.8 * (1 - Math.exp(-a * 2.2))), op = Math.max(0, 1 - a / fade);
      d.position.set(dirs[i][0] * R, 0.4 + 0.25 * size * (1 - Math.exp(-a * 1.5)), dirs[i][1] * R * 0.6);
      d.scale.set(size * (0.45 + 0.35 * a), size * (0.33 + 0.26 * a), 1); (d.material as THREE.SpriteMaterial).opacity = op * 0.95;
    });
    smoke.forEach((s, i) => {
      const a = age - 0.5 - i * 0.15; s.visible = a > 0; if (!s.visible) return;
      s.position.set((i - 1) * size * 0.2, size * (0.5 + 0.35 * a), 0); s.scale.set(size * (0.7 + 0.3 * a), size * (0.55 + 0.25 * a), 1);
      (s.material as THREE.SpriteMaterial).opacity = Math.max(0, Math.min(1, a * 2) * (1 - a / (fade * 1.33)));
    });
  };
  return { g, set };
};

/** a glowing ribbon of molten metal running down from a to b (t animates the flow, k = 0..1 amount) */
export const meltStream = (parent: THREE.Object3D, pts: V3[], width: number) => {
  // TubeGeometry uv: u runs ALONG the stream, v AROUND it -> the hot-edge / silver / highlight bands go across v,
  // the bright blobs ride along u and scroll with the flow; the stream pours out progressively (draw range = k)
  const tex = ctex("meltRib2", 512, 64, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "#ffb070"); gr.addColorStop(0.07, "#d6dde9"); gr.addColorStop(0.3, "#f4f7fb"); gr.addColorStop(0.5, "#ffffff"); gr.addColorStop(0.7, "#e4eaf3"); gr.addColorStop(0.93, "#b9c4d6"); gr.addColorStop(1, "#ffb070");
    g.fillStyle = gr; g.fillRect(0, 0, 512, 64);
    for (let x = 0; x < 512; x += 37) { g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.ellipse(x + 10, 26 + 6 * Math.sin(x), 14, 4, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(255,150,70,0.35)"; g.beginPath(); g.ellipse(x + 26, 50, 10, 3, 0, 0, TAU); g.fill(); }
  });
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(4, 1);
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, 64, width, 8, false);
  const mat = new THREE.MeshBasicMaterial({ map: tex, fog: false });
  const m = new THREE.Mesh(geo, mat); m.visible = false; parent.add(m);
  const n = geo.index ? geo.index.count : 0;
  const set = (t: number, k: number) => { m.visible = k > 0.02; tex.offset.x = -t * 1.6; geo.setDrawRange(0, Math.floor((n * Math.min(1, k * 1.25)) / 6) * 6); };
  return { m, set };
};
