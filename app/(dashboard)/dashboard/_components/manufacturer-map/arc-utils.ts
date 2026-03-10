// Destination: Suché Miesto 20, Chorvatský Grob, Bratislava, Slovakia
export const DESTINATION_COORDS: [number, number] = [17.2895, 48.2252]; // [lng, lat]

// ─── Major ports ────────────────────────────────────────────────────────────

type Port = { name: string; coords: [number, number] };

const PORTS: Record<string, Port> = {
  // Asia
  shanghai:    { name: "Shanghai",    coords: [121.47, 31.23] },
  shenzhen:    { name: "Shenzhen",    coords: [114.17, 22.32] },
  chittagong:  { name: "Chittagong",  coords: [91.83, 22.33] },
  mumbai:      { name: "Mumbai",      coords: [72.88, 18.96] },
  hochiminh:   { name: "HCMC",        coords: [106.66, 10.76] },
  jakarta:     { name: "Jakarta",     coords: [106.85, -6.21] },
  bangkok:     { name: "Laem Chabang",coords: [100.88, 13.08] },
  // Europe (arrival)
  koper:       { name: "Koper",       coords: [13.73, 45.55] },
  // Turkey
  istanbul:    { name: "Istanbul",    coords: [29.01, 41.01] },
  mersin:      { name: "Mersin",      coords: [34.63, 36.80] },
};

// ─── Sea lane waypoints (Asia → Europe via Suez) ───────────────────────────

// Realistic container ship route through major straits and canals
const SOUTH_CHINA_SEA: [number, number][] = [
  [114, 18],    // off Hong Kong
  [110, 10],    // South China Sea
  [106, 5],     // approaching Malacca
];

const MALACCA_STRAIT: [number, number][] = [
  [103.5, 1.3], // Singapore Strait
  [100, 3],     // Strait of Malacca exit
  [96, 5.5],    // Andaman Sea
];

const INDIAN_OCEAN: [number, number][] = [
  [85, 8],      // Bay of Bengal crossing
  [75, 10],     // mid Indian Ocean
  [65, 13],     // Arabian Sea
];

const ARABIAN_SEA_TO_SUEZ: [number, number][] = [
  [55, 16],     // off Oman
  [48, 12.5],   // Gulf of Aden
  [43.5, 12.6], // Bab el-Mandeb strait
  [39, 18],     // Red Sea south
  [36, 24],     // Red Sea mid
  [33.5, 28],   // Red Sea north
  [32.35, 30.6],// Suez Canal south entrance
  [32.37, 31.25],// Port Said (Suez north)
];

const MEDITERRANEAN_TO_KOPER: [number, number][] = [
  [30, 32],     // off Egypt coast
  [25, 34.5],   // Crete passage
  [20, 36],     // south of Greece
  [17, 38],     // Ionian Sea
  [15, 40],     // off southern Italy
  [14.5, 42],   // mid Adriatic
  [14, 44],     // north Adriatic
  [13.73, 45.55], // Koper, Slovenia
];

// ─── Land route: Koper → Bratislava (highway waypoints) ────────────────────

const KOPER_TO_BRATISLAVA: [number, number][] = [
  [13.73, 45.55], // Koper
  [14.51, 46.06], // Ljubljana
  [15.65, 46.56], // Maribor
  [15.44, 47.07], // Graz
  [16.00, 47.50], // south of Vienna
  [16.37, 48.21], // Vienna
  [17.11, 48.15], // heading to Bratislava
  [17.2895, 48.2252], // Chorvatský Grob
];

// ─── European land routes (truck only) ─────────────────────────────────────

const ISTANBUL_TO_BRATISLAVA: [number, number][] = [
  [29.01, 41.01], // Istanbul
  [26.55, 41.67], // Edirne (Turkey-Bulgaria border)
  [25.48, 42.15], // Plovdiv
  [23.32, 42.70], // Sofia
  [21.90, 43.32], // Niš
  [20.46, 44.82], // Belgrade
  [19.85, 46.10], // Szeged
  [19.04, 47.50], // Budapest
  [17.97, 47.85], // Győr
  [17.2895, 48.2252], // Chorvatský Grob
];

