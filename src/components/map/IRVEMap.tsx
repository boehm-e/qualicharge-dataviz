"use client";

import { useMemo, useState } from "react";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";

import { useMapFiltersState } from "@/hooks/useMapFiltersState";
import { useIRVEData } from "@/hooks/useIRVEData";
import {
  getHeatmapDefinition,
  SERVICE_HEATMAPS,
  type HeatmapMode,
} from "@/lib/irve/heatmaps";
import {
  buildMapModes,
  isHeatmapDisplayMode,
  type MapDisplayMode,
} from "@/lib/irve/mapModes";
import type { QualichargeEVSEConsolidated } from "@/types/irve";
import { matchesStationFilters } from "@/lib/irve/mapFilters";
import { LoadingOverlay } from "./LoadingOverlay";
import { MapAnalysisPanel } from "./MapAnalysisPanel";
import { MapFiltersPanel } from "./MapFiltersPanel";
import { MapViewport } from "./MapViewport";
import { StationDetailsPanel } from "./StationDetailsPanel";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

export default function IRVEMap() {
  const { points, loadState } = useIRVEData();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isHeatmapPanelOpen, setIsHeatmapPanelOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<QualichargeEVSEConsolidated | null>(null);
  const [mode, setMode] = useState<MapDisplayMode>("markers");
  const [onlyStationsWithPrice, setOnlyStationsWithPrice] = useState(false);
  const {
    filters,
    itineranceInputValue,
    operatorInputValue,
    activeFilterCount,
    setItineranceInputValue,
    setOperatorInputValue,
    resetFilters,
    setAccess,
    togglePower,
    toggleConnector,
    togglePayment,
    toggleReservation,
    togglePmr,
    toggleTwoWheels,
  } = useMapFiltersState();

  const mapModes = useMemo(() => buildMapModes(SERVICE_HEATMAPS), []);
  const activeMode = useMemo(
    () => mapModes.find((entry) => entry.value === mode) ?? mapModes[0],
    [mapModes, mode]
  );
  const activeHeatmapMode = isHeatmapDisplayMode(mode) ? mode : null;

  const filteredPoints = useMemo(() => {
    return points.filter((point) => {
      const matchesFilters = matchesStationFilters(point.properties.row, filters);
      if (!matchesFilters) {
        return false;
      }

      if (mode === "pricing" && onlyStationsWithPrice) {
        return point.properties.row.summary.price_per_kwh !== null;
      }

      return true;
    });
  }, [filters, mode, onlyStationsWithPrice, points]);

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
  const filteredPointCount = filteredPoints.length;
  const activeHeatmap = useMemo(
    () => (activeHeatmapMode ? getHeatmapDefinition(activeHeatmapMode as HeatmapMode) : null),
    [activeHeatmapMode]
  );
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

  return (
    <div className="irve-map-wrapper">
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 flex flex-col">


        <div className="flex bg-white">
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
          <Badge severity="new">{uniqueStationCount} stations</Badge>
          {activeFilterCount > 0 && (
            <Badge severity="info">
              {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>


        <div className="flex bg-white">
          <Select
            label={<div className="flex items-center justify-between pl-3">
              <p className="m-0! text-md"><b>Type de vue</b></p>
              <Button
                priority={isHeatmapPanelOpen ? "primary" : "tertiary no outline"}
                size="small"
                iconId="fr-icon-information-line"
                title="Informations sur la vue courante"
                onClick={() => {
                  if (isHeatmapPanelOpen === false) setIsFiltersOpen(false);
                  setIsHeatmapPanelOpen((open) => !open)
                }}
              />
            </div>}
            nativeSelectProps={{
              value: mode,
              className:"mt-0!",
              onChange: (event) => {
                setMode(event.target.value as MapDisplayMode);
              },
            }}
          >
            {mapModes.map((mapMode) => (
              <option key={mapMode.value} value={mapMode.value}>
                {mapMode.shortLabel}
              </option>
            ))}
          </Select>
        </div>

      </div>

      <MapAnalysisPanel
        isOpen={isHeatmapPanelOpen}
        onClose={() => setIsHeatmapPanelOpen(false)}
        mode={mode}
        onModeChange={setMode}
        modes={mapModes}
        activeMode={activeMode}
        activeHeatmap={activeHeatmap}
        legendStops={activeHeatmap ? activeHeatmap.getStops(1) : []}
        activePointCount={filteredStations.length}
        onlyStationsWithPrice={onlyStationsWithPrice}
        onOnlyStationsWithPriceChange={setOnlyStationsWithPrice}
      />

      <MapFiltersPanel
        filters={filters}
        itineranceInputValue={itineranceInputValue}
        operatorInputValue={operatorInputValue}
        isOpen={isFiltersOpen}
        activeCount={activeFilterCount}
        stationCount={uniqueStationCount}
        pointCount={filteredPointCount}
        onClose={() => setIsFiltersOpen(false)}
        onReset={resetFilters}
        onAccessChange={setAccess}
        onTogglePower={togglePower}
        onToggleConnector={toggleConnector}
        onTogglePayment={togglePayment}
        onItineranceQueryChange={setItineranceInputValue}
        onOperatorQueryChange={setOperatorInputValue}
        onToggleReservation={toggleReservation}
        onTogglePmr={togglePmr}
        onToggleTwoWheels={toggleTwoWheels}
      />

      <MapViewport
        points={filteredPoints}
        mode={mode}
        selectedStation={visibleSelectedStation}
        isPanelOpen={hasOpenPanel}
        onStationSelect={setSelectedStation}
      />

      <StationDetailsPanel
        station={visibleSelectedStation}
        isOpen={visibleSelectedStation !== null}
        onClose={() => setSelectedStation(null)}
      />

      <LoadingOverlay loadState={loadState} />
    </div>
  );
}
