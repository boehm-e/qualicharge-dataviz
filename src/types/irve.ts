// ============================================================
// Enums
// ============================================================

export enum ImplantationStation {
  VOIRIE = "Voirie",
  PARKING_PUBLIC = "Parking public",
  PARKING_PRIVE_USAGE_PUBLIC = "Parking privé à usage public",
  PARKING_PRIVE_CLIENTELE = "Parking privé réservé à la clientèle",
  STATION_RECHARGE_RAPIDE = "Station dédiée à la recharge rapide",
}

export enum ConditionAcces {
  ACCESS_LIBRE = "Accès libre",
  ACCESS_RESERVE = "Accès réservé",
}

export enum AccessibilitePMR {
  RESERVE_PMR = "Réservé PMR",
  NON_RESERVE = "Accessible mais non réservé PMR",
  NON_ACCESSIBLE = "Non accessible",
  INCONNUE = "Accessibilité inconnue",
}

export enum Raccordement {
  DIRECT = "Direct",
  INDIRECT = "Indirect",
}

// ============================================================
// Branded / constrained primitives
// ============================================================

/** 9-digit string validated by the Luhn algorithm. */
export type Siren = string & { readonly __brand: "Siren" };

/**
 * Coordinate string in "[longitude, latitude]" format,
 * guaranteed to fall within French territory (metro + DOM).
 * Raw value example: "[4.156034, 45.679959]"
 */
export type FrenchCoordinate = string & { readonly __brand: "FrenchCoordinate" };

/** ISO 8601 date string (YYYY-MM-DD) that is today or in the past. */
export type NotFutureDate = string & { readonly __brand: "NotFutureDate" };

/** E.164 phone number string, defaulting to FR region. */
export type FrenchPhoneNumber = string & { readonly __brand: "FrenchPhoneNumber" };

// ============================================================
// Main model
// ============================================================
// https://schema.data.gouv.fr/etalab/schema-irve-statique/latest/documentation.html
export interface QualichargeEVSEStatique {
  // --- Aménageur (facility owner) ---
  nom_amenageur: string;
  /** 9-digit SIREN validated by Luhn algorithm. Example: "853300010" */
  siren_amenageur: Siren;
  contact_amenageur: string; // email

  // --- Opérateur ---
  nom_operateur: string;
  contact_operateur: string; // email
  telephone_operateur: FrenchPhoneNumber;

  // --- Station ---
  nom_enseigne: string;
  /** Pattern: /^FR[A-Z0-9]{3}P[A-Z0-9]{1,29}$/ or "Non concerné" */
  id_station_itinerance: string;
  id_station_local?: string | null;
  nom_station: string;
  implantation_station: ImplantationStation;
  adresse_station: string;
  /** INSEE code pattern: /^([013-9]\d|2[AB1-9])\d{3}$/ */
  code_insee_commune: string;
  /** "[longitude, latitude]" within French territory */
  coordonneesxy: FrenchCoordinate;
  /** Positive integer */
  nbre_pdc: number;

  // --- Point de charge (PDC) ---
  /** Pattern: /^FR[A-Z0-9]{3}E[A-Z0-9]{1,29}$/ or "Non concerné".
   *  AFIREV prefix (first 5 chars) must match id_station_itinerance. */
  id_pdc_itinerance: string;
  id_pdc_local?: string | null;
  /** Range: 1.3 – 4000.0 kW */
  puissance_nominale: number;

  // --- Connector types ---
  prise_type_ef: boolean;
  prise_type_2: boolean;
  prise_type_combo_ccs: boolean;
  prise_type_chademo: boolean;
  prise_type_autre: boolean;

  // --- Payment & access ---
  gratuit?: boolean | null;
  paiement_acte: boolean;
  paiement_cb?: boolean | null;
  paiement_autre?: boolean | null;
  tarification?: string | null;
  condition_acces: ConditionAcces;
  reservation: boolean;

  // --- Schedule & accessibility ---
  /** Pattern: must contain HH:MM-HH:MM ranges or "24/7" */
  horaires: string;
  accessibilite_pmr: AccessibilitePMR;
  /** Min length: 2 */
  restriction_gabarit: string;
  station_deux_roues: boolean;

  // --- Connection ---
  raccordement: Raccordement;
  /**
   * Required when raccordement === Raccordement.DIRECT.
   * Max length: 64 characters.
   */
  num_pdl?: string | null;

  // --- Dates & misc ---
  date_mise_en_service?: NotFutureDate | null;
  observations?: string | null;
  date_maj: NotFutureDate;
  cable_t2_attache?: boolean | null;
}