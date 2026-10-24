import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {FPS, clamp, eio3, lerp, prog} from './lib';
import {S1, S2, S3, Full} from './scenesA';
import {S4, S4b, S5} from './scenesB';
import {S6, S7} from './scenesC';
import {Captions} from './Captions';

const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const list: [string, string, string][] = [['Nunito', 'fonts/nunito900.woff2', '900'], ['Nunito', 'fonts/nunito800.woff2', '800'], ['Nunito', 'fonts/nunito700.woff2', '700']];
    Promise.all(list.map(([n, f, w]) => new FontFace(n, `url(${staticFile(f)})`, {weight: w}).load().then((ff) => (document.fonts as any).add(ff)))).then(() => continueRender(h));
  }, [h]);
  return null;
};
const L: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, overflow: 'hidden', ...style}}>{children}</div>;

export const Scene: React.FC<{t: number}> = ({t}) => {
  const tilt = eio3(prog(t, 2.72, 3.12));
  const dive = eio3(prog(t, 9.86, 10.18));
  const ring = eio3(prog(t, 12.32, 12.8)) * 2300;
  const tw = eio3(prog(t, 28.58, 29.42));
  const iris = eio3(prog(t, 35.78, 36.27)) * 1500;
  return (
    <>
      {t < 3.15 && <L style={{transform: `translateY(${1920 * tilt}px)`}}><S1 t={t} /></L>}
      {t >= 2.72 && t < 10.2 && <L style={{transform: `translateY(${-1920 * (1 - tilt) - 1920 * dive}px)`}}><S2 t={t} /></L>}
      {t >= 9.86 && t < 12.8 && <L style={{transform: `translateY(${1920 * (1 - dive)}px)`}}><S3 t={t} /></L>}
      {t >= 12.32 && t < 18.7 && <L style={t < 12.8 ? {clipPath: `circle(${ring}px at 540px 340px)`} : undefined}><S4 t={t} /></L>}
      {t >= 22.2 && t < 25.1 && <L><S5 t={t} /></L>}
      {t >= 18.28 && t < 22.64 && <L><S4b t={t} /></L>}
      {t >= 28.58 && (
        <L style={{background: '#EAD7AE'}}>
          <L style={{transform: `rotate(${150 * (1 - tw)}deg) scale(${lerp(2.3, 1, tw)})`, transformOrigin: '540px 960px'}}><S7 t={t} /></L>
        </L>
      )}
      {t >= 25.1 && t < 29.42 && (
        <L style={{transform: `rotate(${-210 * tw}deg) scale(${lerp(1, 0.05, tw)})`, transformOrigin: '540px 960px', filter: tw > 0 ? `sepia(${tw}) saturate(${1 - 0.4 * tw})` : undefined}}><S6 t={t} /></L>
      )}
      {t >= 35.78 && <L style={{clipPath: `circle(${iris}px at 540px 1000px)`}}><S1 t={t - 36.3} /></L>}
    </>
  );
};

export const Main: React.FC<{sub?: number; tOverride?: number}> = ({sub = 1, tOverride}) => {
  const f = useCurrentFrame();
  const i = Math.floor(f / sub), k = f % sub;
  const t = tOverride !== undefined ? tOverride : i / FPS + (sub > 1 ? ((k + 0.5) / sub) * (0.5 / FPS) : 0);
  return (
    <AbsoluteFill style={{background: '#0F1840'}}>
      <Fonts />
      <Scene t={t} />
      <L style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(8,10,30,0.28) 100%)'}}><div /></L>
      <Captions t={t} />
    </AbsoluteFill>
  );
};
