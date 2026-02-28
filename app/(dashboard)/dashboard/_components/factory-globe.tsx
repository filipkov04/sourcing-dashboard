"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useTheme } from "@/components/theme-provider";
import { Globe as GlobeIcon, MapPin, ZoomIn, ZoomOut } from "lucide-react";
import createGlobe from "cobe";

type FactoryLocation = {
  id: string;
  name: string;
  location: string;
  address: string | null;
  country: string;
  city: string;
  lat: number;
  lng: number;
  orderCount: number;
};

type ZoomTier = "country" | "city" | "precise";

type AggregatedMarker = {
  label: string;
  lat: number;
  lng: number;
  count: number;
  factories: number;
  tier: ZoomTier;
};

function getTier(zoom: number): ZoomTier {
  if (zoom < 1.4) return "country";
  if (zoom < 2.3) return "city";
  return "precise";
}

function getTierLabel(tier: ZoomTier): string {
  switch (tier) {
    case "country": return "Country";
    case "city": return "City";
    case "precise": return "Factory";
  }
}

function aggregateByCountry(locations: FactoryLocation[]): AggregatedMarker[] {
  const groups = new Map<string, FactoryLocation[]>();
  for (const loc of locations) {
    const key = loc.country.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(loc);
  }

  return Array.from(groups.entries()).map(([, locs]) => {
    const lat = locs.reduce((s, l) => s + l.lat, 0) / locs.length;
    const lng = locs.reduce((s, l) => s + l.lng, 0) / locs.length;
    const orders = locs.reduce((s, l) => s + l.orderCount, 0);
    return {
      label: locs[0].country,
      lat,
      lng,
      count: orders,
      factories: locs.length,
      tier: "country" as ZoomTier,
    };
  });
}

