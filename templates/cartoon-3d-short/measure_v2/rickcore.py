"""Measure a vertical video exactly the way Rick's Clips' 27 story Shorts were measured
(browser method ported to Python), then compare against the reference ranges."""
import subprocess, json, math, statistics as st, numpy as np
W,H=360,640; TS=12*0+64; R=12
BANDS=[(0.03,0.29),(0.29,0.56),(0.80,0.97)]; COLX=[0.2,0.5,0.8]
TILES=[(round(c*W-TS/2), round(((a+b)/2)*H-TS/2)) for a,b in BANDS for c in COLX]
CY0,CY1=round(0.60*H),round(0.78*H)
OFFS=[(4,0),(-4,0),(0,4),(0,-4),(3,3),(-3,3)]

def frames(path):
    p=subprocess.Popen(['ffmpeg','-v','error','-i',path,'-vf',f'scale={W}:{H}:flags=bilinear','-pix_fmt','rgb24','-f','rawvideo','-'],stdout=subprocess.PIPE)
    n=W*H*3
    while True:
        b=p.stdout.read(n)
        if len(b)<n: break
        yield np.frombuffer(b,np.uint8).reshape(H,W,3)
    p.wait()

def luma(f):
    f=f.astype(np.int32); return ((54*f[...,0]+183*f[...,1]+19*f[...,2])>>8)

def sad(A,B,x0,y0,dx,dy,step):
    a=A[y0:y0+TS:step, x0:x0+TS:step]; b=B[y0+dy:y0+dy+TS:step, x0+dx:x0+dx+TS:step]
    return float(np.abs(a-b).mean())

def tile_shift(A,B,x0,y0):
    s=A[y0:y0+TS:4, x0:x0+TS:4].astype(np.float64); sd=float(s.std())
    best=1e9; bx=by=0
    for dy in range(-R,R+1,2):
        for dx in range(-R,R+1,2):
            v=sad(A,B,x0,y0,dx,dy,4)
            if v<best: best,bx,by=v,dx,dy
    S={}; b2=1e9; fx,fy=bx,by
    for dy in range(by-2,by+3):
        for dx in range(bx-2,bx+3):
            if abs(dx)>R+1 or abs(dy)>R+1: continue
            v=sad(A,B,x0,y0,dx,dy,2); S[(dx,dy)]=v
            if v<b2: b2,fx,fy=v,dx,dy
    sx,sy=float(fx),float(fy)
    l,r=S.get((fx-1,fy)),S.get((fx+1,fy)); u,d=S.get((fx,fy-1)),S.get((fx,fy+1))
    if l is not None and r is not None:
        den=l-2*b2+r
        if den>0: sx=fx+max(-0.5,min(0.5,0.5*(l-r)/den))
    if u is not None and d is not None:
        den=u-2*b2+d
        if den>0: sy=fy+max(-0.5,min(0.5,0.5*(u-d)/den))
    return dict(u=sx,v=sy,sad=b2,sd=sd,cx=x0+TS/2-W/2,cy=y0+TS/2-H/2)

def fit(ts):
    use=[t for t in ts if t['sd']>=4 and t['sad']<30]
    for _ in range(3):
        if len(use)<3: return None
        A=[];b=[]
        for t in use:
            A.append([1,0,t['cx'],-t['cy']]); b.append(t['u']); A.append([0,1,t['cy'],t['cx']]); b.append(t['v'])
        A=np.array(A,float); b=np.array(b,float)
        try: p=np.linalg.solve(A.T@A,A.T@b)
        except np.linalg.LinAlgError: return None
        res=[math.hypot(t['u']-(p[0]+p[2]*t['cx']-p[3]*t['cy']), t['v']-(p[1]+p[2]*t['cy']+p[3]*t['cx'])) for t in use]
        bad=[(e,i) for i,e in enumerate(res) if e>1.5]
        if not bad or len(use)<=4: return p,len(use)
        bad.sort(reverse=True); use=[t for i,t in enumerate(use) if i!=bad[0][1]]
    return None

