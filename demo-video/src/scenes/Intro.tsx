import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";
import { interFontFamily } from "../loadFonts";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = interpolate(frame, [0, 0.7 * fps], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 200 }),
    output: "perceptual-scale",
  });

  const logoOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subOpacity = interpolate(
    frame,
    [0.7 * fps, 1.2 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const tagOpacity = interpolate(
    frame,
    [1.1 * fps, 1.6 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      name="Intro"
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: interFontFamily,
      }}
    >
      <Interactive.Div
        name="Logo"
        style={{
          scale: logoScale,
          opacity: logoOpacity,
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Img
          src={staticFile("Icon-only.png")}
          style={{
            width: 104,
            height: 104,
            borderRadius: 24,
            boxShadow: `0 0 35px ${COLORS.green}44`,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              color: COLORS.text,
              letterSpacing: -2,
            }}
          >
            GREENFIELD
          </div>
          <div
            style={{
              fontFamily: MONO_FAMILY,
              fontSize: 26,
              fontWeight: 800,
              color: COLORS.green,
              background: COLORS.greenChipBg,
              border: `1px solid ${COLORS.green}88`,
              borderRadius: 10,
              padding: "6px 16px",
              boxShadow: `0 0 16px ${COLORS.green}33`,
            }}
          >
            USDC
          </div>
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="Subtitle"
        style={{
          opacity: subOpacity,
          fontSize: 34,
          fontWeight: 600,
          color: COLORS.textBody,
          marginTop: 24,
          letterSpacing: -0.5,
        }}
      >
        Issue → PR → Merge → USDC
      </Interactive.Div>

      <Interactive.Div
        name="Tagline"
        style={{
          opacity: tagOpacity,
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 18,
          fontFamily: MONO_FAMILY,
          fontSize: 16,
          color: COLORS.green,
          background: `${COLORS.green}15`,
          border: `1px solid ${COLORS.green}44`,
          padding: "8px 20px",
          borderRadius: 999,
        }}
      >
        <span>●</span>
        <span>Escrow On-Chain Descentralizado na Solana</span>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
