"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";

type Props = {
  factoryId: string;
  data: {
    type: string | null;
    name: string;
    credentials: Record<string, string>;
    config: Record<string, unknown>;
    syncFrequency: number;
    connectionTested: boolean;
  };
  onTested: (success: boolean) => void;
};

export function StepTestConnection({ factoryId, data, onTested }: Props) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<"success" | "failed" | null>(
    data.connectionTested ? "success" : null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isManual = data.type === "MANUAL";

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    setErrorMsg(null);

    try {
      // Create a temporary integration to test
      const createRes = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `_test_${Date.now()}`,
          type: data.type,
          factoryId,
          credentials: Object.keys(data.credentials).length > 0 ? data.credentials : undefined,
          config: Object.keys(data.config).length > 0 ? data.config : undefined,
          syncFrequency: data.syncFrequency,
        }),
      });

      const createJson = await createRes.json();

      if (!createRes.ok) {
        setResult("failed");
        setErrorMsg(createJson.error || "Failed to create test integration");
        onTested(false);
        return;
      }

      const integrationId = createJson.data.id;

      // Test the connection
      const testRes = await fetch(`/api/integrations/${integrationId}/test`, {
        method: "POST",
      });
      const testJson = await testRes.json();

      if (testJson.success && testJson.data.connected) {
        setResult("success");
        onTested(true);
      } else {
        setResult("failed");
        setErrorMsg("Connection test failed. Check your credentials and try again.");
        onTested(false);
      }

      // Clean up temp integration
      await fetch(`/api/integrations/${integrationId}`, { method: "DELETE" });
    } catch {
      setResult("failed");
      setErrorMsg("Network error during test");
      onTested(false);
    } finally {
      setTesting(false);
    }
  };

  if (isManual) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Connection Test
        </h2>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/60 mt-4">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">
            Manual integrations don&apos;t require a connection test. You can proceed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Test Connection
      </h2>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
        Verify that the credentials work before saving.
      </p>

      <div className="flex flex-col items-center gap-4 py-8">
        {result === null && !testing && (
          <>
            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Zap className="h-8 w-8 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500">Click below to test the connection</p>
          </>
        )}

        {testing && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-[#FF4D15]" />
            <p className="text-sm text-zinc-500">Testing connection...</p>
          </>
        )}

        {result === "success" && (
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Connection successful!
            </p>
          </div>
        )}

        {result === "failed" && (
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Connection failed
            </p>
            {errorMsg && (
              <p className="text-xs text-zinc-400 text-center max-w-sm">{errorMsg}</p>
            )}
          </div>
        )}

        <Button
          onClick={handleTest}
          disabled={testing}
          variant={result === "success" ? "outline" : "default"}
          className={result === "success" ? "border-green-500 text-green-600" : "bg-[#FF4D15] hover:bg-[#e0440f] text-white"}
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : result === "success" ? (
            "Test Again"
          ) : (
            "Test Connection"
          )}
        </Button>
      </div>
    </div>
  );
}
