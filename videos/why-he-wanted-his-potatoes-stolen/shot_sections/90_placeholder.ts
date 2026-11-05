
// PLACEHOLDER cameras until the scene files land (one static framing per shot id).
for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) if (!SHOT_CAMS[id]) {
  SHOT_CAMS[id] = (s) => [K(0, F(() => s.cams.main ?? { pos: [0, 2, 10] as V3, look: [0, 1, 0] as V3, fov: 40 }, 0, 0.0018))];
  SHOT_ACTS[id] = () => ({ ctl: {}, cast: [], fx: [], focus: [0, 1, 0], subj: null } as unknown as Act);
}
