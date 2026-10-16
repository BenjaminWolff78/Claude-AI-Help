import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {CharTest} from './raise/CharTest';
import {RaiseVideo} from './raise/RaiseVideo';
import raiseTL from './raise/timeline.json';

export const Root: React.FC = () => (
  <>
    <Composition
      id="EffortVideo"
      component={EffortVideo}
      durationInFrames={Math.round(TL.duration * FPS)}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition id="RaiseVideo" component={RaiseVideo} durationInFrames={Math.round(raiseTL.duration * 30)} fps={30} width={1920} height={1080} />
    <Composition id="CharTest" component={CharTest} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
