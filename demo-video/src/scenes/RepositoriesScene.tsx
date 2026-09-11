import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, MONO_FAMILY } from "../theme";
import { AppShell } from "./AppShell";

const REPOS = [
  {
    name: "carcaras/solinpy",
    branch: "main",
    desc: "Biblioteca Solana Python para smart contracts, pagamentos e PDAs em Devnet.",
  },
  {
    name: "GermanoDevelopment/greenfield",
    branch: "develop",
    desc: "Protocolo descentralizado de incentivos a desenvolvedores open source.",
  },
];

export const RepositoriesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = (i: number) =>
    interpolate(frame, [(0.2 + i * 0.15) * fps, (0.6 + i * 0.15) * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const pressFrame = 2.6 * fps;
  const btnPress = interpolate(frame, [pressFrame, pressFrame + 6, pressFrame + 14], [1, 0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    output: "perceptual-scale",
  });

  return (
    <AppShell activeItem="Repositórios" breadcrumb="REPOSITORIES">
      <div style={{ marginBottom: 22, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 18 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, letterSpacing: -0.5 }}>
          Repositórios Cadastrados
        </div>
        <div style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 6 }}>
          Repositórios GitHub sincronizados para tracking de issues, pontuação e recompensas
          USDC na rede Solana.
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "12px 16px",
          color: COLORS.textFaint,
          fontSize: 13,
          marginBottom: 24,
          maxWidth: 420,
        }}
      >
        🔍 Buscar por nome do repositório ou descrição...
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        {REPOS.map((repo, i) => {
          const isTarget = i === 1;
          return (
            <Interactive.Div
              key={repo.name}
              name={`RepoCard-${i}`}
              style={{
                opacity: cardIn(i),
                flex: 1,
                background: COLORS.panel,
                border: `1px solid ${isTarget && frame > pressFrame - 10 ? COLORS.green : COLORS.border}`,
                borderRadius: 18,
                padding: "24px 26px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
                boxShadow: isTarget && frame > pressFrame - 10 ? `0 0 24px ${COLORS.green}33` : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#1D281C",
                      border: `1px solid ${COLORS.green}44`,
                      color: COLORS.green,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                    }}
                  >
                    ⑂
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>{repo.name}</div>
                    <div style={{ fontFamily: MONO_FAMILY, fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                      Branch padrão: <span style={{ color: COLORS.textBody }}>{repo.branch}</span>
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: MONO_FAMILY,
                    fontSize: 11,
                    color: COLORS.green,
                    background: "#182618",
                    border: `1px solid ${COLORS.green}44`,
                    borderRadius: 999,
                    padding: "3px 10px",
                  }}
                >
                  ✓ Ativo
                </span>
              </div>

              <div style={{ fontSize: 13, color: "#9EAE9D", lineHeight: 1.5 }}>{repo.desc}</div>

              <div
                style={{
                  paddingTop: 14,
                  borderTop: `1px solid ${COLORS.border}88`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>↗ GitHub Repo</span>
                <Interactive.Div
                  name={`ViewIssuesBtn-${i}`}
                  style={{
                    scale: isTarget ? btnPress : 1,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "9px 16px",
                    borderRadius: 10,
                    background: isTarget && frame > pressFrame ? COLORS.green : "#1D2B1A",
                    color: isTarget && frame > pressFrame ? "#0A140A" : COLORS.green,
                    border: `1px solid ${COLORS.green}44`,
                  }}
                >
                  Ver Issues & Bounties →
                </Interactive.Div>
              </div>
            </Interactive.Div>
          );
        })}
      </div>
    </AppShell>
  );
};
