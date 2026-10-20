import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT, P, clamp01, easeOut} from './lib';
import {useCurrentFrame} from 'remotion';
import {PencilSvg} from '../mg/pencil';

const FACE = `@font-face{font-family:"Shantell Sans";src:url(${staticFile('fonts/ShantellSans.ttf')}) format("truetype");font-weight:300 800;font-display:block;}`;

export const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender('shantell'));
  useEffect(() => {
    Promise.all([document.fonts.load(`700 60px "Shantell Sans"`), document.fonts.load(`500 40px "Shantell Sans"`)]).then(() =>
      continueRender(h),
    );
  }, [h]);
  return <style>{FACE}</style>;
};

let ctx: CanvasRenderingContext2D | null = null;
/** Text width in px for Shantell Sans at a weight (canvas measure; fonts are loaded before frames). */
export const measure = (text: string, size: number, weight = 700) => {
  if (typeof document === 'undefined') return text.length * size * 0.55;
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  ctx!.font = `${weight} ${size}px "Shantell Sans"`;
  return ctx!.measureText(text).width;
};

export type TxtProps = {
  x: number;
  y: number;
  size: number;
  children: string;
  color?: string;
  weight?: number;
  align?: 'left' | 'center' | 'right';
  k?: number; // write-on 0..1 (per letter)
  out?: number; // exit 0..1
  rot?: number;
  riso?: string | null; // offset print colour
  qa?: string;
  informal?: number; // Shantell INFM axis 0..100
  bounce?: number; // Shantell BNCE axis -100..100
  opacity?: number;
  wrap?: number; // max width -> allows wrapping
  lineHeight?: number;
  pen?: boolean | number; // the carrier pencil writes the letters while 0 < k < 1 (number = pencil length)
};

