// Inside a pinch of sawdust, seen through the magnifier (S13b). Warm amber macro world (the micro light key's sky +
// fog give the gradient backdrop, never black): curly wood flakes floating at many depths, see-through AIR BUBBLES
// trapped between them, and little ink-drawn HEAT critters (flame blobs) that push at the bubbles and bounce off.
// A big brass magnifier ring frames the view at the start (ctl ring: 0 hidden, 1 frames cam "ring", >1 grows past).
import * as THREE from "three";
import { lam } from "../build";
import { ctex, rng } from "../paint";
import { NOINK } from "../ink";
import { glow } from "../setkit";
import { curlGeo, motes, metal, INKC, TAU } from "./innerkit_b";
import type { SetDef, V3 } from "./types";

const woodTex = (key: string, base: string, line: string, light: string) => ctex("microWood_" + key, 512, 128, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 22; i++) { g.strokeStyle = r() < 0.3 ? light : line; g.lineWidth = 1.5 + r() * 3.5; g.beginPath(); const y = r() * 128; g.moveTo(0, y); g.bezierCurveTo(170, y + (r() - 0.5) * 26, 340, y + (r() - 0.5) * 26, 512, y + (r() - 0.5) * 10); g.stroke(); }
  for (let i = 0; i < 3; i++) { const x = r() * 512, y = 20 + r() * 88; g.strokeStyle = line; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 22, 8, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(x, y, 10, 4, 0, 0, TAU); g.stroke(); }
  g.fillStyle = "rgba(255,240,210,0.35)"; g.fillRect(0, 4, 512, 6); g.fillStyle = "rgba(90,50,20,0.3)"; g.fillRect(0, 118, 512, 10);
});
const backTex = () => ctex("microBackB", 512, 1024, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#1e2c66"); gr.addColorStop(0.5, "#3e5cae"); gr.addColorStop(1, "#18245a"); // night-blue explanation (v10.4 light arc)
  g.fillStyle = gr; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 40; i++) { const x = r() * 512, y = r() * 1024, rr = 20 + r() * 70; const b = g.createRadialGradient(x, y, 0, x, y, rr); b.addColorStop(0, "rgba(190,215,255,0.3)"); b.addColorStop(0.8, "rgba(190,215,255,0.14)"); b.addColorStop(1, "rgba(190,215,255,0)"); g.fillStyle = b; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
  for (let i = 0; i < 14; i++) { g.strokeStyle = "rgba(170,100,40,0.25)"; g.lineWidth = 18 + r() * 30; g.lineCap = "round"; g.beginPath(); const x = r() * 512, y = r() * 1024; g.arc(x, y, 40 + r() * 80, r() * 6, r() * 6 + 3); g.stroke(); }
});
/** the heat critter (flame blob, character ink style): face 0 = push/strain, 1 = bonk (dizzy), 2 = stuck (grumpy) */
const critterTex = (face: number) => ctex("microCritter" + face, 320, 384, (g) => {
  const ink = INKC, W = 320;
  g.lineJoin = "round"; g.lineCap = "round";
  // arms (behind the body) reaching to the right
  const arm = (y: number, dx: number, dy: number) => { g.strokeStyle = ink; g.lineWidth = 9; g.beginPath(); g.moveTo(200, y); g.quadraticCurveTo(240, y - 10, 200 + dx, y + dy); g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(200 + dx, y + dy, 11, 0, TAU); g.fill(); };
  if (face !== 1) { arm(250, 100, -14); arm(282, 104, 8); } else { arm(250, 70, -60); arm(282, 80, 30); }
  // flame body: round bottom, three licking tips
  const body = () => { g.beginPath(); g.moveTo(160, 360); g.bezierCurveTo(60, 360, 34, 270, 62, 196); g.bezierCurveTo(78, 150, 96, 170, 92, 120); g.bezierCurveTo(116, 150, 120, 120, 128, 70); g.bezierCurveTo(150, 120, 160, 40, 168, 14); g.bezierCurveTo(186, 80, 210, 110, 212, 92); g.bezierCurveTo(240, 140, 230, 170, 244, 150); g.bezierCurveTo(286, 240, 270, 360, 160, 360); g.closePath(); };
  const gr = g.createRadialGradient(158, 280, 10, 158, 250, 190); gr.addColorStop(0, "#fff2a8"); gr.addColorStop(0.3, "#ffc23a"); gr.addColorStop(0.65, "#ff7a1e"); gr.addColorStop(1, "#e2361e");
  body(); g.fillStyle = gr; g.fill(); g.strokeStyle = ink; g.lineWidth = 11; g.stroke();
  // inner lick highlight
  g.fillStyle = "rgba(255,250,210,0.75)"; g.beginPath(); g.moveTo(150, 340); g.bezierCurveTo(110, 330, 108, 270, 132, 236); g.bezierCurveTo(132, 270, 150, 280, 150, 340); g.fill();
  // face
  g.fillStyle = ink; g.strokeStyle = ink;
  if (face === 0) { // straining: black dot eyes, thick angry brows, small gritted mouth, sweat
    for (const x of [126, 192]) { g.beginPath(); g.ellipse(x, 244, 11, 14, 0, 0, TAU); g.fill(); }
    g.lineWidth = 14; g.beginPath(); g.moveTo(104, 206); g.lineTo(146, 222); g.stroke(); g.beginPath(); g.moveTo(214, 206); g.lineTo(172, 222); g.stroke();
    g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(138, 284, 46, 24, 7); g.fill(); g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(138, 296); g.lineTo(184, 296); g.moveTo(153, 284); g.lineTo(153, 308); g.moveTo(169, 284); g.lineTo(169, 308); g.lineWidth = 4; g.stroke();
    g.fillStyle = "#bfe8ff"; g.beginPath(); g.moveTo(236, 180); g.quadraticCurveTo(252, 206, 236, 214); g.quadraticCurveTo(220, 206, 236, 180); g.fill(); g.lineWidth = 4; g.stroke();
  } else if (face === 1) { // bonked: spiral-ish ring eyes, O mouth, little stars
    g.lineWidth = 7; for (const x of [124, 194]) { g.beginPath(); g.arc(x, 240, 16, 0, TAU); g.stroke(); g.beginPath(); g.arc(x, 240, 6, 0, TAU); g.fill(); }
    g.lineWidth = 12; g.beginPath(); g.moveTo(104, 210); g.lineTo(144, 202); g.stroke(); g.beginPath(); g.moveTo(214, 210); g.lineTo(174, 202); g.stroke();
    g.fillStyle = "#7a1a10"; g.beginPath(); g.ellipse(160, 296, 16, 20, 0, 0, TAU); g.fill(); g.lineWidth = 6; g.stroke();
    g.fillStyle = "#fff6b0"; for (const [x, y] of [[90, 150], [240, 130], [200, 70]]) { g.beginPath(); for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU - Math.PI / 2, rr = k % 2 ? 7 : 16; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); g.lineWidth = 4; g.stroke(); }
  } else { // stuck: dot eyes, flat grumpy brows, small frown
    for (const x of [126, 192]) { g.beginPath(); g.ellipse(x, 244, 10, 13, 0, 0, TAU); g.fill(); }
    g.lineWidth = 13; g.beginPath(); g.moveTo(104, 214); g.lineTo(146, 224); g.stroke(); g.beginPath(); g.moveTo(214, 214); g.lineTo(172, 224); g.stroke();
    g.lineWidth = 8; g.beginPath(); g.arc(160, 312, 18, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  }
  void W;
});
const bubbleMat = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uInk: { value: new THREE.Color(INKC) }, uTint: { value: new THREE.Color("#fff6e0") } },
  vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
  fragmentShader: `uniform vec3 uInk; uniform vec3 uTint; varying vec3 vN; varying vec3 vV;
    void main(){ vec3 n = normalize(vN); float f = 1.0 - abs(dot(n, normalize(vV)));
      float rim = smoothstep(0.45, 0.82, f); float ink = smoothstep(0.86, 0.93, f);
      float spec = pow(max(dot(n, normalize(vec3(-0.45, 0.6, 0.65))), 0.0), 60.0);
      float spec2 = pow(max(dot(n, normalize(vec3(0.5, -0.45, 0.7))), 0.0), 30.0) * 0.5;
      vec3 c = mix(uTint, vec3(1.0), rim * 0.7) * (1.0 + rim * 0.6);
      float a = 0.06 + rim * 0.6;
      c = mix(c, vec3(1.4), max(spec, spec2)); a = max(a, max(spec, spec2));
      c = mix(c, uInk, ink); a = mix(a, 0.95, ink);
      gl_FragColor = vec4(c, a); }`,
});

