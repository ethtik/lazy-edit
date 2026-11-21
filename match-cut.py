# Builds reels/virat-shots.json as hard cuts on action, anchored to what Virat is saying.
# Each phrase gets a list of source takes (camera takes found by scene detection, or explicit (start,end) ranges).
# Within a take, the in-point is chosen so the cut lands in the middle of movement at both ends (cut on action),
# and no stretch of source footage plays twice. "sync" shows the podcast itself, lip-synced to the voice.
import json, re
from takes import takes, motion, luma

FPS = 30
VO = json.load(open('reels/virat-vo.json')); W = VO['words']
O, WK, R, N, P, K = ('vid/virat2/out2014.mp4', 'vid/virat3/walk2018.mp4', 'vid/virat3/rcb2025.mp4',
                     'vid/virat3/nets2.mp4', 'vid/virat3/practice.mp4', 'vid/virat3/walkout.mp4')
POD = 'vid/virat/1OBVtqEZ87k.mp4'
# HD only (1080p or high-bitrate 720p): England 2014/2018, Asia Cup 2023 v Pakistan, World Cup 2023, RCB 2016/2020/2025
C, D, RB25 = 'vid/virat2/century.mp4', 'vid/virat2/dressing.mp4', 'vid/virat5/rcb25b.mp4'
# Only takes checked on the contact sheets (reels/sheets) to show Virat alone or clearly the subject,
# with no watermark, scorebar or subtitle inside the 1.9:1 crop.
OK = {O: [9, 10, 11, 15, 23, 35, 38, 41, 43, 50, 61, 63], WK: [0, 2, 8, 10, 14, 15, 27, 29, 32, 35, 46, 50, 51],
      C: [5, 6, 10], R: [1, 2, 4], RB25: [0, 1, 9, 18]}
RATE = 0.8  # slow motion for every shot except the lip-synced podcast
# Takes by Virat's emotion (from the contact sheets), so each line plays over the feeling he's describing
SAD = {O: [41, 43, 38, 23, 63, 61], R: [1, 2], RB25: [0]}       # head down, beaten, in tears
TENSE = {O: [11, 15, 35, 50], WK: [0, 10, 14, 15, 46, 39, 52]}          # frustrated, under pressure, staring
FIRE = {WK: [32, 27, 29]}                                        # roaring, the 2018 comeback
JOY = {C: [6, 5], RB25: [1, 9, 18], R: [4]}                      # celebrating, laughing, hugging
PLAN = [
  ("I think the lowest", O, [41, 43]),                 # sad: the lowest point, England 2014
  ("going to get out in the morning", O, [23, 45, 63]),  # + Anderson celebrating the wicket    # tense: dreading the day
  ("still to get out of bed", O, [38, 61]),            # sad
  ("knowing that you will fail", O, [11, 47, 50]),       # + Anderson again         # frustrated
  ("ate me up it just demolished", O, [15, 35]),       # beaten
  ("I promised myself", WK, [32, 31, 27, 40]),         # + Edgbaston crowd and flags                 # fire: never again
  ("that was the lowest point where", WK, [14, 15]),   # reflective, head down
  ("too focused", WK, [0, 16, 10]),                    # + India dressing room                        # intense stare
  ("what does the team want", WK, [8, 2]),             # with his batting partner
  ("too engulfed", WK, [46, 50, 51]),                  # pressure
  ("downward spiral", O, [41, 43, 38, 23, (WK, 14)]),                    # back to the low
  ("Look as I said", POD, "sync"),
  ("so many people get inspired", C, [6, (WK, 41), 5, 7]),  # + fans, teammates applauding          # joy: the hundred
  ("you can't stop being", POD, "sync"),
  ("why people love you", RB25, [1, (WK, 30), 9]),    # + fans               # smiling with ABD, laughing with Anushka
  ("I am not shy to admit", R, [1, 2, (RB25, 0)]),                # in tears (the cold open shows him saying it)
  ("I am a human being", POD, "sync"),
  ("a space for people", POD, "sync"),
  ("if he can go through", RB25, [0, 5, 18]),           # + teammates hugging             # tears, then the hug
  ("talk about it,", POD, "sync"),
  ("people are actually going", R, [4, (RB25, 3), (RB25, 4)]),  # + hugs               # hug: compassion
  ("sources you didn't", POD, "sync"),
]
MAXLEN, MINLEN = 1.7, 0.7
# Virat close-ups checked frame by frame in renders: used only when a phrase's own takes run out
MORE = {O: [6, 34], WK: [35]}                           # more Virat, checked on the sheets
CONTEXT = {O: [4, 8, 18, 40, 46], WK: [16, 30, 31, 40, 41, 44], RB25: [3, 4, 5]}  # Anderson, crowds, teammates
# fallback stays in the low mood: joyful context (flags, hugs) only where the plan asks for it
FALLBACK = [(c, i) for d in ({O: SAD[O]}, TENSE, MORE, {O: CONTEXT[O]}) for c, ix in d.items() for i in ix]  # RCB tears kept for their lines  # no batting action, the hundred stays on "inspired"

