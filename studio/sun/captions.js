/* Kinetic type on the 2D overlay: captions from the timeline, layer labels, small kickers. */
'use strict';
const DISPLAY = '"Inter Display", "Inter", sans-serif';
const SERIF = '"Lora", serif';
const MONO = '"DejaVu Sans Mono", monospace';
const STY = {
  big: {size: 104, w: 900, lh: 1.05, track: -0.025},
  mid: {size: 66, w: 800, lh: 1.14, track: -0.02},
  note: {size: 44, w: 600, lh: 1.3, track: -0.01},
  pop: {size: 150, w: 900, lh: 1, track: -0.03},
  kicker: {size: 30, w: 700, lh: 1.2, track: 0.28, mono: true},
};
// "a *b* c|d" -> lines of runs
function parse(text) {
  return text.split('|').map(line => {
    const runs = []; let acc = false;
    line.split('*').forEach((s, i) => { if (s) runs.push({s, acc: i % 2 === 1}); });
    return runs;
  });
}
function runFont(st, acc) {
  if (st.mono) return `700 ${st.size}px ${DISPLAY}`;
  return acc ? `italic 600 ${Math.round(st.size * 1.04)}px ${SERIF}` : `${st.w} ${st.size}px ${DISPLAY}`;
}
// lay out every character with its x, line, font, colour
function layout(cap) {
  const st = STY[cap.style];
  const lines = parse(cap.style === 'kicker' ? cap.text.toUpperCase() : cap.text);
  const out = []; let gi = 0;
  const lineW = [];
  lines.forEach((runs, li) => {
    let x = 0;
    runs.forEach(r => {
      ox.font = runFont(st, r.acc); ox.letterSpacing = (st.track * st.size) + 'px';
      for (let i = 0; i < r.s.length; i++) {
        const xi = ox.measureText(r.s.slice(0, i)).width, wi = ox.measureText(r.s.slice(0, i + 1)).width;
        out.push({ch: r.s[i], x: x + xi, w: wi - xi, li, acc: r.acc, font: ox.font, gi: gi++});
      }
      x += ox.measureText(r.s).width;
    });
    lineW.push(x);
  });
  return {st, chars: out, lineW, n: lines.length};
}
const LAY = new Map();
function capLayout(cap) { const k = cap.style + '|' + cap.text; if (!LAY.has(k)) LAY.set(k, layout(cap)); return LAY.get(k); }

const tcv = document.createElement('canvas'); tcv.width = W; tcv.height = H;
const tcx = tcv.getContext('2d');
function drawCaption(cap, t, ox = tcx) {
  if (t < cap.t0 - .05 || t > cap.t1 + .7) return;
  const L = capLayout(cap), st = L.st;
  const cx = (cap.x == null ? .5 : cap.x) * W, cy = (cap.y == null ? .5 : cap.y) * H;
  const lh = st.size * st.lh, top = cy - (L.n - 1) * lh / 2;
  const stagger = cap.style === 'pop' ? .03 : st.mono ? .012 : .022, dur = cap.style === 'pop' ? .5 : .62;
  ox.save();
  ox.textBaseline = 'middle';
  // pop style: whole word springs in with a slight rotation
  let popS = 1, popR = 0;
  if (cap.style === 'pop') {
    popS = .35 + .65 * spring(t - cap.t0, 230, 15); popR = (1 - spring(t - cap.t0, 180, 14)) * -.12;
    const ex = I(t, cap.t1 - .2, cap.t1, 0, 1, E.inCubic); popS *= 1 - ex; if (popS <= 0) { ox.restore(); return; }
  }
  ox.translate(cx, cy); ox.rotate(popR); ox.scale(popS, popS); ox.translate(-cx, -cy);
  for (const c of L.chars) {
    const t0 = cap.t0 + c.gi * stagger;
    const k = I(t, t0, t0 + dur, 0, 1, E.outExpo);
    const ke = cap.style === 'pop' ? 0 : I(t, cap.t1 + c.gi * .008, cap.t1 + c.gi * .008 + .38, 0, 1, E.inCubic);
    if (k <= 0 || ke >= 1) continue;
    const x0 = cx - L.lineW[c.li] / 2, y = top + c.li * lh;
    const lx = x0 + c.x;
    ox.save();
    ox.beginPath(); ox.rect(lx - st.size * .15, y - st.size * .72, c.w + st.size * .3, st.size * 1.44); ox.clip();
    ox.font = c.font; ox.letterSpacing = (st.track * st.size) + 'px';
    const dy = (1 - k) * st.size * 1.0 - ke * st.size * .9;
    let col = c.acc ? C.lime : C.cream;
    let a = 1;
    if (cap.strike && t > TL.scenes.hook.strike && c.gi >= cap.strike[0] && c.gi < cap.strike[1]) a *= I(t, TL.scenes.hook.strike, TL.scenes.hook.strike + .3, 1, .55);
    ox.globalAlpha = a;
    ox.fillStyle = col;
    ox.fillText(c.ch, lx, y + dy);
    ox.restore();
  }
  // strike-through bar
  if (cap.strike && t > TL.scenes.hook.strike) {
    const a = L.chars[cap.strike[0]], b = L.chars[cap.strike[1] - 1];
    const x0 = cx - L.lineW[0] / 2;
    const u = I(t, TL.scenes.hook.strike, TL.scenes.hook.strike + .35, 0, 1, E.outExpo);
    const ex = I(t, cap.t1, cap.t1 + .3, 0, 1, E.inCubic);
    ox.shadowBlur = 0; ox.fillStyle = C.coral; ox.globalAlpha = 1 - ex;
    ox.fillRect(x0 + a.x - 6, cy - 5, (b.x + b.w - a.x + 12) * u, 10);
  }
  ox.restore();
}

