#!/bin/zsh
# Renders the end card's final frame for comparison with ref/end-card-reference.webp
cd "$(dirname "$0")"
npx remotion still src/index.ts Trial2-WeSayFine out/end-card.png --frame=779 --log=error && echo "DONE: out/end-card.png"
