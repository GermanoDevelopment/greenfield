import React from "react";
import { AbsoluteFill, Easing, Img, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";
import { interFontFamily } from "../loadFonts";

const STEPS = [
  {
    num: "01",
    title: "Issue & Recompensa",
    desc: "O mantenedor seleciona a issue no GitHub e define a pontuação garantida com liquidez em USDC.",
  },
  {
    num: "02",
    title: "Merge do Pull Request",
    desc: "O desenvolvedor submete a solução. O resgate só é liberado após o merge definitivo do código.",
  },
  {
    num: "03",
    title: "Resgate Instantâneo",
    desc: "Com um clique, a carteira Solana assina a transação e recebe o USDC direto on-chain.",
  },
];

export const LandingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = (start: number, dur = 0.4) =>
    interpolate(frame, [start * fps, (start + dur) * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const riseIn = (start: number, dur = 0.5) =>
    interpolate(frame, [start * fps, (start + dur) * fps], [16, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: interFontFamily,
        color: COLORS.textBody,
      }}
    >
      {/* Top nav (público) */}
      <div
        style={{
          height: 72,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Img src={staticFile("Icon-only.png")} style={{ width: 32, height: 32, borderRadius: 8 }} />
          <span style={{ fontWeight: 900, fontSize: 18, color: COLORS.text }}>
            GREEN<span style={{ color: COLORS.green }}>FIELD</span>
          </span>
        </div>
        <div style={{ fontFamily: MONO_FAMILY, fontSize: 12, color: COLORS.textMuted }}>
          github.com/GermanoDevelopment/greenfield
        </div>
      </div>

      <div style={{ flex: 1, padding: "56px 80px", display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
        {/* Hero */}
        <Interactive.Div
          name="HeroBadge"
          style={{
            opacity: fadeIn(0.1),
            transform: `translateY(${riseIn(0.1)}px)`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 18px",
            borderRadius: 999,
            background: COLORS.panel,
            border: `1px solid ${COLORS.green}55`,
            color: COLORS.green,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ⚡ Bounties Open-Source com liquidação instantânea na Solana
        </Interactive.Div>

        <div style={{ textAlign: "center", maxWidth: 900 }}>
          <Interactive.Div
            name="Headline"
            style={{
              opacity: fadeIn(0.25),
              transform: `translateY(${riseIn(0.25)}px)`,
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: -1.5,
              color: COLORS.text,
              lineHeight: 1.1,
            }}
          >
            Contribuição no GitHub.{" "}
            <span style={{ color: COLORS.green }}>USDC na Solana.</span>
          </Interactive.Div>
          <Interactive.Div
            name="Subheadline"
            style={{
              opacity: fadeIn(0.45),
              transform: `translateY(${riseIn(0.45)}px)`,
              fontSize: 20,
              color: COLORS.textMuted,
              marginTop: 20,
              maxWidth: 640,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.5,
            }}
          >
            Transforme Pull Requests aprovados em recompensas financeiras diretas na sua
            carteira. Sem custódia, 100% on-chain.
          </Interactive.Div>
        </div>

        <Interactive.Div
          name="CTAs"
          style={{
            opacity: fadeIn(0.65),
            transform: `translateY(${riseIn(0.65)}px)`,
            display: "flex",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: "16px 32px",
              borderRadius: 12,
              background: COLORS.green,
              color: "#0A140A",
              fontWeight: 800,
              fontSize: 16,
              boxShadow: `0 8px 24px ${COLORS.green}44`,
            }}
          >
            Entrar como Mantenedor
          </div>
          <div
            style={{
              padding: "16px 32px",
              borderRadius: 12,
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.text,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Entrar como Desenvolvedor
          </div>
        </Interactive.Div>

        {/* Steps */}
        <div style={{ display: "flex", gap: 20, marginTop: 12, width: "100%", maxWidth: 1080 }}>
          {STEPS.map((step, i) => (
            <Interactive.Div
              key={step.num}
              name={`Step${step.num}`}
              style={{
                opacity: fadeIn(0.85 + i * 0.15),
                transform: `translateY(${riseIn(0.85 + i * 0.15)}px)`,
                flex: 1,
                background: COLORS.panel,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 18,
                padding: "24px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: COLORS.panelAlt,
                    border: `1px solid ${COLORS.borderAlt}`,
                  }}
                />
                <span style={{ fontFamily: MONO_FAMILY, fontSize: 26, fontWeight: 900, color: "#334231" }}>
                  {step.num}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text }}>{step.title}</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 6, lineHeight: 1.5 }}>
                  {step.desc}
                </div>
              </div>
            </Interactive.Div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
