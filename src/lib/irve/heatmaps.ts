import { getStationDynamicSummary, isFunctionalPdc } from "@/lib/irve/formatters";
import { EtatPDCEnum, type QualichargeEVSEConsolidated } from "@/types/irve";

export interface HeatmapGradientStop {
  value: number;
  color: string;
  label: string;
}

export interface HeatmapGradient {
  [key: number]: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export type HeatmapMode = "plugCount" | "availabilityRatio" | "outOfService" | "serviceCoverage" | "pricing" | null;

export interface HeatmapDefinition {
  value: Exclude<HeatmapMode, null>;
  label: string;
  shortLabel: string;
  description: string;
  legendTitle: string;
  emptyMessage: string;
  radius: number;
  blur: number;
}

export interface HeatmapDefinitionWithMetric extends HeatmapDefinition {
  getIntensity: (station: QualichargeEVSEConsolidated) => number | null;
  getStops: (maxIntensity: number) => HeatmapGradientStop[];
}

export const DEFAULT_HEATMAP_GRADIENT = {
  0.15: "#1d4ed8",
  0.4: "#06b6d4",
  0.6: "#22c55e",
  0.8: "#f59e0b",
  1: "#dc2626",
} as const;

export function parseStationCoordinates(station: QualichargeEVSEConsolidated) {
  try {
    const [lngRaw, latRaw] = JSON.parse(station.coordonneesXY) as [string | number, string | number];
    const lat = Number(latRaw);
    const lng = Number(lngRaw);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  }
}

export function buildCountStops(
  maxIntensity: number,
  singular: string,
  plural: string
): HeatmapGradientStop[] {
  const safeMax = Math.max(Math.ceil(maxIntensity), 1);
  const ratios = [0.15, 0.4, 0.6, 0.8, 1];
  const colors = Object.values(DEFAULT_HEATMAP_GRADIENT);

  return ratios.map((ratio, index) => {
    const rawValue = index === ratios.length - 1 ? safeMax : Math.max(1, Math.round(safeMax * ratio));
    const value = Math.min(rawValue, safeMax);

    return {
      value,
      color: colors[index],
      label: `${value} ${value > 1 ? plural : singular}`,
    };
  });
}

export const SERVICE_HEATMAPS: HeatmapDefinitionWithMetric[] = [
  {
    value: "availabilityRatio",
    label: "Disponibilité réelle des points de charge",
    shortLabel: "Disponibilité réelle",
    description:
      "Montre les zones où la part de points de charge libres et fonctionnels est la plus forte.",
    legendTitle: "Part des points libres et fonctionnels",
    emptyMessage: "Aucune donnée dynamique exploitable pour calculer la disponibilité.",
    radius: 30,
    blur: 22,
    getIntensity: (station) => {
      const summary = getStationDynamicSummary(station);
      const denominator = Math.max(summary.pdcsWithDynamicCount, station.nbre_pdc, 0);

      if (denominator <= 0) {
        return null;
      }

      return summary.availableCount / denominator;
    },
    getStops: () => [
      { value: 0, color: "#1d4ed8", label: "0 %" },
      { value: 0.25, color: "#06b6d4", label: "25 %" },
      { value: 0.5, color: "#22c55e", label: "50 %" },
      { value: 0.75, color: "#f59e0b", label: "75 %" },
      { value: 1, color: "#dc2626", label: "100 %" },
    ],
  },
  {
    value: "outOfService",
    label: "Pannes et indisponibilités",
    shortLabel: "Pannes et indisponibilités",
    description:
      "Repère les zones où les points de charge hors service ou non fonctionnels sont les plus nombreux.",
    legendTitle: "Nombre de points en panne ou indisponibles",
    emptyMessage: "Aucun point hors service ou non fonctionnel dans la sélection courante.",
    radius: 28,
    blur: 20,
    getIntensity: (station) => {
      const count = station.pdcs.filter(
        (pdc) => pdc.dynamic?.etat_pdc === EtatPDCEnum.HORS_SERVICE || !isFunctionalPdc(pdc)
      ).length;

      return count > 0 ? count : null;
    },
    getStops: (maxIntensity) => buildCountStops(maxIntensity, "point en panne", "points en panne"),
  },
  {
    value: "serviceCoverage",
    label: "Couverture de service exploitable",
    shortLabel: "Couverture exploitable",
    description:
      "Met en avant les zones qui cumulent le plus de points de charge actuellement libres et fonctionnels.",
    legendTitle: "Nombre de points libres et fonctionnels",
    emptyMessage: "Aucun point libre et fonctionnel détecté dans la sélection courante.",
    radius: 30,
    blur: 22,
    getIntensity: (station) => {
      const summary = getStationDynamicSummary(station);
      return summary.availableCount > 0 ? summary.availableCount : null;
    },
    getStops: (maxIntensity) => buildCountStops(maxIntensity, "point disponible", "points disponibles"),
  },
  {
    value: "pricing",
    label: "Tarification actuelle des stations",
    shortLabel: "Tarification",
    description:
      "Compare les stations selon le tarif extrait du champ de tarification, quand un prix par kWh exploitable est disponible.",
    legendTitle: "Prix estime par kWh",
    emptyMessage: "Aucune tarification exploitable n'a pu etre extraite dans la selection courante.",
    radius: 30,
    blur: 22,
    getIntensity: (station) => station.summary.price_per_kwh,
    getStops: (maxIntensity) => {
      const safeMax = Math.max(maxIntensity, 0.1);
      const values = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Number((safeMax * ratio).toFixed(2)));
      const colors = Object.values(DEFAULT_HEATMAP_GRADIENT);

      return values.map((value, index) => ({
        value,
        color: colors[index],
        label: `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} EUR/kWh`,
      }));
    },
  },
  {
    value: "plugCount",
    label: "Capacité totale du réseau",
    shortLabel: "Capacité totale",
    description:
      "Visualise les territoires qui concentrent le plus grand nombre de points de charge, sans tenir compte de leur état.",
    legendTitle: "Nombre total de points de charge",
    emptyMessage: "Aucune station avec un nombre de points de charge exploitable.",
    radius: 32,
    blur: 24,
    getIntensity: (station) => (station.nbre_pdc > 0 ? station.nbre_pdc : null),
    getStops: (maxIntensity) => buildCountStops(maxIntensity, "point", "points"),
  },
];

export function getHeatmapDefinition(mode: HeatmapMode) {
  if (mode === null) {
    return null;
  }

  return SERVICE_HEATMAPS.find((heatmap) => heatmap.value === mode) ?? null;
}

export function buildHeatmapConfig(
  stations: QualichargeEVSEConsolidated[],
  activeHeatmap: HeatmapDefinitionWithMetric | null
) {
  if (!activeHeatmap) {
    return {
      points: [] as HeatmapPoint[],
      maxIntensity: 0,
      stops: [] as HeatmapGradientStop[],
    };
  }

  const entries = stations.flatMap((station) => {
    const coordinates = parseStationCoordinates(station);
    if (!coordinates) {
      return [];
    }

    const intensity = activeHeatmap.getIntensity(station);
    if (intensity == null || intensity <= 0) {
      return [];
    }

    return [{ ...coordinates, intensity }];
  });

  const maxIntensity = entries.reduce((max, entry) => Math.max(max, entry.intensity), 0);

  return {
    points: entries as HeatmapPoint[],
    maxIntensity,
    stops: activeHeatmap.getStops(maxIntensity),
  };
}
