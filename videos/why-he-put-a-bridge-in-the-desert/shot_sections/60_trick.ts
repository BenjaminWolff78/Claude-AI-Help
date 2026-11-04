
// =====================================================================================================================
// SCENE 7 (1203-1409) HOME BASE B at NIGHT (deep blue, the green desk lamp): the explanation in its own time and light.
// "That's the trick. He was never selling a bridge. He was selling the desert around it. Ever pulled off the highway to
// see a giant dinosaur? Same thing." The boss holds the tiny model bridge over his tabletop town (stinger on "trick"),
// sets it down at the centre; the tiny lots light up and flip to SOLD outward from it while he spreads his arms; the agent
// leans in, amazed. The camera dips to model level along the tiny highway: a tiny car pulls off at the tiny dinosaur and
// then drives on into the tiny town; the boss gives a sly wink on "Same thing".
const M_BOSS: V3 = D_OFF([-2.4, 0, 0.22]), M_AGENT: V3 = D_OFF([-0.95, 0, 0.42]), M_BRIDGE: V3 = D_OFF([-2.4, 0.94, 1.05]);
SHOT_CAMS[7] = () => [
  K(1203, F(() => ({ pos: D_OFF([-1.0, 1.55, 3.3]), look: D_OFF([-2.4, 1.1, 1.0]), fov: 38 }), 1203, 0.0022, [[1215, 0.006, 10]])),
  K(1265, F(() => ({ pos: D_OFF([-1.15, 2.55, 2.85]), look: D_OFF([-2.4, 0.95, 0.95]), fov: 42 }), 1265, 0.0016, [[1289, 0.005, 10]]), 36),
  K(1321, F(() => ({ pos: D_OFF([-3.7, 1.16, 3.0]), look: D_OFF([-2.6, 1.35, 0.6]), fov: 42 }), 1321, 0.0018), 30), // model level inside the room, along the tiny highway past the tiny dinosaur to the boss
  K(1381, F(() => fit([body(M_BOSS, 0.9, 2.2, 0.42)], 200, 6, 38, 0.6), 1381, 0.002, [[1391, 0.006, 8]]), 18),
];
SHOT_ACTS[7] = (f) => ({
  ctl: { night: 1, door: 0, fan: 0.4, sweat: 0.2, modelBridge: sm(f, 1241, 1257), modelLots: sm(f, 1281, 1317), modelCars: lerp(0, 0.62, sm(f, 1325, 1403)), dig: 1, water: 1, grow: 0.15, site: 0, bossCar: 1, bossCarHide: 1, lamps: 1 },
  cast: [
    C("boss", M_BOSS, flow(f, [
      [1203, { expr: "sly", facing: 1, armR: [[26, 26], [40, 36]] as A2, armL: [[-26, 26], [-40, 36]] as A2, armRFront: true, armLFront: true }],   // holds the tiny bridge
      [1241, { expr: "determined", facing: 1, armR: [[26, 34], [40, 50]] as A2, armL: [[-26, 34], [-40, 50]] as A2, armRFront: true, armLFront: true }], // sets it down
      [1273, { expr: "beam", facing: 1, armR: ARMS.wideR, armL: ARMS.wideL }, 10],                                                                  // "...the desert around it"
      [1321, { expr: "sly", facing: 1, look: 0.6, armR: [[26, 30], [46, 42]] as A2, armRFront: true }],                                              // points at the tiny highway
      [1389, { expr: "sly", facing: -1, headTilt: 8, armR: [[26, 30], [30, 50]] as A2 }, 6],                                                       // "Same thing." wink
    ]), { idx: 1 }),
    C("agent", M_AGENT, flow(f, [
      [1203, { expr: "neutral", facing: -1, armR: [[26, 30], [30, 50]] as A2 }],
      [1279, { expr: "eureka", facing: -1, tilt: -6, squash: -0.04 }, 10],                    // leans in, amazed
      [1355, { expr: "smile", facing: -1, tilt: -3 }],
    ]), { idx: 7 }),
  ],
  fx: fxs(f >= 1255 && f < 1271 ? sparkle("seat", [M_BRIDGE[0], M_BRIDGE[1] + 0.12, M_BRIDGE[2]], f - 1256, 0.3) : null),
  focus: f < 1321 ? [M_BRIDGE[0], 1.2, M_BRIDGE[2]] : f < 1381 ? D_OFF([-2.6, 0.95, 1.6]) : [M_BOSS[0], 1.8, M_BOSS[2]],
  subj: "boss",
});
lens(1203, 7, 1); lens(1265, 6, 24); lens(1321, 10, 20); lens(1381, 7, 16);

