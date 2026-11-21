import React from "react";
import {
  AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

// ---------- data types (one JSON file per reel) ----------
// Text styles: "serif" = Newsreader headline · "caps" = bold Hanken capitals (like "DEAR MEN,") · "subtitle" = lower-third caption
// Text animations: "words" = words fade/blur in one by one · "type" = typewriter, letter by letter
type TextStyle = "serif" | "caps" | "subtitle";
type TextAnim = "words" | "type";
type Line = { text: string; at?: number; size?: number; italic?: boolean; accent?: boolean };
type Sfx = { file: string; at?: number; volume?: number };
// media = an image (.jpg/.png/.webp) or a video (.mp4) under public/. grade: "color" (muted film look) or "bw"
type Media = { media: string; from?: number; grade?: "color" | "bw" };

export type Scene = (
  | { type: "flicker"; frames: number; images: string[]; words: string[]; every?: number }
  | ({ type: "text"; frames: number; bg?: "light" | "dark"; lines: Line[]; style?: TextStyle; anim?: TextAnim } & Partial<Media>)
  | { type: "number"; frames: number; big: string; bigSize?: number; count?: boolean; caption: string; source?: string }
  | { type: "echo"; frames: number; lead: string; word: string }
  | { type: "punch"; frames: number; words: string[]; style?: TextStyle } & Partial<Media>
  | { type: "collage"; frames: number; items: { image: string; text: string }[] }
  | ({ type: "hold"; frames: number; lines: string[]; style?: TextStyle; anim?: TextAnim } & Media)
  | { type: "clips"; frames: number; style?: TextStyle; flash?: boolean; items: ({ text?: string; frames: number } & Media)[] }
  | { type: "logo"; frames: number; tag?: string }
  | { type: "end"; frames: number; title: string; subtitle?: string; small?: string[] }
) & { wipeIn?: WipeDir; sfx?: Sfx[] };

type WipeDir = "up" | "left" | "right";
export type ReelData = {
  music?: { file: string; startFrom?: number; volume?: number };
  scenes: Scene[];
};

export const reelDuration = (d: ReelData) => d.scenes.reduce((a, s) => a + s.frames, 0);

// ---------- look: HisMind brand (from the HisMind design system tokens) ----------
const SERIF = "'Newsreader', Georgia, serif";
const SANS = "'Hanken Grotesk', system-ui, sans-serif";
const LIGHT = "#F4F0E8";  // surface (warm stone)
const DARK = "#16201E";   // deep / ink (green-black)
const STONE = "#F4F0E8";  // text on deep
const MUTED = "#A3ABA7";  // muted on dark
const AMBER = "#D9964A";  // one accent per view
const FONTS_TO_LOAD: [string, string, FontFaceDescriptors][] = [
  ["Newsreader", "fonts/Newsreader-normal.woff2", { style: "normal", weight: "200 800" }],
  ["Newsreader", "fonts/Newsreader-italic.woff2", { style: "italic", weight: "200 800" }],
  ["Hanken Grotesk", "fonts/HankenGrotesk-normal.woff2", { style: "normal", weight: "100 900" }],
  ["DM Sans", "fonts/DMSans.woff2", { style: "normal", weight: "300 700" }],
];
const fontHandle = delayRender("brand fonts");
Promise.all(FONTS_TO_LOAD.map(([fam, file, d]) => new FontFace(fam, `url(${staticFile(file)})`, d).load().then((ff) => { document.fonts.add(ff); })))
  .then(() => continueRender(fontHandle)).catch((e) => { console.error(e); continueRender(fontHandle); });
const src = (f: string) => staticFile(f);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// Strong dark halo so text stays readable on any footage
const HALO = "0 2px 4px rgba(0,0,0,.85), 0 0 28px rgba(0,0,0,.75), 0 0 70px rgba(0,0,0,.5)";

const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.18 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity }}>
      <svg width="100%" height="100%">
        <filter id={`g${f % 6}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 6} /></filter>
        <rect width="100%" height="100%" filter={`url(#g${f % 6})`} />
      </svg>
    </AbsoluteFill>
  );
};

