#!/usr/bin/env python3
"""Re-apply Joe's character redesign (chat "FINAL RICKS CLIPS VIDEO MAKER", 2026-11-11) to a base fig.ts / toon.ts.
Every edit is copied from that chat in the same order; each asserts its old text occurs exactly n times.
usage: python3 apply_redesign.py <dir with fig.ts and toon.ts>"""
import sys, os
D = sys.argv[1]

def edit(name, steps):
    p = os.path.join(D, name); s = open(p).read()
    for old, new, *n in steps:
        n = n[0] if n else 1
        c = s.count(old)
        assert c == n, (name, c, old[:120])
        s = s.replace(old, new)
    open(p, 'w').write(s)

# ---------------- toon.ts: eyes, mouths ----------------
edit('toon.ts', [
 ('case "dot": p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0); break;', 'case "dot": p.ell(lx, ey, 4.4 * u, 6.2 * u, INK, 0); break;'),
 ('case "small": p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0); break;', 'case "small": p.ell(lx, ey, 3.4 * u, 5 * u, INK, 0); break;'),
 ('case "lid": p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw); break;',
  'case "lid": p.ell(x + look * 1.5 * u, ey - 1.5 * u, 7.6 * u, 8.2 * u, INK, 0, 0, 180); p.stroke([[x - 8.4 * u, ey - 1.5 * u], [x + 8.4 * u, ey - 1.5 * u]], 4.6 * u); break;'),
 ('case "slit": p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw); break;',
  'case "slit": p.ell(x + look * 1.5 * u, ey, 7.6 * u, 4.6 * u, INK, 0, 0, 180); p.stroke([[x - 8.4 * u, ey], [x + 8.4 * u, ey]], 4.6 * u); break;'),
 ('export const mouth = (p: Pen, kind: MouthK, mx: number, my: number, u: number, k = 1) => {\n  const mw = 4 * u;',
  '''/** a brush stroke along an elliptical arc: w thick in the middle, tapering to points (Rick's smirks, smiles, frowns) */
export const brushArc = (p: Pen, cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w: number, col = INK, skew = 0) => {
  const N = 18, out: P2[] = [], inn: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = rad(a0 + (a1 - a0) * t), h = 0.5 * w * Math.pow(Math.sin(Math.PI * t), 0.7) * (1 + skew * (t - 0.5)) + 0.12 * w;
    const c = Math.cos(a), sn = Math.sin(a), nx = c / rx, ny = sn / ry, nl = Math.hypot(nx, ny) || 1;
    const px = cx + rx * c, py = cy + ry * sn; out.push([px + (nx / nl) * h, py + (ny / nl) * h]); inn.push([px - (nx / nl) * h, py - (ny / nl) * h]);
  }
  p.poly([...out, ...inn.reverse()], col, 0);
};
export const mouth = (p: Pen, kind: MouthK, mx: number, my: number, u: number, k = 1) => {
  const mw = 4 * u;'''),
 ('case "dash": p.stroke([[mx - 5.5 * u * k, my], [mx + 5.5 * u * k, my - 0.8 * u]], mw); break;',
  'case "dash": brushArc(p, mx, my - 30 * u, 32 * u * k, 30 * u, 78, 102, 3.8 * u); break;'),
 ('case "frown": p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw); break;',
  'case "frown": brushArc(p, mx, my + 4 * u, 7.5 * u * k, 4.5 * u, 200, 340, 4.4 * u); break;'),
 ('case "smirk": p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw); break;',
  'case "smirk": brushArc(p, mx + 1.5 * u, my - 4 * u, 7.5 * u * k, 4.6 * u, 15, 150, 4.6 * u, INK, 0.5); break;   // one-sided: fuller at the raised corner'),
 ('case "smile": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); break;',
  'case "smile": brushArc(p, mx, my - 4 * u, 8.5 * u * k, 5 * u, 20, 160, 4.6 * u); break;'),
 ('case "smileWide": p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw); break;',
  'case "smileWide": brushArc(p, mx, my - 5 * u, 11.5 * u * k, 6.5 * u, 15, 165, 5 * u); break;'),
])

