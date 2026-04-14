import type { HeatmapDefinition } from "@/lib/irve/heatmaps";

export type MarkerDisplayMode = "markers" | "pricing";
export type HeatmapDisplayMode = HeatmapDefinition["value"];
export type MapDisplayMode = MarkerDisplayMode | HeatmapDisplayMode;

export interface MarkerModeDefinition {
  value: MarkerDisplayMode;
  label: string;
  shortLabel: string;
  order: number;
  kind: "markers";
  description: string;
}

export interface HeatmapModeDefinition extends HeatmapDefinition {
  kind: "heatmap";
}

export type MapModeDefinition = MarkerModeDefinition | HeatmapModeDefinition;

export const MARKER_MODES: MarkerModeDefinition[] = [
  {
    value: "markers",
    label: "Vue stations détaillées",
    shortLabel: "Vue stations détaillées",
    order: 0,
    kind: "markers",
    description: "Affiche les stations individuelles, leurs clusters et le détail station par station.",
  },
  {
    value: "pricing",
    label: "Tarification actuelle des stations",
    shortLabel: "Tarification",
    order: 10,
    kind: "markers",
    description:
      "Affiche les stations avec leur prix extrait du champ de tarification, quand un tarif exploitable est disponible.",
  },
];

export function buildMapModes(heatmaps: HeatmapDefinition[]): MapModeDefinition[] {
  return [
    ...MARKER_MODES,
    ...heatmaps.map((heatmap) => ({ ...heatmap, kind: "heatmap" as const })),
  ].sort((a, b) => a.order - b.order);
}

export function isHeatmapDisplayMode(mode: MapDisplayMode): mode is HeatmapDisplayMode {
  return mode !== "markers" && mode !== "pricing";
}
