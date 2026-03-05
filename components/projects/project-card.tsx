"use client";

import { motion } from "framer-motion";
import { Factory, Package, Pencil, Trash2 } from "lucide-react";

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
      className={`relative flex w-full flex-col overflow-hidden rounded-2xl border text-left transition-all
        ${isActive
          ? "border-white/20 bg-zinc-800 ring-2 ring-white/20 shadow-lg"
          : "border-zinc-700/50 bg-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800 hover:shadow-md"
        }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      {/* Color stripe */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      {/* Admin actions */}
      {canManage && (
        <div className="absolute right-3 top-5 z-10 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
            title="Edit project"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {!project.isDefault && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-950 hover:text-red-400"
              title="Delete project"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <button className="flex flex-1 flex-col p-5 text-left" onClick={onClick}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            {project.icon || (
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-white">
              {project.name}
            </h3>
            {project.isDefault && (
              <span className="text-xs text-zinc-400">Default</span>
            )}
          </div>
        </div>

        {project.description && (
          <p className="mt-3 line-clamp-2 text-sm text-zinc-400">
            {project.description}
          </p>
        )}

        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            {project.orderCount} order{project.orderCount !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <Factory className="h-3.5 w-3.5" />
            {project.factoryCount} factor{project.factoryCount !== 1 ? "ies" : "y"}
          </span>
        </div>
      </button>
    </motion.div>
  );
}
