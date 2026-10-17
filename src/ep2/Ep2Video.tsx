import React from 'react';
import {AbsoluteFill, getInputProps, useCurrentFrame} from 'remotion';
import {QaProbe} from './QaProbe';
import {Captions} from './Captions';
import {FPS, SUB, H, SC, TL, W, clamp01, easeInOut, easeOut} from './lib';
import {Cold, ColdFirstFrame, LetterScene, LindaScene, SceneProps} from './scenes1';
import {CoupleScene, PivotScene, RuleScene, StairsScene} from './scenes2';
import {CloseScene, EscapeScene, FixScene, NoteScene} from './scenes3';
import {Grain, TornEdge, tornClip} from './stage';
import {FontLoader, InkFilters} from './text';

type Enter = 'none' | 'torn-lr' | 'torn-bt' | 'slide-bt' | 'slide-tb' | 'push-left' | 'split';

const SCENES: {name: keyof typeof SC; C: React.FC<SceneProps>; enter: Enter; dur: number}[] = [
  {name: 'cold', C: Cold, enter: 'none', dur: 0},
  {name: 'linda', C: LindaScene, enter: 'torn-lr', dur: 0.7},
  {name: 'letter', C: LetterScene, enter: 'slide-tb', dur: 0.8},
  {name: 'rule', C: RuleScene, enter: 'torn-bt', dur: 0.7},
  {name: 'pivot', C: PivotScene, enter: 'push-left', dur: 0.7},
  {name: 'stairs', C: StairsScene, enter: 'torn-lr', dur: 0.6},
  {name: 'couple', C: CoupleScene, enter: 'slide-bt', dur: 0.8},
  {name: 'fix', C: FixScene, enter: 'torn-bt', dur: 0.7},
  {name: 'escape', C: EscapeScene, enter: 'push-left', dur: 0.7},
  {name: 'note', C: NoteScene, enter: 'torn-lr', dur: 0.6},
  {name: 'close', C: CloseScene, enter: 'split', dur: 0.7},
];

const Incoming: React.FC<{enter: Enter; k: number; seed: number; children: React.ReactNode}> = ({enter, k, seed, children}) => {
  if (k >= 1 || enter === 'none') return <AbsoluteFill>{children}</AbsoluteFill>;
  switch (enter) {
    case 'torn-lr':
    case 'torn-bt': {
      const dir = enter === 'torn-lr' ? 'lr' : 'bt';
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{clipPath: tornClip(k, seed, dir)}}>{children}</AbsoluteFill>
          <TornEdge k={k} seed={seed} dir={dir} />
        </AbsoluteFill>
      );
    }
    case 'slide-bt':
      return <AbsoluteFill style={{transform: `translateY(${((1 - k) * H).toFixed(1)}px)`, boxShadow: '0 -20px 40px rgba(40,30,20,0.25)'}}>{children}</AbsoluteFill>;
    case 'slide-tb':
      return <AbsoluteFill style={{transform: `translateY(${(-(1 - k) * H).toFixed(1)}px)`, boxShadow: '0 20px 40px rgba(40,30,20,0.25)'}}>{children}</AbsoluteFill>;
    case 'push-left':
      return <AbsoluteFill style={{transform: `translateX(${((1 - k) * W).toFixed(1)}px)`}}>{children}</AbsoluteFill>;
    case 'split': {
      const half = (W / 2) * k;
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{clipPath: `polygon(0 0, ${half}px 0, ${half}px ${H}px, 0 ${H}px)`}}>{children}</AbsoluteFill>
          <AbsoluteFill style={{clipPath: `polygon(${W - half}px 0, ${W}px 0, ${W}px ${H}px, ${W - half}px ${H}px)`}}>{children}</AbsoluteFill>
        </AbsoluteFill>
      );
    }
  }
  return <AbsoluteFill>{children}</AbsoluteFill>;
};

const outgoingStyle = (enter: Enter, k: number): React.CSSProperties => {
  if (k <= 0 || k >= 1) return {};
  if (enter === 'slide-bt') return {transform: `translateY(${(-k * H * 0.3).toFixed(1)}px)`};
  if (enter === 'slide-tb') return {transform: `translateY(${(k * H * 0.3).toFixed(1)}px)`};
  if (enter === 'push-left') return {transform: `translateX(${(-k * W).toFixed(1)}px)`};
  return {};
};

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
    const kIn = s.dur > 0 ? easeInOut(clamp01((t - start) / s.dur)) : 1;
    const kOut = next ? easeInOut(clamp01((t - nextStart) / Math.max(0.01, nextDur))) : 0;
    layers.push(
      <AbsoluteFill key={s.name} data-qa-scene={s.name} data-qa-trans={kIn < 1 || kOut > 0 ? '1' : '0'} style={outgoingStyle(next?.enter ?? 'none', kOut)}>
        <Incoming enter={s.enter} k={kIn} seed={i * 7 + 3}>
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
