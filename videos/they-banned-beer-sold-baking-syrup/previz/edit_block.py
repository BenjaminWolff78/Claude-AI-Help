import sys
s=open(sys.argv[1]).read()
def R(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(s.count(a),a[:90]); s=s.replace(a,b)
exec(open(sys.argv[3]).read())
open(sys.argv[2],'w').write(s)
print('ok')
