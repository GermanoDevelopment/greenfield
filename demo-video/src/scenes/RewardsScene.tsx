import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";
import { AppShell } from "./AppShell";

const REWARDS = [
  {
    number: 54,
    title: "Criar documentação de integração do Greenfield com Solana Wallet Adapter",
    paidAt: "08/09/2026",
    tx: "5K2bM7q4C3pW6hS2aK1g8V9rXyZ3wT6uN4jH8kL9vP2bM7q4...",
  },
  {
    number: 39,
    title: "Adicionar typings para transações v1 no cliente RPC Python",
    paidAt: "06/09/2026",
    tx: "3Z9aK1g8V9rXyZ3wT6uN4jH8kL9vP2bM7q4C3pW6hS2aK1g8V9r...",
  },
];

export const RewardsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = (start: number, dur = 0.4) =>
    interpolate(frame, [start * fps, (start + dur) * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const totalPoints = interpolate(frame, [0.4 * fps, 1.4 * fps], [0, 240], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const finalPulse = interpolate(frame, [3.6 * fps, 4 * fps, 4.4 * fps], [1, 1.02, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    output: "perceptual-scale",
  });

  return (
    <AppShell activeItem="Minhas Rewards" breadcrumb="REWARDS">
      <div style={{ marginBottom: 20, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, letterSpacing: -0.5 }}>
          Minhas Recompensas (Rewards)
        </div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>
          Histórico de tarefas concluídas e pontos conquistados por contribuições aprovadas.
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 16, marginBottom: 22 }}>
        <MetricCard
          opacity={fadeIn(0.1)}
          label="Pontuação Total"
          value={`${Math.round(totalPoints).toLocaleString("pt-BR")} pts`}
          caption="Conquistados por contribuições aprovadas e mergeadas"
          accent
        />
        <MetricCard opacity={fadeIn(0.2)} label="Tasks Concluídas" value="2" caption="PRs revisados, aprovados e mergeados" />
        <MetricCard opacity={fadeIn(0.3)} label="Média por Task" value="120 pts" caption="Pontuação média conquistada por task concluída" />
      </div>

      {/* Rewards list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {REWARDS.map((r, i) => {
          const isLast = i === 0;
          return (
            <Interactive.Div
              key={r.number}
              name={`Reward-${r.number}`}
              style={{
                opacity: fadeIn(0.5 + i * 0.25),
                scale: isLast ? finalPulse : 1,
                background: COLORS.panel,
                border: `1px solid ${isLast ? `${COLORS.green}88` : COLORS.border}`,
                borderRadius: 16,
                padding: "18px 22px",
                boxShadow: isLast ? `0 0 22px ${COLORS.green}33` : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
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
                      #{r.number}
                    </span>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.text }}>{r.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>
                    Pago em: <strong style={{ color: COLORS.textBody }}>{r.paidAt}</strong> · PR Mergeado ↗
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.green }}>+120 pontos</div>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 6,
                      fontFamily: MONO_FAMILY,
                      fontSize: 10,
                      color: COLORS.green,
                      background: "#182618",
                      border: `1px solid ${COLORS.green}44`,
                      borderRadius: 999,
                      padding: "3px 9px",
                    }}
                  >
                    ✓ Confirmado via Devnet
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: `1px solid ${COLORS.border}88`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 11,
                }}
              >
                <span style={{ fontFamily: MONO_FAMILY, color: COLORS.textMuted }}>
                  Tx: <span style={{ color: COLORS.textBody }}>{r.tx}</span>
                </span>
                <span style={{ fontFamily: MONO_FAMILY, fontWeight: 700, color: COLORS.green }}>
                  Ver no Solana Explorer ↗
                </span>
              </div>
            </Interactive.Div>
          );
        })}
      </div>

      {/* Finalização do ciclo */}
      <Interactive.Div
        name="CycleComplete"
        style={{
          opacity: fadeIn(4.6),
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: MONO_FAMILY,
          fontSize: 13,
          color: COLORS.green,
          background: `${COLORS.green}14`,
          border: `1px solid ${COLORS.green}44`,
          borderRadius: 12,
          padding: "12px 18px",
          width: "fit-content",
        }}
      >
        ✓ Ciclo completo: Issue → PR → Merge → USDC liquidado na wallet Solana.
      </Interactive.Div>
    </AppShell>
  );
};

const MetricCard: React.FC<{ opacity: number; label: string; value: string; caption: string; accent?: boolean }> = ({
  opacity,
  label,
  value,
  caption,
  accent,
}) => (
  <div
    style={{
      opacity,
      flex: 1,
      background: COLORS.panel,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 18,
      padding: "18px 20px",
    }}
  >
    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 900, color: accent ? COLORS.green : COLORS.text, marginTop: 6 }}>{value}</div>
    <div style={{ fontSize: 10.5, color: COLORS.textFaint, marginTop: 4 }}>{caption}</div>
  </div>
);