def measure(path, src_height=1920):
    out={k:[] for k in ['frame','dx','dy','zoom','roll','ntile','resid','cut','diff','R','G','B','sat','nblack','white','detail','capN','capW','capCh','height']}
    prev=None; prevcap=None
    for i,f in enumerate(frames(path)):
        L=luma(f); sub=f[::4,::4].astype(np.int32); Ls=L[::4,::4]
        mx=sub.max(2); mn=sub.min(2); n=Ls.size
        sat=np.where(mx>0,(mx-mn)/np.maximum(mx,1),0).mean()
        diff=float(np.abs(Ls-prev[::4,::4]).mean()) if prev is not None else 0.0
        ys=np.arange(0,H,4); xs=np.arange(0,W,4)
        yy,xx=np.meshgrid(ys,xs,indexing='ij'); m=((yy<CY0)|(yy>=CY1))&(xx<W-2)&(yy<H-2)
        Ld=L[yy[m],xx[m]]; det=np.abs(L[yy[m],xx[m]+2]-Ld)+np.abs(L[yy[m]+2,xx[m]]-Ld)
        # caption mask
        fi=f.astype(np.int32); mnf=fi.min(2); mxf=fi.max(2)
        band_white=np.zeros((CY1-CY0,W),bool); band_white[:,4:W-4]=mnf[CY0:CY1,4:W-4]>235
        dark=np.zeros_like(band_white)
        for ox,oy in OFFS:
            sh=np.zeros_like(band_white); src=mxf<60
            ys0=CY0+oy; sh[:,4:W-4]=src[ys0:ys0+(CY1-CY0), 4+ox:W-4+ox]; dark|=sh
        cap=band_white&dark; capN=int(cap.sum()); cols=np.where(cap.any(0))[0]; capW=int(cols.max()-cols.min()) if len(cols) else 0
        capCh=0
        if prevcap is not None:
            a=cap.ravel()[::2]; b=prevcap.ravel()[::2]; un=int((a|b).sum()); xo=int((a!=b).sum())
            capCh=1 if un>20 and xo/un>0.35 else 0
        cam=None; ntile=0; resid=0.0; cut=0
        if prev is not None:
            ts=[tile_shift(prev,L,x,y) for x,y in TILES]; ft=fit(ts); resid=sum(t['sad'] for t in ts)/len(ts)
            if ft: cam,ntile=ft
            if diff>35 or (ft is None and diff>18): cut=1
        q=lambda x,s: round(x*s)/s
        out['frame'].append(i)
        for k,j,s in (('dx',0,10),('dy',1,10),('zoom',2,1e4),('roll',3,1e4)): out[k].append(q(float(cam[j]),s) if cam is not None else np.nan)
        out['ntile'].append(ntile); out['resid'].append(round(resid)); out['cut'].append(cut); out['diff'].append(round(diff))
        for k,c in (('R',0),('G',1),('B',2)): out[k].append(round(float(sub[...,c].mean())))
        out['sat'].append(q(float(sat),100)); out['nblack'].append(round(100*float((Ls<14).mean()))); out['white'].append(round(100*float((mn>235).mean())))
        out['detail'].append(q(float(det.mean()) if det.size else 0,2)); out['capN'].append(round(capN/16)*16); out['capW'].append(round(capW*0.5)/0.5); out['capCh'].append(capCh); out['height'].append(src_height)
        prev=L; prevcap=cap
    return {k:np.array(v,float) for k,v in out.items()}

def rows_from(d):
    N=len(d['frame']); f=d['frame'].astype(int); tx=d['dx']*2; ty=d['dy']*2; z=d['zoom']; r=d['roll']; diff=d['diff']; resid=d['resid']
    cut=np.zeros(N,int)
    for i in range(1,N):
        nb=np.concatenate([diff[max(1,i-6):i],diff[i+1:i+7]]); m=float(np.median(nb)) if len(nb) else 0
        if diff[i]>=20 and diff[i]>=3*max(m,4) and (d['ntile'][i]<3 or resid[i]>=12): cut[i]=1
    speed=np.hypot(tx,ty)+np.abs(z)*734
    capN=d['capN']; capCh=d['capCh'].astype(int); capW=d['capW']; last=-99
    for i in range(N):
        keep=False
        if i and capCh[i] and max(capN[i],capN[i-1])>=20 and (abs(capW[i]-capW[i-1])*3>=12 or abs(capN[i]-capN[i-1])>0.25*max(capN[i],capN[i-1],1)) and i-last>=4:
            keep=True; last=i
        capCh[i]=1 if keep else 0
    Lm=0.2126*d['R']+0.7152*d['G']+0.0722*d['B']; rows=[]
    for i in range(N):
        sp=speed[i]
        cls='cut' if cut[i] else ('n/a' if np.isnan(sp) else ('hold' if sp<0.3 else ('drift' if sp<2 else 'move')))
        nz=lambda x,k: None if np.isnan(x) else round(float(x),k)
        rows.append([int(f[i]), round(f[i]/30,3), int(cut[i]), int(d['ntile'][i]), nz(tx[i],2), nz(ty[i],2), nz(z[i]*100,3), nz(math.degrees(r[i]) if not np.isnan(r[i]) else np.nan,3),
                     nz(sp,2), cls, round(float(resid[i]),1), round(float(diff[i]),1), int(d['R'][i]), int(d['G'][i]), int(d['B'][i]), round(float(Lm[i]),1),
                     round(float(d['sat'][i]),2), int(d['nblack'][i]), int(d['white'][i]), round(float(d['detail'][i]),1), int(capN[i]), int(d['capW'][i]*3), int(capCh[i]), int(d['height'][i])])
    return rows

