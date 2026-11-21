#!/bin/zsh
# Downloads the launch-reel scenes from YouTube (top search result each), 720p max.
cd "$(dirname "$0")"
D=public/vid/launch
mkdir -p $D
get(){ yt-dlp -q --no-playlist -f "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720]" --merge-output-format mp4 -o "$D/$1.%(ext)s" "ytsearch1:$2" && echo "✔ $1" || echo "✘ $1"; }
get tommy      "peaky blinders tommy shelby stare scene"
get joker      "joker stairs dance scene 4k"
get gullycar   "gully boy murad car scene"
get pursuit    "pursuit of happyness bathroom scene"
get interstellar "interstellar cooper watching messages scene"
get thor       "endgame thor mother scene still worthy"
get tzp        "taare zameen par maa song scene"
get willhunting "good will hunting its not your fault scene"
get idiots     "3 idiots all is well scene"
get rocky      "rocky steps run scene"
get chakde     "chak de india 70 minutes speech"
get apnatime   "gully boy apna time aayega final scene"
get balboa     "rocky balboa speech son how hard you can get hit"
yt-dlp -q --no-playlist -x --audio-format mp3 -o "public/audio/time.%(ext)s" "ytsearch1:hans zimmer time inception official audio" && echo "✔ music"
ls -lh $D public/audio/time.mp3
