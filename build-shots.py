# Anchors each shot to the phrase Virat is saying; writes reels/virat-shots.json
import json
W=json.load(open('reels/virat-vo.json'))['words']
PLAN=[
("I think the lowest","out2014",121),("2014","eng2014",58),("you're going to get out","morning",14.7),
("when you wake up","morning",28.4),("still to get out of bed","phone",4.3),("go out there","walkout",5),
("knowing that you will fail","eng2014",111.1),("ate me up it just demolished","sleep",18),("I promised myself","nets",14),
("that was the lowest point where","eng2014",166.7),("for all the younger guys","nets",37.4),("too focused","eng2014",246.6),
("what does the team want","dressing",3.1),("too engulfed","eng2014",374.9),("all that crap","stadium",1),
("downward spiral","crowdwalk",9.4),("couldn't get out of it","nightcity",3),
("Look as I said","cityday",5.3),("so many people get inspired","century",25.5),("you can't stop being","nets",75.8),
("why people love you","dressing",24.5),("I am not shy to admit","century",41),("this is a very normal","nets",88.5),
("I am a human being","dressing",27.4),("a space for people","crowdwalk",17.9),("if he can go through","crowdwalk",26.3),
("relax, it's normal","mirror",3.5),("talk about it,","morning",42.1),("no one is going","hug",1),
("empowered and compassionate","hug",5),("you are going to get help","cityday",419.7),("sources you didn't","sunrise",5),
]
n=lambda x:x.lower().strip('.,?')
ws=[n(w['w']) for w in W]; out=[]; last=-1
for ph,m,fr in PLAN:
  p=[n(x) for x in ph.split()]
  for i in range(last+1,len(ws)):
    if ws[i:i+len(p)]==p: last=i; out.append([W[i]['t'],f'vid/virat2/{m}.mp4',fr]); break
  else: print('MISSING',ph)
out[0][0]=0
json.dump(out,open('reels/virat-shots.json','w')); print(len(out))
