import type { Dispatch, SetStateAction } from "react";

import { withBasePath } from "@/lib/base-path";
import type { DetailSection, DetailItem } from "@/lib/irve/sections";
import type {
  EtatPriseEnum,
  ImplantationStation,
  QualichargeEVSEConsolidated,
  QualichargeEVSEPlug,
  AccessibilitePMR,
} from "@/types/irve";
import {
  formatBoolean,
  formatDate,
  formatNullable,
  getPmrLabel,
  getStationTypeLabel,
} from "@/lib/irve/formatters";

export type StationTabId = "essentiel" | "connecteurs" | "acces" | "details";

export type StationDetailsTabProps = {
  station: QualichargeEVSEConsolidated;
};

export type CopyState = {
  copiedKey: string | null;
  copy: (key: string, value: string) => void;
};

export type EssentialTabProps = StationDetailsTabProps & CopyState;

export type AccessTabProps = StationDetailsTabProps & {
  paymentTags: string[];
};

export type DetailsTabProps = StationDetailsTabProps & CopyState & {
  sections: DetailSection[];
};

export type ConnectorStatusItem = {
  label: string;
  active: boolean;
  status?: EtatPriseEnum | null;
  iconPath: string;
  count: number;
};

export type ConnectorsTabProps = StationDetailsTabProps & {
  connectorStatusItems: ConnectorStatusItem[];
};

export type TabsStateProps = {
  selectedTabId: StationTabId;
  setSelectedTabId: Dispatch<SetStateAction<StationTabId>>;
};

export function resolveDisplayValue(item: DetailItem): string {
  const v = item.rawValue;

  switch (item.label) {
    case "Enseigne":
    case "Restriction gabarit":
    case "Tarification":
    case "Operateur":
    case "Amenageur":
    case "Observations":
    case "Horaires":
      return formatNullable(v);
    case "Adresse":
    case "Contact operateur":
    case "Contact amenageur":
    case "Code INSEE":
    case "Numero PDL":
    case "Puissance max":
    case "Nombre de PDC":
    case "ID station itinerance":
    case "ID station local":
    case "SIREN amenageur":
    case "Telephone operateur":
      return formatNullable(v);
    case "Cable T2 attache":
      return formatBoolean(v === "true" ? true : v === "false" ? false : null);
    case "Station deux-roues":
      return formatBoolean(v === "true");
    case "Reservation":
      return formatBoolean(v === "true");
    case "Mise en service":
    case "Derniere mise a jour":
      return formatDate(v);
    case "Implantation":
      return getStationTypeLabel(v as ImplantationStation);
    case "Accessibilite PMR":
      return getPmrLabel(v as AccessibilitePMR);
    default:
      return formatNullable(v);
  }
}

export function getConnectorStatusItems(station: QualichargeEVSEConsolidated): ConnectorStatusItem[] {
  const countPlugs = (predicate: (plug: QualichargeEVSEPlug) => boolean) =>
    station.plugs.filter(predicate).length;

  return [
    {
      label: "Type 2",
      active: station.summary.has_prise_type_2,
      status: undefined,
      iconPath: withBasePath("/images/prises/prise_type_2.svg"),
      count: countPlugs((plug) => plug.prise_type_2),
    },
    {
      label: "Combo CCS",
      active: station.summary.has_prise_type_combo_ccs,
      status: undefined,
      iconPath: withBasePath("/images/prises/prise_type_combo_ccs.svg"),
      count: countPlugs((plug) => plug.prise_type_combo_ccs),
    },
    {
      label: "CHAdeMO",
      active: station.summary.has_prise_type_chademo,
      status: undefined,
      iconPath: withBasePath("/images/prises/prise_type_chademo.svg"),
      count: countPlugs((plug) => plug.prise_type_chademo),
    },
    {
      label: "Prise EF",
      active: station.summary.has_prise_type_ef,
      status: undefined,
      iconPath: withBasePath("/images/prises/prise_type_ef.svg"),
      count: countPlugs((plug) => plug.prise_type_ef),
    },
    {
      label: "Autre prise",
      active: station.summary.has_prise_type_autre,
      status: null,
      iconPath: withBasePath("/images/prises/prise_type_autre.svg"),
      count: countPlugs((plug) => plug.prise_type_autre),
    },
  ].filter((connector) => connector.active);
}
