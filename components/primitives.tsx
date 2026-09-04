"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

/* ── Panel primitive ── */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#1C273E] bg-[#0F1523] shadow-lg shadow-black/40 overflow-hidden min-w-0",
        className
      )}
    >
      {(title || description || action) && (
        <div className="px-6 py-3.5 border-b border-[#1C273E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#090D17]/50">
          <div>
            {title && (
              <h3 className="text-[15px] font-bold tracking-tight text-[#F8FAFC]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-[12px] text-[#94A3B8] mt-0.5 leading-normal">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("p-6", contentClassName)}>{children}</div>
    </div>
  );
}

/* ── MetricCard primitive (Fintech Trading-Desk Quality) ── */
export function MetricCard({
  label,
  value,
  delta,
  deltaType = "neutral",
  icon: Icon,
  iconTint = "blue",
  subtitle,
}: {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaType?: "success" | "warning" | "destructive" | "neutral";
  icon?: LucideIcon;
  iconTint?: "blue" | "emerald" | "amber" | "red";
  subtitle?: React.ReactNode;
}) {
  const tintConfig = {
    blue: {
      bg: "bg-[#0084FF]/12 border-[#0084FF]/30 text-[#0084FF]",
      borderHover: "hover:border-[#0084FF]/50",
    },
    emerald: {
      bg: "bg-emerald-500/12 border-emerald-500/30 text-emerald-400",
      borderHover: "hover:border-emerald-500/50",
    },
    amber: {
      bg: "bg-amber-500/12 border-amber-500/30 text-amber-400",
      borderHover: "hover:border-amber-500/50",
    },
    red: {
      bg: "bg-red-500/12 border-red-500/30 text-red-400",
      borderHover: "hover:border-red-500/50",
    },
  }[iconTint];

  const deltaColors = {
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    destructive: "text-red-400 bg-red-500/10 border-red-500/20",
    neutral: "text-[#94A3B8] bg-[#1C273E]/50 border-[#1C273E]",
  }[deltaType];

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#1C273E] bg-[#0F1523] p-5 shadow-lg shadow-black/40 flex flex-col justify-between transition-all group",
        tintConfig.borderHover
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
          {label}
        </span>
        {Icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm",
              tintConfig.bg
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="my-3">
        <div className="text-[30px] sm:text-[34px] font-black text-[#F8FAFC] tracking-tight font-mono leading-none">
          {value}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px] flex-wrap pt-1 border-t border-[#1C273E]/50">
        {delta && (
          <span
            className={cn(
              "px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border",
              deltaColors
            )}
          >
            {delta}
          </span>
        )}
        {subtitle && (
          <span className="text-[11px] text-[#64748B] font-medium">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

/* ── StatusBadge primitive ── */
export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let config = {
    bg: "bg-slate-500/10 text-slate-400 border-slate-500/25",
    dot: "bg-slate-400",
    label: status,
  };

  if (normalized === "recovered" || normalized === "resolved") {
    config = {
      bg: "bg-emerald-500/12 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
      dot: "bg-emerald-400",
      label: "Recovered",
    };
  } else if (normalized === "in_progress" || normalized === "in progress") {
    config = {
      bg: "bg-[#0084FF]/12 text-[#38BDF8] border-[#0084FF]/30",
      dot: "bg-[#0084FF] animate-pulse",
      label: "In Progress",
    };
  } else if (normalized === "pending") {
    config = {
      bg: "bg-amber-500/12 text-amber-400 border-amber-500/30",
      dot: "bg-amber-400",
      label: "Pending",
    };
  } else if (normalized === "escalated") {
    config = {
      bg: "bg-amber-500/12 text-amber-400 border-amber-500/30",
      dot: "bg-amber-400",
      label: "Escalated",
    };
  } else if (normalized === "stopped" || normalized === "unrecoverable" || normalized === "halted") {
    config = {
      bg: "bg-red-500/12 text-red-400 border-red-500/30",
      dot: "bg-red-400",
      label: normalized === "halted" ? "Halted" : "Stopped",
    };
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0",
        config.bg
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      <span>{config.label}</span>
    </span>
  );
}

/* ── Tag / ActionTag primitive ── */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-[#0084FF]/10 text-[#38BDF8] border border-[#0084FF]/30 shrink-0">
      {children}
    </span>
  );
}

/* ── TestModeChip primitive ── */
export function TestModeChip() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 whitespace-nowrap shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      <span>TEST MODE</span>
    </div>
  );
}

/* ── EmptyState primitive ── */
export function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon?: LucideIcon;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#141C2E] border border-[#1C273E] flex items-center justify-center text-[#64748B] mb-3.5">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <p className="text-[13px] text-[#94A3B8] max-w-sm leading-relaxed">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
