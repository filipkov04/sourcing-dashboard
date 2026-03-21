"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableStageItem, Stage } from "./sortable-stage-item";

type BaseStage = {
  id: string;
  name: string;
  sequence: number;
};

interface SortableStageListProps<T extends BaseStage> {
  stages: T[];
  onReorder: (stages: T[]) => void;
  onNameChange: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onStageUpdate?: (id: string, updates: Partial<Stage>) => void;
  isLoading: boolean;
  showDetails?: boolean;
}

export function SortableStageList<T extends BaseStage>({
  stages,
  onReorder,
  onNameChange,
  onRemove,
  onStageUpdate,
  isLoading,
  showDetails = false,
}: SortableStageListProps<T>) {
  const [isMounted, setIsMounted] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);

      const reordered = arrayMove(stages, oldIndex, newIndex);
      const withUpdatedSequence = reordered.map((stage, index) => ({
        ...stage,
        sequence: index + 1,
      })) as T[];

      onReorder(withUpdatedSequence);
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderItems = () =>
    stages.map((stage, index) => (
      <SortableStageItem
        key={stage.id}
        stage={stage as unknown as Stage}
        index={index}
        onNameChange={onNameChange}
        onRemove={onRemove}
        onStageUpdate={onStageUpdate}
        canRemove={stages.length > 1}
        isLoading={isLoading}
        showDetails={showDetails}
        expanded={expandedStages.has(stage.id)}
        onToggleExpand={toggleExpand}
      />
    ));

  // Render without DnD on server side to prevent hydration mismatch
  if (!isMounted) {
    return <div className="space-y-4">{renderItems()}</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={stages.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">{renderItems()}</div>
      </SortableContext>
    </DndContext>
  );
}
