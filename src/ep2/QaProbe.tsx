import {useLayoutEffect} from 'react';
import {useCurrentFrame} from 'remotion';

/**
 * QA probe (only mounted when inputProps.qa is true): after each frame lays out, report
 * the screen boxes of everything tagged data-qa, plus whether any text overflows its box.
 */
export const QaProbe: React.FC = () => {
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    const out: {id: string; type: string; x: number; y: number; w: number; h: number; clip?: boolean; container?: string; scene?: string; trans?: boolean}[] = [];
    document.querySelectorAll<HTMLElement | SVGElement>('[data-qa]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const style = window.getComputedStyle(el as Element);
      if (style.opacity === '0' || style.visibility === 'hidden') return;
      let op = 1;
      let p: Element | null = el as Element;
      while (p) {
        op *= parseFloat(window.getComputedStyle(p).opacity || '1');
        p = p.parentElement;
      }
      if (op < 0.35) return;
      const he = el as HTMLElement;
      const clip = he.scrollWidth !== undefined && he.clientWidth > 0 && he.scrollWidth > he.clientWidth + 2 && style.overflow === 'hidden';
      out.push({
        id: el.getAttribute('data-qa')!,
        type: el.getAttribute('data-qa-type') ?? 'text',
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        clip,
        container: el.getAttribute('data-qa-container') ?? undefined,
        scene: (el as Element).closest('[data-qa-scene]')?.getAttribute('data-qa-scene') ?? 'global',
        trans: (el as Element).closest('[data-qa-scene]')?.getAttribute('data-qa-trans') === '1',
      });
    });
    // eslint-disable-next-line no-console
    console.log('QA|' + frame + '|' + JSON.stringify(out));
  });
  return null;
};
