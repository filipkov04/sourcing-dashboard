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

export type MapStats = {
  totalManufacturers: number;
  countriesCovered: number;
  activeProductions: number;
  verifiedPercent: number;
  lastUpdated: string;
};
