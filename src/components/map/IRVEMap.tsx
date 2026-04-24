"use client";

import { useMemo, useState } from "react";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { SegmentedControl, type SegmentedControlProps } from "@codegouvfr/react-dsfr/SegmentedControl";

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
import { PricingModal, pricingModal } from "../PricingModal";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

export default function IRVEMap() {
  const { points, loadState } = useIRVEData();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isHeatmapPanelOpen, setIsHeatmapPanelOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<QualichargeEVSEConsolidated | null>(null);
  const [mapDisplayMode, setMapDisplayMode] = useState<MapDisplayMode>("markers");
  const [onlyStationsWithPrice, setOnlyStationsWithPrice] = useState(false);
  const {
    filters,
    itineranceInputValue,
    selectedOperators,
    activeFilterCount,
    setItineranceInputValue,
    setSelectedOperators,
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
    () => mapModes.find((entry) => entry.value === mapDisplayMode) ?? mapModes[0],
    [mapModes, mapDisplayMode]
  );
  const activeHeatmapMode = isHeatmapDisplayMode(mapDisplayMode) ? mapDisplayMode : null;

  const { operatorOptions, operatorsWithTarification, operatorsWithoutTarification } = useMemo(() => {
    const withTarification = new Set<string>();
    const withoutTarification = new Set<string>();

    for (const point of points) {
      const station = point.properties.row;
      const hasTarification = station.tarification && station.tarification.trim().length > 0 && !['Inconnu', '-', 'true', 'NULL'].includes(station.tarification.trim());

      if (station.nom_operateur) {
        (hasTarification ? withTarification : withoutTarification).add(station.nom_operateur);
      }
      if (station.nom_amenageur) {
        (hasTarification ? withTarification : withoutTarification).add(station.nom_amenageur);
      }
    }

    // If an operator appears in both sets (has some stations with and some without tarification),
    // it should be considered as having tarification
    for (const operator of withTarification) {
      withoutTarification.delete(operator);
    }

    const enabledOperators = Array.from(withTarification)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));

    const disabledOperators = Array.from(withoutTarification)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));

    const allOperators = [...enabledOperators, ...disabledOperators];

    return {
      operatorOptions: allOperators,
      operatorsWithTarification: Array.from(withTarification).sort((a, b) => a.localeCompare(b)),
      operatorsWithoutTarification: Array.from(withoutTarification).sort((a, b) => a.localeCompare(b)),
    };
  }, [points]);

  const filteredPoints = useMemo(() => {
    return points.filter((point) => {
      const matchesFilters = matchesStationFilters(point.properties.row, filters);
      if (!matchesFilters) {
        return false;
      }

      if (mapDisplayMode === "pricing" && onlyStationsWithPrice) {
        return point.properties.row.summary.price_per_kwh !== null;
      }

      return true;
    });
  }, [filters, mapDisplayMode, onlyStationsWithPrice, points]);

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
      <div className="absolute top-3 right-3 z-[10000] flex items-center gap-2">
        <div className="flex items-center bg-white shadow-sm rounded-sm p-1 gap-1">
          <SegmentedControl
            hideLegend
            segments={[
              {
                label: "Vue détaillée",
                iconId: "fr-icon-road-map-line",
                nativeInputProps: {
                  checked: mapDisplayMode === "markers",
                  onChange: () => setMapDisplayMode("markers"),
                },
              },
              {
                label: "Tarification",
                iconId: "fr-icon-money-euro-circle-line",
                nativeInputProps: {
                  checked: mapDisplayMode === "pricing",
                  onChange: () => {
                    setMapDisplayMode("pricing");
                    pricingModal.open();
                  },
                },
              },
              ...mapModes
                .filter((m) => m.kind === "heatmap")
                .map((mapMode) => ({
                  label: mapMode.shortLabel,
                  iconId: "fr-icon-fire-line" as const,
                  nativeInputProps: {
                    checked: mapDisplayMode === mapMode.value,
                    onChange: () => setMapDisplayMode(mapMode.value),
                  },
                })),
            ] as unknown as [SegmentedControlProps.SegmentWithoutIcon, SegmentedControlProps.SegmentWithoutIcon]}
          />

          <Button
            priority={isHeatmapPanelOpen ? "primary" : "tertiary no outline"}
            size="small"
            iconId="fr-icon-information-line"
            title="Informations sur la vue courante"
            onClick={() => {
              if (isHeatmapPanelOpen === false) {
                setIsFiltersOpen(false);
              }
              setIsHeatmapPanelOpen((open) => !open);
            }}
          />

          <Button
            priority={isFiltersOpen ? "primary" : "secondary"}
            // size="small"
            iconId="fr-icon-filter-line"
            onClick={() => {
              if (isFiltersOpen === false) {
                setIsHeatmapPanelOpen(false);
              }
              setIsFiltersOpen((open) => !open);
            }}
          >
            Filtres
          </Button>
          {/* <Badge severity="new">{uniqueStationCount} stations</Badge> */}
          {activeFilterCount > 0 && (
            <Badge severity="info">
              {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      <MapAnalysisPanel
        isOpen={isHeatmapPanelOpen}
        onClose={() => setIsHeatmapPanelOpen(false)}
        mode={mapDisplayMode}
        onModeChange={setMapDisplayMode}
        modes={mapModes}
        activeMode={activeMode}
        activeHeatmap={activeHeatmap}
        legendStops={activeHeatmap ? activeHeatmap.getStops(activeHeatmap.legendKind === "absolute" ? filteredStations.length : 1) : []}
        activePointCount={filteredStations.length}
        onlyStationsWithPrice={onlyStationsWithPrice}
        onOnlyStationsWithPriceChange={setOnlyStationsWithPrice}
      />

      <MapFiltersPanel
        filters={filters}
        itineranceInputValue={itineranceInputValue}
        isOpen={isFiltersOpen}
        activeCount={activeFilterCount}
        stationCount={uniqueStationCount}
        pointCount={filteredPointCount}
        operatorOptions={operatorOptions}
        operatorsWithoutTarification={operatorsWithoutTarification}
        mapDisplayMode={mapDisplayMode}
        onClose={() => setIsFiltersOpen(false)}
        onReset={resetFilters}
        onAccessChange={setAccess}
        onTogglePower={togglePower}
        onToggleConnector={toggleConnector}
        onTogglePayment={togglePayment}
        onItineranceQueryChange={setItineranceInputValue}
        onSelectedOperatorsChange={setSelectedOperators}
        onToggleReservation={toggleReservation}
        onTogglePmr={togglePmr}
        onToggleTwoWheels={toggleTwoWheels}
      />

      <MapViewport
        points={filteredPoints}
        mode={mapDisplayMode}
        selectedStation={visibleSelectedStation}
        isPanelOpen={hasOpenPanel}
        onStationSelect={(station) => {
          setIsFiltersOpen(false);
          setIsHeatmapPanelOpen(false);
          setSelectedStation(station)
          console.log("STTATION", station)
        }}
      />

      <StationDetailsPanel
        station={visibleSelectedStation}
        isOpen={visibleSelectedStation !== null}
        onClose={() => setSelectedStation(null)}
      />

      <LoadingOverlay loadState={loadState} />

      <PricingModal />
    </div>
  );
}
