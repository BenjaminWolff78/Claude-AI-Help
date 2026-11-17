// =====================================================================================================================
// Free hens, scenes 4-6 (the garden question, Bruno's light bin and spring, the trick in the garden, the town hall).

// ================================================= SCENE 4 (787-1034) LUC'S GARDEN -> THE STREET IN SPRING
const LB4: V3 = [-5.15, SW, -9.9], ZK4: V3 = [-6.55, SW, -9.2];
const SH4a = { pos: [-7.5, 0.95, -12.3] as V3, look: [-5.6, 0.72, -9.95] as V3, fov: 50 };
const s4a = F(() => SH4a, 787, 0.0022);
const BR4: V3 = [-8.8, SW, -4.35];
const s4bBase = F(() => ({ pos: [-7.5, 1.15, -1.0] as V3, look: [-8.55, 0.85, -3.95] as V3, fov: 54 }), 880, 0.0016);
const s4b = (f: number): Shot => { const c = s4bBase(f), up = 0.55 * Math.sin(Math.PI * lin(f, 897, 921)); return { ...c, look: [c.look[0], c.look[1] + up, c.look[2]] }; };   // tilts up with the flying bin
const bx4 = (f: number) => -8.6 + 0.08 * Math.min(Math.max(0, f - 945), 1018 - 945);
const bz4 = (f: number) => lerp(-4.5, -2.75, sm(f, 945, 976)), by4 = (f: number) => lerp(SW, 0.02, sm(f, 945, 976));
const s4c = (f: number): Shot => { const x = bx4(f) + 0.012 * Math.max(0, f - 1018), k = creep(f, 945, 0.0012); const look: V3 = [x + 0.5, 1.35, -3.2]; return { pos: lerp3(look, [x + 0.3, 1.5, 0.2], k), look, fov: 54, roll: 0 }; };
SHOT_CAMS[4] = () => [K(787, s4a, 1, true),
  K(857, glideTo(s4a, 857, s4b, 882, 2.0, [0, 0, 0], 0.75, 0.4), 1),      // crane up over the garden wall and down onto the street
  K(945, glideTo(s4b, 945, s4c, 978, 0.2), 1)];                           // glide along the row of bins as spring arrives
