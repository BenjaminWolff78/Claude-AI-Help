from fitcam import place
from frame import scr
import json, math
def W(F,d): return 2*d*0.5625*math.tan(math.radians(F/2))
out=[]
def heads(P,L,F,cast):
    res=[]
    for c in cast:
        p=c["pos"]; sit=c["o"].get("mode")=="sit"; hy=(0.85 if sit else 1.3)+p[1]
        s=scr(P,L,F,(p[0],hy,p[2]))
        if not s: res.append((c["who"],"behind")); continue
        hw=100*0.52/W(F,s[2])
        res.append((c["who"],round(s[0]-hw/2),round(s[0]+hw/2),round(s[1]),round(hw)))
    return res
def add(name,set_,light,P,L,F,cast,ctl,focus,cInf=3,extra=None):
    print(name, heads(P,L,F,cast), {k:[round(v) for v in scr(P,L,F,q)] for k,q in (extra or {}).items()})
    out.append({"out":f"/home/claude/p3/stylelock/r5/{name}.jpg","preview":{"set":set_,"light":light,"pos":[round(v,3) for v in P],"look":[round(v,3) for v in L],"fov":F,"t":1,"cInf":cInf,"ctl":ctl,"cast":cast,"focus":focus}})
# 1 yard hook: high-ish, looking down on the bench, Amos 41%
P,L,F=(0.32,2.0,1.75),(0.0,1.05,-0.4),50
add("yard","yard","yardMorning",P,L,F,[{"who":"amos","pos":[0.15,0,-0.6],"o":{"expr":"smug","facing":0.3,"armR":[[24,16],[34,34]],"armRFront":True,"armL":[[-24,16],[-30,34]],"armLFront":True}}],
    {"lantern":0,"cartOn":0,"sun":1},[0.15,1.3,-0.6],extra={"loaf":(0.18,0.95,0.06),"brick":(-0.3,0.92,0.08),"benchFrontL":(-0.95,0.86,0.39),"benchFrontR":(0.95,0.86,0.39),"post":(1.15,2.0,-2.9)})
# 2 street: Amos left fg, villagers spread right, no head overlap
P,L,F=(-2.6,1.6,-1.9),(9,1.35,0.6),52
am=place(P,L,F,28,2.7); v1=place(P,L,F,60,6.0); v3=place(P,L,F,76,8.5); bk=place(P,L,F,90,11.0); v5=place(P,L,F,66,12.5)
add("street","village","streetNoon",P,L,F,[{"who":"amos","pos":list(am),"o":{"expr":"smug","facing":0.6,"armR":[[26,18],[42,34]],"armRFront":True}},
 {"who":"bv1","pos":list(v1),"o":{"expr":"mock","facing":-0.7,"armR":[[28,-8],[58,-16]],"armRFront":True}},{"who":"bv3","pos":list(v3),"o":{"expr":"laugh","facing":-0.7,"shake":0.5,"phase":0.4}},
 {"who":"bkr","pos":list(bk),"o":{"expr":"laugh","facing":-0.6,"propR":"bread","armR":[[26,-4],[44,-20]],"armRFront":True}},],
 {"cartX":am[0]-1.75,"cartZ":am[2]+0.2,"cartRot":0},[am[0],1.3,am[2]])
# 3 grey: tax fg left (ledger inside), Amos sitting on the stack right, 3/4 to each other
P,L,F=(1.4,1.55,7.4),(-0.55,1.12,2.6),50
tx=place(P,L,F,34,2.75); am=place(P,L,F,74,4.0)
add("grey","yard","yardGrey",P,L,F,[{"who":"tax","pos":list(tx),"o":{"expr":"tacheUp","facing":0.75,"propL":"ledger","propK":1,"armL":[[-18,14],[-12,2]],"armLFront":True,"armR":[[24,-10],[46,-24]],"armRFront":True}},
 {"who":"amos","pos":list(am),"o":{"expr":"smug","facing":-0.75,"mode":"sit"}}],{"rain":1,"stack":1,"cartOn":0},[tx[0],1.3,tx[2]],extra={"stackL":(-1.2,0.6,2.7),"stackR":(0.2,0.6,2.7)})
# 4 site: Ned 38%
P,L,F=(18.85,1.55,-3.25),(19.7,1.2,-6.0),52
add("site","village","siteSpring",P,L,F,[{"who":"ned","pos":[19.95,0,-5.75],"o":{"expr":"eureka","facing":-0.7,"propL":"loaf","armL":[[-26,4],[-42,-12]],"armLFront":True,"armR":[[24,10],[30,26]]}}],
 {"wallH":0.42,"tea":1,"spring":1,"cartX":23.6,"cartZ":-4.4,"cartRot":2.4},[19.95,1.3,-5.75],extra={"mug":(19.0,0.95,-4.75),"wallEnd":(19.3,0.6,-6.2),"wallMid":(17.5,0.6,-6.2)})
