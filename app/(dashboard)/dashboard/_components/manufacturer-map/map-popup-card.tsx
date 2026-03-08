"use client";

import { ShieldCheck, ShieldAlert, Clock, Package, AlertTriangle, Star, X } from "lucide-react";
import Link from "next/link";
import type { MapFactory } from "./types";

type MapPopupCardProps = {
  factory: MapFactory;
  onClose: () => void;
};

const verificationBadge: Record<string, { label: string; className: string }> = {
  VERIFIED: { label: "Verified", className: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30" },
  PENDING: { label: "Pending", className: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30" },
  UNVERIFIED: { label: "Unverified", className: "text-gray-500 bg-gray-100 dark:text-zinc-400 dark:bg-zinc-800" },
};

const riskBadge: Record<string, { label: string; className: string }> = {
  LOW: { label: "Low Risk", className: "text-green-600 dark:text-green-400" },
  MEDIUM: { label: "Medium Risk", className: "text-amber-600 dark:text-amber-400" },
  HIGH: { label: "High Risk", className: "text-orange-600 dark:text-orange-400" },
  CRITICAL: { label: "Critical Risk", className: "text-red-600 dark:text-red-400" },
};

export function MapPopupCard({ factory, onClose }: MapPopupCardProps) {
  const vb = verificationBadge[factory.verificationStatus];
  const rb = riskBadge[factory.riskLevel];

  return (
    <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-20 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {factory.name}
            </h4>
            {factory.isPreferred && (
              <Star className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 fill-amber-500" />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            {factory.city}, {factory.country}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
        >
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>

      {/* Badges */}
      <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${vb.className}`}>
          <ShieldCheck className="h-3 w-3 inline mr-0.5 -mt-0.5" />
          {vb.label}
        </span>
        {factory.riskLevel !== "LOW" && (
          <span className={`text-[10px] font-medium ${rb.className}`}>
            <ShieldAlert className="h-3 w-3 inline mr-0.5 -mt-0.5" />
            {rb.label}
          </span>
        )}
      </div>

      {/* Tags */}
      {(factory.categories.length > 0 || factory.capabilities.length > 0) && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {factory.categories.map((c) => (
            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {c}
            </span>
          ))}
          {factory.capabilities.map((c) => (
            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        {factory.moqMin != null && (
          <div>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500">MOQ</p>
            <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">
              <Package className="h-3 w-3 inline mr-0.5 -mt-0.5 text-gray-400" />
              {factory.moqMin.toLocaleString()}
            </p>
          </div>
        )}
        {factory.leadTimeDays != null && (
          <div>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500">Lead Time</p>
            <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">
              <Clock className="h-3 w-3 inline mr-0.5 -mt-0.5 text-gray-400" />
              {factory.leadTimeDays}d
            </p>
          </div>
        )}
        <div>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500">Active</p>
          <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">
            {factory.orderCount} {factory.orderCount === 1 ? "order" : "orders"}
          </p>
        </div>
        {factory.reliabilityScore != null && (
          <div>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500">Reliability</p>
            <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">
              {factory.reliabilityScore.toFixed(0)}%
            </p>
          </div>
        )}
        {factory.riskLevel !== "LOW" && (
          <div>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500">Risk</p>
            <p className={`text-xs font-medium ${rb.className}`}>
              <AlertTriangle className="h-3 w-3 inline mr-0.5 -mt-0.5" />
              {rb.label}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
        <Link
          href={`/factories/${factory.id}`}
          className="text-xs font-medium text-[#FF4D15] hover:text-[#e0440f] transition-colors"
        >
          View Profile →
        </Link>
      </div>
    </div>
  );
}
