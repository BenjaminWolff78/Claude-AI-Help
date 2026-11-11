#!/usr/bin/env python3
"""v13 open issues on Joe's sheet (boards AV / AV2), applied after apply_redesign.py:
 1. back view: the white strip under the hairline read as a grin -> hair down to the jaw, a narrow neck patch with an arched top
 2. walk: the lifted leg's knee bent backwards -> knees bend toward the facing side (outward only when front-on)
 3. 3/4 face turned too little -> features slide ~2x further and the eye gap narrows, so both eyes sit in the near half
usage: python3 fix_open_issues.py <dir with fig.ts>"""
import sys, os
p = os.path.join(sys.argv[1], 'fig.ts'); s = open(p).read()
def rep(old, new, n=1):
    global s
    c = s.count(old); assert c == n, (c, old[:110]); s = s.replace(old, new)

# ---- 3. the 3/4 turn ----
rep('const face = (p: Pen, cx: number, cy0: number, W: number, expr: Face,',
    '''/** v13 3/4 turn (board AO: in Rick's 3/4 deadpan both eyes sit in the near half of the face). Per unit of `facing`
 *  the eyes slide TURN.eye % of the head width toward the facing side, the mouth TURN.mouth %, and the eye gap
 *  narrows by TURN.gap (foreshortening). At facing 0.7: far eye ~+8 % W, near eye ~+31 % W from the head centre.
 *  The slide stops growing past |facing| 0.75 (turnK) so a full side view keeps glasses and brows inside the head. */
export const TURN = { eye: 28, mouth: 24, gap: 0.3 };
export const turnK = (facing: number) => clamp(facing, -0.75, 0.75);
const face = (p: Pen, cx: number, cy0: number, W: number, expr: Face,''')
rep('const u = W / 100, F0 = faceOf(expr), F = browOv ? { ...F0, brow: browOv } : F0, fx = cx + 15 * u * facing, cy = cy0 - up * u;',
    'const u = W / 100, F0 = faceOf(expr), F = browOv ? { ...F0, brow: browOv } : F0, fx = cx + TURN.eye * u * turnK(facing), cy = cy0 - up * u;')
rep('''  const ex = (F.eye[0] === "shock" || F.eye[0] === "huge" ? 13 : 14) * u, ey = cy;
  const capped = !!o.hat && CAPS.has(o.hat);''',
    '''  const ex = (F.eye[0] === "shock" || F.eye[0] === "huge" ? 13 : 14) * u, ey = cy, exN = ex * (1 - TURN.gap * Math.abs(facing));
  const capped = !!o.hat && CAPS.has(o.hat);''')
rep('const x = fx + side * ex * (1 - 0.1 * Math.abs(facing));   // v10.16 A1: a 3/4 turn narrows the eye gap',
    'const x = fx + side * exN;   // v13: a 3/4 turn slides the eyes to the near half and narrows the gap')
rep('p.stroke([[fx - ex + gw * u, ey - (o.bigGlasses ? 2 : 0) * u], [fx + ex - gw * u, ey - (o.bigGlasses ? 2 : 0) * u]]',
    'p.stroke([[fx - exN + gw * u, ey - (o.bigGlasses ? 2 : 0) * u], [fx + exN - gw * u, ey - (o.bigGlasses ? 2 : 0) * u]]')
rep('if (o.catEye) p.stroke([[fx - ex + 10 * u, ey - 3 * u], [fx + ex - 10 * u, ey - 3 * u]], 1.8 * u, o.catEye);',
    'if (o.catEye) p.stroke([[fx - exN + 10 * u, ey - 3 * u], [fx + exN - 10 * u, ey - 3 * u]], 1.8 * u, o.catEye);')
rep('if (o.shades) p.stroke([[fx - ex + 11 * u, ey - 3 * u], [fx + ex - 11 * u, ey - 3 * u]], 1.8 * u);',
    'if (o.shades) p.stroke([[fx - exN + 11 * u, ey - 3 * u], [fx + exN - 11 * u, ey - 3 * u]], 1.8 * u);')