# ---------------- fig.ts pass 1: proportions, feet, arms, eye gap, brows ----------------
edit('fig.ts', [
 ('const BUILDS = { adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 }, stout: { a: 120, torso: 1.15, legs: 1.3, tw: 0.94 },\n  kid: { a: 112, torso: 0.85, legs: 1.0, tw: 0.72 }, tall: { a: 116, torso: 1.15, legs: 1.5, tw: 0.76 },\n  thin: { a: 114, torso: 1.12, legs: 1.45, tw: 0.62 }, lanky: { a: 110, torso: 1.25, legs: 1.62, tw: 0.6 },\n  plump: { a: 120, torso: 1.12, legs: 1.2, tw: 1.06 } };',
  '''// v13 (Rick measured, board AT / AL / J full bodies): legs ~1.18 head heights, torso ~1.05 head heights and ~0.82 head widths
const BUILDS = { adult: { a: 118, torso: 1.05, legs: 1.18, tw: 0.82 }, stout: { a: 120, torso: 1.1, legs: 1.1, tw: 0.94 },
  kid: { a: 112, torso: 0.82, legs: 0.85, tw: 0.74 }, tall: { a: 116, torso: 1.12, legs: 1.28, tw: 0.78 },
  thin: { a: 114, torso: 1.08, legs: 1.24, tw: 0.66 }, lanky: { a: 110, torso: 1.2, legs: 1.38, tw: 0.62 },
  plump: { a: 120, torso: 1.08, legs: 1.02, tw: 1.06 } };'''),
 ('let k: P2, f: P2; const hx = 300 + side * 15 * u; let toe: P2 | null = null;', 'let k: P2, f: P2; const hx = 300 + side * 10 * u; let toe: P2 | null = null;'),
 ('} else { f = [300 + side * 22 * u, sole - 4 * u]; k = [(hx + f[0]) / 2 + side * 1.5 * u, (hipY + f[1]) / 2]; }',
  '} else { f = [300 + side * 13 * u, sole - 4 * u]; k = [(hx + f[0]) / 2 + side * 1.2 * u, (hipY + f[1]) / 2]; }'),
 ('f = [300 + side * 22 * u + Math.sin(two * (phase + (side > 0 ? 0.5 : 0))) * 8 * u * fs, sole - 4 * u - up];',
  'f = [300 + side * 13 * u + Math.sin(two * (phase + (side > 0 ? 0.5 : 0))) * 8 * u * fs, sole - 4 * u - up];'),
 ('const legW = 5.8 * u, footW = 7.5 * u;', 'const legW = 5.6 * u, footW = 6.8 * u;'),
 ('if (toe) footStroke(p, [f[0] - toe[0] * 3 * u, f[1] - toe[1] * 3 * u], [f[0] + toe[0] * 13 * u, f[1] + toe[1] * 13 * u], footW, footCol);\n    else footStroke(p, [f[0] - dir * 3 * u, f[1]], [f[0] + dir * 13 * u, f[1] + 0.5 * u], footW, footCol);',
  'if (toe) footStroke(p, [f[0] - toe[0] * 2 * u, f[1] - toe[1] * 2 * u], [f[0] + toe[0] * 9 * u, f[1] + toe[1] * 9 * u], footW, footCol);\n    else footStroke(p, [f[0] - dir * 2 * u, f[1]], [f[0] + dir * (fs ? 9 : 6.5) * u, f[1] + 0.5 * u], footW, footCol);'),
 ('return [[side * (0.27 * T.a / u + 4), 0.48 * HH / u], [side * (0.27 * T.a / u + 7) - side * 6 * sw, 1.02 * HH / u - Math.abs(sw) * 9]];',
  'return [[side * (0.27 * T.a / u + 5), 0.38 * HH / u], [side * (0.27 * T.a / u + 6) - side * 6 * sw, 0.74 * HH / u - Math.abs(sw) * 7]];'),
 ('else p.dot(a[2][0], a[2][1], 5.5 * u);', 'else p.dot(a[2][0], a[2][1], 4.8 * u);'),
 ('const ex = (F.eye[0] === "shock" || F.eye[0] === "huge" ? 12 : 13) * u, ey = cy;', 'const ex = (F.eye[0] === "shock" || F.eye[0] === "huge" ? 13 : 14) * u, ey = cy;', 2),
 ('const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;', 'const [dI, dO] = F.brow, by = ey - 15 * u; void brim;'),
 ('else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);',
  'else taper(p, [x - side * 8 * u, by + dI * u], [x + side * 9 * u, by + dO * u], 5.4 * u, 2.6 * u);'),
])

