# Builds the data for the square reels: voiceover (or text) timings, shots anchored to phrases, music.
import json,subprocess,sys
A='public/audio/virat/'; V='vid/virat2/'
LEAD=1.0; PRE=0.08; POST=0.22; XF=0.22

def voiceover(name,segs):
  t=LEAD; words=[]; ins=[]; f=[]
  for i,(fn,a,b) in enumerate(segs):
    a0,b0=a-PRE,b+POST; L=b0-a0
    d=json.load(open(A+fn+'.json'))
    for s in d['segments']:
      for w in s.get('words',[]):
        if w['start']>=a-0.05 and w['end']<=b+0.15:
          x=w['word'].strip().replace('bolded','bowled').replace('bull','bowl')
          if x: words.append({'w':x,'t':round(t+w['start']-a0,2),'seg':i})
    ins+=['-i',A+fn+'.wav']
    f.append(f"[{i}]atrim={a0}:{b0},asetpts=PTS-STARTPTS,highpass=f=80,lowpass=f=9000,loudnorm=I=-16:LRA=7,aresample=44100,afade=t=in:d={PRE},afade=t=out:st={L-POST}:d={POST}[s{i}]")
    t+=L-XF
  chain='[s0]'
  for i in range(1,len(segs)): f.append(f"{chain}[s{i}]acrossfade=d={XF}:c1=tri:c2=tri[x{i}]"); chain=f'[x{i}]'
  f.append(f"{chain}adelay={int(LEAD*1000)},alimiter=limit=0.9[o]")
  subprocess.run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',';'.join(f),'-map','[o]','-ar','44100',f'public/audio/sq/{name}-vo.wav'],check=True)
  return round(t+XF+0.6,2), words

def text(lines,first=3.2,each=2.9):
  words=[]; t=LEAD
  for i,l in enumerate(lines):
    for k,w in enumerate(l.split()): words.append({'w':w,'t':round(t+k*0.14,2),'seg':i})
    t+=first if i==0 else each
  return round(t+0.8,2), words

def anchor(words,plan):
  n=lambda x:x.lower().strip('.,?"“”')
  ws=[n(w['w']) for w in words]; out=[]; last=-1
  for ph,m,fr in plan:
    p=[n(x) for x in ph.split()]
    for i in range(last+1,len(ws)):
      if ws[i:i+len(p)]==p: last=i; out.append([words[i]['t'],V+m+'.mp4',fr]); break
    else: sys.exit('MISSING '+ph)
  out[0][0]=0; return out

R={}
dur,w=voiceover('comeback',[('dvyVSRcPIcM',0.0,75.7)])
R['comeback']=dict(duration=dur,words=w,voice='audio/sq/comeback-vo.wav',music=['audio/sq/comeback.mp3',0,0.24],shots=anchor(w,[
 ("I clearly remember","stadium",1),("my heart was racing","nets",20),("flashbacks of 2014","eng2014",306.1),("coming to me again","eng2014",416.4),
 ("I'm padded up","dressing",5.9),("trying to control my heart","morning",28.4),("So I walked in","walkout",5),("30","cityday",250.1),
 ("started booing","eng2014",246.6),("my heart started beating","dressing",24.5),("they have this amazing","stadium",20.4),
 ("I remember James Anderson","eng2014",58),("what are the odds","eng2014",111.1),("please just play","nets",46.7),
 ("I left that ball","eng2014",9.6),("I became calm","nets",78.4),("I got dropped","eng2014",166.7),("So many things could","crowdwalk",9.4),
 ("But I got dropped","century",41),("I got 149","century",49),("didn't look back","sunrise",14)]))
dur,w=voiceover('faking',[('1OBVtqEZ87k',0.0,7.9),('1OBVtqEZ87k',40.4,48.7),('1OBVtqEZ87k',48.8,74.95),('1OBVtqEZ87k',93.5,97.6)])
R['faking']=dict(duration=dur,words=w,voice='audio/sq/faking-vo.wav',music=['audio/sq/faking.mp3',0,0.24],shots=anchor(w,[
 ("It wasn't just about","stadium",30.1),("many other factors","cityday",192.2),("going into that space","nightcity",14),
 ("I didn't know","mirror",1),("pushing myself","nets",91.2),("wasn't coming naturally","phone",11),("I am a person who wakes up","morning",14.7),
 ("absolute presence","walkbeach",1),("that's who I have always been","crowdwalk",17.9),("people ask me","nets",20),("I love playing the game","nets",75.8),
 ("every inch of my energy","eng2014",246.6),("never felt abnormal","dressing",33.6),("so that naturally","sleep",30),("I just didn't know it","nightcity",3)]))
SIGNS=["Signs he might be carrying something","He pulls away from friends.","He sleeps too much, or too little.","He drinks more, or snaps faster.","\"I'm fine,\" on repeat.","He talks about being a burden.","If you see it, ask him."]
dur,w=text(SIGNS)
R['signs']=dict(duration=dur,words=w,voice=None,music=['audio/sq/signs.mp3',0,0.8],text=True,shots=anchor(w,[
 ("Signs he","nightcity",1),("He pulls away","crowdwalk",1),("He sleeps too","sleep",48),("He drinks more","phone",1),
 ("\"I'm fine,\"","mirror",4.8),("He talks about","crowdwalk",26.3),("If you see","rainwin",2)]))
CHECK=["How to check on him","Call, don't text.","A voice is harder to brush off.","Ask twice.","\"How are you, really?\"","Listen longer than feels normal.","Skip the fixing.","One call is enough to start."]
dur,w=text(CHECK)
R['checkin']=dict(duration=dur,words=w,voice=None,music=['audio/sq/checkin.mp3',0,0.8],text=True,shots=anchor(w,[
 ("How to check","cityday",354.8),("Call, don't","phone",7.6),("A voice is","talk",2),("Ask twice.","talk",6),
 ("\"How are","hug",1),("Listen longer","walkbeach",1),("Skip the fixing.","hug",5),("One call is","cityday",419.7)]))
for k,v in R.items():
  json.dump(v,open(f'reels/sq-{k}.json','w')); print(k,v['duration'],len(v['shots']))
