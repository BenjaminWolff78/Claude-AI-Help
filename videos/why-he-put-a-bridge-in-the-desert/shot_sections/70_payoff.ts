
// =====================================================================================================================
// SCENE 9 (1615-1914) HOME BASE A, the PAYOFF in the brightest light (hard cut = three years later). "Boats went under
// it. Tourists went over it. And the salesmen finally stopped selling sand. The sign got repainted: 'Population: ten
// thousand.' That's ten thousand people living in Nowhere. All because..."
// Water level on the town side: motorboats run out under the arches toward camera. The camera cranes up the bridge face
// to the deck: the family strolls over it. The two salesmen at the parapet: salesman B tips his jar of sand into the
// river and both lean back with ice creams. A glide to the town sign: the painter turns "POP. 300" into "10,000". The
// camera rises over the busy town, then settles on the boss at the parapet: on "Nowhere" he sets the MR. NOWHERE plate
// on the stone, and a calm, held smile carries "All because..." back into frame 1.
const P_BOSS: V3 = [2.2, 10.5, 5.8], P_SA: V3 = [5.6, 10.5, 5.75], P_SB: V3 = [6.9, 10.5, 5.6];
const FAM: { who: string; a: V3; b: V3; idx: number }[] = [
  { who: "dad", a: [17.5, 10.5, 2.6], b: [10.4, 10.5, 2.9], idx: 20 },
  { who: "mom", a: [18.7, 10.5, 3.4], b: [11.5, 10.5, 3.6], idx: 21 },
  { who: "kidBoy", a: [16.2, 10.5, 3.7], b: [9.3, 10.5, 4.0], idx: 22 },
  { who: "kidGirl", a: [19.6, 10.5, 2.4], b: [12.5, 10.5, 2.6], idx: 23 },
];
const SIGN9: V3 = [22, 0, 36];
const boats9 = (f: number) => lerp(0.6, 1.0, lin(f, 1615, 1914));
const plateP = (f: number): V3 => lerp3([P_BOSS[0] + 0.32, 11.55, P_BOSS[2] + 0.1], [P_BOSS[0] + 0.62, 11.78, 6.72], sm(f, 1862, 1872));
SHOT_CAMS[9] = (s) => [
  K(1615, F(() => ({ pos: [3.0, 2.6, -46] as V3, look: [1.2, 2.6, -8] as V3, fov: 42 }), 1615, 0.0018), 1, true),               // "Boats went under it."
  K(1640, F(() => ({ pos: [3.5, 12.4, 1.6] as V3, look: [14, 11.3, 3.2] as V3, fov: 42 }), 1640, 0.0016), 26),                       // "Tourists went over it." (they stroll toward us)
  K(1668, F(() => fit([body(P_SA, 0, 2.1, 0.42), body(P_SB, 0, 2.1, 0.42), [[P_SB[0], 7.5, P_SB[2] + 1.0], 0, 2.5, 0.6]], 18, 24, 40, 0.88), 1668, 0.0018, [[1704, 0.005, 10]]), 22),
  K(1736, F(() => fit([body(s.marks.painterSign, 0, 2.0, 0.42), [SIGN9, 1.2, 5.2, 2.6]], 236, 6, 40, 0.9), 1736, 0.0018, [[1786, 0.006, 10]]), 30), // the sign
  K(1818, F(() => ({ pos: [52, 30, 70] as V3, look: [6, 4, 8] as V3, fov: 42 }), 1818, 0.0014), 30),                      // "ten thousand people"
  K(1852, F(() => fit([body(P_BOSS, 0.55, 2.25, 0.5), [[P_BOSS[0] + 0.62, 11.6, 6.72], 0, 0.3, 0.3]], 14, 16, 38, 0.66, 0.1), 1852, 0.0016, [[1868, 0.004, 10]]), 26), // the plate, the calm smile
];
SHOT_ACTS[9] = (f, s) => {
  const tip = sm(f, 1696, 1708) * (1 - sm(f, 1716, 1726));
  return {
    ctl: { dig: 1, water: 1, grow: 1, boats: boats9(f), site: 0, popPaint: lerp(0.15, 1, sm(f, 1746, 1800)), wagon2: 1, bossCar: 1, bossCarHide: 1, lamps: 0, numbered: 0 },
    cast: [
      C("boss", P_BOSS, flow(f, [
        [1615, { expr: "proud", facing: 1, armR: [[26, 30], [30, 52]] as A2 }],
        [1622, { expr: "beam", facing: 1, armL: [[-30, -14], [-46, -50 + 8 * Math.sin(f * 0.4)]] as A2 }, 10],   // waves to a boat
        [1690, { expr: "smile", facing: 1, armR: [[26, 30], [30, 52]] as A2 }, 10],
        [1846, { expr: "calm", facing: 1, armR: [[26, 26], [44, 30]] as A2, armRFront: true }, 10],               // takes out the plate
        [1862, { expr: "calm", facing: 1, armR: [[28, 20], [56, 26]] as A2, armRFront: true }, 10],               // sets it on the stone
        [1876, { expr: "calm", facing: 1, headTilt: 4, armR: [[26, 30], [30, 52]] as A2 }, 12],                   // "All because..."
      ]), { idx: 1 }),
      C("salesA", P_SA, flow(f, [
        [1615, { ...ACT.brochure, expr: "pitch", facing: 1 }],
        [1676, { expr: "neutral", facing: -1, armR: [[26, 30], [30, 52]] as A2, propR: "brochure" }, 10],
        [1712, { ...ACT.iceCream, facing: -1, tilt: -6 }, 10],                                                      // "...finally stopped"
      ]), { idx: 2 }),
      C("salesB", P_SB, flow(f, [
        [1615, { ...ACT.jar, expr: "pitch", facing: 1 }],
        [1680, { expr: "neutral", facing: 1, armR: [[30, 30], [40, 46]] as A2, propR: "sandJar" }, 8],
        [1696, { expr: "grin", facing: 1, armR: [[30, -10], [52, -22]] as A2, armRFront: true, propR: "sandJar", propRAng: -1.4 * tip }, 10], // tips the sand into the river
        [1724, { ...ACT.iceCream, facing: -1, tilt: -6 }, 10],
      ]), { idx: 3 }),
      ...FAM.map((m, i) => { const w = walkPath(9, s, [m.a, m.b], f, 1626 + i * 3, 1676 + i * 3);
        return C(m.who, w.p, w.moving ? pose(null, { mode: "stride", phase: w.phase, facing: w.facing, expr: "beam" }) :
          i === 0 ? pose(null, { ...ACT.photo, expr: "beam", facing: 1 }) : i === 2 ? pose(null, { expr: "eureka", facing: 1, ...PZ.pointRUp }) : i === 3 ? pose(null, { ...ACT.iceCream, facing: -1 }) : pose(null, { expr: "smile", facing: 1, armR: [[24, 30], [30, 50]] as A2 }), { idx: m.idx }); }),
      C("painter", s.marks.painterSign, flow(f, [[1615, { ...ACT.paintUp, expr: "determined", facing: 1 }], [1802, { expr: "beam", facing: -1, ...PZ.cheer }, 10]]), { idx: 24 }),
      ...[0, 1].map((i) => { const b = desertBoat(i, boats9(f)); return C("boater", [b.pos[0], b.pos[1] + 0.42, b.pos[2]], pose(null, { mode: "sit", expr: "beam", facing: i ? 1 : -1, armR: [[30, -14], [44, -50]] as A2 }), { idx: 27 + i }); }),
      C("tourist1", [-5.5, 10.5, -4.6], pose(null, { ...ACT.photo, expr: "smile", facing: 1 }), { idx: 25 }),
      C("tourist2", [-4.2, 10.5, -5.0], pose(null, { expr: "beam", facing: 1, ...PZ.pointRUp }), { idx: 26 }),
    ],
    fx: fxs(...[0, 1, 2, 3].map((i) => sparkle("w" + i, [-10 + i * 7, -0.3, 12 + (i % 2) * 5], ((f - 1615 + i * 9) % 22), 0.9)),
      f >= 1700 && f < 1730 ? dustCard("sandpour", [P_SB[0] + 0.5, lerp(11.2, 4, lin(f, 1700, 1730)), P_SB[2] + 1.2], 0.7, 0.8 * (1 - lin(f, 1716, 1730)), 3) : null,
      f >= 1800 && f < 1814 ? sparkle("pop", [SIGN9[0], 3.6, SIGN9[2]], f - 1800, 1.0) : null,
      f >= 1846 ? plateCard("para", plateP(f), 1, 0.5) : null,
      f >= 1870 && f < 1884 ? sparkle("plate9", [P_BOSS[0] + 0.62, 11.95, 6.72], f - 1870, 0.35) : null),
    focus: f < 1640 ? [1.5, 0.5, -28] : f < 1668 ? [FAM[0].b[0], 11.6, FAM[0].b[2]] : f < 1736 ? [P_SA[0], 11.6, P_SA[2]] : f < 1818 ? [SIGN9[0], 3.2, SIGN9[2]] : f < 1852 ? [6, 6, 8] : [P_BOSS[0], 12, P_BOSS[2]],
    subj: f < 1640 ? null : f < 1668 ? "dad" : f < 1736 ? "salesB" : f < 1818 ? "painter" : f < 1852 ? null : "boss",
  };
};
lens(1615, 3, 1); lens(1640, 4, 24); lens(1668, 6, 20); lens(1736, 4, 24); lens(1818, 0.5, 24); lens(1852, 8, 24);
