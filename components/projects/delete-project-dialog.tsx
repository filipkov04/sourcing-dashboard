"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteProjectDialogProps {
  open: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteProjectDialog({ open, projectName, onClose, onConfirm }: DeleteProjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-950">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Delete Project</h2>
        </div>

        <p className="mt-4 text-sm text-zinc-400">
          Are you sure you want to delete <span className="font-medium text-zinc-200">{projectName}</span>? This action cannot be undone.
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-400" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
