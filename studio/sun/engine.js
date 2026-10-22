/* The Long Way Out — a small WebGL2 engine. Every frame is a pure function of t.
   Ray-traced spheres (Sun with cutaway, Earth), impostor spheres, ribbons,
   extruded type (stacked slices), HDR bloom, grain. No libraries. */
'use strict';
const W = 1920, H = 1080, FPS = 60;

/* ---------- math ---------- */
const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
const M = {
  ident: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  mul(a, b) { // column-major a*b
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s;
    }
    return o;
  },
  persp(fovy, asp, n, f) {
    const t = 1 / Math.tan(fovy / 2), nf = 1 / (n - f);
    return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0];
  },
  lookAt(e, c, up) {
    const z = V.norm(V.sub(e, c)), x = V.norm(V.cross(up, z)), y = V.cross(z, x);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -V.dot(x, e), -V.dot(y, e), -V.dot(z, e), 1];
  },
  inv(m) {
    const inv = new Array(16);
    inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
    inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
    inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
    inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
    inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
    inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
    inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
    inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
    inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
    inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
    inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
    inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
    inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
    inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
    inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
    inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
    let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
    det = 1 / det; for (let i = 0; i < 16; i++) inv[i] *= det;
    return inv;
  },
  trs(p, ry = 0, rx = 0, s = 1, rz = 0) { // translate * rotY * rotX * rotZ * scale
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx), cz = Math.cos(rz), sz = Math.sin(rz);
    const Ry = [cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1];
    const Rx = [1, 0, 0, 0, 0, cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1];
    const Rz = [cz, sz, 0, 0, -sz, cz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    let m = M.mul(Ry, M.mul(Rx, Rz));
    for (let i = 0; i < 12; i++) m[i] *= s;
    m[12] = p[0]; m[13] = p[1]; m[14] = p[2];
    return m;
  },
  xf(m, p) { // transform point (w=1)
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    const z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    return [x, y, z, w];
  },
};

/* ---------- motion primitives (same family as the first reel) ---------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const E = {
  linear: t => t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outQuint: t => 1 - Math.pow(1 - t, 5),
  inOutQuint: t => t < .5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2,
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  inOutExpo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};
// tween in seconds: I(t, a, b, o0, o1, ease), clamped
function I(t, a, b, o0 = 0, o1 = 1, ease = E.linear) { const u = clamp((t - a) / (b - a)); return lerp(o0, o1, ease(u)); }
// closed-form damped spring, s seconds after start
function spring(s, k = 170, c = 26, m = 1) {
  if (s <= 0) return 0;
  const w0 = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
  if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w0 * s) * (Math.cos(wd * s) + (z * w0 / wd) * Math.sin(wd * s)); }
  return 1 - Math.exp(-w0 * s) * (1 + w0 * s);
}
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// keyframes: [[t, value(s)], ...] with per-segment ease
function keys(t, ks, ease = E.inOutCubic) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, a] = ks[i], [t1, b, e] = ks[i + 1];
    if (t <= t1) {
      const u = (e || ease)((t - t0) / (t1 - t0));
      return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], u)) : lerp(a, b, u);
    }
  }
  return ks[ks.length - 1][1];
}

/* ---------- GL setup ---------- */
const cv = document.getElementById('gl');
const gl = cv.getContext('webgl2', {antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: false});
gl.getExtension('EXT_color_buffer_float');
gl.getExtension('OES_texture_float_linear');

