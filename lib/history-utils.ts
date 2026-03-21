// Client-safe utilities for formatting order history events
// This file has no server-side dependencies

// Event types for order history tracking
export type OrderEventType =
  | "STATUS_CHANGE"
  | "PROGRESS_CHANGE"
  | "FIELD_CHANGE"
  | "NOTE_CHANGE"
  | "STAGE_ADDED"
  | "STAGE_REMOVED"
  | "STAGE_RENAMED"
  | "ORDER_CREATED"
  | "ADMIN_NOTE";

// Event type for formatting
export type OrderEvent = {
  id: string;
  orderId: string;
  stageId: string | null;
  eventType: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  stageName: string | null;
  createdAt: Date | string;
};

// Format a field name for display
function formatFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    status: "Status",
    progress: "Progress",
    notes: "Notes",
    priority: "Priority",
    expectedDate: "Expected Date",
    actualDate: "Actual Date",
    expectedStartDate: "Expected Start Date",
    placedDate: "Placed Date",
    productName: "Product Name",
    productSKU: "SKU",
    quantity: "Quantity",
    unit: "Unit",
    factoryId: "Factory",
    orderNumber: "Order Number",
    tags: "Tags",
  };
  return fieldNames[field] || field;
}

// Format a status value for display
function formatStatusValue(value: string): string {
  const statusLabels: Record<string, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    BEHIND_SCHEDULE: "Behind Schedule",
    DELAYED: "Delayed",
    DISRUPTED: "Disrupted",
    COMPLETED: "Completed",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    NOT_STARTED: "Not Started",
    SKIPPED: "Skipped",
    BLOCKED: "Blocked",
  };
  return statusLabels[value] || value.replace(/_/g, " ");
}

// Format a priority value for display
function formatPriorityValue(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

// Format a date value for display
function formatDateValue(value: string): string {
  try {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

// Format a value based on its field type
function formatValue(field: string | null, value: string | null): string {
  if (value === null || value === "") return "none";

  if (field === "status") return formatStatusValue(value);
  if (field === "priority") return formatPriorityValue(value);
  if (field === "progress") return `${value}%`;
  if (field === "expectedDate" || field === "actualDate" || field === "expectedStartDate" || field === "placedDate") {
    return formatDateValue(value);
  }
  if (field === "tags") {
    try {
      const tags = JSON.parse(value);
      return Array.isArray(tags) ? tags.join(", ") : value;
    } catch {
      return value;
    }
  }

  return value;
}

// Format an event into a human-readable message
export function formatEventMessage(event: OrderEvent): string {
  const { eventType, field, oldValue, newValue, stageName } = event;

  switch (eventType) {
    case "ORDER_CREATED":
      return "Order was created";

    case "STATUS_CHANGE":
      if (stageName) {
        return `${stageName} status changed from ${formatValue("status", oldValue)} to ${formatValue("status", newValue)}`;
      }
      return `Order status changed from ${formatValue("status", oldValue)} to ${formatValue("status", newValue)}`;

    case "PROGRESS_CHANGE":
      if (stageName) {
        return `${stageName} progress updated from ${formatValue("progress", oldValue)} to ${formatValue("progress", newValue)}`;
      }
      return `Progress updated from ${formatValue("progress", oldValue)} to ${formatValue("progress", newValue)}`;

    case "NOTE_CHANGE": {
      const truncated = newValue && newValue.length > 80 ? newValue.slice(0, 80) + "…" : newValue;
      if (stageName) {
        if (!oldValue && newValue) {
          return `Note added to ${stageName}: "${truncated}"`;
        }
        if (oldValue && !newValue) {
          return `Note removed from ${stageName}`;
        }
        return `Note updated on ${stageName}: "${truncated}"`;
      }
      if (!oldValue && newValue) {
        return `Note added to order: "${truncated}"`;
      }
      if (oldValue && !newValue) {
        return "Note removed from order";
      }
      return `Order notes updated: "${truncated}"`;
    }

    case "FIELD_CHANGE":
      const fieldName = formatFieldName(field || "");
      const oldFormatted = formatValue(field, oldValue);
      const newFormatted = formatValue(field, newValue);
      return `${fieldName} changed from ${oldFormatted} to ${newFormatted}`;

    case "STAGE_ADDED":
      return `Stage "${newValue}" was added`;

    case "STAGE_REMOVED":
      return `Stage "${oldValue}" was removed`;

    case "STAGE_RENAMED":
      return `Stage "${oldValue}" was renamed to "${newValue}"`;

    case "ADMIN_NOTE":
      return newValue || "Update added";

    default:
      return "Order was updated";
  }
}

// Get the icon type for an event
export function getEventIconType(event: OrderEvent): "status" | "progress" | "note" | "field" | "stage" | "created" | "admin" {
  switch (event.eventType) {
    case "ORDER_CREATED":
      return "created";
    case "STATUS_CHANGE":
      return "status";
    case "PROGRESS_CHANGE":
      return "progress";
    case "NOTE_CHANGE":
      return "note";
    case "STAGE_ADDED":
    case "STAGE_REMOVED":
    case "STAGE_RENAMED":
      return "stage";
    case "ADMIN_NOTE":
      return "admin";
    default:
      return "field";
  }
}

// Get the color theme for an event based on status changes
export function getEventColor(event: OrderEvent): "green" | "blue" | "orange" | "red" | "purple" | "gray" {
  const { eventType, newValue, field } = event;

  // Status changes get colors based on the new status
  if (eventType === "STATUS_CHANGE") {
    switch (newValue) {
      case "COMPLETED":
      case "DELIVERED":
        return "green";
      case "IN_PROGRESS":
        return "blue";
      case "BEHIND_SCHEDULE":
      case "DELAYED":
        return "orange";
      case "DISRUPTED":
      case "BLOCKED":
      case "CANCELLED":
        return "red";
      default:
        return "gray";
    }
  }

  // Progress changes
  if (eventType === "PROGRESS_CHANGE") {
    const progress = parseInt(newValue || "0");
    if (progress === 100) return "green";
    if (progress > 0) return "blue";
    return "gray";
  }

  // Stage additions are green, removals are red
  if (eventType === "STAGE_ADDED") return "green";
  if (eventType === "STAGE_REMOVED") return "red";
  if (eventType === "STAGE_RENAMED") return "blue";

  // Order created
  if (eventType === "ORDER_CREATED") return "green";

  // Admin notes show as purple (team-authored)
  if (eventType === "ADMIN_NOTE") return "purple";

  // Priority changes
  if (field === "priority") {
    if (newValue === "URGENT") return "red";
    if (newValue === "HIGH") return "orange";
    return "gray";
  }

  return "gray";
}
