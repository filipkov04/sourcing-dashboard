"use client";

import { useState, useEffect } from "react";
import { X, Search, Package, Factory, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createConversation } from "@/lib/use-conversations";

type TeamMember = { id: string; name: string | null; email: string; role: string };
type OrderOption = { id: string; orderNumber: string; productName: string };
type FactoryOption = { id: string; name: string };

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export function NewConversationDialog({ open, onClose, onCreated }: NewConversationDialogProps) {
  const [subject, setSubject] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [linkType, setLinkType] = useState<"none" | "order" | "factory">("none");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedFactoryId, setSelectedFactoryId] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [factories, setFactories] = useState<FactoryOption[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    async function load() {
      const [teamRes, ordersRes, factoriesRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/orders?limit=50"),
        fetch("/api/factories"),
      ]);
      if (teamRes.ok) { const json = await teamRes.json(); setMembers(json.data); }
      if (ordersRes.ok) { const json = await ordersRes.json(); setOrders(json.data); }
      if (factoriesRes.ok) { const json = await factoriesRes.json(); setFactories(json.data); }
    }
    load();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSubject(""); setSelectedMembers([]); setLinkType("none");
      setSelectedOrderId(""); setSelectedFactoryId("");
      setErrorMsg(""); setMemberSearch("");
    }
  }, [open]);

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (m.name?.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) && !selectedMembers.includes(m.id);
  });

  async function handleCreate() {
    if (!subject.trim()) { setErrorMsg("Subject is required"); return; }
    if (selectedMembers.length === 0) { setErrorMsg("Add at least one participant"); return; }
    setCreating(true); setErrorMsg("");
    try {
      const conv = await createConversation({
        subject: subject.trim(),
        participantIds: selectedMembers,
        orderId: linkType === "order" ? selectedOrderId || undefined : undefined,
        factoryId: linkType === "factory" ? selectedFactoryId || undefined : undefined,
      });
      onCreated(conv.id);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create conversation");
    } finally {
      setCreating(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Conversation</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Subject */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Subject</label>
            <input
              type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Shipping delay for PO-1234"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EB5D2E] focus:outline-none focus:ring-1 focus:ring-[#EB5D2E]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
            />
          </div>

          {/* Participants */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Participants</label>
            {selectedMembers.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {selectedMembers.map((id) => {
                  const member = members.find((m) => m.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full bg-[#EB5D2E]/10 px-2.5 py-1 text-xs font-medium text-[#EB5D2E]">
                      {member?.name || member?.email}
                      <button onClick={() => setSelectedMembers((prev) => prev.filter((p) => p !== id))} className="hover:text-[#d4532a]">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
              <input
                type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search team members..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EB5D2E] focus:outline-none focus:ring-1 focus:ring-[#EB5D2E]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
              />
            </div>
            <div className="mt-1.5 max-h-36 overflow-y-auto rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              {filteredMembers.length === 0 ? (
                <p className="px-3 py-2.5 text-xs text-gray-400 dark:text-zinc-500 text-center">
                  {members.length === 0 ? "Loading team members..." : "No members found"}
                </p>
              ) : (
                filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMembers((prev) => [...prev, m.id]); setMemberSearch(""); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-600 text-[10px] font-bold text-gray-600 dark:text-zinc-300">
                      {(m.name || m.email)[0]?.toUpperCase()}
                    </div>
                    <span>{m.name || m.email}</span>
                    <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">{m.role}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Link to order/factory */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Link to (optional)</label>
            <div className="flex gap-2 mb-2">
              {(["none", "order", "factory"] as const).map((type) => (
                <button
                  key={type} onClick={() => setLinkType(type)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    linkType === type
                      ? "border-[#EB5D2E] bg-[#EB5D2E]/10 text-[#EB5D2E]"
                      : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  )}
                >
                  {type === "order" && <Package className="h-3 w-3" />}
                  {type === "factory" && <Factory className="h-3 w-3" />}
                  {type === "none" ? "None" : type === "order" ? "Order" : "Factory"}
                </button>
              ))}
            </div>
            {linkType === "order" && (
              <select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                <option value="">Select an order...</option>
                {orders.map((o) => <option key={o.id} value={o.id}>{o.orderNumber} — {o.productName}</option>)}
              </select>
            )}
            {linkType === "factory" && (
              <select value={selectedFactoryId} onChange={(e) => setSelectedFactoryId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                <option value="">Select a factory...</option>
                {factories.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
          </div>

          {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-zinc-800 px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-[#EB5D2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#d4532a] disabled:opacity-50">
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
