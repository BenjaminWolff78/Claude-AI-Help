// p15 dump (car battery video), from dump_previz_template.ts — render-free scene dump for kit/previz_guard.py and kit/rule_audit.py (every frame).
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
const headY = (_who: string, mode?: string) => (mode === "sit" ? 0.9 : 1.36);
const HEAD_W = 0.44;                                             // head width in metres as drawn

// TODO 2: the plan id for each code shot id (plan.json uses "S1", "S2", ...)
const planId = (id: number) => "S" + id;

// the plan's role "crew" resolves to ONE named crewman per shot (the others are crew#n)
const MAIN_CREW: Record<number, string> = { 1: "crew1", 2: "crew1", 8: "crew1", 9: "crew1", 10: "crew4", 11: "crew2", 14: "crew2", 15: "crew2", 17: "crew1", 18: "crew1", 21: "crew3", 25: "crew1", 26: "crew1" };
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
  // p15 tags: held props at the hand, the story objects per place (positions from the act's ctl), fx while they play
  const PROP: Record<string, string> = { steamCup: "coffee", tray: "tray", card: "playing cards", chalk: "chalk" };
  for (const q of a.cast) { const o = (q.o ?? {}) as { propR?: string; propL?: string }; for (const pr of [o.propR, o.propL]) if (pr) tags.push({ name: (PROP[pr] ?? pr) + (q.who === "foreman" ? " (foreman)" : q.who.startsWith("crew") ? " (" + q.who + ")" : ""), pos: [q.pos[0], q.pos[1] + 1.15, q.pos[2]], size: pr === "tray" ? 0.4 : 0.15 }); }
  const id = sh.id, T = (name: string, pos: number[], size: number, fx = false, vehicle = false) => tags.push({ name, pos, size, ...(fx ? { fx } : {}), ...(vehicle ? { vehicle } : {}) } as never);
  const BUNK = [1, 6, 7, 8, 26], MESS = [9, 10, 21];
  if (BUNK.includes(id)) {
    if ((k.bunkBat ?? 0) > 0.5) T("battery", [k.bbX, k.bbY + 0.1, k.bbZ], 0.3);
    T("bunk", id === 26 ? [103.05, 0.35, -0.9] : [96.95, 0.6, -0.9], id === 26 ? 0.4 : 2.0); T("stove", [99.3, 0.5, -3.85], 0.6); T("tally", [97.43, 1.05, -1.9], 0.15);
    if ((k.blk ?? 0) > 0.5) T("blanket", [96.95, 0.62, -0.5], 0.9); T("pillow", [96.95, 0.6, -1.65], 0.5); if ((k.bag ?? 0) > 0.5) T("floor", [97.95, 0.05, -0.95], 1.5);
    if ((k.fbat ?? 0) > 0.5) T("truck battery", [k.fbX, k.fbY + 0.12, k.fbZ], 0.33);
  } else if (MESS.includes(id)) {
    T("chalkboard", [196.4, 1.95, -3.94], 1.2); T("tables", [200, 0.5, -0.5], 0.6); T("fridge", [205.7, 0.85, -3.35], 0.8); T("pancakes", [203.45, 1.05, -2.95], 0.2);
    if ((k.honey ?? 0) > 0.5) T("honey", [k.hbX, k.hbY, k.hbZ], 0.15);
  } else {
    if ((k.lotBat ?? 0) > 0.5) T("battery", [k.lbX, k.lbY + 0.1, k.lbZ], 0.3);
    T("his car", id === 19 ? [-1.1, 0.8, 7.6] : [0, 0.8, 8.25], 1.6, false, true); T("bunkhouse", [-1, 3.6, -4.7], 5);
    [-4.4, -8.0, -11.6].forEach((x, i) => T(i ? "trucks " + (i + 1) : "trucks", id === 15 ? [x, 2.0, 8.0] : [x, 0.95, 6.2], 0.6, false, true));
    T("giant truck", id === 16 ? [4.2, 2.45, 7.9] : [k.gtX ?? 4.6, 1.3, k.gtZ ?? 8.0], 2.4, false, true); T("thermometer", [-2.06, 1.25, 0.64], 0.2); T("clock", [0, 3.35, 18.95], 0.62);
    T("frozen battery", [3.99, 1.25, 5.47], 0.3); T("steering wheel", [4.06, 1.5, 7.0], 0.35); T("key", [-0.24, 0.8, 7.46], 0.06); T("keys", [-4.62, 1.3, 7.45], 0.1);
    if ((k.carRun ?? 0) > 0.5) T("exhaust", [-0.5, 0.4, 9.8], 0.8, true);
    if ((k.tester ?? 0) > 0.5) T("gauge", [k.tsX, k.tsY + 0.1, k.tsZ], 0.15);
    if ((k.hdip ?? 0) > 0.5) T("dipstick", [k.dsX, k.dsY - 0.3, k.dsZ], 0.3);
    if ((k.cables ?? 0) > 0.5) T("cables", [-4, 1.2, 6], 16);
  }
  // TODO 4: MOVING solids as axis-aligned boxes (door leaves, carts, a swinging sign); static walls go in solids.json per place
  const solids: { name: string; min: number[]; max: number[] }[] = [];
  // solids.push(doorLeafBox(k.doorAngle));

  const cast = a.cast.map((q) => {
    const o = (q.o ?? {}) as { mode?: string; tilt?: number; headTilt?: number; look?: number; expr?: string; phase?: number; facing?: number };
    // pose: the micro values the life layer moves (deg / -1..1) and the face; previz_guard G3b catches one-frame snaps at seams
    return { who: (/^crew\d$/.test(q.who) ? (q.who === MAIN_CREW[sh.id] ? "crew" : "crew#" + q.who.slice(4)) : q.who) + (q.idx ? "#" + q.idx : ""), head: [q.pos[0], q.pos[1] + headOf(CAST[q.who], o as never).y * ((q as { scale?: number }).scale ?? 1), q.pos[2]], feet: q.pos, headW: headOf(CAST[q.who], o as never).w * ((q as { scale?: number }).scale ?? 1),
      pose: { tilt: +(o.tilt ?? 0).toFixed(2), headTilt: +(o.headTilt ?? 0).toFixed(2), look: +(o.look ?? 0).toFixed(3), expr: o.expr ?? "",
        seatH: o.mode === "sit" && CAST[q.who] ? +(q.pos[1] + seatHeight(CAST[q.who], o as never) * ((q as { scale?: number }).scale ?? 1)).toFixed(3) : null,
        reach: REACH_LOG.get(f + "|" + q.pos.map((v: number) => v.toFixed(2)).join(",")) ?? null,
        mode: o.mode ?? "stand", mouth: (o as { mouth?: string }).mouth ?? "", phase: +(o.phase ?? 0).toFixed(3), facing: +(o.facing ?? 0).toFixed(2), strideM: CAST[q.who] ? +(strideM(CAST[q.who], o as never) * ((q as { scale?: number }).scale ?? 1)).toFixed(4) : null } };
  });
  // v34.1: an act may declare its own QA objects (a moving vehicle with "vehicle": true, a carried prop, a moving seat)
  const qa = (a as { qa?: { tags?: typeof tags; solids?: typeof solids; seats?: unknown[] } }).qa;
  if (qa?.tags) tags.push(...qa.tags); if (qa?.solids) solids.push(...qa.solids);
  console.log(JSON.stringify({ f, shot: planId(sh.id), subj: (a.subj && /^crew\d$/.test(a.subj) ? (a.subj === MAIN_CREW[sh.id] ? "crew" : "crew#" + a.subj.slice(4)) : a.subj ?? undefined) || undefined, cam: { pos: c.pos, look: c.look, fov: c.fov, focus, blur: Math.min(1, (d.cInf ?? 0) / DOF_MAX) }, cast, tags, solids, ...(qa?.seats ? { seats: qa.seats } : {}) }));
}
console.error("AIM_STATS", JSON.stringify(AIM_STATS));
