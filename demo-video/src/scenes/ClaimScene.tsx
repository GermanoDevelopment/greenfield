import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";
import { PageShell } from "./PageShell";

export const ClaimScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const modalOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const modalScale = interpolate(frame, [0, 0.5 * fps], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 200 }),
    output: "perceptual-scale",
  });

  const claimFrame = 0.9 * fps;
  const btnPress = interpolate(
    frame,
    [claimFrame, claimFrame + 6, claimFrame + 14],
    [1, 0.94, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale" },
  );

  const signFrame = claimFrame + 18;
  const isSigning = frame >= signFrame && frame < signFrame + 50;

  const successFrame = signFrame + 50;
  const isSuccess = frame >= successFrame;
  const successOpacity = interpolate(frame, [successFrame, successFrame + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <PageShell activeTab="Dashboard" walletConnected>
      {/* Fundo escurecido do Modal */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Interactive.Div
          name="ClaimModal"
          style={{
            opacity: modalOpacity,
            scale: modalScale,
            width: 760,
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: "36px 44px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          }}
        >
          {/* Header do Modal */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text, letterSpacing: -0.5 }}>
              ✨ Resgate de Recompensa (Claim USDC)
            </div>
            <div style={{ color: COLORS.textMuted, fontSize: 20, cursor: "pointer" }}>✕</div>
          </div>

          {!isSuccess ? (
            <div>
              {/* Box de Informações da Bounty */}
              <div
                style={{
                  background: COLORS.panelAlt,
                  border: `1px solid ${COLORS.borderAlt}`,
                  borderRadius: 14,
                  padding: "24px 28px",
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 6 }}>
                  #482 Fix wallet balance not refreshing after swap
                </div>
                <div
                  style={{
                    fontFamily: MONO_FAMILY,
                    fontSize: 44,
                    fontWeight: 800,
                    color: COLORS.text,
                    letterSpacing: -1,
                  }}
                >
                  $250.00 <span style={{ fontSize: 24, color: COLORS.green }}>USDC</span>
                </div>
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: MONO_FAMILY,
                    fontSize: 13,
                    color: COLORS.greenLight,
                    background: COLORS.panel,
                    border: `1px solid ${COLORS.borderAlt}`,
                    borderRadius: 999,
                    padding: "6px 14px",
                    width: "fit-content",
                  }}
                >
                  <span style={{ color: COLORS.textMuted }}>Destino Solana Devnet:</span>
                  <span style={{ color: COLORS.green, fontWeight: 700 }}>mAr1a...9xQk</span>
                </div>
              </div>

              {/* Tag de Invariante */}
              <div
                style={{
                  fontSize: 13,
                  color: COLORS.greenLight,
                  background: `${COLORS.green}14`,
                  border: `1px solid ${COLORS.green}33`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: MONO_FAMILY,
                }}
              >
                <span>🛡️</span>
                <span>Invariante 3: Pagamento liberado após merge verificado e aprovado on-chain.</span>
              </div>

              {/* Botão de Assinatura ou Spinner */}
              {!isSigning ? (
                <Interactive.Div
                  name="SignButton"
                  style={{
                    scale: btnPress,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "18px 0",
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.greenDark} 100%)`,
                    color: "#0A140A",
                    fontWeight: 800,
                    fontSize: 19,
                    boxShadow: `0 6px 24px ${COLORS.green}44`,
                  }}
                >
                  Assinar na Wallet &amp; Resgatar $250 USDC
                </Interactive.Div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14,
                    padding: "18px 0",
                    borderRadius: 12,
                    background: COLORS.panelAlt,
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: MONO_FAMILY,
                    fontSize: 16,
                    color: COLORS.green,
                  }}
                >
                  <Spinner frame={frame} />
                  <span>Aguardando assinatura da transação via @solana/kit...</span>
                </div>
              )}
            </div>
          ) : (
            /* Estado de Sucesso */
            <Interactive.Div
              name="SuccessState"
              style={{
                opacity: successOpacity,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 999,
                  background: `${COLORS.green}22`,
                  border: `2px solid ${COLORS.green}`,
                  color: COLORS.green,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: 900,
                  marginBottom: 18,
                  boxShadow: `0 0 20px ${COLORS.green}55`,
                }}
              >
                ✓
              </div>

              <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.text, marginBottom: 6 }}>
                $250.00 USDC Resgatado com Sucesso!
              </div>
              <div style={{ fontSize: 14, color: COLORS.textMuted, maxWidth: 520, marginBottom: 24 }}>
                A transação foi confirmada e liquidada diretamente na rede Solana Devnet para a sua carteira.
              </div>

              <div
                style={{
                  width: "100%",
                  background: COLORS.panelAlt,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: "18px 22px",
                  fontSize: 13,
                  fontFamily: MONO_FAMILY,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.textMuted }}>Status da Transação:</span>
                  <span style={{ color: COLORS.green, fontWeight: 700 }}>Confirmada (Finalized)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.textMuted }}>Assinatura On-Chain:</span>
                  <span style={{ color: COLORS.text }}>4h9Zk7p...9xQktXn2</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.textMuted }}>Escrow Account:</span>
                  <span style={{ color: COLORS.green }}>Fechada · Rent devolvido</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  fontSize: 13,
                  color: COLORS.green,
                  fontFamily: MONO_FAMILY,
                }}
              >
                Ver comprovante no Solana Explorer ↗
              </div>
            </Interactive.Div>
          )}
        </Interactive.Div>
      </div>
    </PageShell>
  );
};

const Spinner: React.FC<{ frame: number }> = ({ frame }) => (
  <div
    style={{
      width: 20,
      height: 20,
      borderRadius: 999,
      border: `3px solid ${COLORS.border}`,
      borderTopColor: COLORS.green,
      rotate: `${(frame * 20) % 360}deg`,
    }}
  />
);
