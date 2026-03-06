"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useProjects } from "@/lib/use-projects";
import { showProjectTransition } from "@/lib/project-transition";
import { cn } from "@/lib/utils";
import { ChevronDown, Settings2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectSwitcherProps {
  collapsed?: boolean;
}

export function ProjectSwitcher({ collapsed = false }: ProjectSwitcherProps) {
  const { data: session } = useSession();
  const { projects } = useProjects();
  const [switching, setSwitching] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const activeProjectId = session?.user?.projectId;
  const activeProject = projects.find((p: { id: string }) => p.id === activeProjectId);
  const projectColor = activeProject?.color || "#6366F1";

  const handleSwitch = useCallback(async (projectId: string) => {
    if (projectId === activeProjectId) return;
    setSwitching(true);
    const targetProject = projects.find((p: { id: string }) => p.id === projectId);
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
      }
    } catch {
      setSwitching(false);
    }
  }, [activeProjectId, projects]);

  // Static placeholder shown during SSR / before hydration — avoids Radix ID mismatch
  const triggerContent = (
    <>
      {switching ? (
        <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin text-zinc-400" />
      ) : (
        <div
          className="h-3 w-3 flex-shrink-0 rounded-full"
          style={{ backgroundColor: projectColor }}
        />
      )}
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-gray-700 dark:text-zinc-300">
            {switching ? "Switching..." : activeProject?.name || "Select Project"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
        </>
      )}
    </>
  );

  const buttonClassName = cn(
    "flex w-full items-center rounded-lg transition-colors",
    "hover:bg-gray-50 dark:hover:bg-zinc-800",
    collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-2"
  );

  if (!mounted) {
    return (
      <div className={cn("border-b border-gray-100 dark:border-zinc-800", collapsed ? "px-2 py-2" : "px-3 py-2")}>
        <button className={buttonClassName} disabled>
          {triggerContent}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("border-b border-gray-100 dark:border-zinc-800", collapsed ? "px-2 py-2" : "px-3 py-2")}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={buttonClassName}
            title={collapsed ? activeProject?.name || "Select Project" : undefined}
            disabled={switching}
          >
            {triggerContent}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" className="w-56">
          {projects.map((project: { id: string; name: string; color: string | null }) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleSwitch(project.id)}
              className={cn(
                "flex items-center gap-2.5",
                project.id === activeProjectId && "bg-zinc-100 dark:bg-zinc-800"
              )}
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: project.color || "#6366F1" }}
              />
              <span className="flex-1 truncate">{project.name}</span>
              {project.id === activeProjectId && (
                <span className="text-xs text-zinc-400">Active</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => { window.location.href = "/projects?direct=1"; }}
            className="flex items-center gap-2.5 text-zinc-500"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Manage Projects
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
