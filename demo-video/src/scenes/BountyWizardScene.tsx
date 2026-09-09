import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";
import { PageShell } from "./PageShell";

const STEPS = [
  { number: "1", title: "Issue GitHub", desc: "Seleção do item de trabalho" },
  { number: "2", title: "Recompensa & Solvência", desc: "Cálculo de pontos e USDC" },
  { number: "3", title: "Escrow On-Chain", desc: "Bloqueio de fundos no contrato" },
];

export const BountyWizardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const step1End = 2.4 * fps;
  const step2End = 5.2 * fps;

  const activeStep = frame < step1End ? 0 : frame < step2End ? 1 : 2;

  const pointsStart = 0.3 * fps;
  const pointsEnd = 1.2 * fps;
  const points = Math.round(
    interpolate(frame, [step1End + pointsStart, step1End + pointsEnd], [0, 25000], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  const usdc = (points / 100).toFixed(2);

  const submitFrame = step2End + 1.4 * fps;
  const btnPress = interpolate(
    frame,
    [submitFrame, submitFrame + 6, submitFrame + 14],
    [1, 0.94, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale" },
  );
  const publishedOpacity = interpolate(
    frame,
    [submitFrame + 16, submitFrame + 28],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <PageShell activeTab="Nova Bounty">
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.text, letterSpacing: -0.5 }}>
              Nova Bounty On-Chain
            </div>
            <div style={{ fontSize: 15, color: COLORS.textMuted, marginTop: 4 }}>
              Vincule uma issue do GitHub a um escrow seguro financiado pelo Tesouro Comunitário
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: MONO_FAMILY,
              fontSize: 13,
              color: COLORS.green,
              background: COLORS.greenChipBg,
              border: `1px solid ${COLORS.green}44`,
              padding: "6px 14px",
              borderRadius: 8,
            }}
          >
            Tesouro Disponível: $50.000,00 USDC
          </div>
        </div>

        {/* Stepper Superior */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14,
            padding: "16px 28px",
            marginBottom: 28,
          }}
        >
          {STEPS.map((step, i) => {
            const isCompleted = i < activeStep;
            const isCurrent = i === activeStep;
            return (
              <React.Fragment key={step.title}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 15,
                      background: isCurrent || isCompleted ? COLORS.green : COLORS.border,
                      color: isCurrent || isCompleted ? "#0A140A" : COLORS.textMuted,
                      boxShadow: isCurrent ? `0 0 12px ${COLORS.green}88` : "none",
                    }}
                  >
                    {isCompleted ? "✓" : step.number}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: isCurrent ? COLORS.text : COLORS.textMuted,
                      }}
                    >
                      {step.title}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textFaint }}>{step.desc}</div>
                  </div>
                </div>

                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      margin: "0 24px",
                      background: i < activeStep ? COLORS.green : COLORS.border,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Container Principal do Card */}
        <div
          style={{
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: "36px 40px",
            minHeight: 430,
            boxShadow: "0 12px 36px rgba(0,0,0,0.3)",
          }}
        >
          {/* PASSO 1 */}
          {activeStep === 0 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>
                Passo 1: Selecionar Issue do Repositório
              </div>
              <Field label="Repositório GitHub Aprovado para a Rodada">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    background: COLORS.panelAlt,
                    padding: "16px 20px",
                    color: COLORS.text,
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  <span>acme / solana-wallet</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: COLORS.green,
                      background: `${COLORS.green}1F`,
                      border: `1px solid ${COLORS.green}44`,
                      padding: "4px 10px",
                      borderRadius: 6,
                    }}
                  >
                    ✓ Aprovado para Rodada
                  </span>
                </div>
              </Field>

              <Field label="Issue Aberta">
                <div
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    background: COLORS.panelAlt,
                    padding: "16px 20px",
                    color: COLORS.text,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <span style={{ fontFamily: MONO_FAMILY, color: COLORS.green, fontWeight: 700 }}>
                      #482
                    </span>
                    <span style={{ fontSize: 17, fontWeight: 600 }}>
                      Fix wallet balance not refreshing after swap
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <span
                      style={{
                        fontSize: 11,
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#F87171",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      bug
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        background: COLORS.panel,
                        color: COLORS.textMuted,
                        border: `1px solid ${COLORS.borderAlt}`,
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}
                    >
                      high-priority
                    </span>
                  </div>
                </div>
              </Field>
            </div>
          )}

          {/* PASSO 2 */}
          {activeStep === 1 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>
                Passo 2: Definição de Recompensa &amp; Verificação de Solvência
              </div>
              <Field label="Pontos da Recompensa (100 pts = $1.00 USDC)">
                <div
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    background: COLORS.panelAlt,
                    padding: "16px 20px",
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: MONO_FAMILY,
                    color: COLORS.text,
                  }}
                >
                  {points.toLocaleString("pt-BR")} pts
                </div>
              </Field>

              <div
                style={{
                  marginTop: 18,
                  background: COLORS.panelAlt,
                  border: `1px solid ${COLORS.borderAlt}`,
                  borderRadius: 14,
                  padding: "22px 28px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>
                    Garantia Bloqueada em Escrow On-Chain
                  </div>
                  <div
                    style={{
                      fontFamily: MONO_FAMILY,
                      fontSize: 42,
                      fontWeight: 800,
                      color: COLORS.text,
                      letterSpacing: -1,
                    }}
                  >
                    ${usdc} <span style={{ fontSize: 24, color: COLORS.green }}>USDC</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: COLORS.textMuted }}>Taxa de Intermediação</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.green, marginTop: 4 }}>
                    0% (Tesouro Comunitário)
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 14,
                  color: COLORS.green,
                  background: `${COLORS.green}14`,
                  border: `1px solid ${COLORS.green}44`,
                  borderRadius: 10,
                  padding: "12px 18px",
                  fontFamily: MONO_FAMILY,
                }}
              >
                <span>✓</span>
                <span>Invariante 4 Verificada: Tesouro possui saldo suficiente para cobrir o resgate.</span>
              </div>
            </div>
          )}

          {/* PASSO 3 */}
          {activeStep === 2 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>
                  Passo 3: Publicação On-Chain e Criação do Escrow
                </div>
                <div
                  style={{
                    fontFamily: MONO_FAMILY,
                    fontSize: 12,
                    fontWeight: 700,
                    color: COLORS.green,
                    background: COLORS.greenChipBg,
                    border: `1px solid ${COLORS.green}55`,
                    borderRadius: 6,
                    padding: "4px 10px",
                  }}
                >
                  Anchor Escrow Program
                </div>
              </div>

              <SummaryRow label="Repositório" value="acme / solana-wallet" />
              <SummaryRow label="Issue Alvo" value="#482 — Fix wallet balance not refreshing after swap" />
              <SummaryRow label="Valor em Escrow" value="$250.00 USDC" mono green />
              <SummaryRow label="PDA Derivado" value='[b"bounty", treasury, id]' mono />
              <SummaryRow label="Desenvolvedor" value="Atribuição aberta para a comunidade" />

              <Interactive.Div
                name="PublishButton"
                style={{
                  scale: btnPress,
                  marginTop: 26,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px 32px",
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.greenDark} 100%)`,
                  color: "#0A140A",
                  fontSize: 18,
                  fontWeight: 800,
                  boxShadow: `0 4px 20px ${COLORS.green}55`,
                }}
              >
                Publicar Bounty &amp; Bloquear $250 USDC On-Chain
              </Interactive.Div>

              <Interactive.Div
                name="PublishedBadge"
                style={{
                  opacity: publishedOpacity,
                  marginTop: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: `${COLORS.green}18`,
                  border: `1px solid ${COLORS.green}66`,
                  borderRadius: 10,
                  padding: "12px 18px",
                  fontSize: 15,
                  color: COLORS.green,
                  fontFamily: MONO_FAMILY,
                  width: "fit-content",
                }}
              >
                ✓ Bounty publicada com sucesso · $250.00 USDC bloqueados em PDA Escrow na Solana Devnet
              </Interactive.Div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 8, fontWeight: 500 }}>{label}</div>
    {children}
  </div>
);

const SummaryRow: React.FC<{ label: string; value: string; mono?: boolean; green?: boolean }> = ({
  label,
  value,
  mono,
  green,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: `1px solid ${COLORS.border}`,
      fontSize: 15,
    }}
  >
    <span style={{ color: COLORS.textMuted }}>{label}</span>
    <span
      style={{
        color: green ? COLORS.green : COLORS.text,
        fontWeight: 600,
        fontFamily: mono ? MONO_FAMILY : undefined,
      }}
    >
      {value}
    </span>
  </div>
);
