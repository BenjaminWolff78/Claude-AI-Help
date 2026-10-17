import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT, FPS, P, TL, clamp01, easeOut} from './lib';

type Cap = (typeof TL.captions)[number];

/**
 * Burned-in captions: 1-4 words, 60 px, high contrast, bottom safe band.
 * A chunk pops in whole on its first word's start (never types in); the word being
 * spoken gets a marker swipe. Hidden after the voice ends.
 */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t > TL.voiceEnd + 0.3) return null;
  let cap: Cap | null = null;
  for (const c of TL.captions) {
    if (c.start <= t + 1e-6 && t < c.end) cap = c;
    if (c.start > t) break;
  }
  if (!cap) return null;
  const age = t - cap.start;
  const pop = easeOut(clamp01(age / 0.12));
  const scale = 0.9 + 0.1 * pop + Math.sin(clamp01(age / 0.2) * Math.PI) * 0.025;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 908, display: 'flex', justifyContent: 'center', pointerEvents: 'none'}}>
      <div
        data-qa="caption"
        data-qa-type="caption"
        style={{
          transform: `scale(${scale.toFixed(3)})`,
          transformOrigin: '50% 50%',
          background: 'rgba(255,253,247,0.96)',
          border: `4px solid ${P.ink}`,
          borderRadius: 20,
          padding: '6px 26px 10px',
          boxShadow: `5px 6px 0 ${P.ink}`,
          fontFamily: FONT,
          fontSize: 60,
          fontWeight: 700,
          fontVariationSettings: '"INFM" 40, "BNCE" 10',
          color: P.ink,
          whiteSpace: 'nowrap',
          lineHeight: 1.15,
          maxWidth: 1700,
        }}
      >
        {cap.words.map((w, i) => {
          const active = t >= w.start - 0.02 && (i === cap!.words.length - 1 || t < cap!.words[i + 1].start - 0.02);
          return (
            <span key={i} style={{position: 'relative', display: 'inline-block', marginRight: i < cap!.words.length - 1 ? '0.28em' : 0}}>
              {active ? (
                <span style={{position: 'absolute', left: -6, right: -6, top: '22%', bottom: '4%', background: P.mustard, opacity: 0.85, borderRadius: 8, transform: 'rotate(-1.5deg)'}} />
              ) : null}
              <span style={{position: 'relative'}}>{w.w}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
