import json,subprocess,sys,os,glob
tl=json.load(open('/home/claude/claude-motion/src/raise/timeline.json'));B=tl['beats']
R='/home/claude/claude-motion/out/raise/full'
def path(t):
    fr=int(t*30); ch=fr//600*600
    for p in (f'{R}/c{ch:05d}/f{fr:04d}.jpeg',f'{R}/c{ch:05d}/f{fr-ch:03d}.jpeg'):
        if os.path.exists(p): return p
    raise SystemExit('missing %s'%t)
def sheet(pts,out,cols=3):
    d='/tmp/cs'; subprocess.run(f'rm -rf {d}; mkdir {d}',shell=True)
    for n,(k,t) in enumerate(pts):
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',path(t),'-vf',f"scale=640:-1,drawtext=text='{k} {t:.1f}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black",f'{d}/{n:02d}.png'])
    rows=-(-len(pts)//cols)
    subprocess.run(f'ffmpeg -y -loglevel error -pattern_type glob -i "{d}/*.png" -vf tile={cols}x{rows} {out}',shell=True)
if __name__=='__main__':
    pts=[('cliffs',B['pivot']['cliffs']+0.35),('d_back',B['dan']['back']+0.4),('gone',B['cliff']['gone']+0.4),('amount',B['cost']['amount']+0.6),
    ('yes',B['cost']['yes']+0.4),('senate',B['status']['senate']+0.7),('credit',B['move']['credit']+0.4),('end_surprise',B['end']['action']+1.1),('almost',B['pivot']['almost']+0.4)]
    sheet(pts,'/tmp/cs2.png')
