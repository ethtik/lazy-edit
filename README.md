# lazy-edit

Turn an interview into a cinematic reel. You pick the words; lazy-edit finds the footage, cuts it on action, matches the emotion to each line, syncs every cut to the music beat, and renders an Instagram-ready 1080×1920 file.

Built with [Remotion](https://www.remotion.dev), ffmpeg, Whisper and Demucs. It made the HisMind Virat Kohli reel: a cold-open hook, 0.8× slow motion, 60 match cuts and no frame shown twice.

This repo holds the workflow only. Footage, audio and renders stay on your machine (see `.gitignore`).

## What it does

- **Hook first.** The reel opens on the strongest line, spoken on camera, then a beat of black with a swell and a low boom before the story starts.
- **Match cuts.** Every cut lands mid-movement at both ends (motion scored per frame), so the action carries across the cut.
- **Emotion follows the words.** Takes are tagged sad, tense, fire or joy, and each line plays over the matching feeling. Around 70% of cuts are on the subject, 30% are context (opponents, crowds, teammates).
- **No repeated frames.** A source frame never plays twice, including the cold open. `./lazy check` fails the build if one does.
- **Beat sync.** Cuts snap to the music's beat grid, unless that would push a shot past its camera take.
- **Clean voice.** Demucs strips music that was mixed under an interview, so only your track plays.
- **Instagram spec.** H.264 High, yuv420p, Rec.709, 30 fps, 12 Mbit/s, AAC 256k, faststart (`remotion.config.ts`).

## Install

```bash
brew install ffmpeg yt-dlp openai-whisper
npm install
```

`./lazy voice` installs Demucs into `.demucs/` the first time you run it.

## Workflow

```bash
./lazy fetch virat5 "https://youtube.com/watch?v=..." --name pak2023        # checks it's 1080p before downloading
./lazy fetch virat5 "ytsearch1:kohli 2018 edgbaston hundred" --section 2:10-2:40
./lazy transcribe virat public/vid/virat/<interview>.mp4                    # word-timed transcript
./lazy voice public/audio/virat/<interview>.wav                            # only if music sits under the voice
./lazy vo                                                                  # voiceover from SEGS in vo-build.py
./lazy beats                                                               # beat grid of the music
./lazy prep public/vid/virat5/*.mp4                                        # proxies, scans, take sheets
```

Open `reels/sheets/<clip>.jpg`. Tile N is take N. Tag the takes you want by emotion in `match-cut.py` (`SAD`, `TENSE`, `FIRE`, `JOY`, `CONTEXT`) and give each phrase its takes in `PLAN`. Then:

```bash
./lazy cut          # build the shot list
./lazy check        # must print repeats: 0
./lazy draft        # rough cut in ~2 seconds: out/draft.mp4
./lazy render       # full reel (about 3-4 minutes)
./lazy render short # the under-a-minute cut
./lazy render --preview --frames 1200-1500   # quick look at one stretch
./lazy cover        # cover still
./lazy sfx          # rebuild the swell and boom
```

## Files

| File | Job |
|---|---|
| `lazy` | the command line |
| `vo-build.py` | joins interview answers into one voiceover with word timings |
| `beats.py` | beat grid of the music |
| `prep.sh` | 320px proxies, motion and cut scans, take-indexed contact sheets |
| `takes.py` | reads the scans: camera takes, motion, brightness per frame |
| `match-cut.py` | the edit: phrase plan, emotion tags, cut-on-action picks, beat sync, repeat guard |
| `check-repeats.py` | fails if any source frame plays twice |
| `draft.py` | fast rough cut from proxies |
| `src/VoReel.tsx` | Remotion compositions: full reel, short cut, cover, film grade, captions |
| `remotion.config.ts` | Instagram export settings |

## Rules the edit follows

- Real footage only. No stock clips.
- No watermarks, scorebars or burned-in subtitles inside the crop.
- Hard cuts on action. No dissolves.
- Sub-cuts always move forward in the source.
- Check every cut on a contact sheet before the final render.

## Licence notes

Fonts are under the SIL Open Font License. Footage you download belongs to its owners. Check the rights before you publish.
