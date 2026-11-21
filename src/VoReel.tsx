import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { LogoReveal, EndCard, Watermark, Grain, SERIF, STONE, GOLD } from "./Reel";
import vo from "../reels/virat-vo.json";

// Voiceover reel: Virat's voice runs continuously; the pictures move on their own timeline in a 4:5 frame,
// and one caption line at a time sits under the frame.
const FPS = 30;
const VO = Math.round(vo.duration * FPS);
const LOGO = 75, END = 150;
export const voDuration = VO + LOGO + END;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const BOX = { top: 600, w: 1080, h: 608 }; // 16:9, uncropped

// Shots tied to the phrases Virat is saying: [start second, media, from-second] (built from reels/virat-shots.json)
import shotList from "../reels/virat-shots.json";
const SHOTS = (shotList as unknown as [number, string, number, number?][]).map(([t, m, s, r]) => [t, m, s, r ?? 1] as [number, string, number, number]);
const XFADE = 10; // frames of dissolve between shots

// Plays a list of shots with a dissolve into each one
const ShotTrack: React.FC<{ shots: [number, string, number, number][]; total: number; origin?: string; extra?: number; fade?: number }> = ({ shots, total, origin, extra, fade = XFADE }) => (
  <>{shots.map(([t, media, from, rate], i) => {
    const start = Math.round(t * FPS);
    const end = i + 1 < shots.length ? Math.round(shots[i + 1][0] * FPS) + fade : total;
    return <Sequence key={i} from={start} durationInFrames={end - start}><Dissolve on={i > 0 && fade > 0} fade={fade}><Shot media={media} from={from} rate={rate} frames={end - start} origin={origin} extra={extra} /></Dissolve></Sequence>;
  })}</>
);
const Dissolve: React.FC<{ on: boolean; fade: number; children: React.ReactNode }> = ({ on, fade, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: on ? interpolate(f, [0, fade], [0, 1], clamp) : 1 }}>{children}</AbsoluteFill>;
};
const MUSIC = { src: "audio/experience.mp3", from: 89 * FPS }; // Einaudi's biggest swell starts as Virat turns to "Look, as I said…"

// Break the words into short lines (≤ 24 characters), never across a voiceover segment
type W = (typeof vo.words)[number];
const LINES: W[][] = [];
for (const w of vo.words) {
  const cur = LINES[LINES.length - 1];
  const len = cur ? cur.map((x) => x.w).join(" ").length + w.w.length + 1 : 99;
  if (!cur || cur[0].seg !== w.seg || len > 24) LINES.push([w]);
  else cur.push(w);
}

const Shot: React.FC<{ media: string; from: number; rate?: number; frames: number; origin?: string; extra?: number }> = ({ media, from, rate = 1, frames, origin, extra = 1 }) => {
  const f = useCurrentFrame();
  // per-clip crop: zoom in from the top to hide scorebars and burned-in subtitles at the bottom
  const CROP: [RegExp, number, string][] = [[/century/, 1.45, "50% 55%"], [/out2014/, 1.2 * extra, origin ?? "50% 0%"], [/walk2018|virat3\/walkout/, 1.32, "50% 25%"], [/1OBV/, 1.48, "30% 35%"], [/virat3/, 1.15, "50% 50%"], [/virat4/, 1.32, "50% 25%"], [/virat5/, 1.32, "50% 25%"]];
  const c = CROP.find(([r]) => r.test(media));
  const zoom = interpolate(f, [0, frames], [1.0, 1.03]) * (c ? c[1] : 1);
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, transformOrigin: c ? c[2] : "50% 50%", filter: "saturate(.8) contrast(1.05) brightness(.85)" };
  return media.endsWith(".mp4")
    ? <OffthreadVideo src={staticFile(media)} startFrom={Math.round(from * FPS)} playbackRate={rate} muted style={style} />
    : <Img src={staticFile(media)} style={style} />;
};

