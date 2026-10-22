/* Draws one frame description F (built by scenes.js) into the canvas. */
'use strict';
const C = {
  ink: '#0A0A12', ink2: '#141424', cream: '#F4EFE6', coral: '#FF5A36', violet: '#7B5CFF',
  lime: '#C6FF3D', cyan: '#3DE0FF', pink: '#FF4FA3',
  // this film's additions
  deep: '#3A0A1C', red: '#A3200E', amber: '#FFB347',
  ocean: '#0E1A48', ocean2: '#1F4C9A', land: '#2E6A45', land2: '#9CC25A',
};
const CV = {}; for (const k in C) { const n = parseInt(C[k].slice(1), 16); CV[k] = [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
const cmul = (c, s) => [c[0] * s, c[1] * s, c[2] * s];
const cmix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const PAL = {cInk: CV.ink, cInk2: CV.ink2, cCream: CV.cream, cCoral: CV.coral, cViolet: CV.violet, cLime: CV.lime, cCyan: CV.cyan,
  cDeep: CV.deep, cRed: CV.red, cAmber: CV.amber, cOcean: CV.ocean, cOcean2: CV.ocean2, cLand: CV.land, cLand2: CV.land2};

const P = {
  bg: compile(GLSL.fsVS, GLSL.bg, 'bg'),
  sun: compile(GLSL.fsVS, GLSL.sun, 'sun'),
  glow: compile(GLSL.fsVS, GLSL.glow, 'glow'),
  earth: compile(GLSL.fsVS, GLSL.earth, 'earth'),
  ball: compile(GLSL.ballVS, GLSL.ballFS, 'ball'),
  spark: compile(GLSL.sparkVS, GLSL.sparkFS, 'spark'),
  streak: compile(GLSL.streakVS, GLSL.streakFS, 'streak'),
  rib: compile(GLSL.ribVS, GLSL.ribFS, 'rib'),
  type: compile(GLSL.typeVS, GLSL.typeFS, 'type'),
  bright: compile(GLSL.fsVS, GLSL.bright, 'bright'),
  down: compile(GLSL.fsVS, GLSL.down, 'down'),
  up: compile(GLSL.fsVS, GLSL.up, 'up'),
  comp: compile(GLSL.fsVS, GLSL.comp, 'comp'),
};
const FB = {
  scene: fbo(W, H, true),
  bg: fbo(960, 540),
  d: [fbo(960, 540), fbo(480, 270), fbo(240, 135), fbo(120, 68), fbo(60, 34)],
  u: [fbo(960, 540), fbo(480, 270), fbo(240, 135), fbo(120, 68)],
};
const SLICES = new Float32Array(64 * 8);

function camera(cam) {
  const Vm = M.lookAt(cam.eye, cam.tgt, cam.up || [0, 1, 0]);
  const Pm = M.persp(cam.fov * Math.PI / 180, W / H, cam.near || .01, cam.far || 200);
  const VP = M.mul(Pm, Vm);
  return {V: Vm, P: Pm, VP, inv: M.inv(VP), invV: M.inv(Vm), eye: cam.eye};
}
function project(K, p) {
  const c = M.xf(K.VP, p);
  if (c[3] <= 0) return null;
  return [(c[0] / c[3] * .5 + .5) * W, (1 - (c[1] / c[3] * .5 + .5)) * H, c[3]];
}
// screen rectangle covering a sphere, for scissoring the ray-traced passes
function sphereScissor(K, c, r, fovDeg) {
  const d = V.len(V.sub(c, K.eye));
  if (d < r * 1.08) return null;
  const s = project(K, c); if (!s) return null;
  const ang = Math.asin(Math.min(.999, r / d));
  const rad = Math.tan(ang) / Math.tan(fovDeg * Math.PI / 360) * H * .5 * 1.25 / Math.max(.3, Math.cos(ang));
  const x0 = Math.floor(s[0] - rad), x1 = Math.ceil(s[0] + rad), y0 = Math.floor(H - s[1] - rad), y1 = Math.ceil(H - s[1] + rad);
  const w = Math.min(W, x1) - Math.max(0, x0), h = Math.min(H, y1) - Math.max(0, y0);
  if (w <= 0 || h <= 0) return 'off';
  return [Math.max(0, x0), Math.max(0, y0), w, h];
}

let PROF = null, PT = 0;
function mark(name, fl = true) {
  if (!PROF) return;
  gl.finish();
  if (fl) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, new Float32Array(4)); else gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  const n = performance.now(); PROF[name] = (PROF[name] || 0) + n - PT; PT = n;
}
function drawFrame(F, t) {
  if (PROF) { mark('pre'); PT = performance.now(); }
  const K = camera(F.cam);
  F.K = K;
  const cam = {uVP: K.VP, uInvVP: K.inv, uEye: K.eye};
  // background and glows at half resolution, then stretched into the scene buffer
  bindFB(FB.bg);
  gl.disable(gl.BLEND); gl.disable(gl.SCISSOR_TEST); gl.disable(gl.DEPTH_TEST);
  const b = F.bg;
  use(P.bg, {...PAL, ...cam, uT: t, uSpace: b.space || 0, uPlasma: b.plasma || 0, uInk: b.ink || 0, uDots: b.dots || 0, uBeat: F.beat || 0, uPOff: b.pOff || [0, 0, 0]});
  drawQuad();
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  for (const g of F.glows) {
    use(P.glow, {...cam, uC: g.c, uR: g.r, uCol: g.col, uK: g.k, uFall: g.fall, uT: t, uWisp: g.wisp || 0});
    drawQuad();
  }
  mark('bg');
  gl.disable(gl.BLEND);
  bindFB(FB.scene);
  gl.depthMask(true); gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, FB.bg.f); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, FB.scene.f);
  gl.blitFramebuffer(0, 0, 960, 540, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.LINEAR);
  gl.bindFramebuffer(gl.FRAMEBUFFER, FB.scene.f);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  mark('blit');
  const S = F.sun;
  const scS = S && S.alpha > 0 ? sphereScissor(K, S.c, S.r, F.cam.fov) : 'off';
  if (scS !== 'off') {
    const sc = scS;
    if (sc) { gl.enable(gl.SCISSOR_TEST); gl.scissor(...sc); }
    use(P.sun, {...PAL, ...cam, uT: t, uR: S.r, uC: S.c, uRot: S.rot, uOpen: S.open || 0, uGran: S.gran || 30, uHalf: S.half || 0,
      uHeat: S.heat == null ? 1 : S.heat, uAlpha: S.alpha, uFace: S.face == null ? 1 : S.face, uFog: S.fog || 0, uScrib: S.scrib || 0, uLane: S.lane == null ? .75 : S.lane, uLimb: S.limb == null ? 1 : S.limb, uHi: S.hi || [0, 0, 0, 0]});
    drawQuad();
    gl.disable(gl.SCISSOR_TEST);
  }
  mark('sun');
  const Ea = F.earth;
  const scE = Ea ? sphereScissor(K, Ea.c, Ea.r, F.cam.fov) : 'off';
  if (scE !== 'off') {
    const sc = scE;
    if (sc) { gl.enable(gl.SCISSOR_TEST); gl.scissor(...sc); }
    use(P.earth, {...PAL, ...cam, uT: t, uR: Ea.r, uC: Ea.c, uL: Ea.L, uRot: Ea.rot, uHit: Ea.hit || 0, uHitN: Ea.hitN || [0, 1, 0]});
    drawQuad();
    gl.disable(gl.SCISSOR_TEST);
  }
  mark('earth');
  gl.disable(gl.BLEND);
  if (F.nb) {
    const fog = F.ballFog || {k: 0, col: [0, 0, 0]};
    use(P.ball, {uV: K.V, uP: K.P, uL: V.norm(F.ballL || [.4, .7, .6]), uFog: fog.k, uFogCol: fog.col, uAmb: F.ballAmb == null ? .28 : F.ballAmb});
    drawInstances(F.balls, F.nb);
  }
  // extruded type
  if (F.types.length) {
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    for (const ty of F.types) {
      const N = ty.slices || 40;
      for (let k = 0; k <= N; k++) SLICES[k * 8] = N - k; // back to front
      for (const L of ty.letters) {
        if (L.alpha <= 0) continue;
        use(P.type, {uMVP: M.mul(K.VP, L.M), uSize: [L.aspect * .625, .625], uDepth: ty.depth, uN: N, uTex: {tex: L.tex, unit: 0},
          uFace: ty.face, uFace2: ty.face2 || ty.face, uSide: ty.side, uGlow: L.glow || 0, uAlpha: L.alpha});
        drawInstances(SLICES, N + 1);
      }
    }
    gl.disable(gl.BLEND);
  }
  mark('balls+type');
  // additive light: ribbons, sparks, streaks
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
  for (const R of F.ribbons) {
    if (R.noDepth) gl.disable(gl.DEPTH_TEST);
    use(P.rib, {uVP: K.VP, uW: R.w, uHead: R.head, uTaper: R.taper || 0, uFade: R.fade || 0, uK: R.k == null ? 1 : R.k, uCol: R.col, uCol2: R.col2 || R.col});
    drawRibbon(R.data);
    gl.enable(gl.DEPTH_TEST);
  }
  if (F.ns) { use(P.spark, {uV: K.V, uP: K.P}); drawInstances(F.sparks, F.ns); }
  if (F.nst) {
    if (F.streakNoDepth) gl.disable(gl.DEPTH_TEST);
    use(P.streak, {uVP: K.VP, uW: F.streakW || 1.6, uCol: F.streakCol || CV.cyan, uCol2: F.streakCol2 || F.streakCol || CV.cyan});
    drawInstances(F.streaks, F.nst);
    gl.enable(gl.DEPTH_TEST);
  }
  gl.depthMask(true); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);

  mark('additive');
  // bloom
  const po = F.post;
  bindFB(FB.d[0]); use(P.bright, {uS: {tex: FB.scene.t, unit: 0}, uThr: po.thr}); drawQuad();
  for (let i = 1; i < FB.d.length; i++) { bindFB(FB.d[i]); use(P.down, {uS: {tex: FB.d[i - 1].t, unit: 0}, uPx: [1 / FB.d[i - 1].w, 1 / FB.d[i - 1].h]}); drawQuad(); }
  let src = FB.d[FB.d.length - 1];
  for (let i = FB.u.length - 1; i >= 0; i--) {
    bindFB(FB.u[i]); use(P.up, {uS: {tex: src.t, unit: 0}, uB: {tex: FB.d[i].t, unit: 1}, uPx: [1 / src.w, 1 / src.h]}); drawQuad();
    src = FB.u[i];
  }
  mark('bloom');
  bindFB(null);
  use(P.comp, {uS: {tex: FB.scene.t, unit: 0}, uBl: {tex: FB.u[0].t, unit: 1}, uOv: {tex: ovTex, unit: 2},
    uBloom: po.bloom, uExp: po.exp, uFlash: po.flash, uFlashCol: po.flashCol, uVig: po.vig, uCA: po.ca, uGrain: po.grain,
    uSeed: Math.floor(t * 30) % 97, cInk: CV.ink});
  drawQuad();
  mark('comp', false);
}
