import { AbsoluteFill, Composition } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { COLORS } from "./theme";
import { Intro } from "./scenes/Intro";
import { BountyWizardScene } from "./scenes/BountyWizardScene";
import { PRScene } from "./scenes/PRScene";
import { ClaimScene } from "./scenes/ClaimScene";
import { Outro } from "./scenes/Outro";

const FPS = 30;
const TRANSITION = 15;

const introDuration = 2.5 * FPS;
const wizardDuration = 8.5 * FPS;
const prDuration = 7 * FPS;
const claimDuration = 6.5 * FPS;
const outroDuration = 3 * FPS;

const TOTAL_DURATION =
  introDuration + wizardDuration + prDuration + claimDuration + outroDuration - 4 * TRANSITION;

export const GreenfieldDemo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={introDuration} name="Intro">
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={wizardDuration} name="BountyWizardScene">
          <BountyWizardScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={prDuration} name="PRScene">
          <PRScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={claimDuration} name="ClaimScene">
          <ClaimScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={outroDuration} name="Outro">
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="GreenfieldDemo"
      component={GreenfieldDemo}
      durationInFrames={TOTAL_DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
