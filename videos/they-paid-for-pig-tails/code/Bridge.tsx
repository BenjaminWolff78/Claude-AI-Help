// "The Bridge That Fell for a Song": our original 67 s short in the flat-characters-in-a-3D-toon-world style.
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain (look-match pass):
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook ends on a 4-frame white flash.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { Pass } from "postprocessing";
/** r76i: repairs NaN / Inf pixels from the scene render before any convolution (the bloom mip chain smeared single NaN pixels into
 *  pale screen rectangles on many frames of the dpr 0.55 final render); a bad pixel takes the mean of its valid neighbours */
class NanGuardPass extends Pass {
  mat: THREE.ShaderMaterial;
  constructor() {
    super("NanGuardPass");
    this.mat = new THREE.ShaderMaterial({
      uniforms: { inputBuffer: { value: null }, texel: { value: new THREE.Vector2(1, 1) } },
      vertexShader: "varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 1.0, 1.0); }",
      fragmentShader: `uniform sampler2D inputBuffer; uniform vec2 texel; varying vec2 vUv;
bool bad(vec4 c) { return any(isnan(c)) || any(isinf(c)) || !(c.r == c.r && c.g == c.g && c.b == c.b && c.a == c.a) || any(greaterThan(abs(c), vec4(60000.0))); }
void main() {
  vec4 c = texture2D(inputBuffer, vUv);
  if (bad(c)) {
    vec4 s = vec4(0.0); float n = 0.0;
    for (int k = 0; k < 8; k++) {
      vec2 o = k == 0 ? vec2(1.0, 0.0) : k == 1 ? vec2(-1.0, 0.0) : k == 2 ? vec2(0.0, 1.0) : k == 3 ? vec2(0.0, -1.0) : k == 4 ? vec2(2.0, 0.0) : k == 5 ? vec2(-2.0, 0.0) : k == 6 ? vec2(0.0, 2.0) : vec2(0.0, -2.0);
      vec4 q = texture2D(inputBuffer, vUv + o * texel);
      if (!bad(q)) { s += q; n += 1.0; }
    }
    c = n > 0.0 ? s / n : vec4(0.0, 0.0, 0.0, 1.0);
  }
  gl_FragColor = c;
}`,
      depthWrite: false, depthTest: false });
    this.fullscreenMaterial = this.mat;
  }
  render(renderer: THREE.WebGLRenderer, inputBuffer: THREE.WebGLRenderTarget, outputBuffer: THREE.WebGLRenderTarget) {
    this.mat.uniforms.inputBuffer.value = inputBuffer.texture; this.mat.uniforms.texel.value.set(1 / inputBuffer.width, 1 / inputBuffer.height);
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer); renderer.render(this.scene, this.camera);
  }
}
import { phEnv } from "./ph";
import { World, loadKit } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";
import { TOTAL, TOTAL_REAL, WARP, storyF, FLASH_AT, SHOTS, layersAt, dofAt , STORY_BY_ID, dipAt } from "./story";
import { LIGHTS } from "./lights";
import { Captions } from "./Captions";
import { PREVIEW } from "./story";
import { REAL } from "./realflag";