// Image or video, slow push-in, graded, with a dark scrim where the text sits
const MediaLayer: React.FC<Media & { frames: number; seed?: number; scrim?: "center" | "bottom" | "none"; dim?: number }> = ({ media, from = 0, grade, frames, seed = 1, scrim = "center", dim }) => {
  const f = useCurrentFrame();
  const isVideo = media.endsWith(".mp4");
  const g = grade ?? (isVideo ? "color" : "bw");
  const scale = interpolate(f, [0, frames], [1.06, 1.14]);
  const dx = (random(seed) - 0.5) * 50 * (f / frames);
  const filter = g === "bw" ? `grayscale(1) contrast(1.12) brightness(${dim ?? 0.62})` : `saturate(0.72) contrast(1.06) brightness(${dim ?? 0.72}) sepia(0.12)`;
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale}) translateX(${dx}px)`, filter };
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: DARK }}>
      {isVideo ? <OffthreadVideo src={src(media)} startFrom={Math.round(from * 30)} muted style={style} /> : <Img src={src(media)} style={style} />}
      <AbsoluteFill style={{ background: DARK, mixBlendMode: "soft-light", opacity: 0.45 }} />
      {scrim === "center" && <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 32% at 50% 50%, rgba(10,15,14,.72), rgba(10,15,14,0) 100%)" }} />}
      {scrim === "bottom" && <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(10,15,14,.85) 0%, rgba(10,15,14,.35) 30%, rgba(10,15,14,0) 50%)" }} />}
      <Grain opacity={0.2} />
    </AbsoluteFill>
  );
};

// One line of text in a chosen style and animation
const TextLine: React.FC<{ text: string; start?: number; size?: number; color?: string; italic?: boolean; style?: TextStyle; anim?: TextAnim; perWord?: number; accent?: boolean; onMedia?: boolean }> = ({
  text, start = 0, size, color = STONE, italic, style = "serif", anim = "words", perWord = 5, accent, onMedia = true,
}) => {
  const f = useCurrentFrame();
  const t0 = f - start;
  const base: React.CSSProperties = {
    textAlign: "center", padding: "0 80px", color: accent ? AMBER : color,
    textShadow: onMedia && color !== DARK ? HALO : "none",
    ...(style === "serif" && { fontFamily: SERIF, fontSize: size ?? 92, fontWeight: 500, lineHeight: 1.12, fontStyle: italic ? "italic" : "normal" }),
    ...(style === "caps" && { fontFamily: SANS, fontSize: size ?? 88, fontWeight: 800, lineHeight: 1.08, textTransform: "uppercase", letterSpacing: "0.02em" }),
    ...(style === "subtitle" && { fontFamily: SANS, fontSize: size ?? 58, fontWeight: 600, lineHeight: 1.2, fontStyle: italic ? "italic" : "normal" }),
  };
  if (anim === "type") {
    const n = Math.max(0, Math.min(text.length, Math.floor(t0 / 1.4)));
    const caret = n < text.length;
    return <div style={base}>{text.slice(0, n)}<span style={{ opacity: caret && t0 >= 0 ? 1 : 0 }}>|</span><span style={{ opacity: 0 }}>{text.slice(n)}</span></div>;
  }
  const words = text.split(" ");
  return (
    <div style={base}>
      {words.map((w, i) => {
        const t = t0 - i * perWord;
        const o = interpolate(t, [0, 4], [0, 1], clamp);
        const b = interpolate(t, [0, 4], [8, 0], clamp);
        const y = interpolate(t, [0, 6], [14, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
        return <span key={i} style={{ opacity: o, filter: `blur(${b}px)`, display: "inline-block", marginRight: "0.25em", transform: `translateY(${y}px)` }}>{w}</span>;
      })}
    </div>
  );
};

const Center: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 30 }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap }}>{children}</AbsoluteFill>
);
const Bottom: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 430 }}>{children}</AbsoluteFill>
);

// ---------- scenes ----------
const Flicker: React.FC<Extract<Scene, { type: "flicker" }>> = ({ frames, images, words, every = 4 }) => {
  const f = useCurrentFrame();
  const img = images[Math.floor(f / every) % images.length];
  const per = frames / words.length;
  const wi = Math.min(words.length - 1, Math.floor(f / per));
  const punch = interpolate(f - wi * per, [0, 5], [1.18, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const shake = (random(f) - 0.5) * 14;
  const isVideo = img.endsWith(".mp4");
  const st: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", filter: `grayscale(1) contrast(1.5) brightness(${0.4 + random(f + 9) * 0.2})`, transform: `scale(1.15) translateX(${shake}px)` };
  return (
    <AbsoluteFill>
      {isVideo ? <OffthreadVideo src={src(img)} muted style={st} /> : <Img src={src(img)} style={st} />}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 25% at 50% 50%, rgba(10,15,14,.75), rgba(10,15,14,0))" }} />
      <Grain opacity={0.35} />
      <Center><div style={{ fontFamily: SANS, fontWeight: 800, textTransform: "uppercase", fontSize: 150, letterSpacing: "0.01em", color: STONE, textShadow: HALO, transform: `scale(${punch})` }}>{words[wi]}</div></Center>
    </AbsoluteFill>
  );
};

const TextScene: React.FC<Extract<Scene, { type: "text" }>> = ({ frames, bg = "dark", media, from, grade, lines, style, anim }) => {
  const onMedia = !!media;
  const color = onMedia || bg === "dark" ? STONE : DARK;
  const Wrap = style === "subtitle" ? Bottom : Center;
  return (
    <AbsoluteFill style={{ background: bg === "light" ? LIGHT : DARK }}>
      {media && <MediaLayer media={media} from={from} grade={grade} frames={frames} seed={frames} scrim={style === "subtitle" ? "bottom" : "center"} />}
      {!media && <Grain opacity={0.08} />}
      <Wrap>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {lines.map((l, i) => <TextLine key={i} text={l.text} start={l.at ?? i * 20} size={l.size} italic={l.italic} accent={l.accent} color={color} style={style} anim={anim} onMedia={onMedia} />)}
        </div>
      </Wrap>
    </AbsoluteFill>
  );
};

const NumberScene: React.FC<Extract<Scene, { type: "number" }>> = ({ big, bigSize = 340, count, caption, source }) => {
  const f = useCurrentFrame();
  const target = Number(big.replace(/[^0-9]/g, ""));
  const p = interpolate(f, [0, 32], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const shown = count && target ? Math.round(target * p).toLocaleString("en-IN") : big;
  const land = count ? interpolate(f, [32, 36, 42], [1, 1.06, 1], clamp) : interpolate(f, [0, 10], [1.25, 1], clamp);
  const o = interpolate(f, [0, 6], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: DARK }}>
      <Grain opacity={0.08} />
      <Center gap={40}>
        <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: bigSize, color: AMBER, transform: `scale(${land})`, opacity: o, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{shown}</div>
        <TextLine text={caption} start={count ? 34 : 14} size={64} perWord={3} onMedia={false} />
        {source && <div style={{ fontFamily: SANS, fontSize: 30, color: MUTED, textAlign: "center", padding: "0 90px", opacity: interpolate(f, [count ? 60 : 40, count ? 70 : 50], [0, 1], clamp) }}>{source}</div>}
      </Center>
    </AbsoluteFill>
  );
};

// Replaces the old word-flood: one word per beat, big and clean, each landing with a punch
const Punch: React.FC<Extract<Scene, { type: "punch" }>> = ({ frames, words, style = "serif", media, from, grade }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const per = frames / words.length;
  const wi = Math.min(words.length - 1, Math.floor(f / per));
  const local = f - wi * per;
  const sp = spring({ frame: local, fps, config: { damping: 12, stiffness: 180, mass: 0.6 } });
  const scale = interpolate(sp, [0, 1], [1.5, 1]);
  const last = wi === words.length - 1;
  return (
    <AbsoluteFill style={{ background: DARK }}>
      {media && <MediaLayer media={media} from={from} grade={grade} frames={frames} />}
      <Center>
        <div style={{ ...(style === "caps" ? { fontFamily: SANS, fontWeight: 800, textTransform: "uppercase" } : { fontFamily: SERIF, fontWeight: 500, fontStyle: last ? "italic" : "normal" }),
          fontSize: last ? 230 : 190, color: STONE, opacity: interpolate(local, [0, 3], [0, 1], clamp), transform: `scale(${scale})`, textShadow: media ? HALO : "none", textAlign: "center", padding: "0 60px", lineHeight: 1 }}>{words[wi]}</div>
      </Center>
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );
};

// Collage: each photo POPS in (spring overshoot + slight tilt), text changes each step
const SLOTS = [
  { l: 4, t: 6, w: 62, r: -3 }, { l: 36, t: 22, w: 60, r: 2.5 }, { l: 6, t: 62, w: 58, r: 2 },
  { l: 40, t: 74, w: 56, r: -2.5 }, { l: 2, t: 82, w: 40, r: 3 },
];
const Collage: React.FC<Extract<Scene, { type: "collage" }>> = ({ frames, items }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const per = frames / items.length;
  const cur = Math.min(items.length - 1, Math.floor(f / per));
  return (
    <AbsoluteFill style={{ background: LIGHT }}>
      {items.slice(0, cur + 1).map((it, i) => {
        const s = SLOTS[i % SLOTS.length];
        const sp = spring({ frame: f - i * per, fps, config: { damping: 10, stiffness: 160, mass: 0.7 } });
        return <Img key={i} src={src(it.image)} style={{ position: "absolute", left: `${s.l}%`, top: `${s.t}%`, width: `${s.w}%`,
          height: `${s.w * 0.7 * 1080 / 1920}%`, objectFit: "cover", filter: "saturate(.75) contrast(1.05) sepia(.1)",
          transform: `scale(${interpolate(sp, [0, 1], [0.6, 1])}) rotate(${s.r * sp}deg)`, opacity: Math.min(1, sp * 2),
          boxShadow: "0 14px 34px rgba(0,0,0,.22)", border: "10px solid #FBF9F4" }} />;
      })}
      <Center>
        <div style={{ background: LIGHT, padding: "14px 30px", boxShadow: "0 6px 24px rgba(0,0,0,.12)" }}>
          <Sequence from={Math.round(cur * per)} layout="none"><TextLine key={cur} text={items[cur].text} size={70} color={DARK} perWord={3} onMedia={false} /></Sequence>
        </div>
      </Center>
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );
};

const Hold: React.FC<Extract<Scene, { type: "hold" }>> = ({ frames, media, from, grade, lines, style, anim }) => {
  const f = useCurrentFrame();
  const per = frames / lines.length;
  const cur = Math.min(lines.length - 1, Math.floor(f / per));
  const Wrap = style === "subtitle" ? Bottom : Center;
  return (
    <AbsoluteFill>
      <MediaLayer media={media} from={from} grade={grade} frames={frames} seed={3} scrim={style === "subtitle" ? "bottom" : "center"} />
      <Wrap><Sequence from={Math.round(cur * per)} layout="none"><TextLine key={cur} text={lines[cur]} perWord={4} style={style} anim={anim} /></Sequence></Wrap>
    </AbsoluteFill>
  );
};

// Fast cuts between clips with lower-third subtitles (like the TV-clip reference)
const Clips: React.FC<Extract<Scene, { type: "clips" }>> = ({ items, style = "subtitle", flash }) => {
  let at = 0;
  return (
    <AbsoluteFill>
      {items.map((it, i) => {
        const el = (
          <Sequence key={i} from={at} durationInFrames={it.frames}>
            <MediaLayer media={it.media} from={it.from} grade={it.grade} frames={it.frames} seed={i + 2} scrim={style === "subtitle" ? "bottom" : "center"} />
            {it.text && (style === "subtitle" ? <Bottom><TextLine text={it.text} style="subtitle" perWord={3} /></Bottom> : <Center><TextLine text={it.text} style={style} perWord={3} /></Center>)}
            {flash && i > 0 && <Flash />}
          </Sequence>
        );
        at += it.frames;
        return el;
      })}
    </AbsoluteFill>
  );
};
const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [0, 4], [0.55, 0], clamp) }} />;
};

// HisMind logo, as in the brand reference: "His" upright in stone, "Mind" italic in gold
const NAVY = "#15191F";
const GOLD = "#DEB37B";
const GLOW = "#3E3226";
const Logo: React.FC<{ size: number; stacked?: boolean; hisColor?: string; mindColor?: string }> = ({ size, stacked, hisColor = STONE, mindColor = GOLD }) => (
  <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: size, lineHeight: 0.92, display: "flex", flexDirection: stacked ? "column" : "row",
    alignItems: stacked ? "flex-start" : "baseline", gap: stacked ? 0 : size * 0.06 }}>
    <span style={{ color: hisColor }}>His</span>
    <span style={{ color: mindColor, fontStyle: "italic", marginLeft: stacked ? -size * 0.04 : 0 }}>Mind</span>
  </div>
);


// Logo reveal: the wordmark scales in with a warm glow, an optional tag line underneath
const LogoReveal: React.FC<Extract<Scene, { type: "logo" }>> = ({ tag }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const k = spring({ frame: f, fps, config: { damping: 14, mass: 0.8 } });
  const t = interpolate(f, [22, 36], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: NAVY, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40 }}>
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, #3E3226 0%, rgba(62,50,38,0) 65%)", opacity: k }} />
      <div style={{ transform: `scale(${0.7 + 0.3 * k})`, opacity: k }}><Logo size={210} stacked /></div>
      {tag && <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 72, color: GOLD, opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>{tag}</div>}
    </AbsoluteFill>
  );
};

// End card — matches ref/end-card-reference.webp exactly in its final resting frame; the motion only builds up to it
const DMSANS = "'DM Sans', 'Hanken Grotesk', system-ui, sans-serif";
const End: React.FC<Extract<Scene, { type: "end" }>> = ({ subtitle }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = { ...clamp, easing: Easing.out(Easing.cubic) };
  const fade = (a: number, d = 14) => interpolate(f, [a, a + d], [0, 1], clamp);
  const up = (a: number, px = 26, d = 20) => interpolate(f, [a, a + d], [px, 0], ease);
  const glowO = interpolate(f, [0, 45], [0, 1], clamp) * (0.92 + 0.08 * Math.sin(f / 22)); // gentle breathing
  const mindX = interpolate(f, [6, 30], [-18, 0], ease);
  const pill = spring({ frame: f - 46, fps, config: { damping: 16, stiffness: 120 } });
  const border = interpolate(f, [46, 70], [0, 1], clamp); // outline draws in
  const arrow = f > 75 && f < 75 + 57 ? Math.sin((f - 75) / 9) * 5 : 0; // arrow nudges once, then rests
  const words1 = ["Not", "sure", "who"];
  const words2 = ["to", "talk", "to?"];
  const w = (i: number) => ({ opacity: fade(28 + i * 3, 8), transform: `translateY(${up(28 + i * 3, 14, 10)}px)`, display: "inline-block" });
  const startHere = interpolate(f, [48, 62], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#151920" }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle 430px at 50% 46%, rgba(64,50,36,.95), rgba(21,25,32,0) 100%)", opacity: glowO }} />
      {/* logo */}
      <div style={{ position: "absolute", left: 310, top: 552, fontFamily: SERIF, fontWeight: 400, fontSize: 199, lineHeight: 1, color: "#F1EEE6",
        opacity: fade(0, 18), transform: `translateY(${up(0, 30, 24)}px)` }}>His</div>
      <div style={{ position: "absolute", left: 300, top: 724, fontFamily: SERIF, fontWeight: 400, fontStyle: "italic", fontSize: 203, lineHeight: 1, color: GOLD,
        opacity: fade(8, 18), transform: `translateX(${mindX}px)` }}>Mind</div>
      {/* date */}
      <div style={{ position: "absolute", top: 968, width: "100%", textAlign: "center", fontFamily: DMSANS, fontSize: 34, color: "#9CA1A6", letterSpacing: "0.012em", fontVariationSettings: "'opsz' 14", opacity: fade(20) }}>
        {subtitle ?? "International Men’s Day · 19 November"}</div>
      {/* headline */}
      <div style={{ position: "absolute", top: 1168, width: "100%", textAlign: "center", fontFamily: SERIF, fontWeight: 400, fontSize: 70, lineHeight: "77px", color: "#F1EEE6" }}>
        {words1.map((x, i) => <span key={x} style={w(i)}>{x}{i < 2 ? "\u00a0" : ""}</span>)}<br />
        {words2.map((x, i) => <span key={x + i} style={w(i + 3)}>{x}{"\u00a0"}</span>)}
        <span style={{ display: "inline-block", fontStyle: "italic", color: GOLD, opacity: startHere, transform: `translateY(${(1 - startHere) * 10}px)`, filter: `blur(${(1 - startHere) * 6}px)` }}>Start here.</span>
      </div>
      {/* outline pill */}
      <div style={{ position: "absolute", left: 303, top: 1386, width: 474, height: 88, borderRadius: 999,
        opacity: Math.min(1, pill * 1.4), transform: `scale(${interpolate(pill, [0, 1], [0.92, 1])})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <svg width={474} height={88} style={{ position: "absolute", inset: 0 }}>
          <rect x={1} y={1} width={472} height={86} rx={43} fill="none" stroke="#5B6067" strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - border} />
        </svg>
        <span style={{ fontFamily: DMSANS, fontSize: 35, color: "#F1EEE6", fontVariationSettings: "'opsz' 14" }}>Book your clarity call</span>
        <span style={{ fontFamily: DMSANS, fontSize: 22, fontWeight: 300, color: GOLD, marginTop: 4, transform: `translateX(${arrow}px)` }}>→</span>
      </div>
      <div style={{ position: "absolute", top: 1497, width: "100%", textAlign: "center", fontFamily: DMSANS, fontSize: 32, color: "#9CA1A6", fontVariationSettings: "'opsz' 14", opacity: fade(64) }}>Link in bio</div>
      <div style={{ position: "absolute", top: 1633, width: "100%", textAlign: "center", fontFamily: DMSANS, fontSize: 27, color: "#7E848A", fontVariationSettings: "'opsz' 14", opacity: fade(72) }}>
        Need help right now? Tele-MANAS: 14416 or 1-800-891-4416 (Free 24×7)</div>
    </AbsoluteFill>
  );
};

