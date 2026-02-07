// Timeline types and status configuration

export type TimelineNodeType = "order-info" | "stage";

export type StageStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED"
  | "DELAYED"
  | "BLOCKED";

export type StatusConfigItem = {
  bgColor: string;
  borderColor: string;
  iconColor: string;
  glowColor: string;
};

export const statusConfig: Record<StageStatus | "ORDER", StatusConfigItem> = {
  NOT_STARTED: {
    bgColor: "bg-gray-100 dark:bg-zinc-800",
    borderColor: "border-gray-300 dark:border-zinc-600",
    iconColor: "text-gray-400 dark:text-zinc-500",
    glowColor: "shadow-zinc-500/20",
  },
  IN_PROGRESS: {
    bgColor: "bg-blue-50 dark:bg-blue-900/40",
    borderColor: "border-blue-400 dark:border-blue-500",
    iconColor: "text-blue-500 dark:text-blue-400",
    glowColor: "shadow-blue-500/40",
  },
  COMPLETED: {
    bgColor: "bg-green-50 dark:bg-green-900/40",
    borderColor: "border-green-400 dark:border-green-500",
    iconColor: "text-green-500 dark:text-green-400",
    glowColor: "shadow-green-500/30",
  },
  DELAYED: {
    bgColor: "bg-orange-50 dark:bg-orange-900/40",
    borderColor: "border-orange-400 dark:border-orange-500",
    iconColor: "text-orange-500 dark:text-orange-400",
    glowColor: "shadow-orange-500/30",
  },
  BLOCKED: {
    bgColor: "bg-red-50 dark:bg-red-900/40",
    borderColor: "border-red-400 dark:border-red-500",
    iconColor: "text-red-500 dark:text-red-400",
    glowColor: "shadow-red-500/30",
  },
  SKIPPED: {
    bgColor: "bg-gray-100 dark:bg-zinc-800/60",
    borderColor: "border-gray-300 dark:border-zinc-600",
    iconColor: "text-gray-400 dark:text-zinc-500",
    glowColor: "shadow-zinc-500/10",
  },
  ORDER: {
    bgColor: "bg-purple-50 dark:bg-purple-900/40",
    borderColor: "border-purple-400 dark:border-purple-500",
    iconColor: "text-purple-500 dark:text-purple-400",
    glowColor: "shadow-purple-500/30",
  },
};

// Stage icon mapping for visual representation
export const stageIcons: Record<string, string> = {
  // Common manufacturing stages
  cutting: "scissors",
  sewing: "needle",
  "quality control": "check",
  qc: "check",
  shipping: "package",
  packing: "package",
  packaging: "package",
  dyeing: "droplet",
  printing: "printer",
  embroidery: "sparkles",
  inspection: "search",
  assembly: "wrench",
  finishing: "star",
  washing: "droplets",
  ironing: "flame",
  labeling: "tag",
  sampling: "beaker",
  // Default fallback handled in component
};

export type TimelineStage = {
  id: string;
  name: string;
  sequence: number;
  progress: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
};
