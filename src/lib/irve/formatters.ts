import {
  AccessibilitePMR,
  ConditionAcces,
  ImplantationStation,
  type QualichargeEVSEStatique,
} from "@/types/irve";

export function formatNullable(value: string | number | null | undefined, fallback = "Non renseigné") {
  if (value == null || value === "") {
    return fallback;
  }

  return String(value);
}

export function formatBoolean(value: boolean | null | undefined, yes = "Oui", no = "Non") {
  if (value == null) {
    return "Non renseigné";
  }

  return value ? yes : no;
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Non renseignée";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

export function getPowerSeverity(power: number) {
  if (power >= 150) return "error" as const;
  if (power >= 50) return "warning" as const;
  if (power >= 22) return "info" as const;
  return "success" as const;
}

export function getAccessSeverity(condition: ConditionAcces) {
  return condition === ConditionAcces.ACCESS_LIBRE ? "success" as const : "info" as const;
}

export function getPmrLabel(value: AccessibilitePMR) {
  switch (value) {
    case AccessibilitePMR.RESERVE_PMR:
      return "Place reservée PMR";
    case AccessibilitePMR.NON_RESERVE:
      return "Place accessible PMR";
    case AccessibilitePMR.NON_ACCESSIBLE:
      return "Place non accessible PMR";
    default:
      return "Accessibilité PMR inconnue";
  }
}

export function getStationTypeLabel(value: ImplantationStation) {
  switch (value) {
    case ImplantationStation.VOIRIE:
      return "Voirie";
    case ImplantationStation.PARKING_PUBLIC:
      return "Parking public";
    case ImplantationStation.PARKING_PRIVE_USAGE_PUBLIC:
      return "Parking privé à usage public";
    case ImplantationStation.PARKING_PRIVE_CLIENTELE:
      return "Parking privé réservé à la clientèle";
    case ImplantationStation.STATION_RECHARGE_RAPIDE:
      return "Station dédiée à la recharge rapide";
  }
}

export function getConnectorTags(station: QualichargeEVSEStatique) {
  return [
    station.prise_type_2 && "Type 2",
    station.prise_type_combo_ccs && "Combo CCS",
    station.prise_type_chademo && "CHAdeMO",
    station.prise_type_ef && "Prise EF",
    station.prise_type_autre && "Autre prise",
  ].filter(Boolean) as string[];
}

export function getPaymentTags(station: QualichargeEVSEStatique) {
  return [
    station.gratuit === true && "Recharge gratuite",
    station.paiement_acte && "Paiement a l'acte",
    station.paiement_cb === true && "Carte bancaire",
    station.paiement_autre === true && "Autre paiement",
    station.reservation && "Reservation disponible",
  ].filter(Boolean) as string[];
}