export const BRIDGE_FRAMES = TOTAL_REAL; void TOTAL;

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: !REAL, lens: true, pre: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain always starts at 540x960 (half of 1080x1920),
 *  whatever the output size, so the glow keeps the same size relative to the frame (e-fold ~30 px at 1080p,
 *  ~1.5 % of the frame height) at 540, 1080 and 1440 widths. ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.1,   /* r76i (reviewer): about half - the bloom haze lifted the blacks indoors */   /* r76: softer (the candle bloom blew out a fifth of the office frame) */ luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("bridge kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Kit }> = ({ id, kit }) => {
  const of = useCurrentFrame(), f = storyF(of / WARP);   // story frame (fractional) through the re-voice remap
  const { camera, scene, gl } = useThree();
  // render speed (software GL): the sun's shadow map is redrawn every 2nd frame (and on every jump or shot change); the
  // stale frame reuses the previous map with its own matrix, so static casters stay exact and movers lag one frame
  const sh = useMemo(() => ({ f: -9, id: -1 }), []);
  gl.shadowMap.autoUpdate = false;
  gl.shadowMap.needsUpdate = of % 2 === 0 || of !== sh.f + 1 || id !== sh.id;   // cadence on the OUTPUT frame
  sh.f = of; sh.id = id;
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    nan: new NanGuardPass(),
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 12, nearScale: 0.8 }),   // 2026-11-20: sharper overall (user: not blurry)
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: REAL ? ToneMappingMode.ACES_FILMIC : ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={((getInputProps() as { post?: { msaa?: number } }).post?.msaa) ?? 4}>
      <primitive object={fx.nan} dispose={null} />
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
      {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
      {on.grain ? <primitive object={fx.grain} dispose={null} /> : null}
    </EffectComposer>
  ), [fx, on]);
  // 2026-11-24 render speed: the canvas runs frameloop="demand" and draws exactly once per video frame (the default
  // "always" loop redrew the whole scene ~10x per frame while Remotion seeked and screenshotted: 19 s -> ~2 s per frame).
  // Each new frame holds a delayRender until the composer's draw has run (useFrame priority 2 runs after the composer's 1).
  const invalidate = useThree((st) => st.invalidate);
  const hold = useMemo(() => ({ h: -1 as number, key: "" }), []);
  const key = `${id}:${f}`;
  if (hold.key !== key) { if (hold.h >= 0) continueRender(hold.h); hold.h = delayRender(`draw ${key}`, { timeoutInMilliseconds: 600000 }); hold.key = key; }
  useEffect(() => { invalidate(); }, [key, invalidate]);
  useFrame(() => { if (hold.h >= 0) { const h = hold.h; hold.h = -1; continueRender(h); } }, 2);
  useEffect(() => () => { if (hold.h >= 0) { continueRender(hold.h); hold.h = -1; } }, [hold]);
  const cam = camera as THREE.PerspectiveCamera;
  const tU0 = performance.now();
  target.copy(world.update(id, f, cam, scene));
  { const ov = (getInputProps() as { camOv?: { pos: number[]; look: number[]; fov?: number } }).camOv; if (ov) { const ox = world.root.children.length >= 0 ? 0 : 0; cam.position.set(ov.pos[0] + ox, ov.pos[1], ov.pos[2]); cam.up.set(0, 1, 0); if (ov.fov) { cam.fov = ov.fov; cam.updateProjectionMatrix(); } cam.lookAt(ov.look[0], ov.look[1], ov.look[2]); target.set(ov.look[0], ov.look[1], ov.look[2]); } }   // debug stills only
  { gl.localClippingEnabled = true; const ew = world.envWant; const env = ew ? phEnv(ew.hdri, gl) : null; scene.environment = env; (scene as unknown as { environmentIntensity: number }).environmentIntensity = ew?.i ?? 1; }
  { const dbh = (getInputProps() as { dbg?: { hide?: string[] } }).dbg?.hide; if (dbh) scene.traverse((o) => { if (dbh.some((h) => o.name.startsWith(h))) o.visible = false; }); }
  { const dbg = (getInputProps() as { dbg?: { noSpot?: boolean; noEnv?: boolean; noPoint?: boolean } }).dbg; if (dbg) { scene.traverse((o) => { const l = o as THREE.Light; if (dbg.noSpot && (l as THREE.SpotLight).isSpotLight) l.visible = false; if (dbg.noPoint && (l as THREE.PointLight).isPointLight) l.visible = false; }); if (dbg.noEnv) scene.environment = null; } }
  if ((getInputProps() as { tprof?: boolean }).tprof && !(gl as unknown as { _tw?: boolean })._tw) {
    (gl as unknown as { _tw?: boolean })._tw = true; const r0 = gl.render.bind(gl); const ctx = gl.getContext();
    let acc: string[] = [];
    const px = new Uint8Array(4); const sync = () => ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
    gl.render = (sc: THREE.Object3D, ca: THREE.Camera) => { sync(); const t = performance.now(); r0(sc, ca); sync(); const dt = performance.now() - t; acc.push(`${(sc as THREE.Scene).isScene && sc === scene ? (gl.getRenderTarget() && (gl.getRenderTarget() as THREE.WebGLRenderTarget).width < 1100 && sc === scene && ca !== camera ? "shadow?" : "scene") : "fs"}:${dt.toFixed(0)}`); if (acc.length > 12) { console.log("T|passes " + acc.join(" ")); acc = []; } };
    setInterval(() => { if (acc.length) { console.log("T|passes " + acc.join(" ")); acc = []; } }, 3000);
  }
  const tU1 = performance.now();
  noInkFallback(world.root);
  if ((getInputProps() as { tprof?: boolean }).tprof) console.log(`T|f${f} update ${(tU1 - tU0).toFixed(0)}ms inkfb ${(performance.now() - tU1).toFixed(0)}ms`);
  if ((getInputProps() as { tprof?: boolean }).tprof) { let nl = 0, nz = 0, ns = 0, nm = 0; scene.traverseVisible((o) => { const l = o as THREE.Light; if (l.isLight) { nl++; if (l.intensity <= 0.0001) nz++; if ((l as THREE.SpotLight).castShadow) ns++; } if ((o as THREE.Mesh).isMesh) nm++; }); console.log(`L|f${f} lights ${nl} zero ${nz} shadow ${ns} meshes ${nm} calls ${gl.info.render.calls} tris ${gl.info.render.triangles}`); }
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  // no blurred face anywhere (gate check 10): cap the blur so every head in frame stays under a 2.5 px circle of confusion
  let cap = d.cInf;
  for (const h of world.heads) {
    const dep = h.clone().sub(cam.position).dot(fwd); if (dep < 0.2) continue;
    const q = h.clone().project(cam); if (Math.abs(q.x) > 1.15 || Math.abs(q.y) > 1.15) continue;
    const k = Math.abs(1 - fx.lens.focus / dep) * (dep < fx.lens.focus ? 1.2 : 1); if (k > 1e-3) cap = Math.min(cap, 2.5 / k);
  }
  fx.lens.cInf = cap;
  gradeFor(fx.grade, LIGHTS[STORY_BY_ID(id).light].grade);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => { const vc = useVideoConfig(); return (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas frameloop="demand" width={vc.width} height={vc.height} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows={((getInputProps() as { post?: { shadowType?: "basic" | "percentage" | "soft" } }).post?.shadowType) ?? true} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
); };

export const BridgeShort: React.FC = () => {
  const f = storyF(useCurrentFrame() / WARP);
  const kit = useKit();
  if (!kit) return null;
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [0.5, 0.36, 0.22, 0.1][Math.floor(f - FLASH_AT)] : 0;
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} />)}
      {flash > 0 && <AbsoluteFill style={{ background: "#fff1c4", opacity: flash }} />}
      {dipAt(f) && <AbsoluteFill style={{ background: dipAt(f)!.col, opacity: dipAt(f)!.k }} />}
      {!PREVIEW && !(getInputProps() as { noCaps?: boolean }).noCaps && <Captions />}
    </AbsoluteFill>
  );
};
