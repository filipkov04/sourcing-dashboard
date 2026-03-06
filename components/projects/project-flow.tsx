"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { SplashScreen } from "./splash-screen";
import { GreetingScreen } from "./greeting-screen";
import { ProjectSelector } from "./project-selector";

type FlowState = "SPLASH" | "GREETING" | "PROJECT_SELECT";

interface ProjectFlowProps {
  projects: Array<{
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
  }>;
  userName: string;
  activeProjectId: string | null;
  isWelcome: boolean;
  isDirect: boolean;
  userRole: string;
}

export function ProjectFlow({
  projects,
  userName,
  activeProjectId,
  isWelcome,
  isDirect,
  userRole,
}: ProjectFlowProps) {
  // Skip splash if navigating directly (e.g., from sidebar "Manage Projects")
  const initialState: FlowState = isDirect ? "PROJECT_SELECT" : "SPLASH";
  const [state, setState] = useState<FlowState>(initialState);

  const handleSplashComplete = useCallback(() => {
    if (isWelcome) {
      setState("GREETING");
    } else {
      setState("PROJECT_SELECT");
    }
  }, [isWelcome]);

  const handleGreetingContinue = useCallback(() => {
    setState("PROJECT_SELECT");
  }, []);

  return (
    <AnimatePresence mode="wait">
      {state === "SPLASH" && (
        <SplashScreen key="splash" onComplete={handleSplashComplete} />
      )}
      {state === "GREETING" && (
        <GreetingScreen
          key="greeting"
          userName={userName}
          onContinue={handleGreetingContinue}
        />
      )}
      {state === "PROJECT_SELECT" && (
        <ProjectSelector
          key="selector"
          projects={projects}
          activeProjectId={activeProjectId}
          userRole={userRole}
        />
      )}
    </AnimatePresence>
  );
}
