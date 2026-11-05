
// =====================================================================================================================
// SHOT 2 (588-719) = SCENE 3, the throne room (cool marble + gold). In by a POSITION-MATCH dissolve: the hero's raised
// potato -> the king's round white head on the same spot and size; the camera cranes back to the hero bowing at the
// foot of the dais. "So he asked the king for a field and a few soldiers. Soldiers? To guard pig food?" He unrolls a
// field plan and counts "a few" on his fingers; the two guards look at each other; the king lowers his goblet, raises
// a brow, palm up; then STAMPS the decree in a puff of gold dust (the dust dissolve into the field).
// SHOT 7 (1375-1470) = SCENE 6, the corridor (shape match from the hut door): "Ever wanted to open a door just because it
// said 'Staff only'? Same thing." A noble lady tiptoes to the STAFF ONLY door, sweat drop, both hands on the knob, peeks in
// with a huge grin as warm light floods out (the light dissolve into the village).
// SHOT 9 (1552-1794) = SCENE 8, the banquet PAYOFF in the brightest gold (shape match: the potato flower in the hero's
// hand). "Then he gave the king a potato flower, and the king wore it on his coat. Suddenly every noble wanted one. Today
// French menus still name potato dishes after him." The king pins it on, the nobles mob the hero holding up flowers,
// the servants lift the cloches off mountains of potatoes, the menu turns round: HACHIS PARMENTIER; petals, gold light.
const KING: V3 = [0, 1.12, -12.15], KHEAD: V3 = [0, 2.18, -12.05], HT: V3 = [0, 0, -8.55], GL: V3 = [-3.3, 0, -10], GR: V3 = [3.3, 0, -10];
const MATCH_D = 2.7, MATCH_UP = 0.36; // same framing as the raised potato at the end of shot 1
SHOT_CAMS[2] = () => [
  K(584, F(() => ({ pos: [KHEAD[0] + MATCH_D * Math.sin(0.12), KHEAD[1] - 0.3, KHEAD[2] + MATCH_D * Math.cos(0.12)] as V3, look: [KHEAD[0], KHEAD[1] - MATCH_UP, KHEAD[2]] as V3, fov: 38 }), 584, 0.0012)),
  K(596, F(() => fit([body(KING, 0, 1.4, 0.55), body(HT, 0, 2.2, 0.45), body(GL, 0, 2.2, 0.4), body(GR, 0, 2.2, 0.4)], 24, 10, 42, 0.86), 596, 0.0016, [[640, 0.005, 10]]), 30),
  K(660, F(() => fit([body(GL, 0, 2.3, 0.45), body(KING, 0, 1.4, 0.55), body(GR, 0, 2.3, 0.45)], 352, 6, 42, 0.86), 660, 0.0018, [[668, 0.006, 8]]), 18),
  K(688, F(() => fit([body(KING, 0.2, 1.45, 0.6)], 14, 4, 38, 0.66, 0, -0.05), 688, 0.0018, [[706, 0.006, 8]]), 16),
];
SHOT_ACTS[2] = (f) => {
  const stamp = sm(f, 705, 708);
  return {
    ctl: { lamps: 1 },
    cast: [
      C("king", KING, flow(f, [
        [584, { mode: "sit", expr: "stern", look: 0.3, armR: [[24, 14], [30, -6]] as A2, propR: "goblet" }],
        [640, { mode: "sit", expr: "cold", look: 0.4, armR: [[24, 14], [30, -6]] as A2, propR: "goblet" }, 1],
        [683, { mode: "sit", expr: "smug", headTilt: -6, mouth: talk(f, 685, 706), armR: [[26, 30], [34, 40]] as A2, propR: "goblet", armL: [[-30, 14], [-46, 4]] as A2 }, 4], // brow up, palm up
        [699, { mode: "sit", expr: "determined", armR: [[26, -10], [30, -40]] as A2 }, 6],                                                           // wind-up
        [705, { mode: "sit", expr: "proud", armR: [[30, 20], [40, 40]] as A2, armRFront: true }, 2],                                                  // STAMP
      ]), { idx: 60 }),
      C("parm", HT, flow(f, [
        [584, { expr: "calm", facing: -1, tilt: 18, armR: [[24, 30], [30, 52]] as A2 }],                                                                              // bows
        [598, { expr: "smile", facing: 1, armR: [[30, 10], [46, 4]] as A2, armRFront: true, propR: "scroll" }, 6],                                                    // unrolls the field plan
        [628, { expr: "pitch", facing: 1, mouth: talk(f, 628, 650), armR: [[30, 10], [46, 4]] as A2, armRFront: true, propR: "scroll", armL: [[-30, -10], [-40, -40 + 6 * Math.sin(f * 0.8)]] as A2 }, 4], // counts on his fingers
        [664, { expr: "smile", facing: 1, armR: [[24, 30], [30, 52]] as A2 }, 6],
        [700, { expr: "eureka", facing: 1, armR: [[24, 30], [30, 52]] as A2 }, 1],
      ]), { idx: 1 }),
      C("pguard1", GL, flow(f, [[584, { expr: "stern", facing: 1, ...PZ.hips }], [665, { expr: "shock", facing: 1, look: 0.9 }, 1], [690, { expr: "laugh", facing: 1, shake: 0.6, phase: (f / 12) % 1 }, 2]]), { idx: 61 }),
      C("pguard2", GR, flow(f, [[584, { expr: "stern", facing: -1, ...PZ.hips }], [666, { expr: "shock", facing: -1, look: -0.9 }, 1], [691, { expr: "laugh", facing: -1, shake: 0.6, phase: (f / 12) % 1 + 0.4 }, 2]]), { idx: 62 }),
    ],
    fx: fxs(
      f >= 706 ? dustCard("stamp1", [KING[0] + 0.3, 1.55, KING[2] + 0.8], 0.6 + 3.2 * lin(f, 706, 719), Math.min(1, 1.5 * lin(f, 705, 710)), 1) : null,
      f >= 708 ? dustCard("stamp2", [KING[0] - 0.4, 1.9, KING[2] + 1.6], 0.5 + 3.6 * lin(f, 708, 719), Math.min(1, 1.5 * lin(f, 707, 712)), 3) : null,
      f >= 706 && f < 716 ? sparkle("stamp", [KING[0] + 0.3, 1.6, KING[2] + 0.6], f - 706, 0.4) : null,
    ),
    focus: f < 596 ? KHEAD : f < 660 ? [HT[0], 1.6, HT[2]] : KHEAD,
    subj: f < 660 ? "parm" : "king",
  };
};
lens(584, 7, 1); lens(596, 4, 30); lens(660, 5, 18); lens(688, 8, 16);

