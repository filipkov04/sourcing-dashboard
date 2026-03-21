export type MapFactory = {
  id: string;
  name: string;
  location: string;
  address: string | null;
  country: string;
  city: string;
  lat: number;
  lng: number;
  orderCount: number;
  verificationStatus: "VERIFIED" | "UNVERIFIED" | "PENDING";
  categories: string[];
  capabilities: string[];
  moqMin: number | null;
  leadTimeDays: number | null;
  reliabilityScore: number | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isPreferred: boolean;
  lastQcAt: string | null;
  // Shipping route fields
  worstOrderStatus: "PENDING" | "IN_PROGRESS" | "DELAYED" | "DISRUPTED" | null;
  totalOrderQuantity: number;
  // Contact fields
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export type FactoryOrder = {
  id: string;
  orderNumber: string;
  productName: string;
  status: string;
  quantity: number;
  unit: string;
  overallProgress: number;
  expectedDate: string;
  priority: string;
};

export type LiveShipment = {
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string | null;
  currentLat: number;
  currentLng: number;
  currentLocation: string | null;
  trackingStatus: string | null;
  estimatedArrival: string | null;
  factoryId: string;
  factoryLat: number | null;
  factoryLng: number | null;
};

export type MapStats = {
  totalManufacturers: number;
  countriesCovered: number;
  activeProductions: number;
  verifiedPercent: number;
  lastUpdated: string;
};

export type MapVehicle = {
  orderId: string;
  orderNumber: string;
  productName: string;
  status: string;
  quantity: number;
  unit: string;
  trackingNumber: string | null;
  carrier: string | null;
  shippingMethod: string | null;
  trackingStatus: string | null;
  estimatedArrival: string | null;
  lastTrackingSync: string | null;
  expectedStartDate: string;
  expectedDate: string | null;
  currentLocation: string | null;
  lat: number;
  lng: number;
  bearing: number;
  vehicleType: "ship" | "plane" | "truck";
  factoryId: string;
  factoryName: string;
  factoryLat: number;
  factoryLng: number;
  factoryLocation: string;
  factoryContact: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  trackingEvents: Array<{
    id: string;
    timestamp: string;
    location: string | null;
    description: string;
    trackingStatus: string;
  }>;
  routeStops: Array<{
    name: string;
    coords: [number, number];
    type: string;
    description: string;
    icon: string;
  }>;
  routeSegments: Array<{
    coordinates: [number, number][];
    transportMethod: "ship" | "truck";
  }>;
};
