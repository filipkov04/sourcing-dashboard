"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type StageMetadataEntry = { key: string; value: string };

export type Stage = {
  id: string;
  name: string;
  sequence: number;
  progress?: number;
  status?: string;
  expectedStartDate?: string;
  expectedEndDate?: string;
  notes?: string;
  metadata?: StageMetadataEntry[];
};

interface SortableStageItemProps {
  stage: Stage;
  index: number;
  onNameChange: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onStageUpdate?: (id: string, updates: Partial<Stage>) => void;
  canRemove: boolean;
  isLoading: boolean;
  expanded?: boolean;
  onToggleExpand?: (id: string) => void;
  showDetails?: boolean;
}

const METADATA_PRESETS: Record<string, { key: string; value: string }[]> = {
  "Material Sourcing": [
    { key: "Fabric Type", value: "" },
    { key: "Color", value: "" },
    { key: "Supplier", value: "" },
  ],
  "Cutting": [
    { key: "Pattern", value: "" },
    { key: "Pieces", value: "" },
  ],
  "Sewing": [
    { key: "Stitch Type", value: "" },
    { key: "Thread Color", value: "" },
  ],
  "Quality Check": [
    { key: "Inspector", value: "" },
    { key: "Defect Rate", value: "" },
  ],
  "Packaging": [
    { key: "Box Type", value: "" },
    { key: "Labels", value: "" },
  ],
};

export function SortableStageItem({
  stage,
  index,
  onNameChange,
  onRemove,
  onStageUpdate,
  canRemove,
  isLoading,
  expanded = false,
  onToggleExpand,
  showDetails = false,
}: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const metadata = stage.metadata || [];

  const addMetadataRow = () => {
    onStageUpdate?.(stage.id, {
      metadata: [...metadata, { key: "", value: "" }],
    });
  };

  const removeMetadataRow = (idx: number) => {
    onStageUpdate?.(stage.id, {
      metadata: metadata.filter((_, i) => i !== idx),
    });
  };

  const updateMetadataRow = (idx: number, field: "key" | "value", val: string) => {
    onStageUpdate?.(stage.id, {
      metadata: metadata.map((m, i) => (i === idx ? { ...m, [field]: val } : m)),
    });
  };

  const applyPresets = () => {
    const presets = METADATA_PRESETS[stage.name];
    if (!presets) return;
    // Only add presets whose keys aren't already present
    const existingKeys = new Set(metadata.map((m) => m.key));
    const newEntries = presets.filter((p) => !existingKeys.has(p.key));
    if (newEntries.length > 0) {
      onStageUpdate?.(stage.id, {
        metadata: [...metadata, ...newEntries],
      });
    }
  };

  const hasPresets = METADATA_PRESETS[stage.name] !== undefined;
  const hasDetails = stage.expectedStartDate || stage.expectedEndDate || stage.notes || (metadata.length > 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "opacity-50 bg-gray-100 dark:bg-zinc-700/50 rounded-md" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 touch-none"
          {...attributes}
          {...listeners}
          disabled={isLoading}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400 text-sm font-medium">
          {index + 1}
        </div>
        <Input
          id={`stage-name-${stage.id}`}
          name={`stage-name-${stage.id}`}
          placeholder="Stage name (e.g., Cutting, Sewing)"
          value={stage.name}
          onChange={(e) => onNameChange(stage.id, e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        {showDetails && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpand?.(stage.id)}
            disabled={isLoading}
            className="text-xs text-gray-500 dark:text-zinc-400"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="ml-1">{hasDetails ? "Details" : "Add details"}</span>
          </Button>
        )}
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(stage.id)}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 text-zinc-500 hover:text-red-500" />
          </Button>
        )}
      </div>

      {/* Expandable details section */}
      {showDetails && expanded && (
        <div className="ml-14 mt-3 mb-2 space-y-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50">
          {/* Stage dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Expected Start</Label>
              <Input
                type="date"
                value={stage.expectedStartDate || ""}
                onChange={(e) => onStageUpdate?.(stage.id, { expectedStartDate: e.target.value })}
                disabled={isLoading}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expected End</Label>
              <Input
                type="date"
                value={stage.expectedEndDate || ""}
                onChange={(e) => onStageUpdate?.(stage.id, { expectedEndDate: e.target.value })}
                disabled={isLoading}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea
              placeholder="Stage notes..."
              value={stage.notes || ""}
              onChange={(e) => onStageUpdate?.(stage.id, { notes: e.target.value })}
              disabled={isLoading}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Metadata key-value pairs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Metadata</Label>
              <div className="flex gap-1">
                {hasPresets && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={applyPresets}
                    disabled={isLoading}
                    className="h-6 text-[10px] px-2 text-gray-500 dark:text-zinc-400"
                  >
                    + Presets
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addMetadataRow}
                  disabled={isLoading}
                  className="h-6 text-[10px] px-2 text-gray-500 dark:text-zinc-400"
                >
                  <Plus className="h-3 w-3 mr-0.5" />
                  Add
                </Button>
              </div>
            </div>
            {metadata.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="Key"
                  value={entry.key}
                  onChange={(e) => updateMetadataRow(idx, "key", e.target.value)}
                  disabled={isLoading}
                  className="h-7 text-xs flex-1"
                />
                <Input
                  placeholder="Value"
                  value={entry.value}
                  onChange={(e) => updateMetadataRow(idx, "value", e.target.value)}
                  disabled={isLoading}
                  className="h-7 text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeMetadataRow(idx)}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
