"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IntegrationType } from "@prisma/client";

const OUR_FIELDS = [
  { key: "orderNumber", label: "Order Number", required: true, description: "Unique order identifier (e.g. PO number)" },
  { key: "status", label: "Status", required: false, description: "Order status text (e.g. 'in_progress', 'shipped')" },
  { key: "progress", label: "Progress %", required: false, description: "Overall completion percentage (0-100)" },
  { key: "stages", label: "Stages Array", required: false, description: "JSON array of production stages" },
  { key: "stageNameField", label: "Stage Name Field", required: false, description: "Field name for stage name within stage objects" },
  { key: "stageProgressField", label: "Stage Progress Field", required: false, description: "Field name for stage progress within stage objects" },
  { key: "stageStatusField", label: "Stage Status Field", required: false, description: "Field name for stage status within stage objects" },
  { key: "trackingNumber", label: "Tracking Number", required: false, description: "Carrier tracking number for shipment" },
];

type Props = {
  type: IntegrationType;
  config: Record<string, unknown>;
  onUpdate: (config: Record<string, unknown>) => void;
};

export function StepFieldMapping({ type, config, onUpdate }: Props) {
  const fieldMap = (config.fieldMap as Record<string, string>) ?? {};

  const setField = (ourField: string, theirField: string) => {
    const updated = { ...fieldMap, [ourField]: theirField };
    if (!theirField) delete updated[ourField];
    onUpdate({ ...config, fieldMap: updated });
  };

  if (type === "MANUAL") {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Field Mapping
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
          Manual integrations don&apos;t need field mapping. Data is entered directly in your format.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Map Data Fields
      </h2>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
        Map the factory&apos;s field names to SourceTrack fields. Enter the field name as it appears in the factory&apos;s data.
      </p>

      <div className="space-y-3">
        {OUR_FIELDS.map((field) => (
          <div key={field.key} className="grid grid-cols-2 gap-3 items-start">
            <div>
              <Label className="text-gray-700 dark:text-zinc-300 text-xs flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </Label>
              <p className="text-[10px] text-zinc-400 mt-0.5">{field.description}</p>
            </div>
            <Input
              value={fieldMap[field.key] ?? ""}
              onChange={(e) => setField(field.key, e.target.value)}
              placeholder={field.key === "orderNumber" ? "po_number" : field.key}
              className="text-sm"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
        <p className="text-[11px] text-zinc-400">
          <span className="font-medium text-zinc-500">Example:</span> If the factory API returns{" "}
          <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{"{ po_number: 'PO-001', completion: 85 }"}</code>,
          map <strong>Order Number</strong> → <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">po_number</code> and{" "}
          <strong>Progress %</strong> → <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">completion</code>.
        </p>
      </div>
    </div>
  );
}
