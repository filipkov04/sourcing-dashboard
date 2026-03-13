"use client";

export function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-10 bg-white/90 dark:bg-zinc-900/90 border border-gray-200/60 dark:border-zinc-700/60 rounded-lg px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
        Vehicles
      </p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px]">🚢</span>
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Ocean freight</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]">✈️</span>
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Air freight</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]">🚛</span>
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Road freight</span>
        </div>
        <div className="h-px bg-gray-200 dark:bg-zinc-700 my-1" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Your location</span>
        </div>
      </div>
    </div>
  );
}
