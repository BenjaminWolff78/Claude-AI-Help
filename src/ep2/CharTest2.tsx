import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {act} from './acting';
import {June, Linda, Walt} from './characters';
import {P} from './lib';
import {Paper} from './stage';

export const CharTest2: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Paper color={P.paperWarm} />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <Linda name="l1" a={act(f, {seed: 1, reacts: [{t: 0.5, kind: 'smile', hold: 5}]})} x={250} y={560} s={0.9} />
        <Linda name="l2" a={act(f, {seed: 2, reacts: [{t: 0.5, kind: 'worry', hold: 5}]})} x={620} y={560} s={0.9} pose="letter" />
        <Linda name="l3" a={act(f, {seed: 3, reacts: [{t: 0.5, kind: 'shock', hold: 5}]})} x={990} y={560} s={0.9} pose="phone" />
        <Linda name="l4" a={act(f, {seed: 4, reacts: [{t: 0.5, kind: 'think', hold: 5}]})} x={1380} y={560} s={0.9} pose="shrug" />
        <Linda name="l5" a={act(f, {seed: 5})} x={1740} y={560} s={0.9} pose="pencil" />
        <Linda name="l6" a={act(f, {seed: 6})} x={300} y={1060} s={0.75} legs />
        <Walt name="w" a={act(f, {seed: 7, reacts: [{t: 0.5, kind: 'smile', hold: 5}]})} x={800} y={1060} s={0.95} />
        <June name="j" a={act(f, {seed: 8, reacts: [{t: 0.5, kind: 'surprise', hold: 5}]})} x={1200} y={1060} s={0.95} />
      </svg>
    </AbsoluteFill>
  );
};
