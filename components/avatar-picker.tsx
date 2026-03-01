"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const AVATARS = [
  { id: "avatar-1", src: "/avatars/avatar-1.png" },
  { id: "avatar-2", src: "/avatars/avatar-2.png" },
  { id: "avatar-3", src: "/avatars/avatar-3.png" },
  { id: "avatar-4", src: "/avatars/avatar-4.png" },
  { id: "avatar-5", src: "/avatars/avatar-5.png" },
  { id: "avatar-6", src: "/avatars/avatar-6.png" },
  { id: "avatar-7", src: "/avatars/avatar-7.png" },
];

interface AvatarPickerProps {
  currentAvatarId: string | null;
  onSelect: (avatarId: string | null) => void;
}

export function AvatarPicker({ currentAvatarId, onSelect }: AvatarPickerProps) {
  const [saving, setSaving] = useState<string | null>(null);

  const handleSelect = async (avatarId: string) => {
    const newValue = avatarId === currentAvatarId ? null : avatarId;
    setSaving(avatarId);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId: newValue }),
      });
      if (res.ok) {
        onSelect(newValue);
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-3">
      <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2">Choose your avatar</p>
      <div className="grid grid-cols-4 gap-2">
        {AVATARS.map((avatar) => {
          const isSelected = currentAvatarId === avatar.id;
          return (
            <button
              key={avatar.id}
              onClick={() => handleSelect(avatar.id)}
              disabled={saving !== null}
              className={cn(
                "relative rounded-full overflow-hidden ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 transition-all hover:scale-105",
                isSelected
                  ? "ring-[#FF4D15]"
                  : "ring-transparent hover:ring-gray-300 dark:hover:ring-zinc-600"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar.src}
                alt={`Avatar ${avatar.id.split("-")[1]}`}
                className="h-12 w-12 object-cover"
              />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function UserAvatar({
  avatarId,
  initials,
  size = "md",
  className,
}: {
  avatarId: string | null | undefined;
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  if (avatarId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/avatars/${avatarId}.png`}
        alt="Avatar"
        className={cn("rounded-full object-cover flex-shrink-0", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#FF0F0F] via-[#FF6B15] to-[#FFB21A] font-semibold text-white",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
