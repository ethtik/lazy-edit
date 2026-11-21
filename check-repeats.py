# Lists any stretch of source footage that plays twice in the Virat reel (cut list + cold open).
import json
sh = json.load(open('reels/virat-shots.json')); vo = json.load(open('reels/virat-vo.json'))['duration']
HOOK_A, HOOK_B = 88.8, 92.15
rs = []
for i, (t, m, s, r) in enumerate(sh):
    e = sh[i + 1][0] if i + 1 < len(sh) else vo
    rs.append((m, s, s + (e - t) * r, f'cut {i} @{t:.1f}s'))
pod = [x for x in sh if '1OBV' in x[1]][0]; off = pod[2] - pod[0]
rs.append((pod[1], HOOK_A + off, HOOK_B + off, 'cold open'))
bad = 0
for i, (m, a, b, n) in enumerate(rs):
    for m2, a2, b2, n2 in rs[i + 1:]:
        if m == m2 and min(b, b2) - max(a, a2) > 0.02:
            bad += 1; print(f'REPEAT {m.split("/")[-1]} {max(a, a2):.2f}-{min(b, b2):.2f}s: {n} and {n2}')
print('repeats:', bad)
import sys
sys.exit(1 if bad else 0)
