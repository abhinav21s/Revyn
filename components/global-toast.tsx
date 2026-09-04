"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import type { ToastPayload, ToastType } from "@/lib/toast";

export function GlobalToastContainer() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastPayload>;
      if (!customEvent.detail || !customEvent.detail.message) return;

      const newToast: ToastPayload = {
        id: customEvent.detail.id || Math.random().toString(36).slice(2, 9),
        message: customEvent.detail.message,
        type: customEvent.detail.type || "info",
        duration: customEvent.detail.duration || 4000,
      };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration);
    };

    window.addEventListener("revyn:toast", handleToast);
    return () => window.removeEventListener("revyn:toast", handleToast);
  }, []);

  if (toasts.length === 0) return null;

  const getStyle = (type: ToastType = "info") => {
    switch (type) {
      case "success":
        return {
          bg: "bg-[#062417]/95 border-emerald-500/50 text-emerald-300 shadow-[0_8px_32px_rgba(16,185,129,0.3)]",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
        };
      case "error":
        return {
          bg: "bg-[#2A0808]/95 border-red-500/50 text-red-300 shadow-[0_8px_32px_rgba(239,68,68,0.3)]",
          icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
        };
      case "warning":
        return {
          bg: "bg-[#281804]/95 border-amber-500/50 text-amber-300 shadow-[0_8px_32px_rgba(245,158,11,0.3)]",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
        };
      default:
        return {
          bg: "bg-[#0A1628]/95 border-[#0084FF]/50 text-[#93C5FD] shadow-[0_8px_32px_rgba(0,132,255,0.3)]",
          icon: <Info className="w-5 h-5 text-[#0084FF] shrink-0" />,
        };
    }
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2.5 max-w-xl w-[92vw] sm:w-auto pointer-events-none">
      {toasts.map((toast) => {
        const style = getStyle(toast.type);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-md text-[13px] font-semibold transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-top-4 ${style.bg}`}
          >
            <div className="flex items-center gap-2.5">
              {style.icon}
              <span className="leading-snug text-[13px]">{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors ml-2 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
