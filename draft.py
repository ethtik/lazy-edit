# Quick check of a cut list without Remotion: joins the shots from the 320px proxies (made by prep.sh)
# with the voiceover. No grade or captions; it's for checking picks and timing.
#   python3 draft.py [reels/virat-shots.json] [out/draft.mp4]
import json, sys, subprocess
src = sys.argv[1] if len(sys.argv) > 1 else 'reels/virat-shots.json'
out = sys.argv[2] if len(sys.argv) > 2 else 'out/draft.mp4'
shots = json.load(open(src)); vo = json.load(open('reels/virat-vo.json'))['duration']
ins, parts = [], []
for i, (t, m, s, *r) in enumerate(shots):
    r = r[0] if r else 1
    L = (shots[i + 1][0] if i + 1 < len(shots) else vo) - t
    d, f = m.split('/')[-2:]
    ins += ['-ss', f'{s:.3f}', '-t', f'{L * r:.3f}', '-i', f'reels/proxy/{d}_{f[:-4]}.mp4']
    parts.append(f'[{i}:v]scale=320:180:force_original_aspect_ratio=increase,crop=320:180,setsar=1,setpts=PTS/{r},fps=30,trim=duration={L:.3f}[v{i}]')
fc = ';'.join(parts) + ';' + ''.join(f'[v{i}]' for i in range(len(shots))) + f'concat=n={len(shots)}:v=1:a=0[v]'
subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-i', 'public/audio/virat/vo.wav', '-filter_complex', fc,
                '-map', '[v]', '-map', f'{len(shots)}:a', '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', '-shortest', out], check=True)
print(out)
