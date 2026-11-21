#!/bin/zsh
# Renders the seamless carousel: one 8640×1350 panorama, cut into 8 slides (1080×1350) in out/carousel/
cd "$(dirname "$0")"
mkdir -p out/carousel
npx remotion still src/index.ts Carousel-Panorama out/carousel/panorama.png --frame=149 --log=error || { echo "FAILED"; exit 1; }
for i in 1 2 3 4 5 6 7 8; do
  ffmpeg -v error -y -i out/carousel/panorama.png -vf "crop=1080:1350:$(( (i-1)*1080 )):0" out/carousel/slide-$i.png || { echo "FAILED: slide $i"; exit 1; }
done
echo "DONE: out/carousel/slide-1.png ... slide-8.png (+ panorama.png)"
