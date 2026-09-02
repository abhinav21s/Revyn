"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

export function TopBar({
  title = "Dashboard",
  subtitle = "AI-Driven Bounded Revenue Recovery",
}: {
  title?: string;
  subtitle?: string;
}) {
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <header className="h-16 border-b border-[#1F2937] bg-[#0E1424]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-zinc-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Environment Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>RAZORPAY TEST MODE</span>
        </div>

        {/* Global Safety State Quick Button */}
        <Link
          href="/settings"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            killSwitchActive
              ? "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 animate-pulse"
              : "bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700/60"
          }`}
        >
          {killSwitchActive ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>KILL SWITCH ACTIVE</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safety Guardrails OK</span>
            </>
          )}
        </Link>
      </div>
    </header>
  );
}