const FLICK = [[3, -6.4, 969], [4, -4.4, 994], [5, -2.4, 1019]] as [number, number, number][];
SHOT_ACTS[4] = (f, s) => {
  const cast: CastPlace[] = [];
  const ctl: Ctl = { truckX: 6, truckZ: TZ2, load: 0.2, tons: 0.6, pay: 310, spring: lin(f, 945, 995), petals: lin(f, 950, 990), cart: 0, b7l: f >= 1262 ? 0 : 0, clockH: 10.2,
    b3x: -7.3, b4x: -12.0, b5x: -17.0 };
  // the bin that flies up far too light (bin 2), then sits in Bruno's lap, then back on the pavement
  { const u = lin(f, 897, 915); ctl.b2y = f < 897 ? 0.03 * Math.sin(f * 0.9) * lin(f, 880, 896) : f < 915 ? 2.2 * Math.sin(Math.PI * u) + 0.3 * u : f < 945 ? 0.3 : 0.3 * (1 - sm(f, 945, 958));
    ctl.b2z = f < 897 ? 0 : -0.55 * sm(f, 897, 915); ctl.b2x = f < 897 ? 0 : 0.85 * sm(f, 897, 915) * (1 - sm(f, 945, 958)); ctl.b2r = f < 897 ? 0 : f < 915 ? 2.2 * u : 1.57 * (1 - sm(f, 945, 958)); ctl.b2l = sm(f, 926, 934) * (1 - sm(f, 945, 952)); ctl.b2f = 0.1; }
  for (const [i, x, f0] of FLICK) { if (i === 5 && f >= f0) { const r = sm(f, f0, f0 + 8); ctl.b5y = 1.75 * r; ctl.b5z = -0.55 * r; ctl.b5x = -17.0 + (bx4(f) + 0.25 - x) * r; ctl.b5yaw = (f - f0) * 0.45 * r; continue; }
    const u = lin(f, f0, f0 + 16); ctl[`b${i}y`] = 0.9 * Math.sin(Math.PI * u); ctl[`b${i}yaw`] = TAU_ * u; }
  if (f < 857) {
    cast.push(pecker("rousse", [-5.75, SW, -9.4], f, 20, 1, 1));
    const nh = f < 838 ? hen("neige", [-5.6, SW, -10.55], { facing: 1, headTilt: f >= 806 ? 18 * sm(f, 806, 812) : 0, phase: f / 30 }, 21) : henHop("neige", [-5.6, SW, -10.55], [-5.15, 1.2, -9.9], f, 838, 850, 21, 1, 0.35);
    cast.push(nh);
    cast.push(C("zoe", ZK4, flow(f, [[787, { expr: "blank", mode: "kneel", kneelK: 1, facing: 1, armR: [[20, 20], [30, 34]] as A2 }], [822, { expr: "blank", mode: "kneel", kneelK: 1, facing: 1, headTilt: 8, armR: [[22, -24], [6, -50]] as A2, armRFront: true }, 6]]), { idx: 4 }));
  }
  if (f >= 857 && f < 945) {
    const sitK = sm(f, 904, 912), p: V3 = [BR4[0], SW, BR4[2] - 0.15 * sitK];
    cast.push(C("bruno", p, flow(f, [
      [857, { expr: "smug", facing: 1, armR: AR.downR, armL: [[-20, 26], [-30, 40]] as A2 }],
      [872, { expr: "strain", mode: "brace", braceK: 1, facing: 1, tilt: 8, armR: [[24, 16], [36, 36]] as A2, armL: [[-10, 16], [14, 36]] as A2, armRFront: true, armLFront: true }, 8],
      [893, { expr: "strain", mode: "brace", braceK: 1, facing: 1, tilt: -6, armR: [[24, -20], [30, -52]] as A2, armL: [[-24, -20], [-30, -52]] as A2, armRFront: true, armLFront: true }, 4],   // heave
      [904, { expr: "yikes", mode: "sit", facing: 1, headBack: 0.5, armR: [[30, -10], [50, -30]] as A2, armL: [[-30, -10], [-50, -30]] as A2 }, 6],                                            // falls on his bottom
      [924, { expr: "aghast", mode: "sit", facing: 1, look: 0.4, armR: [[24, 4], [34, -6]] as A2, armRFront: true }, 6],                                                                       // peeks in: empty
    ]), { idx: 10 }));
  }
  if (f >= 945) {
    const x = bx4(f), walking = f < 1018, flickNow = FLICK.some(([, , f0]) => f >= f0 - 4 && f < f0 + 10);
    cast.push(C("bruno", [x, by4(f), bz4(f)], pose(null, { expr: flickNow || f >= 1019 ? "beam" : "smug", mode: walking ? "walk" : "stand", phase: ph(f, 15), facing: toward(4, s, f, [x, 0, bz4(f)], [x + 1, 0, bz4(f)]),
      armR: flickNow || f >= 1019 ? [[24, -22], [30, -58]] as A2 : AR.downR, armRFront: true, mouth: f % 40 < 20 && !flickNow ? "o" : undefined }), { idx: 10 }));   // whistles; one finger up
  }
  return { ctl, cast, fx: [], focus: follow(f, [[787, [-5.6, 0.75, -10.4]], [846, [-5.3, 1.2, -10.0], 8], [882, head(BR4), 16], [970, (g: number) => head([bx4(g), by4(g), bz4(g)]), 20]]), subj: f < 857 ? "neige" : "bruno" };
};
const TAU_ = Math.PI * 2;
lens3([[787, B_MS], [882, B_FS, 16], [962, B_FS]]);

