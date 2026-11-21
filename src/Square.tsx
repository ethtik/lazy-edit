import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Grain, SERIF, STONE, GOLD } from "./Reel";
import clipDur from "../reels/clipdur.json";

// One square reel (footage fills a 1080 square) on a 9:16 canvas with the HisMind badge. No call to action.
// Data comes from reels/sq-*.json, built by sq-build.py.
export type SqData = {
  duration: number;
  words: { w: string; t: number; seg: number }[];
  voice: string | null;
  music: [string, number, number]; // file, start second, volume
  text?: boolean; // text-only reel: big centred lines instead of small subtitles
  shots: [number, string, number][];
};
const FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const TAIL = 30;
export const sqFrames = (d: SqData) => Math.round(d.duration * FPS) + TAIL;
const MATCH = /century|eng2014|out2014/; // broadcast footage: sponsor boards appear if we cut around inside it

const Shot: React.FC<{ media: string; from: number; frames: number }> = ({ media, from, frames }) => {
  const f = useCurrentFrame();
  const crop = MATCH.test(media);
  const zoom = interpolate(f, [0, frames], [1.0, 1.05]) * (crop ? 1.5 : 1);
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`,
    transformOrigin: crop ? "50% 30%" : "50% 50%", filter: "sepia(.18) saturate(.9) contrast(1.04)" };
  return media.endsWith(".mp4")
    ? <OffthreadVideo src={staticFile(media)} startFrom={Math.round(from * FPS)} muted style={style} />
    : <Img src={staticFile(media)} style={style} />;
};

const Fade: React.FC<{ on: boolean; children: React.ReactNode }> = ({ on, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: on ? interpolate(f, [0, 6], [0, 1], clamp) : 1 }}>{children}</AbsoluteFill>;
};

// Splits long shots into ~1.4s cuts of the same scene. Each cut starts later in the source than the last one
// ended (a small forward jump), so nothing repeats, and the whole span is pulled back to fit inside the clip.
const GAP = 0.6;
const cuts = (d: SqData) => d.shots.flatMap(([t, m, from], i) => {
  const end = i + 1 < d.shots.length ? d.shots[i + 1][0] : d.duration + TAIL / FPS;
  const n = MATCH.test(m) ? 1 : Math.max(1, Math.round((end - t) / 1.4));
  const len = (end - t) / n;
  const span = n * len + (n - 1) * GAP + 0.3;
  const max = (clipDur as Record<string, number>)[m] ?? 1e9;
  const gap = span > max ? Math.max(0, (max - 0.3 - n * len) / Math.max(1, n - 1)) : GAP;
  const start = Math.max(0, Math.min(from, max - (n * len + (n - 1) * gap) - 0.3));
  return Array.from({ length: n }, (_, k) => [t + len * k, m, start + k * (len + gap)] as [number, string, number]);
});

const lines = (d: SqData) => {
  const out: SqData["words"][] = [];
  for (const w of d.words) {
    const cur = out[out.length - 1];
    const len = cur ? cur.map((x) => x.w).join(" ").length + w.w.length + 1 : 99;
    if (!cur || cur[0].seg !== w.seg || (!d.text && len > 22)) out.push([w]); else cur.push(w);
  }
  return out;
};

const Caption: React.FC<{ d: SqData }> = ({ d }) => {
  const t = useCurrentFrame() / FPS;
  const L = lines(d);
  const idx = L.findIndex((l, i) => t >= l[0].t - 0.05 && (i === L.length - 1 || t < L[i + 1][0].t - 0.05));
  if (idx < 0) return null;
  if (d.text) {
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 90px", background: "rgba(8,12,11,.35)" }}>
        <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: idx === 0 ? 88 : 76, lineHeight: 1.12, textAlign: "center", color: STONE, textShadow: "0 2px 24px rgba(0,0,0,.85)" }}>
          {L[idx].map((w, i) => (
            <span key={i} style={{ opacity: interpolate(t, [w.t, w.t + 0.2], [0, 1], clamp), color: idx === 0 && i >= 3 ? GOLD : undefined, fontStyle: idx === 0 && i >= 3 ? "italic" : "normal" }}>{w.w + " "}</span>
          ))}
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontFamily: "'Hanken Grotesk', sans-serif",
      fontStyle: "italic", fontSize: 46, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.9), 0 0 2px rgba(0,0,0,.8)" }}>
      {L[idx].map((w) => w.w.toLowerCase()).join(" ")}
    </div>
  );
};

export const SquareReel: React.FC<{ d: SqData }> = ({ d }) => {
  const total = sqFrames(d);
  const C = cuts(d);
  const [mFile, mFrom, mVol] = d.music;
  return (
    <AbsoluteFill style={{ background: "#0E1412" }}>
      <div style={{ position: "absolute", top: 300, left: 0, width: 1080, height: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <span style={{ fontFamily: SERIF, fontSize: 64 }}><span style={{ color: STONE }}>His</span><span style={{ color: GOLD, fontStyle: "italic" }}>Mind</span></span>
        <span style={{ width: 2, height: 44, background: "#A3ABA7", opacity: 0.5 }} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 36, color: "#A3ABA7", letterSpacing: "0.04em" }}>hismind.in</span>
      </div>
      <div style={{ position: "absolute", top: 460, left: 0, width: 1080, height: 1080, overflow: "hidden" }}>
        {C.map(([t, media, from], i) => {
          const start = Math.round(t * FPS);
          const end = i + 1 < C.length ? Math.round(C[i + 1][0] * FPS) + 6 : total;
          return <Sequence key={i} from={start} durationInFrames={end - start}><Fade on={i > 0}><Shot media={media} from={from} frames={end - start} /></Fade></Sequence>;
        })}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)" }} />
        <Caption d={d} />
      </div>
      <Grain opacity={0.07} />
      {d.voice && <Audio src={staticFile(d.voice)} />}
      <Audio src={staticFile(mFile)} startFrom={Math.round(mFrom * FPS)} volume={(f) => mVol * interpolate(f, [0, 25, total - 40, total], [0, 1, 1, 0], clamp)} />
    </AbsoluteFill>
  );
};
