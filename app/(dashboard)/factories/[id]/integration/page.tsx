"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { StepTypeSelect } from "./_components/step-type-select";
import { StepCredentials } from "./_components/step-credentials";
import { StepTestConnection } from "./_components/step-test-connection";
import { StepFieldMapping } from "./_components/step-field-mapping";
import { StepReview } from "./_components/step-review";
import type { IntegrationType } from "@prisma/client";

type WizardData = {
  name: string;
  type: IntegrationType | null;
  credentials: Record<string, string>;
  config: Record<string, unknown>;
  syncFrequency: number;
  connectionTested: boolean;
};

const STEPS = [
  { label: "Type", description: "Choose connection" },
  { label: "Credentials", description: "Enter credentials" },
  { label: "Test", description: "Verify connection" },
  { label: "Field Map", description: "Map data fields" },
  { label: "Review", description: "Review & enable" },
];

export default function IntegrationWizardPage() {
  const params = useParams();
  const router = useRouter();
  const factoryId = params.id as string;

  const [factory, setFactory] = useState<{ id: string; name: string; location: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [data, setData] = useState<WizardData>({
    name: "",
    type: null,
    credentials: {},
    config: {},
    syncFrequency: 15,
    connectionTested: false,
  });

  useEffect(() => {
    async function fetchFactory() {
      try {
        const res = await fetch(`/api/factories/${factoryId}`);
        const json = await res.json();
        if (json.success) {
          setFactory(json.data);
          setData((d) => ({ ...d, name: `${json.data.name} Integration` }));
        }
      } catch {
        // handled by null factory
      } finally {
        setIsLoading(false);
      }
    }
    fetchFactory();
  }, [factoryId]);

  const updateData = (partial: Partial<WizardData>) => {
    setData((d) => ({ ...d, ...partial }));
  };

  const handleSave = async () => {
    if (!data.type) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          factoryId,
          credentials: Object.keys(data.credentials).length > 0 ? data.credentials : undefined,
          config: Object.keys(data.config).length > 0 ? data.config : undefined,
          syncFrequency: data.syncFrequency,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSaveError(json.error || "Failed to create integration");
        return;
      }

      router.push(`/factories/${factoryId}`);
    } catch {
      setSaveError("Failed to create integration");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!factory) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="text-zinc-400">Factory not found.</p>
      </div>
    );
  }

  return (
    <div className="relative max-w-3xl mx-auto space-y-6">
      {/* HUD Grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,77,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,21,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push(`/factories/${factoryId}`)}
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {factory.name}
        </Button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Setup Integration
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Connect {factory.name} to automatically sync order data.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                    ? "bg-[#FF4D15] text-white"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className={`text-xs font-medium ${i === step ? "text-gray-900 dark:text-white" : "text-zinc-400"}`}>
                  {s.label}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{s.description}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-2 ${i < step ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-800"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-6">
        {step === 0 && (
          <StepTypeSelect
            selected={data.type}
            onSelect={(type) => updateData({ type, credentials: {}, config: {}, connectionTested: false })}
          />
        )}
        {step === 1 && data.type && (
          <StepCredentials
            type={data.type}
            credentials={data.credentials}
            config={data.config}
            name={data.name}
            syncFrequency={data.syncFrequency}
            onChange={(creds, config, name, freq) =>
              updateData({ credentials: creds, config, name: name ?? data.name, syncFrequency: freq ?? data.syncFrequency, connectionTested: false })
            }
          />
        )}
        {step === 2 && data.type && (
          <StepTestConnection
            factoryId={factoryId}
            data={data}
            onTested={(ok) => updateData({ connectionTested: ok })}
          />
        )}
        {step === 3 && data.type && (
          <StepFieldMapping
            type={data.type}
            config={data.config}
            onUpdate={(config) => updateData({ config })}
          />
        )}
        {step === 4 && (
          <StepReview data={data} factoryName={factory.name} />
        )}

        {saveError && (
          <p className="text-sm text-red-500 mt-4">{saveError}</p>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="border-zinc-300 dark:border-zinc-700"
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !data.type}
              className="bg-[#FF4D15] hover:bg-[#e0440f] text-white"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#FF4D15] hover:bg-[#e0440f] text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Integration"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
