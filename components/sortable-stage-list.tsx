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
import { SortableStageItem } from "./sortable-stage-item";

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
  isLoading: boolean;
}

export function SortableStageList<T extends BaseStage>({
  stages,
  onReorder,
  onNameChange,
  onRemove,
  isLoading,
}: SortableStageListProps<T>) {
  const [isMounted, setIsMounted] = useState(false);

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

  // Render without DnD on server side to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <SortableStageItem
            key={stage.id}
            stage={stage}
            index={index}
            onNameChange={onNameChange}
            onRemove={onRemove}
            canRemove={stages.length > 1}
            isLoading={isLoading}
          />
        ))}
      </div>
    );
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
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <SortableStageItem
              key={stage.id}
              stage={stage}
              index={index}
              onNameChange={onNameChange}
              onRemove={onRemove}
              canRemove={stages.length > 1}
              isLoading={isLoading}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