// ================================================= SCENE 5 (1034-1498) THE TRICK, IN LUC'S GARDEN
const LOCK: V3 = [-9.48, 1.16, -12.98], OD5: V3 = [-8.95, SW, -12.72];
const SH5a = { pos: [-10.45, 1.45, -10.85] as V3, look: [-9.25, 1.15, -12.85] as V3, fov: 48 };
const s5a = F(() => SH5a, 1034, 0.0024);
const SH5b = { pos: [-7.4, 1.55, -7.25] as V3, look: [-7.4, 0.85, -9.6] as V3, fov: 50 };
const s5b = F(() => SH5b, 1100, 0.0018);
const SH5c = { pos: [-7.4, 1.3, -8.45] as V3, look: [-7.42, 0.8, -9.6] as V3, fov: 48 };
const s5c = F(() => SH5c, 1166, 0.0016);
const lucWalk = (f: number): V3 => { const u = lin(f, 1243, 1280); return [lerp(-4.55, -6.55, u), f < 1249 ? lerp(0.28, SW, lin(f, 1243, 1249)) : SW, lerp(-11.0, -10.75, u)]; };
const s5d0 = F(() => ({ pos: [-5.2, 1.5, -13.6] as V3, look: [-5.8, 1.0, -10.8] as V3, fov: 56 }), 1250, 0.0016);
const s5d = (f: number): Shot => { const c = s5d0(f), p = lucWalk(Math.min(f, 1290)); return { ...c, look: [lerp(c.look[0], p[0], 0.5), c.look[1], lerp(c.look[2], p[2], 0.5)] }; };
const ZK5: V3 = [-7.45, SW, -11.2];
const SH5e = { pos: [-6.0, 1.3, -14.4] as V3, look: [-7.85, 0.55, -11.55] as V3, fov: 54 };
const s5e = F(() => SH5e, 1320, 0.002);
const LD5: V3 = [-4.62, 0.28, -11.25], OF5: V3 = [-5.75, SW, -12.25];
const SH5f = { pos: [-8.6, 1.5, -9.4] as V3, look: [-6.14, 1.25, -11.12] as V3, fov: 56 };
const s5f = F(() => SH5f, 1394, 0.0018);
SHOT_CAMS[5] = () => [K(1034, s5a, 1, true),
  K(1080, glideTo(s5a, 1080, s5b, 1100, 0.3, [0.5, 0, 0]), 1),          // glide from the lock to the scale as the hens race over
  K(1152, glideTo(s5b, 1152, s5c, 1166), 1),                            // push in to the bowl
  K(1241, glideTo(s5c, 1241, s5d, 1270, 0.8), 1),                       // pull out to the back door
  K(1310, glideTo(s5d, 1310, s5e, 1326, 0.2), 1),                       // glide down to the nest
  K(1384, glideTo(s5e, 1384, s5f, 1404, 0.5, [0, 0, 0], 0, 0.6), 1)];                      // up and round to the doorway two-shot
