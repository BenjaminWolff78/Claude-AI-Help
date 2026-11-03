import React, { useEffect, useRef } from "react";
import { AbsoluteFill, getInputProps } from "remotion";
import { Pen } from "./videos/ice/toon";
import { figure, FigOpts } from "./videos/ice/fig";
import { CAST } from "./videos/ice/casts";
type Item = { who: string; o?: FigOpts };
const DEF: Item[] = [
  { who: "tudor", o: { expr: "strain", mode: "brace", armR: [[14, 20], [26, -4]], armL: [[-14, 20], [-26, -4]], propR: "tongs" } },
  { who: "tudor", o: { expr: "smug", facing: 1, armR: [[22, -10], [18, -44]], hatLift: 0.08, hatTilt: -8 } },
  { who: "gazette", o: { expr: "laugh", armR: [[24, 10], [20, -30]], propR: "newspaper", armRFront: true } },
  { who: "banker", o: { expr: "smug", facing: -1, armR: [[20, 34], [34, 60]], propR: "moneybag" } },
  { who: "sailor1", o: { expr: "grin", facing: 1 } }, { who: "sailor2", o: { expr: "laugh" } }, { who: "captain", o: { expr: "neutral", facing: -1 } },
  { who: "guard", o: { expr: "stern" } }, { who: "marketWoman", o: { expr: "dismay", facing: 1, sweat: 1 } }, { who: "islandMan", o: { expr: "shock" } },
  { who: "islandKid", o: { expr: "cold", armR: [[16, 20], [12, 0]], propR: "icechunk" } }, { who: "mill1", o: { expr: "grin", armR: [[24, 30], [30, 54]], propR: "shovel", propK: 1 } },
  { who: "beachKid", o: { expr: "smug", mode: "sit", armR: [[24, 10], [18, -16]], propR: "soda" } }, { who: "cal1", o: { expr: "joy" } }, { who: "cal3", o: { expr: "grin", facing: -1 } },
  { who: "cal4", o: { expr: "shock" } }, { who: "tudorKing", o: { expr: "smug", armR: [[24, 14], [30, -14]], propR: "scepter" } },
  { who: "tudorLab", o: { expr: "eureka", armR: [[22, 0], [20, -30]], propR: "magnifier" } }, { who: "bos1", o: { expr: "laugh" } }, { who: "bos2", o: { expr: "smile" } },
];
export const CastSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const items = ((getInputProps() as { items?: Item[] }).items) ?? DEF;
  const cols = Number((getInputProps() as { cols?: number }).cols ?? 10), bg = ((getInputProps() as { bg?: string }).bg) ?? "#7f9fc4";
  useEffect(() => {
    const c = ref.current!, g = c.getContext("2d")!;
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    items.forEach((it, i) => {
      const cw = c.width / cols, ch = cw * 1000 / 600 * 0.95;
      g.save(); g.translate((i % cols) * cw, Math.floor(i / cols) * ch - ch * 0.05); g.scale(cw / 600, cw / 600);
      g.fillStyle = (i % 2) ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"; g.fillRect(0, 0, 600, 1000);
      figure(new Pen(g), CAST[it.who], it.o ?? {}); g.restore();
    });
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={2400} height={1520} /></AbsoluteFill>;
};
