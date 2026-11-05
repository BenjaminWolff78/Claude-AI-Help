
// =====================================================================================================================
// SHOT 8 (1500-1590) = SCENE 8, the kitchen (position match: the lion's frozen paw -> the kid's frozen hand): "Ever try to
// sneak a cookie while your mom's staring right at you? Same thing." The kid on the stool, hand at the cookie jar, sly;
// mum steps into the doorway and stares; the kid freezes (sweat), then slowly pulls the hand back with a guilty grin.
const KID: V3 = [0.6, 0.42, -1.18], MUM: V3 = [2.2, 0, 1.0];
SHOT_CAMS[8] = () => [
  K(1500, F(() => ({ pos: [0.2, 1.85, 0.45] as V3, look: [0.45, 1.7, -1.6] as V3, fov: 34 }), 1500, 0.0016)),
  K(1512, FS(() => ({ pos: [1.5, 1.62, 4.9] as V3, look: [1.5, 1.3, -0.5] as V3, fov: 48 }), 1512, 0.0018, 0.0016, [[1546, 0.007, 10]], 1550), 30),
];
SHOT_ACTS[8] = (f) => {
  const mw = along([[3.9, 0, 1.3], MUM], 0.05, 1526, f);
  return {
    ctl: {},
    cast: [
      C("pjKid", KID, flow(f, [
        [1500, { expr: "sly", facing: -1, armR: [[10, -30], [14, -68]] as A2, armRFront: true, look: -0.6 }],
        [1544, { expr: "shock", facing: 1, look: 1, armR: [[10, -30], [14, -68]] as A2, armRFront: true, sweat: 1 }, 2],    // caught
        [1572, { expr: "sheepish", facing: 1, look: 1, armR: [[10, -10], [4, -30]] as A2, armRFront: true, sweat: 1 }, 10], // slowly pulls back
      ]), { idx: 40 }),
      C("mum", mw.p, mw.moving ? pose(null, { mode: "walk", phase: ph(f, 13), facing: -1, expr: "neutral" }) : flow(f, [
        [1528, { expr: "neutral", facing: -1 }],
        [1538, { expr: "stare", facing: -1, armR: [[-16, 12], [4, 28]] as A2, armL: [[16, 12], [-4, 28]] as A2, armRFront: true, armLFront: true }, 6],  // arms crossed, staring
        [1576, { expr: "stern", facing: -1, armR: [[-16, 12], [4, 28]] as A2, armL: [[16, 12], [-4, 28]] as A2, armRFront: true, armLFront: true, headTilt: -6 }, 6],
      ]), { idx: 41 }),
    ],
    fx: [],
    focus: f < 1530 ? [0.6, 1.9, -1.5] : [1.6, 1.5, -0.2],
    subj: "pjKid",
  };
};
lens(1500, 7, 1); lens(1512, 4, 24);

// =====================================================================================================================
// SHOT 9 (1590-1740) = SCENE 9, the payoff (hard cut on "Four years"): "Four years and two thousand cows later, the painted
// ones lost to lions? Zero. The plain ones? Fifteen." Bright day on the open plain: a giant painted rump fills the right
// half of the frame, then the camera cranes up over a sea of cows walking away, every rump eye staring back at us, to the
// lion sulking on a kopje; down to the hero holding up a slate: 0 (painted eyes) with a burst of light, and the big farmer
// beside him: 15 (plain cow).
const PAY_HERO: V3 = [40.2, 0, -4.4], PAY_BIG: V3 = [41.4, 0, -6.2];
/** a big chalk slate card held over the head (readable from the payoff framing), pops in over 8 frames */
const slateCard = (n: string, eyes: boolean, pos: V3, k: number): FxSpec => ({ kind: "card", key: "slate" + n + "_" + Math.round(k * 8), pos: [pos[0], pos[1] + 0.1 * (1 - k), pos[2]], w: 0.95 * (0.6 + 0.4 * k), h: 0.8 * (0.6 + 0.4 * k), cw: 300, ch: 252,
  draw: (p) => { const g = p.g; g.globalAlpha = Math.min(1, k * 1.5); g.fillStyle = "#8a5a32"; g.strokeStyle = "#241726"; g.lineWidth = 12; g.beginPath(); g.roundRect(8, 8, 284, 236, 18); g.fill(); g.stroke();
    g.fillStyle = "#2e3a38"; g.fillRect(30, 30, 240, 192); g.font = "900 120px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fbf8f0"; g.fillText(n, eyes ? 112 : 108, 128);
    if (eyes) { for (const x of [205, 245]) { g.fillStyle = "#fbf8f0"; g.beginPath(); g.ellipse(x, 120, 18, 12, 0, 0, 7); g.fill(); g.fillStyle = "#19b7b0"; g.beginPath(); g.arc(x, 121, 7, 0, 7); g.fill(); } }
    else { g.fillStyle = "#c8875a"; g.beginPath(); g.ellipse(225, 128, 32, 20, 0, 0, 7); g.fill(); g.fillStyle = "#fbf8f0"; g.fillRect(190, 140, 70, 6); }
    g.globalAlpha = 1; } });
