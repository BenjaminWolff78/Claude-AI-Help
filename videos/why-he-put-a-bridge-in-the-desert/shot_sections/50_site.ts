
// =====================================================================================================================
// SCENE 5 (811-1108) HOME BASE A, the finished bridge on DRY sand (the fake-out). "And nobody came. Not a car. Not a
// tourist. Just one lizard crossing to nowhere. 'Pretty sure he's lost it,' the salesmen said. So what's a bridge with
// no river for? He just said, 'Get me a bulldozer.'"
// Dissolve from the toy bridge on toy sand to the real one (same angle): the boss alone on the deck waving a welcome
// pennant. Deck level: a tumbleweed rolls down the empty roadway ("not a car"); the salesmen hold up brochures to an
// empty road ("not a tourist"); the camera drops to lizard height: one lizard scuttles across and the boss bows it
// through like a doorman. The salesmen whisper and snicker. He leans on the parapet looking down at the dry sand (the
// question), straightens and, calm, points down: the bulldozer roars in below.
const B5: V3 = [-3.6, 10.5, 4.9], SA5: V3 = [6.2, 10.5, -4.2], SB5: V3 = [7.5, 10.5, -3.5];
const LIZ5: V3[] = [[5.5, 10.5, 1.9], [-11, 10.5, 2.3]];
const liz5 = (f: number) => polyAt(LIZ5, lin(f, 884, 952)).p;
const dozer5 = (f: number) => lerp(0, 0.16, sm(f, 1082, 1106));
const dozCam5 = (f: number) => desertDozer(dozer5(f), 0).pos;
SHOT_CAMS[5] = () => [
  K(811, F(() => ({ pos: [31, 22, 44] as V3, look: [0, 8.5, 0] as V3, fov: 40 }), 811, 0.0028)),
  K(815, F(() => fit([body(B5, 0, 2.3, 0.6)], 35, 12, 40, 0.62, -0.15), 815, 0.0022), 11),                       // push in on the boss waving: "And nobody came."
  K(832, F(() => ({ pos: [-8.5, 12.4, 5.3] as V3, look: [8, 11.0, 2.6] as V3, fov: 42 }), 832, 0.0016), 1, true),    // "Not a car." down the empty roadway
  K(858, F(() => ({ pos: [1.5, 12.0, -2.4] as V3, look: [7.0, 11.3, -4.0] as V3, fov: 42 }), 858, 0.0018), 1, true),  // "Not a tourist."
  K(882, F((f) => { const p = liz5(f); return { pos: [p[0] + 1.35, 10.78, p[2] - 0.55] as V3, look: [p[0] - 0.6, 10.7, p[2] + 0.35] as V3, fov: 38 }; }, 882, 0.0008), 1, true), // lizard height
  K(940, F(() => ({ pos: [11.8, 12.0, -2.0] as V3, look: [6.8, 11.3, -4.0] as V3, fov: 42 }), 940, 0.002, [[944, 0.005, 8]]), 1, true), // "Pretty sure he's lost it"
  K(1002, F(() => fit([body(B5, 0, 2.3, 0.6)], 14, 12, 42, 0.56, -0.4), 1002, 0.0018, [[1078, 0.005, 10]]), 1, true), // leans on the parapet over the dry riverbed
  K(1087, F((f) => fit([body(dozCam5(f), 0, 3.2, 1.7)], 62, 6, 40, 0.62, 0, 0.4), 1087, 0.0016), 1, true),       // the bulldozer roars in below
];
SHOT_ACTS[5] = (f, s) => {
  const lp = liz5(f), lizOn = f > 884 && f < 952;
  return {
    ctl: { dig: 0, water: 0, built: 1, numbered: 1, site: 0, dozerShow: f >= 1076 ? 1 : 0, dozer: dozer5(f), dozerBlade: 1, ...(f < 884 ? { tumbleDeck: lin(f, 828, 872) } : {}), bossCar: 0, lamps: 0, truck: 1 },
    cast: [
      C("boss", B5, flow(f, [
        [811, { ...ACT.pennant, expr: "beam", facing: 1, propRAng: 0.25 * Math.sin(f * 0.35) }],             // welcome!
        [836, { ...ACT.pennant, expr: "neutral", facing: 1, propRAng: 0.08 * Math.sin(f * 0.2) }, 12],       // ...nobody
        [862, { expr: "calm", facing: 1, armR: [[26, 30], [30, 52]] as A2, propR: "pennant" }, 10],
        [900, { expr: "beam", facing: 1, tilt: 10, armR: [[30, 10], [56, 20]] as A2, armRFront: true, propR: "pennant" }, 10], // bows the lizard through
        [936, { expr: "calm", facing: 1, armR: [[26, 30], [30, 52]] as A2, propR: "pennant" }, 10],
        [1004, { expr: "stare", facing: 1, tilt: 8, headTilt: 10, armR: [[26, 30], [30, 52]] as A2, armL: [[-26, 30], [-30, 52]] as A2 }, 12], // leans on the parapet, looks down
        [1060, { expr: "calm", facing: -1, armR: [[26, 30], [30, 52]] as A2 }, 10],                         // straightens, turns
        [1076, { expr: "sly", facing: -1, armR: [[26, 20], [40, 36]] as A2, armRFront: true, mouth: talk(f, 1076, 1102) }, 8], // "Get me a bulldozer."
      ]), { idx: 1 }),
      C("salesA", SA5, flow(f, [
        [811, { ...ACT.brochure, expr: "pitch", facing: 1, sweat: 0.6 }],
        [858, { expr: "pitch", facing: 1, sweat: 0.6, armR: [[30, -14], [44, -46]] as A2, propR: "brochure" }, 8], // holds it up to the empty road
        [884, { expr: "bored", facing: 1, sweat: 0.6, armR: [[26, 30], [30, 52]] as A2, propR: "brochure" }, 10],
        [942, { expr: "smug", facing: 1, sweat: 0.6, tilt: 8, armL: [[-20, 10], [-34, -18]] as A2, mouth: talk(f, 942, 986) }, 8], // whispers
        [1088, { expr: "shock", facing: 1, sweat: 0.6, squash: -0.05 }, 6],
      ]), { idx: 2 }),
      C("salesB", SB5, flow(f, [
        [811, { ...ACT.jar, expr: "pitch", facing: 1 }],
        [862, { ...ACT.jar, expr: "pitch", facing: 1, armR: [[34, -6], [60, -22]] as A2 }, 8],
        [884, { expr: "dismay", facing: 1, ...PZ.shrug, propR: "sandJar" }, 10],
        [952, { expr: "grin", facing: -1, armR: [[22, 0], [10, -26]] as A2, armRFront: true, propL: "sandJar", phase: ph(f, 10), shake: 0.5 }, 8], // snickers
        [1088, { expr: "shock", facing: -1, squash: -0.05 }, 6],
      ]), { idx: 3 }),
      C("lizard", lp, pose(null, { mode: lizOn ? "walk" : undefined, phase: ph(f, 5), facing: -1, headTilt: f > 952 ? 10 * Math.sin((f - 952) * 0.3) : 0 }), { scale: 0.6, idx: 19 }),
      C("dozer", desertDozer(dozer5(f), 0).seat, pose(null, { mode: "sit", expr: "grin", facing: -1, ...ACT.drive }), { idx: 4 }),
    ],
    fx: fxs(f >= 1084 && f < 1108 ? dustTrail("dozerIn", desertDozer(dozer5(f), 0).pos, [0, -1], f, 5, 0.8, 0.8) : null,
      f >= 900 && f < 914 ? sparkle("bow", [B5[0] + 0.6, 11.6, B5[2]], f - 900, 0.25) : null),
    focus: f < 815 ? [0, 9, 0] : f < 858 ? [B5[0], 11.6, B5[2]] : f < 882 ? [SA5[0], 11.6, SA5[2]] : f < 940 ? lp : f < 1002 ? [SA5[0], 11.6, SA5[2]] : f < 1087 ? [B5[0], 11.8, B5[2]] : [dozCam5(f)[0], dozCam5(f)[1] + 1.6, dozCam5(f)[2]],
    subj: f < 882 ? "boss" : f < 940 ? "lizard" : f < 1002 ? "salesA" : f < 1087 ? "boss" : "dozer",
  };
};
lens(811, 0.5, 1); lens(815, 4, 16); lens(832, 5, 1); lens(858, 6, 1); lens(882, 9, 1); lens(940, 6, 1); lens(1002, 4, 1); lens(1087, 5, 1);