// Small brand watermark, top centre (clear of Instagram's username bar and bottom buttons)
const Watermark: React.FC<{ light: boolean; first?: boolean }> = ({ light, first }) => {
  const f = useCurrentFrame();
  const ink = light ? DARK : STONE;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 150, opacity: 0.6 * (first ? interpolate(f, [25, 40], [0, 1], clamp) : 1), pointerEvents: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, filter: light ? "none" : "drop-shadow(0 1px 6px rgba(0,0,0,.6))" }}>
        <Logo size={44} hisColor={ink} mindColor={light ? "#8A5216" : GOLD} />
        <div style={{ width: 2, height: 34, background: ink, opacity: 0.5 }} />
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: ink, letterSpacing: "0.04em" }}>hismind.in</div>
      </div>
    </AbsoluteFill>
  );
};

// OpenMotion "Echo Stack Type": one word stamped in solid + outline rows, echoing, then collapsing to one
const Echo: React.FC<Extract<Scene, { type: "echo" }>> = ({ frames, lead, word }) => {
  const f = useCurrentFrame();
  const ROWS = 7, mid = 3, startStack = 18, collapseAt = frames - 30;
  const leadO = interpolate(f, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const collapse = interpolate(f, [collapseAt, collapseAt + 8], [1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: DARK }}>
      <div style={{ position: "absolute", top: 230, width: "100%", textAlign: "center", fontFamily: SERIF, fontWeight: 500, fontSize: 100, color: STONE, opacity: leadO * (0.4 + 0.6 * collapse) }}>{lead}</div>
      {Array.from({ length: ROWS }).map((_, i) => {
        const d = i - mid;
        const t = f - startStack - Math.abs(d) * 3;
        const o = interpolate(t, [0, 3], [0, 1], clamp);
        const settle = interpolate(t, [0, 6], [1.08, 1], clamp);
        const hero = d === 0;
        const y = 1010 + d * 180 * (hero ? 1 : collapse);
        const echoX = hero ? 0 : d * 14 * Math.sin((f - startStack) / 6);
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: y - 95, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontWeight: 500,
            fontSize: 190, lineHeight: "190px", transform: `translateX(${echoX}px) scale(${settle})`,
            opacity: hero ? o : o * collapse * (1 - Math.abs(d) * 0.12),
            color: hero || d % 2 === 0 ? STONE : "transparent", WebkitTextStroke: hero || d % 2 === 0 ? "0" : `2px ${STONE}` }}>{word}</div>
        );
      })}
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );
};

