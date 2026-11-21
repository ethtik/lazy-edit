import { Composition } from "remotion";
import { Reel, reelDuration, ReelData } from "./Reel";
import t1 from "../reels/trial-1-dear-men.json";
import t2 from "../reels/trial-2-we-say-fine.json";
import t3 from "../reels/trial-3-editorial.json";
import launch from "../reels/launch.json";
import { SquareReel, sqFrames, SqData } from "./Square";
import sq_comeback from "../reels/sq-comeback.json";
import sq_faking from "../reels/sq-faking.json";
import sq_signs from "../reels/sq-signs.json";
import sq_checkin from "../reels/sq-checkin.json";
import { VoReel, voDuration, VoSquare, VoSquareTall, VoShortTall, shortDuration, ViratCover, sqDuration } from "./VoReel";
import { Slide, SLIDE_COUNT, SLIDE_W, SLIDE_H } from "./Carousel";
import { Panorama, PW, SH } from "./Panorama";

const reels: [string, ReelData][] = [
  ["Trial1-DearMen", t1 as unknown as ReelData],
  ["Trial2-WeSayFine", t2 as unknown as ReelData],
  ["Trial3-Editorial", t3 as unknown as ReelData],
  ["Launch", launch as unknown as ReelData],
];

export const Root = () => (
  <>
    {reels.map(([id, data]) => (
      <Composition key={id} id={id} component={Reel} width={1080} height={1920} fps={30}
        durationInFrames={reelDuration(data)} defaultProps={{ data }} />
    ))}
    {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
      <Composition key={`s${i}`} id={`Carousel-${i + 1}`} component={Slide} width={SLIDE_W} height={SLIDE_H} fps={30} durationInFrames={i + 1 === SLIDE_COUNT ? 150 : 1} defaultProps={{ n: i + 1 }} />
    ))}
    <Composition id="Sq-comeback" component={SquareReel} defaultProps={{ d: sq_comeback as unknown as SqData }} width={1080} height={1920} fps={30} durationInFrames={sqFrames(sq_comeback as unknown as SqData)} />
    <Composition id="Sq-faking" component={SquareReel} defaultProps={{ d: sq_faking as unknown as SqData }} width={1080} height={1920} fps={30} durationInFrames={sqFrames(sq_faking as unknown as SqData)} />
    <Composition id="Sq-signs" component={SquareReel} defaultProps={{ d: sq_signs as unknown as SqData }} width={1080} height={1920} fps={30} durationInFrames={sqFrames(sq_signs as unknown as SqData)} />
    <Composition id="Sq-checkin" component={SquareReel} defaultProps={{ d: sq_checkin as unknown as SqData }} width={1080} height={1920} fps={30} durationInFrames={sqFrames(sq_checkin as unknown as SqData)} />
    <Composition id="Virat-Square-916" component={VoSquareTall} width={1080} height={1920} fps={30} durationInFrames={sqDuration} />
    <Composition id="Virat-Short-916" component={VoShortTall} width={1080} height={1920} fps={30} durationInFrames={shortDuration} />
    <Composition id="Virat-Cover" component={ViratCover} width={1080} height={1920} fps={30} durationInFrames={1} />
    <Composition id="Virat-Square" component={VoSquare} width={1080} height={1080} fps={30} durationInFrames={sqDuration} />
    <Composition id="Virat-Talk" component={VoReel} width={1080} height={1920} fps={30} durationInFrames={voDuration} />
      <Composition id="Carousel-Panorama" component={Panorama} width={PW} height={SH} fps={30} durationInFrames={150} />
  </>
);
