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

export type RouteStop = {
  coords: [number, number];
  name: string;
  description: string;
  type: "factory" | "port" | "strait" | "canal" | "harbor" | "customs" | "hub" | "destination";
  icon: string;
};

export type ShippingRoute = {
  segments: RouteSegment[];
  stops: RouteStop[];
  departurePort: string | null;
  arrivalPort: string | null;
};

// ─── Common stops ──────────────────────────────────────────────────────────

const MALACCA_STOP: RouteStop = {
  coords: [103.5, 1.3],
  name: "Strait of Malacca",
  description: "Container vessel transits the Strait of Malacca — one of the world's busiest shipping lanes connecting the Indian Ocean to the Pacific.",
  type: "strait",
  icon: "⚓",
};

const SUEZ_STOP: RouteStop = {
  coords: [32.35, 30.6],
  name: "Suez Canal",
  description: "Ship enters the Suez Canal. Containers pass through the 193km canal connecting the Red Sea to the Mediterranean, avoiding the route around Africa.",
  type: "canal",
  icon: "🚢",
};

const KOPER_STOP: RouteStop = {
  coords: [13.73, 45.55],
  name: "Port of Koper, Slovenia",
  description: "Container unloaded at Koper — the closest major EU port to Central Europe. Goods are cleared through EU customs, inspected, and transferred to truck for overland delivery.",
  type: "harbor",
  icon: "🏗️",
};

const VIENNA_HUB_STOP: RouteStop = {
  coords: [16.37, 48.21],
  name: "Vienna Logistics Hub",
  description: "Shipment arrives at the Vienna distribution center. Cargo is sorted, consolidated, and transferred to last-mile delivery carrier (DPD/GLS) for final delivery to Slovakia.",
  type: "hub",
  icon: "📦",
};

const DESTINATION_STOP: RouteStop = {
  coords: DESTINATION_COORDS,
  name: "Chorvatský Grob, Bratislava",
  description: "Final delivery — last-mile carrier delivers the order to the warehouse at Suché Miesto 20, Chorvatský Grob. Order received, inspected, and checked into inventory.",
  type: "destination",
  icon: "🏁",
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

  const seaWaypoints: [number, number][] = isNorth
    ? [port.coords, [120, 25], ...SOUTH_CHINA_SEA, ...MALACCA_STRAIT, ...INDIAN_OCEAN, ...ARABIAN_SEA_TO_SUEZ, ...MEDITERRANEAN_TO_KOPER]
    : [port.coords, ...SOUTH_CHINA_SEA, ...MALACCA_STRAIT, ...INDIAN_OCEAN, ...ARABIAN_SEA_TO_SUEZ, ...MEDITERRANEAN_TO_KOPER];

  return {
    segments: [
      { coordinates: [factoryCoords, port.coords], transportMethod: "truck" },
      { coordinates: seaWaypoints, transportMethod: "ship" },
      { coordinates: KOPER_TO_BRATISLAVA, transportMethod: "truck" },
    ],
    stops: [
      { coords: factoryCoords, name: "Factory", description: "Order packed into shipping containers at the factory. Quality inspection completed, export paperwork filed.", type: "factory", icon: "🏭" },
      { coords: port.coords, name: `Port of ${port.name}`, description: `Containers loaded onto cargo vessel at ${port.name} port. Ship departs for Europe via the southern sea route.`, type: "port", icon: "🚢" },
      MALACCA_STOP,
      SUEZ_STOP,
      KOPER_STOP,
      VIENNA_HUB_STOP,
      DESTINATION_STOP,
    ],
    departurePort: port.name,
    arrivalPort: "Koper",
  };
}

function buildBangladeshRoute(factoryCoords: [number, number]): ShippingRoute {
  const port = PORTS.chittagong;
  const seaWaypoints: [number, number][] = [
    port.coords,
    [88, 15],
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
    stops: [
      { coords: factoryCoords, name: "Factory", description: "Order packed into containers. Export clearance processed at Dhaka customs.", type: "factory", icon: "🏭" },
      { coords: port.coords, name: "Port of Chittagong", description: "Containers loaded onto cargo vessel at Chittagong — Bangladesh's largest seaport. Ship departs across the Bay of Bengal.", type: "port", icon: "🚢" },
      SUEZ_STOP,
      KOPER_STOP,
      VIENNA_HUB_STOP,
      DESTINATION_STOP,
    ],
    departurePort: port.name,
    arrivalPort: "Koper",
  };
}

