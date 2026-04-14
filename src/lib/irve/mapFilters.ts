import { AccessibilitePMR, ConditionAcces, type QualichargeEVSEConsolidated } from "@/types/irve";

export type PowerFilterId = "ultra" | "veryFast" | "fast" | "standard";
export type AccessFilter = "all" | "free" | "restricted";

export interface MapFiltersState {
  access: AccessFilter;
  power: PowerFilterId[];
  connectors: Array<"type2" | "ccs" | "chademo" | "ef">;
  payment: Array<"free" | "card" | "onSite">;
  itineranceQuery: string;
  operatorQuery: string;
  reservationOnly: boolean;
  pmrOnly: boolean;
  twoWheelsOnly: boolean;
}

export const DEFAULT_MAP_FILTERS: MapFiltersState = {
  access: "all",
  power: [],
  connectors: [],
  payment: [],
  itineranceQuery: "",
  operatorQuery: "",
  reservationOnly: false,
  pmrOnly: false,
  twoWheelsOnly: false,
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function matchesTextQuery(value: string | null | undefined, query: string) {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length === 0) {
    return true;
  }

  return normalizeText(value).includes(normalizedQuery);
}

export const POWER_FILTER_OPTIONS: Array<{
  id: PowerFilterId;
  label: string;
  description: string;
}> = [
  { id: "ultra", label: "Ultra-rapide", description: "AFIR DC niveau 1 et 2 - 150 kW et plus" },
  { id: "veryFast", label: "Rapide DC", description: "AFIR DC rapide - 50 a 149 kW" },
  { id: "fast", label: "AC elevee / DC lente", description: "AFIR AC > 22 kW ou DC < 50 kW" },
  { id: "standard", label: "AC normale", description: "AFIR AC jusqu'a 22 kW" },
];

export const CONNECTOR_FILTER_OPTIONS: Array<{
  id: MapFiltersState["connectors"][number];
  label: string;
}> = [
  { id: "type2", label: "Type 2" },
  { id: "ccs", label: "Combo CCS" },
  { id: "chademo", label: "CHAdeMO" },
  { id: "ef", label: "Prise EF" },
];

export const PAYMENT_FILTER_OPTIONS: Array<{
  id: MapFiltersState["payment"][number];
  label: string;
}> = [
  { id: "free", label: "Recharge gratuite" },
  { id: "card", label: "Carte bancaire" },
  { id: "onSite", label: "Paiement à l'acte" },
];

function matchesPower(power: number, filterId: PowerFilterId) {
  switch (filterId) {
    case "ultra":
      return power >= 150;
    case "veryFast":
      return power >= 50 && power < 150;
    case "fast":
      return power > 22 && power < 50;
    case "standard":
      return power <= 22;
  }
}

export function getActiveFilterCount(filters: MapFiltersState) {
  let count = 0;

  if (filters.access !== "all") count += 1;
  count += filters.power.length;
  count += filters.connectors.length;
  count += filters.payment.length;
  if (normalizeText(filters.itineranceQuery).length > 0) count += 1;
  if (normalizeText(filters.operatorQuery).length > 0) count += 1;
  if (filters.reservationOnly) count += 1;
  if (filters.pmrOnly) count += 1;
  if (filters.twoWheelsOnly) count += 1;

  return count;
}

export function matchesStationFilters(
  station: QualichargeEVSEConsolidated,
  filters: MapFiltersState
) {
  if (filters.access === "free" && station.condition_acces !== ConditionAcces.ACCESS_LIBRE) {
    return false;
  }

  if (filters.access === "restricted" && station.condition_acces !== ConditionAcces.ACCESS_RESERVE) {
    return false;
  }

  if (
    filters.power.length > 0 &&
    !filters.power.some((filterId) => matchesPower(station.summary.max_power, filterId))
  ) {
    return false;
  }

  if (filters.connectors.includes("type2") && !station.summary.has_prise_type_2) {
    return false;
  }

  if (filters.connectors.includes("ccs") && !station.summary.has_prise_type_combo_ccs) {
    return false;
  }

  if (filters.connectors.includes("chademo") && !station.summary.has_prise_type_chademo) {
    return false;
  }

  if (filters.connectors.includes("ef") && !station.summary.has_prise_type_ef) {
    return false;
  }

  if (filters.payment.includes("free") && station.gratuit !== true) {
    return false;
  }

  if (filters.payment.includes("card") && station.paiement_cb !== true) {
    return false;
  }

  if (filters.payment.includes("onSite") && !station.paiement_acte) {
    return false;
  }

  if (
    !matchesTextQuery(station.id_station_itinerance, filters.itineranceQuery) &&
    !station.pdcs.some((pdc) => matchesTextQuery(pdc.id_pdc_itinerance, filters.itineranceQuery))
  ) {
    return false;
  }

  if (
    !matchesTextQuery(station.nom_operateur, filters.operatorQuery) &&
    !matchesTextQuery(station.nom_amenageur, filters.operatorQuery)
  ) {
    return false;
  }

  if (filters.reservationOnly && !station.reservation) {
    return false;
  }

  if (filters.pmrOnly && station.accessibilite_pmr === AccessibilitePMR.NON_ACCESSIBLE) {
    return false;
  }

  if (filters.twoWheelsOnly && !station.station_deux_roues) {
    return false;
  }

  return true;
}

export function filterStations(stations: QualichargeEVSEConsolidated[], filters: MapFiltersState) {
  return stations.filter((station) => matchesStationFilters(station, filters));
}
