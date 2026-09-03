"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  RefreshCw,
  ClipboardList,
  Settings,
  ShieldAlert,
  Power,
  AlertTriangle,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Recoveries", href: "/recoveries", icon: RefreshCw },
  { name: "Audit Trail", href: "/audit", icon: ClipboardList },
  { name: "Settings & Safety", href: "/settings", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [killActive, setKillActive] = useState(false);
  const [confirmKill, setConfirmKill] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setKillActive(d.settings?.kill_switch === "true"))
      .catch(() => {});
  }, []);

  const toggleKill = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "kill_switch", value: killActive ? "false" : "true" }),
      });
      if (res.ok) setKillActive(!killActive);
    } finally {
      setLoading(false);
      setConfirmKill(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#090D17] text-[#F8FAFC]">
      {/* ── Logo Block ── */}
      <div className="p-6 border-b border-[#1C273E]">
        <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
          <div className="w-9 h-9 rounded-lg bg-[#0084FF]/15 border border-[#0084FF]/40 flex items-center justify-center shrink-0 shadow-sm shadow-[#0084FF]/20">
            <span className="text-[18px] font-black text-[#0084FF] leading-none select-none tracking-tight">
              R
            </span>
          </div>
          <div>
            <div className="text-[16px] font-bold tracking-tight text-[#F8FAFC] leading-none">
              Revyn<span className="text-[#0084FF]">AI</span>
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 font-medium">
              Payment Recovery Agent
            </div>
          </div>
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
          Operations
        </div>
        {NAV_ITEMS.map(({ name, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all group",
                isActive
                  ? "bg-[#0084FF]/15 text-[#38BDF8] border border-[#0084FF]/30 font-semibold shadow-sm shadow-[#0084FF]/10"
                  : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#141C2E] border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-[#0084FF]" : "text-[#64748B] group-hover:text-[#94A3B8]"
                )}
              />
              <span>{name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0084FF] shadow-[0_0_8px_#0084FF]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Kill Switch Pinned Card ── */}
      <div className="p-4 border-t border-[#1C273E] bg-[#06080F]/50">
        <div
          className={cn(
            "p-3.5 rounded-xl border transition-all",
            killActive
              ? "bg-red-500/10 border-red-500/40"
              : "bg-[#0F1523] border-[#1C273E]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  killActive ? "bg-red-500 animate-pulse" : "bg-emerald-400"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wider",
                  killActive ? "text-red-400" : "text-emerald-400"
                )}
              >
                {killActive ? "HALTED" : "SYSTEM ACTIVE"}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-normal mb-3">
            {killActive
              ? "Autonomous ops paused. No links dispatched."
              : "Guardrails active · v1.0.0"}
          </p>
          <button
            onClick={() => setConfirmKill(true)}
            disabled={loading}
            className={cn(
              "w-full py-2 px-3 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98",
              killActive
                ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20"
            )}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{killActive ? "Resume Operations" : "Kill Switch"}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmKill && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0F1523] border border-[#1C273E] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-[#F8FAFC]">
                  {killActive ? "Resume Operations?" : "Arm Emergency Kill Switch?"}
                </h4>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">
                  {killActive
                    ? "Allows recovery actions and link creation."
                    : "Halts all automated customer actions instantly."}
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setConfirmKill(false)}
                className="flex-1 py-2 rounded-lg bg-[#141C2E] hover:bg-[#18233A] text-[13px] font-medium text-[#94A3B8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={toggleKill}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[13px] font-bold text-white transition-colors",
                  killActive ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
                )}
              >
                {killActive ? "Yes, Resume" : "Yes, Halt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
