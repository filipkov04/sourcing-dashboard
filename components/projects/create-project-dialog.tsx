"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESET_COLORS = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981",
  "#3B82F6", "#8B5CF6", "#EF4444", "#06B6D4",
];

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: { id: string; name: string }) => void;
  /** If provided, dialog is in edit mode */
  editProject?: ProjectData | null;
  onUpdated?: (project: ProjectData) => void;
}

export function CreateProjectDialog({ open, onClose, onCreated, editProject, onUpdated }: CreateProjectDialogProps) {
  const isEdit = !!editProject;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate fields when editing
  useEffect(() => {
    if (editProject) {
      setName(editProject.name);
      setDescription(editProject.description || "");
      setColor(editProject.color || PRESET_COLORS[0]);
    } else {
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[0]);
    }
    setError("");
  }, [editProject, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      if (isEdit) {
        const res = await fetch(`/api/projects/${editProject!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description: description.trim() || null, color }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to update project");
          return;
        }
        onUpdated?.(data.data);
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description: description.trim() || null, color }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to create project");
          return;
        }
        onCreated(data.data);
      }

      setName("");
      setDescription("");
      setColor(PRESET_COLORS[0]);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white">
          {isEdit ? "Edit Project" : "Create New Project"}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {isEdit
            ? "Update your project details."
            : "Organize your orders and factories into a separate project."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-zinc-300">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spring Collection 2026"
              required
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-desc" className="text-zinc-300">Description (optional)</Label>
            <Input
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Color</Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-8 w-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-400">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading
                ? (isEdit ? "Saving..." : "Creating...")
                : (isEdit ? "Save Changes" : "Create Project")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
