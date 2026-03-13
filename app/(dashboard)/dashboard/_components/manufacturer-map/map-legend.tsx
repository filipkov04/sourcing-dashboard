"use client";

export function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-10 bg-white/90 dark:bg-zinc-900/90 border border-gray-200/60 dark:border-zinc-700/60 rounded-lg px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
        Status
      </p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-slate-600" />
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Verified</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-500" />
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400" />
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Unverified</span>
        </div>
        <div className="h-px bg-gray-200 dark:bg-zinc-700 my-1" />
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-red-600 bg-transparent" />
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Critical risk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-orange-500 bg-transparent" />
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">High risk</span>
        </div>
      </div>
    </div>
  );
}