const PRATO_TO_BRATISLAVA: [number, number][] = [
  [11.10, 43.88], // Prato
  [11.35, 44.49], // Bologna
  [12.33, 45.44], // Venice area
  [13.78, 46.37], // Villach
  [14.29, 46.62], // Klagenfurt
  [15.44, 47.07], // Graz
  [16.37, 48.21], // Vienna
  [17.2895, 48.2252], // Chorvatský Grob
];

const PORTO_TO_BRATISLAVA: [number, number][] = [
  [-8.61, 41.15], // Porto
  [-3.70, 40.42], // Madrid
  [-0.38, 39.47], // Valencia coast
  [2.17, 41.39],  // Barcelona
  [3.88, 43.61],  // Montpellier
  [5.37, 43.30],  // Marseille
  [7.26, 43.71],  // Nice
  [8.95, 44.41],  // Genoa
  [11.35, 44.49], // Bologna
  [12.33, 45.44], // Venice area
  [13.78, 46.37], // Villach
  [15.44, 47.07], // Graz
  [16.37, 48.21], // Vienna
  [17.2895, 48.2252], // Chorvatský Grob
];

// ─── Route segment types ───────────────────────────────────────────────────

export type RouteSegment = {
  coordinates: [number, number][];
  transportMethod: "truck" | "ship";
};

export type ShippingRoute = {
  segments: RouteSegment[];
  departurePort: string | null;
  arrivalPort: string | null;
};

// ─── Haversine helper ──────────────────────────────────────────────────────

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function closestPort(
  factoryCoords: [number, number],
  portIds: string[]
): Port {
  let best = PORTS[portIds[0]];
  let bestDist = Infinity;
  for (const id of portIds) {
    const d = haversineKm(factoryCoords, PORTS[id].coords);
    if (d < bestDist) {
      bestDist = d;
      best = PORTS[id];
    }
  }
  return best;
}

// ─── Route builders per region ─────────────────────────────────────────────

function buildChinaRoute(factoryCoords: [number, number]): ShippingRoute {
  const port = closestPort(factoryCoords, ["shanghai", "shenzhen"]);
  const isNorth = port.name === "Shanghai";

  // Sea route depends on which port
  const seaWaypoints: [number, number][] = isNorth
    ? [port.coords, [120, 25], ...SOUTH_CHINA_SEA, ...MALACCA_STRAIT, ...INDIAN_OCEAN, ...ARABIAN_SEA_TO_SUEZ, ...MEDITERRANEAN_TO_KOPER]
    : [port.coords, ...SOUTH_CHINA_SEA, ...MALACCA_STRAIT, ...INDIAN_OCEAN, ...ARABIAN_SEA_TO_SUEZ, ...MEDITERRANEAN_TO_KOPER];

  return {
    segments: [
      { coordinates: [factoryCoords, port.coords], transportMethod: "truck" },
      { coordinates: seaWaypoints, transportMethod: "ship" },
      { coordinates: KOPER_TO_BRATISLAVA, transportMethod: "truck" },
    ],
    departurePort: port.name,
    arrivalPort: "Koper",
  };
}

function buildBangladeshRoute(factoryCoords: [number, number]): ShippingRoute {
  const port = PORTS.chittagong;
  const seaWaypoints: [number, number][] = [
    port.coords,
    [88, 15],    // Bay of Bengal
    ...INDIAN_OCEAN,
    ...ARABIAN_SEA_TO_SUEZ,
    ...MEDITERRANEAN_TO_KOPER,
  ];

  return {
    segments: [
      { coordinates: [factoryCoords, port.coords], transportMethod: "truck" },
      { coordinates: seaWaypoints, transportMethod: "ship" },
      { coordinates: KOPER_TO_BRATISLAVA, transportMethod: "truck" },
    ],
    departurePort: port.name,
    arrivalPort: "Koper",
  };
}

