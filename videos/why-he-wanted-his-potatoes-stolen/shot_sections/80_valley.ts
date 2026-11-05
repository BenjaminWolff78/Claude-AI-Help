
// =====================================================================================================================
// SHOT 8 (1470-1552) = SCENE 7, home base B, bright morning (time jump, the dissolve hidden in the door's light):
// "Stolen potatoes ended up in a hundred gardens." The camera glides high over the village: potato patches sprout in every
// backyard, the big farmer secretly munches a baked potato in his, a neighbour hoes; down to the hero, who picks a potato
// flower and holds it up (shape match into the banquet).
// SHOT 10 (1794-1914) = SCENE 9, the pigsty at golden evening (hard cut on the punchline): "Not bad for the Pig Doctor.
// The pigs, though, never got another potato." The farmer tips his hat to the hero (flower in his buttonhole) as he
// passes; slow push to the pig at its empty trough: a sad nudge, one ear twitch, a calm held close-up -> loops to frame 1.
const GA: V3 = [-12.5, 0, 13.5], GB: V3 = [6.8, 0, 13.6], GC: V3 = [12.8, 0, -9.6];
const HERO8: V3 = [4.6, 0, 12.0];
const FLOWER = (): V3 => [HERO8[0] + 0.28, 2.34, HERO8[2] + 0.12];
const flowerCard = (pos: V3, s: number): FxSpec => ({ kind: "card", key: "pflower", pos, w: s, h: s, cw: 160, ch: 160,
  draw: (p) => { const g = p.g; g.strokeStyle = INKC; g.lineWidth = 7; g.fillStyle = "#4f8a3a"; g.beginPath(); g.moveTo(80, 150); g.lineTo(80, 92); g.stroke();
    g.beginPath(); g.ellipse(102, 118, 20, 9, -0.5, 0, 7); g.fill(); g.stroke();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; g.fillStyle = i % 2 ? "#c9b4f6" : "#ece4ff"; g.beginPath(); g.ellipse(80 + Math.cos(a) * 30, 62 + Math.sin(a) * 30, 24, 17, a, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = "#f6c430"; g.beginPath(); g.arc(80, 62, 14, 0, 7); g.fill(); g.stroke(); } });
SHOT_CAMS[8] = () => [
  K(1470, F((f) => { const k = sm(f, 1470, 1528); return { pos: lerp3([-0.5, 10.5, 14.8], [2.6, 4.4, 15.8], k), look: lerp3([-5.0, 0.2, 6.5], [4.4, 0.8, 11.2], k), fov: 48 }; }, 1470, 0.0012)),
  K(1526, (f) => { const h = FLOWER(), k = sm(f, 1526, 1550); return { pos: lerp3([h[0] + 3.8 * Math.sin(0.4), h[1] - 0.3, h[2] + 3.8 * Math.cos(0.4)], [h[0] + 3.0 * Math.sin(0.4), h[1] - 0.45, h[2] + 3.0 * Math.cos(0.4)], k), look: [h[0], h[1] - 0.8, h[2]], fov: 38 }; }, 18),
];
SHOT_ACTS[8] = (f) => {
  const hoe = 0.5 + 0.5 * Math.sin(((f - 1470) / 13) * Math.PI * 2);
  return {
    ctl: { planted: 1, holes: 1, torches: 0, moon: 0, trough: 0, gardens: sm(f, 1474, 1522), smoke: 1 },
    cast: [
      C("farmer", [GA[0] + 1.6, 0, GA[2] - 1.9], flow(f, [
        [1470, { expr: "sly", facing: -1, look: -0.8, sweat: 1, armR: [[22, 16], [10, -14]] as A2, armRFront: true, propR: "bakedPotato" }],
        [1494, { expr: "joy", facing: -1, sweat: 1, mouth: f % 6 < 3 ? "O" : "dash", armR: [[22, 16], [8, -18]] as A2, armRFront: true, propR: "bakedPotato" }, 2],          // munch, munch
        [1516, { expr: "nervous", facing: 1, look: 0.9, sweat: 1, armR: [[24, 34], [-6, 50]] as A2, armRFront: true, propR: "bakedPotato" }, 2],                           // hides it behind his back
      ]), { idx: 48 }),
      C("vil1", [GB[0] + 2.4, 0, GB[2] - 1.5], pose(null, { expr: "smile", facing: -1, tilt: 12 * hoe, armR: [[28, 18 + 10 * hoe], [50, 30 - 22 * hoe]] as A2, armL: [[-6, 30], [28, 42 - 10 * hoe]] as A2, armRFront: true, armLFront: true, propR: "shovel", propRAng: -0.6 + 0.8 * hoe, propK: 1 }), { idx: 41 }),
      C("vil2", [GC[0] - 1.8, 0, GC[2] + 1.6], pose(null, { expr: "joy", facing: 1, mode: "kneel", armR: [[26, 24], [40, 30]] as A2, armRFront: true, propR: "potato" }), { idx: 42 }),
      C("vil4", [-4.0, 0, 9.6], pose(null, { expr: "joy", facing: 1, armR: [[30, -14], [44, -46]] as A2, propR: "potato" }), { idx: 46 }),
      C("parm", HERO8, flow(f, [
        [1470, { expr: "smile", facing: 1, look: 0.6, armR: [[24, 30], [30, 52]] as A2 }],
        [1524, { expr: "calm", facing: 1, tilt: 18, armR: [[30, 30], [50, 46]] as A2, armRFront: true }, 6],                       // bends to the plant
        [1532, { expr: "smug", facing: 1, armR: [[24, -30], [30, -80]] as A2 }, 4],                                                // holds the flower up
      ]), { idx: 1 }),
      C("pig", [-9.0, 0, -3.4], pose(null, { expr: "dismay", facing: 1, tilt: 4 }), { idx: 40, scale: 0.78 }),
    ],
    fx: fxs(
      f < 1486 ? glowBurst("in8_" + Math.round(lin(f, 1470, 1486) * 8), [-2.0, 7.5, 21.0], 9 - 6 * lin(f, 1470, 1486), 1 - lin(f, 1470, 1486), "255,236,200") : null,
      f >= 1532 ? flowerCard(lerp3([HERO8[0] + 0.45, 1.5, HERO8[2] + 0.1], FLOWER(), sm(f, 1532, 1538)), 0.42) : null,
      f >= 1540 && f < 1552 ? sparkle("fl", [FLOWER()[0] + 0.2, FLOWER()[1] + 0.2, FLOWER()[2]], f - 1540, 0.22) : null,
    ),
    focus: f < 1526 ? [GA[0], 1.2, GA[2]] : FLOWER(),
    subj: f < 1526 ? "farmer" : null,
  };
};
lens(1470, 1, 1); lens(1526, 8, 14);

// ---------------- 10: ending ----------------
const PIGE: V3 = [-9.0, 0, -3.4], FARM10: V3 = [-6.6, 0, -1.4];
SHOT_CAMS[10] = () => [
  K(1794, F(() => fit([body(FARM10, 0, 2.1, 0.45), body([-4.4, 0, -0.2], 0, 2.3, 0.45)], 34, 6, 40, 0.8), 1794, 0.0018), 1, true),
  K(1826, FS(() => ({ pos: [-8.65, 1.72, -0.55] as V3, look: [-8.65, 0.36, -3.45] as V3, fov: 40 }), 1826, 0.0016, -0.002, [], 1870), 26),
];
SHOT_ACTS[10] = (f, s) => {
  const hw = walkPath(10, s, [[-1.6, 0, 1.4], [-4.4, 0, -0.2]], f, 1794, 1818);
  return {
    ctl: { planted: 1, holes: 1, torches: 0, moon: 0, trough: 0, gardens: 1, smoke: 1 },
    cast: [
      C("parmFlower", hw.p, hw.moving ? pose(null, { mode: "walk", phase: hw.phase, facing: hw.facing, expr: "smile" }) : flow(f, [
        [1818, { expr: "smile", facing: -1, armR: [[24, 30], [30, 52]] as A2 }],
        [1822, { expr: "proud", facing: -1, headTilt: 6, armR: [[30, -10], [16, -46]] as A2, armRTop: true }, 4],                  // touches his hat back
        [1836, { expr: "smile", facing: -1, look: -0.8, armR: [[24, 30], [30, 52]] as A2 }, 6],
      ]), { idx: 1 }),
      C("farmer", FARM10, flow(f, [
        [1794, { expr: "neutral", facing: 1, look: 0.6 }],
        [1806, { expr: "smile", facing: 1, hatLift: 0.35, armR: [[30, -10], [16, -50]] as A2, armRTop: true }, 6],                  // tips his hat: respect
        [1830, { expr: "smile", facing: 1, armR: [[24, 30], [30, 52]] as A2 }, 8],
      ]), { idx: 48 }),
      C("pig", PIGE, flow(f, [
        [1794, { expr: "neutral", facing: 1, phase: 0 }],
        [1832, { expr: "dismay", facing: 1, tilt: 6 }, 1],
        [1846, { expr: "dismay", facing: 1, tilt: 22 }, 6],                                                                          // nudges the empty trough
        [1862, { expr: "dismay", facing: 1, tilt: 8, phase: lin(f, 1870, 1880) * 0.4 }, 8],                                          // one ear twitch, then still
      ]), { idx: 40, scale: 0.78 }),
    ],
    fx: [],
    focus: f < 1826 ? [-5.5, 1.5, -0.8] : [PIGE[0] + 0.5, 0.6, PIGE[2]],
    subj: f < 1826 ? "farmer" : "pig",
  };
};
lens(1794, 4, 1); lens(1826, 9, 24);
