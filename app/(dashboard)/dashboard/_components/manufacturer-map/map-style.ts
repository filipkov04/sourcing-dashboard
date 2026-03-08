import type { StyleSpecification } from "maplibre-gl";

export function getMapStyle(theme: "light" | "dark"): StyleSpecification {
  const tileUrl =
    theme === "dark"
      ? "https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png"
      : "https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png";

  return {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      },
    },
    layers: [
      {
        id: "carto-tiles",
        type: "raster",
        source: "carto",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}