const PAYHERD: { who: string; p: V3; painted: boolean; ph: number }[] = (() => {
  const out: { who: string; p: V3; painted: boolean; ph: number }[] = []; let i = 0;
  for (let x = 44; x <= 92; x += 3.6) for (let z = -16; z <= 16; z += 3.4) { const j = rnd1(i * 7.1), k = rnd1(i * 3.3, 41.7);
    if (Math.abs(z - 9) < 4 && Math.abs(x - 66) < 5) { i++; continue; }
    out.push({ who: "cow" + (i % 12), p: [x + (j - 0.5) * 2.2, 0, z + (k - 0.5) * 2.2], painted: rnd1(i, 91.3) < 0.72, ph: rnd1(i, 17.1) }); i++; }
  return out;
})();
SHOT_CAMS[9] = () => [
  K(1590, F(() => ({ pos: [34.2, 1.15, 1.4] as V3, look: [44.0, 1.35, 0.6] as V3, fov: 44 }), 1590, 0.0022), 1, true),
  K(1608, F((f) => { const k = sm(f, 1608, 1680); return { pos: lerp3([34.0, 2.2, 1.0], [33.0, 10.5, -2.0], k), look: lerp3([46.0, 1.4, 0.6], [62.0, 0.8, 6.0], k), fov: 46 }; }, 1608, 0.001), 40),
  K(1680, FS(() => ({ pos: [36.6, 1.7, -9.6] as V3, look: [40.9, 1.5, -4.9] as V3, fov: 40 }), 1686, 0.0018, 0.0022, [[1696, 0.008, 12], [1728, 0.007, 10]], 1712), 24),
];
SHOT_ACTS[9] = (f, s) => {
  const big: CastPlace = C("cow0", [37.4, 0, 1.6], pose(null, { back: true, facing: -1, expr: "smug", paintK: 1 }), { idx: 299, scale: 1.7 });
  return {
    ctl: { night: 0, fire: 0, smoke: 0, dust: 1 },
    cast: [
      big,
      ...PAYHERD.map((c, i) => { const walk = rnd1(i, 5.5) < 0.4; const dx = walk ? 0.04 * (f - 1590) : 0;
        return C(c.who, [c.p[0] + dx, 0, c.p[2]], pose(null, { back: true, facing: i % 2 ? 1 : -1, expr: "neutral", paintK: c.painted ? 1 : 0, mode: walk ? "walk" : "stand", phase: walk ? ((f + c.ph * 30) / 16) % 1 : 0 }), { idx: 300 + i, scale: 1.7 }); }),
      C("lion", [66.2, 1.6, 9.0], flow(f, [[1590, { mode: "lie", expr: "dismay", facing: -1 }], [1700, { mode: "lie", expr: "sheepish", facing: -1, sweat: 1 }, 6]]), { idx: 30, scale: 1.75 }),
      C("picasso", PAY_HERO, flow(f, [
        [1590, { expr: "smug", facing: 1, armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "paintbrush", propK: 1 }],
        [1690, { expr: "proud", facing: 1, armR: [[18, -18], [20, -50]] as A2, armL: [[-18, -18], [-20, -50]] as A2 }, 8],      // Zero. (slate card above)
      ]), { idx: 1 }),
      C("fmBig", PAY_BIG, flow(f, [
        [1590, { expr: "stare", facing: -1, look: 0.6 }],
        [1708, { expr: "sheepish", facing: -1, sweat: 1, armR: [[18, -18], [20, -50]] as A2, armL: [[-18, -18], [-20, -50]] as A2 }, 8],   // Fifteen. (slate card above)
      ]), { idx: 10 }),
    ],
    fx: fxs(
      f >= 1694 && f < 1716 ? glowBurst("zero" + Math.round(lin(f, 1694, 1716) * 10), [PAY_HERO[0] + 0.2, 2.3, PAY_HERO[2]], 2.8, Math.sin(lin(f, 1694, 1716) * Math.PI), "255,246,200") : null,
      f >= 1696 ? [0, 1, 2, 3].map((i) => sparkle("z" + i, [PAY_HERO[0] - 0.6 + i * 0.4, 2.0 + 0.4 * (i % 2), PAY_HERO[2] + 0.2], (f - 1696 - i * 3) % 18, 0.3)) : null,
      f >= 1690 ? slateCard("0", true, [PAY_HERO[0], 2.55, PAY_HERO[2] + 0.05], lin(f, 1690, 1698)) : null,
      f >= 1708 ? slateCard("15", false, [PAY_BIG[0], 2.5, PAY_BIG[2] + 0.05], lin(f, 1708, 1716)) : null,
      f >= 1722 ? [0, 1].map((i) => dustCard("dd" + i, [44 + i * 3, 0.8, -1 + i * 2], 3.4, lin(f, 1722, 1740) * 0.9, i + 1)) : null,
    ),
    focus: f < 1608 ? [37.4, 1.0, 1.6] : f < 1686 ? [60, 1, 4] : [41.0, 1.6, -3.4],
    subj: f < 1686 ? null : "picasso",
  };
};
lens(1590, 4, 1); lens(1608, 0, 30); lens(1686, 4, 20);

