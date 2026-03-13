"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyle } from "./map-style";
import { factoriesToGeoJSON, getBounds, factoriesToRoutesGeoJSON, routeMidpointsGeoJSON, routeStopsGeoJSON, liveShipmentsGeoJSON } from "./map-utils";
import { DESTINATION_COORDS } from "./arc-utils";
import type { MapFactory, LiveShipment } from "./types";

const VERIFICATION_COLORS: Record<string, string> = {
  VERIFIED: "#64748b",   // slate-500 — subtle, professional
  PENDING: "#94a3b8",    // slate-400
  UNVERIFIED: "#cbd5e1", // slate-300
};

const RISK_STROKE_COLORS: Record<string, string> = {
  CRITICAL: "#f87171",   // red-400 (softer)
  HIGH: "#fb923c",       // orange-400 (softer)
  MEDIUM: "#fbbf24",     // amber-400
  LOW: "transparent",
};

const ROUTE_SOURCE_ID = "shipping-routes";
const MIDPOINTS_SOURCE_ID = "route-midpoints";
const DESTINATION_SOURCE_ID = "destination";
const STOPS_SOURCE_ID = "route-stops";
const LIVE_SHIPMENTS_SOURCE_ID = "live-shipments";
const ROUTE_LAYER_IDS = [
  "route-ship-ok", "route-ship-delayed", "route-ship-disrupted",
  "route-truck-ok", "route-truck-delayed", "route-truck-disrupted",
  "route-midpoint-icons", "destination-circle", "destination-label",
  "route-stop-circles", "route-stop-icons",
];
const LIVE_SHIPMENT_LAYER_IDS = [
  "live-shipment-pulse", "live-shipment-markers", "live-shipment-labels",
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
  liveShipments?: LiveShipment[];
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
        "circle-color": "#475569",   // slate-600
        "circle-radius": [
          "step",
          ["get", "point_count"],
          14, 5,
          18, 10,
          22, 25,
          26,
        ],
        "circle-opacity": 0.9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "rgba(71, 85, 105, 0.3)",
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
      "circle-stroke-color": "#ffffff",
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
    if (map.getSource(STOPS_SOURCE_ID)) {
      (map.getSource(STOPS_SOURCE_ID) as maplibregl.GeoJSONSource).setData(routeStopsGeoJSON(factories));
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
    { suffix: "ok",       filter: ["any", ["==", ["get", "routeStatus"], "PENDING"], ["==", ["get", "routeStatus"], "IN_PROGRESS"]], color: "#94a3b8" },
    { suffix: "delayed",  filter: ["==", ["get", "routeStatus"], "DELAYED"],   color: "#d97706" },
    { suffix: "disrupted",filter: ["==", ["get", "routeStatus"], "DISRUPTED"], color: "#dc2626" },
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
      "text-size": 11,
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
        "circle-radius": 7,
        "circle-color": "#334155",
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
      "text-color": "#334155",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1,
    },
  });

  // ─── Route stop markers ─────────────────────────────────────────────────
  const stopsData = routeStopsGeoJSON(factories);

  map.addSource(STOPS_SOURCE_ID, {
    type: "geojson",
    data: stopsData,
  });

  // Stop circles (small, semi-transparent)
  map.addLayer({
    id: "route-stop-circles",
    type: "circle",
    source: STOPS_SOURCE_ID,
    paint: {
      "circle-radius": [
        "match", ["get", "stopType"],
        "factory", 5,
        "port", 5,
        "harbor", 5,
        "destination", 5,
        4,
      ],
      "circle-color": [
        "match", ["get", "stopType"],
        "factory", "#64748b",     // slate-500
        "port", "#64748b",        // slate-500
        "strait", "#94a3b8",     // slate-400
        "canal", "#94a3b8",      // slate-400
        "harbor", "#475569",     // slate-600
        "customs", "#475569",    // slate-600
        "hub", "#94a3b8",        // slate-400
        "destination", "#475569", // slate-600
        "#94a3b8",
      ],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.9,
    },
  });

  // Stop icon labels
  map.addLayer({
    id: "route-stop-icons",
    type: "symbol",
    source: STOPS_SOURCE_ID,
    layout: {
      "text-field": ["get", "icon"],
      "text-size": 11,
      "text-offset": [0, -1.3],
      "text-allow-overlap": true,
    },
  });
}

function addLiveShipmentLayers(map: maplibregl.Map, shipments: LiveShipment[]) {
  const data = liveShipmentsGeoJSON(shipments);

  if (map.getSource(LIVE_SHIPMENTS_SOURCE_ID)) {
    (map.getSource(LIVE_SHIPMENTS_SOURCE_ID) as maplibregl.GeoJSONSource).setData(data);
    return;
  }

  removeLiveShipmentLayers(map);

  map.addSource(LIVE_SHIPMENTS_SOURCE_ID, { type: "geojson", data });

  // Pulsing outer ring
  map.addLayer({
    id: "live-shipment-pulse",
    type: "circle",
    source: LIVE_SHIPMENTS_SOURCE_ID,
    paint: {
      "circle-radius": 12,
      "circle-color": [
        "match", ["get", "trackingStatus"],
        "CUSTOMS", "#d97706",
        "EXCEPTION", "#dc2626",
        "#3b82f6", // blue for in-transit
      ],
      "circle-opacity": 0.2,
      "circle-stroke-width": 0,
    },
  });

  // Solid marker dot
  map.addLayer({
    id: "live-shipment-markers",
    type: "circle",
    source: LIVE_SHIPMENTS_SOURCE_ID,
    paint: {
      "circle-radius": 6,
      "circle-color": [
        "match", ["get", "trackingStatus"],
        "CUSTOMS", "#d97706",
        "EXCEPTION", "#dc2626",
        "#3b82f6",
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.95,
    },
  });

  // Order number label
  map.addLayer({
    id: "live-shipment-labels",
    type: "symbol",
    source: LIVE_SHIPMENTS_SOURCE_ID,
    layout: {
      "text-field": ["get", "orderNumber"],
      "text-size": 10,
      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      "text-offset": [0, -1.5],
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": "#3b82f6",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1,
    },
  });
}

function removeLiveShipmentLayers(map: maplibregl.Map) {
  for (const id of LIVE_SHIPMENT_LAYER_IDS) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(LIVE_SHIPMENTS_SOURCE_ID)) map.removeSource(LIVE_SHIPMENTS_SOURCE_ID);
}