// a label: dot on the 3D anchor, a leader line, a title and a mono sub-line
function drawLabel(lb, t, anchor) {
  if (!anchor || t < lb.t0 || t > lb.t1 + .5) return;
  const k = I(t, lb.t0, lb.t0 + .6, 0, 1, E.outExpo), ex = I(t, lb.t1, lb.t1 + .4, 0, 1, E.inCubic);
  const a = 1 - ex, side = lb.lx > W / 2 ? 1 : -1;
  const [ax, ay] = anchor, x2 = lb.lx, y2 = lb.ly, ex1 = x2 - side * 120;
  ox.save(); ox.globalAlpha = a;
  ox.shadowColor = 'rgba(10,10,18,0.7)'; ox.shadowBlur = 14;
  const r = 8 * spring(t - lb.t0, 260, 16);
  ox.fillStyle = C.cream; ox.beginPath(); ox.arc(ax, ay, r, 0, 7); ox.fill();
  ox.strokeStyle = C.cream; ox.lineWidth = 2; ox.globalAlpha = a * .6;
  ox.beginPath(); ox.arc(ax, ay, r + 9 + 5 * Math.sin(t * 4), 0, 7); ox.stroke();
  ox.globalAlpha = a; ox.lineWidth = 3;
  const L1 = Math.hypot(ex1 - ax, y2 - ay), L2 = Math.abs(x2 - ex1), tot = L1 + L2, dr = k * tot;
  ox.beginPath(); ox.moveTo(ax, ay);
  if (dr < L1) ox.lineTo(ax + (ex1 - ax) * dr / L1, ay + (y2 - ay) * dr / L1);
  else { ox.lineTo(ex1, y2); ox.lineTo(ex1 + (x2 - ex1) * (dr - L1) / L2, y2); }
  ox.stroke();
  const tk = I(t, lb.t0 + .25, lb.t0 + .85, 0, 1, E.outExpo);
  ox.textBaseline = 'alphabetic'; ox.textAlign = side > 0 ? 'left' : 'right';
  const tx = x2 + side * 18, cl = side > 0 ? tx : tx - 700;
  ox.save(); ox.beginPath(); ox.rect(cl, y2 - 60, 700, 74); ox.clip();
  ox.font = `900 50px ${DISPLAY}`; ox.letterSpacing = '-0.5px'; ox.fillStyle = C.cream;
  ox.fillText(lb.text, tx, y2 + 14 + (1 - tk) * 70); ox.restore();
  ox.save(); ox.beginPath(); ox.rect(cl, y2 + 16, 700, 44); ox.clip();
  ox.font = `500 26px ${MONO}`; ox.letterSpacing = '5px'; ox.fillStyle = C.lime;
  ox.fillText(lb.sub.toUpperCase(), tx, y2 + 52 + (1 - I(t, lb.t0 + .4, lb.t0 + 1, 0, 1, E.outExpo)) * 44); ox.restore();
  ox.restore();
}

// free-standing small mono line (used under the 3D year counter)
// all captions are drawn on their own layer, then put on the overlay with one soft shadow
function drawCaptions(t) {
  tcx.clearRect(0, 0, W, H);
  for (const cap of TL.captions) drawCaption(cap, t);
  ox.save(); ox.shadowColor = 'rgba(10,10,18,0.62)'; ox.shadowBlur = 34; ox.drawImage(tcv, 0, 0); ox.restore();
}
function drawKicker(str, x, y, t0, t1, t, col = C.cream) {
  drawCaption({text: str, style: 'kicker', t0, t1, x: x / W, y: y / H, _col: col}, t);
}