// =====================================================================================================================
// SHOT 10 (1740-1857) = SCENE 10, the ending at the kraal in golden afternoon light (dissolve inside the herd's dust):
// "And Butt Picasso? Now the whole village is lining up for a paint job." The farmers (the big one first) queue at the gate,
// each leading a plain cow; the big farmer hands over his cow's rope, sheepish; the hero, proud, lifts the brush -> a calm
// close-up of his changed face with the next rump ready (loops into the hook).
const Q: V3[] = [[0.0, 0, 11.3], [-1.7, 0, 11.9], [-3.4, 0, 12.5], [-5.1, 0, 13.1]];
SHOT_CAMS[10] = () => [
  K(1740, F((f) => { const k = sm(f, 1740, 1790); return { pos: lerp3([5.8, 4.4, 23.0], [4.8, 2.4, 18.6], k), look: lerp3([-0.6, 1.0, 10.6], [0.0, 1.2, 10.6], k), fov: 44 }; }, 1740, 0.0012)),
  K(1796, FS(() => ({ pos: [3.15, 1.45, 13.0] as V3, look: [1.85, 1.35, 9.5] as V3, fov: 36 }), 1796, 0.0022, 0.0012, [[1819, 0.005, 10]], 1826), 30),
];
SHOT_ACTS[10] = (f, s) => {
  const lead = (who: string, cow: string, i: number): CastPlace[] => {
    const p = Q[i], cp: V3 = [p[0] - 0.5, 0, p[2] + 1.1];
    return [
      C(who, p, flow(f, [
        [1740, { expr: "sheepish", facing: 1, armL: [[-20, 14], [-36, 22]] as A2, armLFront: true, sweat: i === 0 ? 1 : 0 }],
        [1760 + i * 4, { expr: i === 0 ? "sheepish" : "smile", facing: 1, armR: [[20, 10], [40, 6]] as A2, armRFront: true, sweat: i === 0 ? 1 : 0 }, 10],  // offers the rope
      ]), { idx: 10 + i }),
      C(cow, cp, pose(null, { expr: i === 0 ? "sheepish" : "neutral", facing: 1, tilt: i % 2 ? 0 : 6 }), { idx: 240 + i, scale: 1.7 }),
    ];
  };
  return {
    ctl: { night: 0, fire: 1, smoke: 1 },
    cast: [
      ...herdCast(10, s, f, ["cow1", "cow7", "cow2", "cow5", "cow8", "cow10"]),
      ...lead("fmBig", "cow2", 0), ...lead("fmThin", "cow5", 1), ...lead("fmAunt", "cow8", 2), ...lead("fmTall", "cow10", 3),
      C("picasso", [1.75, 0, 9.55], flow(f, [
        [1740, { expr: "smug", facing: -1, armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "paintbrush", propK: 1, armL: [[-10, 30], [4, 46]] as A2, propL: "paintPot" }],
        [1792, { expr: "smile", facing: -1, armR: [[22, -10], [24, -44]] as A2, armRFront: true, propR: "paintbrush", propK: 1, armL: [[-10, 30], [4, 46]] as A2, propL: "paintPot" }, 10],   // lifts the brush
        [1816, { expr: "proud", facing: -1, headTilt: 6, armR: [[22, -10], [24, -44]] as A2, armRFront: true, propR: "paintbrush", propK: 1, propRAng: 0.15, armL: [[-10, 30], [4, 46]] as A2, propL: "paintPot" }, 6],
      ]), { idx: 1 }),
    ],
    fx: fxs(
      f < 1754 ? [0, 1].map((i) => dustCard("dd" + i, [3 + i * 2.5, 0.8, 12 + i], 2.4, (1 - lin(f, 1740, 1754)) * 0.85, i + 1)) : null,
      f >= 1819 && f < 1835 ? sparkle("brush", [2.35, 2.55, 9.7], f - 1819, 0.3) : null,
    ),
    focus: f < 1796 ? [3.6, 1.2, 10.6] : [1.8, 1.6, 9.6],
    subj: f < 1796 ? null : "picasso",
  };
};
lens(1740, 2, 1); lens(1796, 6, 24);
