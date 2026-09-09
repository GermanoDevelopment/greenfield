import { AbsoluteFill, Composition } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { COLORS } from "./theme";
import { Intro } from "./scenes/Intro";
import { BountyWizardScene } from "./scenes/BountyWizardScene";
import { PRScene } from "./scenes/PRScene";
import { ClaimScene } from "./scenes/ClaimScene";
import { Outro } from "./scenes/Outro";
import { LandingScene } from "./scenes/LandingScene";
import { RepositoriesScene } from "./scenes/RepositoriesScene";
import { IssuesListScene } from "./scenes/IssuesListScene";
import { ApplyModalScene } from "./scenes/ApplyModalScene";
import { RewardsScene } from "./scenes/RewardsScene";

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

const introDuration2 = 2.5 * FPS;
const landingDuration = 4.5 * FPS;
const repositoriesDuration = 3.6 * FPS;
const issuesDuration = 5 * FPS;
const applyDuration = 6 * FPS;
const rewardsDuration = 6 * FPS;
const outroDuration2 = 3 * FPS;

const PLATFORM_TOTAL_DURATION =
  introDuration2 +
  landingDuration +
  repositoriesDuration +
  issuesDuration +
  applyDuration +
  rewardsDuration +
  outroDuration2 -
  6 * TRANSITION;

export const GreenfieldPlatformDemo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={introDuration2} name="Intro">
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={landingDuration} name="LandingScene">
          <LandingScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={repositoriesDuration} name="RepositoriesScene">
          <RepositoriesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={issuesDuration} name="IssuesListScene">
          <IssuesListScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={applyDuration} name="ApplyModalScene">
          <ApplyModalScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={rewardsDuration} name="RewardsScene">
          <RewardsScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={outroDuration2} name="Outro">
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="GreenfieldPlatformDemo"
        component={GreenfieldPlatformDemo}
        durationInFrames={PLATFORM_TOTAL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="GreenfieldDemo"
        component={GreenfieldDemo}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
