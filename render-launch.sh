#!/bin/zsh
cd "$(dirname "$0")"
npx remotion render src/index.ts Launch out/HisMind-Launch.mp4 --log=error && echo "DONE: out/HisMind-Launch.mp4"