// OpenMotion "Smooth Wipes": a flat brand panel with a rounded leading edge sweeps across to reveal the scene
const Wipe: React.FC<{ dir: WipeDir }> = ({ dir }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 16], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  if (p >= 1) return null;
  const off = p * 115;
  const tf = dir === "up" ? `translateY(-${off}%)` : dir === "left" ? `translateX(-${off}%)` : `translateX(${off}%)`;
  const radius = dir === "up" ? "0 0 110px 110px" : dir === "left" ? "0 110px 110px 0" : "110px 0 0 110px";
  return <AbsoluteFill style={{ background: LIGHT, transform: tf, borderRadius: radius }} />;
};

const SceneView: React.FC<{ s: Scene }> = ({ s }) => {
  switch (s.type) {
    case "flicker": return <Flicker {...s} />;
    case "text": return <TextScene {...s} />;
    case "number": return <NumberScene {...s} />;
    case "punch": return <Punch {...s} />;
    case "logo": return <LogoReveal {...s} />;
    case "collage": return <Collage {...s} />;
    case "hold": return <Hold {...s} />;
    case "clips": return <Clips {...s} />;
    case "echo": return <Echo {...s} />;
    case "end": return <End {...s} />;
  }
};

// Sound effects that come automatically with certain effects
const autoSfx = (s: Scene): Sfx[] => {
  const out: Sfx[] = [];
  if (s.wipeIn) out.push({ file: "audio/sfx/whoosh.wav", at: 0, volume: 0.5 });
  if (s.type === "collage") s.items.forEach((_, i) => out.push({ file: "audio/sfx/whoosh.wav", at: Math.round(i * s.frames / s.items.length), volume: 0.35 }));
  if (s.type === "number" && s.count) out.push({ file: "audio/sfx/hit_low.wav", at: 32, volume: 0.9 });
  if (s.type === "punch") s.words.forEach((_, i) => out.push({ file: "audio/sfx/hit_low.wav", at: Math.round(i * s.frames / s.words.length), volume: 0.7 }));
  if ((s.type === "text" || s.type === "hold") && s.anim === "type") out.push({ file: "audio/sfx/typing.wav", at: 0, volume: 0.35 });
  if (s.type === "flicker") s.words.forEach((_, i) => out.push({ file: "audio/sfx/tick.wav", at: Math.round(i * s.frames / s.words.length), volume: 0.8 }));
  if (s.type === "end") out.push({ file: "audio/sfx/chime.wav", at: 2, volume: 0.35 });
  return out;
};

