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
      className="min-h-screen bg-zinc-950 px-6 py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mx-auto max-w-4xl">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-white">Select a Project</h1>
          <p className="mt-2 text-zinc-400">
            Choose a project to work on, or create a new one.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-zinc-900/60">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
          ))}

          {/* Create project card */}
          {canManage && (
            <motion.button
              className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700 text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: projects.length * 0.08, duration: 0.4 }}
              onClick={() => setShowCreate(true)}
            >
              <Plus className="mb-2 h-8 w-8" />
              <span className="text-sm font-medium">Create Project</span>
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
                ? { ...p, name: updated.name, description: updated.description, color: updated.color }
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
