"use client";

import { motion } from "framer-motion";
import { Calendar, Factory, Package, Pencil, Trash2, Check } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    isDefault: boolean;
    orderCount: number;
    factoryCount: number;
    startDate: string | null;
    endDate: string | null;
  };
  isActive: boolean;
  index: number;
  canManage?: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProjectCard({ project, isActive, index, canManage, onClick, onEdit, onDelete }: ProjectCardProps) {
  const color = project.color || "#6366F1";

  return (
    <motion.div
      className={`group relative flex w-full flex-col overflow-hidden rounded-xl text-left card-hover-glow
        ${isActive
          ? "bg-zinc-800 ring-1 ring-white/15"
          : "bg-zinc-900 ring-1 ring-zinc-800"
        }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.15 + index * 0.06,
        duration: 0.45,
        ease: [0.33, 1, 0.68, 1],
      }}
    >
      {/* Active indicator — colored left edge */}
      {isActive && (
        <motion.div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ backgroundColor: color }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.3 + index * 0.06, duration: 0.3, ease: "easeOut" }}
        />
      )}

      {/* Admin actions */}
      {canManage && (
        <div className="absolute right-3 top-3 z-10 flex gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
            title="Edit project"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {!project.isDefault && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-red-400"
              title="Delete project"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <button className="flex flex-1 flex-col p-4 text-left" onClick={onClick}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}18` }}
          >
            {project.icon || (
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-white">
                {project.name}
              </h3>
              {isActive && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10">
                  <Check className="h-2.5 w-2.5 text-white" />
                </span>
              )}
            </div>
            {project.isDefault && (
              <span className="text-[11px] text-zinc-500">Default</span>
            )}
          </div>
        </div>

        {project.description && (
          <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
            {project.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-[11px] text-zinc-600">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {project.orderCount}
          </span>
          <span className="flex items-center gap-1">
            <Factory className="h-3 w-3" />
            {project.factoryCount}
          </span>
          {(project.startDate || project.endDate) && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {project.startDate
                ? new Date(project.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                : ""}
              {project.startDate && project.endDate ? " - " : ""}
              {project.endDate
                ? new Date(project.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                : ""}
            </span>
          )}
        </div>
      </button>
    </motion.div>
  );
}
