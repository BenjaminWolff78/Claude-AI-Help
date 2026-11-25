#!/usr/bin/env python3
"""Usage: python3 measure_like_rick.py our_video.mp4 [rick_targets.json] [--words words.json]
--words: the narration's word timings ([[start,end,word],...] or [{"word","start","end"},...]); adds the voice-pace rows.
Measures every frame of our render with the same method used on Rick's 27 story Shorts
(checked against the browser version: per-frame camera values correlate 0.9-1.0),
writes <video>_frames.csv and <video>_vs_rick.md into the current folder, and prints the comparison."""
import sys, os, csv, json, re
import numpy as np
from rickcore import measure, rows_from, summary, extra, COLS
M=[ # key, label, unit, too_low_fix, too_high_fix
 ('hold','Camera perfectly still','% of frames','','Camera sits dead still too often: keep a slow push-in or drift under holds.'),
 ('drift','Camera drifting slowly','% of frames','Add slow 0.3-2 px/frame drifts and push-ins between bigger moves.',''),
 ('move','Camera clearly moving','% of frames','Too static: add push-ins, short glides and tracking on action.','Camera too busy: calm some moves into drifts.'),
 ('med_speed','Median camera speed','px/frame @720','Camera too slow overall.','Camera too fast overall.'),
 ('p90_speed','Fast-move speed (p90)','px/frame @720','Big moves are too timid: make key moves faster.','Big moves are too violent: slow the fastest moves.'),
 ('moves10','Camera moves per 10 s','count','Too few distinct moves: add a new move per sentence.','Too many moves: merge or drop some.'),
 ('move_median_s','Typical move length','s','Moves too short/jerky.','Moves too long: make moves shorter and punchier.'),
 ('move_ease_in_median_frames','Ease-in to peak speed','frames','Moves start too abruptly: ease in over ~5 frames.','Moves take too long to get going: reach peak in ~5 frames.'),
 ('zoom_dominant_move_pct','Moves that are mostly push-in/pull-out','%','Use more push-ins/pull-outs instead of sideways pans.','Use more sideways glides and tracking.'),
 ('roll_p95_deg','Camera roll per frame (p95)','deg','',"Too much roll: Rick's camera barely rolls."),
 ('hold_run_p90_s','Longest still holds (p90)','s','','Still holds last too long: keep something moving.'),
 ('mean_speed_first3s','Camera speed in the first 3 s','px/frame','Opening is too static: move the camera from frame 1.','Opening camera too frantic.'),
 ('cuts_per_min','Hard cuts','per min','','Too many hard cuts: use motivated transitions or camera moves.'),
 ('caption_changes_per_s','Caption changes','per s','Captions change too slowly: 1-3 words, swap on every word group.','Captions change too fast.'),
 ('luma','Brightness','0-255','Too dark overall.','Too bright/washed out.'),
 ('sat','Saturation','0-1','Colours too dull.','Colours too saturated.'),
 ('nblack','Near-black pixels','% (median)','','Too much pure black: lift shadows, thinner/fewer black areas.'),
 ('white_pct_mean','Pure white pixels','%','','Too much pure white: avoid blown highlights.'),
 ('detail','Background detail','edge strength','Worlds too plain: add texture, props and small geometry.','Picture too busy/noisy.'),
 ('anim','Animation outside camera move','0-255 (median)','Characters and world too still: add the life layer and moving props.','Too much motion noise.'),
 ('blurry_pct','Blurry frames (detail under 6.5, Rick\'s 5th percentile)','% of frames','','Too much mush: inserts inside foliage, soft foreground layers, glows or slow dissolves. See the WHERE list for the times.'),
 ('length_s','Length','s','Shorter than most of Rick\'s Shorts.','Longer than most of Rick\'s Shorts.'),
 ('shot_changes10','Shot changes (whips, fast moves, cuts) per 10 s','count','Too few new framings.','Too many shot changes: let shots run, group quick changes and then calm down.'),
 ('calm_gap_p90_s','Longest calm stretches (p90 time between shot changes)','s','No calm stretches: give the key lines a 3-5 s shot with only a slow drift or push-in.','Shots run too long without a new framing.'),
 ('calm_3s_count','Calm stretches of 3 s or more','count','Too few calm stretches: the video never breathes. Add 3-5 s shots (trick, payoff, key reactions).','Too many long calm shots.'),
]
MW=[ # voice rows, only with --words
 ('syl_per_s','Voice speed','syllables per s','Voice too slow.','Voice too fast: lower or drop the tempo pass, or cut words.'),
 ('words_per_sentence','Sentence length','words per sentence','Too many short, choppy sentences: join them with and, so, but, because, while.','Sentences too long.'),
 ('short_sentence_pct','Very short sentences (4 words or fewer)','% of sentences','','Too many fragments: they make the voice feel rushed and choppy.'),
]
def syl(w):
    w=re.sub(r'[^a-z]','',w.lower())
    if not w: return 0
    if len(w)<=3: return 1
    w=re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$','',w); w=re.sub(r'^y','',w)
    return max(1,len(re.findall(r'[aeiouy]{1,2}',w)))
