"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChartBuilderStepType } from "./chart-builder-step-type";
import { ChartBuilderStepMetric } from "./chart-builder-step-metric";
import { ChartBuilderStepConfig } from "./chart-builder-step-config";
import { ChartBuilderStepSave } from "./chart-builder-step-save";
import type { ChartTypeId } from "@/lib/chart-data-sources";
import type { CustomChart } from "@/lib/use-custom-charts";

type WizardState = {
  chartType: ChartTypeId | null;
  dataSource: string | null;
  metric: string | null;
  config: {
    title: string;
    showTrendLine: boolean;
    period?: string;
  };
  visibility: "PERSONAL" | "SHARED";
};

const INITIAL_STATE: WizardState = {
  chartType: null,
  dataSource: null,
  metric: null,
  config: { title: "", showTrendLine: false },
  visibility: "PERSONAL",
};

const STEP_TITLES = ["Chart Type", "Metric", "Configure", "Save"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    title: string;
    chartType: string;
    dataSource: string;
    metric: string;
    config: Record<string, any>;
    visibility: "PERSONAL" | "SHARED";
  }) => Promise<CustomChart | null>;
  editChart?: CustomChart | null;
};

export function ChartBuilderWizard({ open, onOpenChange, onSave, editChart }: Props) {
  const [step, setStep] = useState(() => editChart ? 2 : 0);
  const [state, setState] = useState<WizardState>(() => {
    if (editChart) {
      const cfg = (editChart.config || {}) as Record<string, any>;
      return {
        chartType: editChart.chartType as ChartTypeId,
        dataSource: editChart.dataSource,
        metric: editChart.metric,
        config: {
          title: editChart.title,
          showTrendLine: cfg.showTrendLine || false,
          ...(cfg.period && { period: cfg.period }),
        },
        visibility: editChart.visibility,
      };
    }
    return INITIAL_STATE;
  });
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1);

  const canProceed = (() => {
    switch (step) {
      case 0: return !!state.chartType;
      case 1: return !!state.dataSource && !!state.metric;
      case 2: return !!state.config.title;
      case 3: return !!state.config.title;
      default: return false;
    }
  })();

  const goNext = () => {
    if (step < 3 && canProceed) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleSave = async () => {
    if (!state.chartType || !state.dataSource || !state.metric) return;
    setSaving(true);
    try {
      await onSave({
        title: state.config.title,
        chartType: state.chartType,
        dataSource: state.dataSource,
        metric: state.metric,
        config: {
          showTrendLine: state.config.showTrendLine,
          ...(state.config.period && { period: state.config.period }),
        },
        visibility: state.visibility,
      });
      onOpenChange(false);
      setState(INITIAL_STATE);
      setStep(0);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setState(INITIAL_STATE);
      setStep(0);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] dark:bg-zinc-900 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editChart ? "Edit Chart" : "Create Custom Chart"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-zinc-400">
            Step {step + 1} of 4: {STEP_TITLES[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-2">
          {STEP_TITLES.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-[#EB5D2E]" : "bg-gray-200 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -20 }}
            transition={{ duration: 0.15 }}
          >
            {step === 0 && (
              <ChartBuilderStepType
                selected={state.chartType}
                onSelect={(type) => {
                  setState((s) => ({
                    ...s,
                    chartType: type,
                    dataSource: null,
                    metric: null,
                  }));
                }}
              />
            )}
            {step === 1 && state.chartType && (
              <ChartBuilderStepMetric
                chartType={state.chartType}
                selectedDataSource={state.dataSource}
                selectedMetric={state.metric}
                onSelect={(ds, m) => setState((s) => ({ ...s, dataSource: ds, metric: m }))}
              />
            )}
            {step === 2 && state.chartType && state.dataSource && state.metric && (
              <ChartBuilderStepConfig
                chartType={state.chartType}
                dataSource={state.dataSource}
                metric={state.metric}
                config={state.config}
                onConfigChange={(cfg) => setState((s) => ({ ...s, config: cfg }))}
              />
            )}
            {step === 3 && state.chartType && state.dataSource && state.metric && (
              <ChartBuilderStepSave
                chartType={state.chartType}
                dataSource={state.dataSource}
                metric={state.metric}
                title={state.config.title}
                config={state.config}
                visibility={state.visibility}
                onTitleChange={(title) => setState((s) => ({ ...s, config: { ...s.config, title } }))}
                onVisibilityChange={(visibility) => setState((s) => ({ ...s, visibility }))}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < 3 ? (
            <Button
              onClick={goNext}
              disabled={!canProceed}
              className="gap-1 bg-[#EB5D2E] hover:bg-[#d4522a] text-white"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving || !canProceed}
              className="gap-1 bg-[#EB5D2E] hover:bg-[#d4522a] text-white"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Chart"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
