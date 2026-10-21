import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {CharTest} from './raise/CharTest';
import {RaiseVideo} from './raise/RaiseVideo';
import {CharTest2} from './ep2/CharTest2';
import {Ep2Video} from './ep2/Ep2Video';
import {FloatVideo} from './float/FloatVideo';
import {SnapVideo} from './snap/SnapVideo';
import {CombVideo} from './comb/CombVideo';
import {NFRAMES as COMB_N} from './comb/lib';
import {GoldenVideo} from './golden/GoldenVideo';
import {NFRAMES as GOLDEN_N} from './golden/lib';
import {NFRAMES as SNAP_N} from './snap/lib';
import {NFRAMES as FLOAT_N} from './float/lib';
import {Ep2Thumb} from './ep2/Thumb2';
import ep2TL from './ep2/timeline.json';
import {BrandBanner, BrandPfp, BrandWatermark} from './brand/Brand';
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
    <Composition id="GoldenVideo" component={GoldenVideo} durationInFrames={GOLDEN_N} fps={30} width={1920} height={1080} />
    <Composition id="CombVideo" component={CombVideo} durationInFrames={COMB_N} fps={30} width={1920} height={1080} />
    <Composition id="SnapVideo" component={SnapVideo} durationInFrames={SNAP_N} fps={30} width={1920} height={1080} />
    <Composition id="FloatVideo" component={FloatVideo} durationInFrames={FLOAT_N} fps={30} width={1920} height={1080} />
    <Composition id="Ep2Video" component={Ep2Video} durationInFrames={Math.round(ep2TL.duration * 30)} fps={30} width={1920} height={1080} />
    <Composition id="CharTest2" component={CharTest2} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Still id="Ep2Thumb" component={Ep2Thumb} width={1280} height={720} />
    <Still id="BrandPfp" component={BrandPfp} width={800} height={800} />
    <Still id="BrandBanner" component={BrandBanner} width={2560} height={1440} />
    <Still id="BrandWatermark" component={BrandWatermark} width={600} height={600} />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
