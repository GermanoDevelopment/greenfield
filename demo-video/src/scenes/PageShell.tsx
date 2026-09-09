import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../theme";
import { interFontFamily } from "../loadFonts";
import { Navbar } from "./Navbar";

export const PageShell: React.FC<{
  children: React.ReactNode;
  activeTab?: string;
  walletConnected?: boolean;
}> = ({ children, activeTab, walletConnected }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: interFontFamily,
        color: COLORS.textBody,
      }}
    >
      <Navbar activeTab={activeTab} walletConnected={walletConnected} />
      <div style={{ padding: "48px 56px", flex: 1 }}>{children}</div>
    </AbsoluteFill>
  );
};
