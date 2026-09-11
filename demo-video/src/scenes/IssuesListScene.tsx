import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";
import { AppShell } from "./AppShell";

const ISSUES = [
  {
    number: 42,
    title: "Implementar validação off-chain de assinaturas Ed25519 em Solinpy",
    labels: ["bounty", "solana", "python", "security"],
    status: "OPEN",
  },
  {
    number: 45,
    title: "Adicionar suporte a simulação de transações v1 (SIMD-0385) no SDK",
    labels: ["bounty", "v1-tx", "devnet"],
    status: "ASSIGNED",
  },
  {
    number: 51,
    title: "Otimizar cálculo de Compute Units (CU) no CPI de Transferência SPL-Token",
    labels: ["enhancement", "compute-units", "solana"],
    status: "SUBMITTED",
  },
  {
    number: 54,
    title: "Criar documentação de integração do Greenfield com Solana Wallet Adapter",
    labels: ["documentation", "good-first-issue"],
    status: "COMPLETED",
  },
];

const STATUS_STYLE: Record<string, { bg: string; border: string; color: string; label: string }> = {
  OPEN: { bg: "#182618", border: `${COLORS.green}66`, color: COLORS.green, label: "✓ Aberto" },
  ASSIGNED: { bg: "rgba(120,53,15,0.4)", border: "rgba(146,64,14,0.6)", color: COLORS.amber300, label: "☻ Atribuído" },
  SUBMITTED: { bg: "rgba(12,74,110,0.4)", border: "rgba(7,89,133,0.6)", color: COLORS.sky300, label: "⏱ Em Revisão PR" },
  COMPLETED: { bg: "rgba(88,28,135,0.35)", border: "rgba(168,85,247,0.5)", color: "#D8B4FE", label: "✓ Concluído & Pago" },
};

export const IssuesListScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rowIn = (i: number) =>
    interpolate(frame, [(0.1 + i * 0.12) * fps, (0.4 + i * 0.12) * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const highlightStart = 3.4 * fps;
  const glow = interpolate(frame, [highlightStart, highlightStart + 0.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pressFrame = 4.2 * fps;
  const btnPress = interpolate(frame, [pressFrame, pressFrame + 6, pressFrame + 14], [1, 0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    output: "perceptual-scale",
  });

  return (
    <AppShell activeItem="Issues & Bounties" breadcrumb="ISSUES">
      <div style={{ marginBottom: 20, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 16 }}>
        <div style={{ fontFamily: MONO_FAMILY, fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>
          Repositórios / <span style={{ color: COLORS.greenLight }}>Issues &amp; Bounties</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, letterSpacing: -0.5 }}>
          Issues &amp; Bounties do Repositório
        </div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>
          Cada issue resolvida concede 120 pontos ao desenvolvedor após o merge do PR.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ISSUES.map((issue, i) => {
          const st = STATUS_STYLE[issue.status];
          const isTarget = issue.number === 42;
          return (
            <Interactive.Div
              key={issue.number}
              name={`Issue-${issue.number}`}
              style={{
                opacity: rowIn(i),
                background: COLORS.panel,
                border: `1px solid ${isTarget ? `${COLORS.green}${glow > 0.5 ? "AA" : "40"}` : COLORS.border}`,
                borderRadius: 16,
                padding: "16px 20px",
                boxShadow: isTarget ? `0 0 ${18 * glow}px ${COLORS.green}44` : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontFamily: MONO_FAMILY,
                        fontSize: 11,
                        fontWeight: 800,
                        color: COLORS.green,
                        background: "#192A17",
                        border: `1px solid ${COLORS.green}44`,
                        padding: "1px 7px",
                        borderRadius: 5,
                      }}
                    >
                      #{issue.number}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{issue.title}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {issue.labels.map((lbl) => (
                      <span
                        key={lbl}
                        style={{
                          fontFamily: MONO_FAMILY,
                          fontSize: 10,
                          color: "#9EAE9D",
                          background: "#1D241C",
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 5,
                          padding: "1px 7px",
                        }}
                      >
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>Recompensa</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: COLORS.green }}>120 pontos</div>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 6,
                      fontFamily: MONO_FAMILY,
                      fontSize: 10,
                      fontWeight: 700,
                      color: st.color,
                      background: st.bg,
                      border: `1px solid ${st.border}`,
                      borderRadius: 999,
                      padding: "3px 9px",
                    }}
                  >
                    {st.label}
                  </span>
                </div>
              </div>

              {isTarget && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}88`, display: "flex", justifyContent: "flex-end" }}>
                  <Interactive.Div
                    name="ApplyButton"
                    style={{
                      scale: btnPress,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 10,
                      background: frame > pressFrame ? COLORS.greenHover : COLORS.green,
                      color: "#101410",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    ➤ Candidatar-se (Apply)
                  </Interactive.Div>
                </div>
              )}
            </Interactive.Div>
          );
        })}
      </div>
    </AppShell>
  );
};
