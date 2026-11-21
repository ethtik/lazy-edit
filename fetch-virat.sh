#!/bin/zsh
# Downloads several Virat Kohli mental-health clips (top 3 results per search, under 15 min each),
# plus any YouTube links you pass as arguments, then transcribes each with word timings.
cd "$(dirname "$0")"
V=public/vid/virat; A=public/audio/virat
mkdir -p $V $A
dl(){ yt-dlp -q --no-playlist --match-filter "duration<900" -f "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720]" \
  --merge-output-format mp4 -o "$V/%(id)s.%(ext)s" "$1"; }
dl "ytsearch3:Virat Kohli Mark Nicholas Not Just Cricket podcast depression loneliest guy in the world"
dl "ytsearch3:Virat Kohli Star Sports lonely in a room full of people who love me"
dl "ytsearch3:Virat Kohli RCB podcast mental health"
dl "ytsearch3:Virat Kohli talks about depression 2014 England tour"
for u in "$@"; do dl "$u"; done
for f in $V/*.mp4; do
  n=$(basename $f .mp4); [[ -f $A/$n.json ]] && continue
  ffmpeg -v error -y -i $f -vn -ac 1 -ar 16000 $A/$n.wav
  whisper $A/$n.wav --model small --language en --word_timestamps True --output_format json --output_dir $A >/dev/null 2>&1 && echo "✔ $n"
done
ls -lh $V
