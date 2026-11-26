import csv,json,numpy as np,itertools
R=list(csv.DictReader(open('Why He Let His Tap Drip All Night in the Freeze_frames.csv')))
s=np.array(json.load(open('/home/claude/p13/v31/remap.json'))['story'],float)
sp=np.array([float(r['cam_speed_px']) if r['cam_speed_px'] not in ('','None') else 0 for r in R]); cut=np.array([int(r['hard_cut']) for r in R]); fc=np.array([float(r['frame_change'] or 0) for r in R]); FCT=max(25,6*np.median(fc)); print('fc thresh',FCT)
t=np.arange(len(R))/30; dur=t[-1]
def p90(remove):
    flag=(sp>15)|(cut==1)|(fc>FCT)
    for a,b in remove: flag[(s>=a)&(s<=b)&(cut==0)]=False
    evs=[]
    for i in np.where(flag)[0]:
        if not evs or t[i]-evs[-1]>0.5: evs.append(t[i])
    g=np.diff([0]+evs+[dur]); return np.percentile(g,90), len(evs), sorted(np.round(g,2))[-7:]
C={'swing5':(458,476),'glide6':(500,514),'s17a':(1736,1770),'s17spk':(1790,1845),'s13spk':(1236,1270),'s15':(1575,1595),'s16':(1620,1632),'s11':(900,916),'w1011':(850,868),'s15spk':(1529,1533),'s9':(755,772),'s8':(630,660)}
print('base',p90([]))
for k,v in C.items(): print(k, p90([v]))
for combo in [('s17spk',),('s17spk','s13spk'),('s17spk','s13spk','glide6'),('s17spk','s11'),('s17spk','s13spk','s11'),('s17spk','s15','s16'),('s17spk','s13spk','s15spk')]:
    print(combo, p90([C[k] for k in combo]))
