"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { ProjectCard } from "./project-card";
import { CreateProjectDialog } from "./create-project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { showProjectTransition } from "@/lib/project-transition";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  orderCount: number;
  factoryCount: number;
  startDate: string | null;
  endDate: string | null;
}

interface ProjectSelectorProps {
  projects: Project[];
  activeProjectId: string | null;
  userRole: string;
}

function HUDCornerLarge({ position, delay }: { position: string; delay: number }) {
  const size = 24;
  const paths: Record<string, string> = {
    "top-left": `M 0 ${size} L 0 0 L ${size} 0`,
    "top-right": `M 0 0 L ${size} 0 L ${size} ${size}`,
    "bottom-left": `M 0 0 L 0 ${size} L ${size} ${size}`,
    "bottom-right": `M 0 ${size} L ${size} ${size} L ${size} 0`,
  };
  const posClass: Record<string, string> = {
    "top-left": "left-4 top-4",
    "top-right": "right-4 top-4",
    "bottom-left": "left-4 bottom-4",
    "bottom-right": "right-4 bottom-4",
  };

  return (
    <motion.svg
      width={size}
      height={size}
      className={`absolute ${posClass[position]} pointer-events-none`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.15 }}
      transition={{ delay, duration: 0.2 }}
    >
      <motion.path
        d={paths[position]}
        fill="none"
        stroke="#f97316"
        strokeWidth={1}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.4, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

export function ProjectSelector({ projects: initialProjects, activeProjectId, userRole }: ProjectSelectorProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  const canManage = ["OWNER", "ADMIN"].includes(userRole);

  const handleSelect = async (projectId: string) => {
    setLoading(projectId);
    const targetProject = projects.find((p) => p.id === projectId);
    try {
      const res = await fetch("/api/user/active-project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (res.ok) {
        showProjectTransition(targetProject?.name || "Project");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 300);
        return;
      }
    } catch {
      // ignore
    }
    setLoading(null);
  };

  const handleDelete = async () => {
    if (!deleteProject) return;
    const res = await fetch(`/api/projects/${deleteProject.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete project");
    }
    setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id));
    setDeleteProject(null);
  };

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden bg-[#08090a] px-6 py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* HUD corner brackets — page level */}
      <HUDCornerLarge position="top-left" delay={0.1} />
      <HUDCornerLarge position="top-right" delay={0.2} />
      <HUDCornerLarge position="bottom-left" delay={0.3} />
      <HUDCornerLarge position="bottom-right" delay={0.4} />

      {/* Horizontal accent lines */}
      <motion.div
        className="pointer-events-none absolute left-4 top-1/2 h-px bg-gradient-to-r from-orange-500/20 to-transparent"
        initial={{ width: 0 }}
        animate={{ width: "8%" }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="pointer-events-none absolute right-4 top-1/2 h-px bg-gradient-to-l from-orange-500/20 to-transparent"
        initial={{ width: 0 }}
        animate={{ width: "8%" }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
      />

      <div className="relative mx-auto max-w-3xl">
        {/* Header */}
        <div className="overflow-hidden text-center">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.05, duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          >
            <motion.p
              className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-500/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              Project Selection
            </motion.p>
            <h1 className="text-2xl font-semibold text-white">Select a project</h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Choose a project to continue, or create a new one.
            </p>
          </motion.div>
        </div>

        {/* Divider line that draws from center */}
        <motion.div
          className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
        />

        {/* Project count readout */}
        <motion.div
          className="mt-4 flex items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <div className="flex items-center gap-1.5">
            <motion.div
              className="h-1 w-1 rounded-full bg-orange-500/60"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="font-mono text-[10px] text-zinc-600">
              {projects.length} PROJECT{projects.length !== 1 ? "S" : ""} AVAILABLE
            </span>
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <div key={project.id} className="relative">
              <ProjectCard
                project={project}
                isActive={project.id === activeProjectId}
                index={i}
                canManage={canManage}
                onClick={() => handleSelect(project.id)}
                onEdit={() => setEditProject(project)}
                onDelete={() => setDeleteProject(project)}
              />
              {loading === project.id && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#08090a]/80 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <motion.div
                      className="h-5 w-5 rounded-full border-[1.5px] border-zinc-700 border-t-orange-500"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">Loading</span>
                  </div>
                </motion.div>
              )}
            </div>
          ))}

          {/* Create project */}
          {canManage && (
            <motion.button
              className="group relative flex min-h-[140px] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-800 text-zinc-600 transition-colors duration-200 hover:border-orange-500/30 hover:text-zinc-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + projects.length * 0.06,
                duration: 0.45,
                ease: [0.33, 1, 0.68, 1],
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreate(true)}
            >
              <Plus className="mb-1.5 h-5 w-5" />
              <span className="text-xs font-medium">New Project</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Create dialog */}
      <CreateProjectDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(project) => {
          setProjects((prev) => [
            ...prev,
            {
              ...project,
              slug: project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              description: null,
              color: "#6366F1",
              icon: null,
              isDefault: false,
              orderCount: 0,
              factoryCount: 0,
              startDate: null,
              endDate: null,
            },
          ]);
          setShowCreate(false);
        }}
      />

      {/* Edit dialog */}
      <CreateProjectDialog
        open={!!editProject}
        onClose={() => setEditProject(null)}
        onCreated={() => {}}
        editProject={editProject}
        onUpdated={(updated) => {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === updated.id
                ? { ...p, name: updated.name, description: updated.description, color: updated.color, startDate: updated.startDate, endDate: updated.endDate }
                : p
            )
          );
          setEditProject(null);
        }}
      />

      {/* Delete confirmation */}
      <DeleteProjectDialog
        open={!!deleteProject}
        projectName={deleteProject?.name || ""}
        onClose={() => setDeleteProject(null)}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
