"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

// Brand Logo Mark: favicon image
function BrandMark() {
  return (
    <img
      src="/icon.svg"
      alt="Revyn Logo"
      className="w-[28px] h-[28px] rounded-[8px] shrink-0 border border-[#1C273E] shadow-sm shadow-[#0084FF]/25"
    />
  );
}

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
    <header className="sticky top-0 z-50 w-full">
      {/* Kill Switch Top Banner (only when active) */}
      {killSwitchActive && (
        <div className="bg-[#DC2626] text-white px-4 md:px-8 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              EMERGENCY KILL SWITCH IS ACTIVE — All autonomous recovery operations are paused.
            </span>
          </div>
          <Link href="/settings" className="underline hover:text-white/80 whitespace-nowrap ml-4">
            Deactivate in Settings →
          </Link>
        </div>
      )}

      {/* ── 64px Header Row (Background: --bg-surface-raised (#1A2233), border-bottom: 1px solid --border-subtle) ── */}
      <div className="h-[64px] bg-[#1A2233] border-b border-[rgba(38,48,69,0.3)] px-4 md:px-8 flex items-center justify-between">
        {/* ZONE A (left): Logo mark + wordmark lockup (28px height, 10px gap, link to /) */}
        <Link href="/" className="flex items-center gap-[10px] shrink-0 h-[28px]">
          <BrandMark />
          <span className="text-[20px] font-bold text-[#F4F6FA] tracking-[-0.02em] leading-none">
            Revyn<span className="text-[#4F7CFF]">AI</span>
          </span>
        </Link>

        {/* ZONE B (center): Nav links (gap: 32px, 14px font-weight: 500, active: 2px underline) */}
        <nav className="hidden md:flex items-center gap-8 h-full">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "relative h-full flex items-center text-[14px] font-medium transition-colors whitespace-nowrap",
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

        {/* ZONE C (right): Status Badges (gap: 12px) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Razorpay Test Mode Only Badge */}
          <div className="px-3 py-1.5 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] text-[12px] font-medium text-[#F59E0B] flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span className="hidden sm:inline">Razorpay Test Mode Only</span>
            <span className="sm:hidden">Test Mode</span>
          </div>

          {/* Policy Engine Active Badge */}
          <div className="px-3 py-1.5 rounded-full bg-[#0F2A1C] border border-[rgba(34,197,94,0.3)] text-[12px] font-medium text-[#22C55E] flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="hidden sm:inline">Policy Engine Active</span>
            <span className="sm:hidden">Engine Active</span>
          </div>
        </div>
      </div>

      {/* ── Sub-header Meta Strip: 40px, --bg-canvas, padding: 0 32px desktop, 0 16px mobile, font-size 12px, color --text-muted ── */}
      <div className="h-[40px] bg-[#0B0F19] border-b border-[rgba(38,48,69,0.3)] px-4 md:px-[32px] flex items-center justify-between" style={{ fontSize: '12px', color: '#5B6B85' }}>
        {/* Left: Tagline */}
        <span>Revenue Recovery Agent</span>
        {/* Right: Guardrails + version */}
        <span>Guardrails enforced · v1.0.0</span>
      </div>

      {/* Mobile navigation tab strip (<768px only) */}
      <div className="md:hidden flex items-center justify-around bg-[#121826] border-b border-[rgba(38,48,69,0.3)] py-2 px-2 overflow-x-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "text-[13px] px-2.5 py-1 rounded-[6px] font-medium whitespace-nowrap",
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
