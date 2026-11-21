import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { EndCard, Watermark, Grain, SERIF, DMSANS, STONE, DARK, LIGHT, MUTED, AMBER, NAVY, GOLD, HALO } from "./Reel";

// Seamless Instagram carousel: one 8640×1350 canvas, cut into 8 slides of 1080×1350.
// Background, a gold thread and photos run across the joins, so swiping reads as one journey.
export const SW = 1080, SH = 1350, N = 8, PW = SW * N;
const x0 = (i: number) => (i - 1) * SW; // left edge of slide i
const INK_AMBER = "#8A5216";
const THREAD_Y = 1215;

const Slot: React.FC<{ i: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ i, children, style }) => (
  <div style={{ position: "absolute", left: x0(i), top: 0, width: SW, height: SH, ...style }}>{children}</div>
);
const Col: React.FC<{ children: React.ReactNode; gap?: number; top?: number }> = ({ children, gap = 28, top = 0 }) => (
  <div style={{ position: "absolute", inset: 0, top, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap, padding: "0 90px 140px" }}>{children}</div>
);
const serif = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ fontFamily: SERIF, fontWeight: 500, fontSize: size, lineHeight: 1.1, textAlign: "center", ...extra });

// A photo that spans a stretch of the canvas, fading out at its edges into the background
const Bleed: React.FC<{ file: string; left: number; width: number; fadeL?: number; fadeR?: number; dim?: number }> = ({ file, left, width, fadeL = 0, fadeR = 0, dim = 0.55 }) => {
  const l = (fadeL / width) * 100, r = 100 - (fadeR / width) * 100;
  const mask = `linear-gradient(to right, transparent 0%, #000 ${l}%, #000 ${r}%, transparent 100%)`;
  return (
    <div style={{ position: "absolute", left, top: 0, width, height: SH, WebkitMaskImage: mask, maskImage: mask }}>
      <Img src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `saturate(.7) contrast(1.06) sepia(.12) brightness(${dim})` }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 40% at 50% 48%, rgba(10,15,14,.6), rgba(10,15,14,0))" }} />
    </div>
  );
};

// A tilted print sitting across the join between two slides
const Print: React.FC<{ file: string; cx: number; top: number; w: number; h: number; rot: number }> = ({ file, cx, top, w, h, rot }) => (
  <Img src={staticFile(file)} style={{ position: "absolute", left: cx - w / 2, top, width: w, height: h, objectFit: "cover",
    border: "10px solid #FBF9F4", boxShadow: "0 18px 40px rgba(0,0,0,.35)", transform: `rotate(${rot}deg)`, filter: "saturate(.75) sepia(.1)" }} />
);