rep('p.ell(fx + side * ex, ey - 32 * u, 10 * u, 8 * u, "#9ad7e8", 2 * u);', 'p.ell(fx + side * exN, ey - 32 * u, 10 * u, 8 * u, "#9ad7e8", 2 * u);')
rep('const mx = cx + 16 * u * facing, my = cy + 20 * u;', 'const mx = cx + TURN.mouth * u * turnK(facing), my = cy + 20 * u;')
rep('p.ell(cx + sd * 24 * u * (1 - 0.1 * Math.abs(facing)) + 14 * u * facing, cy + 10 * u, 7 * u, 3.6 * u, "rgba(240,120,130,0.45)", 0);   // blush',
    'p.ell(cx + sd * 24 * u * (1 - TURN.gap * Math.abs(facing)) + TURN.mouth * u * turnK(facing), cy + 10 * u, 7 * u, 3.6 * u, "rgba(240,120,130,0.45)", 0);   // blush')
rep('const P: P2 = [fx + ex, ey + 12 * u], A: P2 = [fx + ex - 8 * u, cy0 + 58 * u];', 'const P: P2 = [fx + exN, ey + 12 * u], A: P2 = [fx + exN - 8 * u, cy0 + 58 * u];')
# the popped monocle starts from the same eye
rep('''  const u = W / 100, F = faceOf(expr), fx = cx + 15 * u * facing, cy = cy0 - up * u;
  const ex = (F.eye[0] === "shock" || F.eye[0] === "huge" ? 13 : 14) * u, ey = cy;
    const ex0: [number, number] = [fx + ex, ey], A: P2 = [fx + ex - 8 * u, cy0 + 58 * u], D: P2 = [fx + ex - 3 * u, cy0 + 84 * u];''',
    '''  const u = W / 100, F = faceOf(expr), fx = cx + TURN.eye * u * turnK(facing), cy = cy0 - up * u;
  const ex = (F.eye[0] === "shock" || F.eye[0] === "huge" ? 13 : 14) * u * (1 - TURN.gap * Math.abs(facing)), ey = cy;
    const ex0: [number, number] = [fx + ex, ey], A: P2 = [fx + ex - 8 * u, cy0 + 58 * u], D: P2 = [fx + ex - 3 * u, cy0 + 84 * u];''')
# beard and mutton chops ride the turn too
rep('const bp = blobPts(300 + 12 * u * facing, hc + 0.5 * H.b,', 'const bp = blobPts(300 + 0.8 * TURN.mouth * u * turnK(facing), hc + 0.5 * H.b,')
rep('const x0 = 300 + 12 * u * facing;', 'const x0 = 300 + 0.6 * TURN.mouth * u * turnK(facing);')

# ---- 2. walk: knees bend toward the facing side ----
rep('''      k = [(hx + f[0]) / 2 + side * (1.5 * u + up * 0.16), (hipY + f[1]) / 2 - up * 0.08];''',
    '''      // v13 (AV2 fix): the knee bends FORWARD, toward the facing side (a leg never kinks backwards); front-on it bows outward
      const kd = Math.sign(fs) * Math.min(1, Math.abs(fs) * 1.6) + side * Math.max(0, 1 - Math.abs(fs) * 1.6);
      k = [(hx + f[0]) / 2 + kd * (1.5 * u + up * 0.45), (hipY + f[1]) / 2 - up * 0.08];''')

# ---- 1. back of the head: a neck, not a grin ----
rep('''    const back: P2[] = [[300 - 1.2 * H.a, top], [300 + 1.2 * H.a, top]];
    for (let i = 0; i <= 16; i++) { const t = 1 - i / 8; back.push([300 + t * 1.2 * H.a, line + 0.18 * H.b * (1 - t * t) - 0.1 * H.b]); }''',
    '''    // v13: with hair and no flat cap, the back hair starts at the crown (any hat is drawn over it), so no white band shows
    // between a hat or the crown and the hair; bald or hairless characters keep the low fringe.
    const topB = !capped && o.hair && o.hairStyle !== "bald" ? hc - 1.3 * H.b : top;
    // v13 (AV2 fix): the hair runs down to the jaw line on both sides and only the nape stays white: a neck column about
    // 0.4 W wide with straight sides and a softly rounded top hairline, which ends in the coat collar drawn below. Hair,
    // white neck, collar reads as the back of a person; the old full-width white crescent under the hair read as a grin.
    const nw = 0.38 * H.a, nTop = line - 0.2 * H.b, low = hc + 1.4 * H.b;
    const back: P2[] = [[300 - 1.3 * H.a, topB], [300 + 1.3 * H.a, topB], [300 + 1.3 * H.a, low], [300 + nw, low]];
    for (let i = 0; i <= 12; i++) { const a = rad(i * 15), c = Math.cos(a); back.push([300 + nw * c, nTop + 0.07 * H.b * Math.pow(Math.abs(c), 3) + (Math.abs(c) > 0.97 ? 0.05 * H.b : 0)]); }
    back.push([300 - nw, low], [300 - 1.3 * H.a, low]);''')
