"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyle } from "./map-style";
import { factoriesToGeoJSON, getBounds, factoriesToRoutesGeoJSON, routeMidpointsGeoJSON } from "./map-utils";
import { DESTINATION_COORDS } from "./arc-utils";
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

const ROUTE_SOURCE_ID = "shipping-routes";
const MIDPOINTS_SOURCE_ID = "route-midpoints";
const DESTINATION_SOURCE_ID = "destination";
const ROUTE_LAYER_IDS = [
  "route-ship-ok", "route-ship-delayed", "route-ship-disrupted",
  "route-truck-ok", "route-truck-delayed", "route-truck-disrupted",
  "route-midpoint-icons", "destination-circle", "destination-label",
];

export type MapCanvasHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitToMarkers: () => void;
  easeTo: (lng: number, lat: number) => void;
};

type MapCanvasProps = {
  factories: MapFactory[];
  theme: "light" | "dark";
  clusteringEnabled: boolean;
  routesEnabled: boolean;
  onSelectFactory: (factory: MapFactory | null) => void;
  selectedFactoryId: string | null;
};

const SOURCE_ID = "factories";

function addMapLayers(map: maplibregl.Map, clusteringEnabled: boolean) {
  // Guard: if layers already exist, skip — prevents duplicate layer errors
  if (map.getLayer("unclustered-point")) return;

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

function addRouteLayers(map: maplibregl.Map, factories: MapFactory[]) {
  // Idempotent: if sources already exist, just update their data and bail out.
  // This prevents "Source already exists" errors from concurrent callers
  // (e.g. style.load callback racing with the data/routes useEffect).
  const routeData = factoriesToRoutesGeoJSON(factories);
  const midpointData = routeMidpointsGeoJSON(factories);
  const destData: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: DESTINATION_COORDS },
        properties: { label: "HQ" },
      },
    ],
  };

  if (map.getSource(ROUTE_SOURCE_ID)) {
    (map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(routeData);
    if (map.getSource(MIDPOINTS_SOURCE_ID)) {
      (map.getSource(MIDPOINTS_SOURCE_ID) as maplibregl.GeoJSONSource).setData(midpointData);
    }
    if (map.getSource(DESTINATION_SOURCE_ID)) {
      (map.getSource(DESTINATION_SOURCE_ID) as maplibregl.GeoJSONSource).setData(destData);
    }
    return;
  }

  // Clean slate: remove any leftover layers (source gone but layers lingering is unlikely
  // but defensive). Then add sources + layers fresh.
  removeRouteLayers(map);

  // Route lines source
  map.addSource(ROUTE_SOURCE_ID, {
    type: "geojson",
    data: routeData,
  });

  // Midpoints source
  map.addSource(MIDPOINTS_SOURCE_ID, {
    type: "geojson",
    data: midpointData,
  });

  // Destination marker source
  map.addSource(DESTINATION_SOURCE_ID, {
    type: "geojson",
    data: destData,
  });

  // Route line layers — ship and truck per status, rendered BEFORE point layers
  const beforeLayer = map.getLayer("unclustered-risk-ring") ? "unclustered-risk-ring" : undefined;

  const statusConfigs: Array<{ suffix: string; filter: any; color: string }> = [
    { suffix: "ok",       filter: ["any", ["==", ["get", "routeStatus"], "PENDING"], ["==", ["get", "routeStatus"], "IN_PROGRESS"]], color: "#22c55e" },
    { suffix: "delayed",  filter: ["==", ["get", "routeStatus"], "DELAYED"],   color: "#f59e0b" },
    { suffix: "disrupted",filter: ["==", ["get", "routeStatus"], "DISRUPTED"], color: "#ef4444" },
  ];

  for (const { suffix, filter, color } of statusConfigs) {
    // Ship lines — thicker, solid
    map.addLayer(
      {
        id: `route-ship-${suffix}`,
        type: "line",
        source: ROUTE_SOURCE_ID,
        filter: ["all", filter, ["==", ["get", "transportMethod"], "ship"]],
        paint: {
          "line-color": color,
          "line-width": ["+", ["get", "routeWidth"], 0.5],
          "line-opacity": 0.75,
        },
        layout: { "line-cap": "round", "line-join": "round" },
      },
      beforeLayer
    );

    // Truck lines — thinner, slightly transparent
    map.addLayer(
      {
        id: `route-truck-${suffix}`,
        type: "line",
        source: ROUTE_SOURCE_ID,
        filter: ["all", filter, ["==", ["get", "transportMethod"], "truck"]],
        paint: {
          "line-color": color,
          "line-width": ["max", ["-", ["get", "routeWidth"], 0.5], 1],
          "line-opacity": 0.55,
        },
        layout: { "line-cap": "round", "line-join": "round" },
      },
      beforeLayer
    );
  }

  // Transport method icons at arc midpoints
  map.addLayer({
    id: "route-midpoint-icons",
    type: "symbol",
    source: MIDPOINTS_SOURCE_ID,
    layout: {
      "text-field": ["get", "icon"],
      "text-size": 14,
      "text-allow-overlap": true,
    },
  });

  // Destination circle
  map.addLayer(
    {
      id: "destination-circle",
      type: "circle",
      source: DESTINATION_SOURCE_ID,
      paint: {
        "circle-radius": 8,
        "circle-color": "#FF4D15",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.9,
      },
    }
  );

  // Destination label
  map.addLayer({
    id: "destination-label",
    type: "symbol",
    source: DESTINATION_SOURCE_ID,
    layout: {
      "text-field": "HQ",
      "text-size": 9,
      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      "text-offset": [0, -1.5],
    },
    paint: {
      "text-color": "#FF4D15",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1,
    },
  });
}

