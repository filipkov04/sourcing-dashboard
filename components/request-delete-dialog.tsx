"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Send, Trash2 } from "lucide-react";

interface RequestDeleteDialogProps {
  entityType: "order" | "factory";
  entityId: string;
  entityName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDeleteDialog({
  entityType,
  entityId,
  entityName,
  open,
  onOpenChange,
}: RequestDeleteDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for deletion");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const requestType = entityType === "order" ? "ORDER_DELETE_REQUEST" : "FACTORY_DELETE_REQUEST";
      const dataKey = entityType === "order" ? "orderId" : "factoryId";

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: requestType,
          data: {
            [dataKey]: entityId,
            reason: reason.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit request");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog animation completes
    setTimeout(() => {
      setReason("");
      setError(null);
      setSubmitted(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
        {submitted ? (
          <>
            <DialogHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <Send className="h-6 w-6 text-green-500" />
              </div>
              <DialogTitle className="text-center text-gray-900 dark:text-white">
                Delete Request Submitted
              </DialogTitle>
              <DialogDescription className="text-center text-gray-600 dark:text-zinc-400">
                Your request to delete{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{entityName}</span>{" "}
                has been submitted for admin review.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                Request {entityType === "order" ? "Order" : "Factory"} Deletion
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-zinc-400">
                Request to delete{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{entityName}</span>.
                An admin will review your request.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label
                  htmlFor="deleteReason"
                  className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
                >
                  Reason for deletion <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="deleteReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={`Explain why this ${entityType} should be deleted...`}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-900/20 border border-red-800 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleSubmit}
                disabled={isSubmitting || !reason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Submit Delete Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
