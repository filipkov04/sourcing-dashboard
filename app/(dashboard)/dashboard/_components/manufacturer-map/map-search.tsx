"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type MapSearchProps = {
  value: string;
  onChange: (query: string) => void;
};

export function MapSearch({ value, onChange }: MapSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  function handleChange(val: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(val);
    }, 200);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-3 left-3 z-10 p-1.5 rounded bg-white/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
        title="Search factories"
      >
        <Search className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
    );
  }

  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white/90 dark:bg-zinc-800/90 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 backdrop-blur-sm w-56">
      <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
      <input
        ref={inputRef}
        id="map-search"
        name="map-search"
        type="text"
        defaultValue={value}
        placeholder="Search name, city, country..."
        onChange={(e) => handleChange(e.target.value)}
        className="flex-1 text-xs bg-transparent border-none outline-none text-gray-800 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
      />
      <button
        onClick={() => {
          setIsOpen(false);
          onChange("");
        }}
        className="p-0.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors"
      >
        <X className="h-3 w-3 text-gray-400" />
      </button>
    </div>
  );
}