function compile(vs, fs, name) {
  const mk = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(name + ': ' + gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(name + ' link: ' + gl.getProgramInfoLog(p));
  const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name.replace('[0]', '')] = gl.getUniformLocation(p, info.name); }
  return {p, u};
}
// set uniforms by JS type: number→1f, [2]/[3]/[4]→vecN, [16]→mat4, {tex,unit}→sampler, {i}→int
function use(prog, uni) {
  gl.useProgram(prog.p);
  for (const k in uni) {
    const loc = prog.u[k]; if (loc == null) continue;
    const v = uni[k];
    if (typeof v === 'number') gl.uniform1f(loc, v);
    else if (v.tex) { gl.activeTexture(gl.TEXTURE0 + v.unit); gl.bindTexture(gl.TEXTURE_2D, v.tex); gl.uniform1i(loc, v.unit); }
    else if (v.i !== undefined) gl.uniform1i(loc, v.i);
    else if (v.length === 16) gl.uniformMatrix4fv(loc, false, v);
    else if (v.length === 2) gl.uniform2fv(loc, v);
    else if (v.length === 3) gl.uniform3fv(loc, v);
    else if (v.length === 4) gl.uniform4fv(loc, v);
    else gl.uniform1fv(loc, v);
  }
}
function tex(w, h, fmt = 'f16', filter = gl.LINEAR) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  if (fmt === 'f16') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
function fbo(w, h, depth = false) {
  const t = tex(w, h), f = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, f);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  if (depth) {
    const d = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, d);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, d);
  }
  return {f, t, w, h};
}
function bindFB(fb) { gl.bindFramebuffer(gl.FRAMEBUFFER, fb ? fb.f : null); gl.viewport(0, 0, fb ? fb.w : W, fb ? fb.h : H); }

// geometry
const quadVAO = (() => {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null); return vao;
})();
function drawQuad() { gl.bindVertexArray(quadVAO); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }

// instanced quads: per-instance vec4 a + vec4 b
const inst = (() => {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ib);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16); gl.vertexAttribDivisor(2, 1);
  gl.bindVertexArray(null);
  return {vao, ib};
})();
function drawInstances(data, n) {
  if (!n) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, inst.ib); gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * 8), gl.DYNAMIC_DRAW);
  gl.bindVertexArray(inst.vao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
}

// ribbons: per vertex pos(3) prev(3) next(3) side(1) u(1) = 11 floats
const rib = (() => {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  const S = 44;
  [[0, 3, 0], [1, 3, 12], [2, 3, 24], [3, 1, 36], [4, 1, 40]].forEach(([l, n, o]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, S, o); });
  gl.bindVertexArray(null);
  return {vao, b};
})();
function ribbonData(pts, us) { // pts: array of [x,y,z]; us: per point parameter
  const n = pts.length, d = new Float32Array(n * 2 * 11);
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    for (let s = 0; s < 2; s++) {
      const o = (i * 2 + s) * 11;
      d.set(p, o); d.set(a, o + 3); d.set(b, o + 6); d[o + 9] = s ? 1 : -1; d[o + 10] = us ? us[i] : i;
    }
  }
  return d;
}
function drawRibbon(data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, rib.b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.bindVertexArray(rib.vao); gl.drawArrays(gl.TRIANGLE_STRIP, 0, data.length / 11);
}

/* ---------- type textures (for extruded 3D type) ---------- */
const typeCache = {};
function typeTex(str, size = 300, weight = 900, fam = '"Inter Display", "Inter", sans-serif', track = -0.03) {
  const key = str + size + weight + fam;
  if (typeCache[key]) return typeCache[key];
  const c = document.createElement('canvas'), x = c.getContext('2d');
  x.font = `${weight} ${size}px ${fam}`; x.letterSpacing = (track * size) + 'px';
  const w = Math.ceil(x.measureText(str).width + size * 0.3), h = Math.ceil(size * 1.25);
  c.width = w; c.height = h;
  x.font = `${weight} ${size}px ${fam}`; x.letterSpacing = (track * size) + 'px';
  x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.textAlign = 'center';
  x.fillText(str, w / 2, h * 0.53);
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return (typeCache[key] = {t, aspect: w / h});
}

/* ---------- 2D overlay (captions, labels) ---------- */
const ov = document.createElement('canvas'); ov.width = W; ov.height = H;
ov.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none'; document.body.appendChild(ov);
const ox = ov.getContext('2d');
const ovTex = (() => { const t = tex(W, H, 'u8'); return t; })();
function uploadOverlay() {
  gl.bindTexture(gl.TEXTURE_2D, ovTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, ov);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
}
