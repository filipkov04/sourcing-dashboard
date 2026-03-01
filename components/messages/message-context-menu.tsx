"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Reply,
  Pencil,
  Trash2,
  Forward,
  Pin,
  PinOff,
  Copy,
  MoreHorizontal,
  MessageSquare,
} from "lucide-react";
import type { Message } from "@/lib/use-conversations";

interface MessageContextMenuProps {
  message: Message;
  isOwn: boolean;
  children: React.ReactNode;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onForward: () => void;
  onPin: () => void;
  onThreadOpen: () => void;
}

export function MessageContextMenu({
  message,
  isOwn,
  children,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onPin,
  onThreadOpen,
}: MessageContextMenuProps) {
  const isDeleted = !!message.deletedAt;
  const isPinned = !!message.pinnedAt;
  const canEdit = isOwn && !isDeleted && message.messageType === "TEXT";
  const canDelete = isOwn && !isDeleted;

  function handleCopy() {
    navigator.clipboard.writeText(message.content).catch(() => {});
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-48">
        <DropdownMenuItem onClick={onReply} disabled={isDeleted}>
          <Reply className="mr-2 h-4 w-4" />
          Reply in thread
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onThreadOpen}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Open thread
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {canEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit message
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onForward} disabled={isDeleted}>
          <Forward className="mr-2 h-4 w-4" />
          Forward
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPin}>
          {isPinned ? (
            <>
              <PinOff className="mr-2 h-4 w-4" />
              Unpin
            </>
          ) : (
            <>
              <Pin className="mr-2 h-4 w-4" />
              Pin message
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy} disabled={isDeleted}>
          <Copy className="mr-2 h-4 w-4" />
          Copy text
        </DropdownMenuItem>
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 focus:text-red-600 dark:text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete message
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