const Caption: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const idx = LINES.findIndex((l, i) => t >= l[0].t - 0.05 && (i === LINES.length - 1 || t < LINES[i + 1][0].t - 0.05));
  if (idx < 0) return null;
  const line = LINES[idx];
  const current = [...line].reverse().find((w) => w.t <= t);
  const pop = interpolate(t, [line[0].t - 0.05, line[0].t + 0.1], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: BOX.top + BOX.h + 60, textAlign: "center", whiteSpace: "nowrap",
      fontFamily: SERIF, fontWeight: 500, fontSize: 76, opacity: pop, transform: `translateY(${(1 - pop) * 14}px)` }}>
      {line.map((w, i) => (
        <span key={i} style={{ color: w === current ? GOLD : STONE, fontStyle: w === current ? "italic" : "normal",
          opacity: w.t <= t + 0.02 ? 1 : 0.28 }}>{(i === 0 && LINES[idx - 1]?.[0].seg !== w.seg ? w.w.charAt(0).toUpperCase() + w.w.slice(1) : w.w) + " "}</span>
      ))}
    </div>
  );
};

export const VoReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#16201E" }}>
    <Sequence from={0} durationInFrames={VO}>
      <div style={{ position: "absolute", left: 0, top: BOX.top, width: BOX.w, height: BOX.h, overflow: "hidden" }}>
        <ShotTrack shots={SHOTS} total={VO} origin="50% 50%" extra={1.15} />
      </div>
      <div style={{ position: "absolute", top: BOX.top - 110, width: "100%", textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 46, color: GOLD }}>Virat Kohli, in his own words</div>
      <Caption />
      <Watermark light={false} />
    </Sequence>
    <Sequence from={VO} durationInFrames={LOGO}><LogoReveal type="logo" frames={LOGO} tag="Talk to someone." /></Sequence>
    <Sequence from={VO + LOGO} durationInFrames={END}><EndCard type="end" frames={END} title="HisMind" subtitle="hismind.in" /></Sequence>
    <Grain opacity={0.06} />
    <Audio src={staticFile("audio/virat/vo.wav")} />
    <Audio src={staticFile(MUSIC.src)} startFrom={MUSIC.from} volume={(f) => interpolate(f, [0, 25, VO - 30, VO + 20, voDuration - 45, voDuration], [0, 0.22, 0.22, 0.6, 0.6, 0], clamp)} />
  </AbsoluteFill>
);

