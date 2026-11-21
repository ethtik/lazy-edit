#!/bin/zsh
# Renders the three trial reels into out/
cd "$(dirname "$0")"
for id in Trial1-DearMen Trial2-WeSayFine Trial3-Editorial; do
  echo "Rendering $id..."
  npx remotion render src/index.ts $id out/$id.mp4 --log=error || { echo "FAILED: $id"; exit 1; }
done
echo "DONE: out/Trial1-DearMen.mp4 out/Trial2-WeSayFine.mp4 out/Trial3-Editorial.mp4"
