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
};

export type MapStats = {
  totalManufacturers: number;
  countriesCovered: number;
  activeProductions: number;
  verifiedPercent: number;
  lastUpdated: string;
};
