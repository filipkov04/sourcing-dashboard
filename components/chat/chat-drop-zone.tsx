"use client";

import { useState, useRef, useCallback } from "react";
import { Paperclip, X, FileText, Image as ImageIcon, Film, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAT_ALLOWED_EXTENSIONS, CHAT_MAX_FILE_SIZE, CHAT_ALLOWED_FILE_TYPES } from "@/lib/chat-constants";

interface ChatDropZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  children: React.ReactNode;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return Film;
  if (type.startsWith("audio/")) return Music;
  return FileText;
}

export function ChatDropZone({ files, onFilesChange, children }: ChatDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current++;
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current === 0) setDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const validFiles = Array.from(newFiles).filter(
        (f) =>
          f.size <= CHAT_MAX_FILE_SIZE &&
          CHAT_ALLOWED_FILE_TYPES.includes(f.type)
      );
      const combined = [...files, ...validFiles].slice(0, 5);
      onFilesChange(combined);
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCountRef.current = 0;
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange]
  );

  return (
    <div
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-[#EB5D2E] bg-[#EB5D2E]/10">
          <p className="text-sm font-medium text-[#EB5D2E]">Drop files here</p>
        </div>
      )}

      {/* File preview row */}
      {files.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-3 py-2 border-b border-gray-100 dark:border-zinc-800">
          {files.map((file, i) => {
            const Icon = getFileIcon(file.type);
            const isImage = file.type.startsWith("image/");
            return (
              <div
                key={`${file.name}-${i}`}
                className="relative flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-2 py-1.5"
              >
                {isImage ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <Icon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                )}
                <div className="max-w-[100px]">
                  <p className="truncate text-[10px] font-medium text-gray-700 dark:text-zinc-300">
                    {file.name}
                  </p>
                  <p className="text-[9px] text-gray-400 dark:text-zinc-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-600 hover:bg-gray-300 dark:hover:bg-zinc-500"
                >
                  <X className="h-2.5 w-2.5 text-gray-600 dark:text-zinc-300" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input area with paperclip */}
      <div className="flex items-end gap-2 px-3 py-2.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
          title="Attach files"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={CHAT_ALLOWED_EXTENSIONS}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {children}
      </div>
    </div>
  );
}
