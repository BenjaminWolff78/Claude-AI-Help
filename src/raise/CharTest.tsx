import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {act} from './acting';
import {Coworker, Dan, Maya} from './characters';
import {P} from './lib';
import {Grain, Paper} from './stage';
import {FontLoader, Tag, Txt} from './text';

export const CharTest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <FontLoader />
      <Paper lines="grid" />
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <Maya name="maya" a={act(f, {seed: 1, reacts: [{t: 1, kind: 'smile'}]})} x={360} y={900} s={1.25} pose="hold" />
        <Coworker name="cw" a={act(f, {seed: 2, reacts: [{t: 1, kind: 'surprise'}]})} x={960} y={900} s={1.25} pose="whisper" />
        <Dan name="dan" a={act(f, {seed: 3, reacts: [{t: 1, kind: 'worry'}]})} x={1560} y={900} s={1.25} />
      </svg>
      <Txt x={960} y={60} size={90} align="center" riso={P.coral} qa="t">"don't take it."</Txt>
      <Tag x={120} y={80} text="MAYA" fill={P.teal} color={P.white} qa="tag" />
      <Grain />
    </AbsoluteFill>
  );
};