SHOT_ACTS[5] = (f, s) => {
  const cast: CastPlace[] = [];
  const grams = f < 1074 ? 0 : f < 1086 ? 150 * lin(f, 1074, 1084) : f < 1152 ? lerp(150, 105, lin(f, 1100, 1150)) : lerp(105, 0, lin(f, 1158, 1236));
  const ctl: Ctl = { truckX: -60, cart: 0, spring: 0, clockH: 11, lock: sm(f, 1035, 1041), coopDoor: sm(f, 1046, 1060), grams, bowl: f < 1100 ? 1 : f < 1152 ? lerp(1, 0.72, lin(f, 1100, 1150)) : lerp(0.72, 0, lin(f, 1156, 1234)),
    runScraps: lin(f, 1283, 1300), pileEat: lin(f, 1330, 1498) * 0.6, eggT: f < 1360 ? -1 : f < 1374 ? lin(f, 1360, 1372) : 2, eggDX: 0.42, eggDZ: 0.26,
    toy: f >= 1312 ? 1 : 0, toyX: -7.95, toyZ: -11.2, toyYaw: 0.4, panHung: f >= 1472 ? 1 : 0, bucket: f < 1480 ? 1 : 0, b7l: 0.12 * Math.max(0, Math.sin((f - 1262) * 0.9)) * (f >= 1262 && f < 1276 ? 1 : 0) };
  // Odile and the key; the hens burst out and race to the crate
  if (f < 1100) cast.push(C("odile", OD5, flow(f, [
    [1034, { expr: "smug", facing: toward(5, s, f, OD5, LOCK), propR: "loopKey", propRAng: 0.4, armR: [[30, -6], [56, -12]] as A2, armRFront: true }],
    [1050, { expr: "smug", facing: toward(5, s, f, OD5, LOCK), propR: "loopKey", propRAng: 0.4 * Math.sin((f - 1050) * 0.3), armR: [[22, 4], [36, -8]] as A2, armRFront: true }, 8],   // twirls the key
  ]), { idx: 1 }));
  const runTo = (who: string, d: number, top: V3, idx: number) => {
    const a: V3 = [-9.85, 0.66, -13.35], g1: V3 = [-9.4 + d * 0.3, SW, -12.0], g2: V3 = [top[0] + 0.1, SW, -9.95];
    if (f < 1058 + d) return hen(who, a, { facing: 1, phase: f / 20 }, idx);
    if (f < 1068 + d) return henHop(who, a, g1, f, 1058 + d, 1068 + d, idx, 1, 0.3);
    if (f < 1086 + d) { const u = lin(f, 1068 + d, 1086 + d); return hen(who, lerp3(g1, g2, u), { mode: "run", phase: f / 4, facing: toward(5, s, f, g1, g2) }, idx); }
    if (f < 1094 + d) return henHop(who, g2, top, f, 1086 + d, 1094 + d, idx, 1, 0.25);
    return null;
  };
  const RT: V3 = [-7.64, 0.62, -9.78], NT: V3 = [-7.16, 0.62, -9.78];
  const peckK = (f0: number, f1: number) => (f >= f0 && f < f1 ? 30 * Math.sin(Math.PI * lin(f, f0, f1)) : 0);
  if (f < 1286) {
    const r = runTo("rousse", 0, RT, 20); if (r) cast.push(r);
    else if (f >= 1094) { const who = f >= 1174 && f < 1200 ? "rousseC" : "rousse", k = (f >= 1150 && f < 1174) || (f >= 1176 && f < 1198) ? 1 : 0;
      cast.push(hen(who, RT, { facing: 1, tilt: f < 1152 ? peckK(1100, 1112) + peckK(1124, 1136) : Math.max(peckK(1150, 1162), peckK(1176, 1188)), propK: k, headTilt: k ? -10 : 0, phase: f / 30 }, 20)); }
    const n = f >= 1241 ? null : runTo("neige", 6, NT, 21); if (f >= 1241) cast.push(hen("neige", NT, { facing: -1, tilt: peckK(1250, 1262) + peckK(1272, 1284), phase: f / 30 }, 21)); if (n) cast.push(n);
    else if (f >= 1100 && f < 1241) cast.push(hen("neige", NT, { facing: -1, tilt: f < 1152 ? peckK(1112, 1124) + peckK(1136, 1148) : peckK(1200, 1212), propK: f >= 1200 && f < 1226 ? 1 : 0, headTilt: f >= 1212 && f < 1226 ? -20 : 0, mouth: f >= 1212 && f < 1222 ? "O" : undefined, phase: f / 30 }, 21));
  }
  if (f >= 1060 && f < 1152) cast.push(C("luc", [-6.55, SW, -9.95], flow(f, [[1060, { expr: "smile", facing: -1, armR: AR.downR }], [1068, { expr: "proud", facing: -1, tilt: 8, armR: [[26, 14], [44, 30]] as A2, armRFront: true }, 6], [1090, { expr: "smile", facing: -1, armR: AR.downR }, 8]]), { idx: 2 }));
  if (f >= 1100 && f < 1152) cast.push(C("zoe", [-8.25, SW, -9.95], flow(f, [[1100, { expr: "joy", facing: 1 }], [1124, { expr: "joy", facing: 1, tilt: 12, armR: [[22, 10], [36, 20]] as A2 }, 8]]), { idx: 4 }));
  // the caddy walk
  if (f >= 1241 && f < 1310) {
    const p = lucWalk(f), walking = f < 1280;
    cast.push(C("luc", p, flow(f, [
      [1241, { expr: "smile", mode: walking ? "walk" : "stand", phase: ph(f, 15), facing: toward(5, s, f, p, [p[0] - 1, 0, p[2]]), propR: "caddyFull", armR: [[22, 14], [30, 26]] as A2, armRFront: true }],
      [1258, { expr: "smile", mode: walking ? "walk" : "stand", phase: ph(f, 15), facing: toward(5, s, f, p, [p[0] - 1, 0, p[2]]), propR: "caddyFull", armR: [[22, 14], [30, 26]] as A2, armRFront: true, armL: [[-24, -4], [-44, -14]] as A2, armLFront: true }, 4],   // knocks on the bin: hollow
      [1270, { expr: "smile", mode: walking ? "walk" : "stand", phase: ph(f, 15), facing: toward(5, s, f, p, [p[0] - 1, 0, p[2]]), propR: "caddyFull", armR: [[22, 14], [30, 26]] as A2, armRFront: true }, 6],
      [1282, { expr: "proud", facing: toward(5, s, f, p, [p[0] - 1, 0, p[2]]), tilt: 10, propR: f < 1292 ? "caddyFull" : "caddy", propRAng: 1.5 * sm(f, 1282, 1290), armR: [[28, 4], [48, 2]] as A2, armRFront: true }, 6],
    ]), { idx: 2 }));
    const P0 = [-7.2, SW, -10.6];
    if (f >= 1286) cast.push(...([["rousse", RT, 20, 0], ["neige", NT, 21, 3]] as [string, V3, number, number][]).map(([who, a, idx, d]) => { const end: V3 = [-7.2 + (idx === 20 ? -0.35 : 0.3), SW, -10.6 + (idx === 20 ? -0.25 : -0.3)], g: V3 = [a[0], SW, a[2] + 0.5];
      return f < 1294 + d ? henHop(who, a, g, f, 1286 + d, 1294 + d, idx, -1, 0.25) : f < 1308 + d ? hen(who, lerp3(g, end, lin(f, 1294 + d, 1308 + d)), { mode: "run", phase: f / 4, facing: toward(5, s, f, g, end) }, idx) : pecker(who, end, f, idx, 1, d); }));
    ([ ["henBlack", [-9.4, SW, -10.0], 22], ["henGold", [-6.4, SW, -12.4], 23]] as [string, V3, number][]).forEach(([who, a, idx], i0) => { const i = i0 + 2;
      const end: V3 = [P0[0] + [-0.35, 0.3, -0.2, 0.35][i], SW, P0[2] + [-0.25, -0.3, 0.32, 0.2][i]], u = lin(f, 1294 + i * 2, 1308 + i * 2);
      cast.push(u <= 0 ? pecker(who, a, f, idx, a[0] < P0[0] ? 1 : -1, i) : u < 1 ? hen(who, lerp3(a, end, u), { mode: "run", phase: f / 4, facing: toward(5, s, f, a, end) }, idx) : pecker(who, end, f, idx, end[0] < P0[0] ? 1 : -1, i));
    });
  }
  // the nest and the egg
  if (f >= 1310 && f < 1384) {
    cast.push(C("zoe", ZK5, flow(f, [
      [1310, { expr: "joy", mode: "kneel", kneelK: 1, facing: -1, propR: f < 1312 ? "toyTruck" : undefined, armR: [[22, 16], [36, 30]] as A2, armRFront: true }],
      [1330, { expr: "smile", mode: "kneel", kneelK: 1, facing: -1, armR: AR.downR }, 8],
      [1366, { expr: "joy", mode: "kneel", kneelK: 1, facing: -1, tilt: 8, armR: [[22, 16], [34, 30]] as A2, armRFront: true }, 6],
      [1374, { expr: "beam", mode: "kneel", kneelK: 1, facing: -1, propR: "egg", armR: [[22, -10], [30, -34]] as A2, armRFront: true }, 6],       // holds the egg up
    ]), { idx: 4 }));
    const NG: V3 = [-8.25, SW, -11.75], st0: V3 = [-7.88, SW, -11.85];
    const u = lin(f, 1326, 1346);
    cast.push(hen("neige", lerp3(st0, NG, u), f < 1346 ? { mode: f >= 1326 ? "walk" : "stand", phase: -(f - 1326) / 9, facing: 1, headTilt: f >= 1326 ? 6 : 0 } : { mode: "sit", facing: 1, squash: f >= 1350 && f < 1362 ? 0.6 * Math.sin(Math.PI * lin(f, 1350, 1362)) : 0, expr: f >= 1356 && f < 1362 ? "shock" : "neutral" }, 21));
    cast.push(pecker("rousse", [-7.0, SW, -10.7], f, 20, -1, 2));
    cast.push(C("luc", LD5, pose(null, { expr: "smile", facing: -1, propR: "roastPan", armR: [[20, 10], [30, 22]] as A2, armRFront: true }), { idx: 2 }));
  }
  // the ban: Luc's roasting pan, Odile's pledge, Rousse eating from the bucket
  if (f >= 1384) {
    cast.push(C("luc", LD5, flow(f, [
      [1384, { expr: "scheme", facing: toward(5, s, f, LD5, [-5.0, 0, -10.5]), propR: "roastPan", armR: [[22, -6], [36, -20]] as A2, armRFront: true, look: 0.4 }],
      [1448, { expr: "sheepish", facing: toward(5, s, f, LD5, [-5.0, 0, -10.5]), propR: "roastPan", armR: [[20, 10], [30, 22]] as A2, armRFront: true, look: 0.6, headTilt: -6 }, 8],          // looks at the full bucket
      [1464, { expr: "sheepish", facing: -toward(5, s, f, LD5, [-5.0, 0, -10.5]), propR: f < 1472 ? "roastPan" : undefined, armR: [[24, -18], [36, -40]] as A2, armRFront: true }, 6],     // hangs the pan up, sighing
      [1478, { expr: "smile", facing: toward(5, s, f, LD5, [-5.0, 0, -10.5]), propR: f >= 1480 ? "scrapBucket" : undefined, propRAng: 1.0 * sm(f, 1484, 1494), armR: [[26, 10], [46, 12]] as A2, armRFront: true }, 6],   // pours the scraps
    ]), { idx: 2 }));
    cast.push(C("odile", OF5, flow(f, [
      [1384, { expr: "calm", facing: toward(5, s, f, OF5, LD5), armR: AR.downR }],
      [1404, { expr: "smug", facing: toward(5, s, f, OF5, LD5), propR: "pledge", armR: [[24, -16], [30, -46]] as A2, armRFront: true }, 8],
    ]), { idx: 1 }));
    cast.push(pecker("rousse", [-5.05, SW, -10.55], f, 20, 1, 1));
  }
  const focus = follow(f, [[1034, LOCK], [1100, [-7.4, 0.8, -9.6], 18], [1166, [-7.4, 0.76, -9.6], 12], [1259, (g: number) => head(lucWalk(g)), 16], [1326, [-8.1, 0.4, -11.7], 14], [1404, head(LD5), 16]]);
  return { ctl, cast, fx: fxs(f >= 1262 && f < 1272 ? sparkle("knock", [-5.15, 1.0, -10.2], f - 1262, 0.22) : null), focus, subj: f < 1080 ? "odile" : f < 1241 ? "rousse" : f < 1310 ? "luc" : f < 1384 ? "neige" : "luc" };
};
lens3([[1034, B_CU], [1100, B_MS, 18], [1166, B_INS, 12], [1259, B_FS, 16], [1326, B_MS, 14], [1404, B_MS]]);

