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
    <div className="mb-6">
      {/* Kill Switch Active Full-Width Warning Banner */}
      {killSwitchActive && (
        <div className="mb-4 bg-rose-600/90 border border-rose-500 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-white text-xs font-semibold shadow-lg shadow-rose-950/20">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            EMERGENCY KILL SWITCH IS ACTIVE — All automated recovery operations are halted.{" "}
            <Link href="/settings" className="underline underline-offset-2 hover:text-rose-200">
              Deactivate in Settings →
            </Link>
          </span>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Page Title & Subtitle */}
        <div className="pl-10 md:pl-0">
          <h1 className="text-[18px] font-bold text-white tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-xs text-zinc-400 opacity-70 mt-1 leading-normal">
            {subtitle}
          </p>
        </div>

        {/* Right: Status Badges (exact 28px height, 8px gap) */}
        <div className="flex items-center gap-2 shrink-0 pl-10 sm:pl-0">
          {/* Razorpay Test Mode Badge */}
          <div className="h-[28px] flex items-center gap-1.5 px-3 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[11px] font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>TEST MODE</span>
          </div>

          {/* Safety Guardrails Status */}
          <Link
            href="/settings"
            className={`h-[28px] flex items-center gap-1.5 px-3 rounded-full text-[11px] font-semibold border transition-all ${
              killSwitchActive
                ? "bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse"
                : "bg-emerald-500/8 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15"
            }`}
          >
            {killSwitchActive ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>KILL SWITCH ON</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Guardrails OK</span>
              </>
            )}
          </Link>
        </div>
      </header>
    </div>
  );
}
