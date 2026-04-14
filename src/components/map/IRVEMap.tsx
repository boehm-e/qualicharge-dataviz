"use client";

import { useCallback, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import type { Map as LeafletMap } from "leaflet";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";

import { useIRVEData } from "@/hooks/useIRVEData";
import { useMapClusters } from "@/hooks/useMapClusters";
import {
  buildHeatmapConfig,
  getHeatmapDefinition,
  SERVICE_HEATMAPS,
  type HeatmapMode,
} from "@/lib/irve/heatmaps";
import type { QualichargeEVSEConsolidated } from "@/types/irve";
import {
  DEFAULT_MAP_FILTERS,
  getActiveFilterCount,
  matchesStationFilters,
  type MapFiltersState,
} from "@/lib/irve/mapFilters";
import { ClusterLayer } from "./ClusterLayer";
import { HeatmapLayer } from "./HeatmapLayer";
import { LoadingOverlay } from "./LoadingOverlay";
import { MapHeatmapPanel } from "./MapHeatmapPanel";
import { MapEvents } from "./MapEvents";
import { MapFiltersPanel } from "./MapFiltersPanel";
import { StationDetailsPanel } from "./StationDetailsPanel";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

const FRANCE_CENTER: [number, number] = [46.6, 2.3];
const INITIAL_ZOOM = 6;

export default function IRVEMap() {
  const { points, loadState } = useIRVEData();
  const [filters, setFilters] = useState<MapFiltersState>(DEFAULT_MAP_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isHeatmapPanelOpen, setIsHeatmapPanelOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<QualichargeEVSEConsolidated | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>(null);

  const filteredPoints = useMemo(() => {
    return points.filter((point) => matchesStationFilters(point.properties.row, filters));
  }, [filters, points]);

  const { clusters, supercluster, mapRef, zoom, updateView } = useMapClusters(filteredPoints);

  const filteredStations = useMemo(
    () => filteredPoints.map((point) => point.properties.row),
    [filteredPoints]
  );
  const uniqueStationCount = useMemo(() => {
    const stationIds = new Set<string>();

    for (const station of filteredStations) {
      stationIds.add(station.id_station_itinerance || station.adresse_station);
    }

    return stationIds.size;
  }, [filteredStations]);
  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);
  const filteredPointCount = filteredPoints.length;
  const activeHeatmap = useMemo(() => getHeatmapDefinition(heatmapMode), [heatmapMode]);
  const heatmapConfig = useMemo(() => buildHeatmapConfig(filteredStations, activeHeatmap), [activeHeatmap, filteredStations]);
  const visibleSelectedStation = useMemo(() => {
    if (!selectedStation) {
      return null;
    }

    return filteredPoints.some(
      (point) => point.properties.row.id_station_itinerance === selectedStation.id_station_itinerance
    )
      ? selectedStation
      : null;
  }, [filteredPoints, selectedStation]);
  const hasOpenPanel = isFiltersOpen || isHeatmapPanelOpen || visibleSelectedStation !== null;
  const zoomPanelOffsetClass = hasOpenPanel
    ? "md:left-[calc(var(--irve-map-panel-width)+1.5rem)]"
    : "md:left-4";

  const handleMapReady = useCallback(
    (map: LeafletMap) => {
      mapRef.current = map;
      updateView();
    },
    [mapRef, updateView]
  );

  const toggleListValue = useCallback(<T extends string>(items: T[], value: T) => {
    return items.includes(value)
      ? items.filter((item) => item !== value)
      : [...items, value];
  }, []);

  return (
    <div className="irve-map-wrapper">
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 bg-white p-1.5">
        <Button
          priority={isFiltersOpen ? "primary" : "secondary"}
          size="small"
          iconId="fr-icon-filter-line"
          onClick={() => {
            if (isFiltersOpen === false) setIsHeatmapPanelOpen(false);
            setIsFiltersOpen((open) => !open)
          }}
        >
          Filtres
        </Button>
        <Button
          priority={isHeatmapPanelOpen ? "primary" : "secondary"}
          size="small"
          iconId="fr-icon-line-chart-line"
          onClick={() => {
            if (isHeatmapPanelOpen === false) setIsFiltersOpen(false);
            setIsHeatmapPanelOpen((open) => !open)
          }}
        >
          Analyse
        </Button>

        <Badge severity="new">{uniqueStationCount} stations</Badge>
        {activeFilterCount > 0 && (
          <Badge severity="info">
            {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <MapHeatmapPanel
        isOpen={isHeatmapPanelOpen}
        onClose={() => setIsHeatmapPanelOpen(false)}
        heatmapMode={heatmapMode}
        onModeChange={setHeatmapMode}
        heatmaps={SERVICE_HEATMAPS}
        activeHeatmap={activeHeatmap}
        legendStops={heatmapConfig.stops}
        activePointCount={heatmapConfig.points.length}
      />

      <MapFiltersPanel
        filters={filters}
        isOpen={isFiltersOpen}
        activeCount={activeFilterCount}
        stationCount={uniqueStationCount}
        pointCount={filteredPointCount}
        onClose={() => setIsFiltersOpen(false)}
        onReset={() => setFilters(DEFAULT_MAP_FILTERS)}
        onAccessChange={(access) => setFilters((current) => ({ ...current, access }))}
        onTogglePower={(value) =>
          setFilters((current) => ({
            ...current,
            power: toggleListValue(current.power, value),
          }))
        }
        onToggleConnector={(value) =>
          setFilters((current) => ({
            ...current,
            connectors: toggleListValue(current.connectors, value),
          }))
        }
        onTogglePayment={(value) =>
          setFilters((current) => ({
            ...current,
            payment: toggleListValue(current.payment, value),
          }))
        }
        onItineranceQueryChange={(itineranceQuery) =>
          setFilters((current) =>
            current.itineranceQuery === itineranceQuery
              ? current
              : { ...current, itineranceQuery }
          )
        }
        onOperatorQueryChange={(operatorQuery) =>
          setFilters((current) =>
            current.operatorQuery === operatorQuery
              ? current
              : { ...current, operatorQuery }
          )
        }
        onToggleReservation={() =>
          setFilters((current) => ({ ...current, reservationOnly: !current.reservationOnly }))
        }
        onTogglePmr={() =>
          setFilters((current) => ({ ...current, pmrOnly: !current.pmrOnly }))
        }
        onToggleTwoWheels={() =>
          setFilters((current) => ({ ...current, twoWheelsOnly: !current.twoWheelsOnly }))
        }
      />

      <MapContainer
        center={FRANCE_CENTER}
        zoom={INITIAL_ZOOM}
        style={{ height: "100%", width: "100%" }}
        preferCanvas={true}
        zoomAnimation={true}
        markerZoomAnimation={true}
        fadeAnimation={true}
        zoomControl={false}
        attributionControl={true}
      >
        <div className={`pointer-events-none absolute left-4 top-4 z-[1000] transition-[left] duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] md:top-4 ${zoomPanelOffsetClass}`}>
          <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="bg-white">
              <Button
                priority="secondary"
                iconId="fr-icon-add-line"
                onClick={() => mapRef.current?.zoomIn()}
                title="Label button"
              />
            </div>
            <div className="bg-white">
              <Button
                priority="secondary"
                iconId="fr-icon-subtract-line"
                onClick={() => mapRef.current?.zoomOut()}
                title="Label button"
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

        {heatmapMode === null ? (
          <ClusterLayer
            clusters={clusters}
            supercluster={supercluster}
            zoom={zoom}
            selectedStationId={visibleSelectedStation?.id_station_itinerance ?? null}
            onStationSelect={setSelectedStation}
          />
        ) : (
          <HeatmapLayer
            points={heatmapConfig.points}
            maxIntensity={heatmapConfig.maxIntensity}
            radius={activeHeatmap?.radius}
            blur={activeHeatmap?.blur}
          />
        )}
      </MapContainer>

      <StationDetailsPanel
        station={visibleSelectedStation}
        isOpen={visibleSelectedStation !== null}
        onClose={() => setSelectedStation(null)}
      />

      <LoadingOverlay loadState={loadState} />
    </div>
  );
}