function buildIndiaRoute(factoryCoords: [number, number]): ShippingRoute {
  const port = PORTS.mumbai;
  const seaWaypoints: [number, number][] = [
    port.coords,
    [68, 17],
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
    stops: [
      { coords: factoryCoords, name: "Factory", description: "Order packed and sealed in containers. Export documentation filed with Indian customs.", type: "factory", icon: "🏭" },
      { coords: port.coords, name: "Port of Mumbai (JNPT)", description: "Containers loaded onto vessel at Jawaharlal Nehru Port — India's busiest container port. Ship heads west across the Arabian Sea.", type: "port", icon: "🚢" },
      SUEZ_STOP,
      KOPER_STOP,
      VIENNA_HUB_STOP,
      DESTINATION_STOP,
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
    stops: [
      { coords: factoryCoords, name: "Factory", description: "Order packed into containers at the factory. Vietnamese customs export clearance completed.", type: "factory", icon: "🏭" },
      { coords: port.coords, name: "Cat Lai Port, HCMC", description: "Containers loaded onto cargo vessel at Cat Lai — Vietnam's largest container terminal. Ship departs south through the South China Sea.", type: "port", icon: "🚢" },
      MALACCA_STOP,
      SUEZ_STOP,
      KOPER_STOP,
      VIENNA_HUB_STOP,
      DESTINATION_STOP,
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
    stops: [
      { coords: factoryCoords, name: "Factory", description: "Order packed into containers. Thai customs export clearance completed.", type: "factory", icon: "🏭" },
      { coords: port.coords, name: "Laem Chabang Port", description: "Containers loaded onto vessel at Laem Chabang — Thailand's largest deep-sea port. Ship heads south through the Gulf of Thailand.", type: "port", icon: "🚢" },
      MALACCA_STOP,
      SUEZ_STOP,
      KOPER_STOP,
      VIENNA_HUB_STOP,
      DESTINATION_STOP,
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
    stops: [
      { coords: factoryCoords, name: "Factory", description: "Order packed into containers. Indonesian customs export clearance completed.", type: "factory", icon: "🏭" },
      { coords: port.coords, name: "Tanjung Priok Port, Jakarta", description: "Containers loaded onto cargo vessel at Jakarta's main port. Ship heads north through the Java Sea toward Singapore.", type: "port", icon: "🚢" },
      MALACCA_STOP,
      SUEZ_STOP,
      KOPER_STOP,
      VIENNA_HUB_STOP,
      DESTINATION_STOP,
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
    stops: [
      { coords: factoryCoords, name: "Factory", description: "Order packed and loaded onto truck. Turkish customs export documentation prepared.", type: "factory", icon: "🏭" },
      { coords: [29.01, 41.01], name: "Istanbul", description: "Truck departs Istanbul heading west through Thrace. Crosses the Turkey-Bulgaria border at Kapıkule/Kapitan Andreevo checkpoint.", type: "customs", icon: "🛃" },
      { coords: [20.46, 44.82], name: "Belgrade, Serbia", description: "Truck passes through Belgrade — major transit hub on the E75 highway corridor. Brief rest stop and fuel.", type: "hub", icon: "📦" },
      { coords: [19.04, 47.50], name: "Budapest, Hungary", description: "Truck crosses into the EU at the Hungarian border. EU customs clearance completed. Continues north on the M1 motorway.", type: "customs", icon: "🛃" },
      VIENNA_HUB_STOP,
      DESTINATION_STOP,
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
    stops: [
      { coords: factoryCoords, name: "Factory", description: "Order packed and loaded onto truck. Italian domestic shipping documents prepared.", type: "factory", icon: "🏭" },
      { coords: [11.10, 43.88], name: "Prato, Tuscany", description: "Truck departs from Prato — Italy's largest textile manufacturing district. Heads north on the A1 Autostrada.", type: "hub", icon: "📦" },
      { coords: [11.35, 44.49], name: "Bologna", description: "Truck passes through Bologna interchange. Switches to A13 heading northeast toward Venice and Austria.", type: "hub", icon: "📦" },
      { coords: [15.44, 47.07], name: "Graz, Austria", description: "Truck crosses the Alps via Villach-Klagenfurt and arrives in Graz. EU internal transit — no customs stop.", type: "hub", icon: "📦" },
      VIENNA_HUB_STOP,
      DESTINATION_STOP,
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
    stops: [
      { coords: factoryCoords, name: "Factory", description: "Order packed and loaded onto truck. Portuguese domestic shipping documents prepared.", type: "factory", icon: "🏭" },
      { coords: [-8.61, 41.15], name: "Porto, Portugal", description: "Truck departs from Porto — Portugal's textile and footwear manufacturing hub. Heads east across the Iberian Peninsula.", type: "hub", icon: "📦" },
      { coords: [-3.70, 40.42], name: "Madrid, Spain", description: "Truck passes through Madrid logistics ring. Refuels and continues east on the E-90 toward the Mediterranean coast.", type: "hub", icon: "📦" },
      { coords: [2.17, 41.39], name: "Barcelona, Spain", description: "Truck reaches Barcelona. Turns north along the Mediterranean coast toward France.", type: "hub", icon: "📦" },
      { coords: [8.95, 44.41], name: "Genoa, Italy", description: "Truck enters Italy via the Côte d'Azur. Passes through Genoa heading east toward the Po Valley.", type: "hub", icon: "📦" },
      { coords: [15.44, 47.07], name: "Graz, Austria", description: "Truck crosses the Alps and reaches Graz. Continues north on the A2 motorway toward Vienna.", type: "hub", icon: "📦" },
      VIENNA_HUB_STOP,
      DESTINATION_STOP,
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
    stops: [
      { coords: factoryCoords, name: "Factory", description: "Order packed and loaded onto truck for direct overland delivery within Europe.", type: "factory", icon: "🏭" },
      VIENNA_HUB_STOP,
      DESTINATION_STOP,
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
      return "#dc2626";
    case "DELAYED":
      return "#d97706";
    default:
      return "#94a3b8";
  }
}

export function getRouteWidth(totalQuantity: number): number {
  if (totalQuantity <= 100) return 1.5;
  if (totalQuantity <= 1000) return 2;
  if (totalQuantity <= 5000) return 3;
  return 4;
}
