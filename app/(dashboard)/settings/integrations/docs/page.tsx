"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Globe,
  Server,
  Webhook,
  Hand,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  BookOpen,
} from "lucide-react";

type GuideSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  steps: {
    title: string;
    content: string;
    code?: string;
  }[];
};

const GUIDES: GuideSection[] = [
  {
    id: "rest",
    title: "REST API Integration",
    icon: <Globe className="h-4 w-4" />,
    description: "Connect to factory ERP systems that expose REST API endpoints (SAP, Oracle, custom ERPs).",
    steps: [
      {
        title: "1. Get API credentials from your factory",
        content:
          "Contact the factory IT team and request API access. You'll need: Base URL (e.g. https://erp.factory.com/api), an authentication method (Bearer token, Basic auth, or API key), and the orders endpoint path.",
      },
      {
        title: "2. Configure in SourceTrack",
        content:
          "Go to Factories → select your factory → Setup Integration. Choose 'REST API' as the connection type.",
      },
      {
        title: "3. Enter connection details",
        content: "Fill in the Base URL and Orders Endpoint. Select the authentication type and enter your credentials.",
        code: `Base URL: https://erp.factory.com/api
Orders Endpoint: /orders
Auth Type: Bearer
Bearer Token: eyJhbGciOiJIUzI1NiIs...`,
      },
      {
        title: "4. Map data fields",
        content:
          "Map the factory's field names to SourceTrack fields. The factory API might use different names — for example, 'po_number' instead of 'orderNumber'.",
        code: `Order Number → po_number
Status → order_status
Progress → completion_percent
Tracking Number → tracking_no`,
      },
      {
        title: "5. Test and activate",
        content:
          "Click 'Test Connection' to verify everything works. If successful, the integration will start syncing automatically at your configured interval (default: every 15 minutes).",
      },
    ],
  },
  {
    id: "sftp",
    title: "SFTP File Transfer",
    icon: <Server className="h-4 w-4" />,
    description: "Download CSV or JSON order files from a factory's SFTP server on a schedule.",
    steps: [
      {
        title: "1. Get SFTP access",
        content:
          "Request SFTP credentials from your factory: hostname, port (usually 22), username, and password (or SSH private key).",
      },
      {
        title: "2. Identify the export file",
        content:
          "Ask the factory where they export order files and in what format. Typically it's a CSV file in a specific directory.",
        code: `Host: sftp.factory.com
Port: 22
Remote Path: /exports/orders/
File Name: daily_orders.csv
Format: CSV`,
      },
      {
        title: "3. Configure in SourceTrack",
        content:
          "Go to Factories → select factory → Setup Integration → choose 'SFTP File Transfer'. Enter the host, port, credentials, remote path, file name, and format.",
      },
      {
        title: "4. CSV field mapping",
        content:
          "Map CSV column headers to SourceTrack fields. The CSV might have columns like 'PO_NUM', 'STATUS', 'PCT_COMPLETE'.",
        code: `CSV Header → SourceTrack Field
─────────────────────────────────
PO_NUM     → orderNumber
STATUS     → status
PCT_DONE   → progress
TRACK_NO   → trackingNumber`,
      },
      {
        title: "5. Test and schedule",
        content:
          "Test the connection to verify SourceTrack can reach the SFTP server. Set a sync frequency (e.g. every 60 minutes). The system will download and process the file on each cycle.",
      },
    ],
  },
  {
    id: "webhook",
    title: "Webhook Receiver",
    icon: <Webhook className="h-4 w-4" />,
    description: "Receive real-time order updates pushed from the factory's system.",
    steps: [
      {
        title: "1. Get your webhook URL",
        content:
          "When you set up a webhook integration, SourceTrack generates a unique URL for your factory. Share this URL with the factory IT team.",
        code: `Webhook URL: https://your-app.vercel.app/api/webhooks/{factoryId}
Method: POST
Content-Type: application/json`,
      },
      {
        title: "2. Set up HMAC signing",
        content:
          "For security, all webhook payloads must be signed with HMAC-SHA256. Enter a shared secret in SourceTrack and give the same secret to the factory.",
        code: `Header: X-Webhook-Signature
Algorithm: HMAC-SHA256
Signature: hex(hmac_sha256(secret, request_body))`,
      },
      {
        title: "3. Expected payload format",
        content:
          "The factory should send a JSON array of order objects. Each object needs at minimum an order number. Other fields are mapped via the field mapping configuration.",
        code: `POST /api/webhooks/{factoryId}
Content-Type: application/json
X-Webhook-Signature: abc123...

[
  {
    "po_number": "PO-2024-001",
    "status": "in_production",
    "progress": 65,
    "tracking": "YT123456789"
  }
]`,
      },
      {
        title: "4. Error handling",
        content:
          "SourceTrack returns 200 on success, 401 for invalid signature, and 400 for malformed data. The factory should retry on 5xx errors with exponential backoff.",
      },
    ],
  },
  {
    id: "manual",
    title: "Manual Entry",
    icon: <Hand className="h-4 w-4" />,
    description: "For factories without digital systems — enter orders manually or upload CSV files.",
    steps: [
      {
        title: "1. When to use manual",
        content:
          "Use this when the factory doesn't have an API, SFTP server, or the ability to send webhooks. Common for small factories or those with paper-based processes.",
      },
      {
        title: "2. Creating orders",
        content:
          "Go to Orders → Add Order. Fill in the order details manually. You can update progress and status through the order detail page.",
      },
      {
        title: "3. CSV upload (coming soon)",
        content:
          "You'll be able to upload a CSV file with multiple orders at once. The CSV should contain columns matching the standard field names: orderNumber, productName, quantity, status.",
      },
      {
        title: "4. Tracking numbers",
        content:
          "When the factory provides a tracking number, add it to the order detail page. SourceTrack will automatically detect the carrier and start tracking via 17Track.",
      },
    ],
  },
];

export default function IntegrationDocsPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>("rest");
  const [copied, setCopied] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

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
          onClick={() => router.push("/settings/integrations")}
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Integrations
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#FF4D15]" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Integration Setup Guides
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Step-by-step guides for connecting factory systems to SourceTrack.
        </p>
      </div>

      {/* Guides */}
      <div className="space-y-3">
        {GUIDES.map((guide) => (
          <div
            key={guide.id}
            className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => toggleSection(guide.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
            >
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                {guide.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-gray-900 dark:text-white">
                  {guide.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {guide.description}
                </p>
              </div>
              {expanded === guide.id ? (
                <ChevronDown className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              )}
            </button>

            {/* Steps */}
            {expanded === guide.id && (
              <div className="px-4 pb-4 space-y-4 border-t border-zinc-100 dark:border-zinc-800/60 pt-4">
                {guide.steps.map((step, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-medium text-gray-800 dark:text-zinc-200 mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                      {step.content}
                    </p>
                    {step.code && (
                      <div className="relative mt-2">
                        <pre className="bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 rounded-lg p-3 text-[11px] text-gray-700 dark:text-zinc-300 font-mono overflow-x-auto">
                          {step.code}
                        </pre>
                        <button
                          onClick={() => copyCode(step.code!, `${guide.id}-${i}`)}
                          className="absolute top-2 right-2 p-1 rounded bg-zinc-200/80 dark:bg-zinc-700/80 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                          title="Copy"
                        >
                          {copied === `${guide.id}-${i}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 text-zinc-500" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
