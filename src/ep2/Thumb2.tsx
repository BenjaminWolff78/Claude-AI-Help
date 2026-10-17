import React from 'react';
import {AbsoluteFill} from 'remotion';
import {act} from './acting';
import {Linda} from './characters';
import {P} from './lib';
import {CliffBlock, Clouds, Coin} from './props';
import {Grain, Paper} from './stage';
import {FontLoader, InkFilters, Txt} from './text';

/** 1280x720 thumbnail: one subject (Linda with the letter), three words. Drawn on the 1920 grid, scaled 2/3. */
export const Ep2Thumb: React.FC = () => {
  const a = act(60, {seed: 5, reacts: [{t: 1.5, kind: 'shock', hold: 5}], look: [{t: 1.4, x: 1, y: -0.3, hold: 5}]});
  return (
    <AbsoluteFill style={{background: P.sky}}>
      <FontLoader />
      <InkFilters frame={60} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: 'scale(0.6667)', transformOrigin: '0 0'}}>
        <Paper color={P.sky} id="thumb2" />
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Clouds t={4} y={120} n={4} seed={77} s={1.1} />
          <CliffBlock x={-100} y={820} w={1500} h={400} seed={78} />
          <g transform="translate(1530 900) rotate(30)">
            <Coin x={0} y={0} r={40} seed={79} />
          </g>
          <Linda name="linda" a={a} x={520} y={1160} s={1.95} pose="letter" />
        </svg>
        <Txt x={1420} y={150} size={210} align="center" color={P.ink} riso={P.mustard} weight={800} rot={-4} qa="th1">
          THE $1
        </Txt>
        <Txt x={1420} y={430} size={230} align="center" color={P.white} riso={P.berry} weight={800} rot={3} bounce={70} qa="th2">
          CLIFF
        </Txt>
      </div>
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
