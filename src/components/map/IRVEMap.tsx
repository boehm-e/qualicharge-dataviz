"use client";

import { useCallback, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";

import { useIRVEData } from "@/hooks/useIRVEData";
import { useMapClusters } from "@/hooks/useMapClusters";
import type { QualichargeEVSEStatique } from "@/types/irve";
import { MapEvents } from "./MapEvents";
import { ClusterLayer } from "./ClusterLayer";
import { LoadingOverlay } from "./LoadingOverlay";
import { StationDetailsPanel } from "./StationDetailsPanel";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

// France bounding box
const FRANCE_CENTER: [number, number] = [46.6, 2.3];
const INITIAL_ZOOM = 6;

export default function IRVEMap() {
  const { points, loadState } = useIRVEData();
  const { clusters, supercluster, mapRef, zoom, updateView } = useMapClusters(points);
  const [selectedStation, setSelectedStation] = useState<QualichargeEVSEStatique | null>(null);

  const handleMapReady = useCallback(
    (map: LeafletMap) => {
      mapRef.current = map;
      updateView();
    },
    [mapRef, updateView]
  );

  return (
    <div className="irve-map-wrapper">

      <MapContainer
        center={FRANCE_CENTER}
        zoom={INITIAL_ZOOM}
        style={{ height: "100%", width: "100%" }}
        preferCanvas={true}
        zoomAnimation={true}
        markerZoomAnimation={true}
        fadeAnimation={true}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          keepBuffer={4}
        />

        <MapEvents onViewChange={updateView} onMapReady={handleMapReady} />

        <ClusterLayer
          clusters={clusters}
          supercluster={supercluster}
          zoom={zoom}
          onStationSelect={setSelectedStation}
        />
      </MapContainer>

      <StationDetailsPanel
        station={selectedStation}
        isOpen={selectedStation !== null}
        onClose={() => setSelectedStation(null)}
      />

      <LoadingOverlay loadState={loadState} />
    </div>
  );
}
