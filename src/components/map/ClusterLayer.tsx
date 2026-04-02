"use client";

import { useMemo } from "react";
import { CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type SuperclusterType from "supercluster";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

import type { IRVEClusterOrPoint, IRVEPointProperties } from "@/types/irve-runtime";
import { isClusterFeature } from "@/hooks/useMapClusters";
import { ConditionAcces } from "@/types/irve";

const clusterIconCache = new Map<number, L.DivIcon>();

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

interface ClusterLayerProps {
  clusters: IRVEClusterOrPoint[];
  supercluster: SuperclusterType<IRVEPointProperties, Record<string, never>>;
  zoom: number;
}

export function ClusterLayer({ clusters, supercluster, zoom }: ClusterLayerProps) {
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
      const puissanceColor =
        !p.puissance_nominale ? "#6b7280"
          : p.puissance_nominale >= 150 ? "#ef4444"
            : p.puissance_nominale >= 50 ? "#f97316"
              : p.puissance_nominale >= 22 ? "#3b82f6"
                : "#22c55e";

      return (
        <CircleMarker
          key={`point-${feature.id ?? feature.properties.id}`}
          center={[lat, lng]}
          radius={zoom > 14 ? 8 : zoom > 12 ? 6 : 5}
          pathOptions={{
            fillColor: puissanceColor,
            color: "#fff",
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.9,
          }}
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
                href: '#'
              }}
              size="medium"
              title={p.adresse_station}
              start={<ul className="fr-badges-group">
                <li><Badge severity="new">{p.puissance_nominale} Kw</Badge></li>
                <li><Badge >🔌 {p.nbre_pdc} PDC</Badge></li>
              </ul>}
              desc={<>
                <div className="irve-popup__grid">
                  {p.puissance_nominale != null && (
                    <span className="badge" style={{ background: puissanceColor }}>
                      ⚡ {p.puissance_nominale} kW
                    </span>
                  )}
                  {p.nbre_pdc > 0 && (
                    <span className="badge badge--gray">
                      🔌 {p.nbre_pdc} PDC
                    </span>
                  )}
                  {p.condition_acces && (
                    <span className="badge badge--gray">
                      {p.condition_acces === ConditionAcces.ACCESS_LIBRE ? "🔓" : "🔒"} {p.condition_acces}
                    </span>
                  )}
                </div>
                {p.nom_operateur && <p className="operateur">Opérateur : {p.nom_operateur}</p>}
              </>}
            />
          </Popup>
        </CircleMarker>
      );
    });
  }, [clusters, map, supercluster, zoom]);

  return <>{elements}</>;
}
