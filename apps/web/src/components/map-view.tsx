"use client";

import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { LAYER_COLORS } from "@/lib/gis-layers";
import type { GeoJsonFeatureCollection } from "@/lib/gis-types";

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

interface MapViewProps {
  data: GeoJsonFeatureCollection;
  onFeatureClick?: (properties: Record<string, unknown>) => void;
}

export function MapView({ data, onFeatureClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [-54.9614, -20.9297],
      zoom: 11,
    });
    map.addControl(new NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];

    if (data.features.length === 0) return;

    const bounds = new LngLatBounds();

    for (const feature of data.features) {
      const [lng, lat] = feature.geometry.coordinates;
      const layer = String(feature.properties.layer ?? "property");
      const color = (LAYER_COLORS as Record<string, string>)[layer] ?? "#6b7280";

      const el = document.createElement("div");
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "50%";
      el.style.background = color;
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 0 2px rgba(0,0,0,0.5)";
      el.style.cursor = "pointer";

      const marker = new Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(
          new Popup({ offset: 12 }).setText(
            String(feature.properties.label ?? layer),
          ),
        )
        .addTo(map);

      el.addEventListener("click", () => onFeatureClick?.(feature.properties));

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }
  }, [data, onFeatureClick]);

  return <div ref={containerRef} className="h-full w-full" />;
}
