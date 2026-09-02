"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  Zap,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  killSwitchActive?: boolean;
}

export function Sidebar({ killSwitchActive = false }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Recoveries", href: "/recoveries", icon: Layers },
    { name: "Audit Trail", href: "/audit", icon: FileSpreadsheet },
    { name: "Settings & Safety", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0E1424] border-r border-[#1F2937] flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Logo & Brand Header */}
        <div className="p-5 border-b border-[#1F2937]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">Revyn</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                Bounded Recovery Agent
              </p>
            </div>
          </div>
        </div>

        {/* Global Safety State Banner */}
        {killSwitchActive ? (
          <div className="mx-3 mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-semibold">KILL SWITCH ACTIVE</span>
          </div>
        ) : (
          <div className="mx-3 mt-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-emerald-400 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-emerald-300">Policy Engine Active</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">v1.0.0</span>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="p-3 space-y-1 mt-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-blue-400" : "text-zinc-400"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Track Information & Links */}
      <div className="p-4 border-t border-[#1F2937] space-y-3">
        <div className="p-3 rounded-xl bg-[#131B2E] border border-[#1F2937] text-xs space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="font-medium text-zinc-300">Razorpay Track 03</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
              Buildathon 26
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Bounded execution, deterministic policy guardrails & immutable audit ledger.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Test Mode Only
          </span>
          <span className="text-zinc-500">Node SDK</span>
        </div>
      </div>
    </aside>
  );
}