// ---------------- 7: the STAFF ONLY corridor ----------------
const LDOOR: V3 = [18.75, 0, -3.45], LSTART: V3 = [18.55, 0, -0.5];
SHOT_CAMS[7] = () => [
  K(1371, F(() => ({ pos: [18.75, 1.4, -0.4] as V3, look: [18.75, 1.3, -4.0] as V3, fov: 44 }), 1371, 0.0016)),                           // the door (shape match)
  K(1380, F(() => fit([body(LDOOR, 0, 2.4, 0.6), body(LSTART, 0, 2.1, 0.4)], 22, 4, 42, 0.86), 1380, 0.0016, [[1440, 0.005, 10]]), 22),
  K(1452, (f) => { const k = sm(f, 1452, 1470); return { pos: lerp3([18.95, 1.45, -1.6], [18.85, 1.35, -3.0], k), look: [18.75, 1.3, -4.0] as V3, fov: 40 }; }, 10),
];
SHOT_ACTS[7] = (f, s) => {
  const w = walkPath(7, s, [LSTART, LDOOR], f, 1382, 1428);
  return {
    ctl: { lamps: 1, door: sm(f, 1456, 1468) },
    cast: [C("lady18", w.p, w.moving ? pose(null, { mode: "walk", phase: w.phase * 0.7, facing: w.facing, expr: "sly", sweat: 1, tilt: 6, armR: [[16, -2], [2, -34]] as A2, armRTop: true })
      : f < 1382 ? pose(null, { expr: "sly", facing: 1, look: 0.8 }) : flow(f, [
        [1428, { expr: "sly", facing: 1, sweat: 1, look: 0.4 }],
        [1436, { expr: "nervous", facing: 1, sweat: 1, armR: [[30, 20], [50, 18]] as A2, armL: [[-10, 22], [40, 20]] as A2, armRFront: true, armLFront: true }, 6],   // both hands on the knob
        [1455, { expr: "joy", facing: 1, tilt: 14, armR: [[30, 20], [50, 18]] as A2, armL: [[-10, 22], [40, 20]] as A2, armRFront: true, armLFront: true }, 2],      // peeks in, huge grin
      ]), { idx: 70 })],
    fx: fxs(f >= 1456 ? glowBurst("door" + Math.round(sm(f, 1456, 1470) * 10), [18.75, 1.3, -3.9], 1 + 4 * sm(f, 1456, 1470), 0.4 + 0.6 * sm(f, 1458, 1470), "255,236,200") : null),
    focus: [LDOOR[0], 1.6, LDOOR[2]],
    subj: "lady18",
  };
};
lens(1371, 3, 1); lens(1380, 5, 20); lens(1452, 5, 10);

