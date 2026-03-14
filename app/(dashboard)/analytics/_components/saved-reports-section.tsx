"use client";

import { useState } from "react";
import {
  Plus, FileText, Calendar, Mail, Trash2, Clock, ToggleLeft, ToggleRight,
  ChevronDown, ChevronRight, X, Check, Send, Loader2,
} from "lucide-react";
import { useSavedReports, type CustomChart, type SavedReport } from "@/lib/use-custom-charts";

const SCHEDULE_LABELS: Record<string, string> = {
  DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly",
};

type Props = {
  charts: CustomChart[];
};

export function SavedReportsSection({ charts }: Props) {
  const { reports, loading, createReport, updateReport, deleteReport } = useSavedReports();
  const [creating, setCreating] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EB5D2E]" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50 dark:bg-zinc-800/30">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#EB5D2E]" />
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Saved Reports</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">({reports.length})</span>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#EB5D2E] hover:text-[#d4522a] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New Report
        </button>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {creating && (
          <CreateReportForm
            charts={charts}
            onSave={async (data) => { await createReport(data); setCreating(false); }}
            onCancel={() => setCreating(false)}
          />
        )}

        {reports.length === 0 && !creating && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Mail className="h-8 w-8 text-gray-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">No saved reports yet</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-xs">
              Create a report to automatically email chart snapshots to your team on a schedule.
            </p>
          </div>
        )}

        {reports.map((report) => (
          <ReportRow
            key={report.id}
            report={report}
            expanded={expandedReport === report.id}
            onToggle={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
            onToggleEnabled={(enabled) => updateReport(report.id, { enabled })}
            onDelete={() => deleteReport(report.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ReportRow({
  report, expanded, onToggle, onToggleEnabled, onDelete,
}: {
  report: SavedReport;
  expanded: boolean;
  onToggle: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  onDelete: () => void;
}) {
  const nextSend = report.nextSendAt ? new Date(report.nextSendAt) : null;
  const lastSent = report.lastSentAt ? new Date(report.lastSentAt) : null;

  return (
    <div>
      <div className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition-colors" onClick={onToggle}>
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{report.name}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              report.enabled
                ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500"
            }`}>
              {report.enabled ? "Active" : "Paused"}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {SCHEDULE_LABELS[report.schedule]}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
              <Mail className="h-3 w-3" /> {report.recipients.length} recipient{report.recipients.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-zinc-500">
              {report.charts.length} chart{report.charts.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleEnabled(!report.enabled)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors"
            title={report.enabled ? "Pause report" : "Enable report"}
          >
            {report.enabled ? (
              <ToggleRight className="h-5 w-5 text-green-500" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 pl-10 space-y-2">
          {report.description && (
            <p className="text-xs text-gray-500 dark:text-zinc-400">{report.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-zinc-400">
            {nextSend && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Next: {nextSend.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
            {lastSent && (
              <span className="flex items-center gap-1">
                <Send className="h-3 w-3" /> Last sent: {lastSent.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 mb-1">Recipients</p>
            <div className="flex flex-wrap gap-1">
              {report.recipients.map((email) => (
                <span key={email} className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                  {email}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 mb-1">Included Charts</p>
            <div className="flex flex-wrap gap-1">
              {report.charts.map((rc) => (
                <span key={rc.id} className="text-[10px] bg-[#EB5D2E]/5 dark:bg-[#EB5D2E]/10 text-[#EB5D2E] px-2 py-0.5 rounded-full">
                  {rc.chart.title}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateReportForm({
  charts, onSave, onCancel,
}: {
  charts: CustomChart[];
  onSave: (data: { name: string; description?: string; schedule: "DAILY" | "WEEKLY" | "MONTHLY"; recipients: string[]; chartIds: string[] }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [selectedCharts, setSelectedCharts] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const addRecipient = () => {
    const email = recipientInput.trim().toLowerCase();
    if (email && email.includes("@") && !recipients.includes(email)) {
      setRecipients([...recipients, email]);
      setRecipientInput("");
    }
  };

  const toggleChart = (id: string) => {
    setSelectedCharts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const canSave = name.trim() && recipients.length > 0 && selectedCharts.size > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      schedule,
      recipients,
      chartIds: Array.from(selectedCharts),
    });
    setSaving(false);
  };

  return (
    <div className="px-5 py-4 space-y-3 bg-[#EB5D2E]/[0.02] dark:bg-[#EB5D2E]/[0.03]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 dark:text-white">New Report</span>
        <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Name */}
      <input
        autoFocus
        type="text"
        id="report-name"
        name="report-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Report name..."
        className="w-full rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EB5D2E]/50"
      />

      {/* Description */}
      <input
        type="text"
        id="report-description"
        name="report-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)..."
        className="w-full rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EB5D2E]/50"
      />

      {/* Schedule */}
      <div>
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1.5">Schedule</span>
        <div className="flex gap-2">
          {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSchedule(s)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                schedule === s
                  ? "border-[#EB5D2E] bg-[#EB5D2E]/10 text-[#EB5D2E]"
                  : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"
              }`}
            >
              {SCHEDULE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Recipients */}
      <div>
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1.5">Recipients</span>
        <div className="flex items-center gap-2">
          <input
            type="email"
            id="report-recipient"
            name="report-recipient"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRecipient(); } }}
            placeholder="email@example.com"
            className="flex-1 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EB5D2E]/50"
          />
          <button
            onClick={addRecipient}
            disabled={!recipientInput.includes("@")}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-30"
          >
            Add
          </button>
        </div>
        {recipients.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {recipients.map((email) => (
              <span key={email} className="inline-flex items-center gap-1 text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                {email}
                <button onClick={() => setRecipients(recipients.filter((e) => e !== email))} className="hover:text-red-500">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chart selection */}
      <div>
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1.5">
          Charts to include ({selectedCharts.size} selected)
        </span>
        <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2">
          {charts.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-2">No charts available. Create some charts first.</p>
          ) : (
            charts.map((c) => (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-zinc-700">
                <input
                  type="checkbox"
                  checked={selectedCharts.has(c.id)}
                  onChange={() => toggleChart(c.id)}
                  className="rounded border-gray-300 dark:border-zinc-600 text-[#EB5D2E] focus:ring-[#EB5D2E]"
                />
                <span className="text-xs text-gray-700 dark:text-zinc-300">{c.title}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-[#EB5D2E] hover:bg-[#d4522a] text-white disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Create Report
        </button>
      </div>
    </div>
  );
}
