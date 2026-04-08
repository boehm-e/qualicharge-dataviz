import { AccessibilitePMR, ConditionAcces, type QualichargeEVSEStatique } from "@/types/irve";

export type PowerFilterId = "ultra" | "veryFast" | "fast" | "standard";
export type AccessFilter = "all" | "free" | "restricted";

export interface MapFiltersState {
  access: AccessFilter;
  power: PowerFilterId[];
  connectors: Array<"type2" | "ccs" | "chademo" | "ef">;
  payment: Array<"free" | "card" | "onSite">;
  reservationOnly: boolean;
  pmrOnly: boolean;
  twoWheelsOnly: boolean;
}

export const DEFAULT_MAP_FILTERS: MapFiltersState = {
  access: "all",
  power: [],
  connectors: [],
  payment: [],
  reservationOnly: false,
  pmrOnly: false,
  twoWheelsOnly: false,
};

export const POWER_FILTER_OPTIONS: Array<{
  id: PowerFilterId;
  label: string;
  description: string;
}> = [
  { id: "ultra", label: "Ultra-rapide", description: "200 kW et plus" },
  { id: "veryFast", label: "Tres rapide", description: "100 a 199 kW" },
  { id: "fast", label: "Rapide", description: "50 a 99 kW" },
  { id: "standard", label: "Acceleree", description: "22 a 49 kW" },
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
  { id: "onSite", label: "Paiement a l'acte" },
];

function matchesPower(power: number, filterId: PowerFilterId) {
  switch (filterId) {
    case "ultra":
      return power >= 200;
    case "veryFast":
      return power >= 100 && power < 200;
    case "fast":
      return power >= 50 && power < 100;
    case "standard":
      return power >= 22 && power < 50;
  }
}

export function getActiveFilterCount(filters: MapFiltersState) {
  let count = 0;

  if (filters.access !== "all") count += 1;
  count += filters.power.length;
  count += filters.connectors.length;
  count += filters.payment.length;
  if (filters.reservationOnly) count += 1;
  if (filters.pmrOnly) count += 1;
  if (filters.twoWheelsOnly) count += 1;

  return count;
}

export function matchesStationFilters(
  station: QualichargeEVSEStatique,
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
    !filters.power.some((filterId) => matchesPower(station.puissance_nominale, filterId))
  ) {
    return false;
  }

  if (filters.connectors.includes("type2") && !station.prise_type_2) {
    return false;
  }

  if (filters.connectors.includes("ccs") && !station.prise_type_combo_ccs) {
    return false;
  }

  if (filters.connectors.includes("chademo") && !station.prise_type_chademo) {
    return false;
  }

  if (filters.connectors.includes("ef") && !station.prise_type_ef) {
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

export function filterStations(stations: QualichargeEVSEStatique[], filters: MapFiltersState) {
  return stations.filter((station) => matchesStationFilters(station, filters));
}