# ---------------- fig.ts pass 2: the flat cap, hair under the cap ----------------
edit('fig.ts', [
 ('  } else if (k === "beanie" || k === "flatcap" || k === "stripecap") {',
  '''  } else if (k === "flatcap" || k === "stripecap") {
    // v13 (Rick's newsboy / railroad caps, boards AO + AT): the cap sits HIGH - its band is ~20 % down the head so both brows
    // show under it - and the soft crown puffs up above the skull and overhangs toward the facing side. Panel seams run from
    // a top button, a darker band wraps the bottom edge, and a dark crescent peak hangs under the band toward the face.
    const d = fs || 0, cut = crown + 0.2 * HH, cutL = hc - lift * HH;
    const raw = blobPts(cx, cutL, { ...H, a: H.a * 1.06, b: H.b * 1.05, seed: seed + 2 }).filter(([, y]) => y < cut);
    raw.sort((p1, p2) => Math.atan2(p1[1] - cutL, p1[0] - cx) - Math.atan2(p2[1] - cutL, p2[0] - cx));
    const top0 = Math.min(...raw.map(([, y]) => y)), span = Math.max(1, cut - top0);
    const dome = raw.map(([x, y]) => { const h = (cut - y) / span; return [x + d * 0.07 * W * h * h, cut - (cut - y) * 1.32] as P2; });
    if (dome.length < 3) return;
    const cap = R(dome), topY = cut - span * 1.32, btn: P2 = [cx + d * 0.08 * W, topY + 0.035 * HH];
    p.shadedFill(cap, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.clip(cap, () => {
      for (const t of [-0.75, -0.38, 0, 0.38, 0.75]) { // panel seams fanning out from the top button
        const end: P2 = [cx + d * 0.05 * W + t * 0.56 * W, cut + 2 * u], mid: P2 = [(btn[0] + end[0]) / 2 + t * 0.12 * W, (btn[1] + end[1]) / 2 - 0.02 * HH];
        if (k === "stripecap") p.band(R(curve(btn, mid, end, 10)), o.band ?? "#e8eef4", 0.055 * W, 0);
        else p.stroke(R(curve(btn, mid, end, 10)), 1.3 * u, shade(col, 0.74));
      }
      p.band(R([[cx - 0.7 * W, cut - 0.03 * HH], [cx + 0.7 * W, cut - 0.03 * HH]]), shade(col, k === "stripecap" ? 0.55 : 0.72), 0.065 * HH, 0);   // the band
      p.stroke(R(curve([cx - 0.42 * W, topY + 0.12 * HH], [cx - 0.12 * W - d * 0.05 * W, topY + 0.03 * HH], [cx + 0.18 * W, topY + 0.05 * HH], 10)), 2.6 * u, "rgba(255,255,255,0.34)");   // highlight streak
    });
    p.stroke(R([[cx - 0.6 * W, cut - 0.062 * HH], [cx + 0.6 * W, cut - 0.062 * HH]]).map(([x, y]) => [x, y] as P2).filter(([x]) => Math.abs(x - cx) < 0.5 * W), 1.4 * u, shade(col, 0.45));
    p.poly(cap, null, ow);
    const [bx, by] = R([btn])[0]; p.ell(bx, by, 0.035 * W, 0.03 * W, shade(col, 0.82), 1.4 * u);
    const [vx, vy] = R([[cx + d * 0.13 * W, cut - 0.5 * u]])[0];   // the peak
    p.ell(vx, vy, 0.34 * W, 0.075 * HH, shade(col, k === "stripecap" ? 0.4 : 0.6), ow, 0, 180, deg);
    p.stroke(R([[cx + d * 0.13 * W - 0.3 * W, cut + 1.5 * u], [cx + d * 0.13 * W + 0.3 * W, cut + 1.5 * u]]), 1.6 * u, "rgba(255,255,255,0.22)");
  } else if (k === "beanie") {'''),
 ('''  if (o.hairStyle === "tufts") { // curls peeking out under a hat brim at both temples
    for (const s of [-1, 1]) {
      const x0 = 300 + s * 0.86 * H.a, y0 = hc - 0.42 * H.b;
      const pts: P2[] = [[x0 - s * 14 * u, y0 - 8 * u], [x0 + s * 6 * u, y0 - 10 * u], [x0 + s * 9 * u, y0], [x0 + s * 4 * u, y0 + 3 * u], [x0 + s * 7 * u, y0 + 11 * u], [x0, y0 + 9 * u], [x0 - s * 6 * u, y0 + 2 * u]];
      p.poly(pts, col, 1.6 * u);
    }
    return;
  }''',
  '''  if (o.hairStyle === "tufts") {
    const y0 = crown + 0.4 * H.b;   // just under the cap band
    for (const s of (fs ? [-fs] : [-1, 1])) {
      const big = fs ? 1.3 : 1, cx0 = 300 + s * 0.9 * H.a, cy0 = y0 + 0.2 * H.b * big;
      const patch = ellPts(cx0, cy0, 0.28 * H.a * big, 0.36 * H.b * big);
      p.clip(hp, () => { p.shadedFill(patch, col, mul(col, SH_FELT), light, H.a, 0.35); p.poly(patch, null, ow * 0.75);
        for (const k of [-0.4, 0, 0.4]) p.stroke([[cx0 - s * 0.14 * H.a * big + k * 3 * u, cy0 - 0.2 * H.b * big], [cx0 - s * 0.1 * H.a * big + k * 4 * u, cy0 + 0.22 * H.b * big]], 1.1 * u, shade(col, 0.72)); });
    }
    p.inkRing(hp, ow, thick);
    return;
  }'''),
 ('if (o.sideburns && !BK) for (const s of [-1, 1]) {', 'if (o.sideburns && !BK && o.hairStyle !== "tufts") for (const s of [-1, 1]) {'),
 # the sed on the beanie branch (line 1207 in the Roulette copy)
 ('if (k !== "flatcap" && o.band)', 'if (o.band)'),
])

