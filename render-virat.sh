#!/bin/zsh
cd "$(dirname "$0")"
npx remotion render src/index.ts Virat-Talk out/HisMind-Virat.mp4 --log=error && echo "DONE: out/HisMind-Virat.mp4"
