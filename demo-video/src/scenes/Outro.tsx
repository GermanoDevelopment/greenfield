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

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 0.6 * fps], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 200 }),
    output: "perceptual-scale",
  });

  return (
    <AbsoluteFill
      name="Outro"
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: interFontFamily,
      }}
    >
      <Interactive.Div
        name="Message"
        style={{
          opacity,
          scale,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Img
            src={staticFile("Icon-only.png")}
            style={{ width: 72, height: 72, borderRadius: 18, boxShadow: `0 0 25px ${COLORS.green}55` }}
          />
          <div style={{ fontSize: 64, fontWeight: 900, color: COLORS.text, letterSpacing: -1 }}>
            GREENFIELD
          </div>
        </div>

        <div style={{ fontSize: 28, color: COLORS.textBody, fontWeight: 600 }}>
          Issue → PR → Merge → USDC
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 8,
          }}
        >
          {["Solana Anchor Escrow", "@solana/kit", "FastAPI Live", "React 19"].map((tech) => (
            <span
              key={tech}
              style={{
                fontFamily: MONO_FAMILY,
                fontSize: 13,
                color: COLORS.green,
                background: COLORS.panel,
                border: `1px solid ${COLORS.borderAlt}`,
                padding: "6px 14px",
                borderRadius: 8,
              }}
            >
              {tech}
            </span>
          ))}
        </div>

        <div
          style={{
            fontFamily: MONO_FAMILY,
            fontSize: 14,
            color: COLORS.textMuted,
            marginTop: 14,
          }}
        >
          github.com/GermanoDevelopment/greenfield
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
