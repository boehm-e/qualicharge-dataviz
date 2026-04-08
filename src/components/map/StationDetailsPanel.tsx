"use client";

import { useEffect, useMemo } from "react";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

import { CopyableValue } from "@/components/irve/CopyableValue";
import { ScheduleTable } from "@/components/irve/ScheduleTable";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import {
  formatBoolean,
  formatDate,
  formatNullable,
  getAccessSeverity,
  getConnectorTags,
  getPaymentTags,
  getPmrLabel,
  getPowerSeverity,
  getStationTypeLabel,
} from "@/lib/irve/formatters";
import { buildSections, type DetailItem } from "@/lib/irve/sections";
import { AccessibilitePMR, ImplantationStation, type QualichargeEVSEStatique } from "@/types/irve";
import { MapSidePanel } from "./MapSidePanel";

export interface StationDetailsPanelProps {
  station: QualichargeEVSEStatique | null;
  isOpen: boolean;
  onClose: () => void;
}

function resolveDisplayValue(item: DetailItem): string {
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
    case "ID station itinerance":
    case "ID station local":
    case "ID point de charge itinerance":
    case "ID point de charge local":
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

export function StationDetailsPanel({ station, isOpen, onClose }: StationDetailsPanelProps) {
  const { copiedKey, copy, reset } = useCopyToClipboard();

  const connectorTags = useMemo(() => (station ? getConnectorTags(station) : []), [station]);
  const paymentTags = useMemo(() => (station ? getPaymentTags(station) : []), [station]);
  const sections = useMemo(() => (station ? buildSections(station) : []), [station]);

  useEffect(() => {
    reset();
  }, [station, reset]);

  const panelTitle = station ? station.nom_station || station.adresse_station : "Aucune station selectionnée";
  const panelSubtitle = station
    ? station.adresse_station
    : "Cliquez sur une fiche depuis la carte pour afficher les détails complets de la station.";

  return (
    <MapSidePanel
      id="station-details"
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Station de recharge"
      title={panelTitle}
      subtitle={panelSubtitle}
      labelledById="irve-sidepanel-title"
      withBackdrop={false}
    >
      {station ? (
        <>
          <Card
            title="Essentiel"
            desc={
              <div className="irve-sidepanel__hero">
                <ul className="fr-badges-group">
                  <li>
                    <Badge severity={getPowerSeverity(station.puissance_nominale)}>
                      {station.puissance_nominale} kW
                    </Badge>
                  </li>
                  <li>
                    <Badge severity="new">{station.nbre_pdc} point(s) de charge</Badge>
                  </li>
                  <li>
                    <Badge severity={getAccessSeverity(station.condition_acces)}>
                      {station.condition_acces}
                    </Badge>
                  </li>
                </ul>

                <div className="irve-sidepanel__tags">
                  <Tag small iconId="fr-icon-map-pin-2-line">{getStationTypeLabel(station.implantation_station)}</Tag>
                  <Tag small iconId="fr-icon-time-line">{station.horaires || "Horaires non renseignés"}</Tag>
                  <Tag small iconId="fr-icon-wheelchair-line">{getPmrLabel(station.accessibilite_pmr)}</Tag>
                  {station.station_deux_roues ? (
                    <Tag small iconId="fr-icon-bike-line">Compatible deux-roues</Tag>
                  ) : null}
                </div>

                <ButtonsGroup
                  inlineLayoutWhen="always"
                  alignment="left"
                  buttonsSize="small"
                  buttons={[
                    {
                      children: copiedKey === "address_station" ? "Adresse copiée" : "Copier l'adresse",
                      priority: "secondary",
                      iconId: copiedKey === "address_station" ? "fr-icon-check-line" : "fr-icon-clipboard-line",
                      onClick: () => copy("address_station", station.adresse_station),
                    },
                    {
                      children: copiedKey === "coordonneesXY" ? "Coordonnées copiées" : "Copier coordonnées",
                      priority: "tertiary",
                      iconId: copiedKey === "coordonneesXY" ? "fr-icon-check-line" : "fr-icon-clipboard-line",
                      onClick: () => copy("coordonneesXY", station.coordonneesXY),
                    },
                  ]}
                />
              </div>
            }
            border
          />

          <Card
            title="Horaires"
            desc={
              <div className="irve-sidepanel__schedule-block">
                <ScheduleTable horaires={station.horaires} />
              </div>
            }
            border
          />

          <Card
            title="Connecteurs et paiement"
            desc={
              <>
                <div className="irve-sidepanel__tag-columns">
                  <div>
                    <p className="irve-sidepanel__label">Connecteurs</p>
                    <div className="irve-sidepanel__tags irve-sidepanel__tags--compact">
                      {connectorTags.length > 0 ? (
                        connectorTags.map((label) => (
                          <Tag key={label} small iconId="fr-icon-flashlight-line">{label}</Tag>
                        ))
                      ) : (
                        <p className="irve-sidepanel__empty">Aucun connecteur detaillé.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="irve-sidepanel__label">Paiement</p>
                    <div className="irve-sidepanel__tags irve-sidepanel__tags--compact">
                      {paymentTags.length > 0 ? (
                        paymentTags.map((label) => (
                          <Tag key={label} small iconId="fr-icon-bank-card-line">{label}</Tag>
                        ))
                      ) : (
                        <p className="irve-sidepanel__empty">Aucune modalité de paiement detaillée.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            }
            border
          />

          {sections.map((section) => (
            <Card
              key={section.title}
              title={section.title}
              desc={
                <dl className="irve-sidepanel__facts">
                  {section.items.map((item) => (
                    <CopyableValue
                      key={`${section.title}-${item.label}`}
                      item={item}
                      displayValue={resolveDisplayValue(item)}
                      copiedKey={copiedKey}
                      onCopy={copy}
                    />
                  ))}
                </dl>
              }
              border
            />
          ))}
        </>
      ) : null}
    </MapSidePanel>
  );
}
