// Sourcing Dashboard - Shared TypeScript Types
// This file contains all shared types used across the application
// to ensure consistency between frontend and backend

import { Prisma } from "@prisma/client";

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Standard API success response
 */
export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  message?: string;
};

/**
 * Standard API error response
 */
export type ApiErrorResponse = {
  success: false;
  error: string;
  details?: unknown;
};

/**
 * Combined API response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// PRISMA-BASED TYPES (for Frontend Use)
// ============================================

/**
 * User with organization data included
 */
export type UserWithOrganization = Prisma.UserGetPayload<{
  include: { organization: true };
}>;

/**
 * Factory with organization and order count
 */
export type FactoryWithDetails = Prisma.FactoryGetPayload<{
  include: {
    organization: true;
    orders: true;
  };
}>;

/**
 * Factory list item (lighter version for list views)
 */
export type FactoryListItem = Prisma.FactoryGetPayload<{
  include: {
    _count: {
      select: { orders: true };
    };
    orders: {
      select: { id: true };
    };
  };
}>;

/**
 * Order with full relations
 */
export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    factory: true;
    organization: true;
    stages: {
      orderBy: { sequence: "asc" };
    };
  };
}>;

/**
 * Order list item (lighter version for list views)
 */
export type OrderListItem = Prisma.OrderGetPayload<{
  include: {
    factory: {
      select: {
        id: true;
        name: true;
        location: true;
      };
    };
    _count: {
      select: { stages: true };
    };
  };
}>;

/**
 * Order stage with order reference
 */
export type OrderStageWithOrder = Prisma.OrderStageGetPayload<{
  include: { order: true };
}>;

// ============================================
// FORM INPUT TYPES (for Validation & Forms)
// ============================================

/**
 * Factory creation/update form data
 */
export type FactoryFormData = {
  name: string;
  location: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

/**
 * Order creation form data
 */
export type OrderFormData = {
  orderNumber: string | null;
  productName: string;
  productSKU?: string;
  quantity: number;
  unit: string;
  factoryId: string;
  expectedStartDate: Date | string;
  placedDate?: Date | string | null;
  expectedDate: Date | string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  notes?: string;
  tags?: string[];
  stages?: OrderStageFormData[];
};

/**
 * Order update form data (partial)
 */
export type OrderUpdateFormData = Partial<OrderFormData> & {
  status?: "PENDING" | "IN_PROGRESS" | "BEHIND_SCHEDULE" | "DELAYED" | "DISRUPTED" | "COMPLETED" | "SHIPPED" | "IN_TRANSIT" | "CUSTOMS" | "DELIVERED" | "CANCELLED";
  overallProgress?: number;
};

/**
 * Order stage form data
 */
export type OrderStageFormData = {
  name: string;
  sequence: number;
  notes?: string;
};

/**
 * Order stage progress update
 */
export type StageProgressUpdate = {
  stageId: string;
  progress: number;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "BEHIND_SCHEDULE" | "COMPLETED" | "SKIPPED" | "DELAYED" | "BLOCKED";
  notes?: string;
};

/**
 * User registration form data
 */
export type UserRegistrationData = {
  email: string;
  password: string;
  name: string;
  organizationName: string;
};

/**
 * User login form data
 */
export type UserLoginData = {
  email: string;
  password: string;
};

// ============================================
// FILTER & QUERY TYPES
// ============================================

/**
 * Order list filters
 */
export type OrderFilters = {
  status?: "PENDING" | "IN_PROGRESS" | "BEHIND_SCHEDULE" | "DELAYED" | "DISRUPTED" | "COMPLETED" | "SHIPPED" | "IN_TRANSIT" | "CUSTOMS" | "DELIVERED" | "CANCELLED";
  factoryId?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  search?: string;
  startDate?: Date | string;
  endDate?: Date | string;
};

/**
 * Factory list filters
 */
export type FactoryFilters = {
  search?: string;
  location?: string;
};

/**
 * Pagination parameters
 */
export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// ============================================
// DASHBOARD & ANALYTICS TYPES
// ============================================

/**
 * Dashboard statistics
 */
export type DashboardStats = {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  delayedOrders: number;
  totalFactories: number;
  ordersByStatus: {
    status: string;
    count: number;
  }[];
  ordersByFactory: {
    factoryId: string;
    factoryName: string;
    count: number;
  }[];
  recentActivity: ActivityItem[];
};

/**
 * Activity item for activity feed
 */
export type ActivityItem = {
  id: string;
  type: "order_created" | "order_updated" | "stage_completed" | "factory_added";
  message: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
};

/**
 * Chart data point
 */
export type ChartDataPoint = {
  label: string;
  value: number;
  color?: string;
};

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Generic list response with pagination
 */
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Date range
 */
export type DateRange = {
  start: Date;
  end: Date;
};

/**
 * Sort configuration
 */
export type SortConfig = {
  field: string;
  direction: "asc" | "desc";
};

/**
 * Select option (for dropdowns)
 */
export type SelectOption = {
  label: string;
  value: string;
};

// ============================================
// CHART DATA TYPES
// ============================================

/**
 * Chart data for orders over time
 */
export type OrdersOverTimeData = Array<{
  date: string;
  count: number;
}>;

/**
 * Chart data for orders by status
 */
export type OrdersByStatusData = Array<{
  name: string;
  value: number;
  color: string;
}>;

/**
 * Chart data for product portfolio (pie chart)
 */
export type ProductPortfolioData = Array<{
  name: string;
  value: number;
  color: string;
  percentage: number;
}>;

/**
 * Dashboard metrics
 */
export type DashboardMetrics = {
  totalOrders: number;
  activeOrders: number;
  totalFactories: number;
  delayedOrders: number;
};

// ============================================
// HELPER FUNCTIONS (Type Guards)
// ============================================

/**
 * Type guard to check if API response is successful
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if API response is an error
 */
export function isApiError(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}

// ============================================
// PRODUCT & INVENTORY TYPES
// ============================================

export type ProductListItem = Prisma.ProductGetPayload<{
  include: {
    _count: { select: { stockLevels: true; transactions: true } };
    stockLevels: { select: { onHand: true; reserved: true; available: true; inTransit: true; backorder: true; runwayStatus: true; totalValue: true } };
  };
}>;

export type ProductWithStock = Prisma.ProductGetPayload<{
  include: {
    stockLevels: { include: { location: true } };
    _count: { select: { transactions: true } };
  };
}>;

export type InventoryLocationItem = Prisma.InventoryLocationGetPayload<{
  include: {
    _count: { select: { stockLevels: true } };
  };
}>;
