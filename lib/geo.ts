/**
 * Static geocoding lookup for common manufacturing cities.
 * Maps "City, Country" strings to [latitude, longitude].
 */

const CITY_COORDS: Record<string, [number, number]> = {
  // China
  "guangzhou, china": [23.1291, 113.2644],
  "shenzhen, china": [22.5431, 114.0579],
  "shanghai, china": [31.2304, 121.4737],
  "beijing, china": [39.9042, 116.4074],
  "dongguan, china": [23.0489, 113.7436],
  "hangzhou, china": [30.2741, 120.1551],
  "suzhou, china": [31.2989, 120.5853],
  "ningbo, china": [29.8683, 121.544],
  "qingdao, china": [36.0671, 120.3826],
  "xiamen, china": [24.4798, 118.0894],
  "fuzhou, china": [26.0745, 119.2965],
  "wenzhou, china": [27.9939, 120.6993],
  "tianjin, china": [39.3434, 117.3616],
  "nanjing, china": [32.0603, 118.7969],
  "wuhan, china": [30.5928, 114.3055],
  "chengdu, china": [30.5728, 104.0668],
  "foshan, china": [23.0218, 113.1218],
  "zhongshan, china": [22.5176, 113.3926],
  "jiangmen, china": [22.5789, 113.0815],
  "huizhou, china": [23.1116, 114.4154],
  // Vietnam
  "ho chi minh city, vietnam": [10.8231, 106.6297],
  "hanoi, vietnam": [21.0278, 105.8342],
  "da nang, vietnam": [16.0544, 108.2022],
  "hai phong, vietnam": [20.8449, 106.6881],
  // Bangladesh
  "dhaka, bangladesh": [23.8103, 90.4125],
  "chittagong, bangladesh": [22.3569, 91.7832],
  // India
  "mumbai, india": [19.076, 72.8777],
  "delhi, india": [28.7041, 77.1025],
  "bangalore, india": [12.9716, 77.5946],
  "chennai, india": [13.0827, 80.2707],
  "kolkata, india": [22.5726, 88.3639],
  "tirupur, india": [11.1085, 77.3411],
  "surat, india": [21.1702, 72.8311],
  "ahmedabad, india": [23.0225, 72.5714],
  // Turkey
  "istanbul, turkey": [41.0082, 28.9784],
  "izmir, turkey": [38.4237, 27.1428],
  "bursa, turkey": [40.1885, 29.0610],
  // Indonesia
  "jakarta, indonesia": [-6.2088, 106.8456],
  "surabaya, indonesia": [-7.2575, 112.7521],
  "bandung, indonesia": [-6.9175, 107.6191],
  // Thailand
  "bangkok, thailand": [13.7563, 100.5018],
  // Cambodia
  "phnom penh, cambodia": [11.5564, 104.9282],
  // Myanmar
  "yangon, myanmar": [16.8661, 96.1951],
  // Pakistan
  "karachi, pakistan": [24.8607, 67.0011],
  "lahore, pakistan": [31.5204, 74.3587],
  "faisalabad, pakistan": [31.4504, 73.135],
  // Sri Lanka
  "colombo, sri lanka": [6.9271, 79.8612],
  // Taiwan
  "taipei, taiwan": [25.033, 121.5654],
  "taichung, taiwan": [24.1477, 120.6736],
  // South Korea
  "seoul, south korea": [37.5665, 126.978],
  "busan, south korea": [35.1796, 129.0756],
  // Japan
  "tokyo, japan": [35.6762, 139.6503],
  "osaka, japan": [34.6937, 135.5023],
  // Italy
  "milan, italy": [45.4642, 9.19],
  "florence, italy": [43.7696, 11.2558],
  "prato, italy": [43.8777, 11.1023],
  // Portugal
  "porto, portugal": [41.1579, -8.6291],
  "lisbon, portugal": [38.7223, -9.1393],
  // Spain
  "barcelona, spain": [41.3874, 2.1686],
  // Morocco
  "casablanca, morocco": [33.5731, -7.5898],
  // Ethiopia
  "addis ababa, ethiopia": [9.025, 38.7469],
  // Mexico
  "mexico city, mexico": [19.4326, -99.1332],
  // Brazil
  "sao paulo, brazil": [-23.5505, -46.6333],
  // USA
  "los angeles, usa": [34.0522, -118.2437],
  "new york, usa": [40.7128, -74.006],
  // UK
  "london, uk": [51.5074, -0.1278],
  "manchester, uk": [53.4808, -2.2426],
  // Germany
  "berlin, germany": [52.52, 13.405],
  "munich, germany": [48.1351, 11.582],
  // France
  "paris, france": [48.8566, 2.3522],
  "lyon, france": [45.764, 4.8357],
};

/**
 * Fuzzy-match a location string to coordinates.
 * Tries exact match first, then partial city/country matching.
 */
export function geocode(location: string): [number, number] | null {
  const normalized = location.toLowerCase().trim();

  // Exact match
  if (CITY_COORDS[normalized]) {
    return CITY_COORDS[normalized];
  }

  // Try matching just the city name (first part before comma)
  const parts = normalized.split(",").map((s) => s.trim());
  if (parts.length >= 1) {
    const city = parts[0];
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (key.startsWith(city + ",") || key.startsWith(city + " ")) {
        return coords;
      }
    }
  }

  // Try matching country (second part)
  if (parts.length >= 2) {
    const country = parts[parts.length - 1];
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (key.endsWith(country)) {
        return coords; // Return first city in that country as fallback
      }
    }
  }

  return null;
}

/**
 * Geocode an address using Google Maps Geocoding API.
 * Returns [latitude, longitude] or null if the API call fails.
 */
export async function geocodeWithGoogle(
  address: string
): Promise<[number, number] | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_API_KEY not set, skipping Google geocoding");
    return null;
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "OK" || !data.results?.[0]) return null;

    const { lat, lng } = data.results[0].geometry.location;
    return [lat, lng];
  } catch (error) {
    console.error("Google geocoding error:", error);
    return null;
  }
}

/**
 * Geocode a factory location. Tries Google Maps API first for precision,
 * falls back to static lookup for zero-latency results.
 */
export async function geocodeFactory(
  location: string,
  address?: string | null
): Promise<[number, number] | null> {
  // Try Google API with full address first (most precise)
  if (address) {
    const result = await geocodeWithGoogle(address);
    if (result) return result;
  }

  // Try Google API with location string
  const result = await geocodeWithGoogle(location);
  if (result) return result;

  // Fall back to static lookup
  return geocode(location);
}

/**
 * Parse country from a "City, Country" location string.
 */
export function parseCountry(location: string): string {
  const parts = location.split(",").map((s) => s.trim());
  return parts.length >= 2 ? parts[parts.length - 1] : location;
}

/**
 * Parse city from a "City, Country" location string.
 */
export function parseCity(location: string): string {
  const parts = location.split(",").map((s) => s.trim());
  return parts[0] || location;
}