// ── Square version, styled after the 1:1 talking-reel reference: footage fills the square,
// fast cuts (~1.3s), small lowercase italic captions over the picture, warm film grade.
// Square version: hard cuts on action (built by match-cut.py), no dissolves, no sub-cuts.
const SQ_SHOTS = SHOTS;
const PIC = 568, BAR = (1080 - PIC) / 2; // 1.9:1 picture inside the square
const SQ_LINES: W[][] = [];
for (const w of vo.words) {
  const cur = SQ_LINES[SQ_LINES.length - 1];
  const len = cur ? cur.map((x) => x.w).join(" ").length + w.w.length + 1 : 99;
  if (!cur || cur[0].seg !== w.seg || len > 22) SQ_LINES.push([w]);
  else cur.push(w);
}
const SqCaption: React.FC<{ range?: [number, number] }> = ({ range }) => {
  const t = useCurrentFrame() / FPS;
  const idx = SQ_LINES.findIndex((l, i) => t >= l[0].t - 0.05 && (i === SQ_LINES.length - 1 || t < SQ_LINES[i + 1][0].t - 0.05));
  if (idx < 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: BAR + PIC + 60, textAlign: "center", fontFamily: "'Hanken Grotesk', sans-serif",
      fontStyle: "italic", fontWeight: 400, fontSize: 44, color: "#EDE6DA", letterSpacing: "0.01em" }}>
      {SQ_LINES[idx].filter((w) => !range || (w.t >= range[0] && w.t < range[1])).map((w) => w.w.toLowerCase()).join(" ")}
    </div>
  );
};
// Cold open: Virat's confession on camera (lip-synced podcast), a beat of black, then the story from the top.
const HOOK_A = 88.8, HOOK_B = 92.15; // "I am not shy to admit that I was feeling mentally down"
const HOOK = Math.round((HOOK_B - HOOK_A) * FPS), GAP = 15, OPEN = HOOK + GAP;
// the podcast sync shot for this line: source = reel time + (from - start), the same offset match-cut.py lip-synced it with
const hookShot = SHOTS.filter(([, m]) => /1OBV/.test(m)).sort((x, y) => Math.abs(x[0] - HOOK_A) - Math.abs(y[0] - HOOK_A))[0];
export const sqDuration = OPEN + VO + 30;
const Grade: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", left: 0, top: BAR, width: 1080, height: PIC, overflow: "hidden" }}>
    <AbsoluteFill style={{ filter: "contrast(1.12) saturate(.78) sepia(.1) brightness(1.04)" }}>{children}</AbsoluteFill>
    <AbsoluteFill style={{ background: "#0d3a3c", mixBlendMode: "soft-light", opacity: 0.45 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,170,90,.18), rgba(255,140,60,.05) 60%, rgba(0,40,45,.15))", mixBlendMode: "overlay" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 20%, rgba(255,190,130,.10), rgba(0,0,0,0) 60%)", mixBlendMode: "screen" }} />
    <AbsoluteFill style={{ background: "rgba(22,26,24,1)", mixBlendMode: "lighten", opacity: 0.4 }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,.55) 100%)" }} />
    <Grain opacity={0.09} />
  </div>
);
const HookCaption: React.FC = () => {
  const t = HOOK_A + useCurrentFrame() / FPS;
  const ws = vo.words.filter((w) => w.t >= HOOK_A - 0.05 && w.t < HOOK_B && w.t <= t + 0.02);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: BAR + PIC + 60, textAlign: "center", fontFamily: "'Hanken Grotesk', sans-serif",
      fontStyle: "italic", fontWeight: 400, fontSize: 44, color: "#EDE6DA", letterSpacing: "0.01em" }}>
      {ws.map((w) => w.w.toLowerCase()).join(" ")}
    </div>
  );
};
// Sound at the turn from the hook into the story: a swell through the black, a low boom on the first frame
const SWELL = 27;
const HookHit: React.FC = () => (
  <>
    <Sequence from={OPEN - SWELL} durationInFrames={SWELL}><Audio src={staticFile("audio/sfx/swell.wav")} volume={1} /></Sequence>
    <Sequence from={OPEN} durationInFrames={75}><Audio src={staticFile("audio/sfx/impact.wav")} volume={0.9} /></Sequence>
  </>
);
export const VoSquare: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <HookHit />
      <Sequence from={0} durationInFrames={HOOK}>
        <Grade><Shot media={hookShot[1]} from={hookShot[2] + (HOOK_A - hookShot[0])} frames={HOOK} /></Grade>
        <HookCaption />
        <Audio src={staticFile("audio/virat/vo.wav")} startFrom={Math.round(HOOK_A * FPS)} />
      </Sequence>
      <Sequence from={OPEN} durationInFrames={VO + 30}>
        <Sequence from={0} durationInFrames={VO}>
          <Grade><ShotTrack shots={SQ_SHOTS} total={VO} fade={0} /></Grade>
          <SqCaption />
        </Sequence>
        <Audio src={staticFile("audio/virat/vo.wav")} />
        <Audio src={staticFile(MUSIC.src)} startFrom={MUSIC.from} volume={(fr) => interpolate(fr, [0, 25, VO - 20, VO + 30], [0, 0.22, 0.22, 0], clamp)} />
      </Sequence>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], clamp) }} />
    </AbsoluteFill>
  );
};

// Square reel on a 9:16 canvas with the HisMind badge above it (no call to action)
export const VoSquareTall: React.FC<{ Body?: React.FC }> = ({ Body = VoSquare }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <div style={{ position: "absolute", top: 300, left: 0, width: 1080, height: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, opacity: 0.7 }}>
      <span style={{ fontFamily: SERIF, fontSize: 64 }}><span style={{ color: STONE }}>His</span><span style={{ color: GOLD, fontStyle: "italic" }}>Mind</span></span>
      <span style={{ width: 2, height: 44, background: "#A3ABA7", opacity: 0.5 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 36, color: "#A3ABA7", letterSpacing: "0.04em" }}>hismind.in</span>
    </div>
    <div style={{ position: "absolute", top: 460, left: 0, width: 1080, height: 1080, overflow: "hidden" }}><Body /></div>
  </AbsoluteFill>
);