function buildIndiaRoute(factoryCoords: [number, number]): ShippingRoute {
  const port = PORTS.mumbai;
  const seaWaypoints: [number, number][] = [
    port.coords,
    [68, 17],    // off Mumbai
    [65, 13],
    ...ARABIAN_SEA_TO_SUEZ,
    ...MEDITERRANEAN_TO_KOPER,
  ];

  return {
    segments: [
      { coordinates: [factoryCoords, port.coords], transportMethod: "truck" },
      { coordinates: seaWaypoints, transportMethod: "ship" },
      { coordinates: KOPER_TO_BRATISLAVA, transportMethod: "truck" },
    ],
    departurePort: port.name,
    arrivalPort: "Koper",
  };
}

function buildVietnamRoute(factoryCoords: [number, number]): ShippingRoute {
  const port = PORTS.hochiminh;
  const seaWaypoints: [number, number][] = [
    port.coords,
    [106, 5],
    ...MALACCA_STRAIT,
    ...INDIAN_OCEAN,
    ...ARABIAN_SEA_TO_SUEZ,
    ...MEDITERRANEAN_TO_KOPER,
  ];

  return {
    segments: [
      { coordinates: [factoryCoords, port.coords], transportMethod: "truck" },
      { coordinates: seaWaypoints, transportMethod: "ship" },
      { coordinates: KOPER_TO_BRATISLAVA, transportMethod: "truck" },
    ],
    departurePort: port.name,
    arrivalPort: "Koper",
  };
}

function buildThailandRoute(factoryCoords: [number, number]): ShippingRoute {
  const port = PORTS.bangkok;
  const seaWaypoints: [number, number][] = [
    port.coords,
    [102, 8],
    [103.5, 1.3],
    ...MALACCA_STRAIT.slice(1),
    ...INDIAN_OCEAN,
    ...ARABIAN_SEA_TO_SUEZ,
    ...MEDITERRANEAN_TO_KOPER,
  ];

  return {
    segments: [
      { coordinates: [factoryCoords, port.coords], transportMethod: "truck" },
      { coordinates: seaWaypoints, transportMethod: "ship" },
      { coordinates: KOPER_TO_BRATISLAVA, transportMethod: "truck" },
    ],
    departurePort: port.name,
    arrivalPort: "Koper",
  };
}

function buildIndonesiaRoute(factoryCoords: [number, number]): ShippingRoute {
  const port = PORTS.jakarta;
  const seaWaypoints: [number, number][] = [
    port.coords,
    [104, -1],   // north of Java
    [103.5, 1.3],// Singapore
    ...MALACCA_STRAIT.slice(1),
    ...INDIAN_OCEAN,
    ...ARABIAN_SEA_TO_SUEZ,
    ...MEDITERRANEAN_TO_KOPER,
  ];

  return {
    segments: [
      { coordinates: [factoryCoords, port.coords], transportMethod: "truck" },
      { coordinates: seaWaypoints, transportMethod: "ship" },
      { coordinates: KOPER_TO_BRATISLAVA, transportMethod: "truck" },
    ],
    departurePort: port.name,
    arrivalPort: "Koper",
  };
}

function buildTurkeyRoute(factoryCoords: [number, number]): ShippingRoute {
  // Overland through Balkans
  return {
    segments: [
      { coordinates: [factoryCoords, ISTANBUL_TO_BRATISLAVA[0]], transportMethod: "truck" },
      { coordinates: ISTANBUL_TO_BRATISLAVA, transportMethod: "truck" },
    ],
    departurePort: null,
    arrivalPort: null,
  };
}