// The gold thread: one wavy line across slides 1–7, a numbered stop under each slide, ending where the CTA begins
const Thread: React.FC = () => {
  const end = x0(8) + 60;
  const pts: string[] = [`M 120 ${THREAD_Y}`];
  for (let x = 120; x < end; x += 270) {
    const y1 = THREAD_Y + (Math.floor(x / 270) % 2 === 0 ? -26 : 26);
    pts.push(`Q ${x + 135} ${y1} ${Math.min(x + 270, end)} ${THREAD_Y}`);
  }
  return (
    <svg width={PW} height={SH} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="thread" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={PW} y2={0}>
          <stop offset={0} stopColor={GOLD} stopOpacity={0.15} />
          <stop offset={0.08} stopColor={GOLD} />
          <stop offset={0.6} stopColor={GOLD} />
          <stop offset={0.645} stopColor={INK_AMBER} />
          <stop offset={0.735} stopColor={INK_AMBER} />
          <stop offset={0.78} stopColor={GOLD} />
          <stop offset={0.885} stopColor={GOLD} />
          <stop offset={0.9} stopColor={GOLD} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={pts.join(" ")} fill="none" stroke="url(#thread)" strokeWidth={3} strokeLinecap="round" />
      {Array.from({ length: 7 }).map((_, k) => {
        const i = k + 1, cx = x0(i) + SW / 2, light = i === 6;
        return (
          <g key={i}>
            <circle cx={cx} cy={THREAD_Y} r={13} fill={light ? LIGHT : DARK} stroke={light ? INK_AMBER : GOLD} strokeWidth={3} />
            <circle cx={cx} cy={THREAD_Y} r={5} fill={light ? INK_AMBER : GOLD} />
            <text x={cx} y={THREAD_Y + 62} textAnchor="middle" fontFamily="DM Sans" fontSize={26} letterSpacing="0.1em" fill={light ? "#5A6461" : MUTED}>{String(i).padStart(2, "0")}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const Panorama: React.FC = () => (
  <AbsoluteFill style={{ background: DARK, width: PW, height: SH }}>
    {/* background journey: deep green → photo → warm stone → navy */}
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${DARK} 0%, ${DARK} 59%, ${LIGHT} 62.5%, ${LIGHT} 72.5%, ${NAVY} 75%, ${NAVY} 100%)` }} />
    <Bleed file="img/in_traintravel.jpg" left={0} width={1500} fadeR={520} dim={0.6} />
    <Bleed file="img/site_ceo-window.jpg" left={x0(5) - 380} width={SW + 380} fadeL={420} fadeR={220} dim={0.5} />
    <div style={{ position: "absolute", left: x0(8), top: 0, width: SW, height: SH }}>
      <div style={{ position: "absolute", left: 0, top: -400, width: SW, height: 1920 }}><EndCard type="end" frames={150} title="HisMind" /></div>
    </div>
    <Grain opacity={0.08} />
    <Thread />

    {/* 1 cover */}
    <Slot i={1}><Col gap={20}>
      <div style={serif(140, { color: STONE, textShadow: HALO })}>Strong men</div>
      <div style={serif(150, { color: GOLD, fontStyle: "italic", textShadow: HALO })}>talk.</div>
      <div style={{ marginTop: 30, fontFamily: DMSANS, fontSize: 38, color: STONE, textShadow: HALO }}>International Men’s Day · 19 November</div>
    </Col>
      <div style={{ position: "absolute", right: 70, top: THREAD_Y - 22, fontFamily: DMSANS, fontSize: 30, color: STONE, letterSpacing: "0.08em", textShadow: HALO }}>SWIPE →</div></Slot>
    {/* 2 */}
    <Slot i={2}><Col gap={14}>
      {["Man up.", "Don’t cry.", "Be strong."].map((t) => <div key={t} style={{ fontFamily: DMSANS, fontWeight: 700, fontSize: 116, color: STONE, textTransform: "uppercase", lineHeight: 1.05 }}>{t}</div>)}
      <div style={serif(60, { color: MUTED, marginTop: 44, fontStyle: "italic" })}>He heard it his whole life.<br />So he learned to stay quiet.</div>
    </Col></Slot>
    {/* 3 */}
    <Slot i={3}><Col gap={26}>
      <div style={serif(220, { color: AMBER, fontVariantNumeric: "tabular-nums", lineHeight: 1 })}>1,25,449</div>
      <div style={serif(60, { color: STONE })}>Men in India died by<br />suicide in 2024.</div>
      <div style={serif(54, { color: MUTED, fontStyle: "italic" })}>Nearly 3 in every 4 suicides.</div>
      <div style={{ fontFamily: DMSANS, fontSize: 25, color: "#7E848A", marginTop: 14 }}>Source: NCRB, Accidental Deaths & Suicides in India 2024</div>
    </Col></Slot>
    {/* 4 */}
    <Slot i={4}><Col gap={20}>
      <div style={serif(360, { color: AMBER, lineHeight: 1 })}>343</div>
      <div style={serif(72, { color: STONE })}>Men, every day.</div>
    </Col></Slot>
    {/* 5 */}
    <Slot i={5}><Col gap={30}>
      <div style={serif(92, { color: STONE, textShadow: HALO })}>Men feel as much.</div>
      <div style={serif(92, { color: GOLD, fontStyle: "italic", textShadow: HALO })}>They say less.</div>
    </Col></Slot>
    {/* 6 signs */}
    <Slot i={6}><div style={{ position: "absolute", inset: 0, padding: "200px 100px 0" }}>
      <div style={serif(76, { color: DARK, textAlign: "left" })}>Signs he might be <span style={{ fontStyle: "italic", color: INK_AMBER }}>carrying something</span></div>
      <div style={{ marginTop: 52, display: "flex", flexDirection: "column", gap: 30 }}>
        {["Pulling away from friends and family", "Sleeping or eating a lot more, or less", "More drinking, anger or risk-taking", "“I’m fine” on repeat", "Talking about being a burden"].map((t) => (
          <div key={t} style={{ display: "flex", gap: 26, alignItems: "baseline", fontFamily: DMSANS, fontSize: 42, color: DARK, lineHeight: 1.25 }}><span style={{ color: INK_AMBER, fontFamily: SERIF, fontSize: 46 }}>—</span>{t}</div>))}
      </div></div></Slot>
    {/* 7 how to check in */}
    <Slot i={7}><div style={{ position: "absolute", inset: 0, padding: "200px 100px 0" }}>
      <div style={serif(76, { color: STONE, textAlign: "left" })}>How to check on him</div>
      <div style={{ marginTop: 52, display: "flex", flexDirection: "column", gap: 34 }}>
        {[["Call, don’t text.", "A voice is harder to brush off."], ["Ask twice.", "“How are you, really?”"], ["Listen longer than feels normal.", "Stay with him. Skip the fixing."], ["Point him to help.", "One call is enough to start."]].map(([a, b], k) => (
          <div key={a} style={{ display: "flex", gap: 30 }}><div style={serif(54, { color: GOLD, fontStyle: "italic", width: 50, textAlign: "left" })}>{k + 1}</div>
            <div><div style={{ fontFamily: DMSANS, fontSize: 44, color: STONE, fontWeight: 500 }}>{a}</div><div style={{ fontFamily: DMSANS, fontSize: 32, color: MUTED, marginTop: 6 }}>{b}</div></div></div>))}
      </div></div></Slot>

    {/* prints across the joins: you see part of the next slide before you swipe */}
    <Print file="img/in_chai.jpg" cx={x0(3)} top={935} w={330} h={230} rot={-4} />
    <Print file="img/in_localtrain.jpg" cx={x0(4)} top={105} w={290} h={190} rot={3} />
    <Print file="img/in_fatherson.jpg" cx={x0(8)} top={985} w={250} h={190} rot={-3} />

    {/* watermark on each content slide */}
    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
      <div key={i} style={{ position: "absolute", left: x0(i), top: -90, width: SW, height: SH }}><Watermark light={i === 6} /></div>
    ))}
  </AbsoluteFill>
);
