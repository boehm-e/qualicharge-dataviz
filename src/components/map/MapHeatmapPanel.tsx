"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Select } from "@codegouvfr/react-dsfr/Select";

import type { HeatmapDefinition, HeatmapGradientStop, HeatmapMode } from "@/lib/irve/heatmaps";
import { MapSidePanel } from "./MapSidePanel";

interface MapHeatmapPanelProps {
  isOpen: boolean;
  onClose: () => void;
  heatmapMode: HeatmapMode;
  onModeChange: (mode: HeatmapMode) => void;
  heatmaps: HeatmapDefinition[];
  activeHeatmap: HeatmapDefinition | null;
  legendStops: HeatmapGradientStop[];
  activePointCount: number;
}

export function MapHeatmapPanel({
  isOpen,
  onClose,
  heatmapMode,
  onModeChange,
  heatmaps,
  activeHeatmap,
  legendStops,
  activePointCount,
}: MapHeatmapPanelProps) {
  return (
    <MapSidePanel
      id="map-heatmaps"
      className="z-20"
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Carte de recharge"
      title="Qualité de service"
      subtitle="Analysez la performance du réseau avec des vues thématiques et une légende interprétable."
    >
      <Card
        title="Mode d'analyse"
        titleAs="h3"
        size="small"
        border
        desc={
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              {activeHeatmap
                ? "Une heatmap colore les zones selon l'intensité de l'indicateur choisi."
                : "La carte affiche les stations individuelles et leurs clusters."}
            </span>
            <Badge severity={activeHeatmap ? "info" : "new"}>{activeHeatmap ? "Heatmap" : "Stations"}</Badge>
          </div>
        }
      />

      <Select
        label="Vue thématique"
        hint="Chaque vue mesure un aspect différent de la qualité de service."
        nativeSelectProps={{
          value: heatmapMode ?? "markers",
          onChange: (event) => {
            const nextValue = event.target.value;
            onModeChange(nextValue === "markers" ? null : (nextValue as Exclude<HeatmapMode, null>));
          },
        }}
      >
        <option value="markers">Vue stations détaillées</option>
        {heatmaps.map((heatmap) => (
          <option key={heatmap.value} value={heatmap.value}>
            {heatmap.shortLabel}
          </option>
        ))}
      </Select>

      <Card
        title={activeHeatmap ? activeHeatmap.label : "Vue stations détaillées"}
        titleAs="h3"
        size="small"
        border
        desc={
          <div className="space-y-2 text-sm text-slate-700">
            <p className="m-0">
              {activeHeatmap
                ? activeHeatmap.description
                : "Affiche les stations individuelles, les clusters et le détail station par station."}
            </p>
            <p className="m-0 text-xs text-slate-500">
              {activeHeatmap
                ? `${activePointCount} stations contribuent actuellement à cette heatmap.`
                : "Ouvrez une station pour consulter sa fiche détaillée."}
            </p>
          </div>
        }
      />

      {activeHeatmap ? (
        <Card
          title="Légende couleur"
          titleAs="h3"
          size="small"
          border
          desc={
            <div className="space-y-3 text-sm">
              <p className="m-0 text-slate-600">{activeHeatmap.legendTitle}</p>
              <div className="h-3 w-full rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#06b6d4_25%,#22c55e_50%,#f59e0b_75%,#dc2626_100%)]" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700">
                {legendStops.map((stop) => (
                  <div key={`${activeHeatmap.value}-${stop.value}-${stop.color}`} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stop.color }} aria-hidden="true" />
                    <span>{stop.label}</span>
                  </div>
                ))}
              </div>
              {activePointCount === 0 ? (
                <p className="m-0 text-xs text-slate-500">{activeHeatmap.emptyMessage}</p>
              ) : null}
            </div>
          }
        />
      ) : null}
    </MapSidePanel>
  );
}