// =====================================================================================================================
// SCENE 8 (1409-1615, hard cut = the next morning) HOME BASE B by day: "The first week, a few cars stopped to look. Three
// years later, almost two million people a year. And while they were there, they bought a lot."
// Ride alongside the family station wagon down Main Street; the kids point back at the bridge; it pulls up at the office.
// The camera rises to the office front: the boss beams in the doorway while the VISITORS board on the storefront spins
// up to 2,000,000 and the town fills in behind (new houses, palms, bunting). Salesman A hurries out with the lot map and,
// on "lot", stamps SOLD on it against the car door.
const wagU8 = (f: number) => lerp(0.86, 1, sm(f, 1409, 1454));
const SA_KERB: V3 = [39.6, 0, 99.25], BOSS_DOOR: V3 = [39.1, 0.02, 105.65];
const COUNTER: V3 = [39.0, 2.85, 103.95];
const visitors = (f: number) => Math.round(2000000 * (1 - (1 - lin(f, 1470, 1534)) ** 3) / 1000) * 1000;
const counterCard = (f: number): FxSpec => {
  const n = f < 1470 ? 0 : visitors(f), txt = n.toLocaleString("en-US");
  return { kind: "card", key: "visitors_" + n, pos: COUNTER, w: 2.0, h: 0.83, cw: 360, ch: 150,
    draw: (p) => { const g = p.g; g.fillStyle = "#241726"; g.beginPath(); g.roundRect(0, 0, 360, 150, 14); g.fill(); g.fillStyle = "#1f6f78"; g.beginPath(); g.roundRect(8, 8, 344, 134, 10); g.fill();
      g.fillStyle = "#ffe7a6"; g.font = "900 30px Georgia"; g.textAlign = "center"; g.fillText("VISITORS", 180, 46);
      g.fillStyle = "#ffffff"; g.font = "900 62px Georgia"; g.fillText(txt, 180, 118, 330); } };
};
SHOT_CAMS[8] = () => [
  K(1409, (f) => { const w = desertWagon(wagU8(f)), c = Math.cos(w.yaw), sn = Math.sin(w.yaw); return { pos: [w.pos[0] + c * 6.5 + sn * 1.5, 2.3, w.pos[2] - sn * 6.5 + c * 1.5] as V3, look: [w.pos[0] + sn * 0.8, 1.1, w.pos[2] + c * 0.8] as V3, fov: 40 }; }, 1, true),
  K(1460, F(() => fit([body([38.6, 0, 100.95], 0, 1.5, 2.6), body(BOSS_DOOR, 0, 2.1, 0.42), [COUNTER, -0.35, 0.35, 0.8]], 192, 24, 40, 0.92), 1460, 0.0018, [[1498, 0.005, 10]]), 26),
  K(1548, F(() => fit([body([38.6, 0, 100.95], 0, 1.5, 2.0), body(SA_KERB, 0, 2.0, 0.4), body(BOSS_DOOR, 0, 2.1, 0.42)], 196, 22, 40, 0.94), 1548, 0.0018, [[1590, 0.006, 8]]), 22),
];
SHOT_ACTS[8] = (f, s) => {
  const seats = desertWagonSeats(wagU8(f), 0), sa = walkPath(8, s, [SALES_A, [42.9, 0.1, 102.7], [42.4, 0, 99.6], SA_KERB], f, 1546, 1580);
  const stamp = sm(f, 1586, 1592) * (1 - sm(f, 1592, 1598));
  return {
    ctl: { wagon: wagU8(f), wagon2: 0, wagonDoor: 0, dig: 1, water: 1, grow: lerp(0.3, 0.8, sm(f, 1470, 1534)), site: 0, bossCar: 1, bossCarHide: 1, door: 1, night: 0, fan: 0.6, sweat: 0.6, numbered: 1 },
    cast: [
      C("dad", seats.driver, pose(null, { ...ACT.drive, expr: f > 1454 ? "beam" : "smile", facing: 1 }), { idx: 20 }),
      C("mom", seats.front, pose(null, { ...ACT.seat, expr: f > 1460 ? "eureka" : "smile", facing: 1 }), { idx: 21 }),
      C("kidBoy", seats.rearL, flow(f, [[1409, { ...ACT.seat, expr: "smile", facing: 1 }], [1424, { ...ACT.seatPoint, facing: -1 }]]), { idx: 22 }),
      C("kidGirl", seats.rearR, flow(f, [[1409, { ...ACT.seat, expr: "smile", facing: 1 }], [1432, { ...ACT.seatPoint, facing: -1 }]]), { idx: 23 }),
      C("salesA", sa.p, sa.moving ? pose(null, { mode: "stride", phase: sa.phase, facing: sa.facing, expr: "pitch", propR: "brochure", armR: [[28, 10], [40, -6]] as A2, armRFront: true }) : flow(f, [
        [1409, { expr: "eureka", facing: -1, propR: "brochure", armR: [[28, 10], [40, -6]] as A2, armRFront: true }],
        [1578, { expr: "pitch", facing: -1, propR: "brochure", armR: [[28, 10], [40, -6]] as A2, armRFront: true }],
        [1584, { expr: "beam", facing: -1, armR: [[28, -10], [40, -40 + 34 * stamp]] as A2, armRFront: true, armL: [[-28, 20], [-40, 20]] as A2, armLFront: true }, 4],
      ]), { idx: 2 }),
      C("boss", BOSS_DOOR, flow(f, [[1409, { expr: "beam", facing: -1, ...PZ.hips }], [1500, { expr: "beam", facing: -1, armR: [[30, -14], [46, -50 + 8 * Math.sin(f * 0.5)]] as A2 }, 10]]), { idx: 1 }),
      C("salesB", SALES_B, flow(f, [[1409, { expr: "neutral", facing: 1, armR: [[30, 30], [40, 46]] as A2, propR: "sandJar" }], [1500, { expr: "eureka", facing: 1, ...PZ.cheer }, 10]]), { idx: 3 }),
    ],
    fx: fxs(counterCard(f),
      f >= 1534 && f < 1548 ? sparkle("counter", [COUNTER[0] - 0.5, COUNTER[1] + 0.3, COUNTER[2] - 0.1], f - 1534, 0.4) : null,
      f >= 1592 ? { kind: "card", key: "soldStamp", pos: [39.0, 1.1, 99.7], w: 0.55, h: 0.3, cw: 220, ch: 120,
      draw: (p) => { const g = p.g; g.save(); g.translate(110, 60); g.rotate(-0.18); g.strokeStyle = "#d8302a"; g.lineWidth = 9; g.strokeRect(-96, -44, 192, 88); g.font = "900 64px Georgia"; g.textAlign = "center"; g.fillStyle = "#d8302a"; g.fillText("SOLD", 0, 22); g.restore(); } } : null,
      f >= 1592 && f < 1606 ? sparkle("sold", [39.0, 1.35, 99.6], f - 1592, 0.45) : null),
    focus: f < 1460 ? desertWagon(wagU8(f)).pos.map((v, i) => v + [0, 1.2, 0][i]) as V3 : f < 1548 ? [COUNTER[0], 1.6, COUNTER[2]] : [39.2, 1.4, 99.8],
    subj: f < 1460 ? "dad" : f < 1548 ? "boss" : "salesA",
  };
};
lens(1409, 4, 1); lens(1460, 5, 20); lens(1548, 5, 16);
