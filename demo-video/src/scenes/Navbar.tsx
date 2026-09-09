import React from "react";
import { Img, staticFile } from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";

const TABS = ["Dashboard", "Nova Bounty", "Histórico", "Configurações"];

export const Navbar: React.FC<{ activeTab?: string; walletConnected?: boolean }> = ({
  activeTab = "Dashboard",
  walletConnected = true,
}) => {
  return (
    <div
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
        background: `${COLORS.headerBg}F8`,
      }}
    >
      {/* Linha Superior: Logo, Status da Rede, API Status, Alternador de Perfis e Carteira */}
      <div
        style={{
          height: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Img
            src={staticFile("Icon-only.png")}
            style={{ width: 40, height: 40, borderRadius: 12, objectFit: "contain" }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: 22,
                  color: COLORS.text,
                  letterSpacing: -0.5,
                }}
              >
                GREENFIELD
              </span>
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontSize: 11,
                  fontWeight: 800,
                  color: COLORS.green,
                  background: COLORS.greenChipBg,
                  border: `1px solid ${COLORS.green}66`,
                  borderRadius: 6,
                  padding: "2px 8px",
                }}
              >
                USDC
              </span>
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: 500 }}>
              Issue → PR → Merge → USDC
            </div>
          </div>

          {/* Status Solana Devnet */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: COLORS.panel,
              border: `1px solid ${COLORS.borderAlt}`,
              borderRadius: 999,
              padding: "6px 14px",
              marginLeft: 20,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: COLORS.green,
                boxShadow: `0 0 10px ${COLORS.green}`,
              }}
            />
            <span style={{ fontSize: 12, color: COLORS.green, fontWeight: 600, fontFamily: MONO_FAMILY }}>
              Solana Devnet
            </span>
          </div>

          {/* Status Backend API Live */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: COLORS.panel,
              border: `1px solid ${COLORS.borderAlt}`,
              borderRadius: 999,
              padding: "6px 14px",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: COLORS.green,
              }}
            />
            <span style={{ fontSize: 12, color: COLORS.green, fontWeight: 600, fontFamily: MONO_FAMILY }}>
              API Live
            </span>
          </div>
        </div>

        {/* Lado Direito: RoleSwitcher + Carteira Solana */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: COLORS.greenLight,
              background: COLORS.panelAlt,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: "8px 14px",
              fontWeight: 600,
            }}
          >
            <span style={{ color: COLORS.textMuted }}>Perfil:</span>
            <span style={{ color: COLORS.green, fontWeight: 700 }}>Maintainer</span>
          </div>

          {walletConnected ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: COLORS.panel,
                border: `1px solid ${COLORS.borderAlt}`,
                borderRadius: 12,
                padding: "8px 16px",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: COLORS.green,
                  boxShadow: `0 0 8px ${COLORS.green}`,
                }}
              />
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontWeight: 700,
                  fontSize: 14,
                  color: COLORS.green,
                }}
              >
                mAr1a...9xQk
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: COLORS.green,
                borderRadius: 10,
                padding: "8px 18px",
                color: "#0A140A",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Conectar Carteira
            </div>
          )}
        </div>
      </div>

      {/* Linha Inferior: 4 Abas + Link Repositório */}
      <div
        style={{
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          borderTop: `1px solid ${COLORS.border}88`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <div
                key={tab}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  background: active ? COLORS.green : "transparent",
                  color: active ? "#0A140A" : "#9EB19D",
                }}
              >
                {tab}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: COLORS.textMuted,
            fontFamily: MONO_FAMILY,
          }}
        >
          <span style={{ color: COLORS.green }}>●</span>
          <span>GermanoDevelopment/greenfield</span>
        </div>
      </div>
    </div>
  );
};
