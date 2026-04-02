"use client";

import type { LoadState } from "@/types/irve-runtime";

export interface LoadingOverlayProps {
  loadState: LoadState;
}

export function LoadingOverlay({ loadState }: LoadingOverlayProps) {
  if (loadState.status === "done") return null;

  const pct =
    loadState.total > 0
      ? Math.round((loadState.loaded / loadState.total) * 100)
      : null;

  return (
    <div className="irve-loading-overlay">
      {loadState.status === "error" ? (
        <div className="irve-loading-overlay__error">
          ⚠️ Erreur de chargement : {loadState.error}
        </div>
      ) : (
        <div className="irve-loading-overlay__card">
          <div className="irve-loading-overlay__spinner" />
          <p>{loadState.message || "Chargement des bornes IRVE…"}</p>
          {loadState.loaded > 0 && (
            <p className="irve-loading-overlay__count">
              {loadState.loaded.toLocaleString("fr-FR")} stations chargées
            </p>
          )}
          {pct !== null && (
            <div className="irve-loading-overlay__bar">
              <div
                className="irve-loading-overlay__fill"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
