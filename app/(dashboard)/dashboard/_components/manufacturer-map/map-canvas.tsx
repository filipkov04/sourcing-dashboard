"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyle } from "./map-style";
import { vehiclesToGeoJSON, selectedRouteGeoJSON, getBounds } from "./map-utils";
import { registerVehicleIcons } from "./vehicle-icons";
import type { MapFactory, MapVehicle } from "./types";

// ─── Source & layer IDs ──────────────────────────────────────────────────────
const VEHICLES_SOURCE = "vehicles";
const VEHICLE_LAYER = "vehicle-icons";
const VEHICLE_LABELS = "vehicle-labels";
const SELECTED_ROUTE_SOURCE = "selected-route";
const SELECTED_STOPS_SOURCE = "selected-stops";
const SELECTED_ROUTE_LAYER = "selected-route-line";
const SELECTED_ROUTE_DASH = "selected-route-dash";
const SELECTED_STOPS_LAYER = "selected-stop-circles";
const SELECTED_STOPS_ICONS = "selected-stop-icons";
const USER_LOCATION_SOURCE = "user-location";
const USER_PULSE_LAYER = "user-location-pulse";
const USER_DOT_LAYER = "user-location-dot";

export type MapCanvasHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitToMarkers: () => void;
  easeTo: (lng: number, lat: number) => void;
};

