import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";
import { PageShell } from "./PageShell";

type Phase = "assigned" | "prOpen" | "merged" | "claimable";

export const PRScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t1 = 1.8 * fps;
  const t2 = 3.8 * fps;
  const t3 = 5.2 * fps;

  const phase: Phase =
    frame < t1 ? "assigned" : frame < t2 ? "prOpen" : frame < t3 ? "merged" : "claimable";

  const btnPress = (at: number) =>
    interpolate(frame, [at, at + 6, at + 14], [1, 0.94, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      output: "perceptual-scale",
    });

  const steps = [
    { label: "1. Aberta", status: "completed" },
    { label: "2. Atribuída", status: "completed" },
    {
      label: "3. PR Aberto",
      status: phase === "assigned" ? "pending" : "completed",
    },
    {
      label: "4. Merge Aprovado",
      status: phase === "assigned" || phase === "prOpen" ? "pending" : "completed",
    },
    {
      label: "5. Resgate Liberado",
      status: phase === "merged" || phase === "claimable" ? "active" : "pending",
    },
  ];

  return (
    <PageShell activeTab="Dashboard" walletConnected>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Detalhes da Issue */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <span style={{ fontFamily: MONO_FAMILY, color: COLORS.green, fontSize: 18, fontWeight: 700 }}>
                #482
              </span>
              <span style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, letterSpacing: -0.5 }}>
                Fix wallet balance not refreshing after swap
              </span>
            </div>
            <div style={{ fontSize: 15, color: COLORS.textMuted }}>
              acme / solana-wallet · Desenvolvedor Atribuído:{" "}
              <span style={{ fontFamily: MONO_FAMILY, color: COLORS.green }}>mAr1a...9xQk</span>
            </div>
          </div>

          <div
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.borderAlt}`,
              borderRadius: 12,
              padding: "10px 18px",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>Escrow Bloqueado</div>
            <div style={{ fontFamily: MONO_FAMILY, fontSize: 22, fontWeight: 800, color: COLORS.green }}>
              $250.00 USDC
            </div>
          </div>
        </div>

        {/* Máquina de Estados da Bounty (Stepper da Aplicação) */}
        <div
          style={{
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: COLORS.textMuted }}>
              Máquina de Estados da Bounty · Ciclo de Vida On-Chain
            </span>
            <span style={{ fontFamily: MONO_FAMILY, fontSize: 12, color: COLORS.green }}>
              Status:{" "}
              <strong>
                {phase === "assigned"
                  ? "ASSIGNED"
                  : phase === "prOpen"
                  ? "PR_OPEN"
                  : phase === "merged"
                  ? "MERGED"
                  : "CLAIMABLE"}
              </strong>
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {steps.map((step) => {
              const isDone = step.status === "completed";
              const isActive = step.status === "active";
              return (
                <div
                  key={step.label}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${
                      isActive ? COLORS.green : isDone ? `${COLORS.green}55` : COLORS.borderAlt
                    }`,
                    background: isActive
                      ? `${COLORS.green}22`
                      : isDone
                      ? `${COLORS.green}10`
                      : COLORS.panelAlt,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: isDone || isActive ? COLORS.green : COLORS.textFaint,
                      fontWeight: 700,
                    }}
                  >
                    {isDone ? "✓" : isActive ? "●" : "○"}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isDone || isActive ? COLORS.text : COLORS.textMuted,
                      fontFamily: MONO_FAMILY,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card do Pull Request no GitHub */}
        <div
          style={{
            background: COLORS.panelAlt,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14,
            padding: "24px 28px",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>
            Pull Request Vinculado no GitHub
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontFamily: MONO_FAMILY, fontSize: 17, color: COLORS.text, fontWeight: 600 }}>
                #97 Refresh balance after swap confirmation
              </span>
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background:
                    phase === "assigned"
                      ? COLORS.panel
                      : phase === "prOpen"
                      ? "rgba(125, 211, 252, 0.15)"
                      : `${COLORS.green}22`,
                  color:
                    phase === "assigned"
                      ? COLORS.textMuted
                      : phase === "prOpen"
                      ? "#38BDF8"
                      : COLORS.green,
                  border: `1px solid ${
                    phase === "assigned"
                      ? COLORS.border
                      : phase === "prOpen"
                      ? "rgba(125, 211, 252, 0.4)"
                      : `${COLORS.green}55`
                  }`,
                }}
              >
                {phase === "assigned"
                  ? "AGUARDANDO PR"
                  : phase === "prOpen"
                  ? "PR OPEN / IN REVIEW"
                  : "MERGED & APPROVED"}
              </span>
            </div>
            <span style={{ fontSize: 13, color: COLORS.textMuted, fontFamily: MONO_FAMILY }}>
              Branch: feat/balance-refresh
            </span>
          </div>
        </div>

        {/* Painel Interativo de Ações */}
        <div
          style={{
            border: `1px solid ${COLORS.green}44`,
            borderRadius: 16,
            padding: "28px 32px",
            background: COLORS.panel,
          }}
        >
          <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 16 }}>
            Ações do Ciclo de Vida (Simulação Automatizada)
          </div>

          {phase === "assigned" && (
            <Interactive.Div
              name="OpenPrButton"
              style={{
                scale: btnPress(t1 - 20),
                display: "inline-flex",
                padding: "16px 30px",
                borderRadius: 12,
                background: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.greenDark} 100%)`,
                color: "#0A140A",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              Simular Abertura de PR no GitHub pelo Desenvolvedor
            </Interactive.Div>
          )}

          {phase === "prOpen" && (
            <Interactive.Div
              name="MergeButton"
              style={{
                scale: btnPress(t2 - 20),
                display: "inline-flex",
                padding: "16px 30px",
                borderRadius: 12,
                background: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.greenDark} 100%)`,
                color: "#0A140A",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              Aprovar &amp; Efetuar Merge do PR (Mantenedor)
            </Interactive.Div>
          )}

          {(phase === "merged" || phase === "claimable") && (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Interactive.Div
                name="ClaimButton"
                style={{
                  scale: phase === "claimable" ? btnPress(t3 - 20) : 1,
                  display: "inline-flex",
                  padding: "18px 36px",
                  borderRadius: 12,
                  background: COLORS.green,
                  color: "#0A140A",
                  fontWeight: 900,
                  fontSize: 20,
                  boxShadow: `0 0 25px ${COLORS.green}66`,
                }}
              >
                REIVINDICAR $250.00 USDC
              </Interactive.Div>
              <div style={{ fontSize: 14, color: COLORS.green, fontFamily: MONO_FAMILY }}>
                ✓ Invariante 3 Verificada: Merge aprovado no repositório. Resgate liberado para o desenvolvedor!
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};
