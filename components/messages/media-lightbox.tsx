"use client";

import { useEffect, useCallback } from "react";
import { X, Download } from "lucide-react";

interface MediaLightboxProps {
  url: string;
  fileName?: string;
  onClose: () => void;
}

export function MediaLightbox({ url, fileName, onClose }: MediaLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  function handleDownload() {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "image";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="absolute right-16 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
        title="Download"
      >
        <Download className="h-5 w-5" />
      </button>

      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Image */}
      <img
        src={url}
        alt={fileName || "Image"}
        className="relative z-10 max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* File name */}
      {fileName && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5">
          <p className="text-xs text-white/80">{fileName}</p>
        </div>
      )}
    </div>
  );
}