function removeRouteLayers(map: maplibregl.Map) {
  for (const id of ROUTE_LAYER_IDS) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
  if (map.getSource(MIDPOINTS_SOURCE_ID)) map.removeSource(MIDPOINTS_SOURCE_ID);
  if (map.getSource(DESTINATION_SOURCE_ID)) map.removeSource(DESTINATION_SOURCE_ID);
  if (map.getSource(STOPS_SOURCE_ID)) map.removeSource(STOPS_SOURCE_ID);
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
  function MapCanvas({ factories, theme, clusteringEnabled, routesEnabled, liveShipments = [], onSelectFactory, selectedFactoryId }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const stopPopupRef = useRef<maplibregl.Popup | null>(null);
    const factoriesRef = useRef(factories);
    factoriesRef.current = factories;
    const clusteringRef = useRef(clusteringEnabled);
    clusteringRef.current = clusteringEnabled;
    const routesRef = useRef(routesEnabled);
    routesRef.current = routesEnabled;
    const liveShipmentsRef = useRef(liveShipments);
    liveShipmentsRef.current = liveShipments;
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

        // Live shipment markers on top
        if (liveShipmentsRef.current.length > 0) {
          addLiveShipmentLayers(map, liveShipmentsRef.current);
        }

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

      // Click stop marker → show popup with description
      map.on("click", "route-stop-circles", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["route-stop-circles"] });
        if (!features.length) return;

        const props = features[0].properties;
        const geometry = features[0].geometry;
        if (geometry.type !== "Point") return;

        // Close any existing stop popup
        stopPopupRef.current?.remove();

        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "280px",
          className: "route-stop-popup",
        })
          .setLngLat(geometry.coordinates as [number, number])
          .setHTML(
            `<div style="font-family:system-ui,sans-serif;padding:4px 0;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-size:18px;">${props.icon}</span>
                <strong style="font-size:13px;">${props.name}</strong>
              </div>
              <p style="font-size:12px;line-height:1.5;color:#a1a1aa;margin:0;">${props.description}</p>
              <div style="margin-top:6px;display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;background:rgba(255,255,255,0.1);color:#d4d4d8;">${props.stopType}</div>
            </div>`
          )
          .addTo(map);

        stopPopupRef.current = popup;

        // Don't propagate to background click handler
        e.originalEvent.stopPropagation();
      });

      // Click live shipment marker → show popup
      map.on("click", "live-shipment-markers", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["live-shipment-markers"] });
        if (!features.length) return;

        const props = features[0].properties;
        const geometry = features[0].geometry;
        if (geometry.type !== "Point") return;

        stopPopupRef.current?.remove();

        const eta = props.estimatedArrival
          ? new Date(props.estimatedArrival).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "—";

        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "280px",
          className: "route-stop-popup",
        })
          .setLngLat(geometry.coordinates as [number, number])
          .setHTML(
            `<div style="font-family:system-ui,sans-serif;padding:4px 0;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-size:16px;">📦</span>
                <strong style="font-size:13px;">${props.orderNumber}</strong>
              </div>
              <div style="font-size:12px;line-height:1.6;color:#a1a1aa;">
                ${props.carrier ? `<div>Carrier: <span style="color:#d4d4d8;">${props.carrier}</span></div>` : ""}
                <div>Tracking: <span style="color:#d4d4d8;font-family:monospace;">${props.trackingNumber}</span></div>
                ${props.currentLocation ? `<div>Location: <span style="color:#d4d4d8;">${props.currentLocation}</span></div>` : ""}
                <div>ETA: <span style="color:#d4d4d8;">${eta}</span></div>
              </div>
              <a href="/orders/${props.orderId}" style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:600;background:#06b6d4;color:white;text-decoration:none;">View Order</a>
            </div>`
          )
          .addTo(map);

        stopPopupRef.current = popup;
        e.originalEvent.stopPropagation();
      });

      // Cursor changes
      map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "unclustered-point", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "unclustered-point", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "route-stop-circles", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "route-stop-circles", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "live-shipment-markers", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "live-shipment-markers", () => { map.getCanvas().style.cursor = ""; });

      return () => {
        stopPopupRef.current?.remove();
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
        if (liveShipmentsRef.current.length > 0) {
          addLiveShipmentLayers(map, liveShipmentsRef.current);
        }
      });
    }, [theme]);

    // Update data / clustering / routes
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      // Remove everything and re-add
      removeLiveShipmentLayers(map);
      removeRouteLayers(map);
      removeSourceAndLayers(map);

      if (routesEnabled) {
        addRouteLayers(map, factories);
      }
      addSourceAndLayers(map, factories, clusteringEnabled);
      if (liveShipments.length > 0) {
        addLiveShipmentLayers(map, liveShipments);
      }
    }, [factories, clusteringEnabled, routesEnabled, liveShipments]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full min-h-[320px] rounded-lg overflow-hidden"
      />
    );
  }
);
