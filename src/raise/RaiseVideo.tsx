import React from 'react';
import {AbsoluteFill, getInputProps, useCurrentFrame} from 'remotion';
import {QaProbe} from './QaProbe';
import {Captions} from './Captions';
import {FPS, SUB, H, SC, TL, W, clamp01, easeInOut, easeOut} from './lib';
import {Claim, Cold, ColdFirstFrame, MayaScene, SceneProps, Setup} from './scenesA';
import {Buckets, MathScene, Pivot} from './scenesB';
import {CliffScene, CloseScene, CostScene, DanScene, MoveScene, StatusScene} from './scenesC';
import {Grain, TornEdge, tornClip} from './stage';
import {Enter, Incoming, outgoingStyle} from '../mg/transitions';
import {FontLoader, InkFilters} from './text';


const SCENES: {name: keyof typeof SC; C: React.FC<SceneProps>; enter: Enter; dur: number}[] = [
  {name: 'cold', C: Cold, enter: 'none', dur: 0},
  {name: 'setup', C: Setup, enter: 'none', dur: 0},
  {name: 'claim', C: Claim, enter: 'torn-lr', dur: 0.7},
  {name: 'maya', C: MayaScene, enter: 'scribble', dur: 0.95},
  {name: 'buckets', C: Buckets, enter: 'slide-bt', dur: 0.8},
  {name: 'math', C: MathScene, enter: 'page', dur: 0.9},
  {name: 'pivot', C: Pivot, enter: 'torn-lr', dur: 0.6},
  {name: 'dan', C: DanScene, enter: 'drop', dur: 1.0},
  {name: 'cliff', C: CliffScene, enter: 'slide-tb', dur: 0.8},
  {name: 'cost', C: CostScene, enter: 'scribble', dur: 0.95},
  {name: 'move', C: MoveScene, enter: 'page', dur: 0.9},
  {name: 'status', C: StatusScene, enter: 'push-left', dur: 0.7},
  {name: 'close', C: CloseScene, enter: 'split', dur: 0.7},
];

export const RaiseVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (frame + SUB) / FPS;
  const layers: React.ReactNode[] = [];
  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    const start = SC[s.name].start;
    const next = SCENES[i + 1];
    const nextStart = next ? SC[next.name].start : TL.duration + 1;
    const nextDur = next ? next.dur : 0;
    if (t < start || t >= nextStart + nextDur) continue;
    const lin = (e: Enter, x: number) => (e === 'page' || e === 'scribble' || e === 'drop' ? x : easeInOut(x));
    const kIn = s.dur > 0 ? lin(s.enter, clamp01((t - start) / s.dur)) : 1;
    const kOut = next ? lin(next.enter, clamp01((t - nextStart) / Math.max(0.01, nextDur))) : 0;
    layers.push(
      <AbsoluteFill key={s.name} data-qa-scene={s.name} data-qa-trans={kIn < 1 || kOut > 0 ? '1' : '0'} style={outgoingStyle(next?.enter ?? 'none', kOut)}>
        <Incoming enter={s.enter} k={kIn} seed={i * 7 + 3} t={t} t0={start}>
          <s.C t={t} />
        </Incoming>
      </AbsoluteFill>,
    );
  }
  // Loop: a torn-paper wipe reveals the very first frame of the video.
  const wipe = clamp01((t - TL.beats.end.wipe) / (TL.duration - TL.beats.end.wipe - 1 / FPS));
  return (
    <AbsoluteFill style={{background: '#EFE8D8'}}>
      <FontLoader />
      <InkFilters frame={frame} />
      {layers}
      {wipe > 0 ? (
        <AbsoluteFill data-qa-scene="loop" data-qa-trans="1">
          <AbsoluteFill style={{clipPath: tornClip(easeOut(wipe) * 1.02, 41, 'lr')}}>
            <ColdFirstFrame />
          </AbsoluteFill>
          <TornEdge k={easeOut(wipe) * 1.02} seed={41} dir="lr" />
        </AbsoluteFill>
      ) : null}
      <Captions />
      <Grain opacity={0.09} />
      {(getInputProps() as {qa?: boolean}).qa ? <QaProbe /> : null}
    </AbsoluteFill>
  );
};
