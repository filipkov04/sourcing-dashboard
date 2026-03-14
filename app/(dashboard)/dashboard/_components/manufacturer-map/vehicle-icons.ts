import maplibregl from "maplibre-gl";

function svgToImage(svg: string, size: number = 28): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(size, size);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

const SHIP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 20a1 1 0 0 0 1.02.17l4.48-1.79a1 1 0 0 1 .74 0l4.52 1.81a1 1 0 0 0 .74 0l4.52-1.81a1 1 0 0 1 .74 0l4.48 1.79A1 1 0 0 0 22 20" stroke="STROKE"/>
  <path d="M4 18l-1-5h18l-1 5" stroke="STROKE"/>
  <path d="M12 2v7" stroke="STROKE"/>
  <path d="M7 9h10l-2-4H9z" stroke="STROKE" fill="FILL"/>
</svg>`;

const PLANE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" stroke="STROKE" fill="FILL"/>
</svg>`;

const TRUCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" stroke="STROKE"/>
  <path d="M15 18H9" stroke="STROKE"/>
  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" stroke="STROKE"/>
  <circle cx="17" cy="18" r="2" stroke="STROKE" fill="FILL"/>
  <circle cx="7" cy="18" r="2" stroke="STROKE" fill="FILL"/>
</svg>`;

function colorize(svg: string, stroke: string, fill: string): string {
  return svg.replace(/STROKE/g, stroke).replace(/FILL/g, fill);
}

export async function registerVehicleIcons(map: maplibregl.Map) {
  const variants = [
    { suffix: "default", stroke: "#475569", fill: "#475569" },
    { suffix: "selected", stroke: "#e11d48", fill: "#e11d48" },
  ];

  const vehicles = [
    { name: "ship", svg: SHIP_SVG },
    { name: "plane", svg: PLANE_SVG },
    { name: "truck", svg: TRUCK_SVG },
  ];

  for (const v of vehicles) {
    for (const c of variants) {
      const id = `vehicle-${v.name}-${c.suffix}`;
      if (map.hasImage(id)) continue;
      const colored = colorize(v.svg, c.stroke, c.fill);
      const img = await svgToImage(colored, 28);
      map.addImage(id, img, { sdf: false });
    }
  }
}
