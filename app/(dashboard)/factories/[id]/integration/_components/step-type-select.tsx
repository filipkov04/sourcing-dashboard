"use client";

import { Globe, Server, Webhook, Hand } from "lucide-react";
import type { IntegrationType } from "@prisma/client";

const TYPES: {
  value: IntegrationType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "REST",
    label: "REST API",
    description: "Connect to factory ERP via HTTP endpoints. Supports Bearer, Basic, and API key auth.",
    icon: <Globe className="h-5 w-5" />,
  },
  {
    value: "SFTP",
    label: "SFTP File Transfer",
    description: "Download CSV/JSON order files from a remote SFTP server on a schedule.",
    icon: <Server className="h-5 w-5" />,
  },
  {
    value: "WEBHOOK",
    label: "Webhook Receiver",
    description: "Factory pushes order updates to your webhook endpoint. HMAC-SHA256 verified.",
    icon: <Webhook className="h-5 w-5" />,
  },
  {
    value: "MANUAL",
    label: "Manual Entry",
    description: "No automated sync — orders are entered manually or via CSV upload.",
    icon: <Hand className="h-5 w-5" />,
  },
];

export function StepTypeSelect({
  selected,
  onSelect,
}: {
  selected: IntegrationType | null;
  onSelect: (type: IntegrationType) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Choose Connection Type
      </h2>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
        How does this factory share order data?
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => onSelect(t.value)}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              selected === t.value
                ? "border-[#FF4D15] bg-orange-50/50 dark:bg-orange-950/20"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-lg ${
                  selected === t.value
                    ? "bg-[#FF4D15]/10 text-[#FF4D15]"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                {t.icon}
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {t.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              {t.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
