"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyle } from "./map-style";
import { factoriesToGeoJSON, getBounds } from "./map-utils";
import type { MapFactory } from "./types";

const VERIFICATION_COLORS: Record<string, string> = {
  VERIFIED: "#22c55e",
  PENDING: "#f59e0b",
  UNVERIFIED: "#6b7280",
};

const RISK_STROKE_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "transparent",
};

export type MapCanvasHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitToMarkers: () => void;
};

type MapCanvasProps = {
  factories: MapFactory[];
  theme: "light" | "dark";
  clusteringEnabled: boolean;
  onSelectFactory: (factory: MapFactory | null) => void;
  selectedFactoryId: string | null;
};

const SOURCE_ID = "factories";

function addMapLayers(map: maplibregl.Map, clusteringEnabled: boolean) {
  // Clustered circle layer
  if (clusteringEnabled) {
    map.addLayer({
      id: "clusters",
      type: "circle",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#FF4D15",
        "circle-radius": [
          "step",
          ["get", "point_count"],
          16, 5,
          22, 10,
          28, 25,
          34,
        ],
        "circle-opacity": 0.85,
        "circle-stroke-width": 2,
        "circle-stroke-color": "rgba(255, 77, 21, 0.3)",
      },
    });

    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-size": 12,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      },
      paint: {
        "text-color": "#ffffff",
      },
    });
  }

  // Unclustered points — risk ring (outer circle)
  map.addLayer({
    id: "unclustered-risk-ring",
    type: "circle",
    source: SOURCE_ID,
    filter: clusteringEnabled ? ["!", ["has", "point_count"]] : ["all"],
    paint: {
      "circle-radius": [
        "case",
        ["get", "isPreferred"], 12,
        10,
      ],
      "circle-color": "transparent",
      "circle-stroke-width": [
        "match",
        ["get", "riskLevel"],
        "CRITICAL", 3,
        "HIGH", 2,
        0,
      ],
      "circle-stroke-color": [
        "match",
        ["get", "riskLevel"],
        "CRITICAL", RISK_STROKE_COLORS.CRITICAL,
        "HIGH", RISK_STROKE_COLORS.HIGH,
        "MEDIUM", RISK_STROKE_COLORS.MEDIUM,
        "transparent",
      ],
    },
  });

  // Unclustered points — main dot
  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: SOURCE_ID,
    filter: clusteringEnabled ? ["!", ["has", "point_count"]] : ["all"],
    paint: {
      "circle-radius": [
        "case",
        ["get", "isPreferred"], 8,
        6,
      ],
      "circle-color": [
        "match",
        ["get", "verificationStatus"],
        "VERIFIED", VERIFICATION_COLORS.VERIFIED,
        "PENDING", VERIFICATION_COLORS.PENDING,
        VERIFICATION_COLORS.UNVERIFIED,
      ],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": [
        "match",
        ["get", "verificationStatus"],
        "VERIFIED", "#16a34a",
        "PENDING", "#d97706",
        "#4b5563",
      ],
    },
  });
}

function addSourceAndLayers(
  map: maplibregl.Map,
  factories: MapFactory[],
  clusteringEnabled: boolean
) {
  map.addSource(SOURCE_ID, {
    type: "geojson",
    data: factoriesToGeoJSON(factories),
    cluster: clusteringEnabled,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  });
  addMapLayers(map, clusteringEnabled);
}

function removeSourceAndLayers(map: maplibregl.Map) {
  const layerIds = ["cluster-count", "clusters", "unclustered-point", "unclustered-risk-ring"];
  for (const id of layerIds) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
}

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(
  function MapCanvas({ factories, theme, clusteringEnabled, onSelectFactory, selectedFactoryId }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const factoriesRef = useRef(factories);
    factoriesRef.current = factories;
    const clusteringRef = useRef(clusteringEnabled);
    clusteringRef.current = clusteringEnabled;

    const fitToMarkers = useCallback(() => {
      const map = mapRef.current;
      if (!map) return;
      const bounds = getBounds(factoriesRef.current);
      if (!bounds) return;
      map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 800 });
    }, []);

    useImperativeHandle(ref, () => ({
      zoomIn: () => mapRef.current?.zoomIn({ duration: 300 }),
      zoomOut: () => mapRef.current?.zoomOut({ duration: 300 }),
      resetView: () => {
        mapRef.current?.flyTo({ center: [20, 20], zoom: 1.5, duration: 800 });
      },
      fitToMarkers,
    }));

    // Initialize map
    useEffect(() => {
      if (!containerRef.current) return;

      let map: maplibregl.Map;
      try {
        map = new maplibregl.Map({
          container: containerRef.current,
          style: getMapStyle(theme),
          center: [20, 20],
          zoom: 1.5,
          attributionControl: false,
        });
      } catch {
        // WebGL not available
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#71717a;font-size:13px;">Map requires WebGL support</div>';
        }
        return;
      }

      mapRef.current = map;

      map.on("load", () => {
        addSourceAndLayers(map, factoriesRef.current, clusteringRef.current);

        // Fit to markers on initial load
        const bounds = getBounds(factoriesRef.current);
        if (bounds) {
          map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 });
        }
      });

      // Click cluster → zoom in
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        if (!features.length) return;
        const clusterId = features[0].properties.cluster_id;
        const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geometry = features[0].geometry;
          if (geometry.type === "Point") {
            map.easeTo({
              center: geometry.coordinates as [number, number],
              zoom: zoom,
            });
          }
        });
      });

      // Click marker → select factory
      map.on("click", "unclustered-point", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
        if (!features.length) return;
        const props = features[0].properties;
        const factory = factoriesRef.current.find((f) => f.id === props.id);
        if (factory) onSelectFactory(factory);
      });

      // Click map background → deselect
      map.on("click", (e) => {
        const clusters = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const points = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
        if (clusters.length === 0 && points.length === 0) {
          onSelectFactory(null);
        }
      });

      // Cursor changes
      map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "unclustered-point", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "unclustered-point", () => { map.getCanvas().style.cursor = ""; });

      return () => {
        mapRef.current = null;
        map.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update theme
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      map.setStyle(getMapStyle(theme));
      map.once("style.load", () => {
        addSourceAndLayers(map, factoriesRef.current, clusteringRef.current);
      });
    }, [theme]);

    // Update data / clustering
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      removeSourceAndLayers(map);
      addSourceAndLayers(map, factories, clusteringEnabled);
    }, [factories, clusteringEnabled]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full min-h-[320px] rounded-lg overflow-hidden"
      />
    );
  }
);