// ---------------- 9: the banquet payoff ----------------
const HB: V3 = [0.5, 0, 2.5], KB: V3 = [-0.5, 0, 2.5];
const NOB: [string, V3, V3][] = [["noble1", [-1.75, 0, 2.1], [-1.2, 0, 1.75]], ["noble2", [1.75, 0, 2.1], [1.3, 0, 1.8]], ["noble3", [-2.1, 0, 3.4], [-1.55, 0, 3.15]], ["noble4", [2.1, 0, 3.4], [1.6, 0, 3.2]], ["lady18", [-1.15, 0, 1.25], [-0.65, 0, 1.15]]];
const FL9 = (): V3 => [HB[0] - 0.28, 2.34, HB[2] - 0.12];
SHOT_CAMS[9] = () => [
  K(1548, F(() => { const h = FL9(); return { pos: [h[0] + 2.7 * Math.sin(Math.PI + 0.3), h[1] - 0.3, h[2] + 2.7 * Math.cos(Math.PI + 0.3)] as V3, look: [h[0], h[1] - 0.36, h[2]] as V3, fov: 38 }; }, 1548, 0.0012)),
  K(1562, F(() => fit([body(HB, 0, 2.3, 0.45), body(KB, 0, 2.3, 0.45)], 196, 6, 40, 0.8), 1562, 0.0018, [[1630, 0.005, 10]]), 24),
  K(1650, F(() => fit([body(HB, 0, 2.3, 0.4), body(KB, 0, 2.3, 0.4), ...NOB.map((n) => body(n[2], 0, 2.1, 0.35))], 192, 10, 44, 0.9), 1650, 0.0018, [[1660, 0.006, 10]]), 20),
  K(1700, F(() => ({ pos: [3.6, 5.2, -1.4] as V3, look: [0.8, 0.9, 5.6] as V3, fov: 46 }), 1700, 0.0016, [[1745, 0.005, 12]]), 34),       // crane up over the banquet + menu
];
SHOT_ACTS[9] = (f, s) => {
  const ph12 = (f / 12) % 1, pinned = f >= 1630;
  const crowd = sm(f, 1652, 1664);
  const s1 = walkPath(9, s, [[-0.8, 0, 13.3], [-1.45, 0, 7.6]], f, 1700, 1745), s2 = walkPath(9, s, [[0.8, 0, 13.3], [1.45, 0, 6.3]], f, 1706, 1748);
  return {
    ctl: { lamps: 1, doors: sm(f, 1696, 1712), dishes: lin(f, 1714, 1762), menu: sm(f, 1736, 1752) },
    cast: [
      C("parm", HB, flow(f, [
        [1548, { expr: "smug", facing: -1, armR: [[24, -30], [30, -80]] as A2 }],
        [1560, { expr: "smile", facing: -1, armR: [[30, 10], [52, 6]] as A2, armRFront: true, propR: "potatoFlower" }, 6],                                    // offers the flower
        [1578, { expr: "proud", facing: -1, armR: [[24, 30], [30, 52]] as A2 }, 4],
        [1652, { expr: "shock", facing: -1, sweat: 1, tilt: -5, armR: [[30, -20], [44, -50]] as A2, armL: [[-30, -20], [-44, -50]] as A2 }, 2],              // mobbed
        [1700, { expr: "joy", facing: -1, armR: [[34, -6], [62, -30]] as A2, armL: [[-34, -6], [-62, -30]] as A2 }, 8],
      ]), { idx: 1 }),
      C(pinned ? "kingFlower" : "king", KB, flow(f, [
        [1548, { expr: "stern", facing: 1, look: 0.6 }],
        [1574, { expr: "eureka", facing: 1, armR: [[30, 10], [52, 6]] as A2, armRFront: true, propR: "potatoFlower" }, 4],                                     // takes it
        [1606, { expr: "smug", facing: 1, armR: [[22, 16], [4, 10]] as A2, armRFront: true, propR: "potatoFlower" }, 6],                                       // pins it on his coat
        [1630, { expr: "proud", facing: 1, armR: [[30, 30], [4, 74]] as A2, armL: [[-30, 30], [-4, 74]] as A2, tilt: -4 }, 3],                                  // admires it
        [1770, { expr: "joy", facing: 1, mouth: f % 6 < 3 ? "O" : "dash", armR: [[22, 16], [10, -16]] as A2, armRFront: true, propR: "potato" }, 3],           // tastes one
      ]), { idx: 60 }),
      ...NOB.map(([who, a, b], i) => C(who, lerp3(a, b, crowd), flow(f, [
        [1548, { expr: "neutral", facing: a[0] < 0 ? 1 : -1, look: a[0] < 0 ? 0.5 : -0.5 }],
        [1630, { expr: "eureka", facing: a[0] < 0 ? 1 : -1, look: a[0] < 0 ? 0.6 : -0.6 }, 1],
        [1652 + (i % 2), { expr: "joy", facing: a[0] < 0 ? 1 : -1, tilt: a[0] < 0 ? 8 : -8, armR: [[30, -10], [48, -40]] as A2, propR: "potatoFlower" }, 3],          // flowers held up
        [1702, { expr: i % 2 ? "laugh" : "joy", facing: a[0] < 0 ? 1 : -1, shake: 0.5, phase: ph12 + i * 0.2, armR: [[30, -10], [48, -40]] as A2, propR: "potatoFlower" }, 6],
      ]), { idx: 71 + i })),
      C("servant1", s1.p, s1.moving ? pose(null, { mode: "walk", phase: s1.phase, facing: s1.facing, expr: "proud", armR: [[26, 4], [34, -20]] as A2, propR: "potatoTray", propK: f / 10 }) : pose(null, { expr: "proud", facing: 1, armR: [[26, 4], [34, -20]] as A2, propR: "potatoTray", propK: f / 10 }), { idx: 80 }),
      C("servant2", s2.p, s2.moving ? pose(null, { mode: "walk", phase: s2.phase, facing: s2.facing, expr: "proud", armR: [[26, 4], [34, -20]] as A2, propR: "potatoTray", propK: f / 10 }) : pose(null, { expr: "proud", facing: -1, armR: [[26, 4], [34, -20]] as A2, propR: "potatoTray", propK: f / 10 }), { idx: 81 }),
    ],
    fx: fxs(
      f < 1556 ? flowerCard(FL9(), 0.42) : null,
      f >= 1630 && f < 1644 ? sparkle("pin", [KB[0] + 0.1, 1.45, KB[2]], f - 1630, 0.3) : null,
      f >= 1740 ? glowBurst("pay" + Math.round(sm(f, 1740, 1760) * 10), [0.4, 2.2, 6.0], 6, 0.35 * sm(f, 1740, 1760)) : null,
      f >= 1700 ? Array.from({ length: 14 }, (_, i) => { const t = ((f - 1700) * 0.012 + i * 0.071) % 1; return { kind: "card", key: "petal" + (i % 3), pos: [-2.6 + (i * 0.43) % 5.2 + 0.3 * Math.sin(f * 0.05 + i), 5.6 - 5.4 * t, 1.2 + (i * 0.77) % 8] as V3, w: 0.16, h: 0.12, rot: f * 0.05 + i, cw: 64, ch: 48,
        draw: (p) => { const g = p.g; g.fillStyle = INKC; g.beginPath(); g.ellipse(32, 24, 26, 16, 0, 0, 7); g.fill(); g.fillStyle = i % 2 ? "#c9b4f6" : "#ece4ff"; g.beginPath(); g.ellipse(32, 24, 21, 12, 0, 0, 7); g.fill(); } } as FxSpec; }) : null,
    ),
    focus: f < 1562 ? FL9() : f < 1700 ? [0, 1.8, 2.5] : [0.4, 1.2, 6.0],
    subj: f < 1562 ? null : f < 1700 ? "king" : null,
  };
};
lens(1548, 8, 1); lens(1562, 5, 24); lens(1650, 4, 20); lens(1700, 2, 30);
