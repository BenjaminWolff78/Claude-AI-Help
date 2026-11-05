import { getInputProps } from "remotion";
const QA_ON = !!(getInputProps() as { qa?: boolean }).qa;
// One three.js world holding every set of the film (each in its own local space, offset along x so lights, shadows
// and fog never mix). update(id, f, camera) shows the shot's set, sets the light key, poses set + cast, and returns the
// lens focus point. Light rig, sky, fog and clouds follow the skill's measured template (lighting.md, depth.md).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Kit, V } from "./build";
import { ctex, cloudHD } from "./paint";
import { LIGHTS, LOOK, LightName } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, tier } from "./cast";
import { Pen, fxContact, fxShadow } from "./toon";
import { figure, FigOpts, Look } from "./fig";
import { CAST } from "./casts";
import { FPS, SHOTS, PREVIEW, V3, ShotDef, dofAt , STORY_BY_ID } from "./story";
import { SET_BUILDERS } from "./sets";
import type { SetDef } from "./sets/types";
import { WATER_U } from "./setkit";
import { camFor, actFor, CastPlace, FxSpec } from "./cams";

const KENNEY: string[] = [];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(KENNEY.map((n) => loader.loadAsync(staticFile(`bridge/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return kitP;
};

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
const SET_GAP = 2000;
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 60) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
/** v10.8: a 3- or 4-frame blink (half / shut / [shut] / half) every 0.5-1.5 s at irregular times, per character */
const LID4 = [0.5, 1, 1, 0.5], LID3 = [0.5, 1, 0.5];
export const lidAt = (f: number, i: number) => {
  let s = Math.round(-45 * hh(i, 9));
  for (let n = 0; s <= f && n < 900; n++) {
    const L = hh(i * 17 + n, 5) < 0.5 ? LID3 : LID4, k = f - s;
    if (k >= 0 && k < L.length) return L[k];
    s += Math.round(15 + 30 * hh(i * 31 + n, 13));
  }
  return 0;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private clouds: THREE.Mesh[] = [];
  private cloudMaps: Record<string, THREE.Texture[]> = {};
  sets: Record<string, { def: SetDef; off: THREE.Vector3 }> = {};
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el)); c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 0.5);
    // the three.js sun only drives shadows + direction: its colour is black, the two-tone uniforms carry the light, so
    // point lights (lamps, candles, windows) are the only thing in directDiffuse and add their pools on top (shade.ts)
    this.sun = new THREE.DirectionalLight("#000000", 1);
    this.sun.castShadow = true; { const sm = ((getInputProps() as { post?: { shadow?: number } }).post?.shadow) ?? 4096; this.sun.shadow.mapSize.set(sm, sm); }
    R.add(this.hemi, this.sun, this.sun.target);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30; m.userData = { a, d, y: 70 + (i % 4) * 30 }; m.scale.set(w * 2.4, w / 4.6, 1); m.layers.set(NOINK); // long thin stratus streaks, never cotton balls
      this.clouds.push(m); R.add(m);
    }
    const names = Object.keys(SET_BUILDERS);
    const wanted = new Set(SHOTS.map((s) => s.set));
    names.forEach((n, i) => {
      if (!wanted.has(n)) return;
      const def = SET_BUILDERS[n](kit), off = V(i * SET_GAP, 0, 0);
      def.root.position.copy(off); def.root.visible = false; R.add(def.root);
      this.sets[n] = { def, off };
    });
  }

  private cloudsFor(light: LightName) {
    if (!this.cloudMaps[light]) this.cloudMaps[light] = [0, 1, 2, 3].map((k) => cloudHD(k, LOOK[light].cloud));
    return this.cloudMaps[light];
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s: ShotDef = STORY_BY_ID(id), L = LIGHTS[s.light], K = LOOK[s.light];
    const set = this.sets[s.set];
    for (const k in this.sets) this.sets[k].def.root.visible = k === s.set;
    if (!set) return V(0, 0, 0);
    const off = set.off;
    // ---- camera (set-local -> world) ----
    const c = camFor(id, f, set.def);
    cam.position.set(c.pos[0] + off.x, c.pos[1] + off.y, c.pos[2] + off.z); cam.up.set(0, 1, 0);
    cam.lookAt(c.look[0] + off.x, c.look[1] + off.y, c.look[2] + off.z); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.08; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const look = V(c.look[0] + off.x, c.look[1] + off.y, c.look[2] + off.z), dist = cam.position.distanceTo(look);
    cam.layers.enable(NOINK);
    // ---- light rig: camera-relative sun frozen per shot ----
    const fw = look.clone().sub(cam.position).setY(0).normalize(), rt = V(-fw.z, 0, fw.x);
    const az = THREE.MathUtils.degToRad(set.def.sun?.az ?? L.az), el = THREE.MathUtils.degToRad(set.def.sun?.el ?? L.el);
    const sunDir = fw.clone().multiplyScalar(Math.cos(az)).addScaledVector(rt, Math.sin(az)).multiplyScalar(Math.cos(el)).setY(Math.sin(el)).normalize();
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI * 0.6;
    const Rr = THREE.MathUtils.clamp(dist * 1.2 + 8, 12, 60);
    this.sun.position.copy(look).addScaledVector(sunDir, 200); this.sun.target.position.copy(look);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 420; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc, clouds, water colours ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    const showSun = L.sunDisc !== "#000000";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.8)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    const cm = this.cloudsFor(s.light);
    this.clouds.forEach((m, i) => {
      const u = m.userData, a = u.a + t * 0.004;
      m.position.set(cam.position.x + Math.cos(a) * u.d, u.y, cam.position.z + Math.sin(a) * u.d); m.lookAt(cam.position.x, m.position.y, cam.position.z);
      (m.material as THREE.MeshBasicMaterial).map = cm[i % 4]; m.visible = !["night", "lab", "cabin", "micro", "microBlue", "labNight"].includes(s.light);
    });
    const wc = K.water;
    untone(wc.near, WATER_U.wNearC.value); untone(wc.mid, WATER_U.wMidC.value); untone(wc.far, WATER_U.wFarC.value);
    untone(wc.crest, WATER_U.wCrest.value); untone(wc.trough, WATER_U.wTrough.value); untone(wc.glint, WATER_U.wGlint.value);
    WATER_U.wShade.value.set(...wc.shade); WATER_U.wTime.value = t;
    // ---- set pose + cast ----
    const act = actFor(id, f, set.def);
    set.def.pose(t, act.ctl ?? {});
    this.placeCast(act.cast, act.fx ?? [], cam, off, f, sunDir);
    if (QA_ON) this.qa(id, f, cam, off, act, set.def.root, c);
    // ---- focus: DOF table point (set-local) or the look point ----
    const d = dofAt(f);
    if (d.focus) { const p = d.focus(f); return V(p[0] + off.x, p[1] + off.y, p[2] + off.z); }
    if (act.focus) return V(act.focus[0] + off.x, act.focus[1] + off.y, act.focus[2] + off.z);
    return look;
  }


  /** QA mode (inputProps.qa): per-frame camera collision / occlusion / framing / overlap report, logged as "QA|{json}" */
  private qa(id: number, f: number, cam: THREE.PerspectiveCamera, off: THREE.Vector3, act: { cast: CastPlace[]; focus?: V3; subj?: string | null }, root: THREE.Object3D, c: { pos: V3; look: V3 }) {
    const ray = new THREE.Raycaster(), ndc = (p: THREE.Vector3) => p.clone().project(cam);
    const subj = act.subj === null ? undefined : act.subj ? act.cast.find((x) => x.who === act.subj) : act.cast.find((x) => x.who === "boss") ?? act.cast[0];
    const head = subj ? V(subj.pos[0] + off.x, subj.pos[1] + 1.55 * (subj.scale ?? 1) + off.y, subj.pos[2] + off.z) : V(c.look[0] + off.x, c.look[1] + off.y, c.look[2] + off.z);
    const meshes: THREE.Object3D[] = [];
    root.traverseVisible((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.layers.isEnabled(NOINK) && !(m as unknown as THREE.Sprite).isSprite) meshes.push(m); });
    // occluders between the subject's head and the camera (also catches a camera sitting inside a block or crate)
    const dir = cam.position.clone().sub(head), D = dir.length(); dir.normalize();
    ray.set(head.clone().addScaledVector(dir, 0.02), dir); ray.far = D;
    const occ = ray.intersectObjects(meshes, false).filter((h) => h.distance < D - 0.05).slice(0, 3).map((h) => {
      const m = (h.object as THREE.Mesh).material as THREE.Material; return `${h.object.name || h.object.parent?.name || "mesh"}${m && (m as THREE.Material).transparent ? "(T)" : ""}@${(D - h.distance).toFixed(2)}`; });
    // something right in front of the lens (near-plane clip): short rays in a cone around the view axis
    const fwd = V(0, 0, -1).applyQuaternion(cam.quaternion); let near = 0;
    for (const [dx, dy] of [[0, 0], [0.3, 0], [-0.3, 0], [0, 0.4], [0, -0.4]]) { const d = fwd.clone().add(V(dx, dy, 0).applyQuaternion(cam.quaternion)).normalize(); ray.set(cam.position, d); ray.far = 0.35; if (ray.intersectObjects(meshes, false).length) near++; }
    const hp = ndc(head), inFrame = subj ? Math.abs(hp.x) < 0.9 && hp.y > -0.55 && hp.y < 0.92 && hp.z < 1 : true;
    // overlapping bodies: screen boxes of cards at similar depth
    const rgt = V(1, 0, 0).applyQuaternion(cam.quaternion);
    const boxes = act.cast.map((x) => { const sc = x.scale ?? 1, mid = V(x.pos[0] + off.x, x.pos[1] + 0.95 * sc + off.y, x.pos[2] + off.z); const p0 = ndc(mid), p1 = ndc(mid.clone().addScaledVector(rgt, 0.26 * sc)); return { x: p0.x, w: Math.abs(p1.x - p0.x), d: cam.position.distanceTo(mid), z: p0.z, who: x.who }; });
    const over: string[] = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const A = boxes[i], B = boxes[j]; if (A.z > 1 || B.z > 1 || Math.abs(A.x) > 1.1 || Math.abs(B.x) > 1.1) continue; const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x - A.w, B.x - B.w); if (ox > 0.7 * 2 * Math.min(A.w, B.w) && Math.abs(A.d - B.d) < 1.2) over.push(A.who + "+" + B.who); }
    const cut: string[] = [];
    for (const x of act.cast) { const sc = x.scale ?? 1, h = V(x.pos[0] + off.x, x.pos[1] + 1.55 * sc + off.y, x.pos[2] + off.z), p0 = ndc(h); if (p0.z > 1) continue; const r = Math.abs(ndc(h.clone().addScaledVector(rgt, 0.27 * sc)).x - p0.x), ry = r * cam.aspect;
      if ((Math.abs(p0.x) < 1 + r && Math.abs(p0.x) > 1 - r && Math.abs(p0.y) < 1) || (p0.y > 1 - ry && p0.y < 1 + ry && Math.abs(p0.x) < 1)) cut.push(x.who); }
    const hero = act.cast.find((x) => x.who === "boss");
    const frontal = !!hero && !(hero.o?.facing) && !hero.o?.back && Math.abs(ndc(V(hero.pos[0] + off.x, hero.pos[1] + 1.5 + off.y, hero.pos[2] + off.z)).x) < 0.22;
    console.log("QA|" + JSON.stringify({ f, id, cam: c.pos.map((v) => +v.toFixed(3)), look: c.look.map((v) => +v.toFixed(3)), occ, near, inFrame: inFrame ? 1 : 0, hx: +hp.x.toFixed(2), hy: +hp.y.toFixed(2), over, cut, frontal: frontal ? 1 : 0 }));
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  private placeCast(cast: CastPlace[], fxs: FxSpec[], cam: THREE.PerspectiveCamera, off: THREE.Vector3, f: number, sunDir: THREE.Vector3) {
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    // canvas angle the light comes FROM on a card facing the camera (45 deg steps: small texture cache)
    const lightAng = (mirror: boolean) => { const sx = sunDir.dot(right) * (mirror ? -1 : 1), sy = -sunDir.y; return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4); };
    const blobs: FxSpec[] = [];
    let ai = 0; const used: Actor[] = [];
    for (const p of cast) {
      const x = p.pos[0] + off.x, y = p.pos[1] + off.y, z = p.pos[2] + off.z, sc = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(x, y + 1.0 * sc, z), 2.5 * sc))) continue;
      const a = this.actor(ai++);
      const look: Look = CAST[p.who] ?? CAST.lustig;
      const dcam = cam.position.distanceTo(this.v.set(x, y + 1.2 * sc, z)) / sc;
      const [w, h, k] = tier(dcam);
      const o: FigOpts = { light: lightAng(!!p.mirror), blink: lidAt(f, look.seed + (p.idx ?? 0) * 7), ...p.o };
      const key = `F|${p.who}|${fkey(o)}`;
      a.r = this.pool.req(key, w, h, k, (pen: Pen) => figure(pen, look, o));
      a.mesh.visible = true; a.mesh.position.set(x, y, z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - x, cam.position.z - z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc : sc, sc, sc);
      a.mesh.castShadow = !!p.shadow;
      used.push(a);
      if (p.blob !== false && !p.air) blobs.push({ kind: "blob", pos: [p.pos[0], p.pos[1], p.pos[2]], w: 0.5 * sc, h: 0.36 * sc });
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0; const fused: Fx[] = [];
    for (const sp of [...blobs, ...fxs]) {
      const x = sp.pos[0] + off.x, y = sp.pos[1] + off.y, z = sp.pos[2] + off.z;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(x, y, z), Math.max(sp.w, sp.h)))) continue;
      const e = this.fx(fi++);
      if (sp.kind === "blob") {
        e.r = this.pool.req("blob|contact|#3a3654", 128, 128, 1, (pen) => fxContact(pen, "#3a3654"));
        e.mesh.position.set(x, y + 0.02, z); e.mesh.rotation.set(-Math.PI / 2, 0, 0); e.mesh.scale.set(sp.w, sp.h, 1);
      } else {
        e.r = this.pool.req(sp.key!, sp.cw ?? 256, sp.ch ?? 256, 1, sp.draw!);
        e.use(!!sp.soft); e.mesh.position.set(x, y, z);
        if (sp.flat) e.mesh.rotation.set(-Math.PI / 2, 0, sp.rot ?? 0); else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(sp.rot ?? 0); }
        e.mesh.scale.set(sp.w, sp.h, 1);
      }
      e.mesh.visible = true; fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
  }
}
// re-export for sets that need shadows of a specific shape
export { fxShadow };