# ---------------- fig.ts pass 3: wider, puffier cap; slimmer hair crescents ----------------
edit('fig.ts', [
 ('const dome = raw.map(([x, y]) => { const h = (cut - y) / span; return [x + d * 0.07 * W * h * h, cut - (cut - y) * 1.32] as P2; });',
  '''const hw = Math.max(...raw.map(([x]) => Math.abs(x - cx)));   // the skull's half-width at the band
    const dome = raw.map(([x, y]) => { const h = (cut - y) / span, sx = (0.5 * W * 1.03) / hw;   // band = full head width, crown balloons out
      return [cx + (x - cx) * sx * (1 + 0.1 * Math.sin(Math.PI * Math.min(1, h * 1.4))) + d * 0.08 * W * h * h, cut - (cut - y) * 1.45] as P2; });'''),
 ('const cap = R(dome), topY = cut - span * 1.32,', 'const cap = R(dome), topY = cut - span * 1.45,'),
 ('''      const big = fs ? 1.3 : 1, cx0 = 300 + s * 0.9 * H.a, cy0 = y0 + 0.2 * H.b * big;
      const patch = ellPts(cx0, cy0, 0.28 * H.a * big, 0.36 * H.b * big);''',
  '''      const big = fs ? 1.55 : 1, cx0 = 300 + s * 1.04 * H.a, cy0 = y0 + 0.24 * H.b * big;
      const patch = ellPts(cx0, cy0, 0.24 * H.a * big, 0.36 * H.b * big);'''),
 ('for (const k of [-0.4, 0, 0.4]) p.stroke([[cx0 - s * 0.14 * H.a * big + k * 3 * u, cy0 - 0.2 * H.b * big], [cx0 - s * 0.1 * H.a * big + k * 4 * u, cy0 + 0.22 * H.b * big]], 1.1 * u, shade(col, 0.72)); });',
  'for (const k of [0, 1]) p.stroke([[cx0 - s * (0.16 + 0.06 * k) * H.a * big, cy0 - 0.24 * H.b * big], [cx0 - s * (0.1 + 0.04 * k) * H.a * big, cy0 + 0.2 * H.b * big]], 1.1 * u, shade(col, 0.72)); });'),
])

