// Chat constants for Support + Factory chat types

export const SOURCY_AGENT = {
  name: "Sourcy Agent",
  color: "#EB5D2E",
  emoji: "\u{1F916}",
} as const;

export type ChatType = "SUPPORT" | "FACTORY" | "GENERAL";

export type CategoryDef = {
  key: string;
  label: string;
  emoji: string;
};

export const SUPPORT_CATEGORIES: CategoryDef[] = [
  { key: "order_issue", label: "Order issue", emoji: "\u{1F4E6}" },
  { key: "invoice_question", label: "Invoice question", emoji: "\u{1F9FE}" },
  { key: "shipping_delay", label: "Shipping delay", emoji: "\u{1F69A}" },
  { key: "account_help", label: "Account help", emoji: "\u{1F464}" },
  { key: "other", label: "Other", emoji: "\u{1F4AC}" },
];

export const FACTORY_CATEGORIES: CategoryDef[] = [
  { key: "order_update", label: "Order update", emoji: "\u{1F4CB}" },
  { key: "quality_issue", label: "Quality issue", emoji: "\u{1F50D}" },
  { key: "shipping_inquiry", label: "Shipping inquiry", emoji: "\u{1F6A2}" },
  { key: "document_request", label: "Document request", emoji: "\u{1F4C4}" },
  { key: "other", label: "Other", emoji: "\u{1F4AC}" },
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

export const SUPPORT_GREETING = "Hi there! \u{1F44B} How can I help you today?";

export function getWelcomeMessage(type: ChatType, category: string): string {
  const catLabel = getCategoryLabel(type, category);

  if (type === "SUPPORT") {
    return SUPPORT_GREETING;
  }
  if (type === "FACTORY") {
    return `Welcome to factory chat! Topic: **${catLabel}**. Share your message or drop files below to get started.`;
  }
  return "Conversation started.";
}

export function getAutoReply(category: string): string {
  switch (category) {
    case "order_issue":
      return "I've flagged your order issue. Our team will review it and get back to you shortly. Feel free to share details \u2014 order number, screenshots, etc.";
    case "invoice_question":
      return "Got it! Share your invoice number or details and our finance team will look into it.";
    case "shipping_delay":
      return "I understand shipping delays are frustrating. Let me connect you with our logistics team. Please share the order number so we can track it.";
    case "account_help":
      return "Happy to help with your account! What do you need \u2014 access changes, settings, or something else?";
    case "other":
    default:
      return "Thanks for reaching out! Please describe what you need help with and our team will respond shortly.";
  }
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
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
];

export const CHAT_ALLOWED_EXTENSIONS = ".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.mp4,.mov,.webm,.ogg,.m4a,.mp3,.wav";
