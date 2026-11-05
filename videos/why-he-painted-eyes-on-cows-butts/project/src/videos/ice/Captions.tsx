// Burned-in captions (user rule): 1-2 words (max 3), white heavy font, black outline, ~70 % of the frame height,
// switched exactly on the spoken word (never lagging). Key story words take the accent colour (track red-orange).
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import WORDS from "./words.json";
const ACCENT = "#22c7e0"; // river turquoise (changes every video; previous: track red-orange #FF5A36)
const KEY = new Set(["bridge", "desert,", "river", "300.", "hot,", "sand.", "buy", "sinking", "inch", "laughed.", "mister", "nowhere.", "numbered", "jigsaw", "dry", "nobody", "lizard", "lost", "bulldozer.", "flooded", "trick.", "desert", "dinosaur?", "two", "million", "lot.", "boats", "tourists", "10,000.", "nowhere."]);
const SMALL = new Set(["a", "the", "of", "in", "to", "his", "he", "is", "it", "and", "an", "so", "it's", "all", "how", "do", "you", "can't", "just", "such", "your", "that's", "when", "what", "with", "into", "has", "more", "not", "for", "every", "this"]);
type W = { w: string; s: number; e: number };
const chunks = (() => {
  const ws = WORDS as W[], out: { s: number; e: number; words: string[] }[] = [];
  for (let i = 0; i < ws.length; i++) {
    const w = ws[i], c = { s: w.s, e: w.e, words: [w.w] };
    const clean = w.w.toLowerCase().replace(/[".,!?:…]/g, "");
    if (!/[.,!?:…"]$/.test(w.w) && SMALL.has(clean) && i + 1 < ws.length && ws[i + 1].s - w.e < 0.25) { c.words.push(ws[i + 1].w); c.e = ws[i + 1].e; i++; }
    out.push(c);
  }
  for (let k = 0; k < out.length; k++) out[k].e = k + 1 < out.length ? Math.min(out[k + 1].s, out[k].e + 0.6) : out[k].e + 0.5;
  return out;
})();
export const Captions: React.FC = () => {
  const f = useCurrentFrame(), t = f / 30;
  const [h] = useState(() => delayRender("caption font"));
  useEffect(() => {
    const ff = new FontFace("CapFont", `url(${staticFile("fonts/montserrat-latin-900-normal.woff2")})`, { weight: "900" });
    ff.load().then((x) => { document.fonts.add(x); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
  const c = chunks.find((k) => t >= k.s - 1 / 30 && t < k.e);
  if (!c) return null;
  const pop = Math.min(1, (t - c.s + 1 / 30) / 0.07), sc = 0.9 + 0.1 * (1 - (1 - pop) ** 3);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div style={{ position: "absolute", top: "70%", transform: `translateY(-50%) scale(${sc})`, fontFamily: "CapFont, Arial Black, sans-serif", fontWeight: 900, fontSize: 92,
        letterSpacing: -1, whiteSpace: "nowrap", WebkitTextStroke: "16px #000", paintOrder: "stroke fill", textShadow: "0 6px 14px rgba(0,0,0,0.45)", lineHeight: 1 }}>
        {c.words.map((w, i) => <span key={i} style={{ color: KEY.has(w.toLowerCase()) ? ACCENT : "#fff" }}>{(i ? " " : "") + w}</span>)}
      </div>
    </AbsoluteFill>
  );
};
