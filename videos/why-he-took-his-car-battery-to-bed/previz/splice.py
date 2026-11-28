p='/home/claude/p15/app/src/videos/ice/shots.ts'; s=open(p).read()
blk=open('/home/claude/p15/work/p15_block.ts').read().replace("const still = (c: Cam) => (_f: number): Shot => ({ pos: c.pos, look: c.look, fov: c.fov, roll: 0 });\n","")
a=s.index('// ================================================= p15 BLOCK START\n'); b=s.index('// ================================================= p15 BLOCK END\n')
s=s[:a]+'// ================================================= p15 BLOCK START\n'+blk+s[b:]
open(p,'w').write(s); print('spliced')
