"use client";

import { useMemo } from "react";
import { DivIcon } from "leaflet";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type SuperclusterType from "supercluster";

import type { IRVEClusterOrPoint, IRVEPointProperties } from "@/types/irve-runtime";
import { isClusterFeature } from "@/hooks/useMapClusters";
import { getStationDynamicSummary } from "@/lib/irve/formatters";

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
  if (!total) return "-/- PDC";
  return `${available}/${total} PDC`;
}

function getPointIcon(
  power: number | null | undefined,
  plugsLabel: string,
  color: string,
  isSelected: boolean,
  debug?: string
): DivIcon {
  const powerLabel = getPointPowerLabel(power);
  const cacheKey = `${powerLabel}|${plugsLabel}|${color}|${isSelected ? "selected" : "default"}`;
  const cached = pointIconCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const icon = L.divIcon({
    html: `<div class="irve-point-card${isSelected ? " is-selected" : ""}">
      <div class="irve-point-card__power" style="background:${color}">
        ${powerLabel}
      </div>
      <div class="irve-point-card__meta">
        ${plugsLabel}
      </div>
      ${debug ? `<div>${debug}</div>`:``}
      <div class="irve-point-card__tip"></div>
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
  selectedStationId?: string | null;
  onStationSelect?: (station: IRVEPointProperties["row"]) => void;
}

export function ClusterLayer({
  clusters,
  supercluster,
  zoom,
  selectedStationId,
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
      const isSelected = p.id_station_itinerance === selectedStationId;
      const dynamicSummary = getStationDynamicSummary(p);
      const puissanceColor =
        !p.summary.max_power ? "#6b7280"
          : p.summary.max_power >= 150 ? "#ef4444"
            : p.summary.max_power >= 50 ? "#f97316"
              : p.summary.max_power >= 22 ? "#3b82f6"
                : "#22c55e";
      return (
        <Marker
          key={`point-${feature.id ?? feature.properties.id}`}
          position={[lat, lng]}
          icon={getPointIcon(
            p.summary.max_power,
            getPointPlugsLabel(dynamicSummary.availableCount, p.nbre_pdc),
            puissanceColor,
            isSelected,
            // `${getPointPlugsLabel(dynamicSummary.availableCount, p.nbre_pdc)} | ${p.id_station_itinerance}`
          )}
          zIndexOffset={isSelected ? 2000 : 0}
          eventHandlers={{
            click: () => {
              const panelWidth = window.innerWidth >= 768 ? Math.min(608, window.innerWidth) : 0;
              const offsetX = panelWidth > 0 ? panelWidth / 2 : 0;
              const targetPoint = map.project([lat, lng], Math.max(map.getZoom(), 14)).subtract([offsetX, 0]);
              const targetLatLng = map.unproject(targetPoint, Math.max(map.getZoom(), 14));

              map.setView(targetLatLng, Math.max(map.getZoom(), 14), { animate: true });
              onStationSelect?.(p);
            },
            add: (event) => {
              const element = event.target.getElement();
              if (!element) return;

              element.classList.add("irve-point-marker");
            },
          }}
        />
      );
    });
  }, [clusters, map, selectedStationId, supercluster, onStationSelect]);

  return <>{elements}</>;
}