// ── Short cut (under a minute): the same cold open, then only these lines of the voiceover, in order.
// Each piece plays the full reel's picture, captions and voice for that stretch, so footage stays matched to the words.
const CUTS: [number, number][] = [
  [1.05, 5.15],    // the lowest point in my career was England in 2014
  [11.7, 14.85],   // as a batsman you know you're going to get out in the morning when you wake up
  [22.4, 33.4],    // to get out of bed ... knowing that you will fail ... demolished me completely
  [69.15, 73.85],  // I just kept going into a downward spiral and I just couldn't get out of it
  [92.75, 96.35],  // this is a very normal thing to feel, I am a human being at the end of the day
  [81.25, 87.05],  // you also have to understand why people love you ... you were yourself always
  [108.3, 114.3],  // relax, it's normal ... no one is going to think you are weak
  [119.3, 122.53], // you are going to get help from sources you didn't even imagine
];
const CUT_F = CUTS.map(([a, b]) => [Math.round(a * FPS), Math.round(b * FPS)]);
const SHORT_BODY = CUT_F.reduce((n, [a, b]) => n + b - a, 0);
export const shortDuration = OPEN + SHORT_BODY + 30;
export const VoShort: React.FC = () => {
  const f = useCurrentFrame();
  let at = OPEN;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <HookHit />
      <Sequence from={0} durationInFrames={HOOK}>
        <Grade><Shot media={hookShot[1]} from={hookShot[2] + (HOOK_A - hookShot[0])} frames={HOOK} /></Grade>
        <HookCaption />
        <Audio src={staticFile("audio/virat/vo.wav")} startFrom={Math.round(HOOK_A * FPS)} />
      </Sequence>
      {CUT_F.map(([a, b], i) => {
        const from = at; at += b - a;
        return (
          <Sequence key={i} from={from} durationInFrames={b - a}>
            <Sequence from={-a}>
              <Grade><ShotTrack shots={SQ_SHOTS} total={VO} fade={0} /></Grade>
              <SqCaption range={CUTS[i]} />
              <Audio src={staticFile("audio/virat/vo.wav")} />
            </Sequence>
          </Sequence>
        );
      })}
      <Sequence from={OPEN} durationInFrames={SHORT_BODY + 30}>
        <Audio src={staticFile(MUSIC.src)} startFrom={MUSIC.from} volume={(fr) => interpolate(fr, [0, 25, SHORT_BODY - 20, SHORT_BODY + 30], [0, 0.22, 0.22, 0], clamp)} />
      </Sequence>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], clamp) + interpolate(f, [OPEN + SHORT_BODY, OPEN + SHORT_BODY + 20], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
export const VoShortTall: React.FC = () => <VoSquareTall Body={VoShort} />;

// Cover for the Virat reel: everything that matters sits inside Instagram's 3:4 grid crop (y 240-1680)
export const ViratCover: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <div style={{ position: "absolute", top: 300, width: 1080, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, opacity: 0.8 }}>
      <span style={{ fontFamily: SERIF, fontSize: 56 }}><span style={{ color: STONE }}>His</span><span style={{ color: GOLD, fontStyle: "italic" }}>Mind</span></span>
      <span style={{ width: 2, height: 38, background: "#A3ABA7", opacity: 0.5 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, color: "#A3ABA7", letterSpacing: "0.04em" }}>hismind.in</span>
    </div>
    <div style={{ position: "absolute", left: 0, top: 430, width: 1080, height: 820, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: "contrast(1.12) saturate(.75) sepia(.1) brightness(1.02)" }}>
        <OffthreadVideo src={staticFile("vid/virat2/out2014.mp4")} startFrom={Math.round(300.2 * FPS)} muted
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "42% 30%", transform: "scale(1.25) translateX(-12%)", transformOrigin: "42% 25%" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#0d3a3c", mixBlendMode: "soft-light", opacity: 0.45 }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,170,90,.16), rgba(0,40,45,.15))", mixBlendMode: "overlay" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, #000 100%)" }} />
      <Grain opacity={0.08} />
    </div>
    <div style={{ position: "absolute", left: 70, right: 70, top: 1260, textAlign: "center", fontFamily: SERIF, fontSize: 84, lineHeight: 1.08, color: STONE }}>
      “I was feeling<br /><span style={{ color: GOLD, fontStyle: "italic" }}>mentally down.</span>”
    </div>
    <div style={{ position: "absolute", top: 1500, width: 1080, textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 34, color: "#A3ABA7", letterSpacing: "0.14em" }}>VIRAT KOHLI</div>
  </AbsoluteFill>
);
