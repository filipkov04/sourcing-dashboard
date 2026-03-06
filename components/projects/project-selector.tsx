"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { ProjectCard } from "./project-card";
import { CreateProjectDialog } from "./create-project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";

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

export function ProjectSelector({ projects: initialProjects, activeProjectId, userRole }: ProjectSelectorProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  const canManage = ["OWNER", "ADMIN"].includes(userRole);

  const handleSelect = async (projectId: string) => {
    setLoading(projectId);
    try {
      const res = await fetch("/api/user/active-project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (res.ok) {
        window.location.href = "/dashboard";
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
      className="min-h-screen bg-zinc-950 px-6 py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Header — clips up */}
        <div className="overflow-hidden">
          <motion.div
            className="text-center"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.05, duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          >
            <h1 className="text-2xl font-semibold text-white">Select a project</h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Choose a project to continue, or create a new one.
            </p>
          </motion.div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-950/60 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <motion.div
                    className="h-5 w-5 rounded-full border-[1.5px] border-zinc-600 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              )}
            </div>
          ))}

          {/* Create project */}
          {canManage && (
            <motion.button
              className="group flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 text-zinc-600 transition-colors duration-200 hover:border-zinc-700 hover:text-zinc-400"
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