rep('''      for (const x of [-0.5, -0.17, 0.17, 0.5]) p.stroke([[300 + x * H.a, top + 0.1 * H.b], [300 + x * 1.06 * H.a, line - 0.05 * H.b]], 1.2 * u, shade(hcol, 0.74)); });''',
    '''      for (const x of [-0.7, -0.5, 0.5, 0.7]) p.stroke([[300 + x * H.a, top + 0.1 * H.b], [300 + x * 1.04 * H.a, line + 0.12 * H.b]], 1.2 * u, shade(hcol, 0.74));
      for (const x of [-0.2, 0.2]) p.stroke([[300 + x * H.a, top + 0.1 * H.b], [300 + x * H.a, nTop - 0.05 * H.b]], 1.2 * u, shade(hcol, 0.74));
      p.stroke([[300 - 0.55 * nw, nTop + 0.1 * H.b], [300 - 0.5 * nw, hc + 0.84 * H.b]], 1.1 * u, "rgba(60,40,60,0.16)");   // soft neck creases
      p.stroke([[300 + 0.55 * nw, nTop + 0.1 * H.b], [300 + 0.5 * nw, hc + 0.84 * H.b]], 1.1 * u, "rgba(60,40,60,0.16)"); });''')
rep("""      p.stroke([[300 + 0.55 * nw, nTop + 0.1 * H.b], [300 + 0.5 * nw, hc + 0.84 * H.b]], 1.1 * u, "rgba(60,40,60,0.16)"); });
    p.inkRing(hp, ow, thick);
""", """      p.stroke([[300 + 0.55 * nw, nTop + 0.1 * H.b], [300 + 0.5 * nw, hc + 0.84 * H.b]], 1.1 * u, "rgba(60,40,60,0.16)"); });
    p.inkRing(hp, ow, thick);
    { // the collar of whatever the body wears, drawn OVER the head outline so the neck runs into it
      const cc = shade(o.singlet ?? o.dress ?? o.drape ?? o.coat, 0.8), cy1 = hc + 0.8 * H.b, cy2 = hc + 1.14 * H.b;
      const col: P2[] = [[300 - 0.74 * H.a, cy2], [300 - 0.66 * H.a, cy1 + 0.07 * H.b], [300 - 0.52 * H.a, cy1 + 0.01 * H.b], [300, cy1 - 0.02 * H.b], [300 + 0.52 * H.a, cy1 + 0.01 * H.b], [300 + 0.66 * H.a, cy1 + 0.07 * H.b], [300 + 0.74 * H.a, cy2]];
      p.poly(col, cc, ow * 0.8);
      p.stroke([[300 - 0.55 * H.a, cy1 + 0.1 * H.b], [300 + 0.55 * H.a, cy1 + 0.1 * H.b]], 1.2 * u, shade(o.singlet ?? o.dress ?? o.drape ?? o.coat, 0.6));   // collar seam
    }
""")
rep("""    const ring: P2[] = [...L, ...Rr, [300 + 1.04 * H.a, ys + 0.06 * H.b], [300 + wx, ys], [300 + wx * 0.98, fr + 6 * u], [300 + wx * 0.7, fr], [300, fr + 2 * u], [300 - wx * 0.7, fr], [300 - wx * 0.98, fr + 6 * u], [300 - wx, ys], [300 - 1.04 * H.a, ys + 0.06 * H.b]];""",
"""    const wc = 300 + 0.6 * TURN.eye * u * turnK(fs);   // v13: the face window slides with the 3/4 turn, so the far-side hair grows
    const ring: P2[] = [...L, ...Rr, [300 + 1.04 * H.a, ys + 0.06 * H.b], [wc + wx, ys], [wc + wx * 0.98, fr + 6 * u], [wc + wx * 0.7, fr], [wc, fr + 2 * u], [wc - wx * 0.7, fr], [wc - wx * 0.98, fr + 6 * u], [wc - wx, ys], [300 - 1.04 * H.a, ys + 0.06 * H.b]];""")
open(p, 'w').write(s); print('open issues fixed in', p)
