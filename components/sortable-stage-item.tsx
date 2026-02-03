"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Stage = {
  id: string;
  name: string;
  sequence: number;
  progress?: number;
  status?: string;
};

interface SortableStageItemProps {
  stage: Stage;
  index: number;
  onNameChange: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  isLoading: boolean;
}

export function SortableStageItem({
  stage,
  index,
  onNameChange,
  onRemove,
  canRemove,
  isLoading,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 ${
        isDragging ? "opacity-50 bg-zinc-700/50 rounded-md" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 text-zinc-500 hover:text-zinc-300 touch-none"
        {...attributes}
        {...listeners}
        disabled={isLoading}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-700 text-zinc-400 text-sm font-medium">
        {index + 1}
      </div>
      <Input
        placeholder="Stage name (e.g., Cutting, Sewing)"
        value={stage.name}
        onChange={(e) => onNameChange(stage.id, e.target.value)}
        className="flex-1"
        disabled={isLoading}
      />
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
  );
}
