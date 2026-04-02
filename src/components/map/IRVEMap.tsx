"use client";

import { useCallback } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";

import { useIRVEData } from "@/hooks/useIRVEData";
import { useMapClusters } from "@/hooks/useMapClusters";
import { MapEvents } from "./MapEvents";
import { ClusterLayer } from "./ClusterLayer";
import { LoadingOverlay } from "./LoadingOverlay";
import { StatsBar } from "./StatsBar";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

// France bounding box
const FRANCE_CENTER: [number, number] = [46.6, 2.3];
const INITIAL_ZOOM = 6;

export default function IRVEMap() {
  const { points, loadState } = useIRVEData();
  const { clusters, supercluster, mapRef, zoom, updateView } = useMapClusters(points);
  console.log("clusters", clusters[0], supercluster)
  const handleMapReady = useCallback(
    (map: LeafletMap) => {
      mapRef.current = map;
      updateView();
    },
    [mapRef, updateView]
  );

  return (
    <div className="irve-map-wrapper">
      <StatsBar loadState={loadState} visibleCount={clusters.length} />

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
        />
      </MapContainer>

      <LoadingOverlay loadState={loadState} />
    </div>
  );
}
