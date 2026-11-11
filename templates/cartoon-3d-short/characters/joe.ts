// Joe, the hero of the Roulette remake, rebuilt to Rick's measured character spec (boards AV / AV2, master prompt v13
// section 7). He is the reference for every character: a new character changes the hat, hair, costume and colours and
// keeps the head, face, limb and proportion spec that lives in rig/fig.ts and rig/toon.ts.
// Add JOE to a video's casts.ts as `joe: JOE` (or copy the object) and draw him with figure(new Pen(g), JOE, opts).
import type { Look, FigOpts } from "./rig/fig";

export const JOE: Look = {
  seed: 7, hat: "flatcap", hatCol: "#7b8793", hair: "#c4682c", hairStyle: "tufts",
  coat: "#a8502c", vest: "#dfb34a", scarf: "#1c8e5a", patches: "#6a4a2c", buttons: "#6b4320",
};

/** the model-sheet poses (joe_model_sheet.jpg): front deadpan, 3/4 both ways, talking, back, five faces, walking */
export const JOE_SHEET: FigOpts[] = [
  { expr: "smug" }, { expr: "neutral", facing: 0.7 }, { expr: "smug", facing: -0.7, armR: [[22, 8], [38, -14]] },
  { expr: "smug", facing: 0.7, mouth: "tWide" }, { expr: "neutral", back: true },
  { expr: "shock" }, { expr: "mock" }, { expr: "fury", facing: -0.7 },
  { expr: "worry", facing: 0.7 }, { expr: "neutral", mode: "walk", facing: 1, phase: 0.25 },
];
