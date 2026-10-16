import React from 'react';
import {AbsoluteFill} from 'remotion';
import {act} from './acting';
import {Maya} from './characters';
import {P} from './lib';
import {Grain, Paper} from './stage';
import {FontLoader, InkFilters, Txt} from './text';

/** 1280x720 thumbnail: one subject (shocked Maya with her paycheck), three words. Laid out on the
 * video's 1920x1080 grid and scaled by 2/3 so it shares the video's line weights and type. */
export const RaiseThumb: React.FC = () => {
  const a = act(60, {seed: 5, reacts: [{t: 1.5, kind: 'shock', hold: 5}], look: [{t: 1.4, x: 1, y: -0.3, hold: 5}]});
  return (
    <AbsoluteFill style={{background: P.paper ?? '#EFE8D8'}}>
      <FontLoader />
      <InkFilters frame={60} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: 'scale(0.6667)', transformOrigin: '0 0'}}>
        <Paper color={P.salmon} id="thumb" />
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Maya name="maya" a={a} x={540} y={1130} s={1.9} pose="hold" />
        </svg>
        <Txt x={1400} y={190} size={200} align="center" color={P.ink} riso={P.mustard} weight={800} rot={-4} qa="th1">
          RAISE
        </Txt>
        <Txt x={1400} y={430} size={110} align="center" color={P.ink} weight={800} rot={-2} qa="th2">
          =
        </Txt>
        <Txt x={1390} y={580} size={168} align="center" color={P.white} riso={P.ink} weight={800} rot={3} bounce={70} qa="th3">
          POORER?
        </Txt>
      </div>
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