COLS=['frame','time_s','hard_cut','cam_tiles_used','cam_pan_x_px','cam_pan_y_px','cam_zoom_pct','cam_roll_deg','cam_speed_px','cam_class','anim_change','frame_change','mean_R','mean_G','mean_B','luma','saturation','near_black_pct','white_pct','detail','caption_px','caption_width_px','caption_word_change','source_height']

def summary(rows):
    cl=[r[9] for r in rows]; base=sum(cl.count(c) for c in ['hold','drift','move']) or 1
    sp=np.array([r[8] for r in rows if r[9] in ('hold','drift','move')])
    sm=np.convolve(np.array([r[8] if r[9] in ('hold','drift','move') else 0 for r in rows]),np.ones(5)/5,'same'); pk=[]
    for i in range(1,len(sm)-1):
        if sm[i]>=6 and sm[i]>=sm[i-1] and sm[i]>sm[i+1] and (not pk or i-pk[-1]>10): pk.append(i)
    secs=len(rows)/30
    return dict(hold=round(100*cl.count('hold')/base,1), drift=round(100*cl.count('drift')/base,1), move=round(100*cl.count('move')/base,1),
        med_speed=round(float(np.median(sp)),2) if len(sp) else None, p90_speed=round(float(np.percentile(sp,90)),2) if len(sp) else None,
        moves10=round(len(pk)/secs*10,1), cuts=sum(r[2] for r in rows), capch=sum(r[22] for r in rows),
        luma=round(st.mean(r[15] for r in rows),1), sat=round(st.mean(r[16] for r in rows),3), nblack=round(st.median(r[17] for r in rows),1),
        detail=round(st.mean(r[19] for r in rows),1), anim=round(st.median(r[10] for r in rows),1))
import numpy as np, statistics as st
def runs(mask):
    out=[]; i=0; n=len(mask)
    while i<n:
        if mask[i]:
            j=i
            while j<n and mask[j]: j+=1
            out.append((i,j)); i=j
        else: i+=1
    return out
def extra(rows):
    N=len(rows); secs=N/30
    cl=[r[9] for r in rows]
    sp=np.array([r[8] if (r[8] is not None and r[9] in ('hold','drift','move')) else 0.0 for r in rows])
    tr=np.array([np.hypot(r[4] or 0, r[5] or 0) if r[4] is not None else 0.0 for r in rows])
    zm=np.array([abs(r[6] or 0)/100*734 if r[6] is not None else 0.0 for r in rows])
    roll=np.array([abs(r[7]) for r in rows if r[7] is not None])
    holds=[ (b-a)/30 for a,b in runs([c=='hold' for c in cl]) if b-a>=3]
    sm=np.convolve(sp,np.ones(5)/5,'same')
    mv=[(a,b) for a,b in runs(list(sm>=2)) if b-a>=6]
    mdur=[(b-a)/30 for a,b in mv]; mpk=[float(sm[a:b].max()) for a,b in mv]
    ease=[int(np.argmax(sm[a:b])) for a,b in mv]
    movef=[i for i,c in enumerate(cl) if c=='move']
    zdom=100*np.mean([zm[i]>tr[i] for i in movef]) if movef else 0
    first5=[c for c in cl[:150] if c in('hold','drift','move')]
    still=sum(1 for c in cl if c=='hold')/max(1,sum(1 for c in cl if c in('hold','drift','move')))
    return dict(
        hold_run_median_s=round(st.median(holds),2) if holds else 0, hold_run_p90_s=round(float(np.percentile(holds,90)),2) if holds else 0,
        holds_over_1s_per_min=round(sum(h>=1 for h in holds)/secs*60,1),
        move_count=len(mv), move_median_s=round(st.median(mdur),2) if mdur else 0, move_p90_s=round(float(np.percentile(mdur,90)),2) if mdur else 0,
        move_peak_median_px=round(st.median(mpk),1) if mpk else 0, move_ease_in_median_frames=int(st.median(ease)) if ease else 0,
        zoom_dominant_move_pct=round(float(zdom),1), roll_p95_deg=round(float(np.percentile(roll,95)),3) if len(roll) else 0,
        hold_pct_first5s=round(100*first5.count('hold')/max(1,len(first5)),1), mean_speed_first3s=round(float(sp[:90].mean()),2),
        cuts_per_min=round(sum(r[2] for r in rows)/secs*60,2), caption_changes_per_s=round(sum(r[22] for r in rows)/secs,2),
        caption_on_pct=round(100*np.mean([r[20]>=20 for r in rows]),1),
        white_pct_mean=round(st.mean(r[18] for r in rows),2))