n = lambda x: re.sub(r"[^a-z0-9']", "", x.lower())
ws = [n(w['w']) for w in W]
def anchor(ph, after):
    p = [n(x) for x in ph.split()]
    for i in range(after + 1, len(ws)):
        if ws[i:i + len(p)] == p: return i
    raise SystemExit(f"MISSING {ph}")

# podcast word times, to lip-sync "sync" shots
POW = [w for s in json.load(open('public/audio/virat/1OBVtqEZ87k.json'))['segments'] for w in s['words']]
def pod_time(i):
    seg = VO['segs'][1]; guess = seg['from'] + W[i]['t'] - seg['t']
    best = min((w for w in POW if n(w['word']) == ws[i]), key=lambda w: abs(w['start'] - guess))
    return best['start'] - W[i]['t']  # source offset: source = reel + offset

# stretches inside checked takes that cut away from Virat (seen on the cut audit)
used = {WK: [(509.9, 512.5)], O: [(81.6, 83.5), (327.6, 330.5), (270.3, 272.5)]}
def free(m, a, b): return all(b <= x or a >= y for x, y in used.get(m, []))
def pick(m, a, b, L):
    """best in-point in [a, b-L]: motion at both ends of the cut, source never reused"""
    mot = motion(m); lum = luma(m); best = None
    s = a + 0.15
    while s + L <= b - 0.1:
        i, j = int(s * FPS), int((s + L) * FPS)
        if free(m, s, s + L) and min(lum[i:j + 1] or [0]) > 35:  # no fades to black
            sc = sum(mot[i:i + 5]) + sum(mot[max(i, j - 5):j])
            if best is None or sc > best[0]: best = (sc, s)
        s += 1 / FPS
    return None if best is None else best[1]

shots = []; last = -1
idx = []
for ph, m, spec in PLAN:
    last = anchor(ph, last); idx.append(last)
for k, (ph, m, spec) in enumerate(PLAN):
    t0 = 0 if k == 0 else W[idx[k]]['t']
    t1 = W[idx[k + 1]]['t'] if k + 1 < len(PLAN) else VO['duration']
    if spec == "sync":
        off = pod_time(idx[k]); shots.append([round(t0, 3), POD, round(t0 + off, 3)])
        used.setdefault(POD, []).append((t0 + off, t1 + off)); continue
    # an index means "the shot I saw in the contact sheet": the middle frame of that take, +-1.1s, so a take that
    # hides a dissolve or a second shot can't hand us something else. (clip, index) borrows from another clip.
    mid = lambda a, b: ((a + b) / 2 - min(2.5, (b - a) / 2), (a + b) / 2 + min(2.5, (b - a) / 2))
    def rng(r):
        if isinstance(r, tuple) and isinstance(r[0], str):
            c, i = r; return (c, *mid(*takes(c, 1.2)[i]))
        return (m, *r) if isinstance(r, tuple) else (m, *mid(*takes(m, 1.2)[r]))
    ranges = [rng(r) for r in spec] + [rng(r) for r in FALLBACK]  # fallback only used once the plan's takes run out
    t = t0; ri = 0
    BASE = (t1 - t0) / max(1, round((t1 - t0) / 1.8))  # equal cuts of about 1.8s (slow motion)
    while t1 - t > 0.05:
        left = t1 - t
        L = left if left < BASE + MINLEN else BASE
        s = None
        order = [(ri + k) % len(spec) for k in range(len(spec))] + list(range(len(spec), len(ranges)))
        for j in order:
            c, a, b = ranges[j]
            L2 = L if b - a >= L * RATE + 0.3 else max(0.6, (b - a - 0.3) / RATE)
            s = pick(c, a, b, L2 * RATE)
            if s is not None: ri = j; L = L2; break
        if s is None:
            print('SHORT', ph, round(left, 2)); break
        shots.append([round(t, 3), c, round(s, 3)]); used.setdefault(c, []).append((s, s + L * RATE))
        t += L; ri = (ri + 1) % len(spec) if ri < len(spec) else ri
shots[0][0] = 0
# Beat sync: move every cut onto the nearest music beat (music starts at reel 0, see beats.py).
# A cut that would push the outgoing shot past the end of its camera take snaps to the beat before instead.
BEATS = json.load(open('reels/virat-beats.json'))['beats']
def take_end(m, s):
    if m == POD: return 1e9
    return next((b for a, b in takes(m, 0.3) if a <= s < b), 1e9)