export const Reel: React.FC<{ data: ReelData }> = ({ data }) => {
  const { durationInFrames } = useVideoConfig();
  let from = 0;
  return (
    <AbsoluteFill style={{ background: DARK }}>
      {data.music && (
        <Audio src={src(data.music.file)} startFrom={data.music.startFrom ?? 0}
          volume={(f) => (data.music!.volume ?? 0.8) * interpolate(f, [0, 20, durationInFrames - 45, durationInFrames], [0, 1, 1, 0], clamp)} />
      )}
      {data.scenes.map((s, i) => {
        const sfx = [...autoSfx(s), ...(s.sfx ?? [])];
        const el = (
          <Sequence key={i} from={from} durationInFrames={s.frames}>
            <SceneView s={s} />
            {s.wipeIn && <Wipe dir={s.wipeIn} />}
            {s.type !== "end" && <Watermark first={i === 0} light={s.type === "collage" || (s.type === "text" && s.bg === "light" && !s.media)} />}
            {sfx.map((x, j) => <Sequence key={j} from={x.at ?? 0} layout="none"><Audio src={src(x.file)} volume={x.volume ?? 0.6} /></Sequence>)}
          </Sequence>
        );
        from += s.frames;
        return el;
      })}
    </AbsoluteFill>
  );
};

// shared pieces for the carousel
export { LogoReveal, End as EndCard, Logo, Watermark, Grain, SERIF, SANS, DMSANS, STONE, DARK, LIGHT, MUTED, AMBER, NAVY, GOLD, HALO };
