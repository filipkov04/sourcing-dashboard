// Chat constants for Support + Factory chat types

export const SOURCY_AGENT = {
  name: "Sourcy Agent",
  color: "#EB5D2E",
  emoji: "🤖",
} as const;

export type ChatType = "SUPPORT" | "FACTORY" | "GENERAL";

export type CategoryDef = {
  key: string;
  label: string;
  emoji: string;
};

export const SUPPORT_CATEGORIES: CategoryDef[] = [
  { key: "order_issue", label: "Order issue", emoji: "📦" },
  { key: "invoice_question", label: "Invoice question", emoji: "🧾" },
  { key: "shipping_delay", label: "Shipping delay", emoji: "🚚" },
  { key: "account_help", label: "Account help", emoji: "👤" },
  { key: "other", label: "Other", emoji: "💬" },
];

export const FACTORY_CATEGORIES: CategoryDef[] = [
  { key: "order_update", label: "Order update", emoji: "📋" },
  { key: "quality_issue", label: "Quality issue", emoji: "🔍" },
  { key: "shipping_inquiry", label: "Shipping inquiry", emoji: "🚢" },
  { key: "document_request", label: "Document request", emoji: "📄" },
  { key: "other", label: "Other", emoji: "💬" },
];

export function getCategoriesForType(type: ChatType): CategoryDef[] {
  if (type === "SUPPORT") return SUPPORT_CATEGORIES;
  if (type === "FACTORY") return FACTORY_CATEGORIES;
  return [];
}

export function getCategoryLabel(type: ChatType, key: string): string {
  const cats = getCategoriesForType(type);
  const cat = cats.find((c) => c.key === key);
  return cat ? `${cat.emoji} ${cat.label}` : key;
}

export function getWelcomeMessage(type: ChatType, category: string): string {
  const catLabel = getCategoryLabel(type, category);

  if (type === "SUPPORT") {
    return `Hi! Our support team has been notified about your **${catLabel}** inquiry. They'll respond shortly. Feel free to describe your issue in detail.`;
  }
  if (type === "FACTORY") {
    return `Welcome to factory chat! Topic: **${catLabel}**. Share your message or drop files below to get started.`;
  }
  return "Conversation started.";
}

// File upload constants
export const CHAT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const CHAT_ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export const CHAT_ALLOWED_EXTENSIONS = ".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.mp4,.mov,.webm";
