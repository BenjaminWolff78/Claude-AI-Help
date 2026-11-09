// Per-shot cameras and acting (set-local coordinates). Filled shot by shot after the sets are locked.
import { Pen } from "./toon";
import type { FigOpts } from "./fig";
import type { SetDef, Ctl } from "./sets/types";
import { PREVIEW, V3, Cam, run, Key, applyKick, T, STORY_SHOTS, XFADE } from "./story";
import { SHOT_CAMS, SHOT_ACTS } from "./shots";

export type CastPlace = { who: string; pos: V3; o?: FigOpts; mirror?: boolean; scale?: number; yaw?: number; roll?: number; shadow?: boolean; blob?: boolean; air?: boolean; idx?: number };
export type FxSpec = { kind?: "blob" | "card"; key?: string; cw?: number; ch?: number; draw?: (p: Pen) => void; pos: V3; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type Act = { ctl?: Ctl; cast: CastPlace[]; fx?: FxSpec[]; focus?: V3; /** QA subject: a cast name, null = the look point (prop / place shots), default = the hero */ subj?: string | null };

export const camFor = (id: number, f: number, set: SetDef): Cam => {
  if (PREVIEW) {
    const c = PREVIEW.cam && set.cams[PREVIEW.cam] ? set.cams[PREVIEW.cam] : { pos: PREVIEW.pos ?? [0, 1.6, 6], look: PREVIEW.look ?? [0, 1.2, 0], fov: PREVIEW.fov };
    return { pos: c.pos, look: c.look, fov: c.fov ?? 40, roll: 0 };
  }
  let keys: Key[] | undefined = SHOT_CAMS[id]?.(set);
  if (!keys) { const c = Object.values(set.cams)[0]; return { pos: c.pos, look: c.look, fov: c.fov ?? 40, roll: 0 }; }
  // continuity (v10.4: <= 4 hard cuts): a shot that follows another shot in the same place without a dissolve starts
  // from where the previous camera ended and glides into its own first framing - the change of shot is a camera move
  const me = STORY_SHOTS.find((s) => s.id === id), prev = STORY_SHOTS.find((s) => s.id === id - 1);
  if (me && prev && prev.set === me.set && !XFADE[id] && SHOT_CAMS[prev.id] && !keys[0].cut) {
    const end = run(SHOT_CAMS[prev.id](set), prev.b - 1);
    keys = [{ f: me.a, s: () => end }, { ...keys[0], f: me.a, dur: keys[0].dur ?? 24, cut: false }, ...keys.slice(1)];
  }
  return applyKick(run(keys, f), T(f));
};
export const actFor = (id: number, f: number, set: SetDef): Act => {
  if (PREVIEW) {
    const cast = (PREVIEW.cast ?? []).map((c, i) => ({ who: c.who, pos: c.pos ?? set.marks[c.mark ?? ""] ?? [0, 0, 0], o: c.o as FigOpts, scale: c.scale, idx: i }));
    return { ctl: PREVIEW.ctl ?? {}, cast };
  }
  return SHOT_ACTS[id]?.(f, set) ?? { cast: [] };
};
