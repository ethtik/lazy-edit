#!/bin/zsh
# Prepares clips for match-cut.py, fast: for each clip, one decode makes a 320px proxy,
# then cut + motion scans and a contact sheet run on the proxy. Clips run in parallel; done clips are skipped.
#   ./prep.sh public/vid/virat5/*.mp4      (or no args: every clip under public/vid)
cd "${0:A:h}"
mkdir -p reels/motion reels/proxy reels/sheets
one() {
  f=$1; rel=${f#public/}; d=${${rel:h}:t}; n=${${rel:t}:r}; k=reels/motion/${d}_$n.txt
  p=reels/proxy/${d}_$n.mp4; sh=reels/sheets/${d}_$n.jpg
  [[ -s $k.m && -s $k.s && -s $sh ]] && return
  # one full-size decode: 30fps, 320 wide, all-intra so later passes seek instantly
  [[ -s $p ]] || ffmpeg -v error -y -i "$f" -map 0:v:0 -vf fps=30,scale=320:-2 -c:v libx264 -preset ultrafast -g 1 -crf 28 -an "$p" || return
  [[ -s $k.m ]] || ffmpeg -v error -i "$p" -vf "tblend=all_mode=difference,signalstats,metadata=print:file=$k.m" -f null -
  [[ -s $k.s ]] || ffmpeg -v error -i "$p" -vf "select='gt(scene,0.3)',metadata=print:file=$k.s" -f null -
  # contact sheet: tile N = middle frame of take N (the index match-cut.py uses), 8 across, row-major
  if [[ ! -s $sh ]]; then
    sel=$(python3 -c "from takes import takes; print('+'.join(f'eq(n,{int((a+b)/2*30)})' for a,b in takes('$rel',1.2)))")
    rows=$(python3 -c "from takes import takes; print(-(-len(takes('$rel',1.2))//8))")
    ffmpeg -v error -y -i "$p" -vf "select='$sel',tile=8x$rows" -frames:v 1 -q:v 4 "$sh"
  fi
  echo "done $rel"
}
files=(${@:-$(find public/vid -name '*.mp4' ! -path '*/lowres/*' ! -path '*/hq/*')})
for f in $files; do one "$f" & while (( $(jobs -r | wc -l) >= 6 )); do sleep 0.2; done; done; wait
