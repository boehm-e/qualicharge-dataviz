"use client";

import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import type { HeatmapGradient, HeatmapPoint } from "@/lib/irve/heatmaps";
import "leaflet.heat";

interface HeatmapLayerProps {
  points: HeatmapPoint[];
  maxIntensity: number;
  gradient?: HeatmapGradient;
  radius?: number;
  blur?: number;
}

export function HeatmapLayer({
  points,
  maxIntensity,
  gradient,
  radius = 26,
  blur = 18,
}: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    const heatLayer = L.heatLayer(
      points.map((point) => [point.lat, point.lng, point.intensity]),
      {
        radius,
        blur,
        maxZoom: 16,
        minOpacity: 0.28,
        max: Math.max(maxIntensity, 1),
        gradient,
      }
    );

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [blur, gradient, map, maxIntensity, points, radius]);

  return null;
}
