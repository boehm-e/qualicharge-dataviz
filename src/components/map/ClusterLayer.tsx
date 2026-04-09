"use client";

import { MouseEvent, useMemo } from "react";
import { DivIcon } from "leaflet";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type SuperclusterType from "supercluster";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

import type { IRVEClusterOrPoint, IRVEPointProperties } from "@/types/irve-runtime";
import { isClusterFeature } from "@/hooks/useMapClusters";
import { ConditionAcces } from "@/types/irve";
import { getPowerSeverity, getStationDynamicSummary } from "@/lib/irve/formatters";

const clusterIconCache = new Map<number, L.DivIcon>();
const pointIconCache = new Map<string, DivIcon>();

function getClusterIcon(count: number): L.DivIcon {
  const size = count < 10 ? 36 : count < 100 ? 44 : count < 1000 ? 52 : 62;

  const cached = clusterIconCache.get(size);
  if (cached) {
    return L.divIcon({
      html: `<div class="irve-cluster" style="width:${size}px;height:${size}px;font-size:${size < 44 ? 12 : 13}px">${count > 9999 ? "10k+" : count}</div>`,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  const icon = L.divIcon({
    html: `<div class="irve-cluster" style="width:${size}px;height:${size}px;font-size:${size < 44 ? 12 : 13}px">${count > 9999 ? "10k+" : count}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  clusterIconCache.set(size, icon);
  return icon;
}

function getClusterClassName(count: number) {
  if (count < 10) return "irve-cluster-marker irve-cluster-marker--sm";
  if (count < 100) return "irve-cluster-marker irve-cluster-marker--md";
  if (count < 1000) return "irve-cluster-marker irve-cluster-marker--lg";
  return "irve-cluster-marker irve-cluster-marker--xl";
}

function getPointPowerLabel(power: number | null | undefined) {
  if (!power) return "-";
  return `${power} kW`;
}

function getPointPlugsLabel(available: number, total: number | null | undefined) {
  if (!total) return "-/- plugs";
  return `${available}/${total} plugs`;
}

function getPointIcon(
  power: number | null | undefined,
  plugsLabel: string,
  color: string,
  debug?: string
): DivIcon {
  const powerLabel = getPointPowerLabel(power);
  const cacheKey = `${powerLabel}|${plugsLabel}|${color}`;
  const cached = pointIconCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const icon = L.divIcon({
    html: `<div class="irve-point-card">
      <div class="irve-point-card__power" style="background:${color}">
        ${powerLabel}
      </div>
      <div class="irve-point-card__meta">
        ${plugsLabel}
      </div>
      <div class="irve-point-card__tip"></div>
      <div>${debug}</div>
    </div>`,
    className: "",
    iconSize: [84, 56],
    iconAnchor: [42, 56],
    popupAnchor: [0, -50],
  });

  pointIconCache.set(cacheKey, icon);
  return icon;
}

interface ClusterLayerProps {
  clusters: IRVEClusterOrPoint[];
  supercluster: SuperclusterType<IRVEPointProperties, Record<string, never>>;
  zoom: number;
  onStationSelect?: (station: IRVEPointProperties["row"]) => void;
}

export function ClusterLayer({
  clusters,
  supercluster,
  zoom,
  onStationSelect,
}: ClusterLayerProps) {
  const map = useMap();

  const elements = useMemo(() => {
    return clusters.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;

      if (isClusterFeature(feature)) {
        const { cluster_id, point_count } = feature.properties;

        return (
          <Marker
            key={`cluster-${cluster_id}`}
            position={[lat, lng]}
            icon={getClusterIcon(point_count)}
            zIndexOffset={point_count}
            eventHandlers={{
              click: () => {
                const expansionZoom = Math.min(
                  supercluster.getClusterExpansionZoom(cluster_id),
                  18
                );
                map.setView([lat, lng], expansionZoom, { animate: true });
              },
              add: (event) => {
                const element = event.target.getElement();
                if (!element) return;

                const markerElement = element.querySelector(".irve-cluster");
                if (!markerElement) return;

                markerElement.className = `${getClusterClassName(point_count)} irve-cluster`;
              },
            }}
          />
        );
      }

      const p = feature.properties.row;
      const dynamicSummary = getStationDynamicSummary(p);
      const puissanceColor =
        !p.max_power ? "#6b7280"
          : p.max_power >= 150 ? "#ef4444"
            : p.max_power >= 50 ? "#f97316"
              : p.max_power >= 22 ? "#3b82f6"
                : "#22c55e";
      const stationTitle = p.nom_station || p.adresse_station;

      const handleCardClick = (event: MouseEvent<HTMLElement>) => {
        event.preventDefault();
        onStationSelect?.(p);
      };

      return (
        <Marker
          key={`point-${feature.id ?? feature.properties.id}`}
          position={[lat, lng]}
          icon={getPointIcon(
            p.max_power,
            getPointPlugsLabel(Math.max(dynamicSummary.enServiceCount, dynamicSummary.libreCount), p.nbre_pdc),
            puissanceColor,
            `${getPointPlugsLabel(Math.max(dynamicSummary.enServiceCount, dynamicSummary.libreCount), p.nbre_pdc)} | ${p.id_station_itinerance}`
          )}
          eventHandlers={{
            add: (event) => {
              const element = event.target.getElement();
              if (!element) return;

              element.classList.add("irve-point-marker");
            },
          }}
        >
          <Popup maxWidth={350}>
            <Card
              enlargeLink
              linkProps={{
                href: "#station-details",
                onClick: handleCardClick,
              }}
              size="medium"
              title={stationTitle}
              start={<ul className="fr-badges-group">
                <li><Badge severity={getPowerSeverity(p.max_power)}>{p.max_power} kW</Badge></li>
                <li><Badge severity="new">{p.nbre_pdc} PDC</Badge></li>
              </ul>}
              desc={<>
                <div className="irve-popup__grid">
                  {p.condition_acces && (
                    <Badge as="span" small severity={p.condition_acces === ConditionAcces.ACCESS_LIBRE ? "success" : "info"}>
                      {p.condition_acces}
                    </Badge>
                  )}
                  {p.horaires && (
                    <Badge as="span" small noIcon>
                      {p.horaires}
                    </Badge>
                  )}
                </div>
                {p.nom_operateur && <p className="operateur">Operateur : {p.nom_operateur}</p>}
              </>}
            />
          </Popup>
        </Marker>
      );
    });
  }, [clusters, map, supercluster, onStationSelect]);

  return <>{elements}</>;
}
