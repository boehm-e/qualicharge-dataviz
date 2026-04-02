"use client";

import type { LoadState } from "@/types/irve-runtime";

export interface StatsBarProps {
  loadState: LoadState;
  visibleCount: number;
}

export function StatsBar({ loadState, visibleCount }: StatsBarProps) {
  const showLoaded = loadState.loaded > 0 || loadState.status === "done";
  
  return (
    <div className="irve-statsbar">
      <span className="irve-statsbar__item">
        <span className="irve-statsbar__dot irve-statsbar__dot--green" />
        {showLoaded ? `${loadState.loaded.toLocaleString("fr-FR")} bornes` : "En attente..."}
      </span>
      <span className="irve-statsbar__sep">·</span>
      <span className="irve-statsbar__item">
        {visibleCount.toLocaleString("fr-FR")} visibles
      </span>
      {loadState.status === "loading" && (
        <>
          <span className="irve-statsbar__sep">·</span>
          <span className="irve-statsbar__item irve-statsbar__item--loading">
            <span className="irve-statsbar__pulse" />
            {loadState.message || "Chargement..."}
          </span>
        </>
      )}
    </div>
  );
}
