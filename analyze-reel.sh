#!/bin/zsh
# Usage: analyze-reel.sh <instagram/youtube/tiktok link or local .mp4>
# Saves the video, its audio name, frame sheet, cut timings and transcript into refs/<id>/
cd "$(dirname "$0")"
src="$1"; [[ -z $src ]] && { echo "Give a link or file"; exit 1; }
if [[ -f $src ]]; then id=$(basename "$src" .mp4 | cut -c1-24); mkdir -p refs/$id; cp "$src" refs/$id/reel.mp4
else
  id=$(yt-dlp --get-id "$src" 2>/dev/null | head -1); [[ -z $id ]] && id=$(date +%s); mkdir -p refs/$id
  yt-dlp -q --cookies-from-browser chrome -o "refs/$id/reel.%(ext)s" --remux-video mp4 --write-info-json "$src" 2>/dev/null \
    || yt-dlp -q -o "refs/$id/reel.%(ext)s" --remux-video mp4 --write-info-json "$src"
fi
D=refs/$id; V=$D/reel.mp4
dur=$(ffprobe -v 0 -show_entries format=duration -of csv=p=0 $V)
ffprobe -v 0 -select_streams v -show_entries stream=width,height,r_frame_rate -of csv=p=0 $V > $D/format.txt
ffmpeg -v error -y -i $V -vf "fps=30/$dur,scale=200:-2,tile=10x3" -frames:v 1 $D/sheet.jpg
ffmpeg -i $V -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*" | cut -d: -f2 > $D/cuts.txt
ffmpeg -v error -y -i $V -vn -ac 1 -ar 16000 $D/audio.wav
whisper $D/audio.wav --model small --word_timestamps True --output_format json --output_dir $D >/dev/null 2>&1
python3 - "$D" "$dur" <<'PY'
import json,sys,os
d,dur=sys.argv[1],float(sys.argv[2])
info={}
for f in os.listdir(d):
    if f.endswith('.info.json'): info=json.load(open(os.path.join(d,f)))
cuts=[float(x) for x in open(f'{d}/cuts.txt').read().split()]
tr=json.load(open(f'{d}/audio.json')) if os.path.exists(f'{d}/audio.json') else {'text':''}
r=[f"duration: {dur:.1f}s", f"format: {open(f'{d}/format.txt').read().strip()}",
   f"cuts: {len(cuts)} (avg shot {dur/(len(cuts)+1):.2f}s)",
   f"audio: {info.get('track') or '?'} — {info.get('artist') or info.get('creator') or '?'}",
   f"caption: {(info.get('description') or '')[:300]}",
   f"views/likes: {info.get('view_count')}/{info.get('like_count')}",
   f"speech: {tr['text'].strip()[:600]}"]
open(f'{d}/report.txt','w').write('\n'.join(r)); print('\n'.join(r))
PY
echo "→ $D"