# ---------------- fig.ts pass 4: cap band fitted to the skull, hair edge found on the head outline ----------------
edit('fig.ts', [
 ('const h = (cut - y) / span, sx = (0.5 * W * 1.03) / hw;   // band = full head width, crown balloons out\n      return [cx + (x - cx) * sx * (1 + 0.1 * Math.sin(Math.PI * Math.min(1, h * 1.4))) + d * 0.08 * W * h * h, cut - (cut - y) * 1.45] as P2; });',
  'const h = (cut - y) / span, sx = 1.05;   // band = the skull width there (+5 %, so it wraps), the soft crown balloons out above it\n      return [cx + (x - cx) * sx * (1 + 0.16 * Math.sin(Math.PI * Math.min(1, h * 1.8))) + d * 0.08 * W * h * h, cut - (cut - y) * 1.6] as P2; });\n    void hw;'),
 ('const cap = R(dome), topY = cut - span * 1.45,', 'const cap = R(dome), topY = cut - span * 1.6,'),
 ('p.band(R([[cx - 0.7 * W, cut - 0.03 * HH], [cx + 0.7 * W, cut - 0.03 * HH]]), shade(col, k === "stripecap" ? 0.55 : 0.72), 0.065 * HH, 0);   // the band',
  'p.band(R([[cx - 0.7 * W, cut - 0.028 * HH], [cx + 0.7 * W, cut - 0.028 * HH]]), shade(col, k === "stripecap" ? 0.55 : 0.72), 0.056 * HH, 0);   // the band'),
 ('p.stroke(R([[cx - 0.6 * W, cut - 0.062 * HH], [cx + 0.6 * W, cut - 0.062 * HH]]).map(([x, y]) => [x, y] as P2).filter(([x]) => Math.abs(x - cx) < 0.5 * W), 1.4 * u, shade(col, 0.45));',
  'p.clip(cap, () => p.stroke(R([[cx - 0.6 * W, cut - 0.056 * HH], [cx + 0.6 * W, cut - 0.056 * HH]]), 1.4 * u, shade(col, 0.45)));'),
 ('p.ell(vx, vy, 0.34 * W, 0.075 * HH, shade(col, k === "stripecap" ? 0.4 : 0.6), ow, 0, 180, deg);',
  'p.ell(vx, vy, 0.3 * W, 0.07 * HH, shade(col, k === "stripecap" ? 0.4 : 0.6), ow, 0, 180, deg);'),
 ('p.stroke(R([[cx + d * 0.13 * W - 0.3 * W, cut + 1.5 * u], [cx + d * 0.13 * W + 0.3 * W, cut + 1.5 * u]]), 1.6 * u, "rgba(255,255,255,0.22)");',
  'p.stroke(R([[cx + d * 0.13 * W - 0.24 * W, cut + 1.5 * u], [cx + d * 0.13 * W + 0.24 * W, cut + 1.5 * u]]), 1.6 * u, "rgba(255,255,255,0.22)");'),
 ('const big = fs ? 1.55 : 1, cx0 = 300 + s * 1.04 * H.a, cy0 = y0 + 0.24 * H.b * big;\n      const patch = ellPts(cx0, cy0, 0.24 * H.a * big, 0.36 * H.b * big);',
  'const edge = Math.max(...hp.filter(([x, y]) => Math.sign(x - 300) === s && Math.abs(y - (y0 + 0.25 * H.b)) < 0.12 * H.b).map(([x]) => Math.abs(x - 300)), 0.9 * H.a);\n      const big = fs ? 1.55 : 1, cx0 = 300 + s * (edge + 0.02 * H.a), cy0 = y0 + 0.24 * H.b * big;\n      const patch = ellPts(cx0, cy0, 0.24 * H.a * big, 0.36 * H.b * big);'),
])

