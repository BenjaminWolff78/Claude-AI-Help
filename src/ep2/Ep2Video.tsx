import React from 'react';
import {AbsoluteFill, getInputProps, useCurrentFrame} from 'remotion';
import {QaProbe} from './QaProbe';
import {Captions} from './Captions';
import {FPS, SUB, H, SC, TL, W, clamp01, easeInOut, easeOut} from './lib';
import {Cold, ColdFirstFrame, LetterScene, LindaScene, SceneProps} from './scenes1';
import {CoupleScene, PivotScene, RuleScene, StairsScene} from './scenes2';
import {CloseScene, EscapeScene, FixScene, NoteScene} from './scenes3';
import {Grain, TornEdge, tornClip} from './stage';
import {Enter, Incoming, outgoingStyle} from '../mg/transitions';
import {FontLoader, InkFilters} from './text';


const SCENES: {name: keyof typeof SC; C: React.FC<SceneProps>; enter: Enter; dur: number}[] = [
  {name: 'cold', C: Cold, enter: 'none', dur: 0},
  {name: 'linda', C: LindaScene, enter: 'scribble', dur: 0.95},
  {name: 'letter', C: LetterScene, enter: 'slide-tb', dur: 0.8},
  {name: 'rule', C: RuleScene, enter: 'page', dur: 0.9},
  {name: 'pivot', C: PivotScene, enter: 'push-left', dur: 0.7},
  {name: 'stairs', C: StairsScene, enter: 'torn-lr', dur: 0.6},
  {name: 'couple', C: CoupleScene, enter: 'drop', dur: 1.0},
  {name: 'fix', C: FixScene, enter: 'page', dur: 0.9},
  {name: 'escape', C: EscapeScene, enter: 'push-left', dur: 0.7},
  {name: 'note', C: NoteScene, enter: 'scribble', dur: 0.95},
  {name: 'close', C: CloseScene, enter: 'split', dur: 0.7},
];

export const Ep2Video: React.FC = () => {
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
  const wipe = clamp01((t - TL.end.wipe) / (TL.duration - TL.end.wipe - 1 / FPS));
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
