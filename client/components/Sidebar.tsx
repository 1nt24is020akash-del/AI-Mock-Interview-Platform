"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Award,
  FileText,
  Code2,
  Target,
  TrendingUp,
  BarChart3,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export const SIDEBAR_NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Interview",
    href: "/practice",
    icon: Award,
    badge: "AI",
  },
  {
    name: "Resume",
    href: "/resume",
    icon: FileText,
    badge: null,
  },
  {
    name: "Skill Assessment",
    href: "/skill-assessment",
    icon: Code2,
    badge: null,
  },
  {
    name: "Placement Readiness",
    href: "/readiness",
    icon: Target,
    badge: "Core",
  },
  {
    name: "Progress History",
    href: "/progress-history",
    icon: TrendingUp,
    badge: "Live",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    badge: null,
  },
];

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`w-64 flex-shrink-0 bg-zinc-950/90 border-r border-zinc-800/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between ${className}`}
    >
      <div className="space-y-6">
        {/* Navigation Label */}
        <div className="px-3 pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Navigation Menu
          </p>
        </div>

        {/* Sidebar Links */}
        <nav className="space-y-1.5">
          {SIDEBAR_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-sm shadow-primary/10 font-bold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-primary" : "text-zinc-500"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? "bg-primary text-black"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-zinc-900 to-zinc-950 border border-primary/20 text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-primary font-bold text-[11px]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Placement Engine</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-snug">
          Track interview sessions, resume score, and AI learning roadmaps in real-time.
        </p>
      </div>
    </aside>
  );
}
