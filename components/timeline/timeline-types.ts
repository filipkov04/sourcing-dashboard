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
    bgColor: "bg-zinc-800",
    borderColor: "border-zinc-600",
    iconColor: "text-zinc-500",
    glowColor: "shadow-zinc-500/20",
  },
  IN_PROGRESS: {
    bgColor: "bg-blue-900/40",
    borderColor: "border-blue-500",
    iconColor: "text-blue-400",
    glowColor: "shadow-blue-500/40",
  },
  COMPLETED: {
    bgColor: "bg-green-900/40",
    borderColor: "border-green-500",
    iconColor: "text-green-400",
    glowColor: "shadow-green-500/30",
  },
  DELAYED: {
    bgColor: "bg-orange-900/40",
    borderColor: "border-orange-500",
    iconColor: "text-orange-400",
    glowColor: "shadow-orange-500/30",
  },
  BLOCKED: {
    bgColor: "bg-red-900/40",
    borderColor: "border-red-500",
    iconColor: "text-red-400",
    glowColor: "shadow-red-500/30",
  },
  SKIPPED: {
    bgColor: "bg-zinc-800/60",
    borderColor: "border-zinc-600",
    iconColor: "text-zinc-500",
    glowColor: "shadow-zinc-500/10",
  },
  ORDER: {
    bgColor: "bg-purple-900/40",
    borderColor: "border-purple-500",
    iconColor: "text-purple-400",
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
