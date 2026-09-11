import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";
import { AppShell } from "./AppShell";

const PROPOSAL_TEXT =
  "Vou implementar a verificação de assinatura Ed25519 usando PyNaCl, validando o payload antes de enviar a transação ao cluster Devnet. Estimativa de entrega: 2 dias.";

export const ApplyModalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const modalOpacity = interpolate(frame, [0, 0.35 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const modalScale = interpolate(frame, [0, 0.45 * fps], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 200 }),
    output: "perceptual-scale",
  });

  // Digitando a proposta técnica
  const typeStart = 0.6 * fps;
  const typeEnd = 3.4 * fps;
  const typedChars = Math.round(
    interpolate(frame, [typeStart, typeEnd], [0, PROPOSAL_TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typedText = PROPOSAL_TEXT.slice(0, typedChars);
  const showCursor = frame < typeEnd && Math.floor(frame / 10) % 2 === 0;

  const confirmFrame = typeEnd + 0.5 * fps;
  const btnPress = interpolate(frame, [confirmFrame, confirmFrame + 6, confirmFrame + 14], [1, 0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    output: "perceptual-scale",
  });

  const successFrame = confirmFrame + 20;
  const isSuccess = frame >= successFrame;
  const successOpacity = interpolate(frame, [successFrame, successFrame + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AppShell activeItem="Issues & Bounties" breadcrumb="ISSUES">
      {/* Fundo: lista de issues levemente visível */}
      <div style={{ opacity: 0.35, filter: "blur(1px)" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text }}>
          Issues &amp; Bounties do Repositório
        </div>
        <div
          style={{
            marginTop: 16,
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: "16px 20px",
          }}
        >
          <span style={{ fontFamily: MONO_FAMILY, color: COLORS.green, fontWeight: 800 }}>#42</span>{" "}
          <span style={{ color: COLORS.text, fontWeight: 700 }}>
            Implementar validação off-chain de assinaturas Ed25519 em Solinpy
          </span>
        </div>
      </div>

      {/* Backdrop + Modal */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Interactive.Div
          name="ApplyModal"
          style={{
            opacity: modalOpacity,
            scale: modalScale,
            width: 660,
            background: COLORS.panel,
            border: `1px solid ${COLORS.green}55`,
            borderRadius: 20,
            padding: "30px 36px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
          }}
        >
          {!isSuccess ? (
            <>
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontSize: 11,
                  fontWeight: 800,
                  color: COLORS.green,
                  letterSpacing: 1,
                }}
              >
                CANDIDATURA DE TASK
              </span>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginTop: 6 }}>
                Candidatar-se à Issue #42
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                Implementar validação off-chain de assinaturas Ed25519 em Solinpy
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: COLORS.textBody, fontWeight: 600, marginBottom: 8 }}>
                  Proposta Técnica / Abordagem de Resolução:
                </div>
                <div
                  style={{
                    background: COLORS.headerBg,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    padding: 14,
                    minHeight: 92,
                    fontSize: 12.5,
                    color: COLORS.textBody,
                    lineHeight: 1.6,
                  }}
                >
                  {typedText}
                  {showCursor && <span style={{ color: COLORS.green }}>▏</span>}
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  background: COLORS.headerBg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 14,
                  padding: "12px 16px",
                  fontSize: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.textMuted }}>
                  <span>Recompensa Fixada:</span>
                  <span style={{ color: COLORS.green, fontWeight: 800 }}>120 pontos</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.textMuted, marginTop: 4 }}>
                  <span>Invariante:</span>
                  <span style={{ color: COLORS.textBody }}>Merge Obrigatório &amp; Recompensa Imutável</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 22 }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, padding: "10px 6px" }}>Cancelar</div>
                <Interactive.Div
                  name="ConfirmApplyButton"
                  style={{
                    scale: btnPress,
                    padding: "12px 22px",
                    borderRadius: 12,
                    background: COLORS.green,
                    color: "#101410",
                    fontWeight: 800,
                    fontSize: 12.5,
                    boxShadow: `0 6px 20px ${COLORS.green}44`,
                  }}
                >
                  {frame >= confirmFrame ? "Enviando Proposta..." : "Confirmar Candidatura"}
                </Interactive.Div>
              </div>
            </>
          ) : (
            <Interactive.Div
              name="SuccessBanner"
              style={{
                opacity: successOpacity,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 999,
                  background: `${COLORS.green}22`,
                  border: `2px solid ${COLORS.green}`,
                  color: COLORS.green,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 16,
                  boxShadow: `0 0 20px ${COLORS.green}55`,
                }}
              >
                ✓
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                Candidatura enviada com sucesso para a Issue #42!
              </div>
              <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginTop: 8, maxWidth: 440 }}>
                O mantenedor irá revisar sua proposta técnica. Assim que for aceita, a issue é
                atribuída oficialmente a você via GitHub API.
              </div>
            </Interactive.Div>
          )}
        </Interactive.Div>
      </div>
    </AppShell>
  );
};
