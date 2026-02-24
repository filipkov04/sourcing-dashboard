"use client";

import { FileText, Download, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageAttachment as AttachmentType } from "@/lib/use-conversations";
import { AudioWaveformPlayer } from "@/components/messages/audio-waveform-player";

interface MessageAttachmentProps {
  attachment: AttachmentType;
  publicUrl: string;
  isOwn?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageAttachmentItem({ attachment, publicUrl, isOwn }: MessageAttachmentProps) {
  const isImage = attachment.fileType.startsWith("image/");
  const isVideo = attachment.fileType.startsWith("video/");
  const isAudio = attachment.fileType.startsWith("audio/");

  if (isAudio && publicUrl) {
    return <AudioWaveformPlayer src={publicUrl} fileName={attachment.fileName} isOwn={isOwn} />;
  }

  if (isImage) {
    return (
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 block overflow-hidden rounded-lg"
      >
        <img
          src={publicUrl}
          alt={attachment.fileName}
          className="max-h-48 max-w-full rounded-lg object-cover hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </a>
    );
  }

  if (isVideo) {
    return (
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-3 py-2">
        <Film className="h-5 w-5 shrink-0 text-purple-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-gray-700 dark:text-zinc-300">
            {attachment.fileName}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500">
            {formatFileSize(attachment.fileSize)}
          </p>
        </div>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          title="Download"
        >
          <Download className="h-3.5 w-3.5 text-gray-500 dark:text-zinc-400" />
        </a>
      </div>
    );
  }

  // PDF / doc / other files
  return (
    <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-3 py-2">
      <FileText className="h-5 w-5 shrink-0 text-blue-500" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-700 dark:text-zinc-300">
          {attachment.fileName}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
          {formatFileSize(attachment.fileSize)}
        </p>
      </div>
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
        title="Download"
      >
        <Download className="h-3.5 w-3.5 text-gray-500 dark:text-zinc-400" />
      </a>
    </div>
  );
}

interface MessageAttachmentsProps {
  attachments: AttachmentType[];
  isOwn?: boolean;
}

export function MessageAttachments({ attachments, isOwn }: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-1">
      {attachments.map((att) => (
        <MessageAttachmentItem
          key={att.id}
          attachment={att}
          publicUrl={att.url || ""}
          isOwn={isOwn}
        />
      ))}
    </div>
  );
}