for i in range(1, len(shots)):
    t, m, s = shots[i]
    prev = shots[i - 1]
    cands = sorted(BEATS, key=lambda b: abs(b - t))[:2]
    for b in cands:
        out_end = prev[2] + (b - prev[0]) * (1 if prev[1] == POD else RATE)  # source time where the outgoing shot would end
        clash = prev[1] != POD and any(k != i - 1 and x[1] == prev[1] and x[2] < out_end and x[2] > prev[2] for k, x in enumerate(shots))
        if not clash and b - prev[0] >= 0.5 and out_end <= take_end(prev[1], prev[2]) - 0.03 and (i + 1 == len(shots) or shots[i + 1][0] - b >= 0.5):
            d = b - t
            shots[i] = [round(b, 3), m, round(s + d, 3) if m == POD else s]
            break
shots = [x for i, x in enumerate(shots) if i + 1 == len(shots) or shots[i + 1][0] - x[0] >= 0.35]  # no flash frames
shots = [s[:3] + [1 if s[1] == POD else RATE] for s in shots]
# last guard: a shot that would play past the end of its camera take ends early, the next cut comes in sooner
for i in range(len(shots) - 1):
    t, m, src, r = shots[i]
    over = src + (shots[i + 1][0] - t) * r - (take_end(m, src) - 0.03)
    if over > 0:
        d = over / r; nt, nm, ns, nr = shots[i + 1]
        if nm == POD and nt - d < VO['segs'][1]['t']: continue
        shots[i + 1] = [round(nt - d, 3), nm, round(ns - d, 3) if nm == POD else ns, nr]
# No frame plays twice. The cold open (VoReel.tsx HOOK_A..HOOK_B) shows the podcast at reel time + the sync offset.
HOOK = (88.8, 92.15)
def span(i):
    t, m, src, r = shots[i]
    e = shots[i + 1][0] if i + 1 < len(shots) else VO['duration']
    return src, src + (e - t) * r
for _ in range(3):
    for i in range(1, len(shots)):
        t, m, src, r = shots[i]
        a, b = span(i)
        if m == POD:
            off = src - t; ha, hb = HOOK[0] + off, HOOK[1] + off
            if a < hb and b > ha and a >= ha:  # starts inside the cold open's frames: come in after them, still in sync
                d = hb - a + 0.02; shots[i] = [round(t + d, 3), m, round(src + d, 3), r]
            continue
# A shot that would run past its camera take (or onto frames another cut shows) ends there, and an unused take fills the gap.
def clean_end(i):
    t, m, src, r = shots[i]
    lim = take_end(m, src) - 0.03
    for k, x in enumerate(shots):
        if k != i and x[1] == m and x[2] > src: lim = min(lim, x[2] - 0.02)
    return lim
used = {}
for i in range(len(shots)):
    a, b = span(i); used.setdefault(shots[i][1], []).append((a, b))
used.setdefault(POD, []).append((HOOK[0] + 35.04, HOOK[1] + 35.04))
pool = [(c, *mid(*takes(c, 1.2)[k])) for c, k in FALLBACK]
i = 0
while i < len(shots):
    t, m, src, r = shots[i]
    if m != POD:
        a, b = span(i); lim = clean_end(i)
        if b > lim + 0.01:
            tc = t + (lim - src) / r; nt = shots[i + 1][0] if i + 1 < len(shots) else VO['duration']
            if i + 1 < len(shots) and nt - tc < 0.4:  # tiny gap: start the next shot that much earlier in its own footage
                _, m2, s2, r2 = shots[i + 1]; ns = s2 - (nt - tc) * r2
                lo = next((x for x, y in takes(m2, 0.3) if x <= s2 < y), 0) if m2 != POD else 0
                if ns >= lo + 0.02 and all(not (x < s2 and y > ns) for x, y in used.get(m2, []) if (x, y) != (s2, span(i + 1)[1])):
                    shots[i + 1] = [round(tc, 3), m2, round(ns, 3), r2]; i += 1; continue
            for c, ra, rb in pool:
                s2 = pick(c, ra, rb, (nt - tc) * RATE) if rb - ra > (nt - tc) * RATE + 0.3 else None
                if s2 is not None:
                    shots.insert(i + 1, [round(tc, 3), c, round(s2, 3), RATE]); used.setdefault(c, []).append((s2, s2 + (nt - tc) * RATE)); break
    i += 1
json.dump(shots, open('reels/virat-shots.json', 'w'))
print(len(shots), 'cuts')