/** Hand-lettered text: letters pop in one after another with a tiny overshoot; riso offset shadow. */
export const Txt: React.FC<TxtProps> = ({
  x,
  y,
  size,
  children,
  color = P.ink,
  weight = 700,
  align = 'left',
  k = 1,
  out = 0,
  rot = 0,
  riso = null,
  qa,
  informal = 60,
  bounce = 40,
  opacity = 1,
  wrap,
  lineHeight = 1.1,
  pen = false,
}) => {
  const frame = useCurrentFrame();
  if (k <= 0 || out >= 1 || opacity <= 0) return null;
  const chars = Array.from(children);
  const n = chars.length;
  let pencil: React.ReactNode = null;
  if (pen && k < 1 && !wrap) {
    const total = measure(children, size, weight);
    const left = x - total * (align === 'center' ? 0.5 : align === 'right' ? 1 : 0);
    const fi = Math.max(0, Math.min(n, k * (n + 6) - 3.5));
    const i0 = Math.floor(fi);
    const pre = measure(chars.slice(0, i0).join(''), size, weight);
    const cw = i0 < n ? measure(chars[i0], size, weight) : 0;
    const nx = left + pre + cw * (fi - i0);
    const ny = y + size * (0.72 + 0.1 * Math.sin(fi * 2.1));
    const lift = k < 0.12 ? 1 - k / 0.12 : k > 0.9 ? (k - 0.9) / 0.1 : 0;
    const L = typeof pen === 'number' ? pen : Math.max(200, Math.min(380, size * 3.6));
    pencil = <PencilSvg x={nx} y={ny} L={L} frame={frame} lift={lift} />;
  }
  const tx = align === 'left' ? '0%' : align === 'center' ? '-50%' : '-100%';
  return (
    <>
    <div
      data-qa={qa ? `text:${qa}` : undefined}
      data-qa-type={qa ? 'text' : undefined}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${tx}, 0) rotate(${rot}deg) translateY(${-out * 30}px)`,
        transformOrigin: align === 'left' ? '0 50%' : align === 'center' ? '50% 50%' : '100% 50%',
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        fontVariationSettings: `"INFM" ${informal}, "BNCE" ${bounce}`,
        color,
        whiteSpace: wrap ? 'normal' : 'nowrap',
        width: wrap,
        textAlign: align,
        lineHeight,
        opacity: (1 - out) * opacity,
        textShadow: riso ? `${(size * 0.05).toFixed(1)}px ${(size * 0.05).toFixed(1)}px 0 ${riso}` : undefined,
        letterSpacing: '0.005em',
      }}
    >
      {chars.map((c, i) => {
        const p = clamp01(k * (n + 6) / 6 - i / 6);
        const e = easeOut(p);
        const s = p <= 0 ? 0 : 0.6 + 0.4 * e + Math.sin(p * Math.PI) * 0.12;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p > 0 ? 1 : 0,
              transform: `translateY(${((1 - e) * size * 0.25).toFixed(1)}px) scale(${s.toFixed(3)})`,
              whiteSpace: 'pre',
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
      {pencil}
    </>
  );
};

/** Label in a hand-drawn tag. The box is laid out around the text, so text can never spill over. */
export const Tag: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  fill?: string;
  color?: string;
  k?: number;
  seed?: number;
  rot?: number;
  qa?: string;
  align?: 'left' | 'center';
  weight?: number;
}> = ({x, y, text, size = 34, fill = P.mustard, color = P.ink, k = 1, seed = 31, rot = -2, qa, align = 'left', weight = 800}) => {
  if (k <= 0) return null;
  const sc = 0.5 + 0.5 * easeOut(clamp01(k)) + Math.sin(clamp01(k) * Math.PI) * 0.08;
  const mx = ((seed * 37) % 7) - 3;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translateX(${align === 'center' ? '-50%' : '0'}) rotate(${rot}deg) scale(${sc.toFixed(3)})`,
        transformOrigin: '50% 50%',
        opacity: clamp01(k * 3),
      }}
    >
      <div
        data-qa={qa ? `tag:${qa}` : undefined}
        data-qa-type={qa ? 'text' : undefined}
        style={{position: 'relative', display: 'inline-block', padding: `${(size * 0.22).toFixed(0)}px ${(size * 0.5).toFixed(0)}px ${(size * 0.3).toFixed(0)}px`}}
      >
        <div style={{position: 'absolute', inset: 0, background: fill, borderRadius: 12, transform: `translate(${mx}px, 3px)`}} />
        <div style={{position: 'absolute', inset: 0, border: `4.5px solid ${P.ink}`, borderRadius: 12, filter: 'url(#inkwob)'}} />
        <span
          data-qa={qa ? `tagtext:${qa}` : undefined}
          data-qa-container={qa ? `tag:${qa}` : undefined}
          style={{
            position: 'relative',
            fontFamily: FONT,
            fontSize: size,
            fontWeight: weight,
            fontVariationSettings: `"INFM" 70, "BNCE" 30`,
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

/** Shared SVG filter for inked HTML borders; reseeds on threes so the line boils. */
export const InkFilters: React.FC<{frame: number}> = ({frame}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <filter id="inkwob" x="-5%" y="-20%" width="110%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={(Math.floor(frame / 3) % 3) + 1} />
      <feDisplacementMap in="SourceGraphic" scale={5} />
    </filter>
  </svg>
);

/** Format a number as it counts up: $1,234 or 22%. */
export const money = (v: number, prefix = '$', suffix = '') => `${prefix}${Math.round(v).toLocaleString('en-US')}${suffix}`;

/** Small source line, always bottom-left of its block, readable at phone size. */
export const Source: React.FC<{x: number; y: number; text: string; k?: number; qa?: string; color?: string; align?: 'left' | 'right'}> = ({
  x,
  y,
  text,
  k = 1,
  qa = 'source',
  color = P.inkSoft,
  align = 'left',
}) =>
  k <= 0 ? null : (
    <div
      data-qa={`text:${qa}`}
      data-qa-type="text"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: align === 'right' ? 'translateX(-100%)' : undefined,
        fontFamily: FONT,
        fontSize: 26,
        fontWeight: 600,
        fontVariationSettings: `"INFM" 20, "BNCE" 0`,
        color,
        opacity: clamp01(k * 2) * 0.92,
        whiteSpace: 'nowrap',
        padding: '4px 12px',
        background: 'rgba(255,253,247,0.72)',
        borderRadius: 6,
      }}
    >
      {text}
    </div>
  );