function removeRouteLayers(map: maplibregl.Map) {
  for (const id of ROUTE_LAYER_IDS) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
  if (map.getSource(MIDPOINTS_SOURCE_ID)) map.removeSource(MIDPOINTS_SOURCE_ID);
  if (map.getSource(DESTINATION_SOURCE_ID)) map.removeSource(DESTINATION_SOURCE_ID);
}

function addSourceAndLayers(
  map: maplibregl.Map,
  factories: MapFactory[],
  clusteringEnabled: boolean
) {
  // Idempotent: if the source already exists, update its data and bail out.
  // Clustering config can't change on an existing source, so if that changed
  // we need a full remove+re-add (handled by the caller doing removeSourceAndLayers first).
  if (map.getSource(SOURCE_ID)) {
    (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).setData(
      factoriesToGeoJSON(factories)
    );
    return;
  }

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
  function MapCanvas({ factories, theme, clusteringEnabled, routesEnabled, onSelectFactory, selectedFactoryId }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const factoriesRef = useRef(factories);
    factoriesRef.current = factories;
    const clusteringRef = useRef(clusteringEnabled);
    clusteringRef.current = clusteringEnabled;
    const routesRef = useRef(routesEnabled);
    routesRef.current = routesEnabled;
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
      easeTo: (lng: number, lat: number) => {
        mapRef.current?.easeTo({
          center: [lng - 0.02, lat], // offset left so marker isn't hidden by drawer
          zoom: Math.max(mapRef.current.getZoom(), 8),
          duration: 600,
        });
      },
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
        // Add routes BEFORE points so they render underneath
        if (routesRef.current) {
          addRouteLayers(map, factoriesRef.current);

        }

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
        if (routesRef.current) {
          addRouteLayers(map, factoriesRef.current);

        }
        addSourceAndLayers(map, factoriesRef.current, clusteringRef.current);
      });
    }, [theme]);

    // Update data / clustering / routes
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      // Remove everything and re-add
      removeRouteLayers(map);
      removeSourceAndLayers(map);

      if (routesEnabled) {
        addRouteLayers(map, factories);
      }
      addSourceAndLayers(map, factories, clusteringEnabled);
    }, [factories, clusteringEnabled, routesEnabled]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full min-h-[320px] rounded-lg overflow-hidden"
      />
    );
  }
);