type MapCanvasProps = {
  vehicles: MapVehicle[];
  factories: MapFactory[];
  theme: "light" | "dark";
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicle: MapVehicle | null) => void;
};

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(
  function MapCanvas({ vehicles, factories, theme, selectedVehicleId, onSelectVehicle }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const vehiclesRef = useRef(vehicles);
    vehiclesRef.current = vehicles;
    const selectedRef = useRef(selectedVehicleId);
    selectedRef.current = selectedVehicleId;

    const fitToMarkers = useCallback(() => {
      const map = mapRef.current;
      if (!map || vehicles.length === 0) return;
      const bounds = getBounds(factories);
      if (!bounds) return;
      map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 800 });
    }, [factories, vehicles]);

    useImperativeHandle(ref, () => ({
      zoomIn: () => mapRef.current?.zoomIn({ duration: 300 }),
      zoomOut: () => mapRef.current?.zoomOut({ duration: 300 }),
      resetView: () => {
        mapRef.current?.flyTo({ center: [20, 20], zoom: 1.5, duration: 800 });
      },
      fitToMarkers,
      easeTo: (lng: number, lat: number) => {
        mapRef.current?.easeTo({
          center: [lng, lat],
          zoom: Math.max(mapRef.current.getZoom(), 5),
          duration: 600,
        });
      },
    }));

    // ─── Add vehicle layers ──────────────────────────────────────────────
    function addVehicleLayers(map: maplibregl.Map, vehicleData: MapVehicle[]) {
      const data = vehiclesToGeoJSON(vehicleData);

      if (map.getSource(VEHICLES_SOURCE)) {
        (map.getSource(VEHICLES_SOURCE) as maplibregl.GeoJSONSource).setData(data);
        return;
      }

      map.addSource(VEHICLES_SOURCE, { type: "geojson", data });

      // Vehicle icon symbols
      map.addLayer({
        id: VEHICLE_LAYER,
        type: "symbol",
        source: VEHICLES_SOURCE,
        layout: {
          "icon-image": [
            "case",
            ["==", ["get", "orderId"], selectedRef.current ?? ""],
            ["concat", "vehicle-", ["get", "vehicleType"], "-selected"],
            ["concat", "vehicle-", ["get", "vehicleType"], "-default"],
          ],
          "icon-size": 0.9,
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-padding": 2,
        },
      });

      // Order number labels
      map.addLayer({
        id: VEHICLE_LABELS,
        type: "symbol",
        source: VEHICLES_SOURCE,
        layout: {
          "text-field": ["get", "orderNumber"],
          "text-size": 9,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-offset": [0, 1.8],
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#475569",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      });
    }

    // ─── Show selected vehicle route ─────────────────────────────────────
    function showSelectedRoute(map: maplibregl.Map, vehicle: MapVehicle) {
      const { lines, stops } = selectedRouteGeoJSON(vehicle);

      // Route lines
      if (map.getSource(SELECTED_ROUTE_SOURCE)) {
        (map.getSource(SELECTED_ROUTE_SOURCE) as maplibregl.GeoJSONSource).setData(lines);
      } else {
        map.addSource(SELECTED_ROUTE_SOURCE, { type: "geojson", data: lines });
      }

      // Stop dots
      if (map.getSource(SELECTED_STOPS_SOURCE)) {
        (map.getSource(SELECTED_STOPS_SOURCE) as maplibregl.GeoJSONSource).setData(stops);
      } else {
        map.addSource(SELECTED_STOPS_SOURCE, { type: "geojson", data: stops });
      }

      // Magenta route line (solid base)
      if (!map.getLayer(SELECTED_ROUTE_LAYER)) {
        map.addLayer({
          id: SELECTED_ROUTE_LAYER,
          type: "line",
          source: SELECTED_ROUTE_SOURCE,
          paint: {
            "line-color": "#e11d9b",
            "line-width": 2.5,
            "line-opacity": 0.7,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        }, VEHICLE_LAYER); // render below vehicles
      }

      // Animated dash overlay
      if (!map.getLayer(SELECTED_ROUTE_DASH)) {
        map.addLayer({
          id: SELECTED_ROUTE_DASH,
          type: "line",
          source: SELECTED_ROUTE_SOURCE,
          paint: {
            "line-color": "#f472b6",
            "line-width": 2,
            "line-dasharray": [0, 4, 3],
            "line-opacity": 0.9,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        }, VEHICLE_LAYER);
      }

      // Blue stop circles
      if (!map.getLayer(SELECTED_STOPS_LAYER)) {
        map.addLayer({
          id: SELECTED_STOPS_LAYER,
          type: "circle",
          source: SELECTED_STOPS_SOURCE,
          paint: {
            "circle-radius": 5,
            "circle-color": "#3b82f6",
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9,
          },
        });
      }

      // Stop type labels (small, above dot)
      if (!map.getLayer(SELECTED_STOPS_ICONS)) {
        map.addLayer({
          id: SELECTED_STOPS_ICONS,
          type: "symbol",
          source: SELECTED_STOPS_SOURCE,
          layout: {
            "text-field": ["get", "icon"],
            "text-size": 10,
            "text-offset": [0, -1.3],
            "text-allow-overlap": true,
          },
        });
      }
    }

    // ─── Hide selected route ─────────────────────────────────────────────
    function hideSelectedRoute(map: maplibregl.Map) {
      for (const id of [SELECTED_ROUTE_LAYER, SELECTED_ROUTE_DASH, SELECTED_STOPS_LAYER, SELECTED_STOPS_ICONS]) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      if (map.getSource(SELECTED_ROUTE_SOURCE)) map.removeSource(SELECTED_ROUTE_SOURCE);
      if (map.getSource(SELECTED_STOPS_SOURCE)) map.removeSource(SELECTED_STOPS_SOURCE);
    }

    // ─── User geolocation ────────────────────────────────────────────────
    function addUserLocation(map: maplibregl.Map) {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { longitude, latitude } = pos.coords;
          const data: GeoJSON.FeatureCollection = {
            type: "FeatureCollection",
            features: [{
              type: "Feature",
              geometry: { type: "Point", coordinates: [longitude, latitude] },
              properties: {},
            }],
          };

          if (map.getSource(USER_LOCATION_SOURCE)) {
            (map.getSource(USER_LOCATION_SOURCE) as maplibregl.GeoJSONSource).setData(data);
            return;
          }

          map.addSource(USER_LOCATION_SOURCE, { type: "geojson", data });

          // Pulsing ring
          map.addLayer({
            id: USER_PULSE_LAYER,
            type: "circle",
            source: USER_LOCATION_SOURCE,
            paint: {
              "circle-radius": 14,
              "circle-color": "#3b82f6",
              "circle-opacity": 0.15,
              "circle-stroke-width": 0,
            },
          });

          // Solid dot
          map.addLayer({
            id: USER_DOT_LAYER,
            type: "circle",
            source: USER_LOCATION_SOURCE,
            paint: {
              "circle-radius": 5,
              "circle-color": "#3b82f6",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });
        },
        () => {
          // Permission denied or error — silently skip
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }

    // ─── Remove all custom layers ────────────────────────────────────────
    function removeAllLayers(map: maplibregl.Map) {
      const allLayers = [
        VEHICLE_LAYER, VEHICLE_LABELS,
        SELECTED_ROUTE_LAYER, SELECTED_ROUTE_DASH, SELECTED_STOPS_LAYER, SELECTED_STOPS_ICONS,
        USER_PULSE_LAYER, USER_DOT_LAYER,
      ];
      for (const id of allLayers) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      const allSources = [
        VEHICLES_SOURCE, SELECTED_ROUTE_SOURCE, SELECTED_STOPS_SOURCE, USER_LOCATION_SOURCE,
      ];
      for (const id of allSources) {
        if (map.getSource(id)) map.removeSource(id);
      }
    }

    // ─── Initialize map ──────────────────────────────────────────────────
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
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#71717a;font-size:13px;">Map requires WebGL support</div>';
        }
        return;
      }

      mapRef.current = map;

      map.on("load", async () => {
        await registerVehicleIcons(map);
        addVehicleLayers(map, vehiclesRef.current);
        addUserLocation(map);

        // Fit to vehicle positions
        if (vehiclesRef.current.length > 0) {
          const coords = vehiclesRef.current.map((v) => [v.lng, v.lat] as [number, number]);
          const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
          coords.forEach((c) => bounds.extend(c));
          map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 });
        } else {
          const bounds = getBounds(factories);
          if (bounds) map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 });
        }
      });

      // Click vehicle → select
      map.on("click", VEHICLE_LAYER, (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [VEHICLE_LAYER] });
        if (!features.length) return;

        const orderId = features[0].properties.orderId;
        const vehicle = vehiclesRef.current.find((v) => v.orderId === orderId);
        if (vehicle) {
          onSelectVehicle(vehicle);
        }

        e.originalEvent.stopPropagation();
      });

      // Click background → deselect
      map.on("click", (e) => {
        const vehicleHits = map.queryRenderedFeatures(e.point, { layers: [VEHICLE_LAYER] });
        const stopHits = map.getLayer(SELECTED_STOPS_LAYER)
          ? map.queryRenderedFeatures(e.point, { layers: [SELECTED_STOPS_LAYER] })
          : [];
        if (vehicleHits.length === 0 && stopHits.length === 0) {
          onSelectVehicle(null);
        }
      });

      // Cursor changes
      map.on("mouseenter", VEHICLE_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", VEHICLE_LAYER, () => { map.getCanvas().style.cursor = ""; });

      // Click stop dot → show rich popup
      map.on("click", SELECTED_STOPS_LAYER, (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [SELECTED_STOPS_LAYER] });
        if (!features.length) return;

        const props = features[0].properties;
        const geometry = features[0].geometry;
        if (geometry.type !== "Point") return;

        const [lng, lat] = geometry.coordinates;
        const selectedV = vehiclesRef.current.find((v) => v.orderId === selectedRef.current);

        new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "320px",
          className: "route-stop-popup",
        })
          .setLngLat([lng, lat])
          .setHTML(`
            <div style="font-family:system-ui,sans-serif;padding:6px 2px;">
              <div style="font-size:14px;font-weight:600;color:#f1f5f9;margin-bottom:4px;">${props.name}</div>
              <p style="font-size:11px;line-height:1.5;color:#94a3b8;margin:0 0 8px;">${props.description}</p>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10px;margin-bottom:6px;">
                <div style="color:#64748b;">Type</div>
                <div style="color:#cbd5e1;text-transform:uppercase;font-weight:600;">${props.type}</div>
                <div style="color:#64748b;">Coordinates</div>
                <div style="color:#cbd5e1;font-family:monospace;">${lat.toFixed(2)}°, ${lng.toFixed(2)}°</div>
                ${selectedV?.trackingNumber ? `
                <div style="color:#64748b;">Tracking</div>
                <div style="color:#cbd5e1;font-family:monospace;font-size:9px;">${selectedV.trackingNumber}</div>
                ` : ""}
                ${selectedV?.carrier ? `
                <div style="color:#64748b;">Carrier</div>
                <div style="color:#cbd5e1;">${selectedV.carrier}</div>
                ` : ""}
                ${selectedV?.estimatedArrival ? `
                <div style="color:#64748b;">ETA</div>
                <div style="color:#cbd5e1;">${new Date(selectedV.estimatedArrival).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                ` : ""}
              </div>
            </div>
          `)
          .addTo(map);

        e.originalEvent.stopPropagation();
      });

      map.on("mouseenter", SELECTED_STOPS_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", SELECTED_STOPS_LAYER, () => { map.getCanvas().style.cursor = ""; });

      // Animate the dash offset for flowing dots effect
      let dashStep = 0;
      let animationId: number;
      function animateDash() {
        if (!mapRef.current) return;
        dashStep = (dashStep + 1) % 24;
        if (map.getLayer(SELECTED_ROUTE_DASH)) {
          const t = dashStep / 24;
          map.setPaintProperty(SELECTED_ROUTE_DASH, "line-dasharray", [0, 4 + t * 3, 3 - t * 3 > 0 ? 3 - t * 3 : 0.1]);
        }
        animationId = requestAnimationFrame(animateDash);
      }
      animationId = requestAnimationFrame(animateDash);

      return () => {
        cancelAnimationFrame(animationId);
        mapRef.current = null;
        map.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Theme changes ───────────────────────────────────────────────────
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      map.setStyle(getMapStyle(theme));
      map.once("style.load", async () => {
        await registerVehicleIcons(map);
        addVehicleLayers(map, vehiclesRef.current);
        addUserLocation(map);

        if (selectedRef.current) {
          const v = vehiclesRef.current.find((v) => v.orderId === selectedRef.current);
          if (v) showSelectedRoute(map, v);
        }
      });
    }, [theme]);

    // ─── Update vehicles data ────────────────────────────────────────────
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      const data = vehiclesToGeoJSON(vehicles);
      if (map.getSource(VEHICLES_SOURCE)) {
        (map.getSource(VEHICLES_SOURCE) as maplibregl.GeoJSONSource).setData(data);
      }

      // Update icon expressions for selection state
      if (map.getLayer(VEHICLE_LAYER)) {
        map.setLayoutProperty(VEHICLE_LAYER, "icon-image", [
          "case",
          ["==", ["get", "orderId"], selectedVehicleId ?? ""],
          ["concat", "vehicle-", ["get", "vehicleType"], "-selected"],
          ["concat", "vehicle-", ["get", "vehicleType"], "-default"],
        ]);
      }
    }, [vehicles, selectedVehicleId]);

    // ─── Show/hide route on selection change ─────────────────────────────
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      hideSelectedRoute(map);

      if (selectedVehicleId) {
        const vehicle = vehicles.find((v) => v.orderId === selectedVehicleId);
        if (vehicle) {
          showSelectedRoute(map, vehicle);
          // Pan to vehicle
          map.easeTo({
            center: [vehicle.lng, vehicle.lat],
            zoom: Math.max(map.getZoom(), 4),
            duration: 600,
          });
        }
      }
    }, [selectedVehicleId, vehicles]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full min-h-[320px] rounded-lg overflow-hidden"
      />
    );
  }
);