# ---------------- fig.ts pass 5: back of the head ----------------
p = os.path.join(D, 'fig.ts'); s = open(p).read()
i = s.index("  if (BK) { // back of the head"); j = s.index("  } else face(p, 300, hc, W, expr", i)
s = s[:i] + '''  if (BK) { // back of the head: short hair from under the cap band (or the crown) down to a rounded hairline above the nape
    const hcol = o.hair ?? "#e6ddd2", capped = !!o.hat && CAPS.has(o.hat) && !opts.noHat, top = capped ? hc - H.b + 0.36 * H.b : hc - 0.1 * H.b, line = hc + 0.5 * H.b;
    const back: P2[] = [[300 - 1.2 * H.a, top], [300 + 1.2 * H.a, top]];
    for (let i = 0; i <= 16; i++) { const t = 1 - i / 8; back.push([300 + t * 1.2 * H.a, line + 0.18 * H.b * (1 - t * t) - 0.1 * H.b]); }
    p.clip(hp, () => { p.shadedFill(back, hcol, mul(hcol, SH_FELT), light, H.a, 0.35); p.poly(back, null, ow * 0.6);
      for (const x of [-0.5, -0.17, 0.17, 0.5]) p.stroke([[300 + x * H.a, top + 0.1 * H.b], [300 + x * 1.06 * H.a, line - 0.05 * H.b]], 1.2 * u, shade(hcol, 0.74)); });
    p.inkRing(hp, ow, thick);
''' + s[j:]
open(p, 'w').write(s)

# ---------------- fig.ts pass 6: fuller cap, lower back hairline ----------------
edit('fig.ts', [
 ('const h = (cut - y) / span, sx = 1.05;', 'const h = (cut - y) / span, sx = 1.1;'),
 ('return [cx + (x - cx) * sx * (1 + 0.16 * Math.sin(Math.PI * Math.min(1, h * 1.8))) + d * 0.08 * W * h * h, cut - (cut - y) * 1.6] as P2; });',
  'return [cx + (x - cx) * sx * (1 + 0.2 * Math.sin(Math.PI * Math.min(1, h * 1.8))) + d * 0.08 * W * h * h, cut - (cut - y) * 1.75] as P2; });'),
 ('const cap = R(dome), topY = cut - span * 1.6,', 'const cap = R(dome), topY = cut - span * 1.75,'),
 ('p.ell(vx, vy, 0.3 * W, 0.07 * HH,', 'p.ell(vx, vy, 0.36 * W, 0.075 * HH,'),
 ('line = hc + 0.5 * H.b;', 'line = hc + 0.7 * H.b;'),
])
print('redesign applied to', D)
