import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { EndCard, Watermark, Grain, SERIF, DMSANS, STONE, DARK, LIGHT, MUTED, AMBER, NAVY, GOLD, HALO } from "./Reel";

// Instagram carousel, 1080×1350 (4:5). One composition per slide, rendered as PNG stills.
const W = 1080, H = 1350;
const Photo: React.FC<{ file: string; dim?: number }> = ({ file, dim = 0.55 }) => (
  <AbsoluteFill>
    <Img src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `saturate(.7) contrast(1.06) sepia(.12) brightness(${dim})` }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 45% at 50% 55%, rgba(10,15,14,.65), rgba(10,15,14,0))" }} />
    <Grain opacity={0.18} />
  </AbsoluteFill>
);
const Pager: React.FC<{ n: number; light?: boolean }> = ({ n, light }) => (
  <div style={{ position: "absolute", bottom: 60, width: "100%", textAlign: "center", fontFamily: DMSANS, fontSize: 26, letterSpacing: "0.08em", color: light ? "#5A6461" : MUTED }}>
    {n} / 8{n === 1 ? "   ·   SWIPE →" : ""}</div>
);
const Mark: React.FC<{ light?: boolean }> = ({ light }) => (
  <div style={{ position: "absolute", inset: 0, transform: "translateY(-90px)" }}><Watermark light={!!light} /></div>
);
const serif = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ fontFamily: SERIF, fontWeight: 500, fontSize: size, lineHeight: 1.1, textAlign: "center", ...extra });
const Col: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 28 }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap, padding: "0 90px" }}>{children}</AbsoluteFill>
);

const slides: React.FC[] = [
  // 1 cover
  () => (<AbsoluteFill style={{ background: DARK }}><Photo file="img/in_traintravel.jpg" dim={0.6} /><Mark />
    <Col gap={20}><div style={serif(140, { color: STONE, textShadow: HALO })}>Strong men</div><div style={serif(150, { color: GOLD, fontStyle: "italic", textShadow: HALO })}>talk.</div>
      <div style={{ marginTop: 30, fontFamily: DMSANS, fontSize: 38, color: STONE, textShadow: HALO }}>International Men’s Day · 19 November</div></Col><Pager n={1} /></AbsoluteFill>),
  // 2 what he heard
  () => (<AbsoluteFill style={{ background: DARK }}><Grain opacity={0.08} /><Mark />
    <Col gap={14}>{["Man up.", "Don’t cry.", "Be strong."].map((t) => <div key={t} style={{ fontFamily: DMSANS, fontWeight: 700, fontSize: 120, color: STONE, textTransform: "uppercase", lineHeight: 1.05 }}>{t}</div>)}
      <div style={serif(64, { color: MUTED, marginTop: 50, fontStyle: "italic" })}>He heard it his whole life.<br />So he learned to stay quiet.</div></Col><Pager n={2} /></AbsoluteFill>),
  // 3 the number
  () => (<AbsoluteFill style={{ background: DARK }}><Grain opacity={0.08} /><Mark />
    <Col gap={30}><div style={serif(220, { color: AMBER, fontVariantNumeric: "tabular-nums", lineHeight: 1 })}>1,25,449</div>
      <div style={serif(60, { color: STONE })}>Men in India died by<br />suicide in 2024.</div>
      <div style={serif(56, { color: MUTED, fontStyle: "italic" })}>Nearly 3 in every 4 suicides.</div>
      <div style={{ fontFamily: DMSANS, fontSize: 26, color: "#7E848A", marginTop: 20 }}>Source: NCRB, Accidental Deaths & Suicides in India 2024</div></Col><Pager n={3} /></AbsoluteFill>),
  // 4 every day
  () => (<AbsoluteFill style={{ background: DARK }}><Grain opacity={0.08} /><Mark />
    <Col gap={20}><div style={serif(360, { color: AMBER, lineHeight: 1 })}>343</div><div style={serif(72, { color: STONE })}>Men, every day.</div></Col><Pager n={4} /></AbsoluteFill>),
  // 5 the why
  () => (<AbsoluteFill style={{ background: DARK }}><Photo file="img/site_ceo-window.jpg" dim={0.5} /><Mark />
    <Col gap={30}><div style={serif(92, { color: STONE, textShadow: HALO })}>Men feel as much.</div><div style={serif(92, { color: GOLD, fontStyle: "italic", textShadow: HALO })}>They say less.</div></Col><Pager n={5} /></AbsoluteFill>),
  // 6 signs
  () => (<AbsoluteFill style={{ background: LIGHT }}><Grain opacity={0.06} /><Mark light />
    <AbsoluteFill style={{ padding: "230px 100px 0" }}>
      <div style={serif(78, { color: DARK, textAlign: "left" })}>Signs he might be <span style={{ fontStyle: "italic", color: "#8A5216" }}>carrying something</span></div>
      <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 34 }}>
        {["Pulling away from friends and family", "Sleeping or eating a lot more, or less", "More drinking, anger or risk-taking", "“I’m fine” on repeat", "Talking about being a burden"].map((t) => (
          <div key={t} style={{ display: "flex", gap: 26, alignItems: "baseline", fontFamily: DMSANS, fontSize: 44, color: DARK, lineHeight: 1.25 }}><span style={{ color: "#8A5216", fontFamily: SERIF, fontSize: 48 }}>—</span>{t}</div>))}
      </div></AbsoluteFill><Pager n={6} light /></AbsoluteFill>),
  // 7 how to check in
  () => (<AbsoluteFill style={{ background: NAVY }}><AbsoluteFill style={{ background: "radial-gradient(circle 520px at 50% 40%, rgba(64,50,36,.8), rgba(21,25,32,0))" }} /><Mark />
    <AbsoluteFill style={{ padding: "230px 100px 0" }}>
      <div style={serif(78, { color: STONE, textAlign: "left" })}>How to check on him</div>
      <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 40 }}>
        {[["Call, don’t text.", "A voice is harder to brush off."], ["Ask twice.", "“How are you, really?”"], ["Listen longer than feels normal.", "Stay with him. Skip the fixing."], ["Point him to help.", "One call is enough to start."]].map(([a, b], i) => (
          <div key={a} style={{ display: "flex", gap: 30 }}><div style={serif(56, { color: GOLD, fontStyle: "italic", width: 50, textAlign: "left" })}>{i + 1}</div>
            <div><div style={{ fontFamily: DMSANS, fontSize: 46, color: STONE, fontWeight: 500 }}>{a}</div><div style={{ fontFamily: DMSANS, fontSize: 34, color: MUTED, marginTop: 6 }}>{b}</div></div></div>))}
      </div></AbsoluteFill><Pager n={7} /></AbsoluteFill>),
  // 8 CTA — the reel end card at its final frame, moved up to fit 4:5
  () => (<AbsoluteFill style={{ background: "#151920", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: -400, width: W, height: 1920 }}><EndCard type="end" frames={150} title="HisMind" /></div></AbsoluteFill>),
];

export const Slide: React.FC<{ n: number }> = ({ n }) => { const S = slides[n - 1]; return <S />; };
export const SLIDE_COUNT = slides.length;
export const SLIDE_W = W, SLIDE_H = H;
