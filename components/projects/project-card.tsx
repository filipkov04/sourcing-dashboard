"use client";

import { motion } from "framer-motion";
import { Calendar, Factory, Package, Pencil, Trash2 } from "lucide-react";

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

function HUDBorder() {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-xl">
      {/* Top — expands right from top-left */}
      <div className="absolute left-0 top-0 h-px w-0 bg-gradient-to-r from-orange-500/50 to-orange-500/10 transition-all duration-500 ease-out group-hover:w-full" />
      {/* Bottom — expands left from bottom-right */}
      <div className="absolute bottom-0 right-0 h-px w-0 bg-gradient-to-l from-orange-500/50 to-orange-500/10 transition-all duration-500 ease-out group-hover:w-full" />
      {/* Left — expands down from top-left */}
      <div className="absolute left-0 top-0 h-0 w-px bg-gradient-to-b from-orange-500/50 to-orange-500/10 transition-all duration-500 ease-out group-hover:h-full" />
      {/* Right — expands up from bottom-right */}
      <div className="absolute bottom-0 right-0 h-0 w-px bg-gradient-to-t from-orange-500/50 to-orange-500/10 transition-all duration-500 ease-out group-hover:h-full" />
    </div>
  );
}

export function ProjectCard({ project, isActive, index, canManage, onClick, onEdit, onDelete }: ProjectCardProps) {
  const color = project.color || "#6366F1";

  return (
    <motion.div
      className={`group relative flex w-full flex-col overflow-visible rounded-xl text-left transition-all duration-200
        ${isActive
          ? "bg-zinc-800/90 ring-1 ring-orange-500/20"
          : "bg-[#0d0f13] ring-1 ring-zinc-800/60 hover:bg-[#10121a]"
        }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.15 + index * 0.06,
        duration: 0.45,
        ease: [0.33, 1, 0.68, 1],
      }}
    >
      {/* HUD border — draws around card on hover */}
      <HUDBorder />

      {/* Active indicator — colored left edge */}
      {isActive && (
        <motion.div
          className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-orange-500"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.3 + index * 0.06, duration: 0.3, ease: "easeOut" }}
        />
      )}

      {/* Admin actions — float above the card */}
      {canManage && (
        <div className="absolute -top-8 right-1 z-10 flex gap-0.5 rounded-md bg-zinc-900 px-1 py-0.5 ring-1 ring-zinc-800 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            title="Edit project"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {!project.isDefault && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400"
              title="Delete project"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <button className="flex flex-1 flex-col p-4 text-left" onClick={onClick}>
        {/* Top section: status label + icon */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: isActive ? "#f97316" : color }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600">
              {isActive ? "Active" : project.isDefault ? "Default" : "Project"}
            </span>
          </div>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ backgroundColor: `${color}12` }}
          >
            {project.icon || (
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </div>
        </div>

        {/* Project name */}
        <h3 className="truncate text-[15px] font-semibold text-white">
          {project.name}
        </h3>

        {project.description && (
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-zinc-500">
            {project.description}
          </p>
        )}

        {/* Divider */}
        <div className="mt-auto pt-3">
          <div className="mb-2.5 h-px w-full bg-zinc-800/80" />

          {/* Data readouts row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-zinc-600">
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3 text-zinc-700" />
              {project.orderCount}
            </span>
            <span className="flex items-center gap-1">
              <Factory className="h-3 w-3 text-zinc-700" />
              {project.factoryCount}
            </span>
            {(project.startDate || project.endDate) && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-zinc-700" />
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
        </div>
      </button>
    </motion.div>
  );
}