function buildItalyRoute(factoryCoords: [number, number]): ShippingRoute {
  return {
    segments: [
      { coordinates: [factoryCoords, PRATO_TO_BRATISLAVA[0]], transportMethod: "truck" },
      { coordinates: PRATO_TO_BRATISLAVA, transportMethod: "truck" },
    ],
    departurePort: null,
    arrivalPort: null,
  };
}

function buildPortugalRoute(factoryCoords: [number, number]): ShippingRoute {
  return {
    segments: [
      { coordinates: [factoryCoords, PORTO_TO_BRATISLAVA[0]], transportMethod: "truck" },
      { coordinates: PORTO_TO_BRATISLAVA, transportMethod: "truck" },
    ],
    departurePort: null,
    arrivalPort: null,
  };
}

// ─── Generic European truck route ──────────────────────────────────────────

function buildEuropeTruckRoute(factoryCoords: [number, number]): ShippingRoute {
  return {
    segments: [
      { coordinates: [factoryCoords, DESTINATION_COORDS], transportMethod: "truck" },
    ],
    departurePort: null,
    arrivalPort: null,
  };
}

// ─── Region detection ──────────────────────────────────────────────────────

type Region =
  | "china"
  | "bangladesh"
  | "india"
  | "vietnam"
  | "thailand"
  | "indonesia"
  | "turkey"
  | "italy"
  | "portugal"
  | "europe_other";

function detectRegion(lat: number, lng: number): Region {
  // China (east/south)
  if (lat > 18 && lat < 50 && lng > 100 && lng < 125) return "china";
  // Bangladesh
  if (lat > 20 && lat < 27 && lng > 88 && lng < 93) return "bangladesh";
  // India
  if (lat > 8 && lat < 35 && lng > 68 && lng < 88) return "india";
  // Vietnam
  if (lat > 8 && lat < 24 && lng > 102 && lng < 110) return "vietnam";
  // Thailand
  if (lat > 5 && lat < 21 && lng > 97 && lng < 106) return "thailand";
  // Indonesia
  if (lat > -11 && lat < 6 && lng > 95 && lng < 141) return "indonesia";
  // Turkey
  if (lat > 36 && lat < 42 && lng > 26 && lng < 45) return "turkey";
  // Italy
  if (lat > 36 && lat < 47 && lng > 6.5 && lng < 18.5) return "italy";
  // Portugal
  if (lat > 37 && lat < 42 && lng > -10 && lng < -6) return "portugal";
  // Default: Europe truck
  return "europe_other";
}

// ─── Main route builder ────────────────────────────────────────────────────

export function buildShippingRoute(
  factoryLng: number,
  factoryLat: number
): ShippingRoute {
  const coords: [number, number] = [factoryLng, factoryLat];
  const region = detectRegion(factoryLat, factoryLng);

  switch (region) {
    case "china":        return buildChinaRoute(coords);
    case "bangladesh":   return buildBangladeshRoute(coords);
    case "india":        return buildIndiaRoute(coords);
    case "vietnam":      return buildVietnamRoute(coords);
    case "thailand":     return buildThailandRoute(coords);
    case "indonesia":    return buildIndonesiaRoute(coords);
    case "turkey":       return buildTurkeyRoute(coords);
    case "italy":        return buildItalyRoute(coords);
    case "portugal":     return buildPortugalRoute(coords);
    case "europe_other": return buildEuropeTruckRoute(coords);
  }
}

// ─── Status helpers (unchanged) ────────────────────────────────────────────

export function getRouteColor(worstStatus: string | null): string {
  switch (worstStatus) {
    case "DISRUPTED":
      return "#ef4444";
    case "DELAYED":
      return "#f59e0b";
    default:
      return "#22c55e";
  }
}

export function getRouteWidth(totalQuantity: number): number {
  if (totalQuantity <= 100) return 1.5;
  if (totalQuantity <= 1000) return 2;
  if (totalQuantity <= 5000) return 3;
  return 4;
}
