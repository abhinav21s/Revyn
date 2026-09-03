"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setKillSwitchActive(data.settings?.kill_switch === "true");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const navLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Recoveries", href: "/recoveries" },
    { name: "Audit Trail", href: "/audit" },
    { name: "Settings & Safety", href: "/settings" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      {/* Kill Switch Banner */}
      {killSwitchActive && (
        <div className="bg-[#EF4444] text-white px-8 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              EMERGENCY KILL SWITCH IS ACTIVE — All automated recovery operations are paused.
            </span>
          </div>
          <Link href="/settings" className="underline hover:text-white/80">
            Deactivate in Settings →
          </Link>
        </div>
      )}

      {/* ── ROW 1 (Height: 64px, background: --bg-surface-raised (#1A2233), border-bottom: 1px solid --border-subtle) ── */}
      <div className="h-[64px] bg-[#1A2233] border-b border-[rgba(38,48,69,0.4)] px-8 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[20px] font-bold text-[#F4F6FA] tracking-[-0.02em]">
            Revyn<span className="text-[#4F7CFF]">AI</span>
          </span>
        </Link>

        {/* Center: Nav links (gap: 32px between each link, 2px underline 8px below text for active) */}
        <nav className="hidden md:flex items-center gap-8 h-full">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "relative h-full flex items-center text-[14px] font-medium transition-colors",
                  isActive
                    ? "text-[#F4F6FA]"
                    : "text-[#94A3B8] hover:text-[#F4F6FA]"
                )}
              >
                <span>{link.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4F7CFF]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Razorpay Test Mode Only badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-[6px] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] text-[12px] font-medium text-[#F59E0B] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span>Razorpay Test Mode Only</span>
          </div>
        </div>
      </div>

      {/* ── ROW 2 (Height: 44px, background: --bg-canvas (#0B0F19), border-bottom: 1px solid --border-subtle) ── */}
      <div className="h-[44px] bg-[#0B0F19] border-b border-[rgba(38,48,69,0.4)] px-8 flex items-center justify-between">
        {/* Left: Tagline */}
        <span className="text-[13px] text-[#5B6B85] font-normal">
          Revenue Recovery Agent
        </span>

        {/* Right: Policy Engine Active + Guardrails enforced badges */}
        <div className="flex items-center gap-4">
          <div className="px-2.5 py-1 rounded-full bg-[#0F2A1C] border border-[rgba(34,197,94,0.3)] text-[11px] font-medium text-[#22C55E] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span>Policy Engine Active</span>
          </div>
          <div className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-[#121826] border border-[#2E3A52] text-[11px] font-medium text-[#94A3B8]">
            Guardrails enforced · v1.0.0
          </div>
        </div>
      </div>

      {/* Mobile Nav Links Row for screens <768px */}
      <div className="md:hidden flex items-center justify-around bg-[#121826] border-b border-[rgba(38,48,69,0.4)] py-2 px-4 overflow-x-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap",
                isActive
                  ? "bg-[rgba(79,124,255,0.15)] text-[#4F7CFF]"
                  : "text-[#94A3B8]"
              )}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
