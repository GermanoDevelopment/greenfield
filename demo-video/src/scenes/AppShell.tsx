import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";
import { interFontFamily } from "../loadFonts";
import { AppSidebar } from "./AppSidebar";

export const AppShell: React.FC<{
  children: React.ReactNode;
  activeItem: string;
  breadcrumb: string;
}> = ({ children, activeItem, breadcrumb }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: interFontFamily,
        color: COLORS.textBody,
        flexDirection: "row",
      }}
    >
      <AppSidebar activeItem={activeItem} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top header bar */}
        <div
          style={{
            height: 64,
            borderBottom: `1px solid ${COLORS.border}`,
            background: `${COLORS.headerBg}F2`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: MONO_FAMILY, fontSize: 12, color: COLORS.textMuted }}>
            <span>Greenfield</span>
            <span>/</span>
            <span style={{ color: COLORS.greenLight, fontWeight: 700 }}>{breadcrumb}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Pill label="Solana Devnet" />
            <Pill label="API Live" />
            <div
              style={{
                fontFamily: MONO_FAMILY,
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.green,
                background: COLORS.panel,
                border: `1px solid ${COLORS.borderAlt}`,
                borderRadius: 10,
                padding: "6px 14px",
              }}
            >
              7xKX...9mPq
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "36px 44px", overflow: "hidden" }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};

const Pill: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 7,
      background: COLORS.panel,
      border: `1px solid ${COLORS.borderAlt}`,
      borderRadius: 999,
      padding: "5px 12px",
      fontFamily: MONO_FAMILY,
      fontSize: 11,
      color: COLORS.green,
      fontWeight: 600,
    }}
  >
    <span style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.green }} />
    {label}
  </div>
);