# 5 lane: camera yawed ~30 deg down the lane, taxman fg right, Amos 1 m behind left, EXCISE plaque in frame
P,L,F=(-13.3,1.5,0.3),(-17.6,1.6,-4.2),52
tx=place(P,L,F,64,2.9); am=place(P,L,F,30,4.0)
add("lane","village","laneSunset",P,L,F,[{"who":"tax","pos":list(tx),"o":{"expr":"shock","facing":-0.75,"propR":"stick","armR":[[24,6],[40,0]],"armRFront":True}},{"who":"amos","pos":list(am),"o":{"expr":"smug","facing":0.75}}],{"stick":0,"lamps":0},[tx[0],1.3,tx[2]],
 extra={"plaque":(-16.6,1.6,-4.88),"door":(-16.8,1.1,-4.9)})
# 6 lane wide: lane receding into haze, cottage + tax house
P,L,F=(-8.0,2.3,3.4),(-19.5,3.0,-4.6),52
tx=place(P,L,F,64,5.6); am=place(P,L,F,38,6.8)
add("lanewide","village","laneSunset",P,L,F,[{"who":"tax","pos":list(tx),"o":{"expr":"shock","facing":-0.6}},{"who":"amos","pos":list(am),"o":{"expr":"smug","facing":0.6}}],{"stick":0},[-19,2,-4.9],2,
 extra={"cR":(-20,1,-4.9),"cL":(-26,1,-4.9),"tR":(-13.6,1,-4.9),"tTop":(-16.8,6.6,-4.9),"plaque":(-16.6,4.8,-4.88)})
# 7 shed: higher, looking down on the bench; lantern in frame
P,L,F=(0.05,2.05,2.35),(-0.05,1.15,-0.3),52
add("shed","yard","shedLantern",P,L,F,[{"who":"amos","pos":[0.2,0,-0.62],"o":{"expr":"smug","facing":-0.5,"armL":[[-24,6],[-44,12]],"armLFront":True,"armR":[[24,14],[36,30]],"armRFront":True}}],
 {"trick":1,"lantern":1,"night":1,"chalkL":8,"chalkR":4,"coinL":8,"coinR":4,"cartOn":0,"loaf":0,"brick":0,"normMould":0},[0.0,1.1,-0.2],
 extra={"slate":(-0.68,1.13,-0.22),"slateL":(-0.98,1.13,-0.22),"walls":(0.3,0.96,-0.05),"scale":(-0.34,1.1,0.2),"clay":(-0.62,0.95,0.12),"lant":(0.42,2.08,-0.5)})
# 8 office: candle in frame, both totals
P,L,F=(0.05,2.2,0.95),(0.0,1.0,-0.95),52
add("office","office","officeCandle",P,L,F,[{"who":"tax","pos":[0,0,-1.45],"o":{"expr":"aghast","facing":0.2,"armR":[[24,14],[36,30]],"armRFront":True,"armL":[[-24,14],[-36,30]],"armLFront":True}}],{"ledger":1,"coins":1},[0,1.3,-1.45],4,
 extra={"totL":(-0.3,0.84,-0.3),"totR":(0.3,0.84,-0.3),"ledL":(-0.48,0.84,-0.4),"candle":(0.46,1.0,-1.02),"deskFront":(0,0.82,-0.25)})
# 9 page: one page at ~62%
P,L,F=(0.24,2.25,-0.46),(0.24,0.84,-0.58),46
add("page","office","officeCandle",P,L,F,[],{"ledger":1,"coins":1},[0.24,0.84,-0.55],10,extra={"L":(0.02,0.84,-0.55),"R":(0.48,0.84,-0.55)})
# 10 inn: yawed ~15 deg, Bess holds the jug, lantern in frame
P,L,F=(-0.75,1.6,2.1),(0.25,1.45,-2.0),50
am=place(P,L,F,22,3.25); be=place(P,L,F,70,5.0)
add("inn","inn","innEvening",P,L,F,[{"who":"bess","pos":[be[0],0.3,be[2]],"o":{"expr":"worry","facing":-0.75,"sweat":0.6,"propR":"jug","armR":[[20,14],[34,26]],"armRFront":True}},{"who":"amos","pos":list(am),"o":{"expr":"smug","facing":0.75,"armR":[[24,10],[40,4]],"armRFront":True}}],{"bigMug":1,"act":1},[am[0],1.3,am[2]],
 extra={"mug":(-0.45,1.45,-1.95),"chalkL":(-0.25,2.22,-3.17),"chalkR":(1.1,2.22,-3.17),"lant":(-0.42,2.3,-1.9),"bessZ":(0,0,be[2])})
json.dump(out,open('/home/claude/p3/stylelock/lock22.json','w'))