function aggregateByCity(locations: FactoryLocation[]): AggregatedMarker[] {
  const groups = new Map<string, FactoryLocation[]>();
  for (const loc of locations) {
    const key = `${loc.city.toLowerCase()}, ${loc.country.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(loc);
  }

  return Array.from(groups.entries()).map(([, locs]) => {
    const lat = locs.reduce((s, l) => s + l.lat, 0) / locs.length;
    const lng = locs.reduce((s, l) => s + l.lng, 0) / locs.length;
    const orders = locs.reduce((s, l) => s + l.orderCount, 0);
    return {
      label: `${locs[0].city}, ${locs[0].country}`,
      lat,
      lng,
      count: orders,
      factories: locs.length,
      tier: "city" as ZoomTier,
    };
  });
}

function precisMarkers(locations: FactoryLocation[]): AggregatedMarker[] {
  return locations.map((loc) => ({
    label: loc.name,
    lat: loc.lat,
    lng: loc.lng,
    count: loc.orderCount,
    factories: 1,
    tier: "precise" as ZoomTier,
  }));
}

export function FactoryGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const pointerInteractionMovement = useRef({ x: 0, y: 0 });
  const phiRef = useRef(0);
  const thetaRef = useRef(0);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [locations, setLocations] = useState<FactoryLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    marker: AggregatedMarker;
  } | null>(null);

  const tier = getTier(zoom);

  const markers = useMemo(() => {
    switch (tier) {
      case "country": return aggregateByCountry(locations);
      case "city": return aggregateByCity(locations);
      case "precise": return precisMarkers(locations);
    }
  }, [locations, tier]);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("/api/dashboard/factory-locations");
        const data = await res.json();
        if (data.success) {
          setLocations(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch factory locations:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLocations();
  }, []);

  // Use refs for values that change often so we don't recreate the globe
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const [globeError, setGlobeError] = useState(false);

  // Create globe only once when canvas is available and locations are loaded
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;

    // Use a fresh canvas element to avoid stale WebGL context issues
    const canvas = canvasRef.current;

    let focusLat = 25;
    let focusLng = 110;
    if (locations.length > 0) {
      focusLat = locations.reduce((sum, m) => sum + m.lat, 0) / locations.length;
      focusLng = locations.reduce((sum, m) => sum + m.lng, 0) / locations.length;
    }

    const initialPhi = ((90 - focusLat) * Math.PI) / 180;
    const initialTheta = ((focusLng + 180) * Math.PI) / 180;
    phiRef.current = initialTheta;
    thetaRef.current = initialPhi - Math.PI / 2;

    const currentMarkers = markersRef.current;
    const currentTier = getTier(zoomRef.current);
    const cobeMarkers = currentMarkers.map((m) => ({
      location: [m.lat, m.lng] as [number, number],
      size: currentTier === "country"
        ? Math.min(0.15 + m.factories * 0.04, 0.35)
        : currentTier === "city"
          ? Math.min(0.1 + m.factories * 0.03, 0.25)
          : Math.min(0.06 + m.count * 0.015, 0.15),
    }));

    const dark = isDarkRef.current;

    try {
      globeRef.current = createGlobe(canvas, {
        devicePixelRatio: 2,
        width: 500,
        height: 500,
        phi: initialTheta,
        theta: initialPhi - Math.PI / 2,
        dark: dark ? 1 : 0,
        diffuse: dark ? 1.2 : 2,
        mapSamples: 16000,
        mapBrightness: dark ? 2.5 : 8,
        baseColor: dark ? [0.15, 0.15, 0.18] : [0.95, 0.95, 0.97],
        markerColor: [0.92, 0.36, 0.18],
        glowColor: dark ? [0.08, 0.08, 0.12] : [0.85, 0.85, 0.9],
        markers: cobeMarkers,
        scale: zoomRef.current,
        onRender: (state) => {
          if (!pointerInteracting.current) {
            phiRef.current += 0.003;
          }
          state.phi = phiRef.current + pointerInteractionMovement.current.x;
          state.theta = thetaRef.current + pointerInteractionMovement.current.y;
        },
      });
    } catch {
      setGlobeError(true);
    }

    return () => {
      if (globeRef.current) {
        globeRef.current.destroy();
        globeRef.current = null;
      }
    };
    // Only recreate when locations change (initial load) — not on zoom/theme
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, locations]);

  // Scroll zoom handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      setZoom((prev) => {
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        return Math.min(4.0, Math.max(1.0, prev + delta));
      });
    }

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  // Hover tooltip via marker proximity
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (pointerInteracting.current !== null) {
        const deltaX = e.clientX - pointerInteracting.current.x;
        const deltaY = e.clientY - pointerInteracting.current.y;
        pointerInteractionMovement.current = { x: deltaX / 100, y: deltaY / 100 };
        setTooltip(null);
        return;
      }

      // For tooltip: check if cursor is near any marker position on screen
      // Use canvas-relative coords and approximate projection
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || markers.length === 0) {
        setTooltip(null);
        return;
      }

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      // 0.8 matches cobe's sphere radius in normalized coords (sqrt(0.64))
      const r = 0.8 * zoom * rect.width / 2;

      // Current globe rotation matching cobe's J(theta, phi) matrix
      const globePhi = phiRef.current + pointerInteractionMovement.current.x;
      const globeTheta = thetaRef.current + pointerInteractionMovement.current.y;
      const cp = Math.cos(globePhi), sp = Math.sin(globePhi);
      const ct = Math.cos(globeTheta), st = Math.sin(globeTheta);

      let closest: AggregatedMarker | null = null;
      let closestDist = Infinity;

      for (const m of markers) {
        // Convert lat/lng to 3D world position (matching cobe's coordinate system)
        const latRad = (m.lat * Math.PI) / 180;
        const lngRad = (m.lng * Math.PI) / 180;
        const cosLat = Math.cos(latRad);
        const px = cosLat * Math.cos(lngRad);
        const py = Math.sin(latRad);
        const pz = -cosLat * Math.sin(lngRad);

        // Apply cobe's rotation matrix J(theta, phi): world → view space
        const vx = cp * px + sp * pz;
        const vy = sp * st * px + ct * py - cp * st * pz;
        const vz = -sp * ct * px + st * py + cp * ct * pz;

        // Only show tooltip for markers on visible side (facing camera)
        if (vz <= 0) continue;

        // Orthographic projection to screen coords
        const x = cx + vx * r;
        const y = cy - vy * r;

        const dist = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
        if (dist < 25 && dist < closestDist) {
          closest = m;
          closestDist = dist;
        }
      }

      if (closest) {
        setTooltip({ x: e.clientX, y: e.clientY, marker: closest });
      } else {
        setTooltip(null);
      }
    },
    [markers, zoom]
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-4">
          <GlobeIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Factory Locations</h3>
        </div>
        <div className="flex items-center justify-center h-[260px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF8C1A]" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 card-hover-glow"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GlobeIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Factory Locations</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom tier badge */}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 font-medium">
            {getTierLabel(tier)}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-zinc-500">
            {locations.length} {locations.length === 1 ? "factory" : "factories"}
          </span>
        </div>
      </div>

      {/* Globe */}
      <div className="relative flex items-center justify-center">
        {globeError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-gray-400 dark:text-zinc-500">WebGL unavailable</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ width: 260, height: 260, maxWidth: "100%", aspectRatio: "1" }}
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            pointerInteracting.current = {
              x: e.clientX - pointerInteractionMovement.current.x,
              y: e.clientY - pointerInteractionMovement.current.y,
            };
            canvasRef.current && (canvasRef.current.style.cursor = "grabbing");
          }}
          onPointerUp={() => {
            if (pointerInteracting.current) {
              phiRef.current += pointerInteractionMovement.current.x;
              thetaRef.current += pointerInteractionMovement.current.y;
              pointerInteractionMovement.current = { x: 0, y: 0 };
            }
            pointerInteracting.current = null;
            canvasRef.current && (canvasRef.current.style.cursor = "grab");
          }}
          onPointerOut={() => {
            if (pointerInteracting.current) {
              phiRef.current += pointerInteractionMovement.current.x;
              thetaRef.current += pointerInteractionMovement.current.y;
              pointerInteractionMovement.current = { x: 0, y: 0 };
            }
            pointerInteracting.current = null;
            canvasRef.current && (canvasRef.current.style.cursor = "grab");
            setTooltip(null);
          }}
          onMouseMove={handleMouseMove}
          onTouchMove={(e) => {
            if (pointerInteracting.current !== null && e.touches[0]) {
              const deltaX = e.touches[0].clientX - pointerInteracting.current.x;
              const deltaY = e.touches[0].clientY - pointerInteracting.current.y;
              pointerInteractionMovement.current = { x: deltaX / 100, y: deltaY / 100 };
            }
          }}
        />

        {/* Zoom controls */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(4.0, z + 0.3))}
            className="p-1 rounded bg-white/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-3 w-3 text-gray-600 dark:text-zinc-400" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(1.0, z - 0.3))}
            className="p-1 rounded bg-white/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-3 w-3 text-gray-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Floating tooltip */}
        {tooltip && containerRef.current && (
          <div
            className="fixed z-50 pointer-events-none px-2.5 py-1.5 rounded-md shadow-lg border text-xs bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 10,
            }}
          >
            <p className="font-medium text-gray-800 dark:text-zinc-200">
              {tooltip.marker.label}
            </p>
            {tooltip.marker.tier === "precise" ? (
              <p className="text-gray-500 dark:text-zinc-400">
                {tooltip.marker.count} {tooltip.marker.count === 1 ? "order" : "orders"}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-zinc-400">
                {tooltip.marker.factories} {tooltip.marker.factories === 1 ? "factory" : "factories"} &middot; {tooltip.marker.count} {tooltip.marker.count === 1 ? "order" : "orders"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Zoom bar */}
      <div className="flex items-center gap-2 mt-2 px-1">
        <span className="text-[9px] text-gray-400 dark:text-zinc-500 w-5">1x</span>
        <div className="flex-1 h-1 bg-gray-100 dark:bg-zinc-800 rounded-full relative">
          <div
            className="absolute top-0 left-0 h-full bg-[#FF8C1A]/60 rounded-full transition-all duration-150"
            style={{ width: `${((zoom - 1) / 3) * 100}%` }}
          />
        </div>
        <span className="text-[9px] text-gray-400 dark:text-zinc-500 w-5 text-right">4x</span>
      </div>

      {/* Marker list */}
      {markers.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {markers.slice(0, 5).map((m, i) => (
            <div key={`${m.label}-${i}`} className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-[#eb5d2e] flex-shrink-0" />
              <span className="text-xs text-gray-700 dark:text-zinc-300 truncate flex-1">
                {m.label}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 whitespace-nowrap">
                {tier === "precise"
                  ? `${m.count} ${m.count === 1 ? "order" : "orders"}`
                  : `${m.factories}f · ${m.count}o`}
              </span>
            </div>
          ))}
          {markers.length > 5 && (
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 text-center pt-1">
              +{markers.length - 5} more
            </p>
          )}
        </div>
      )}

      {locations.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-zinc-500 text-center mt-2">
          Add factories with locations to see them on the globe
        </p>
      )}
    </div>
  );
}
