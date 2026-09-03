"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export function TopBar({
  title = "Dashboard",
  subtitle = "AI-Driven Bounded Revenue Recovery",
}: {
  title?: string;
  subtitle?: string;
}) {
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

  return (
    <>
      {/* Kill Switch Active Full-Width Warning Banner */}
      {killSwitchActive && (
        <div className="bg-rose-600/90 border-b border-rose-500 px-6 py-2 flex items-center gap-2.5 text-white text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            EMERGENCY KILL SWITCH IS ACTIVE — All automated recovery operations are halted.{" "}
            <Link href="/settings" className="underline underline-offset-2 hover:text-rose-200">
              Deactivate in Settings →
            </Link>
          </span>
        </div>
      )}

      <header className="h-16 border-b border-[#374151]/60 bg-[#0B0F19]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Page Title */}
        <div className="pl-10 md:pl-0">
          <h1 className="text-[15px] font-bold text-white tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Right: Status Badges */}
        <div className="flex items-center gap-2.5">
          {/* Razorpay Test Mode Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[11px] font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>TEST MODE</span>
          </div>

          {/* Safety Guardrails Status */}
          <Link
            href="/settings"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
              killSwitchActive
                ? "bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse"
                : "bg-emerald-500/8 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15"
            }`}
          >
            {killSwitchActive ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">KILL SWITCH ON</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guardrails OK</span>
              </>
            )}
          </Link>
        </div>
      </header>
    </>
  );
}
