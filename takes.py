# Parses motion/scene files: takes(clip) -> list of (start,end) continuous camera takes; motion(clip) -> per-frame motion list (30fps)
import re,json,subprocess,os
DUR=json.load(open('reels/clipdur.json'))
def key(m): d,f=m.split('/')[-2:]; return f"reels/motion/{d}_{f[:-4]}.txt"
def dur(m):
    if m not in DUR: DUR[m]=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0","public/"+m])); json.dump(DUR,open('reels/clipdur.json','w'))
    return DUR[m]
def cuts(m): return [float(x) for x in re.findall(r"pts_time:([\d.]+)",open(key(m)+'.s').read())]
def takes(m,minlen=0.8):
    c=[0]+cuts(m)+[dur(m)]; return [(a,b) for a,b in zip(c,c[1:]) if b-a>=minlen]
def motion(m): return [float(x) for x in re.findall(r"YAVG=([\d.]+)",open(key(m)+'.m').read())]
def luma(m):
    """per-frame brightness (30fps) from the 320px proxy, cached next to the motion scan"""
    f = key(m) + '.y'
    if not os.path.exists(f):
        d, n = m.split('/')[-2:]
        subprocess.run(['ffmpeg', '-v', 'error', '-i', f'reels/proxy/{d}_{n[:-4]}.mp4', '-vf', f'signalstats,metadata=print:file={f}', '-f', 'null', '-'], check=True)
    return [float(x) for x in re.findall(r"YAVG=([\d.]+)", open(f).read())]