// ================================================= SCENE 6 (1498-1650) THE TOWN HALL STEPS: THE QUEUE
const BK6: V3 = [13.0, 0.30, 7.72], OH6: V3 = [13.28, 0.66, 8.68];
const QUEUE: [string, V3, string][] = [["henri", [12.35, SW, 6.35], "crate"], ["hbaker", [13.55, SW, 5.85], "crate"], ["granny2", [12.45, SW, 4.95], "basket"], ["regBeret", [13.5, SW, 4.05], "crate"], ["hneigh", [12.5, SW, 3.15], "crate"], ["regBlonde", [13.45, SW, 2.25], "basket"]];
const S6A = { pos: [10.3, 1.75, 1.4] as V3, look: [12.9, 1.15, 4.4] as V3, fov: 54 }, S6B = { pos: [11.05, 1.2, 7.05] as V3, look: [13.15, 1.0, 8.2] as V3, fov: 52 };
const s6 = (f: number): Shot => { const k = glide(lin(f, 1500, 1628)); return { pos: lerp3(S6A.pos, S6B.pos, k), look: lerp3(S6A.look, S6B.look, k), fov: lerp(S6A.fov, S6B.fov, k), roll: 0 }; };
SHOT_CAMS[6] = () => [K(1498, s6, 1, true)];
SHOT_ACTS[6] = (f, s) => {
  const cast: CastPlace[] = [];
  QUEUE.forEach(([who, p, prop], i) => { const shuffle = f >= 1500 + i * 6 && f < 1520 + i * 6; const q: V3 = [p[0], p[1], p[2] + 0.18 * sm(f, 1500 + i * 6, 1520 + i * 6)];
    cast.push(C(who, q, pose(null, { expr: i % 2 ? "smile" : "grin", mode: shuffle ? "walk" : "stand", phase: ph(f + i * 5, 14), facing: toward(6, s, f, q, BK6), look: 0.3, propR: prop, armR: [[22, 14], [30, 26]] as A2, armRFront: true, headTilt: 3 * Math.sin(st(f) * 0.1 + i) }), { idx: 50 + i })); });
  cast.push(C("bruno", BK6, flow(f, [
    [1498, { expr: "worry", mode: "kneel", kneelK: 1, facing: toward(6, s, f, BK6, OH6), armR: [[14, -10], [8, -34]] as A2, armL: [[-14, -10], [-8, -34]] as A2, armRFront: true, armLFront: true, look: 0.5 }],
    [1548, { expr: "worry", mode: "kneel", kneelK: 1, facing: toward(6, s, f, BK6, OH6), tilt: 6 * Math.sin((f - 1548) * 0.4), headTilt: 8, armR: [[10, -14], [2, -40]] as A2, armL: [[-10, -14], [-2, -40]] as A2, armRFront: true, armLFront: true, look: 0.6 }, 6],   // begs, hands clasped
    [1612, { expr: "beam", mode: "kneel", kneelK: 1, facing: toward(6, s, f, BK6, OH6), armR: [[22, 10], [30, 0]] as A2, armL: [[-22, 10], [-30, 0]] as A2, look: 0.3 }, 8],
  ]), { idx: 10 }));
  cast.push(C("odile", OH6, flow(f, [
    [1498, { expr: "calm", facing: toward(6, s, f, OH6, BK6), armR: AR.downR }],
    [1574, { expr: "smug", facing: toward(6, s, f, OH6, BK6), propR: f < 1600 ? "hen" : undefined, armR: [[26, -4], [48, -14]] as A2, armRFront: true }, 6],   // holds out a hen
    [1606, { expr: "smug", facing: toward(6, s, f, OH6, BK6), armR: AR.downR }, 8],
  ]), { idx: 1 }));
  if (f >= 1600) { const top: V3 = [BK6[0], 1.5, BK6[2] + 0.02]; cast.push(f < 1612 ? henHop("rousse", [13.18, 1.45, 8.42], top, f, 1600, 1612, 20, -1, 0.3) : hen("rousse", top, { mode: "sit", facing: -1, phase: f / 30, headTilt: 6 * Math.sin(f * 0.15) }, 20)); }
  return { ctl: { truckX: -60, cart: 0, spring: 1, petals: 1, clockH: 9.5 }, cast, fx: [], focus: follow(f, [[1498, head(QUEUE[1][1])], [1560, head(BK6), 30]]), subj: f < 1560 ? "hbaker" : "bruno" };
};
lens3([[1498, B_FS], [1560, B_MS, 30]]);
