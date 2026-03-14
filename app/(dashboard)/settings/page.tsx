"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  CalendarDays,
  Package,
  Volume2,
  BookOpen,
} from "lucide-react";

interface NotificationPreferences {
  orderStatusEnabled: boolean;
  delayAlertEnabled: boolean;
  disruptionAlertEnabled: boolean;
  weeklyDigestEnabled: boolean;
}

const NOTIFICATION_SETTINGS = [
  {
    key: "orderStatusEnabled" as const,
    label: "Order Status Changes",
    description:
      "Get notified when an order status changes (e.g. In Progress, Completed, Shipped)",
    icon: Package,
    iconColor: "text-blue-500",
  },
  {
    key: "delayAlertEnabled" as const,
    label: "Delay Alerts",
    description:
      "Get notified immediately when an order or stage becomes delayed",
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
  },
  {
    key: "disruptionAlertEnabled" as const,
    label: "Disruption Alerts",
    description:
      "Get notified immediately when production is blocked or disrupted",
    icon: ShieldAlert,
    iconColor: "text-red-500",
  },
  {
    key: "weeklyDigestEnabled" as const,
    label: "Weekly Digest",
    description:
      "Receive a weekly summary of all order activity every Monday morning",
    icon: CalendarDays,
    iconColor: "text-purple-500",
  },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    fetchPreferences();
    // Load sound preference from localStorage
    const stored = localStorage.getItem("alertSoundEnabled");
    setSoundEnabled(stored === "true");
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch("/api/settings/notifications");
      if (!res.ok) {
        console.error("Notification preferences API error:", res.status);
        // Set defaults so the page is still usable
        setPrefs({
          orderStatusEnabled: true,
          delayAlertEnabled: true,
          disruptionAlertEnabled: true,
          weeklyDigestEnabled: true,
        });
        return;
      }
      const result = await res.json();
      if (result.success) {
        setPrefs(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch notification preferences:", err);
      setPrefs({
        orderStatusEnabled: true,
        delayAlertEnabled: true,
        disruptionAlertEnabled: true,
        weeklyDigestEnabled: true,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(key: keyof NotificationPreferences) {
    if (!prefs) return;

    const newValue = !prefs[key];
    // Optimistic update
    setPrefs({ ...prefs, [key]: newValue });
    setSaving(key);

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      });

      const result = await res.json();
      if (!result.success) {
        // Revert on failure
        setPrefs({ ...prefs, [key]: !newValue });
      }
    } catch {
      // Revert on error
      setPrefs({ ...prefs, [key]: !newValue });
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 card-hover-glow">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* HUD Grid Overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,77,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,21,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Manage your notification preferences
          </p>
        </div>
        <Link href="/settings/docs">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <BookOpen className="h-3.5 w-3.5" />
            User Guide
          </button>
        </Link>
      </div>

      {/* Notification Preferences */}
      <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
        Preferences
      </p>
      <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">NTF</span>
            <Bell className="h-5 w-5 text-orange-500" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {NOTIFICATION_SETTINGS.map((setting, index) => {
              const Icon = setting.icon;
              const isEnabled = prefs?.[setting.key] ?? true;
              const isSaving = saving === setting.key;

              return (
                <div key={setting.key}>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Icon className={`h-5 w-5 ${setting.iconColor}`} />
                      </div>
                      <div>
                        <Label
                          htmlFor={setting.key}
                          className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                        >
                          {setting.label}
                        </Label>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={setting.key}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(setting.key)}
                      className="shrink-0 ml-4 data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-zinc-600 dark:data-[state=unchecked]:bg-zinc-700 h-6 w-11"
                    />
                  </div>
                  {index < NOTIFICATION_SETTINGS.length - 1 && (
                    <div className="border-b border-gray-100 dark:border-zinc-800" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sound Effects */}
      <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
        Sound
      </p>
      <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">SFX</span>
            <Volume2 className="h-5 w-5 text-orange-500" />
            Sound Effects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Bell className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <Label
                  htmlFor="soundEffects"
                  className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                >
                  Alert Sound
                </Label>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                  Play a notification chime when new critical alerts arrive
                </p>
              </div>
            </div>
            <Switch
              id="soundEffects"
              checked={soundEnabled}
              onCheckedChange={(checked) => {
                setSoundEnabled(checked);
                localStorage.setItem("alertSoundEnabled", String(checked));
                if (checked) {
                  // Play a preview sound when enabling
                  const ctx = new AudioContext();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.frequency.setValueAtTime(880, ctx.currentTime);
                  osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
                  gain.gain.setValueAtTime(0.15, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 0.3);
                }
              }}
              className="shrink-0 ml-4 data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-zinc-600 dark:data-[state=unchecked]:bg-zinc-700 h-6 w-11"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