// =====================================================================================================================
// SCENE 6 (1108-1203, hard cut = days later) HOME BASE A, the frame-1 view. "He dug a mile-long ditch under it and
// flooded it with lake water." The bulldozer cuts the ditch under the centre arch past the boss (dust); on "flooded" the
// lake bursts through the sand plug and the foam front races in under the arches; the boss hops back with wet shoes.
const B6: V3 = [-6.6, 0, -13.4], B6_BACK: V3 = [-8.4, 0, -14.8];
const dozer6 = (f: number) => lerp(0.3, 0.62, sm(f, 1108, 1160));
SHOT_CAMS[6] = () => [
  K(1108, F(() => fit([body(B6, 0, 2.2, 0.5), [[0, 0, -2], 0, 4.2, 2.4]], 214, 7, 42, 0.92), 1108, 0.0022), 1, true),
  K(1150, F(() => fit([body(B6, 0, 2.2, 0.5), body(B6_BACK, 0, 2.2, 0.5), [[0, 0, -6.8], 0, 3.4, 2.4]], 200, 7, 42, 0.92), 1150, 0.0016, [[1162, 0.006, 10]]), 22),
];
SHOT_ACTS[6] = (f) => {
  const dig = lerp(0.1, 0.5, sm(f, 1108, 1150)), water = lerp(0, 0.16, sm(f, 1156, 1198));
  const hop = sm(f, 1172, 1184), wetK = sm(f, 1174, 1182);
  return {
    ctl: { dig, water, dozer: dozer6(f), dozerBlade: 0, built: 1, numbered: 1, site: 0, dozerShow: 1, bossCar: 0, lamps: 0, truck: 1 },
    cast: [
      C("boss", lerp3(B6, B6_BACK, hop), flow(f, [
        [1108, { expr: "proud", facing: 1, ...PZ.pointR }],                                                        // "He dug..."
        [1140, { expr: "sly", facing: 1, armR: [[26, 30], [30, 52]] as A2 }, 8],
        [1160, { expr: "beam", facing: 1, ...PZ.pointRUp }, 8],                                                    // "...flooded it"
        [1172, { ...ACT.yikes, facing: -1, lift: 0.9 * Math.sin(hop * Math.PI) }, 4],                             // the water rushes in
        [1184, { expr: "beam", facing: 1, wet: 0.7 * wetK, sweat: 0.4 }, 8],
      ]), { idx: 1, air: f >= 1172 && f < 1184 }),
      C("dozer", desertDozer(dozer6(f), dig).seat, pose(null, { mode: "sit", expr: f > 1166 ? "shock" : "determined", facing: -1, ...ACT.drive }), { idx: 4 }),
    ],
    fx: fxs(f >= 1166 && f < 1200 ? dustCard("splash", [-3.5, 0.6, -14.5], 1.8, 0.8 * (1 - lin(f, 1166, 1200)), 4) : null),
    focus: [B6[0], 1.2, B6[2]],
    subj: "boss",
  };
};
lens(1108, 4, 1); lens(1150, 4, 20);