export const micro = (): SetDef => {
  const root = new THREE.Group();
  const r = rng(123);
  // backdrop card far behind (soft bokeh), the sky + fog do the rest
  const back = new THREE.Mesh(new THREE.PlaneGeometry(46, 70), new THREE.MeshBasicMaterial({ map: backTex(), fog: false }));
  back.position.set(0, 0, -34); back.layers.set(NOINK); root.add(back);
  // ---- flakes / shavings at many depths (a clear channel down the middle for the drift) ----
  const woods = [lam("microPine", () => ({ map: woodTex("pine", "#f2d49c", "rgba(180,120,60,0.45)", "rgba(255,246,220,0.6)"), side: THREE.DoubleSide })),
    lam("microGold", () => ({ map: woodTex("gold", "#e4b064", "rgba(150,90,40,0.5)", "rgba(255,230,180,0.5)"), side: THREE.DoubleSide })),
    lam("microRed", () => ({ map: woodTex("red", "#cf8c56", "rgba(120,60,30,0.5)", "rgba(250,200,150,0.5)"), side: THREE.DoubleSide }))];
  type Flake = { m: THREE.Mesh; base: THREE.Vector3; rot: THREE.Euler; sp: number; ph: number };
  const flakes: Flake[] = [];
  const addFlake = (x: number, y: number, z: number, s: number) => {
    const turns = 0.4 + r() * 1.4, geo = curlGeo(0.45 + r() * 0.35, 0.35 + r() * 0.25, turns, 0.15 + r() * 0.5, 40, 0.15 + r() * 0.4);
    const m = new THREE.Mesh(geo, woods[Math.floor(r() * 3)]); m.scale.setScalar(s); m.castShadow = true; m.receiveShadow = true;
    const rot = new THREE.Euler(r() * TAU, r() * TAU, r() * TAU); m.rotation.copy(rot); m.position.set(x, y, z); root.add(m);
    flakes.push({ m, base: new THREE.Vector3(x, y, z), rot, sp: 0.05 + r() * 0.1, ph: r() * TAU });
  };
  for (let i = 0; i < 58; i++) {
    const z = 2.5 - r() * 26, spread = 1.4 + (2.5 - z) * 0.32;
    let x = (r() * 2 - 1) * spread * 0.75, y = (r() * 2 - 1) * spread * 1.25, s = 0.9 + r() * 1.5;
    if (z > -12 && Math.abs(x) < 1.25 && Math.abs(y) < 1.8) { x = Math.sign(x || 1) * (1.25 + r() * 0.6); s = Math.min(s, 1.3); }
    addFlake(x, y, z, s);
  }
  // big near framing flakes at the edges of the frame
  addFlake(-1.45, 2.2, 1.0, 2.6); addFlake(1.4, -2.4, 0.4, 2.8); addFlake(1.5, 1.6, -1.5, 2.2); addFlake(-1.5, -1.6, -2.4, 2.4);
  // ---- air bubbles (trapped between the flakes) ----
  const bm = bubbleMat();
  type Bub = { m: THREE.Mesh; c: THREE.Vector3; rad: number; ph: number };
  const bubs: Bub[] = [];
  const addBub = (x: number, y: number, z: number, rad: number) => { const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 32, 20), bm); m.position.set(x, y, z); m.layers.set(NOINK); m.renderOrder = 6; root.add(m); bubs.push({ m, c: new THREE.Vector3(x, y, z), rad, ph: r() * TAU }); };
  const key: [number, number, number, number][] = [[0.3, 0.55, -0.8, 0.5], [-0.45, -1.0, -2.2, 0.55], [0.55, -0.35, -4.0, 0.7], [-0.5, 1.45, -4.6, 0.55], [0.15, -2.1, -6.2, 0.6], [0.8, 2.0, -7.2, 0.6], [-0.75, 0.2, -8.6, 0.8]];
  key.forEach(([x, y, z, rr]) => addBub(x, y, z, rr));
  for (let i = 0; i < 26; i++) { const z = 1.5 - r() * 22, sp = 1 + (2.5 - z) * 0.3; addBub((r() * 2 - 1) * sp * 0.8, (r() * 2 - 1) * sp * 1.3, z, 0.12 + r() * 0.3); }
  // ---- heat critters (camera-facing ink cards, glowing + lighting the flakes) ----
  const tex = [critterTex(0), critterTex(1), critterTex(2)];
  type Crit = { s: THREE.Sprite; b: Bub; dir: THREE.Vector3; ph: number; stuck: boolean; L: THREE.PointLight; gl: THREE.Sprite; size: number };
  const crits: Crit[] = [];
  const dirs: [number, number][] = [[-1, 0.2], [1, -0.3], [-1, -0.4], [1, 0.5], [-1, 0.6], [1, 0.1], [-1, -0.2]];
  key.forEach((_, i) => {
    const mat = new THREE.SpriteMaterial({ map: tex[0], transparent: true, alphaTest: 0.4, depthWrite: true, fog: false });
    const s = new THREE.Sprite(mat); s.layers.set(NOINK); s.renderOrder = 5; root.add(s);
    const size = 0.62 + (i % 3) * 0.1;
    const L = new THREE.PointLight("#ff7a2a", 3.0, 3.6, 1.4); root.add(L);
    const gl = glow(root, [0, 0, 0], "#ff8a3a", size * 3.2, 0.55);
    const [dx, dy] = dirs[i]; crits.push({ s, b: bubs[i], dir: new THREE.Vector3(dx, dy, 0.15).normalize(), ph: i * 0.37, stuck: i === 3 || i === 6, L, gl, size });
  });
  // a warm key glow up top (the lamp light through the lens) + floating specks
  const keyL = new THREE.PointLight("#9fb8ff", 30, 40, 1.0); keyL.position.set(-3, 7, 3); root.add(keyL);
  glow(root, [-2.4, 5.5, -6], "#a8c4ff", 9, 0.35);
  const specks = motes(root, [-3, -5, -14], [3, 5, 2], 140, "#d6e4ff", 0.05, 0.85, 9);
  // ---- the brass magnifier ring (frames cam "ring" at scale 1) with a warm dark-brown surround, lens glint ----
  const ring = new THREE.Group(); ring.position.set(0, 0, 1.8); root.add(ring);
  const brass = metal("microBrass", "#d9a640", 60);
  const tor = new THREE.Mesh(new THREE.TorusGeometry(0.395, 0.035, 14, 72), brass); ring.add(tor);
  const tor2 = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.012, 8, 72), brass); ring.add(tor2);
  const sur = new THREE.RingGeometry(0.4, 4, 72, 4); const sc: number[] = []; const spos = sur.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < spos.count; i++) { const d = Math.hypot(spos.getX(i), spos.getY(i)); const k = Math.min(1, (d - 0.4) / 0.9); const c = new THREE.Color("#7a4a26").lerp(new THREE.Color("#2e1a10"), k); sc.push(c.r, c.g, c.b); }
  sur.setAttribute("color", new THREE.Float32BufferAttribute(sc, 3));
  const surround = new THREE.Mesh(sur, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); surround.position.z = -0.01; surround.layers.set(NOINK); ring.add(surround);
  const glint = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.5), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.25, depthWrite: false, fog: false })); glint.position.set(-0.17, 0.12, 0.01); glint.rotation.z = -0.6; glint.layers.set(NOINK); ring.add(glint);
  const glint2 = glint.clone(); glint2.scale.set(0.5, 0.6, 1); glint2.position.set(-0.08, 0.2, 0.01); ring.add(glint2);
  const marks: Record<string, V3> = { center: [0, 0, 0] };
  const cams = {
    inside: { pos: [0.15, 0.1, 4.5] as V3, look: [0.0, 0.0, -8] as V3, fov: 50 },
    ring: { pos: [0, 0, 3.4] as V3, look: [0, 0, -8] as V3, fov: 45 },
  };
  const tmp = new THREE.Vector3();
  return {
    name: "micro", root, marks, cams,
    pose: (t, c) => {
      flakes.forEach((f) => { f.m.position.set(f.base.x + Math.sin(t * f.sp * 3 + f.ph) * 0.06, f.base.y + Math.sin(t * f.sp * 2 + f.ph) * 0.12, f.base.z); f.m.rotation.set(f.rot.x + t * f.sp * 0.4, f.rot.y + Math.sin(t * f.sp + f.ph) * 0.2, f.rot.z); });
      bubs.forEach((b) => { const w = 1 + 0.03 * Math.sin(t * 2.2 + b.ph); b.m.scale.set(w, 2 - w, w); b.m.position.set(b.c.x, b.c.y + Math.sin(t * 0.6 + b.ph) * 0.05, b.c.z); });
      // critters: approach the bubble, squash on contact, bounce back dizzy; "stuck" ones jiggle against the bubble
      crits.forEach((k) => {
        const P = 2.4, u = ((t + k.ph * P) % P) / P;
        let gap: number, face = 0, sq = 0;
        if (k.stuck) { gap = 0.02 + 0.03 * Math.abs(Math.sin(t * 9 + k.ph * 10)); face = 2; sq = 0.08 * Math.sin(t * 18 + k.ph); }
        else if (u < 0.55) { const a = u / 0.55; gap = 0.75 * (1 - a * a); face = 0; }
        else if (u < 0.62) { gap = 0; face = 0; sq = Math.sin(((u - 0.55) / 0.07) * Math.PI) * 0.3; }
        else { const a = (u - 0.62) / 0.38; gap = 0.9 * (1 - (1 - a) ** 3) * (1 - 0.15 * a); face = a < 0.6 ? 1 : 0; }
        const bp = k.b.m.position, rr = k.b.rad + k.size * 0.42 + gap;
        tmp.copy(k.dir).multiplyScalar(-rr).add(bp);
        tmp.y += face === 1 ? Math.sin(u * 30) * 0.03 : 0;
        k.s.position.copy(tmp);
        const flip = k.dir.x < 0 ? -1 : 1; // arms point at the bubble
        k.s.scale.set(flip * k.size * (1 + sq), k.size * 1.2 * (1 - sq * 0.8), 1);
        (k.s.material as THREE.SpriteMaterial).map = tex[face];
        (k.s.material as THREE.SpriteMaterial).rotation = face === 1 ? Math.sin(t * 12) * 0.25 : 0.05 * Math.sin(t * 6 + k.ph);
        k.L.position.copy(tmp); k.L.intensity = 3.0 * (0.85 + 0.15 * Math.sin(t * 11 + k.ph * 7));
        k.gl.position.copy(tmp); k.gl.position.z -= 0.05;
      });
      specks.update(t);
      const rv = c.ring ?? 0; ring.visible = rv > 0.001; ring.scale.setScalar(Math.max(rv, 0.001));
      keyL.intensity = 30;
    },
  };
};
