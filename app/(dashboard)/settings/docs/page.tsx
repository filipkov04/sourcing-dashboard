"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  Package,
  Factory,
  BarChart3,
  Users,
  Bell,
  Plug,
  MessageSquare,
  Map,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";

type DocSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: { question: string; answer: string }[];
};

const DOCS: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      {
        question: "What is SourceTrack?",
        answer:
          "SourceTrack is a production tracking dashboard for fashion and manufacturing brands. It helps you monitor factory orders in real-time, track shipments, manage team collaboration, and get alerts when things need attention.",
      },
      {
        question: "How do I create my first project?",
        answer:
          "After logging in, you'll be guided through the onboarding flow. Click 'Create Project' to set up your first project. Projects let you organize factories and orders by season, brand, or category. You can switch between projects using the sidebar dropdown.",
      },
      {
        question: "How do I invite team members?",
        answer:
          "Go to Team → Invite Member. Enter their email address and select a role (Admin, Member, or Viewer). They'll receive an email invitation to join your organization. Admins can manage all data, Members can create and edit, Viewers can only read.",
      },
    ],
  },
  {
    id: "factories",
    title: "Managing Factories",
    icon: <Factory className="h-4 w-4" />,
    items: [
      {
        question: "How do I add a factory?",
        answer:
          "Go to Factories → Add Factory. Enter the factory name, location, and contact details. The factory will appear on your map once geocoded. You can then set up an integration to automatically sync order data.",
      },
      {
        question: "How do I connect a factory's system?",
        answer:
          "Go to the factory detail page → Setup Integration. Choose the connection type (REST API, SFTP, Webhook, or Manual). Enter the credentials and configure field mapping. Check the Setup Guides at /integrations/docs for detailed instructions.",
      },
      {
        question: "Can I track multiple factories?",
        answer:
          "Yes. Add as many factories as you need. Each factory can have its own integration type and sync schedule. The dashboard shows aggregated stats across all factories, and the map shows all factory locations.",
      },
    ],
  },
  {
    id: "orders",
    title: "Order Tracking",
    icon: <Package className="h-4 w-4" />,
    items: [
      {
        question: "How does order status work?",
        answer:
          "Orders progress through stages: Pending → In Progress → Completed → Shipped → Delivered. Each order can have custom production stages (e.g. Fabric Cutting, Sewing, QC). Status auto-updates based on stage completion. If any stage is blocked, the order becomes Disrupted.",
      },
      {
        question: "How do I track a shipment?",
        answer:
          "Add a tracking number to the order (or it's auto-populated from factory integrations). SourceTrack uses 17Track to detect the carrier and fetch live tracking events. The shipment appears on the map with real GPS coordinates when available.",
      },
      {
        question: "What do the priority levels mean?",
        answer:
          "Low = standard timeline. Normal = default priority. High = needs attention, expedite if possible. Urgent = critical deadline, escalate immediately. Priority affects alert urgency and dashboard sorting.",
      },
      {
        question: "Can I drag stages to reorder them?",
        answer:
          "Yes. On the order detail page, you can drag and drop production stages to change their order. You can also add custom stages, update progress percentages, and change stage statuses.",
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard & Analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    items: [
      {
        question: "What do the dashboard stats show?",
        answer:
          "The top stats cards show: Total Orders, Active Orders, Completed, Delayed, and Disrupted counts. Below that: recent alerts, activity feed, order status breakdown, factory performance, product portfolio, upcoming deliveries, and exchange rates.",
      },
      {
        question: "How do I use the analytics page?",
        answer:
          "The Analytics page shows: average lead time, at-risk orders, on-track percentage, bottleneck stages, and stage duration charts. Use this to identify which production stages are slowing things down.",
      },
      {
        question: "What's on the map?",
        answer:
          "The Manufacturer Network map shows factory locations as pins and active shipments as vehicle icons (ship/plane/truck). Click a vehicle to see order details, tracking events, and ETA. The shipment list sidebar lets you browse all tracked orders.",
      },
    ],
  },
  {
    id: "alerts",
    title: "Alerts & Notifications",
    icon: <Bell className="h-4 w-4" />,
    items: [
      {
        question: "What triggers an alert?",
        answer:
          "Alerts are generated for: delayed orders, blocked stages, approaching deadlines, shipment exceptions, customs holds, and delivered orders. Alert severity ranges from INFO to CRITICAL.",
      },
      {
        question: "How do I manage notification preferences?",
        answer:
          "Go to Settings → Notifications. You can toggle email notifications, weekly digest emails, and choose which alert types you want to receive. Each alert type can be enabled/disabled independently.",
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    icon: <Plug className="h-4 w-4" />,
    items: [
      {
        question: "What integration types are supported?",
        answer:
          "REST API (connect to factory ERP), SFTP (download CSV/JSON files), Webhook (factory pushes updates), and Manual (enter data directly). Each type has a detailed setup guide at /integrations/docs.",
      },
      {
        question: "How often does data sync?",
        answer:
          "By default, every 15 minutes. You can change the sync frequency per integration from the integration detail page (Settings → Sync Frequency). You can also trigger an immediate sync with the 'Sync Now' button.",
      },
      {
        question: "Are credentials stored securely?",
        answer:
          "Yes. All credentials are encrypted with AES-256-GCM before storage. The encryption key is stored as an environment variable, never in the database. Credentials are never exposed in API responses — only masked versions are shown.",
      },
    ],
  },
  {
    id: "messaging",
    title: "Messaging & Requests",
    icon: <MessageSquare className="h-4 w-4" />,
    items: [
      {
        question: "How does messaging work?",
        answer:
          "Go to Messages to chat with team members. You can create direct messages, factory-specific conversations, or support threads. Messages support replies, reactions, forwarding, and voice messages.",
      },
      {
        question: "What's the request system?",
        answer:
          "Non-admin users submit requests to add/edit orders or factories. Admins review and approve/reject requests from the Requests page. Each request auto-creates a support conversation for discussion.",
      },
    ],
  },
  {
    id: "team",
    title: "Team Management",
    icon: <Users className="h-4 w-4" />,
    items: [
      {
        question: "What are the user roles?",
        answer:
          "Owner = full control, can delete organization. Admin = manage all data, approve requests, manage team. Member = create/edit data, submit requests. Viewer = read-only access.",
      },
      {
        question: "How do I change someone's role?",
        answer:
          "Go to Team → click a team member → change their role from the dropdown. Only Owners and Admins can change roles. You can't change your own role.",
      },
    ],
  },
];

export default function UserDocsPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>("getting-started");
  const [search, setSearch] = useState("");

  const filteredDocs = search
    ? DOCS.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(search.toLowerCase()) ||
            item.answer.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((section) => section.items.length > 0)
    : DOCS;

  return (
    <div className="relative max-w-3xl mx-auto space-y-6">
      {/* HUD Grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,77,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,21,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/settings")}
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#FF4D15]" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            User Guide
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Everything you need to know about using SourceTrack.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documentation..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF4D15]/20 focus:border-[#FF4D15]/40"
        />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filteredDocs.map((section) => (
          <div
            key={section.id}
            className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpanded((prev) => (prev === section.id ? null : section.id))}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
            >
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                {section.icon}
              </div>
              <span className="flex-1 font-medium text-gray-900 dark:text-white">
                {section.title}
              </span>
              <span className="text-[10px] text-zinc-400 mr-2">{section.items.length} topics</span>
              {expanded === section.id ? (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              )}
            </button>

            {expanded === section.id && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/60">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 border-b border-zinc-50 dark:border-zinc-800/40 last:border-0"
                  >
                    <h3 className="text-sm font-medium text-gray-800 dark:text-zinc-200 mb-1">
                      {item.question}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No results for &quot;{search}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