def speech(path):
    W=json.load(open(path)); W=W.get('words',W) if isinstance(W,dict) else W
    W=[(float(w['start']),float(w['end']),str(w.get('word',w.get('text','')))) if isinstance(w,dict) else (float(w[0]),float(w[1]),str(w[2])) for w in W]
    dur=W[-1][1]-W[0][0]; txt=' '.join(w[2] for w in W)
    S=[x for x in re.split(r'(?<=[.!?])\s+',txt) if x.strip()]; L=[len(x.split()) for x in S]
    return {'syl_per_s':round(sum(syl(w[2]) for w in W)/dur,2),'words_per_sentence':round(float(np.mean(L)),1),'short_sentence_pct':round(100*sum(l<=4 for l in L)/len(L),1)}
def pacing(rows):
    t=np.array([r[1] for r in rows],float); sp=np.nan_to_num(np.array([r[8] if r[8] is not None else 0 for r in rows],float))
    fc=np.nan_to_num(np.array([r[11] if r[11] is not None else 0 for r in rows],float)); hc=np.array([int(r[2] or 0) for r in rows])
    dur=t[-1]; med=np.median(fc); flag=(sp>15)|(fc>max(25,6*med))|(hc==1); evs=[]
    for i in np.where(flag)[0]:
        if not evs or t[i]-evs[-1]>0.5: evs.append(t[i])
    gaps=np.diff([0]+evs+[dur])
    return {'shot_changes10':round(len(evs)/dur*10,2),'calm_gap_p90_s':round(float(np.percentile(gaps,90)),2),'calm_3s_count':int((gaps>=3).sum())}
def where(rows):
    t=np.array([r[1] for r in rows],float); sp=np.nan_to_num(np.array([r[8] if r[8] is not None else 0 for r in rows],float))
    fc=np.nan_to_num(np.array([r[11] if r[11] is not None else 0 for r in rows],float)); hc=np.array([int(r[2] or 0) for r in rows])
    di=COLS.index('detail'); de=np.array([r[di] if r[di] is not None else 99 for r in rows],float)
    dur=t[-1]; med=np.median(fc); flag=(sp>15)|(fc>max(25,6*med))|(hc==1); evs=[]
    for i in np.where(flag)[0]:
        if not evs or t[i]-evs[-1]>0.5: evs.append(t[i])
    cuts=[t[i] for i in range(len(hc)) if hc[i]==1 and (i==0 or hc[i-1]==0)]
    st=[0]+evs; g=np.diff([0]+evs+[dur]); calm=[(a,a+b) for a,b in zip(st,g) if b>=3]
    bl=de<6.5; runs=[]; i=0
    while i<len(bl):
        if bl[i]:
            j=i
            while j+1<len(bl) and bl[j+1]: j+=1
            if t[j]-t[i]>=0.2: runs.append((t[i],t[j]))
            i=j+1
        else: i+=1
    f=lambda x:f'{x:.1f}'
    return ('\n## WHERE (times in s)\n\n'
      f"- Hard cuts ({len(cuts)}): {', '.join(f(x) for x in cuts) or 'none'}\n"
      f"- Shot changes ({len(evs)}): {', '.join(f(x) for x in evs)}\n"
      f"- Calm stretches of 3 s or more ({len(calm)}): {', '.join(f(a)+'-'+f(b) for a,b in calm) or 'none'}\n"
      f"- Blurry stretches of 0.2 s or more ({len(runs)}): {', '.join(f(a)+'-'+f(b) for a,b in runs) or 'none'}\n"
      '\nThe detector misses some cuts that land on a similar picture; check the frames around each listed time.\n')
def main():
    a=sys.argv[1:]; wp=None
    if '--words' in a: i=a.index('--words'); wp=a[i+1]; a=a[:i]+a[i+2:]
    vid=a[0]; tp=a[1] if len(a)>1 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'rick_targets.json')
    T=json.load(open(tp))['targets']
    rows=rows_from(measure(vid)); s=summary(rows); s.update(extra(rows)); s['length_s']=round(len(rows)/30,1); s.update(pacing(rows)); di=COLS.index('detail'); dv=[r[di] for r in rows if r[di] is not None]; s['blurry_pct']=round(100*float(np.mean([x<6.5 for x in dv])),1)
    MM=M+(MW if wp else [])
    if wp: s.update(speech(wp))
    base=os.path.join(os.getcwd(),os.path.splitext(os.path.basename(vid))[0])
    with open(base+'_frames.csv','w',newline='') as f:
        w=csv.writer(f); w.writerow(COLS); [w.writerow([float(x) if hasattr(x,'item') else x for x in r]) for r in rows]
    out=['| Metric | Ours | Rick typical (middle half) | Rick median | Verdict | Fix |','|---|---|---|---|---|---|']
    for k,lab,unit,lo,hi in MM:
        t=T[k]; v=s[k]
        if t['p25']<=v<=t['p75']: verdict='OK'; fix=''
        elif v<t['p25']: verdict='LOW' if v>=t['min'] else 'LOW (outside all 27)'; fix=lo
        else: verdict='HIGH' if v<=t['max'] else 'HIGH (outside all 27)'; fix=hi
        if not fix and verdict!='OK': verdict='OK (harmless side)'
        out.append(f"| {lab} ({unit}) | {v} | {t['p25']} - {t['p75']} | {t['median']} | {verdict} | {fix} |")
    md=f"# {os.path.basename(vid)} vs Rick's 27 story Shorts\n\nFrames measured: {len(rows)}\n\n"+'\n'.join(out)+'\n'+where(rows)
    open(base+'_vs_rick.md','w').write(md); print(md)
if __name__=='__main__': main()
