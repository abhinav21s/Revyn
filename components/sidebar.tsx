"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  Shield,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  killSwitchActive?: boolean;
}

// Clean "R" monogram logo as SVG
function RevynLogo() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect width="36" height="36" rx="10" fill="url(#revyn-gradient)" />
      <path
        d="M10 26V10H20C22.2 10 24 11.8 24 14C24 15.8 22.9 17.3 21.4 17.9L25 26H21.5L18.3 18H13.5V26H10Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path d="M13.5 14.5H19.5C20.3 14.5 21 15.2 21 16C21 16.8 20.3 17.5 19.5 17.5H13.5V14.5Z" fill="url(#revyn-gradient)" />
      <defs>
        <linearGradient id="revyn-gradient" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="0.5" stopColor="#6366F1" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Sidebar({ killSwitchActive = false }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, desc: "Overview & metrics" },
    { name: "Recoveries", href: "/recoveries", icon: Layers, desc: "All payment cases" },
    { name: "Audit Trail", href: "/audit", icon: FileSpreadsheet, desc: "Immutable ledger" },
    { name: "Settings & Safety", href: "/settings", icon: Settings, desc: "Guardrails & kill switch" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* ── Logo & Brand ─────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-[#374151]/60">
        <div className="flex items-center gap-3">
          <RevynLogo />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-white tracking-tight leading-none">
                Revyn
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 leading-none">
                AI
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Revenue Recovery Agent
            </p>
          </div>
        </div>
      </div>

      {/* ── Safety Status Banner ─────────────────────────────── */}
      <div className="px-4 pt-4">
        {killSwitchActive ? (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-rose-300 block">KILL SWITCH ACTIVE</span>
              <span className="text-[10px] text-rose-400/70">All recovery ops paused</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <span className="text-xs font-semibold text-emerald-300 block">Policy Engine Active</span>
              <span className="text-[10px] text-zinc-500">Guardrails enforced · v1.0.0</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 px-3 pt-4 pb-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-blue-600/12 text-blue-400"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              )}
            >
              {/* Active left accent bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-blue-500" />
              )}
              <Icon
                className={cn(
                  "w-[18px] h-[18px] shrink-0",
                  isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              <span className={isActive ? "text-blue-300 font-semibold" : ""}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Footer ────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-[#374151]/60">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Razorpay Test Mode Only</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-[#0B0F19] border-r border-[#374151]/60 shrink-0 h-screen sticky top-0 flex-col overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* ── Mobile Hamburger Button ──────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-[#111827] border border-[#374151] text-zinc-300 shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile Overlay ───────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-[#0B0F19] border-r border-[#374151]/60 overflow-y-auto shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#1F2937] text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
