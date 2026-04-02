"use client";

import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";

export interface MapEventsProps {
  onViewChange: () => void;
  onMapReady: (map: LeafletMap) => void;
}

export function MapEvents({ onViewChange, onMapReady }: MapEventsProps) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
    onViewChange();
  }, [map, onMapReady, onViewChange]);

  useMapEvents({
    moveend: onViewChange,
    zoomend: onViewChange,
  });

  return null;
}
