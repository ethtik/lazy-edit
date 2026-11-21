# Builds Virat's voiceover: segments in story order, each level-matched, joined with short crossfades
import json,subprocess
A='public/audio/virat/'
LEAD=1.0; PRE=0.08; POST=0.22; XF=0.22
SEGS=[  # (file, start, end, word fixes) — whole answers, story order
 ('BJ7VFOMxKS8',6.45,79.2,{'Indian':'England','2':'','spider':'spiral'}),  # 2014: the lowest point, in full
 ('1OBVtqEZ87k',108.95,157.35,{}),   # not shy to admit it; talk about it
]
VOICE_ONLY={'1OBVtqEZ87k'}
t=LEAD; segs=[]; words=[]; inputs=[]; f=[]
for i,(fn,a,b,fix) in enumerate(SEGS):
  a0,b0=a-PRE,b+POST; L=b0-a0
  d=json.load(open(A+fn+'.json'))
  for s in d['segments']:
    for w in s.get('words',[]):
      if w['start']>=a-0.05 and w['end']<=b+0.15:
        x=w['word'].strip(); x=fix.get(x.strip('.,'),x)
        if x: words.append({'w':x,'t':round(t+w['start']-a0,2),'seg':i})
  segs.append({'file':fn,'from':a,'t':round(t,2),'dur':round(L-XF,2)})
  # the podcast has music under his voice: use the voice-only stem (demucs htdemucs, made once into <id>-voice.wav)
  inputs+=['-i',A+fn+('-voice' if fn in VOICE_ONLY else '')+'.wav']
  f.append(f"[{i}]atrim={a0}:{b0},asetpts=PTS-STARTPTS,highpass=f=80,lowpass=f=9000,loudnorm=I=-16:LRA=7,aresample=44100,afade=t=in:d={PRE},afade=t=out:st={L-POST}:d={POST}[s{i}]")
  t+=L-XF
chain='[s0]'
for i in range(1,len(SEGS)):
  f.append(f"{chain}[s{i}]acrossfade=d={XF}:c1=tri:c2=tri[x{i}]"); chain=f'[x{i}]'
f.append(f"{chain}adelay={int(LEAD*1000)},alimiter=limit=0.9[o]")
subprocess.run(['ffmpeg','-v','error','-y',*inputs,'-filter_complex',';'.join(f),'-map','[o]','-ar','44100',A+'vo.wav'],check=True)
dur=round(t+XF+0.4,2)
json.dump({'duration':dur,'segs':segs,'words':words},open('reels/virat-vo.json','w'),indent=0)
print(dur); [print(i,s['t']) for i,s in enumerate(segs)]; print(' '.join(w['w'] for w in words))
