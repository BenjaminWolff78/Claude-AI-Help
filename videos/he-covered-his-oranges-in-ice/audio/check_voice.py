import json,re,difflib
def syl(w):
    w=re.sub(r'[^a-z]','',w.lower())
    if not w: return 0
    if len(w)<=3: return 1
    w=re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$','',w); w=re.sub(r'^y','',w)
    return max(1,len(re.findall(r'[aeiouy]{1,2}',w)))
W=json.load(open('words_raw.json')); d=W[-1]['e']-W[0]['s']
g=[W[i+1]['s']-W[i]['e'] for i in range(len(W)-1)]
norm=lambda s: re.sub(r"[^a-z0-9' ]"," ",s.lower().replace('-',' ')).split()
S=norm(open('/home/claude/proj/script/tts.txt').read()); num={'24':['twenty','four'],'28':['twenty','eight'],'32':['thirty','two'],'3am':['three','a','m'],'9':['nine'],'3':['three'],'am':['a','m'],'4':['four']}
ws=[]
for w in W:
    for x in norm(w['w']): ws+=num.get(x,[x])
sy=sum(syl(x) for x in ws)
print('span %.2f  syl/s (spoken words) %.2f  gaps>0.2: %d  max gap %.2f'%(d,sy/d,sum(x>0.2 for x in g),max(g)))
print([x for x in difflib.ndiff(S,ws) if x[0] in '+-' and x[2:] not in ('duane','dwayne',"duane's","dwayne's")])
