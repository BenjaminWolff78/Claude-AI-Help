// p14 dump (beer syrup video), from dump_previz_template.ts — render-free scene dump for kit/previz_guard.py and kit/rule_audit.py (every frame).
// Copy into <project>/camdump/, fix the imports and the four TODO blocks for your video, then:
//   npx esbuild dump_previz.ts --bundle --platform=node --format=esm --alias:remotion=./stub_remotion.js --outfile=dump.mjs
//   node dump.mjs 1 > frames.jsonl 2> clear.txt
//   python3 kit/previz_guard.py frames.jsonl plan.json --solids solids.json
// stub_remotion.js exports no-op staticFile, delayRender, continueRender, getInputProps, useCurrentFrame, useVideoConfig,
// interpolate, Easing, Internals. The dump must use THE SAME functions the renderer uses (camFor, the scene acts, dofAt),
// never a copy, or it checks a different video.
import { camFor } from "../app/src/videos/ice/cams";
import { strideM, seatHeight, headOf } from "../app/src/videos/ice/fig";
import { CAST } from "../app/src/videos/ice/casts";          // TODO: your video folder
import { SHOT_ACTS, REACH_LOG, AIM_STATS } from "../app/src/videos/ice/shots";
import { STORY_SHOTS, dofAt, TOTAL } from "../app/src/videos/ice/story";

const S = { cams: {}, marks: {} } as never;
const step = Number(process.argv[2] ?? 1);                       // 1 = every frame (seams need every frame)
const DOF_MAX = 7;                                               // your strongest DOF value (insert) -> blur 1.0

// TODO 1: head-centre height above the card's feet for each character and pose, MEASURED on a preview still
// (the Alaska video: a standing kid 1.28 m, a seated adult 0.90 m, a standing adult 1.36 m). Guessing these breaks G5/G6.
const headY = (who: string, mode?: string) => (mode === "sit" ? 0.9 : who === "bsKid" ? 1.28 : 1.36);
const HEAD_W = 0.44;                                             // head width in metres as drawn

// TODO 2: the plan id for each code shot id (plan.json uses "S1", "S2", ...)
const planId = (id: number) => "S" + id;

