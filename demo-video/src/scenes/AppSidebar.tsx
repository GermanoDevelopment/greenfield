import React from "react";
import { Img, staticFile } from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";

const NAV_ITEMS = [
  { label: "Dashboard", desc: "Visão geral e métricas" },
  { label: "Repositórios", desc: "Projetos cadastrados" },
  { label: "Issues & Bounties", desc: "Tarefas e pontuações" },
  { label: "Minhas Rewards", desc: "Recompensas USDC" },
  { label: "Meu Perfil", desc: "GitHub e Carteira" },
  { label: "Painel Admin", desc: "Gestão e moderação", badge: "Admin" },
];

export const AppSidebar: React.FC<{ activeItem: string }> = ({ activeItem }) => {
  return (
    <div
      style={{
        width: 300,
        minWidth: 300,
        height: "100%",
        background: COLORS.headerBg,
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: 22,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Img
          src={staticFile("Icon-only.png")}
          style={{ width: 34, height: 34, borderRadius: 9, objectFit: "contain" }}
        />
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.greenLight, letterSpacing: 0.5, lineHeight: 1 }}>
            GREEN<span style={{ color: COLORS.green }}>FIELD</span>
          </div>
          <div style={{ fontFamily: MONO_FAMILY, fontSize: 10, color: COLORS.textMuted, letterSpacing: 2, marginTop: 3 }}>
            DEVNET MVP
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}88`, display: "flex", flexDirection: "column", gap: 8 }}>
        <StatusRow label="Solana Devnet" value="Cluster Active" />
        <StatusRow label="Backend API" value="FastAPI Online" />
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "16px 12px", overflow: "hidden" }}>
        <div style={{ fontFamily: MONO_FAMILY, fontSize: 10, color: COLORS.textFaint, letterSpacing: 1.5, padding: "0 10px 10px" }}>
          NAVEGAÇÃO PRINCIPAL
        </div>
        {NAV_ITEMS.map((item) => {
          const active = item.label === activeItem;
          return (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 10,
                marginBottom: 3,
                background: active ? "#1D2B1A" : "transparent",
                borderLeft: active ? `4px solid ${COLORS.green}` : "4px solid transparent",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? COLORS.green : "#9EAE9D" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 10, color: "#6B7C6A", marginTop: 1 }}>{item.desc}</div>
              </div>
              {item.badge && (
                <span
                  style={{
                    fontFamily: MONO_FAMILY,
                    fontSize: 9,
                    fontWeight: 700,
                    color: COLORS.green,
                    background: `${COLORS.green}22`,
                    border: `1px solid ${COLORS.green}55`,
                    borderRadius: 4,
                    padding: "1px 6px",
                    textTransform: "uppercase",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Persona footer */}
      <div style={{ padding: 16, borderTop: `1px solid ${COLORS.border}`, background: `${COLORS.headerBg}CC` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: COLORS.greenChipBg,
              border: `1px solid ${COLORS.green}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 13,
              color: COLORS.green,
            }}
          >
            AD
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.greenLight }}>ana-dev</span>
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontSize: 8,
                  color: COLORS.textMuted,
                  background: "#1A2319",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 4,
                  padding: "1px 5px",
                  textTransform: "uppercase",
                }}
              >
                developer
              </span>
            </div>
            <div style={{ fontFamily: MONO_FAMILY, fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>
              7xKX...9mPq
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
    <span style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.textMuted, fontWeight: 500 }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: COLORS.green, boxShadow: `0 0 6px ${COLORS.green}` }} />
      {label}
    </span>
    <span
      style={{
        fontFamily: MONO_FAMILY,
        fontSize: 9,
        color: COLORS.green,
        background: "#192A17",
        border: `1px solid ${COLORS.green}44`,
        borderRadius: 4,
        padding: "1px 6px",
      }}
    >
      {value}
    </span>
  </div>
);
