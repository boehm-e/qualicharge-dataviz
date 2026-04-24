"use client";

import { useCallback, useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { Button } from "@codegouvfr/react-dsfr/Button";

import { useMapClusters } from "@/hooks/useMapClusters";
import {
  buildHeatmapConfig,
  getHeatmapDefinition,
  type HeatmapMode,
} from "@/lib/irve/heatmaps";
import {
  isHeatmapDisplayMode,
  type MapDisplayMode,
} from "@/lib/irve/mapModes";
import type { QualichargeEVSEConsolidated } from "@/types/irve";
import type { IRVEPointFeature } from "@/types/irve-runtime";
import { ClusterLayer } from "./ClusterLayer";
import { HeatmapLayer } from "./HeatmapLayer";
import { MapEvents } from "./MapEvents";

const FRANCE_CENTER: [number, number] = [46.6, 2.3];
const INITIAL_ZOOM = 6;

interface MapViewportProps {
  points: IRVEPointFeature[];
  mode: MapDisplayMode;
  selectedStation: QualichargeEVSEConsolidated | null;
  isPanelOpen: boolean;
  onStationSelect: (station: QualichargeEVSEConsolidated | null) => void;
}

export function MapViewport({
  points,
  mode,
  selectedStation,
  isPanelOpen,
  onStationSelect,
}: MapViewportProps) {
  const { clusters, supercluster, mapRef, zoom, updateView } = useMapClusters(points);

  const filteredStations = useMemo(
    () => points.map((point) => point.properties.row),
    [points]
  );
  const activeHeatmapMode = isHeatmapDisplayMode(mode) ? mode : null;
  const activeHeatmap = useMemo(
    () => (activeHeatmapMode ? getHeatmapDefinition(activeHeatmapMode as HeatmapMode) : null),
    [activeHeatmapMode]
  );
  const heatmapConfig = useMemo(
    () => buildHeatmapConfig(filteredStations, activeHeatmap),
    [activeHeatmap, filteredStations]
  );
  const visibleSelectedStation = useMemo(() => {
    if (!selectedStation) {
      return null;
    }

    return points.some(
      (point) => point.properties.row.id_station_itinerance === selectedStation.id_station_itinerance
    )
      ? selectedStation
      : null;
  }, [points, selectedStation]);
  const zoomPanelOffsetClass = isPanelOpen
    ? "md:left-[calc(var(--irve-map-panel-width)+1.5rem)]"
    : "md:left-4";

  const handleMapReady = useCallback(
    (map: LeafletMap) => {
      mapRef.current = map;
      updateView();
    },
    [mapRef, updateView]
  );

  return (
    <MapContainer
      center={FRANCE_CENTER}
      zoom={INITIAL_ZOOM}
      style={{ height: "100%", width: "100%" }}
      preferCanvas
      zoomAnimation
      markerZoomAnimation
      fadeAnimation
      zoomControl={false}
      attributionControl
    >
      <div className={`pointer-events-none absolute left-4 top-4 z-[1000] transition-[left] duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] md:top-4 ${zoomPanelOffsetClass}`}>
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="bg-white">
            <Button
              priority="secondary"
              iconId="fr-icon-add-line"
              onClick={() => mapRef.current?.zoomIn()}
              title="Zoom avant"
            />
          </div>
          <div className="bg-white">
            <Button
              priority="secondary"
              iconId="fr-icon-subtract-line"
              onClick={() => mapRef.current?.zoomOut()}
              title="Zoom arrière"
            />
          </div>
        </div>
      </div>

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        keepBuffer={4}
      />

      <MapEvents onViewChange={updateView} onMapReady={handleMapReady} />

      {activeHeatmapMode === null ? (
        <ClusterLayer
          clusters={clusters}
          supercluster={supercluster}
          zoom={zoom}
          displayMode={mode === "pricing" ? "pricing" : "markers"}
          selectedStationId={visibleSelectedStation?.id_station_itinerance ?? null}
          onStationSelect={onStationSelect}
        />
      ) : (
        <HeatmapLayer
          points={heatmapConfig.points}
          radius={activeHeatmap?.radius}
          blur={activeHeatmap?.blur}
        />
      )}
    </MapContainer>
  );
}
