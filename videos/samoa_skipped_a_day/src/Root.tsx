import React from 'react';
import {Composition, getInputProps} from 'remotion';
import {DURATION, FPS, W, H} from './lib';
import {Main} from './Main';
const ip = getInputProps() as {sub?: number};
const sub = ip.sub || 1;
export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main as any} durationInFrames={DURATION * sub} fps={FPS * sub} width={W} height={H} defaultProps={{sub}} />
  </>
);