const END = Math.min(TOTAL, STORY_SHOTS[STORY_SHOTS.length - 1].b);   // a shorter test timeline ends with its last shot
for (let f = 0; f < END; f += step) {
  const sh = STORY_SHOTS.find((s) => s.a <= f && f < s.b)!;
  const c = camFor(sh.id, f, S);
  const a = SHOT_ACTS[sh.id](f, S);
  const k = (a.ctl ?? {}) as Record<string, number>;
  const d = dofAt(f);
  const focusPt = d.focus ? d.focus(f) : null;
  const focus = focusPt ? Math.hypot(focusPt[0] - c.pos[0], focusPt[1] - c.pos[1], focusPt[2] - c.pos[2]) : null;

  // TODO 3: every story object the script names AND everything that can pass in front of a face (props in hands, food,
  // flames, smoke puffs, signs), with centre and rough width in metres. Leave an object out while it is hidden.
  const tags: { name: string; pos: number[]; size: number; fx?: boolean }[] = [];   // fx: true for flames/smoke/splashes (they may start and stop on screen; G3c checks props for pops)
  // p14 tags: held props at the hand (named like the plan's objects), the set's story objects per place, fx while they play
  const PROP: Record<string, string> = { syrupCan: "syrup can", padlock: "padlock", pie: "pie", rollingPin: "rolling pin", crate: "syrup crate", clipboard: "notepad", jug: "water jug", basket: "basket", loopKey: "key", hop: "hop", chalk: "chalk" };
  // a held prop that is set down / handed over / picked up (it becomes or comes from a set object or another hand) is a
  // transfer, not a pop: those windows are listed here (frames) and their tags are marked fx so G3c does not count them
  const XFER: [number, number][] = [[124, 132], [344, 356], [600, 612], [628, 652], [740, 752], [1388, 1398], [1428, 1436], [1560, 1570]];
  const xfer = XFER.some(([a0, b0]) => f >= a0 && f <= b0);
  for (const q of a.cast) { const o = (q.o ?? {}) as { propR?: string; propL?: string }; for (const pr of [o.propR, o.propL]) if (pr) tags.push({ name: (PROP[pr] ?? pr) + (["wife", "townsfolk", "townsman", "kid"].includes(q.who) ? " (" + q.who + ")" : ""), pos: [q.pos[0], q.pos[1] + 1.15, q.pos[2]], size: pr === "crate" || pr === "pie" ? 0.4 : 0.22, ...(xfer ? { fx: true } : {}) }); }
  const id = sh.id, T = (name: string, pos: number[], size: number, fx = false) => tags.push(fx ? { name, pos, size, fx } : { name, pos, size });
  if (id <= 7) { T("syrup can", [0.0, 1.05, 9.0], 0.2); T("label", [0.0, 1.05, 9.0], 0.2); T("kettle", [-3.6, 1.6, 8.7], 2.0); T("wall sign", [0.9, 3.05, 11.94], 4.4);
    T("beer barrel", [2.7, 0.5, 4.4], 0.9); T("floor drain", [2.7, 0.02, 3.35], 0.5); T("hop sacks", [2.8, 0.5, 6.8], 0.9); T("hop sacks", [-5.0, 0.5, 10.9], 0.9); }
  if ([10, 11, 12, 13, 14, 15, 26, 29].includes(id)) { T("count board", [99.05, 2.25, 3.42], 0.8); T("syrup wall", [101.6, 1.6, 6.78], 4.0); T("flour sacks", [103.55, 0.5, 5.6], 0.9); T("spider", [103.25, 1.15, 5.1], 0.15);
    T("bread shelf", [101.25, 1.2, 0.3], 0.9); T("wink poster", [98.0, 2.05, 6.93], 0.8); if ((k.pancakeOn ?? 0) > 0.5) T("pancake mix", [97.75, 1.08, 3.45], 0.25);
    if ((k.yeast ?? 0) > 0.5) T("yeast boxes", [k.yeastX ?? 102.4, 1.2, k.yeastZ ?? 2.3], 0.6); }
  if ([8, 9, 16].includes(id)) { T("office window", [187.2, 2.62, 8.41], 1.4); /* the gold lettering band above the agents' heads (the glass covers nothing) */ T("truck", [191.9, 1.12, 3.37], 0.9); T("church", [240, 6, 13], 8); if ((k.loaf ?? 0) > 0.01) T("giant loaf", [228.5, 3.5, 15.5], 12 * (0.2 + 0.8 * (k.loaf ?? 0))); }
  if ([17, 18, 19, 20, 21, 22, 30].includes(id)) {
    const order = id === 21 || id === 22 ? [1, 2, 3, 4, 0] : [0, 1, 2, 3, 4];
    for (const i of order) { T(i === order[0] ? "cellar window" : "cellar window h" + (i + 1), [199.3 + 6 * i, 0.22, 8.39], 0.7); const age = k[`pop${i + 1}`] ?? -1; if (age > 0 && age < 1.6) T(i === order[0] ? "foam" : "foam h" + (i + 1), [199.3 + 6 * i, 0.5, 8.0], 0.8, true); }
    if (id >= 17 && id <= 22) { const dsm = (u: number) => { const v = Math.min(1, Math.max(0, u)); return v * v * (3 - 2 * v); }, th = 1.6 * dsm(k.door1 ?? 0); T("door leaf", [196.5 + 0.5 * Math.cos(th) + 0.04 * Math.sin(th), 1.65, 8.24 - 0.5 * Math.sin(th)], 0.2 + 0.8 * Math.abs(Math.cos(th))); T("door", [197.0, 1.65, 8.49], 1.0); }   /* "door" = the doorway (the plan object), at the back of the jamb, behind whoever stands in it */   /* open, the leaf is seen nearly edge-on */ /* the leaf's centre: it swings out on its left hinge */ T("steps", [197.0, 0.35, 6.9], 1.2); T("cellar door", [219.7, 0.3, 7.9], 1.4); T("key", [219.7, 0.55, 7.75], 0.15); }
  if ([23, 24, 25, 27, 28].includes(id)) { T("crock", [196.8, -1.7, 10.8], 0.45); T("bottles", [195.35, -1.4, 12.45], 3.2); T("capper", [196.25, -1.7, 10.9], 0.3);
    if (id === 24 && f >= 1404 && f < 1428) T("water", [196.75, -1.35, 10.8], 0.3, true); if (id === 24 && f >= 1431 && f < 1445) T("yeast cake", [196.8, -1.3, 10.8], 0.12, true);
    if (id === 25) T("bubbles", [196.8, -1.4, 10.7], 0.3, true); if ((k.capAge ?? -1) > 0) T("caps", [195.35, -1.0, 12.4], 2.0, true); }
  if (id === 31) { T("bottles", [220.35, -1.4, 12.45], 3.2); T("crocks", [222.7, -2.2, 11.6], 1.2); if ((k.wifeAge ?? -1) > 0) T("foam", [220.4, -1.0, 12.2], 1.6, true); }
  // TODO 4: MOVING solids as axis-aligned boxes (door leaves, carts, a swinging sign); static walls go in solids.json per place
  const solids: { name: string; min: number[]; max: number[] }[] = [];
  // solids.push(doorLeafBox(k.doorAngle));

  const cast = a.cast.map((q) => {
    const o = (q.o ?? {}) as { mode?: string; tilt?: number; headTilt?: number; look?: number; expr?: string; phase?: number; facing?: number };
    // pose: the micro values the life layer moves (deg / -1..1) and the face; previz_guard G3b catches one-frame snaps at seams
    return { who: q.who + (q.idx ? "#" + q.idx : ""), head: [q.pos[0], q.pos[1] + headOf(CAST[q.who], o as never).y * ((q as { scale?: number }).scale ?? 1), q.pos[2]], feet: q.pos, headW: headOf(CAST[q.who], o as never).w * ((q as { scale?: number }).scale ?? 1),
      pose: { tilt: +(o.tilt ?? 0).toFixed(2), headTilt: +(o.headTilt ?? 0).toFixed(2), look: +(o.look ?? 0).toFixed(3), expr: o.expr ?? "",
        seatH: o.mode === "sit" && CAST[q.who] ? +(q.pos[1] + seatHeight(CAST[q.who], o as never) * ((q as { scale?: number }).scale ?? 1)).toFixed(3) : null,
        reach: REACH_LOG.get(f + "|" + q.pos.map((v: number) => v.toFixed(2)).join(",")) ?? null,
        mode: o.mode ?? "stand", mouth: (o as { mouth?: string }).mouth ?? "", phase: +(o.phase ?? 0).toFixed(3), facing: +(o.facing ?? 0).toFixed(2), strideM: CAST[q.who] ? +(strideM(CAST[q.who], o as never) * ((q as { scale?: number }).scale ?? 1)).toFixed(4) : null } };
  });
  // v34.1: an act may declare its own QA objects (a moving vehicle with "vehicle": true, a carried prop, a moving seat)
  const qa = (a as { qa?: { tags?: typeof tags; solids?: typeof solids; seats?: unknown[] } }).qa;
  if (qa?.tags) tags.push(...qa.tags); if (qa?.solids) solids.push(...qa.solids);
  console.log(JSON.stringify({ f, shot: planId(sh.id), subj: (a.subj ?? undefined) || undefined, cam: { pos: c.pos, look: c.look, fov: c.fov, focus, blur: Math.min(1, (d.cInf ?? 0) / DOF_MAX) }, cast, tags, solids, ...(qa?.seats ? { seats: qa.seats } : {}) }));
}
console.error("AIM_STATS", JSON.stringify(AIM_STATS));
