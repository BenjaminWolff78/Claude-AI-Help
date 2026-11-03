
// =====================================================================================================================
// MINISTERE DES POSTES at night. Counter along x (public face z -0.2, top 1.05, grille to 2.4), clerks behind at
// z -1.62 (x -2.4 / 0 / 2.4); queue lane x 0, z 0.42..3.0; Lustig at the end [0, 0, 3.85]. Keep-out: MINISTRY_SOLIDS.
// =====================================================================================================================
// ---- S16 (1260-1376) "In Paris, real officials took bribes, / so asking for one / made him look real."
// A: a long lateral track along the counter from behind the queue: at each window a citizen slides an envelope under
// the grille, the clerk palms it into his drawer, the middle clerk thumps the APPROVE stamp. B (asking for one): the
// camera cranes down to the end of the queue, where Lustig stands among the citizens and tips his hat to the clerk,
// who nods back: he fits right in.
const CLK: V3[] = [[-2.4, 0, -1.62], [0, 0, -1.62], [2.4, 0, -1.62]], CIT: V3[] = [[-2.4, 0, 0.42], [0, 0, 0.42], [2.4, 0, 0.42]];
const LQ: V3 = [0.45, 0, 3.9];
SHOT_CAMS[16] = () => [
  K(1260, track((f) => [lerp(-3.1, -1.3, sm(f, 1286, 1316)), 1.85, 2.7], (f) => [lerp(-2.35, -0.05, sm(f, 1292, 1304)), 1.38, -1.1], 38, 1260, 0.0012)),
  K(1316, F(() => fit([body(LQ, 0, 2.1, 0.34), body([0, 0, 3.0])], -40, 4, 44, 0.8, 0, 0), 1316, 0.002, [[1355, 0.004, 14]]), 30),
];
SHOT_ACTS[16] = (f, s) => {
  const hand = (i: number) => { const a = 1266 + i * 16; return { give: sm(f, a, a + 6) - sm(f, a + 12, a + 16), take: sm(f, a + 8, a + 12) - sm(f, a + 16, a + 22) }; };
  const cit = ["paris3", "paris2", "paris1"].map((who, i) => {
    const h = hand(i);
    return C(who, CIT[i], pose(null, { expr: "sly", facing: faceTo(16, s, f, CIT[i], CLK[i]), armR: [[26, 10], [lerp(34, 60, h.give), lerp(30, 4, h.give)]] as A2, armRFront: true, propR: h.give > 0.2 ? "envelope" : undefined, headTilt: -3 * h.give }), { idx: 20 + i });
  });
  const clk = ["clerk1", "clerk2", "clerk3"].map((who, i) => {
    const h = hand(i), nod = i === 1 && f > 1350 ? Math.sin((f - 1350) * 0.4) * Math.exp(-(f - 1350) / 20) : 0;
    const stampArm = i === 1 && f >= 1294 && f < 1310 ? { armL: [[-20, -8], [-26, lerp(-30, 10, sm(f, 1296, 1301)) + lerp(0, -30, sm(f, 1302, 1308))]] as A2, armLFront: true } : {};
    return C(who, CLK[i], pose(null, { expr: h.take > 0.3 ? "smug" : i === 1 && f > 1350 ? "smug" : "neutral", facing: faceTo(16, s, f, CLK[i], i === 1 && f > 1340 ? LQ : CIT[i]), armR: [[26, 6], [lerp(30, 54, h.take), lerp(20, 2, h.take)]] as A2, armRFront: true, propR: h.take > 0.4 ? "envelope" : undefined, headTilt: 5 * nod, ...stampArm }), { idx: 30 + i });
  });
  const tip = sm(f, 1352, 1360) - sm(f, 1368, 1374);
  return {
    ctl: { drawers: sm(f, 1282, 1330), stamp: lin(f, 1296, 1306) },
    cast: [C("lustig", LQ, pose(null, { expr: f > 1345 ? "smug" : "neutral", facing: faceTo(16, s, f, LQ, CLK[1]), hatLift: 0.16 * tip, hatTilt: -10 * tip, ...(tip > 0.05 ? { armL: [[-30, -14], [-22, -62]] as A2 } : { armR: ARMS.holdR, propR: "envelope", armRFront: true }) }), { shadow: true }),
      ...cit, ...clk,
      idler("buyer", [0, 0, 1.3], f, 1, -1, { expr: "neutral" }), idler("newsboy", [0, 0, 2.15], f, 2, 1, { expr: "smile" }), idler("paris4", [0, 0, 3.0], f, 3, -1, { expr: "neutral", propR: "envelope", armR: ARMS.holdR, armRFront: true })],
    focus: f < 1318 ? [lerp(-2.35, -0.05, sm(f, 1292, 1304)), 1.5, -1.0] : [0, 1.6, 3.85], subj: f < 1340 ? null : undefined,
  };
};
lens(1260, 5, 1); lens(1318, 7, 16);
